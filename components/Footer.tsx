import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { socialLinks, usefulResources } from "@/data/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-transparent pt-10 text-zinc-900 sm:mt-20 sm:pt-12 xl:mt-24 xl:pt-14">
      <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-[1.1fr_0.9fr_0.8fr_0.9fr] xl:gap-12">
        <div className="sm:col-span-2 xl:col-span-1">
          <BrandLogo />
          <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600 sm:mt-5">WTLO Wiki is built as a clean, database-driven knowledge platform for Will To Live Online, combining game information, map support, guides, and community-driven learning into one experience.</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500 sm:text-xs">Social Media</p>
          <div className="mt-4 space-y-3 sm:mt-5">
            {socialLinks.map((item) => {
              const Icon = item.icon;
              return <a key={item.label} href={item.href} className="flex items-center gap-3 text-sm font-medium text-zinc-700 transition hover:text-zinc-950"><Icon className="h-4 w-4" /><span>{item.label}</span></a>;
            })}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500 sm:text-xs">Useful Resources</p>
          <div className="mt-4 space-y-3 sm:mt-5">
            {usefulResources.map((item) => {
              const Icon = item.icon;
              return <Link key={item.label} href={item.href} className="flex items-center gap-2 text-sm font-medium text-zinc-700 transition hover:text-zinc-950"><Icon className="h-4 w-4 flex-none" /><span>{item.label}</span></Link>;
            })}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500 sm:text-xs">Credits</p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-zinc-600 sm:mt-5">
            <p>Website concept and structure crafted for the WTLO Wiki project vision.</p>
            <p>Game universe reference: Will To Live Online.</p>
            <p>Designed to support future map systems, item databases, guides, and community content.</p>
          </div>
        </div>
      </div>
      <div className="mt-10 border-t border-zinc-200 pt-5 text-xs text-zinc-500 sm:mt-12 sm:pt-6 sm:text-sm">© 2026 WTLO Wiki. Crafted for a premium community knowledge experience.</div>
    </footer>
  );
}