import type { LucideIcon } from "lucide-react";

export function FeatureColumns({ items }: { items: { icon: LucideIcon; title: string; text: string }[] }) {
  return (
    <div className="grid gap-10 py-12 sm:grid-cols-2 sm:gap-12 sm:py-14 xl:grid-cols-3 xl:py-16">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="max-w-xl">
            <Icon className="h-6 w-6 text-zinc-700" />
            <h3 className="mt-4 text-xl font-semibold text-zinc-950 xl:text-2xl">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8">{item.text}</p>
          </div>
        );
      })}
    </div>
  );
}