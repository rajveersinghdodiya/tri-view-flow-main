import { PanelLayout } from "@/components/PanelLayout";
import { PageHeader, StatCard } from "@/components/DashboardWidgets";
import { Wallet, Users, Car, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminAnalytics() {
  const [stats, setStats] = useState({ bookings: 0, drivers: 0, customers: 0, revenue: 0 });
  const [tripTypeData, setTripTypeData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: bookings } = await supabase.from("bookings").select("*");
      const { data: drivers } = await supabase.from("user_roles").select("id").eq("role", "driver");
      const { data: customers } = await supabase.from("user_roles").select("id").eq("role", "customer");

      const allBookings = bookings || [];
      const totalRevenue = allBookings.reduce((sum, b) => sum + (Number(b.fare) || 0), 0);
      setStats({ bookings: allBookings.length, drivers: drivers?.length || 0, customers: customers?.length || 0, revenue: totalRevenue });

      // Trip type breakdown
      const types: Record<string, number> = {};
      allBookings.forEach(b => { types[b.trip_type] = (types[b.trip_type] || 0) + 1; });
      const colors = ["hsl(var(--primary))", "hsl(var(--rapido-info))", "hsl(var(--rapido-success))"];
      setTripTypeData(Object.entries(types).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] })));

      // Monthly revenue
      const months: Record<string, number> = {};
      allBookings.forEach(b => {
        const m = new Date(b.created_at).toLocaleString("default", { month: "short" });
        months[m] = (months[m] || 0) + (Number(b.fare) || 0);
      });
      setMonthlyData(Object.entries(months).map(([month, revenue]) => ({ month, revenue })));
    };
    fetchData();
  }, []);

  return (
    <PanelLayout panel="admin">
      <PageHeader title="Analytics" subtitle="Platform performance and growth metrics" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={Wallet} variant="primary" />
          <StatCard title="Total Bookings" value={String(stats.bookings)} icon={Car} />
          <StatCard title="Drivers" value={String(stats.drivers)} icon={Users} />
          <StatCard title="Vehicle Owners" value={String(stats.customers)} icon={TrendingUp} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-5 shadow-card">
            <h3 className="font-display font-semibold mb-4">Revenue by Month</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {tripTypeData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl p-5 shadow-card">
              <h3 className="font-display font-semibold mb-4">Trip Type Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={tripTypeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                    {tripTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      </div>
    </PanelLayout>
  );
}
