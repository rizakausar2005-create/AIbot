import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function MonthlyChart({ data }) {
  return (
    <div style={{ background: "white", padding: "20px", borderRadius: "10px", marginTop: "20px" }}>
      <h3>Monthly Sales</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="sales" fill="#16a34a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}