import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "customer" | "driver" | "admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    try {
      // attempt to read from metadata first, since the database row is
      // inserted via a trigger using the same metadata. this avoids timing
      // issues when a user logs in immediately after signing up.
      const { data: userData } = await supabase.auth.getUser();
      const metaRole = userData?.user?.user_metadata?.role as AppRole | undefined;
      if (metaRole) {
        setRole(metaRole);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is for no rows found
        console.error('Error fetching user role:', error);
      }
      
      setRole((data?.role as AppRole) ?? null);
    } catch (err) {
      console.error('Unexpected error fetching user role:', err);
      setRole(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const meta = session.user.user_metadata?.role as AppRole | undefined;
          if (meta) {
            setRole(meta);
          } else {
            await fetchRole(session.user.id);
          }
        } else {
          setRole(null);
        }
        setLoading(false);
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const meta = session.user.user_metadata?.role as AppRole | undefined;
        if (meta) {
          setRole(meta);
        } else {
          fetchRole(session.user.id);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
