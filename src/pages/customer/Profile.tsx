import { PanelLayout } from "@/components/PanelLayout";
import { PageHeader } from "@/components/DashboardWidgets";
import { UserCircle, Mail, Phone, Save } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function CustomerProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });

  useEffect(() => {
    if (!user) return;
    setForm(f => ({ ...f, email: user.email || "" }));
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setForm(f => ({ ...f, full_name: data.full_name || "", phone: data.phone || "" }));
      }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ full_name: form.full_name, phone: form.phone }).eq("user_id", user.id);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated! ✅" });
    }
  };

  return (
    <PanelLayout panel="customer">
      <PageHeader title="My Profile" subtitle="Manage your account details" />
      <div className="p-4 sm:p-6 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-5 sm:p-6 border border-border shadow-card space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <UserCircle className="w-10 h-10 text-primary" />
            </div>
            <div>
              <p className="font-display font-bold text-lg">{form.full_name || "Vehicle Owner"}</p>
              <p className="text-sm text-muted-foreground">{form.email}</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Full Name</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  value={form.full_name} 
                  onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} 
                  className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  value={form.email} 
                  disabled 
                  className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm opacity-60 cursor-not-allowed" 
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  value={form.phone} 
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} 
                  className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={loading} 
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-hero text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 touch-target"
          >
            <Save className="w-4 h-4" /> {loading ? "Saving..." : "Save Changes"}
          </button>
        </motion.div>
      </div>
    </PanelLayout>
  );
}
