import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Users, Car, MapPin, Settings, BarChart3, 
  Bell, LogOut, UserCircle, Wallet, Clock,
  ChevronLeft, Menu, X
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

const customerNav: NavItem[] = [
  { title: "Book Driver", url: "/customer", icon: MapPin },
  { title: "My Bookings", url: "/customer/rides", icon: Clock },
  { title: "Wallet", url: "/customer/wallet", icon: Wallet },
  { title: "My Vehicles", url: "/customer/vehicles", icon: Car },
  { title: "Profile", url: "/customer/profile", icon: UserCircle },
];

const driverNav: NavItem[] = [
  { title: "Dashboard", url: "/driver", icon: LayoutDashboard },
  { title: "Job Requests", url: "/driver/requests", icon: Bell },
  { title: "My Jobs", url: "/driver/rides", icon: Car },
  { title: "Earnings", url: "/driver/earnings", icon: Wallet },
  { title: "Profile", url: "/driver/profile", icon: UserCircle },
];

const adminNav: NavItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Bookings", url: "/admin/rides", icon: Car },
  { title: "Drivers", url: "/admin/drivers", icon: Users },
  { title: "Vehicle Owners", url: "/admin/customers", icon: UserCircle },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

interface PanelLayoutProps {
  children: ReactNode;
  panel: "customer" | "driver" | "admin";
}

const panelConfig = {
  customer: { nav: customerNav, label: "Vehicle Owner", color: "bg-gradient-hero" },
  driver: { nav: driverNav, label: "Driver", color: "bg-gradient-hero" },
  admin: { nav: adminNav, label: "Admin", color: "bg-gradient-dark" },
};

export function PanelLayout({ children, panel }: PanelLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  const config = panelConfig[panel];

  // Close sidebar on route change for mobile
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileSidebarOpen]);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Mobile overlay */}
      {/*
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed && window.innerWidth >= 1024 ? 72 : (mobileSidebarOpen || window.innerWidth >= 1024) ? 260 : 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="fixed left-0 top-0 min-h-[100dvh] bg-secondary text-secondary-foreground flex flex-col z-50 overflow-hidden lg:relative lg:z-auto"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-hero flex items-center justify-center flex-shrink-0">
            <Car className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className={`flex flex-col min-w-0 transition-opacity duration-200 ${collapsed ? "lg:opacity-0 lg:hidden" : ""}`}>
            <span className="font-display font-bold text-lg leading-tight text-secondary-foreground truncate">Drive My Car</span>
            <span className="text-xs text-muted-foreground truncate">{config.label} Panel</span>
          </div>
          <button 
            className="ml-auto p-2 rounded-lg hover:bg-sidebar-accent lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {config.nav.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <Link
                key={item.url}
                to={item.url}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 touch-target ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                title={collapsed ? item.title : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className={`truncate transition-opacity duration-200 ${collapsed ? "lg:opacity-0 lg:hidden" : ""}`}>
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-sidebar-border space-y-1 flex-shrink-0">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full touch-target"
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-opacity duration-200 ${collapsed ? "lg:opacity-0 lg:hidden" : ""}`}>Sign Out</span>
          </button>
          {/* Collapse toggle - desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full"
          >
            <ChevronLeft className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
            <span className={`transition-opacity duration-200 ${collapsed ? "lg:opacity-0 lg:hidden" : ""}`}>Collapse</span>
          </button>
        </div>
      </motion.aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-secondary/95 backdrop-blur-sm border-b border-sidebar-border flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-sidebar-accent text-secondary-foreground touch-target"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
          <Car className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-secondary-foreground text-sm">Drive My Car</span>
      </div>

      {/* Main content */}
      <motion.main
        animate={{ marginLeft: collapsed && window.innerWidth >= 1024 ? 72 : window.innerWidth >= 1024 ? 260 : 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="flex-1 h-screen overflow-y-auto overflow-x-hidden lg:ml-0"
      >
        {/* Add padding on top to push content below the mobile top bar. the
            header is 56px tall (h-14) and fixed, so mobile layouts need the
            extra spacing. desktop (lg) drops it. */}
        <div className="pt-14 pb-16 lg:pt-0 lg:pb-0">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
