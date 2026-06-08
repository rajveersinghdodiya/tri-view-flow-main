import { PanelLayout } from "@/components/PanelLayout";
import { PageHeader, StatCard } from "@/components/DashboardWidgets";
import { Users, Car, Wallet, TrendingUp, AlertTriangle, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ bookings: 0, drivers: 0, customers: 0, revenue: 0 });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  // Fix scrolling for dashboard content
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: bookings } = await supabase.from("bookings").select("id, fare, status, created_at");
      const { data: drivers } = await supabase.from("user_roles").select("id").eq("role", "driver");
      const { data: customers } = await supabase.from("user_roles").select("id").eq("role", "customer");
      
      const totalRevenue = (bookings || []).reduce((sum, b) => sum + (Number(b.fare) || 0), 0);
      setStats({
        bookings: bookings?.length || 0,
        drivers: drivers?.length || 0,
        customers: customers?.length || 0,
        revenue: totalRevenue,
      });
      setRecentBookings((bookings || []).slice(0, 7));
    };
    fetchStats();
  }, []);

  // Chart data from recent bookings
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const revenueByDay = dayNames.map(day => ({
    day,
    revenue: recentBookings
      .filter(b => dayNames[new Date(b.created_at).getDay()] === day)
      .reduce((sum, b) => sum + (Number(b.fare) || 0), 0),
  }));

  return (
    <PanelLayout panel="admin">
      <PageHeader title="Admin Dashboard" subtitle="Platform operations overview">
        <button className="px-4 py-2 rounded-lg bg-gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5">
          <ArrowUpRight className="w-4 h-4" /> Export Report
        </button>
      </PageHeader>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={Wallet} variant="primary" />
          <StatCard title="Total Bookings" value={String(stats.bookings)} icon={Car} subtitle="All time" variant="info" />
          <StatCard title="Drivers" value={String(stats.drivers)} icon={Users} />
          <StatCard title="Vehicle Owners" value={String(stats.customers)} icon={TrendingUp} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-5 shadow-card">
            <h3 className="font-display font-semibold mb-4">Revenue by Day</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl p-5 shadow-card">
            <h3 className="font-display font-semibold mb-4">Recent Activity</h3>
            {recentBookings.length === 0 ? (
              <p className="text-muted-foreground text-sm">No bookings yet.</p>
            ) : (
              <div className="space-y-3">
                {recentBookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-primary">
                      <Car className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">Booking #{b.id.slice(0, 6)} — {b.status}</p>
                      <p className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</p>
                    </div>
                    <span className="text-sm font-bold">{b.fare ? `₹${b.fare}` : "TBD"}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PanelLayout>
  );
}
