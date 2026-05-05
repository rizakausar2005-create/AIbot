import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function TopProductsChart({ data }) {
  return (
    <div style={{ background: "white", padding: "20px", borderRadius: "10px", marginTop: "20px" }}>
      <h3>Top Selling Items</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="sales" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}