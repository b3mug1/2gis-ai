import Link from "next/link";
import { ArrowRight, MapPin, Search, Sparkles } from "lucide-react";

const highlights = [
  "Natural-language search across real places",
  "AI ranking based on intent, budget, and reviews",
  "Favorites, history, and statistics in one flow",
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_35%),linear-gradient(180deg,_#050816_0%,_#0b1020_100%)] text-white">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:48px_48px]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-10 lg:px-12">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          AI City Guide backend connected
        </div>

        <div className="mt-8 grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <section>
            <div className="flex items-center gap-3 text-cyan-200/90">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-[0.32em]">City Guide AI</span>
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Find the right place in Astana using plain language.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
              Ask for sushi under budget, a quiet cafe for work, a romantic dinner, or a group restaurant with parking.
              The app extracts intent, queries real places, scores the results, and returns a structured recommendation.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/chat"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
              >
                Open the app
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/78 backdrop-blur">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-white/55">Sample request</p>
                <p className="mt-1 text-xl font-semibold">I want delicious sushi near Astana IT University under 10000 KZT.</p>
              </div>
              <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-200">
                <Search className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/80">Top recommendation</p>
                <p className="mt-2 text-lg font-semibold">Ranked result, reviews summarized, confidence scored</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-white/75">
                The backend is exposed on the API port configured in the stack, and the frontend will call it through the Next.js client.
              </div>
              <Link
                href="/chat"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-4 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
              >
                Start a search
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
