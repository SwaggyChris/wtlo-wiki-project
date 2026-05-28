import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import AppShell from "@/components/AppShell";


export const metadata = {
  title: "WTLO Wiki",
  icons: {
    icon: "/favicon.ico?v=20",
    shortcut: "/favicon.ico?v=20",
    apple: "/favicon.ico?v=20",
  },
};


export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}