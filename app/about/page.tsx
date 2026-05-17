import { ArrowRight, Info, Swords } from "lucide-react";
import InnerPageShell from "@/components/InnerPageShell";

export default function AboutPage() {
  return (
    <InnerPageShell
      eyebrow="About Us"
      title="A separate page explaining the WTLO Wiki mission and long-term vision."
      text="This page is dedicated to the purpose behind WTLO Wiki, its goals, contributors, roadmap, and the value it aims to bring to the Will To Live Online community."
    >
      <section className="grid gap-10 border-b border-zinc-200 py-12 lg:grid-cols-3">
        <div>
          <Info className="h-6 w-6 text-zinc-700" />
          <h3 className="mt-4 text-2xl font-semibold text-zinc-950">
            Mission
          </h3>
          <p className="mt-3 text-base leading-8 text-zinc-600">
            To build a premium knowledge hub that makes WTLO information clearer,
            faster to find, and easier to trust.
          </p>
        </div>

        <div>
          <Swords className="h-6 w-6 text-zinc-700" />
          <h3 className="mt-4 text-2xl font-semibold text-zinc-950">
            Community Value
          </h3>
          <p className="mt-3 text-base leading-8 text-zinc-600">
            The wiki is meant to support both new players learning the game and
            experienced players refining routes, builds, and knowledge.
          </p>
        </div>

        <div>
          <ArrowRight className="h-6 w-6 text-zinc-700" />
          <h3 className="mt-4 text-2xl font-semibold text-zinc-950">
            Future Growth
          </h3>
          <p className="mt-3 text-base leading-8 text-zinc-600">
            This page can later include roadmap sections, contributor credits,
            partnerships, and project development updates.
          </p>
        </div>
      </section>
    </InnerPageShell>
  );
}