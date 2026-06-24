import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Handshake, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function WhyHandshakePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-monad-purple/20 bg-gradient-to-br from-monad-purple/15 via-fuchsia-500/10 to-cyan-400/10 px-5 py-14 shadow-2xl shadow-monad-purple/10 md:px-8">
        <div className="pointer-events-none absolute right-10 top-8 h-28 w-28 rounded-full bg-fuchsia-400/20 blur-2xl" />
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-monad-purple/30 bg-monad-purple/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-monad-purple">
          <Handshake className="h-3.5 w-3.5" /> Human NFT deals
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Why Handshake Exists
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-foreground/85">
          Handshake is for public or private NFT negotiation that feels human,
          direct, and safe — with atomic settlement when both wallets agree.
        </p>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <InfoCard
          icon={<Sparkles className="h-5 w-5" />}
          title="The problem with NFT marketplaces"
          points={[
            "Bots and snipers dominate public listings.",
            "NFT-for-NFT negotiation usually happens off-platform in Discord, Telegram, or X.",
            "Trust is fragile when deals are negotiated manually.",
            "Most marketplaces are optimized for listings, not human deals.",
          ]}
        />
        <InfoCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="How Handshake fixes it"
          points={[
            "Public deals for open discovery.",
            "Private offers for wallet-to-wallet negotiation.",
            "NFT-for-NFT swaps and custom deals with NFTs + MON.",
            "Atomic settlement: one transaction swaps everything or nothing.",
            "Zero custody: NFTs stay in wallets until execution.",
          ]}
        />
        <InfoCard
          icon={<Zap className="h-5 w-5" />}
          title="Why Monad?"
          points={[
            "Fast settlement for responsive trading experiences.",
            "Lower-cost execution so collectors hesitate less.",
            "EVM-compatible wallet experience and smart contract patterns.",
          ]}
        />
      </div>

      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/create"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-monad-purple to-fuchsia-400 px-8 text-base font-medium text-primary-foreground shadow-lg shadow-monad-purple/20 transition-colors hover:from-monad-purple/90 hover:to-fuchsia-400/90"
        >
          Propose a deal <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-md border border-monad-purple/50 px-8 text-base font-medium text-foreground transition-colors hover:bg-monad-purple/10"
        >
          Browse the market
        </Link>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  points,
}: {
  icon: ReactNode;
  title: string;
  points: string[];
}) {
  return (
    <Card className="border-monad-purple/20 bg-card/60 backdrop-blur transition-all hover:-translate-y-1 hover:border-monad-purple/50 hover:shadow-2xl hover:shadow-monad-purple/15">
      <CardContent className="p-6">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-monad-purple/15 text-monad-purple">
          {icon}
        </div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">{title}</h2>
        <ul className="space-y-3 text-sm leading-6 text-foreground/85">
          {points.map((point) => (
            <li key={point} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-monad-purple" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
