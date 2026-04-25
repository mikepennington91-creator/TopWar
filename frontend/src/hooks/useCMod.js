import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const CMOD_DURATION_MS = 60 * 1000; // 60 seconds

const CModContext = createContext({
  cmodEnabled: false,
  enableCMod: () => {},
  disableCMod: () => {},
});

export function CModProvider({ children }) {
  const [cmodEnabled, setCmodEnabled] = useState(false);
  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const disableCMod = useCallback(() => {
    clearTimer();
    setCmodEnabled(false);
    localStorage.removeItem("cmod_enabled");
    localStorage.removeItem("cmod_expires");
    document.documentElement.classList.remove("cmod-theme");
  }, [clearTimer]);

  const startTimer = useCallback((remaining) => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      disableCMod();
    }, remaining);
  }, [clearTimer, disableCMod]);

  // On mount: only restore CMod if Sian is logged in AND time hasn't expired
  useEffect(() => {
    const stored = localStorage.getItem("cmod_enabled");
    const expires = parseInt(localStorage.getItem("cmod_expires") || "0", 10);
    const currentUser = (localStorage.getItem("moderator_username") || "").toLowerCase();

    if (stored === "true" && currentUser === "sian") {
      const remaining = expires - Date.now();
      if (remaining > 0) {
        setCmodEnabled(true);
        document.documentElement.classList.add("cmod-theme");
        startTimer(remaining);
      } else {
        // Expired — clean up
        localStorage.removeItem("cmod_enabled");
        localStorage.removeItem("cmod_expires");
      }
    } else if (stored === "true") {
      // Not Sian — clean up stale CMod state
      localStorage.removeItem("cmod_enabled");
      localStorage.removeItem("cmod_expires");
    }

    return () => clearTimer();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const enableCMod = useCallback(() => {
    setCmodEnabled(true);
    localStorage.setItem("cmod_enabled", "true");
    localStorage.setItem("cmod_expires", String(Date.now() + CMOD_DURATION_MS));
    document.documentElement.classList.add("cmod-theme");
    startTimer(CMOD_DURATION_MS);
  }, [startTimer]);

  return (
    <CModContext.Provider value={{ cmodEnabled, enableCMod, disableCMod }}>
      {children}
    </CModContext.Provider>
  );
}

export function useCMod() {
  return useContext(CModContext);
}
