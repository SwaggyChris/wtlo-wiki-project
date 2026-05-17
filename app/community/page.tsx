import { BookOpen, MessageCircle, Users } from "lucide-react";
import InnerPageShell from "@/components/InnerPageShell";

export default function CommunityPage() {
  return (
    <InnerPageShell
      eyebrow="Community"
      title="A separate community page for guides, creators, updates, and contributions."
      text="This page is designed for community-driven content such as featured guides, contributor pages, patch notes, event posts, creator showcases, and future interaction features."
    >
      <section className="grid gap-10 border-b border-zinc-200 py-12 lg:grid-cols-3">
        <div>
          <BookOpen className="h-6 w-6 text-zinc-700" />
          <h3 className="mt-4 text-2xl font-semibold text-zinc-950">Guides</h3>
          <p className="mt-3 text-base leading-8 text-zinc-600">
            Beginner help, advanced strategies, build advice, and progression
            walkthroughs can live here.
          </p>
        </div>

        <div>
          <Users className="h-6 w-6 text-zinc-700" />
          <h3 className="mt-4 text-2xl font-semibold text-zinc-950">
            Creators
          </h3>
          <p className="mt-3 text-base leading-8 text-zinc-600">
            This page can spotlight WTLO creators, contributors, and community
            authors in a cleaner format.
          </p>
        </div>

        <div>
          <MessageCircle className="h-6 w-6 text-zinc-700" />
          <h3 className="mt-4 text-2xl font-semibold text-zinc-950">
            Updates
          </h3>
          <p className="mt-3 text-base leading-8 text-zinc-600">
            Patch notes, announcements, featured posts, and important community
            information can be organized here.
          </p>
        </div>
      </section>
    </InnerPageShell>
  );
}