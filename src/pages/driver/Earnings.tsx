import { PanelLayout } from "@/components/PanelLayout";
import { PageHeader, StatCard } from "@/components/DashboardWidgets";
import { Wallet, TrendingUp, Car, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function Earnings() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookings")
      .select("*")
      .eq("driver_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setJobs(data || []);
        setLoading(false);
      });
  }, [user]);

  const totalEarnings = jobs.reduce((sum, j) => sum + (Number(j.fare) || 0), 0);
  const todayJobs = jobs.filter(j => new Date(j.updated_at).toDateString() === new Date().toDateString());
  const todayEarnings = todayJobs.reduce((sum, j) => sum + (Number(j.fare) || 0), 0);

  // Group by day of week for chart
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyData = dayNames.map(day => ({
    day,
    earnings: jobs
      .filter(j => dayNames[new Date(j.updated_at).getDay()] === day)
      .reduce((sum, j) => sum + (Number(j.fare) || 0), 0),
  }));

  return (
    <PanelLayout panel="driver">
      <PageHeader title="Earnings" subtitle="Your income summary and history" />
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard title="Today's Earnings" value={`₹${todayEarnings.toLocaleString()}`} icon={Wallet} variant="primary" />
          <StatCard title="Total Earnings" value={`₹${totalEarnings.toLocaleString()}`} icon={TrendingUp} />
          <StatCard title="Total Jobs" value={String(jobs.length)} icon={Car} subtitle="Completed" />
          <StatCard title="Avg per Job" value={jobs.length ? `₹${Math.round(totalEarnings / jobs.length)}` : "₹0"} icon={Star} variant="success" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-5 shadow-card">
          <h3 className="font-display font-semibold mb-4">Earnings by Day</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
              <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Job History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border border-border shadow-card">
          <div className="p-5 border-b border-border">
            <h3 className="font-display font-semibold">Completed Jobs</h3>
          </div>
          {jobs.length === 0 ? (
            <p className="p-5 text-muted-foreground text-sm">No completed jobs yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {jobs.slice(0, 10).map((j) => (
                <div key={j.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-semibold">{j.pickup_location} → {j.drop_location || "—"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(j.updated_at).toLocaleDateString()} • {j.vehicle_name || j.trip_type}</p>
                  </div>
                  <span className="font-bold text-sm text-rapido-success">₹{j.fare || "TBD"}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </PanelLayout>
  );
}
