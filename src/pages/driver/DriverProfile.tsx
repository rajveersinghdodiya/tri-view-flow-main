import { PanelLayout } from "@/components/PanelLayout";
import { PageHeader } from "@/components/DashboardWidgets";
import { UserCircle, Mail, Phone, Save, CreditCard, FileText, ShieldAlert, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function DriverProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });

  useEffect(() => {
    if (!user) return;
    setForm(f => ({ ...f, email: user.email || "" }));
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setProfile(data);
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

  const maskedAadhaar = profile?.aadhaar_number
    ? "XXXX XXXX " + profile.aadhaar_number.slice(-4)
    : "Not provided";
  const isVerified = profile?.verification_status === "verified";

  return (
    <PanelLayout panel="driver">
      <PageHeader title="My Profile" subtitle="Manage your driver account details" />
      <div className="p-4 sm:p-6 max-w-2xl space-y-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-5 sm:p-6 border border-border shadow-card space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <UserCircle className="w-10 h-10 text-primary" />
            </div>
            <div>
              <p className="font-display font-bold text-lg">{form.full_name || "Driver"}</p>
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

          <button onClick={handleSave} disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-hero text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
            <Save className="w-4 h-4" /> {loading ? "Saving..." : "Save Changes"}
          </button>
        </motion.div>

        {/* Documents */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl p-5 sm:p-6 border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold">Submitted Documents</h3>
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${isVerified ? "bg-rapido-success/10 text-rapido-success" : "bg-yellow-500/10 text-yellow-600"}`}>
              {isVerified ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              {isVerified ? "Verified" : "Pending Verification"}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Aadhaar Number</p>
                <p className="text-sm font-mono font-medium tracking-widest break-all">{maskedAadhaar}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Driving License</p>
                <p className="text-sm font-mono font-medium break-all">{profile?.license_number || "Not provided"}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Documents are verified by the admin team. You'll be notified once verification is complete.</p>
        </motion.div>
      </div>
    </PanelLayout>
  );
}
