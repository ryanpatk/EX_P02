import { createContext, useContext, useEffect, useState } from "react";
import supabase from "../supabase";
import { Session } from "@supabase/supabase-js";

type SessionContextValue = {
  session: Session | null;
  /** True after initial session is read from storage (avoids flash on protected routes). */
  authHydrated: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider for this app
export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === null) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

type Props = { children: React.ReactNode };
export const SessionProvider = ({ children }: Props) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authHydrated, setAuthHydrated] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthHydrated(true);
    });

    const authStateListener = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setAuthHydrated(true);
      },
    );

    return () => {
      authStateListener.data.subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, authHydrated }}>
      {children}
    </SessionContext.Provider>
  );
};
