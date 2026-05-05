import { useEffect, useState } from "react";
import SalesChart from "./SalesChart";
import MonthlyChart from "./MonthlyChart";
import TopProductsChart from "./TopProductsChart";
function Sidebar() {
  return (
    <div className="sidebar">
      <h1>AuraSync</h1>
      <button>Dashboard</button>
      <button>Inventory</button>
      <button>Customer Carts</button>
      <button>Alerts</button>
      <button>Settings</button>
    </div>
  );
}

function InventoryTable() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/inventory")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  return (
    <div className="table-container">
      <h2>Live Inventory</h2>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Status</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i}>
              <td>{item.item_details}</td>
              <td>{item.status || "Active"}</td>
              <td>{item.timestamp || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AuraSyncDashboard() {
  const [cartData, setCartData] = useState([]);

useEffect(() => {
  fetch("http://localhost:3000/api/carts")
    .then(res => res.json())
    .then(data => setCartData(data))
    .catch(err => console.error(err));
}, []);
const getTopProducts = () => {
  const count = {};

  cartData.forEach((item) => {
    const name = item.item;
    count[name] = (count[name] || 0) + 1;
  });

  return Object.keys(count).map((key) => ({
    name: key,
    sales: count[key],
  }));
};
const getWeeklySales = () => {
  const days = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };

  cartData.forEach((item) => {
    if (!item.timestamp) return;

    const date = new Date(item.timestamp);

    const day = date.toLocaleDateString("en-US", {
      weekday: "short",
    });

    if (days[day] !== undefined) {
      days[day]++;
    }
  });

  return Object.keys(days).map((day) => ({
    date: day,
    sales: days[day],
  }));
};
const getMonthlySales = () => {
  const months = {
    Jan: 0,
    Feb: 0,
    Mar: 0,
    Apr: 0,
    May: 0,
    Jun: 0,
    Jul: 0,
    Aug: 0,
    Sep: 0,
    Oct: 0,
    Nov: 0,
    Dec: 0,
  };

  cartData.forEach((item) => {
    if (!item.timestamp) return;

    const date = new Date(item.timestamp);

    const month = date.toLocaleDateString("en-US", {
      month: "short",
    });

    if (months[month] !== undefined) {
      months[month]++;
    }
  });

  return Object.keys(months).map((m) => ({
    month: m,
    sales: months[m],
  }));
};
    
  return (
    <div className="container">
      <Sidebar />

      <div className="main">
        <h1>Warehouse Dashboard</h1>
        <p>Admin</p>

        <div className="cards">
          <div className="card">
            <h3>Total Products</h3>
            <p>120</p>
          </div>

          <div className="card">
            <h3>Low Stock</h3>
            <p>8</p>
          </div>

          <div className="card">
            <h3>Active Orders</h3>
            <p>15</p>
          </div>
        </div>
        <SalesChart data={getWeeklySales()} />
        <MonthlyChart data={getMonthlySales()} />
        <TopProductsChart data={getTopProducts()} />

        <InventoryTable />
      </div>
    </div>
  );
}