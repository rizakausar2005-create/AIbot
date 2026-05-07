import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  LineChart, Line, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend
} from 'recharts';

<<<<<<< HEAD
const API = "http://localhost:3000/api";
=======
// ============================================================
// BASE API URL — points to AuraSync WhatsApp bot backend
// ============================================================
const API = "http://172.19.1.213:3000/api";
>>>>>>> 59b5e7d8055aa0c4846e1485fef4ea2554c9894b

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

function InventoryTable({ data }) {
  const parseExpiry = (str) => {
    if (!str || str === "Not visible" || str === "N/A") return null;
    if (/^\d{1,2}\/\d{2}$/.test(str.trim())) {
      const [mm, yy] = str.trim().split("/");
      return new Date(2000 + parseInt(yy), parseInt(mm) - 1);
    }
    if (/^\d{1,2}\/\d{4}$/.test(str.trim())) {
      const [mm, yyyy] = str.trim().split("/");
      return new Date(parseInt(yyyy), parseInt(mm) - 1);
    }
    const parsed = new Date(str);
    return !isNaN(parsed) ? parsed : null;
  };

  return (
    <div className="table-container">
      <h2>Live Inventory</h2>
      <table>
        <thead>
          <tr>
            <th>#</th><th>Product</th><th>Size</th><th>Category</th>
            <th>Qty</th><th>Batches</th><th>Expiry</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => {
            const validExpiries = (item.batches || [])
              .map(b => parseExpiry(b.expiry))
              .filter(Boolean)
              .sort((a, b) => a - b);
            
            const earliest = validExpiries[0];
            const isExpired = earliest && earliest < new Date();

            return (
              <tr key={i}>
                <td style={{ fontWeight: "bold", color: "#6366f1" }}>#{i + 1}</td>
                <td>{item.productName || item.item_details || "Unknown"}</td>
                <td>{item.size || "N/A"}</td>
                <td>{item.category || "N/A"}</td>
                <td>{item.totalQuantity ?? 0}</td>
                <td>{item.batches?.length ?? 0}</td>
                <td style={{ color: isExpired ? "red" : undefined }}>
                  {earliest ? earliest.toLocaleDateString("en-IN") : "N/A"}
                  {isExpired && " ⛔"}
                </td>
                <td style={{
                  color: item.status === "In Stock" ? "green" 
                    : item.status === "Needs Attention" ? "orange" 
                    : "#888",
                  fontWeight: "bold"
                }}>
                  {item.status || "Unknown"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
        💡 Use # with <code>!update [#]</code> <code>!inspect [#]</code> on WhatsApp
      </p>
    </div>
  );
}

function CartsPage({ cartData }) {
  return (
    <div className="table-container">
      <h2>Active Customer Carts</h2>
      {cartData.length === 0 ? (
        <p>No active carts</p>
      ) : (
        <table>
          <thead><tr><th>#</th><th>Customer</th><th>Item</th><th>Added</th></tr></thead>
          <tbody>
            {cartData.map((cart, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{cart.customerId?.replace(/[@.].*/, "") || "Unknown"}</td>
                <td>{cart.item}</td>
                <td>{cart.timestamp ? new Date(cart.timestamp).toLocaleTimeString() : "N/A"}</td>
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
  const [selectedScan, setSelectedScan] = useState(null);

  useEffect(() => {
    fetch(`${API}/deals`).then(r => r.json()).then(setDeals).catch(() => {});
    fetch(`${API}/pending`).then(r => r.json()).then(setPending).catch(() => {});
  }, []);

  return (
    <>
      <div>
        {/* FLASH DEALS - FEFO HEALTH BARS */}
        <div className="table-container">
          <h2>🔥 Flash Deals</h2>
          {deals.length === 0 ? (
            <p>No flash deals</p>
          ) : (
            <table>
              <thead>
                <tr><th>#</th><th>Product</th><th>Expiry</th><th>Qty</th><th>Months Left</th></tr>
              </thead>
              <tbody>
                {deals.map((deal, i) => {
                  const months = deal.monthsLeft || 0;
                  const color = months > 6 ? "#22c55e" : months > 3 ? "#f59e0b" : "#ef4444";
                  const width = Math.max(10, (months / 8) * 100) + "%";
                  
                  return (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{deal.item}</td>
                      <td>{deal.expiry}</td>
                      <td>{deal.batchQty}</td>
                      <td>
                        <div style={{display: "flex", gap: "8px", alignItems: "center"}}>
                          <span style={{color, fontWeight: "bold"}}>{months} mo</span>
                          <div style={{width: "60px", height: "8px", background: "#e5e7eb", borderRadius: "4px"}}>
                            <div style={{width, height: "100%", background: color, borderRadius: "4px"}}/>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* PENDING ITEMS - AI RAW SCAN */}
        <div className="table-container" style={{marginTop: "24px"}}>
          <h2>⚠️ Needs Attention</h2>
          {pending.length === 0 ? (
            <p style={{color: "#10b981"}}>✅ All good!</p>
          ) : (
            <table>
              <thead><tr><th>#</th><th>Product</th><th>Issues</th><th>Action</th></tr></thead>
              <tbody>
                {pending.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{item.productName}</td>
                    <td>
                      {(item.batches || []).filter(b => b.flagged).map(b => 
                        <div key={b.batchId}>{b.batchId}: {b.flaggedFields?.join(", ")}</div>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedScan(item.batches?.[0]?.rawScan)}
                        style={{
                          background: "#6366f1", color: "white", border: "none",
                          padding: "6px 12px", borderRadius: "6px", cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        🔍 AI Scan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* AI RAW SCAN MODAL */}
      {selectedScan && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "#1f2937", color: "white", padding: "30px",
            borderRadius: "16px", maxWidth: "90vw", maxHeight: "90vh", overflow: "auto"
          }}>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "20px"}}>
              <h3 style={{margin: 0}}>🤖 Raw AI Output</h3>
              <button
                onClick={() => setSelectedScan(null)}
                style={{background: "#ef4444", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer"}}
              >
                ✕ Close
              </button>
            </div>
            <pre style={{whiteSpace: "pre-wrap", background: "#111827", padding: "20px", borderRadius: "8px", margin: 0}}>
              {selectedScan}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}

function AdminPanel() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${API}/orders`).then(r => r.json()).then(setOrders).catch(() => {});
    fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const broadcastDeals = async () => {
    setBroadcasting(true);
    setMessage("");
    try {
      const res = await fetch(`${API}/trigger-broadcast`, { method: "POST" });
      const data = await res.json();
      setMessage(res.ok ? "✅ Broadcast sent to all customers!" : `❌ ${data.error}`);
    } catch {
      setMessage("❌ Backend offline");
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div>
      <h2>Admin Panel</h2>

      {/* GOD MODE BROADCAST BUTTON */}
      <div style={{textAlign: "center", marginBottom: "30px", padding: "20px", background: "#f8fafc", borderRadius: "12px"}}>
        <button
          onClick={broadcastDeals}
          disabled={broadcasting}
          style={{
            background: broadcasting ? "#9ca3af" : "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
            color: "white", border: "none", padding: "18px 36px", borderRadius: "16px",
            fontSize: "18px", fontWeight: "bold", cursor: "pointer",
            boxShadow: "0 10px 25px rgba(139, 92, 246, 0.3)",
            minWidth: "320px"
          }}
        >
          {broadcasting ? "📡 Broadcasting..." : "🚀 SEND FLASH DEALS TO ALL WHATSAPP"}
        </button>
        {message && (
          <p style={{
            marginTop: "16px", fontSize: "16px", fontWeight: "600",
            color: message.includes("✅") ? "#059669" : "#dc2626"
          }}>
            {message}
          </p>
        )}
      </div>

      {/* STATS CARDS */}
      {stats && (
        <div className="cards">
          {[
            { label: "Total Products", value: stats.totalProducts ?? 0, color: "#3b82f6" },
            { label: "In Stock", value: stats.inStock ?? 0, color: "#10b981" },
            { label: "Needs Attention", value: stats.needsAttention ?? 0, color: "#f59e0b" },
            { label: "Out of Stock", value: stats.outOfStock ?? 0, color: "#ef4444" },
            { label: "Deal Alerts", value: stats.dealAlerts ?? 0, color: "#8b5cf6" },
            { label: "Total Orders", value: stats.totalOrders ?? 0, color: "#6b7280" },
          ].map(({ label, value, color }, i) => (
            <div className="card" key={i}>
              <h3>{label}</h3>
              <p style={{ color, fontSize: "2rem", fontWeight: "bold" }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ORDERS TABLE */}
      <div className="table-container">
        <h2>Recent Orders</h2>
        {orders.length === 0 ? (
          <p>Use <code>!checkout</code> on WhatsApp to create orders</p>
        ) : (
          <table>
            <thead><tr><th>#</th><th>Customer</th><th>Value</th><th>Items</th><th>Status</th></tr></thead>
            <tbody>
              {orders.slice(0, 8).map((order, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{order.customerId?.replace(/[@.].*/, "") || "Unknown"}</td>
                  <td>₹{order.totalValue ?? 0}</td>
                  <td>{order.items?.length ?? 0}</td>
                  <td style={{color: order.status === "Pending" ? "#f59e0b" : "#10b981"}}>
                    {order.status ?? "Pending"}
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

export default function AuraSyncDashboard() {
  const [active, setActive] = useState("Dashboard");
  const [cartData, setCartData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [carts, inventory, statsData] = await Promise.all([
          fetch(`${API}/carts`).then(r => r.json()).catch(() => []),
          fetch(`${API}/inventory`).then(r => r.json()).catch(() => []),
          fetch(`${API}/stats`).then(r => r.json()).catch(() => ({}))
        ]);
        setCartData(carts);
        setInventoryData(inventory);
        setStats(statsData);
      } catch (e) {
        // Backend offline - demo mode
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

<<<<<<< HEAD
=======
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

>>>>>>> 59b5e7d8055aa0c4846e1485fef4ea2554c9894b
  const getActivityFeed = () => {
    const activities = [];

    // Recent scans
    inventoryData.slice(0, 3).forEach(item => {
      if (item.timestamp) {
        activities.push({
          text: `🤖 Scanned ${item.productName || item.item_details}`,
          time: new Date(item.timestamp)
        });
      }
    });

    // Recent carts  
    cartData.slice(0, 3).forEach(cart => {
      if (cart.timestamp && cart.item) {
        activities.push({
          text: `🛒 ${cart.customerId?.split("@")[0] || "?"} added ${cart.item}`,
          time: new Date(cart.timestamp)
        });
      }
    });

    return activities.sort((a, b) => b.time - a.time);
  };

  const renderPage = () => {
    switch (active) {
      case "Inventory": return <InventoryTable data={inventoryData} />;
      case "Customer Carts": return <CartsPage cartData={cartData} />;
      case "Alerts": return <AlertsPage />;
      case "Admin Panel": return <AdminPanel />;
      
      default:
        return (
          <div>
            {/* LIVE ACTIVITY FEED */}
            <div style={{
              background: "#f8fafc", padding: "24px", borderRadius: "12px", marginBottom: "24px",
              border: "1px solid #e5e7eb"
            }}>
              <h3 style={{margin: "0 0 16px 0", color: "#374151"}}>⚡ Live Activity</h3>
              {getActivityFeed().length === 0 ? (
                <p style={{color: "#9ca3af", fontStyle: "italic"}}>No activity yet</p>
              ) : (
                getActivityFeed().map((activity, i) => (
                  <div key={i} style={{
                    padding: "12px", background: "white", borderRadius: "8px",
                    marginBottom: "8px", borderLeft: "3px solid #6366f1"
                  }}>
                    <div style={{fontSize: "14px"}}>{activity.text}</div>
                    <div style={{fontSize: "12px", color: "#9ca3af"}}>
                      {activity.time.toLocaleString("en-IN")}
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* 🃏 TOP STATS CARDS */}
            <div className="cards">
              <div className="card">
                <h3>Total Products</h3>
                <p style={{color: "#3b82f6", fontSize: "2rem"}}>{inventoryData.length}</p>
              </div>
              <div className="card">
                <h3>Active Carts</h3>
                <p style={{color: "#10b981", fontSize: "2rem"}}>{cartData.length}</p>
              </div>
              <div className="card">
                <h3>Deal Alerts</h3>
                <p style={{color: "#f59e0b", fontSize: "2rem"}}>{stats.dealAlerts ?? 0}</p>
              </div>
              <div className="card">
                <h3>Total Orders</h3>
                <p style={{color: "#6b7280", fontSize: "2rem"}}>{stats.totalOrders ?? 0}</p>
              </div>
            </div>

            {/* 🔥 ROW 1: WEEKLY SALES & TOP PRODUCTS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", margin: "30px 0" }}>
              
              {/* 📈 WEEKLY SALES (Real Data) */}
              <div className="table-container">
                <h3 style={{ marginBottom: "20px", color: "#1f2937" }}>📈 Weekly Sales</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => ({
                    day,
                    sales: cartData.filter(c => new Date(c.timestamp).getDay() === (index + 1) % 7).length
                  }))}>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: "12px", color: "#fff" }} />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 🥇 TOP PRODUCTS (Real Data) */}
              <div className="table-container">
                <h3 style={{ marginBottom: "20px", color: "#1f2937" }}>🥇 Top Products</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        inventoryData.reduce((acc, item) => {
                          const name = item.productName || "Other";
                          acc[name] = (acc[name] || 0) + (item.totalQuantity || 0);
                          return acc;
                        }, {})
                      ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value], i) => ({
                        name, value, fill: ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#6b7280"][i % 5]
                      }))}
                      cx="50%" cy="50%" outerRadius={80} dataKey="value" label
                    >
                      {inventoryData.map((_, index) => (
                        <Cell key={index} fill={["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#6b7280"][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 📊 ROW 2: BUSINESS PULSE (Multi-Metric) */}
            <div className="table-container" style={{ marginBottom: "30px" }}>
              <h3 style={{ marginBottom: "20px", color: "#1f2937" }}>📊 Business Pulse</h3>
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginBottom: '20px' }}>
                <div><small>Total Orders</small><h2>{stats.totalOrders || 0}</h2></div>
                <div><small>Needs Attention</small><h2 style={{color: '#ef4444'}}>{stats.needsAttention || 0}</h2></div>
                <div><small>Deal Alerts</small><h2 style={{color: '#f59e0b'}}>{stats.dealAlerts || 0}</h2></div>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={[
                  { name: 'Inventory', val: inventoryData.length },
                  { name: 'Carts', val: cartData.length },
                  { name: 'Orders', val: stats.totalOrders || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis hide />
                  <Tooltip />
                  <Line type="monotone" dataKey="val" stroke="#6366f1" strokeWidth={4} dot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 📉 ROW 3: MONTHLY REVENUE TREND */}
            <div className="table-container" style={{ marginBottom: "30px" }}>
              <h3 style={{ marginBottom: "20px", color: "#1f2937" }}>📈 Monthly Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[{ month: "Live", revenue: (stats.totalOrders || 0) * 100 }]}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: "#1e40af", borderRadius: "12px", color: "white" }} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={true} />
                </LineChart>
              </ResponsiveContainer>
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