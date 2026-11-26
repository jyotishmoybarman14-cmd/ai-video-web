import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6 bg-[#121217] border border-zinc-800/90 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Terms &amp; Conditions</h1>
              <p className="text-xs text-zinc-400">Wobi AI Zero-Budget Video Studio</p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Studio
          </Link>
        </div>

        <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
          <section className="space-y-1.5">
            <h2 className="text-base font-semibold text-white">1. Service Scope</h2>
            <p className="text-zinc-400">
              Wobi AI prompts ke basis par free Hugging Face models ya local canvas motion engine ke zariye video/scene preview aur WebM/PNG export ki suvidha deta hai. Free tier availability aur model response time external providers par depend karte hain.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-base font-semibold text-white">2. Acceptable Use</h2>
            <p className="text-zinc-400">
              Users illegal, harmful, abusive, non-consensual, ya copyright-infringing prompts aur content generate karne ke liye Wobi AI ka istemal nahi karenge. Apne prompts aur generated exports ki zimmedari user ki hogi.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-base font-semibold text-white">3. Privacy &amp; Data</h2>
            <p className="text-zinc-400">
              Aapke prompts sirf generation request process karne ke liye use hote hain. Local canvas rendering aur WebM/PNG recording aapke browser mein hoti hai.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-base font-semibold text-white">4. Disclaimer</h2>
            <p className="text-zinc-400">
              Yeh service &ldquo;as is&rdquo; aur &ldquo;as available&rdquo; basis par di ja rahi hai. Kisi bhi downtime, model change, ya data loss ke liye koi warranty nahi di jaati.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
