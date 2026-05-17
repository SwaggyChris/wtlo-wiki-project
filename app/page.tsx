import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SectionBlock } from "@/components/SectionBlock";

const shellClass = "mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 2xl:max-w-[1800px] 2xl:px-10";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f4f4f0] text-zinc-900">
      <div className="absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f4f4f0_60%,#f4f4f0_100%)] sm:h-[420px] lg:h-[460px]" />
      <main className={`${shellClass} relative pb-0 pt-32 sm:pt-36 xl:pt-36`}>
        <section className="border-b border-zinc-200 pb-12 pt-6 sm:pb-16 sm:pt-10 xl:pb-20">
          <div className="max-w-5xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500 sm:text-xs">Welcome</p>
            <h1 className="mt-3 max-w-5xl text-3xl font-semibold tracking-tight text-zinc-950 sm:mt-4 sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-[5rem]">Welcome to WTLO Wiki.</h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-600 sm:mt-8 sm:text-base sm:leading-8 xl:text-lg xl:leading-9">A dedicated platform for Will To Live Online players built to organize game knowledge, explain systems clearly, and make it easier to explore items, maps, guides, and community resources in one place.</p>
            <div className="mt-8 flex flex-col items-start gap-4 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
              <Link href="/database" className="inline-flex items-center gap-2 border-b border-zinc-950 pb-1 text-sm font-semibold text-zinc-950">Browse WTLO Database<ArrowRight className="h-4 w-4" /></Link>
              <Link href="/signup" className="inline-flex items-center gap-2 border-b border-transparent pb-1 text-sm font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950">Create Account</Link>
            </div>
          </div>
        </section>
        <SectionBlock eyebrow="About WTLO Wiki" title="A focused wiki platform built around the needs of WTLO players.">
          <p>WTLO Wiki is intended to be a central destination for learning the game, understanding important systems, and discovering reliable information without needing to search across scattered community posts.</p>
          <p>The platform is designed to connect item data, map information, route planning, progression help, guide content, and community knowledge in a single polished website experience.</p>
        </SectionBlock>
        <SectionBlock eyebrow="About the Game" title="Will To Live Online and the features that define its survival experience.">
          <p>Will To Live Online is a survival-focused online game built around exploration, dangerous regions, combat readiness, gear progression, and the constant challenge of surviving hostile environments. Players travel through risky areas, collect resources, fight enemies, improve equipment, and develop their own approach to progression.</p>
          <p>The game stands out through its atmosphere, open-world movement, PvE and PvP tension, faction identity, weapon and armor systems, map-based route knowledge, farming efficiency, and the need to understand where to go and how to prepare.</p>
          <p>Because the game relies so heavily on knowledge, positioning, and preparation, a dedicated wiki becomes especially valuable for both new and experienced players.</p>
        </SectionBlock>
        <SectionBlock eyebrow="What WTLO Wiki Has" title="Tools, pages, and resources designed to make WTLO knowledge easier to use.">
          <p>WTLO Wiki can offer a searchable item database, dedicated map pages, guide collections, progression articles, faction explanations, community updates, and future account-based features such as saved routes, bookmarked items, and contributor tools.</p>
          <p>The aim is not only to collect information, but to organize it in a way that feels premium, readable, and genuinely useful for players who want faster access to trustworthy knowledge.</p>
        </SectionBlock>
        <Footer />
      </main>
    </div>
  );
}