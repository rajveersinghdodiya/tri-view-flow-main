import { PanelLayout } from "@/components/PanelLayout";
import { PageHeader } from "@/components/DashboardWidgets";
import { Plus, Car, Trash2, Edit2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function MyVehicles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ make: "", model: "", registration_number: "", vehicle_type: "", year: "", color: "" });

  const fetchVehicles = async () => {
    if (!user) return;
    const { data } = await supabase.from("vehicles").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setVehicles(data || []);
  };

  useEffect(() => { fetchVehicles(); }, [user]);

  const handleAdd = async () => {
    if (!user || !form.make || !form.registration_number) {
      toast({ title: "Missing fields", description: "Please fill make and registration number.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("vehicles").insert({
      user_id: user.id,
      make: form.make,
      model: form.model,
      registration_number: form.registration_number,
      vehicle_type: form.vehicle_type || "sedan",
      year: form.year ? parseInt(form.year) : null,
      color: form.color || null,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Vehicle added! 🚗" });
      setForm({ make: "", model: "", registration_number: "", vehicle_type: "", year: "", color: "" });
      setShowAdd(false);
      fetchVehicles();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("vehicles").delete().eq("id", id);
    fetchVehicles();
    toast({ title: "Vehicle removed" });
  };

  return (
    <PanelLayout panel="customer">
      <PageHeader title="My Vehicles" subtitle="Manage your registered vehicles">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </PageHeader>

      <div className="p-4 sm:p-6 space-y-5">
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-5 sm:p-6 border border-border shadow-elevated">
            <h3 className="font-display font-semibold text-lg mb-4">Add New Vehicle</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {
                [
                  { name: "make", placeholder: "Make (e.g. Hyundai)" },
                  { name: "model", placeholder: "Model (e.g. Creta)" },
                  { name: "registration_number", placeholder: "Registration No. (e.g. KA-01-AB-1234)" },
                  { name: "vehicle_type", placeholder: "Type (SUV, Sedan, Hatchback)" },
                  { name: "year", placeholder: "Year (e.g. 2021)" },
                  { name: "color", placeholder: "Color" },
                ].map((f) => (
                <input
                  key={f.name}
                  placeholder={f.placeholder}
                  value={form[f.name as keyof typeof form]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                  className="px-4 py-3 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button onClick={handleAdd} disabled={loading} className="flex-1 py-3 bg-gradient-hero text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 touch-target">
                {loading ? "Saving..." : "Save Vehicle"}
              </button>
              <button onClick={() => setShowAdd(false)} className="px-5 py-3 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors touch-target">
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {vehicles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No vehicles added yet. Add your first vehicle!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map((v, i) => (
              <motion.div key={v.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-card rounded-2xl p-5 border border-border shadow-card touch-target">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Car className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-foreground">{v.make} {v.model}</p>
                      <p className="text-xs font-mono text-muted-foreground break-all">{v.registration_number}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(v.id)} className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground touch-target">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[{ label: "Type", val: v.vehicle_type }, { label: "Year", val: v.year }, { label: "Color", val: v.color }].map((d) => (
                    <div key={d.label} className="bg-muted rounded-lg px-3 py-2">
                      <p className="text-xs text-muted-foreground">{d.label}</p>
                      <p className="text-sm font-medium">{d.val || "—"}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PanelLayout>
  );
}
