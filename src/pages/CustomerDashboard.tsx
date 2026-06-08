import { PanelLayout } from "@/components/PanelLayout";
import { PageHeader, RideCard } from "@/components/DashboardWidgets";
import { Car, Bell, Clock, Calendar, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const tripTypes = [
  { id: "one-way", name: "One-Way", desc: "Point A to B", icon: MapPin },
  { id: "round-trip", name: "Round Trip", desc: "Go & return", icon: Car },
  { id: "full-day", name: "Full Day", desc: "8-12 hours", icon: Clock },
];

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTrip, setSelectedTrip] = useState("one-way");
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fix scrolling for dashboard content
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const [form, setForm] = useState({
    vehicle_id: "",
    pickup_location: "",
    drop_location: "",
    scheduled_date: "",
    scheduled_time: "",
  });

  useEffect(() => {
    if (!user) return;
    
    const fetchUserData = async () => {
      // Fetch recent bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);
      
      if (bookingsError) {
        console.error("Error fetching bookings:", bookingsError);
        toast({
          title: "Error",
          description: "Failed to load bookings. Please try again.",
          variant: "destructive"
        });
      } else {
        setRecentBookings(bookingsData || []);
      }

      // Fetch user's vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id);
      
      if (vehiclesError) {
        console.error("Error fetching vehicles:", vehiclesError);
        toast({
          title: "Error",
          description: "Failed to load vehicles. Please try again.",
          variant: "destructive"
        });
      } else {
        setVehicles(vehiclesData || []);
      }
    };
    
    fetchUserData();
    
    // Set up realtime subscription for booking updates
    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `customer_id=eq.${user.id}`
      }, () => {
        fetchUserData();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const handleBooking = async () => {
    if (!user) return;
    if (!form.pickup_location || !form.scheduled_date) {
      toast({ title: "Missing fields", description: "Please fill pickup location and date.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const selectedVehicle = vehicles.find(v => v.id === form.vehicle_id);
    const { error } = await supabase.from("bookings").insert({
      customer_id: user.id,
      vehicle_id: form.vehicle_id || null,
      vehicle_name: selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : null,
      pickup_location: form.pickup_location,
      drop_location: form.drop_location || null,
      trip_type: selectedTrip,
      scheduled_date: form.scheduled_date,
      scheduled_time: form.scheduled_time || null,
      status: "pending",
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Booking created! 🎉", description: "Your request has been posted for drivers." });
      setForm({ vehicle_id: "", pickup_location: "", drop_location: "", scheduled_date: "", scheduled_time: "" });
      // Refresh bookings
      const { data } = await supabase.from("bookings").select("*").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(6);
      setRecentBookings(data || []);
    }
  };

  return (
    <PanelLayout panel="customer">
      <PageHeader title="Book a Driver" subtitle="Get a verified driver for your vehicle">
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
        </button>
      </PageHeader>

      <div className="p-4 sm:p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-4 sm:p-6 shadow-card">
          <div className="space-y-4">
            {/* Vehicle Select */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your Vehicle</label>
              <select
                value={form.vehicle_id}
                onChange={(e) => setForm(f => ({ ...f, vehicle_id: e.target.value }))}
                className="w-full px-4 py-3 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="">Select a vehicle (or add one in My Vehicles)</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.make} {v.model} ({v.registration_number})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Pickup Location</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-rapido-success" />
                  <input
                    type="text"
                    placeholder="Where to pick your car?"
                    value={form.pickup_location}
                    onChange={(e) => setForm(f => ({ ...f, pickup_location: e.target.value }))}
                    className="w-full pl-9 pr-4 py-3 bg-muted rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Drop Location</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-destructive" />
                  <input
                    type="text"
                    placeholder="Destination"
                    value={form.drop_location}
                    onChange={(e) => setForm(f => ({ ...f, drop_location: e.target.value }))}
                    className="w-full pl-9 pr-4 py-3 bg-muted rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={form.scheduled_date}
                    onChange={(e) => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                    className="w-full pl-9 pr-4 py-3 bg-muted rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="time"
                    value={form.scheduled_time}
                    onChange={(e) => setForm(f => ({ ...f, scheduled_time: e.target.value }))}
                    className="w-full pl-9 pr-4 py-3 bg-muted rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            {tripTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTrip(t.id)}
                className={`relative rounded-xl p-4 text-center transition-all duration-200 border-2 ${
                  selectedTrip === t.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-muted-foreground/30 bg-background"
                }`}
              >
                <t.icon className={`w-7 h-7 mx-auto mb-2 ${selectedTrip === t.id ? "text-primary" : "text-muted-foreground"}`} />
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </button>
            ))}
          </div>

          <button
            onClick={handleBooking}
            disabled={loading}
            className="w-full mt-6 py-3.5 bg-gradient-hero rounded-xl font-semibold text-primary-foreground hover:opacity-90 transition-opacity text-sm shadow-md disabled:opacity-60"
          >
            {loading ? "Creating Booking..." : "Find a Driver"}
          </button>
        </motion.div>

        {/* Recent Bookings */}
        <div>
          <h2 className="text-lg font-display font-semibold mb-4">Recent Bookings</h2>
          {recentBookings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No bookings yet. Create your first booking above!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentBookings.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <RideCard
                    id={b.id.slice(0, 8).toUpperCase()}
                    from={b.pickup_location}
                    to={b.drop_location || "—"}
                    status={b.status}
                    price={b.fare ? String(b.fare) : "TBD"}
                    time={new Date(b.created_at).toLocaleDateString()}
                    vehicleType={b.vehicle_name || b.trip_type}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PanelLayout>
  );
}
