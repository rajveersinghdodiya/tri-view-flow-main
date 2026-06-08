import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Car, UserCircle, Shield, ArrowRight, Zap, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const panels = [
  {
    title: "Vehicle Owner",
    description: "Find verified drivers for your car, schedule trips, and manage payments",
    icon: UserCircle,
    url: "/auth",
    gradient: "from-primary to-accent",
    features: ["Book a driver for your car", "Schedule trips in advance", "Wallet & Payments"],
  },
  {
    title: "Driver",
    description: "Accept driving jobs, build your reputation, and earn on your schedule",
    icon: Car,
    url: "/auth",
    gradient: "from-rapido-success to-emerald-400",
    features: ["Accept driving requests", "Track your earnings", "Build your rating"],
  },

];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const Index = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && role) {
      if (role === "customer") navigate("/customer");
      else if (role === "driver") navigate("/driver");
      else if (role === "admin") navigate("/admin");
    }
  }, [user, role, loading, navigate]);

  // Show the main content after a timeout to prevent infinite loading
  const [showContentTimeout, setShowContentTimeout] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContentTimeout(true);
    }, 5000); // 5 seconds timeout
    
    return () => clearTimeout(timer);
  }, []);

  if (loading && !showContentTimeout) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // If loading is still true after timeout, show the main content anyway
  if (loading && showContentTimeout) {
    console.warn("Authentication loading timeout - showing main content");
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-dark" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(circle at 30% 50%, hsl(46 92% 53% / 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 30%, hsl(210 100% 56% / 0.1) 0%, transparent 50%)"
        }} />
        
        <div className="relative max-w-6xl mx-auto px-6 pt-12 pb-20">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center">
              <Car className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold text-secondary-foreground">DriveMycar</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Hire Verified Drivers for Your Vehicle</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold text-secondary-foreground leading-tight">
              Your car,{" "}
              <span className="text-gradient-primary">our driver.</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-4 max-w-lg">
              Need a driver for your own vehicle? Book verified, professional drivers on-demand or schedule ahead. Sit back and enjoy the ride.
            </p>
          </motion.div>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-10 top-20 hidden lg:block"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 backdrop-blur flex items-center justify-center border border-primary/20">
              <Users className="w-8 h-8 text-primary" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Panel Cards */}
      <div className="max-w-6xl mx-auto px-6 -mt-8 pb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-3 gap-6"
        >
          {panels.map((panel) => (
            <motion.div key={panel.title} variants={itemVariants}>
              <button onClick={() => navigate(panel.url)} className="block group w-full text-left">
                <div className="bg-card rounded-2xl p-6 shadow-elevated hover:shadow-2xl transition-all duration-300 border border-border hover:border-primary/30 h-full">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${panel.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <panel.icon className="w-7 h-7 text-primary-foreground" />
                  </div>

                  <h3 className="text-xl font-display font-bold text-foreground mb-2">{panel.title} Panel</h3>
                  <p className="text-sm text-muted-foreground mb-5">{panel.description}</p>

                  <ul className="space-y-2 mb-6">
                    {panel.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                    Enter Panel <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
