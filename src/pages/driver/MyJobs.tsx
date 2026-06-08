import { PanelLayout } from "@/components/PanelLayout";
import { PageHeader } from "@/components/DashboardWidgets";
import { Search, CheckCircle, Play, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const filters = ["All", "Active", "Completed", "Cancelled"];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  active: "bg-blue-500/10 text-blue-600",
  "in-progress": "bg-blue-500/10 text-blue-600",
  completed: "bg-green-500/10 text-green-600",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function MyJobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("driver_id", user.id)
      .order("created_at", { ascending: false });
    setJobs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
    const channel = supabase
      .channel("my-jobs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `driver_id=eq.${user?.id}` }, () => fetchJobs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleStartRide = async (id: string, jobDetails: any) => {
    try {
      const { error } = await supabase.from("bookings").update({ status: "in-progress" }).eq("id", id);
      if (error) throw error;
      
      // Show detailed success message with job information
      toast({ 
        title: "Ride started! 🚗", 
        description: (
          <div className="space-y-1">
            <p className="font-medium">Current Job:</p>
            <p className="text-sm">Pickup: {jobDetails.pickup_location}</p>
            <p className="text-sm">Drop: {jobDetails.drop_location || 'Not specified'}</p>
            <p className="text-sm">Vehicle: {jobDetails.vehicle_name || jobDetails.trip_type}</p>
            <p className="text-sm font-medium mt-2">Remember to enter the fare when completing the ride</p>
          </div>
        ),
        duration: 5000
      });
      
      fetchJobs();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCompleteRide = async (id: string, fare: string) => {
    const finalFare = fare && !isNaN(Number(fare)) ? Number(fare) : null;
    const { error } = await supabase.from("bookings").update({ status: "completed", fare: finalFare }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ride completed! 🎉" });
      fetchJobs();
    }
  };

  const filtered = jobs.filter((j) => {
    const matchFilter = activeFilter === "All" || j.status === activeFilter.toLowerCase();
    const matchSearch = j.pickup_location.toLowerCase().includes(search.toLowerCase()) || (j.drop_location || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <PanelLayout panel="driver">
      <PageHeader title="My Jobs" subtitle="All your completed and active driving jobs" />
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
                className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${activeFilter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No jobs found.</div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((job, i) => (
              <JobCard key={job.id} job={job} index={i} onStart={handleStartRide} onComplete={handleCompleteRide} />
            ))}
          </div>
        )}
      </div>
    </PanelLayout>
  );
}

function JobCard({ job, index, onStart, onComplete }: { job: any; index: number; onStart: (id: string, jobDetails: any) => void; onComplete: (id: string, fare: string) => void }) {
  const [fareInput, setFareInput] = useState(job.fare ? String(job.fare) : "");
  const status = job.status as string;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-xl p-4 shadow-card border border-border touch-target"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-muted-foreground">#{job.id.slice(0, 8).toUpperCase()}</span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[status] || "bg-muted text-muted-foreground"}`}>
          {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
          <p className="text-sm font-medium">{job.pickup_location}</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
          <p className="text-sm font-medium">{job.drop_location || "—"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 pt-2 border-t border-border">
        <span>{job.vehicle_name || job.trip_type} • {new Date(job.scheduled_date).toLocaleDateString()}</span>
        <span className="font-bold text-sm text-foreground">{job.fare ? `₹${job.fare}` : "TBD"}</span>
      </div>

      {/* Action buttons based on status */}
      {status === "active" && (
        <button
          onClick={() => onStart(job.id, job)}
          className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 touch-target"
        >
          <Play className="w-4 h-4" /> Start Ride
        </button>
      )}

      {status === "in-progress" && (
        <div className="space-y-2">
          <input
            type="number"
            placeholder="Enter fare amount (₹)"
            value={fareInput}
            onChange={(e) => setFareInput(e.target.value)}
            className="w-full px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={() => onComplete(job.id, fareInput)}
            className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5 touch-target"
          >
            <CheckCircle className="w-4 h-4" /> Complete Ride
          </button>
        </div>
      )}
    </motion.div>
  );
}
