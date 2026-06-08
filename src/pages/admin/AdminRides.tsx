import { PanelLayout } from "@/components/PanelLayout";
import { PageHeader } from "@/components/DashboardWidgets";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const statusColors: Record<string, string> = {
  completed: "bg-rapido-success/10 text-rapido-success",
  active: "bg-rapido-info/10 text-rapido-info",
  cancelled: "bg-destructive/10 text-destructive",
  pending: "bg-yellow-500/10 text-yellow-600",
};

export default function AdminRides() {
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setBookings(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = bookings.filter((b) =>
    b.id.includes(search) || b.pickup_location.toLowerCase().includes(search.toLowerCase()) || (b.vehicle_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PanelLayout panel="admin">
      <PageHeader title="All Bookings" subtitle="View and manage all platform bookings" />
      <div className="p-6 space-y-5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search bookings..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Booking ID", "Vehicle", "From → To", "Type", "Status", "Fare", "Date"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b, i) => (
                  <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{b.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-3 font-medium">{b.vehicle_name || "—"}</td>
                    <td className="px-4 py-3 text-xs">{b.pickup_location} → {b.drop_location || "—"}</td>
                    <td className="px-4 py-3 text-xs">{b.trip_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || ""}`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{b.fare ? `₹${b.fare}` : "TBD"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(b.created_at).toLocaleDateString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">No bookings found.</p>}
          </motion.div>
        )}
      </div>
    </PanelLayout>
  );
}
