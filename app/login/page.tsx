import AuthPageShell from "@/components/AuthPageShell";

export default function LoginPage() {
  return (
    <AuthPageShell
      eyebrow="Login"
      title="Sign in to WTLO Wiki."
      text="Access your account, saved pages, future database preferences, and personalized community features."
    >
      <form className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 focus:bg-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 focus:bg-white"
          />
        </div>

        <button
          type="button"
          className="inline-flex w-full items-center justify-center rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-black/10"
        >
          Login
        </button>
      </form>
    </AuthPageShell>
  );
}