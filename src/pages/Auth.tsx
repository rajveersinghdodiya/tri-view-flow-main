import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Car, UserCircle, Eye, EyeOff, ArrowLeft, Mail, Lock, User, Phone, CreditCard, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Role = "customer" | "driver";
type Mode = "login" | "signup";
type SignupStep = "role" | "form";

interface FormState {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  aadhaar_number: string;
  license_number: string;
}

function InputField({
  label, name, type = "text", placeholder, icon: Icon, required = false, minLength, value, onChange
}: {
  label: string; name: string; type?: string; placeholder: string;
  icon: React.ElementType; required?: boolean; minLength?: number;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          name={name}
          type={type}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>
    </div>
  );
}

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [signupRole, setSignupRole] = useState<Role | null>(null);
  const [signupStep, setSignupStep] = useState<SignupStep>("role");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fix scrolling for auth page on mobile devices
  useEffect(() => {
    // Store original overflow value
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    aadhaar_number: "",
    license_number: "",
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const switchToSignup = () => {
    setMode("signup");
    setSignupStep("role");
    setSignupRole(null);
  };

  const switchToLogin = () => {
    setMode("login");
    setSignupRole(null);
    setSignupStep("role");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;

      if (data.user) {
        // try to read role from the user metadata first (faster and avoids
        // potential RLS/session races). the `user_roles` table is populated
        // server‑side by a trigger using this same metadata, but the insert
        // might not be immediately visible on first login.
        let userRole: Role | undefined =
          (data.user.user_metadata?.role as Role | undefined) ?? undefined;

        if (!userRole) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .maybeSingle();
          userRole = roleData?.role as Role | undefined;
        }

        toast({ title: "Welcome back!", description: "Redirecting to your dashboard..." });

        if (userRole) {
          if (userRole === "customer") navigate("/customer");
          else if (userRole === "driver") navigate("/driver");
          else if (userRole === "admin") navigate("/admin");
        } else {
          // fallback case should never happen when roles are properly configured
          console.warn("login: user has no role", data.user.id);
          toast({
            title: "Error",
            description: "Could not determine your account role. Please contact support.",
            variant: "destructive",
          });
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupRole) return;
    setLoading(true);

    try {
      if (signupRole === "driver") {
        if (!form.aadhaar_number || form.aadhaar_number.replace(/\s/g, "").length !== 12) {
          throw new Error("Please enter a valid 12-digit Aadhaar number.");
        }
        if (!form.license_number || form.license_number.trim().length < 6) {
          throw new Error("Please enter a valid driving license number.");
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            phone: form.phone,
            role: signupRole,
            ...(signupRole === "driver" && {
              aadhaar_number: form.aadhaar_number.replace(/\s/g, ""),
              license_number: form.license_number.trim().toUpperCase(),
            }),
          },
        },
      });
      if (error) throw error;

      if (data.user) {
        toast({
          title: "Account created! Welcome 🎉",
          description: signupRole === "driver"
            ? "Your documents have been submitted for verification."
            : "You're now logged in. Redirecting to dashboard...",
        });

        // The server trigger should have inserted the role row already, but
        // the client-side auth context reads metadata as well so everything
        // works even if the database insert is slightly delayed.
        if (signupRole === "customer") navigate("/customer");
        else if (signupRole === "driver") navigate("/driver");
        else navigate("/");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const roleConfig = {
    customer: {
      label: "Vehicle Owner",
      icon: UserCircle,
      gradient: "from-primary to-accent",
      description: "Book verified drivers for your car",
    },
    driver: {
      label: "Driver",
      icon: Car,
      gradient: "from-rapido-success to-emerald-400",
      description: "Accept jobs and earn on your schedule",
    },
  };

  return (
    // Use fixed height with overflow-y-auto for proper scrolling
    <div className="h-screen overflow-y-auto bg-secondary flex flex-col overscroll-contain">
      {/* Header — sticky so it stays visible while scrolling */}
      <header className="sticky top-0 z-50 bg-gradient-dark">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, hsl(46 92% 53% / 0.2) 0%, transparent 50%)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
              <Car className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-lg sm:text-xl font-bold text-secondary-foreground">
              Drive My Car
            </span>
          </Link>
         
        </div>
      </header>

      {/* Main scrollable content */}
      <main className="flex-1 px-4 py-6 sm:py-10 pb-20">
        <div className="w-full max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-5 sm:space-y-6"
              >
                <div className="text-center">
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-secondary-foreground mb-1.5">
                    Welcome Back
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Log in with your email and password
                  </p>
                </div>

                <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-elevated border border-border">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <InputField
                      label="Email Address"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      icon={Mail}
                      required
                      value={form.email}
                      onChange={handleChange}
                    />

                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={6}
                          placeholder="Min. 6 characters"
                          value={form.password}
                          onChange={handleChange}
                          className="w-full pl-10 pr-10 py-3 bg-muted rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-hero rounded-xl font-semibold text-primary-foreground hover:opacity-90 transition-opacity text-sm shadow-md disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                    >
                      {loading ? "Please wait..." : "Log In"}
                    </button>
                  </form>

                  <div className="mt-5 text-center">
                    <p className="text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <button
                        onClick={switchToSignup}
                        className="text-primary font-semibold hover:underline"
                      >
                        Sign Up
                      </button>
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : signupStep === "role" ? (
              <motion.div
                key="signup-role"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-5 sm:space-y-6"
              >
                <div className="text-center">
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-secondary-foreground mb-1.5">
                    Create Account
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Choose your account type to get started
                  </p>
                </div>

                {/* Role cards — stack on very small screens, side-by-side otherwise */}
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
                  {(Object.keys(roleConfig) as Role[]).map((r) => {
                    const cfg = roleConfig[r];
                    return (
                      <button
                        key={r}
                        onClick={() => {
                          setSignupRole(r);
                          setSignupStep("form");
                        }}
                        className="bg-card rounded-2xl p-4 sm:p-6 text-left border-2 border-border hover:border-primary/40 hover:shadow-elevated transition-all duration-200 group"
                      >
                        <div
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}
                        >
                          <cfg.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                        </div>
                        <h3 className="font-display font-bold text-foreground mb-1 text-sm sm:text-base">
                          {cfg.label}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {cfg.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      onClick={switchToLogin}
                      className="text-primary font-semibold hover:underline"
                    >
                      Log In
                    </button>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`signup-form-${signupRole}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 sm:space-y-6"
              >
                <button
                  onClick={() => setSignupStep("role")}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Change role
                </button>

                {signupRole && (
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleConfig[signupRole].gradient} flex items-center justify-center flex-shrink-0`}
                    >
                      {signupRole === "customer" ? (
                        <UserCircle className="w-5 h-5 text-primary-foreground" />
                      ) : (
                        <Car className="w-5 h-5 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Signing up as</p>
                      <p className="font-display font-bold text-foreground">
                        {roleConfig[signupRole].label}
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-elevated border border-border">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <InputField
                      label="Full Name"
                      name="full_name"
                      placeholder="John Doe"
                      icon={User}
                      required
                      value={form.full_name}
                      onChange={handleChange}
                    />
                    <InputField
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      icon={Phone}
                      value={form.phone}
                      onChange={handleChange}
                    />

                    {signupRole === "driver" && (
                      <>
                        <div className="pt-1 pb-1">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs font-medium text-muted-foreground px-2">
                              Driver Documents
                            </span>
                            <div className="h-px flex-1 bg-border" />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                            Aadhaar Number
                          </label>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              name="aadhaar_number"
                              type="text"
                              inputMode="numeric"
                              required
                              maxLength={14}
                              placeholder="1234 5678 9012"
                              value={form.aadhaar_number}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
                                const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
                                setForm((prev) => ({ ...prev, aadhaar_number: formatted }));
                              }}
                              className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all tracking-widest font-mono"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            12-digit unique identification number
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                            Driving License Number
                          </label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              name="license_number"
                              type="text"
                              required
                              placeholder="MH-01-20230012345"
                              value={form.license_number}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  license_number: e.target.value.toUpperCase(),
                                }))
                              }
                              className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all uppercase"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            As printed on your driving license
                          </p>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
                          <div className="w-4 h-4 mt-0.5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Your documents will be verified by our admin team before you can accept
                            jobs. You'll be notified once verified.
                          </p>
                        </div>
                      </>
                    )}

                    <InputField
                      label="Email Address"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      icon={Mail}
                      required
                      value={form.email}
                      onChange={handleChange}
                    />

                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={6}
                          placeholder="Min. 6 characters"
                          value={form.password}
                          onChange={handleChange}
                          className="w-full pl-10 pr-10 py-3 bg-muted rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-hero rounded-xl font-semibold text-primary-foreground hover:opacity-90 transition-opacity text-sm shadow-md disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                    >
                      {loading
                        ? "Please wait..."
                        : `Create ${signupRole ? roleConfig[signupRole].label : ""} Account`}
                    </button>
                  </form>

                  <div className="mt-5 text-center">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <button
                        onClick={switchToLogin}
                        className="text-primary font-semibold hover:underline"
                      >
                        Log In
                      </button>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}