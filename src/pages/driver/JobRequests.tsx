import { PanelLayout } from "@/components/PanelLayout";
import { PageHeader } from "@/components/DashboardWidgets";
import { CheckCircle, Car, Calendar, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function JobRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "pending")
      .is("driver_id", null)
      .order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    const channel = supabase
      .channel("job-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => fetchRequests())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAccept = async (id: string, jobDetails: any) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.from("bookings").update({ driver_id: user.id, status: "active" }).eq("id", id);
      if (error) throw error;
      
      // Show detailed success message with job information
      toast({ 
        title: "Job accepted! 🎉", 
        description: (
          <div className="space-y-1">
            <p className="font-medium">Job Details:</p>
            <p className="text-sm">Pickup: {jobDetails.pickup_location}</p>
            <p className="text-sm">Drop: {jobDetails.drop_location || 'Not specified'}</p>
            <p className="text-sm">Date: {new Date(jobDetails.scheduled_date).toLocaleDateString()}</p>
            <p className="text-sm font-medium mt-2">Go to 'My Jobs' to start this ride</p>
          </div>
        ),
        duration: 5000
      });
      
      fetchRequests();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <PanelLayout panel="driver">
      <PageHeader title="Job Requests" subtitle="Incoming driving requests from vehicle owners">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-600">{requests.length} pending</span>
        </div>
      </PageHeader>

      <div className="p-4 sm:p-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No job requests at the moment. Check back soon!</p>
          </div>
        ) : (
          <AnimatePresence>
            {requests.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-card touch-target"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">#{job.id.slice(0, 8).toUpperCase()}</span>
                    <span className="text-xs text-muted-foreground">• {new Date(job.created_at).toLocaleString()}</span>
                  </div>
                  <span className="text-xl font-bold text-foreground">{job.fare ? `₹${job.fare}` : "TBD"}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/50 text-accent-foreground flex items-center gap-1">
                    <Car className="w-3 h-3" /> {job.vehicle_name || job.trip_type}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(job.scheduled_date).toLocaleDateString()}
                  </span>
                  {job.scheduled_time && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {job.scheduled_time}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">{job.pickup_location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-sm">{job.drop_location || "—"}</span>
                  </div>
                </div>

                {job.notes && (
                  <p className="text-xs text-muted-foreground mb-3 p-2 bg-muted rounded-lg">📝 {job.notes}</p>
                )}

                <button
                  onClick={() => handleAccept(job.id, job)}
                  className="w-full py-3 rounded-xl bg-gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 touch-target"
                >
                  <CheckCircle className="w-4 h-4" /> Accept Job
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </PanelLayout>
  );
}
