import type { ReactNode } from "react";
import BackToMainButton from "@/components/BackToMainButton";

export default function InnerPageShell({
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
          <section className="border-b border-zinc-200 pb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
              {eyebrow}
            </p>
            <h1 className="mt-4 max-w-5xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl xl:text-7xl">
              {title}
            </h1>
            <p className="mt-6 max-w-4xl text-base leading-8 text-zinc-600 sm:text-lg">
              {text}
            </p>
          </section>

          <div className="py-12">{children}</div>
        </div>
      </main>
    </div>
  );
}