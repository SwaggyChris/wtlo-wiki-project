import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackToMainButton() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-black/10"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to main page
    </Link>
  );
}