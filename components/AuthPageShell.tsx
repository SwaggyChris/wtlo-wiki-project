import type { ReactNode } from "react";
import BackToMainButton from "@/components/BackToMainButton";

export default function AuthPageShell({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f4f0] text-zinc-900">
      <main className="w-full px-4 py-10 sm:px-6 lg:px-10 xl:px-14 xl:py-14 2xl:px-20">
        <div className="mb-10 flex justify-start">
          <BackToMainButton />
        </div>

        <div className="mx-auto max-w-screen-xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_520px] lg:items-start">
            <section className="border-b border-zinc-200 pb-10 lg:border-b-0 lg:pb-0">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                {eyebrow}
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-600 sm:text-lg">
                {text}
              </p>
            </section>

            <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-8">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}