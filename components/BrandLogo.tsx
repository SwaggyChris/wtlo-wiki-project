import Image from "next/image";

export function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      <Image src="/wtlo-logo.png" alt="WTLO logo" width={56} height={56} className={`h-10 w-10 flex-none object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.12)] sm:h-12 sm:w-12 md:h-14 md:w-14 ${light ? "" : "invert"}`} priority />
      <div className="min-w-0">
        <p className={`truncate text-[17px] font-semibold tracking-tight sm:text-[19px] ${light ? "text-white" : "text-zinc-950"}`}>WTLO Wiki</p>
      </div>
    </div>
  );
}