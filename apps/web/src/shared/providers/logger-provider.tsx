import { createContext, useContext, useEffect } from "react";

import { useAuth } from "@tans/auth/react/tanstack-start/hooks";
import { clearIdentity, log, setIdentity } from "@tans/logger/client";

type LoggerContextValue = {
  logger: typeof log;
};

const LoggerContext = createContext<LoggerContextValue | null>(null);

export function LoggerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setIdentity({ user: { id: user.id } });
    } else {
      setIdentity({ user: { id: "anonymous" } });
    }

    return () => {
      clearIdentity();
    };
  }, [user]);

  return <LoggerContext.Provider value={{ logger: log }}>{children}</LoggerContext.Provider>;
}

export function useLogger(): typeof log {
  const context = useContext(LoggerContext);
  if (!context) {
    log.warn("logger-provider", "Called outside of LoggerProvider");
    return log;
  }
  return context.logger;
}
