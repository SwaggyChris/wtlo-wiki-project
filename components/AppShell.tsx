"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const pagesWithoutNavbar = [
    "/database",
    "/map",
    "/community",
    "/about",
    "/login",
    "/signup",
  ];

  const shouldHideNavbar = pagesWithoutNavbar.includes(pathname);

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      {children}
    </>
  );
}