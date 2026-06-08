import { PanelLayout } from "@/components/PanelLayout";
import { PageHeader } from "@/components/DashboardWidgets";
import { Search, XCircle, Clock, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const filters = ["All", "Pending", "Active", "In-Progress", "Completed", "Cancelled"];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  active: "bg-blue-500/10 text-blue-600",
  "in-progress": "bg-blue-500/10 text-blue-600",
  completed: "bg-green-500/10 text-green-600",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function MyBookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });
    setBookings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
    const channel = supabase
      .channel("my-bookings-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `customer_id=eq.${user?.id}` }, () => fetchBookings())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleCancel = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Booking cancelled" });
      fetchBookings();
    }
  };

  const filtered = bookings.filter((b) => {
    const filterVal = activeFilter.toLowerCase();
    const matchFilter = activeFilter === "All" || b.status === filterVal;
    const matchSearch = b.pickup_location.toLowerCase().includes(search.toLowerCase()) || (b.drop_location || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <PanelLayout panel="customer">
      <PageHeader title="My Bookings" subtitle="All your driver booking history" />
      <div className="p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  activeFilter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No bookings found.</div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl p-4 shadow-card border border-border hover:shadow-elevated transition-shadow touch-target"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-muted-foreground">#{b.id.slice(0, 8).toUpperCase()}</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[b.status] || "bg-muted text-muted-foreground"}`}>
                    {b.status === "in-progress" ? "In Progress" : b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                    <p className="text-sm font-medium">{b.pickup_location}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                    <p className="text-sm font-medium">{b.drop_location || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>{b.vehicle_name || b.trip_type} • {new Date(b.scheduled_date).toLocaleDateString()}</span>
                  <span className="font-bold text-sm text-foreground">{b.fare ? `₹${b.fare}` : "TBD"}</span>
                </div>

                {/* Status-specific info */}
                {(b.status === "active" || b.status === "in-progress") && (
                  <div className="mt-3 p-2.5 bg-blue-500/5 rounded-lg border border-blue-500/10">
                    <p className="text-xs text-blue-600 font-medium">
                      {b.status === "active" ? "🚗 Driver assigned — awaiting pickup" : "🛣️ Ride in progress"}
                    </p>
                  </div>
                )}

                {/* Cancel button for pending/active only */}
                {(b.status === "pending" || b.status === "active") && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    className="w-full mt-3 py-2.5 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors flex items-center justify-center gap-1.5 touch-target"
                  >
                    <XCircle className="w-4 h-4" /> Cancel Booking
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PanelLayout>
  );
}
