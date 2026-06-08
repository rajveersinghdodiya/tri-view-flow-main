import { PanelLayout } from "@/components/PanelLayout";
import { PageHeader } from "@/components/DashboardWidgets";
import { Search, UserCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "customer");
      if (!roles || roles.length === 0) {
        setCustomers([]);
        setLoading(false);
        return;
      }
      const customerIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", customerIds);
      setCustomers(profiles || []);
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter((c) =>
    (c.full_name || "").toLowerCase().includes(search.toLowerCase()) || (c.phone || "").includes(search)
  );

  return (
    <PanelLayout panel="admin">
      <PageHeader title="Vehicle Owners" subtitle="All registered vehicle owners on the platform" />
      <div className="p-6 space-y-5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search vehicle owners..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Owner", "Phone", "Joined"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <UserCircle className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{c.full_name || "Unnamed"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">No vehicle owners found.</p>}
          </motion.div>
        )}
      </div>
    </PanelLayout>
  );
}
