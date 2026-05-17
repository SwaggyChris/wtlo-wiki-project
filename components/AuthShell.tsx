import { ArrowRight, LogIn, UserPlus } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export function AuthShell({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login";
  return (
    <div className="min-h-screen bg-[#f4f4f0] px-4 py-4 pt-32 sm:px-6 sm:py-8 sm:pt-36 lg:px-8">
      <div className="mx-auto w-full max-w-screen-xl 2xl:max-w-[1600px]">
        <div className="grid min-h-[calc(100vh-10rem)] gap-4 xl:grid-cols-[1.05fr_0.95fr] xl:gap-6">
          <div className="rounded-[28px] border border-zinc-200 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-6 text-white shadow-2xl shadow-black/15 sm:rounded-[32px] sm:p-8 lg:p-10 xl:rounded-[36px]">
            <BrandLogo light />
            <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-zinc-500 sm:mt-8 sm:text-xs">{isLogin ? "Login Page" : "Sign Up Page"}</p>
            <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{isLogin ? "Welcome back to WTLO Wiki." : "Join the WTLO Wiki community."}</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400 sm:mt-5 sm:text-base sm:leading-8">{isLogin ? "Access your profile, saved routes, bookmarked items, and community dashboard." : "Create an account to save database filters, contribute guides, track builds, and participate in the WTLO community hub."}</p>
          </div>
          <div className="flex items-stretch xl:items-center">
            <div className="w-full rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:rounded-[32px] sm:p-8 lg:p-10 xl:rounded-[36px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500 sm:text-xs">{isLogin ? <LogIn className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}{isLogin ? "Account Login" : "Create Account"}</div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-950 sm:mt-6 sm:text-3xl">{isLogin ? "Login" : "Sign Up"}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600">{isLogin ? "Enter your account details to continue." : "Set up your WTLO Wiki account in a few steps."}</p>
              <form className="mt-6 space-y-4 sm:mt-8">
                {!isLogin && <div><label className="mb-2 block text-sm font-medium text-zinc-700">Username</label><input type="text" placeholder="SwaggyChris" className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 focus:bg-white" /></div>}
                <div><label className="mb-2 block text-sm font-medium text-zinc-700">Email</label><input type="email" placeholder="you@example.com" className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 focus:bg-white" /></div>
                <div><label className="mb-2 block text-sm font-medium text-zinc-700">Password</label><input type="password" placeholder="••••••••" className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 focus:bg-white" /></div>
                {!isLogin && <div><label className="mb-2 block text-sm font-medium text-zinc-700">Confirm Password</label><input type="password" placeholder="••••••••" className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 focus:bg-white" /></div>}
                <button type="button" className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-black/10">{isLogin ? "Login to WTLO Wiki" : "Create WTLO Wiki Account"}<ArrowRight className="h-4 w-4" /></button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}