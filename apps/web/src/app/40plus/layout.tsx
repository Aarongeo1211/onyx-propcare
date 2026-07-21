"use client";

import { useEffect } from "react";
import { useLayout } from "@/components/providers/layout-provider";

export default function FortyPlusLayout({ children }: { children: React.ReactNode }) {
  const { setIsDashboard } = useLayout();

  useEffect(() => {
    setIsDashboard(true);
    return () => setIsDashboard(false);
  }, [setIsDashboard]);

  return <>{children}</>;
}
