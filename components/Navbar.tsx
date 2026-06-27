"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { navItems } from "@/data/site";
import { BrandLogo } from "@/components/BrandLogo";

function currentPageFromPath(pathname: string) {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/database")) return "database";
  if (pathname.startsWith("/map")) return "map";
  if (pathname.startsWith("/community")) return "community";
  if (pathname.startsWith("/about")) return "about";
  if (pathname.startsWith("/login")) return "login";
  if (pathname.startsWith("/signup")) return "signup";
  return "home";
}

export function Navbar() {
  const pathname = usePathname();
  const currentPage = currentPageFromPath(pathname);
  const routeItems = useMemo(() => navItems, []);
  const [isScrolled, setIsScrolled] = useState(false);
  const [pillStyle, setPillStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const buttonRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const isHome = currentPage === "home";
  const showBar = !isHome || isScrolled || mobileMenuOpen;

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const activeId = isHome ? null : currentPage;
    const el = activeId ? buttonRefs.current[activeId] : null;

    if (!el) {
      setPillStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const updatePill = () => {
      setPillStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
        opacity: 1,
      });
    };

    updatePill();
    window.addEventListener("resize", updatePill);
    return () => window.removeEventListener("resize", updatePill);
  }, [currentPage, isHome]);

  return (
    <motion.div
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-4 sm:px-4"
    >
      <motion.nav
        animate={{
          width: showBar ? "min(1120px, 100%)" : "min(1240px, 100%)",
          y: isScrolled ? -2 : 0,
          boxShadow: showBar
            ? "0 18px 60px rgba(0,0,0,0.12)"
            : "0 0 0 rgba(0,0,0,0)",
          borderRadius: mobileMenuOpen ? 28 : 999,
          backgroundColor: showBar
            ? "rgba(255,255,255,0.94)"
            : "rgba(255,255,255,0)",
          borderColor: showBar
            ? "rgba(0,0,0,0.05)"
            : "rgba(0,0,0,0)",
        }}
        transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className={`relative mx-auto max-w-full border px-2.5 py-1.5 ${
          showBar ? "backdrop-blur-xl" : "backdrop-blur-0"
        }`}
      >
        <div className="flex min-h-[52px] items-center justify-between gap-2 sm:min-h-[58px] sm:gap-3">
          <div className="min-w-0 flex-1 lg:flex-none">
            <Link href="/" className="max-w-full text-left">
              <BrandLogo />
            </Link>
          </div>

          <div className="relative hidden items-center gap-1 rounded-full px-1 lg:flex">
            <motion.div
              animate={{
                left: pillStyle.left,
                width: pillStyle.width,
                opacity: !isHome && isScrolled ? pillStyle.opacity : 0,
                boxShadow:
                  !isHome && isScrolled
                    ? "0 8px 20px rgba(0,0,0,0.08)"
                    : "0 0 0 rgba(0,0,0,0)",
                backgroundColor:
                  !isHome && isScrolled
                    ? "rgba(255,255,255,0.96)"
                    : "rgba(255,255,255,0)",
              }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="absolute inset-y-1 rounded-full"
            />

            {routeItems.map((item) => {
              const Icon = item.icon;
              const selected = currentPage === item.id;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  ref={(el) => {
                    buttonRefs.current[item.id] = el;
                  }}
                  className="relative z-10 flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium tracking-tight text-zinc-700 xl:px-5"
                >
                  <Icon className="h-4 w-4" />
                  <span className={selected ? "text-zinc-950" : ""}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:flex lg:min-w-[172px] lg:justify-end" aria-hidden="true" />

          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
                showBar
                  ? "border border-zinc-200 bg-white text-zinc-800"
                  : "border border-transparent bg-transparent text-zinc-900"
              }`}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden lg:hidden"
            >
              <div className="mt-2 border-t border-zinc-200 px-1 pt-3">
                <div className="px-3 pb-3 pt-1 sm:px-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                    Navigation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Explore WTLO Wiki pages and resources in one mobile menu.
                  </p>
                </div>

                <div className="space-y-2.5 px-1 pb-3 sm:px-2">
                  {routeItems.map((item) => {
                    const Icon = item.icon;
                    const selected = currentPage === item.id;

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition ${
                          selected
                            ? "border-zinc-950 bg-zinc-950 text-white"
                            : "border-zinc-200 bg-zinc-50/80 text-zinc-800"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    );
                  })}
                </div>


              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </motion.div>
  );
}