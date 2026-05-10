"use client";

import { createContext, useContext, useState } from "react";

interface LayoutContextValue {
  isDashboard: boolean;
  setIsDashboard: (v: boolean) => void;
}

const LayoutContext = createContext<LayoutContextValue>({
  isDashboard: false,
  setIsDashboard: () => {},
});

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isDashboard, setIsDashboard] = useState(false);

  return (
    <LayoutContext.Provider value={{ isDashboard, setIsDashboard }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}
