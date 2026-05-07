import { useEffect, useState } from "react";
import SalesChart from "./SalesChart";
import MonthlyChart from "./MonthlyChart";
import TopProductsChart from "./TopProductsChart";

// ============================================================
// BASE API URL — points to AuraSync WhatsApp bot backend
// ============================================================
const API = "http://localhost:3000/api";

// ============================================================
// SIDEBAR — Navigation between dashboard sections
// Active page is highlighted, clicking switches the view
// ============================================================
function Sidebar({ active, setActive }) {
  const pages = ["Dashboard", "Inventory", "Customer Carts", "Alerts", "Admin Panel"];
  return (
    <div className="sidebar">
      <h1>AuraSync</h1>
      {pages.map(p => (
        <button
          key={p}
          onClick={() => setActive(p)}
          style={{
            fontWeight: active === p ? "bold" : "normal",
            background: active === p ? "#334155" : "transparent",
            width: "100%", textAlign: "left", padding: "10px 16px",
            border: "none", color: "white", cursor: "pointer", borderRadius: "6px"
          }}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// INVENTORY TABLE — Shows all In Stock + Needs Attention items
// # column matches the index used in WhatsApp !update, !inspect, !approve commands
// Expiry parser handles all formats the AI vision model outputs
// ============================================================
function InventoryTable({ data }) {

  // Handles all expiry formats produced by the AI scanner:
  // "11/27" → Nov 2027, "11/2027" → Nov 2027, "Nov 2027" → Nov 2027
  const parseExpiry = (str) => {
    if (!str || str === "Not visible" || str === "N/A") return null;

    // M/YY or MM/YY → 20YY (e.g. 7/26 or 07/26)
    if (/^\d{1,2}\/\d{2}$/.test(str.trim())) {
        const [mm, yy] = str.trim().split("/");
        return new Date(2000 + parseInt(yy), parseInt(mm) - 1);
    }

    // M/YYYY or MM/YYYY (e.g. 7/2026 or 07/2026)
    if (/^\d{1,2}\/\d{4}$/.test(str.trim())) {
        const [mm, yyyy] = str.trim().split("/");
        return new Date(parseInt(yyyy), parseInt(mm) - 1);
    }

    // "Nov 2027" or "November 2027"
    const parsed = new Date(str);
    if (!isNaN(parsed)) return parsed;
    return null;
};

  return (
    <div className="table-container">
      <h2>Live Inventory</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Size</th>
            <th>Category</th>
            <th>Total Qty</th>
            <th>Batches</th>
            <th>Earliest Expiry</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => {
            const validExpiries = (item.batches || [])
              .map(b => parseExpiry(b.expiry))
              .filter(d => d !== null)
              .sort((a, b) => a - b);

            const earliestExpiry = validExpiries.length > 0
              ? validExpiries[0].toLocaleDateString("en-IN", { month: "short", year: "numeric" })
              : "N/A";

            const isExpired = validExpiries.length > 0 && validExpiries[0] < new Date();

            return (
              <tr key={i} style={{ opacity: item.status === "Out of Stock" ? 0.5 : 1 }}>
                {/* Purple # matches the number to use in WhatsApp commands */}
                <td style={{ fontWeight: "bold", color: "#6366f1" }}>#{i + 1}</td>
                <td>{item.productName || "Unknown"}</td>
                <td>{item.size || "N/A"}</td>
                <td>{item.category || "N/A"}</td>
                <td>{item.totalQuantity ?? 0}</td>
                <td>{item.batches?.length ?? 0}</td>
                <td style={{ color: isExpired ? "red" : "inherit" }}>
                  {earliestExpiry} {isExpired ? "⛔ EXPIRED" : ""}
                </td>
                <td style={{
                  color: item.status === "In Stock" ? "green"
                  : item.status === "Needs Attention" ? "orange"
                  : item.status === "Out of Stock" ? "#888"
                  : "red",
                  fontWeight: "bold"
                }}>
                  {item.status}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
        💡 Use <strong>!expired</strong> on WhatsApp to list expired batches. Remove them with <strong>!discard [#]</strong>.
      </p>
      <p style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
        💡 Use the # number above with <strong>!update</strong>, <strong>!inspect</strong>, and <strong>!approve</strong> on WhatsApp.
      </p>
    </div>
  );
}

// ============================================================
// CARTS PAGE — Live view of what customers have selected
// Populated from active_carts MongoDB collection
// Carts are cleared automatically after !checkout
// ============================================================
function CartsPage({ cartData }) {
  return (
    <div className="table-container">
      <h2>Active Customer Carts</h2>
      {cartData.length === 0 ? <p>No active carts right now.</p> : (
        <table>
          <thead>
            <tr><th>#</th><th>Customer ID</th><th>Item</th><th>Added At</th></tr>
          </thead>
          <tbody>
            {cartData.map((cart, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                {/* Strip WhatsApp suffix from customer ID for cleaner display */}
                <td>{cart.customerId?.replace("@c.us", "").replace("@lid", "") || "Unknown"}</td>
                <td>{cart.item}</td>
                <td>{cart.timestamp ? new Date(cart.timestamp).toLocaleString("en-IN") : "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
        💡 These are live customer selections. Customers confirm orders with <strong>!checkout</strong> on WhatsApp.
      </p>
    </div>
  );
}

// ============================================================
// ALERTS PAGE — Flash deals and pending attention items
// Flash deals are auto-generated by syncFlashDeals() in bot.js
// Pending items are products with missing/unverified fields
// ============================================================
function AlertsPage() {
  const [deals, setDeals] = useState([]);
  const [pending, setPending] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);

  useEffect(() => {
    fetch(`${API}/deals`).then(r => r.json()).then(setDeals).catch(() => {});
    fetch(`${API}/pending`).then(r => r.json()).then(setPending).catch(() => {});
  }, []);

  return (
    <div>
      {/* Flash Deals — auto-populated when batch expiry is within 90 days */}
      <div className="table-container">
        <h2>🔥 Flash Deals — Near Expiry</h2>
        {deals.length === 0 ? <p>No active deals.</p> : (
          <table>
            <thead><tr><th>#</th><th>Product</th><th>Batch</th><th>Expiry</th><th>Qty</th><th>Discount</th><th>Urgency</th><th>Months Left</th></tr></thead>
              <tbody>
                {deals.map((d, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{d.item}</td>
                    <td>{d.batchId}</td>
                    <td>{d.expiry}</td>
                    <td>{d.batchQty}</td>
                    <td style={{ color: "red", fontWeight: "bold" }}>{d.suggested_discount}</td>
                    <td>{d.urgency}</td>
                    <td>
                      {(() => {
                        // Your exact logic
                        const barColor = d.monthsLeft > 6 ? "#22c55e" : d.monthsLeft >= 3 ? "#eab308" : "#ef4444";
                        const barWidth = Math.min((d.monthsLeft / 6) * 100, 100) + "%";
                        
                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ fontSize: "12px", color: barColor, fontWeight: "bold" }}>{d.monthsLeft} mo. left</span>
                            {/* The visual progress bar track */}
                            <div style={{ width: "100%", minWidth: "80px", background: "#334155", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
                              {/* The colored fill */}
                              <div style={{ width: barWidth, background: barColor, height: "100%", transition: "width 1s ease-in-out" }}></div>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
        )}
        <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
          💡 To broadcast these deals to all past customers, type <strong>!broadcast deals</strong> on WhatsApp. Enable broadcasts first with <strong>!deals on</strong>.
        </p>
      </div>

      {/* Pending Items — products with flagged batches needing manual correction */}
      <div className="table-container" style={{ marginTop: "24px" }}>
        <h2>⚠️ Pending — Needs Attention</h2>
        {pending.length === 0 ? <p style={{ color: "green" }}>✅ All items are clean.</p> : (
          <table>
            <thead>
              <tr>
  <th>#</th>
  <th>Product</th>
  <th>Size</th>
  <th>Status</th>
  <th>Flagged Batches</th>
  <th>AI Scan</th>
</tr>
            </thead>
            <tbody>
              {pending.map((item, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{item.productName}</td>
                  <td>{item.size}</td>
                  <td style={{ color: "orange", fontWeight: "bold" }}>{item.status}</td>
                  <td>
                    {(item.batches || []).filter(b => b.flagged).map(b => (
                      <div key={b.batchId}>
                        <strong>{b.batchId}</strong>: {b.flaggedFields?.join(", ")}
                      </div>
                    ))}
                  </td>
                  <td>
  <button
    onClick={() => setSelectedScan(item.batches?.[0]?.rawScan)}
    style={{
      background: "#6366f1",
      color: "white",
      border: "none",
      padding: "8px 12px",
      borderRadius: "8px",
      cursor: "pointer"
    }}
  >
    View AI Raw Scan
  </button>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
          💡 Fix missing fields with <strong>!update [#] expiry=Nov2027</strong> or <strong>!update [#] name=ProductName</strong>. Confirm with <strong>!approve [#]</strong>.
        </p>
      </div>
            {selectedScan && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999
          }}
        >
          <div
            style={{
              background: "#111827",
              color: "white",
              padding: "24px",
              borderRadius: "16px",
              width: "60%",
              maxHeight: "80vh",
              overflowY: "auto"
            }}
          >
            <h2>🤖 AI Raw Scan</h2>

            <pre
              style={{
                whiteSpace: "pre-wrap",
                marginTop: "16px",
                color: "#d1d5db"
              }}
            >
              {selectedScan}
            </pre>

            <button
              onClick={() => setSelectedScan(null)}
              style={{
                marginTop: "20px",
                background: "red",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ADMIN PANEL — Full stats overview + order history
// Stats pulled from /api/stats, orders from /api/orders
// Orders sorted by most recent first (handled in bot.js)
// ============================================================
function AdminPanel() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API}/orders`).then(r => r.json()).then(setOrders).catch(() => {});
    fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  return (
    <div>
      <h2>Admin Panel</h2>

      {/* Stats cards — color coded by urgency */}
      {stats && (
        <div className="cards" style={{ marginBottom: "24px" }}>
          {[
            ["Total Products", stats.totalProducts, "white"],
            ["In Stock", stats.inStock, "green"],
            ["Needs Attention", stats.needsAttention, stats.needsAttention > 0 ? "orange" : "white"],
            ["Out of Stock", stats.outOfStock, stats.outOfStock > 0 ? "red" : "white"],
            ["Deal Alerts", stats.dealAlerts, stats.dealAlerts > 0 ? "red" : "white"],
            ["Total Orders", stats.totalOrders, "white"],
          ].map(([label, val, color]) => (
            <div className="card" key={label}>
              <h3>{label}</h3>
              <p style={{ color, fontSize: "2rem", fontWeight: "bold" }}>{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Order history — most recent first */}
      <div className="table-container">
        <h2>📦 Order History</h2>
        {orders.length === 0 ? <p>No orders yet.</p> : (
          <table>
            <thead>
              <tr>
                <th>#</th><th>Customer</th><th>Total (₹)</th>
                <th>Items</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{order.customerId?.replace("@c.us", "").replace("@lid", "") || "Unknown"}</td>
                  <td>₹{order.totalValue}</td>
                  <td>{order.items?.length ?? 0}</td>
                  <td style={{ color: order.status === "Pending Fulfillment" ? "orange" : "green" }}>
                    {order.status}
                  </td>
                  <td>{order.orderDate ? new Date(order.orderDate).toLocaleString("en-IN") : "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
          💡 Orders placed via <strong>!checkout</strong>. Contact customer directly on WhatsApp to confirm fulfillment.
        </p>
      </div>
    </div>
    
  );
}

// ============================================================
// MAIN DASHBOARD — Root component
// Fetches shared data (inventory, carts, stats) every 30 seconds
// Passes data down to child pages as props to avoid duplicate fetches
// ============================================================
export default function AuraSyncDashboard() {
  const [active, setActive] = useState("Dashboard");
  const [cartData, setCartData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [stats, setStats] = useState(null);

  // Auto-refresh every 30 seconds — keeps dashboard live without hammering the server
  useEffect(() => {
    const fetchAll = () => {
      fetch(`${API}/carts`).then(r => r.json()).then(setCartData).catch(() => {});
      fetch(`${API}/inventory`).then(r => r.json()).then(setInventoryData).catch(() => {});
      fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(() => {});
    };
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  // Cart data aggregations for charts on Dashboard home
  const getWeeklySales = () => {
    const days = { Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0, Sun:0 };
    cartData.forEach(item => {
      if (!item.timestamp) return;
      const day = new Date(item.timestamp).toLocaleDateString("en-US", { weekday: "short" });
      if (days[day] !== undefined) days[day]++;
    });
    return Object.keys(days).map(day => ({ date: day, sales: days[day] }));
  };

  const getMonthlySales = () => {
    const months = { Jan:0,Feb:0,Mar:0,Apr:0,May:0,Jun:0,Jul:0,Aug:0,Sep:0,Oct:0,Nov:0,Dec:0 };
    cartData.forEach(item => {
      if (!item.timestamp) return;
      const month = new Date(item.timestamp).toLocaleDateString("en-US", { month: "short" });
      if (months[month] !== undefined) months[month]++;
    });
    return Object.keys(months).map(m => ({ month: m, sales: months[m] }));
  };

  const getTopProducts = () => {
    const count = {};
    cartData.forEach(item => { count[item.item] = (count[item.item] || 0) + 1; });
    return Object.keys(count).map(key => ({ name: key, sales: count[key] }));
  };
  

  const getActivityFeed = () => {
    const feed = [];
    
    // 1. Grab AI Scans
    inventoryData.forEach(item => {
      (item.batches || []).forEach(batch => {
        if (batch.scannedAt) {
          feed.push({
            type: "scan",
            time: new Date(batch.scannedAt),
            text: `🤖 AI logged ${item.productName} — Batch ${batch.batchId}`
          });
        }
      });
    });

    // 2. Grab Customer Carts
    cartData.forEach(cart => {
      if (cart.timestamp) {
        // Clean up customer ID and item name for the UI
        const cleanId = cart.customerId?.replace("@c.us", "").replace("@lid", "") || "Unknown";
        const cleanItem = cart.item?.split('|')[0].replace('📦 *Product:*', '').trim();
        feed.push({
          type: "cart",
          time: new Date(cart.timestamp),
          text: `🛒 Customer ${cleanId} added ${cleanItem.slice(0, 30)}...`
        });
      }
    });

    // Sort by newest first and grab the top 5
    return feed.sort((a, b) => b.time - a.time).slice(0, 5);
  };

  // Route to the correct page based on sidebar selection
  const renderPage = () => {
    switch (active) {
      case "Inventory":      return <InventoryTable data={inventoryData} />;
      case "Customer Carts": return <CartsPage cartData={cartData} />;
      case "Alerts":         return <AlertsPage />;
      case "Admin Panel":    return <AdminPanel />;
      default: return (
        <div>
          {/* Last refreshed timestamp — updates every render cycle */}
          <p style={{ fontSize: "12px", color: "#888", marginBottom: "16px" }}>
            🕒 Last refreshed: {new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>
          <div className="cards">
            {[
              ["Total Products", stats?.totalProducts, "inherit"],
              ["In Stock", stats?.inStock, "green"],
              ["Needs Attention", stats?.needsAttention, stats?.needsAttention > 0 ? "orange" : "inherit"],
              ["Deal Alerts", stats?.dealAlerts, stats?.dealAlerts > 0 ? "red" : "inherit"],
              ["Total Orders", stats?.totalOrders, "inherit"],
            ].map(([label, val, color]) => (
              <div className="card" key={label}>
                <h3>{label}</h3>
                <p style={{ color, fontSize: "2rem", fontWeight: "bold" }}>{val ?? "..."}</p>
              </div>
            ))}
          </div>
          <SalesChart data={getWeeklySales()} />
          <MonthlyChart data={getMonthlySales()} />
          <TopProductsChart data={getTopProducts()} />

            <div
  style={{
    marginTop: "24px",
    background: "#111827",
    padding: "20px",
    borderRadius: "16px",
    boxShadow: "0 0 20px rgba(99,102,241,0.3)"
  }}
>
  <h2
    style={{
      color: "white",
      marginBottom: "16px"
    }}
  >
    ⚡ Live AI Activity Feed
  </h2>

  {getActivityFeed().length === 0 ? (
    <p style={{ color: "#9ca3af" }}>
      No recent activity yet...
    </p>
  ) : (
    getActivityFeed().map((activity, index) => (
      <div
        key={index}
        style={{
          background: "#1f2937",
          padding: "14px",
          borderRadius: "12px",
          marginBottom: "12px",
          borderLeft: "5px solid #6366f1",
          color: "white"
        }}
      >
        <p style={{ margin: 0 }}>
          {activity.text}
        </p>

        <small style={{ color: "#9ca3af" }}>
          {activity.time.toLocaleString("en-IN")}
        </small>
      </div>
    ))
  )}
</div>
          <InventoryTable data={inventoryData} />
        </div>
      );
    }
  };

  return (
    <div className="container">
      <Sidebar active={active} setActive={setActive} />
      <div className="main">
        <h1>Warehouse Dashboard</h1>
        <p>Admin</p>
        {renderPage()}
      </div>
    </div>
  );
}
