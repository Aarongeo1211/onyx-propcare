"use client";

import { useLayout } from "@/components/providers/layout-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export function LayoutShell({
  children,
  availableTypes,
}: {
  children: React.ReactNode;
  availableTypes?: string[];
}) {
  const { isDashboard } = useLayout();

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer availableTypes={availableTypes} />
    </>
  );
}
