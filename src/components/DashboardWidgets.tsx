import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  variant?: "default" | "primary" | "success" | "info";
}

const variantStyles = {
  default: "bg-card text-card-foreground",
  primary: "bg-gradient-hero text-primary-foreground",
  success: "bg-rapido-success/10 text-foreground",
  info: "bg-rapido-info/10 text-foreground",
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-5 shadow-card ${variantStyles[variant]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${variant === "primary" ? "opacity-80" : "text-muted-foreground"}`}>{title}</p>
          <p className="text-3xl font-display font-bold mt-1">{value}</p>
          {subtitle && <p className={`text-xs mt-1 ${variant === "primary" ? "opacity-70" : "text-muted-foreground"}`}>{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend.positive ? "text-rapido-success" : "text-destructive"}`}>
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% from last week
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${variant === "primary" ? "bg-primary-foreground/20" : "bg-muted"}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 lg:top-0 z-20">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground truncate">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">{children}</div>}
    </div>
  );
}

interface RideCardProps {
  id: string;
  from: string;
  to: string;
  status: "pending" | "active" | "in-progress" | "completed" | "cancelled";
  price: string;
  time: string;
  vehicleType: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-rapido-warning/10 text-rapido-warning",
  active: "bg-rapido-info/10 text-rapido-info",
  "in-progress": "bg-rapido-info/10 text-rapido-info",
  completed: "bg-rapido-success/10 text-rapido-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export function RideCard({ id, from, to, status, price, time, vehicleType }: RideCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-4 shadow-card hover:shadow-elevated transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-muted-foreground">#{id}</span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[status] || "bg-muted text-muted-foreground"}`}>
          {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-rapido-success mt-1.5 flex-shrink-0" />
          <p className="text-sm font-medium">{from}</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
          <p className="text-sm font-medium">{to}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">{vehicleType} • {time}</span>
        <span className="text-sm font-bold">₹{price}</span>
      </div>
    </motion.div>
  );
}
