import { PanelLayout } from "@/components/PanelLayout";
import { PageHeader } from "@/components/DashboardWidgets";
import { Save, Bell, Shield, Percent, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    platformFee: "15",
    minFare: "80",
    maxDriverRadius: "10",
    emailNotif: true,
    smsNotif: true,
    autoVerifyDrivers: false,
    maintenanceMode: false,
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings((p) => ({ ...p, [key]: !p[key] }));

  return (
    <PanelLayout panel="admin">
      <PageHeader title="Settings" subtitle="Configure platform-wide settings">
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          <Save className="w-4 h-4" /> Save All
        </button>
      </PageHeader>

      <div className="p-6 space-y-5 max-w-2xl">
        {/* Pricing */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Percent className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold">Pricing Configuration</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "platformFee", label: "Platform Commission (%)", suffix: "%" },
              { key: "minFare", label: "Minimum Fare (₹)", suffix: "₹" },
              { key: "maxDriverRadius", label: "Driver Search Radius (km)", suffix: "km" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">{f.label}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings[f.key as keyof typeof settings] as string}
                    onChange={(e) => setSettings((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-4 py-3 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold">Notifications</h3>
          </div>
          <div className="space-y-3">
            {[
              { key: "emailNotif", label: "Email Notifications", desc: "Send booking confirmations and alerts via email" },
              { key: "smsNotif", label: "SMS Notifications", desc: "Send OTPs and booking updates via SMS" },
            ].map((s) => (
              <div key={s.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
                <button
                  onClick={() => toggle(s.key as keyof typeof settings)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${settings[s.key as keyof typeof settings] ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings[s.key as keyof typeof settings] ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Platform Control */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold">Platform Control</h3>
          </div>
          <div className="space-y-3">
            {[
              { key: "autoVerifyDrivers", label: "Auto-verify Drivers", desc: "Automatically approve drivers without manual review" },
              { key: "maintenanceMode", label: "Maintenance Mode", desc: "Take the platform offline for maintenance" },
            ].map((s) => (
              <div key={s.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
                <button
                  onClick={() => toggle(s.key as keyof typeof settings)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${settings[s.key as keyof typeof settings] ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings[s.key as keyof typeof settings] ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PanelLayout>
  );
}
