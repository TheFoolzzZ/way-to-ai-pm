// hooks/useAuth.ts
"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type UnlockErrorCode =
  | "TOKEN_NOT_FOUND"
  | "TOKEN_ALREADY_BOUND"
  | "INVALID_INPUT"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

type AuthUser = { id: string; username: string };

type UnlockResult =
  | { success: true; user: AuthUser }
  | { success: false; error: UnlockErrorCode };

type AuthContextValue = {
  isReady: boolean;
  isUnlocked: boolean;
  user: AuthUser | null;
  unlock: (token: string, username: string) => Promise<UnlockResult>;
  logout: () => void;
};

const AUTH_CHANGE_EVENT = "auth-state-change";
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const sync = () =>
      fetch("/api/auth/me", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!mounted) return;
          if (data?.userId && data?.username) {
            setUser({ id: data.userId, username: data.username });
          } else {
            setUser(null);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (mounted) setReady(true);
        });

    sync();
    const onChange = () => sync();
    window.addEventListener(AUTH_CHANGE_EVENT, onChange);
    return () => {
      mounted = false;
      window.removeEventListener(AUTH_CHANGE_EVENT, onChange);
    };
  }, []);

  const unlock = useCallback(async (token: string, username: string): Promise<UnlockResult> => {
    const safeToken = token.trim();
    const safeUsername = username.trim();
    if (!safeToken || !safeUsername) return { success: false, error: "INVALID_INPUT" };
    try {
      const response = await fetch("/api/auth/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: safeToken, username: safeUsername }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        const error = (payload?.error as UnlockErrorCode | undefined) ?? "UNKNOWN_ERROR";
        return { success: false, error };
      }
      const nextUser: AuthUser = { id: payload.user.id, username: payload.user.username };
      setUser(nextUser);
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
      return { success: true, user: nextUser };
    } catch {
      return { success: false, error: "NETWORK_ERROR" };
    }
  }, []);

  const logout = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      setUser(null);
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isReady, isUnlocked: Boolean(user), user, unlock, logout }),
    [isReady, user, unlock, logout]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
