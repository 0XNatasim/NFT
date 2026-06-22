import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Header } from "@/components/layout/header";
import { NetworkGuard } from "@/components/wallet/network-guard";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Handshake — P2P NFT Trading on Monad",
  description:
    "Trade NFTs wallet-to-wallet on Monad — no bots, no snipers. NFT-for-NFT, NFT+MON, private offers. Atomic settlement, zero custody.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <NetworkGuard />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-border py-8">
              <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                Handshake — peer-to-peer NFT trading on Monad. No bots, no
                custody, atomic settlement.
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
