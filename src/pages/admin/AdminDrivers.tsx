import { PanelLayout } from "@/components/PanelLayout";
import { PageHeader } from "@/components/DashboardWidgets";
import { Search, CheckCircle, XCircle, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  verified: "bg-rapido-success/10 text-rapido-success",
  pending: "bg-yellow-500/10 text-yellow-600",
  rejected: "bg-destructive/10 text-destructive",
};

export default function AdminDrivers() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = async () => {
    // Get all driver user_ids from user_roles
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "driver");
    if (!roles || roles.length === 0) {
      setDrivers([]);
      setLoading(false);
      return;
    }
    const driverIds = roles.map(r => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", driverIds);
    setDrivers(profiles || []);
    setLoading(false);
  };

  useEffect(() => { fetchDrivers(); }, []);

  const handleVerify = async (userId: string) => {
    await supabase.from("profiles").update({ verification_status: "verified" }).eq("user_id", userId);
    toast({ title: "Driver verified ✅" });
    fetchDrivers();
  };

  const handleReject = async (userId: string) => {
    await supabase.from("profiles").update({ verification_status: "rejected" }).eq("user_id", userId);
    toast({ title: "Driver rejected" });
    fetchDrivers();
  };

  const filtered = drivers.filter((d) => (d.full_name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <PanelLayout panel="admin">
      <PageHeader title="Drivers" subtitle="Manage and verify driver accounts" />
      <div className="p-6 space-y-5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search drivers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-muted-foreground">No drivers found.</div>
            ) : (
              filtered.map((d, i) => (
                <motion.div key={d.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="bg-card rounded-2xl p-5 border border-border shadow-card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-display font-bold text-foreground">{d.full_name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground">{d.phone || "No phone"}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[d.verification_status] || "bg-muted text-muted-foreground"}`}>
                      {d.verification_status || "unknown"}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="bg-muted rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">Aadhaar</p>
                      <p className="text-sm font-mono">{d.aadhaar_number ? "XXXX XXXX " + d.aadhaar_number.slice(-4) : "—"}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">License</p>
                      <p className="text-sm font-mono">{d.license_number || "—"}</p>
                    </div>
                  </div>
                  {d.verification_status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleVerify(d.user_id)} className="flex-1 py-2 rounded-lg bg-gradient-hero text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Verify
                      </button>
                      <button onClick={() => handleReject(d.user_id)} className="px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </PanelLayout>
  );
}
