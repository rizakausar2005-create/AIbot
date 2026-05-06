import { useEffect, useState } from "react";
import SalesChart from "./SalesChart";
import MonthlyChart from "./MonthlyChart";
import TopProductsChart from "./TopProductsChart";

const API = "http://localhost:3000/api";

function Sidebar({ active, setActive }) {
  const pages = ["Dashboard", "Inventory", "Customer Carts", "Alerts", "Admin Panel"];
  return (
    <div className="sidebar">
      <h1>AuraSync</h1>
      {pages.map(p => (
        <button
          key={p}
          onClick={() => setActive(p)}
          style={{ fontWeight: active === p ? "bold" : "normal",
                   background: active === p ? "#334155" : "transparent",
                   width: "100%", textAlign: "left", padding: "10px 16px",
                   border: "none", color: "white", cursor: "pointer", borderRadius: "6px" }}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function InventoryTable({ data }) {
  return (
    <div className="table-container">
      <h2>Live Inventory</h2>
      <table>
        <thead>
          <tr>
            <th>#</th><th>Product</th><th>Size</th><th>Category</th>
            <th>Total Qty</th><th>Batches</th><th>Earliest Expiry</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => {
            const validExpiries = (item.batches || [])
              .map(b => new Date(b.expiry)).filter(d => !isNaN(d)).sort((a, b) => a - b);
            const earliestExpiry = validExpiries.length > 0
              ? validExpiries[0].toLocaleDateString("en-IN") : "N/A";
            return (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{item.productName || "Unknown"}</td>
                <td>{item.size || "N/A"}</td>
                <td>{item.category || "N/A"}</td>
                <td>{item.totalQuantity ?? 0}</td>
                <td>{item.batches?.length ?? 0}</td>
                <td>{earliestExpiry}</td>
                <td style={{ color: item.status === "In Stock" ? "green"
                    : item.status === "Needs Attention" ? "orange" : "red", fontWeight: "bold" }}>
                  {item.status}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CartsPage({ cartData }) {
  return (
    <div className="table-container">
      <h2>Active Customer Carts</h2>
      {cartData.length === 0 ? <p>No active carts right now.</p> : (
        <table>
          <thead><tr><th>#</th><th>Customer ID</th><th>Item</th><th>Added At</th></tr></thead>
          <tbody>
            {cartData.map((cart, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{cart.customerId?.replace("@c.us", "") || "Unknown"}</td>
                <td>{cart.item}</td>
                <td>{cart.timestamp ? new Date(cart.timestamp).toLocaleString("en-IN") : "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AlertsPage() {
  const [deals, setDeals] = useState([]);
  const [pending, setPending] = useState([]);

  useEffect(() => {
    fetch(`${API}/deals`).then(r => r.json()).then(setDeals).catch(() => {});
    fetch(`${API}/pending`).then(r => r.json()).then(setPending).catch(() => {});
  }, []);

  return (
    <div>
      <div className="table-container">
        <h2>🔥 Flash Deals — Near Expiry</h2>
        {deals.length === 0 ? <p>No active deals.</p> : (
          <table>
            <thead><tr><th>#</th><th>Product</th><th>Batch</th><th>Expiry</th><th>Qty</th><th>Discount</th><th>Days Left</th></tr></thead>
            <tbody>
              {deals.map((d, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{d.item}</td>
                  <td>{d.batchId}</td>
                  <td>{d.expiry}</td>
                  <td>{d.batchQty}</td>
                  <td style={{ color: "red", fontWeight: "bold" }}>{d.suggested_discount}</td>
                  <td style={{ color: d.daysLeft < 30 ? "red" : "orange" }}>{d.daysLeft}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="table-container" style={{ marginTop: "24px" }}>
        <h2>⚠️ Pending — Needs Attention</h2>
        {pending.length === 0 ? <p style={{ color: "green" }}>✅ All items are clean.</p> : (
          <table>
            <thead><tr><th>#</th><th>Product</th><th>Size</th><th>Status</th><th>Flagged Batches</th></tr></thead>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

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

      <div className="table-container">
        <h2>📦 Order History</h2>
        {orders.length === 0 ? <p>No orders yet.</p> : (
          <table>
            <thead>
              <tr><th>#</th><th>Customer</th><th>Total (₹)</th><th>Items</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{order.customerId?.replace("@c.us", "") || "Unknown"}</td>
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
      </div>
    </div>
  );
}

export default function AuraSyncDashboard() {
  const [active, setActive] = useState("Dashboard");
  const [cartData, setCartData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API}/carts`).then(r => r.json()).then(setCartData).catch(() => {});
    fetch(`${API}/inventory`).then(r => r.json()).then(setInventoryData).catch(() => {});
    fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

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

  const renderPage = () => {
    switch (active) {
      case "Inventory": return <InventoryTable data={inventoryData} />;
      case "Customer Carts": return <CartsPage cartData={cartData} />;
      case "Alerts": return <AlertsPage />;
      case "Admin Panel": return <AdminPanel />;
      default: return (
        <div>
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