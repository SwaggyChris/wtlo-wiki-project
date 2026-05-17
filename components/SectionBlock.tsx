export function SectionBlock({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-zinc-200 py-12 last:border-b-0 sm:py-16 xl:py-20">
      <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 xl:gap-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500 sm:text-xs">{eyebrow}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 sm:mt-4 sm:text-3xl lg:text-4xl 2xl:text-5xl">{title}</h2>
        </div>
        <div className="space-y-5 text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8 xl:text-lg xl:leading-9">{children}</div>
      </div>
    </section>
  );
}