import { createContext, useContext, useState, useEffect, useCallback } from "react";

const CModContext = createContext({
  cmodEnabled: false,
  enableCMod: () => {},
  disableCMod: () => {},
});

export function CModProvider({ children }) {
  const [cmodEnabled, setCmodEnabled] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("cmod_enabled");
    if (stored === "true") {
      setCmodEnabled(true);
      document.documentElement.classList.add("cmod-theme");
    }
  }, []);

  const enableCMod = useCallback(() => {
    setCmodEnabled(true);
    localStorage.setItem("cmod_enabled", "true");
    document.documentElement.classList.add("cmod-theme");
  }, []);

  const disableCMod = useCallback(() => {
    setCmodEnabled(false);
    localStorage.removeItem("cmod_enabled");
    document.documentElement.classList.remove("cmod-theme");
  }, []);

  return (
    <CModContext.Provider value={{ cmodEnabled, enableCMod, disableCMod }}>
      {children}
    </CModContext.Provider>
  );
}

export function useCMod() {
  return useContext(CModContext);
}
