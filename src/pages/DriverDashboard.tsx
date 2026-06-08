import { PanelLayout } from "@/components/PanelLayout";
import { PageHeader, StatCard, RideCard } from "@/components/DashboardWidgets";
import { Car, Wallet, Star, Clock, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function DriverDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingJobs, setPendingJobs] = useState<any[]>([]);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  // Fix scrolling for dashboard content
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch pending jobs that don't have a driver assigned
      const { data: pending, error: pendingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("status", "pending")
        .is("driver_id", null) // Only jobs without a driver assigned
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (pendingError) {
        console.error("Error fetching pending jobs:", pendingError);
        toast({
          title: "Error",
          description: "Failed to load pending jobs. Please try again.",
          variant: "destructive"
        });
      } else {
        setPendingJobs(pending || []);
      }

      // Fetch completed jobs for this driver
      const { data: completed, error: completedError } = await supabase
        .from("bookings")
        .select("*")
        .eq("driver_id", user.id)
        .eq("status", "completed")
        .order("updated_at", { ascending: false })
        .limit(4);
      
      if (completedError) {
        console.error("Error fetching completed jobs:", completedError);
        toast({
          title: "Error",
          description: "Failed to load completed jobs. Please try again.",
          variant: "destructive"
        });
      } else {
        setCompletedJobs(completed || []);
      }

      // Fetch driver's profile
      const { data: p, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        toast({
          title: "Error",
          description: "Failed to load profile. Please try again.",
          variant: "destructive"
        });
      } else {
        setProfile(p);
      }
    } catch (error) {
      console.error("Unexpected error in fetchData:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchData();
    
    // Realtime subscription for booking updates
    const channel = supabase
      .channel("driver-bookings")
      .on("postgres_changes", {
        event: "*", // Listen for INSERT, UPDATE, DELETE
        schema: "public",
        table: "bookings",
        filter: `driver_id=eq.${user.id}`
      }, () => fetchData())
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "bookings",
        filter: `status=eq.pending`
      }, (payload) => {
        // Also update when a pending booking gets assigned to another driver
        fetchData();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const handleAccept = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("bookings").update({ driver_id: user.id, status: "active" }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Job accepted! 🎉" });
      fetchData();
    }
  };

  const todayEarnings = completedJobs
    .filter(j => new Date(j.updated_at).toDateString() === new Date().toDateString())
    .reduce((sum, j) => sum + (Number(j.fare) || 0), 0);

  return (
    <PanelLayout panel="driver">
      <PageHeader title="Driver Dashboard" subtitle={`Welcome back, ${profile?.full_name || "Driver"}!`}>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rapido-success/10">
          <div className="w-2 h-2 rounded-full bg-rapido-success animate-pulse" />
          <span className="text-xs font-medium text-rapido-success">Available</span>
        </div>
      </PageHeader>

      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Today's Earnings" value={`₹${todayEarnings.toLocaleString()}`} icon={Wallet} variant="primary" />
          <StatCard title="Pending Jobs" value={String(pendingJobs.length)} icon={Car} subtitle="Available now" />
          <StatCard title="Completed" value={String(completedJobs.length)} icon={Star} variant="success" />
          <StatCard title="Status" value={profile?.verification_status === "verified" ? "Verified" : "Pending"} icon={Clock} subtitle="Verification" />
        </div>

        {/* Pending Requests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold">New Driving Requests</h2>
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">{pendingJobs.length} pending</span>
          </div>
          {pendingJobs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending requests at the moment.</p>
          ) : (
            <div className="space-y-3">
              {pendingJobs.map((job, i) => (
                <motion.div key={job.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-xl p-4 shadow-card">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">#{job.id.slice(0, 8).toUpperCase()}</span>
                      <span className="text-xs text-muted-foreground">• {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className="text-lg font-bold text-foreground">{job.fare ? `₹${job.fare}` : "TBD"}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/50 text-accent-foreground">{job.vehicle_name || job.trip_type}</span>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rapido-success" />
                      <span className="text-sm">{job.pickup_location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                      <span className="text-sm">{job.drop_location || "—"}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={() => handleAccept(job.id)} className="flex-1 py-2 rounded-lg bg-gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Accept Job
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Completed */}
        <div>
          <h2 className="text-lg font-display font-semibold mb-4">Completed Jobs</h2>
          {completedJobs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No completed jobs yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {completedJobs.map((job) => (
                <RideCard key={job.id} id={job.id.slice(0, 8).toUpperCase()} from={job.pickup_location} to={job.drop_location || "—"} status="completed" price={job.fare ? String(job.fare) : "TBD"} time={new Date(job.updated_at).toLocaleDateString()} vehicleType={job.vehicle_name || job.trip_type} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PanelLayout>
  );
}
