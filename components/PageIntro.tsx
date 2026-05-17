export function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="border-b border-zinc-200 pb-8 sm:pb-10 lg:pb-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500 sm:text-xs">{eyebrow}</p>
      <h1 className="mt-3 max-w-5xl text-3xl font-semibold tracking-tight text-zinc-950 sm:mt-4 sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl">{title}</h1>
      <p className="mt-5 max-w-4xl text-sm leading-7 text-zinc-600 sm:mt-6 sm:text-base sm:leading-8 xl:text-lg xl:leading-9">{text}</p>
    </div>
  );
}