import type { Metadata } from "next";
import { Providers } from "./providers";
import { Header } from "@/components/layout/header";
import { NetworkGuard } from "@/components/wallet/network-guard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Handshake: P2P NFT Trading on Monad",
  description:
    "Trade NFTs wallet-to-wallet on Monad — no bots, no snipers. NFT-for-NFT, NFT+MON, private offers. Atomic settlement, zero custody.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <NetworkGuard />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-border py-8">
              <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 text-center text-sm text-foreground sm:flex-row sm:text-left">
                <span>
                  Handshake — peer-to-peer NFT trading on Monad. No bots, no
                  custody, one-transaction settlement.
                </span>
                <div className="flex items-center gap-4 text-monad-purple">
                  <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:underline">X</a>
                  <a href="https://discord.com" target="_blank" rel="noreferrer" className="hover:underline">Discord</a>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
