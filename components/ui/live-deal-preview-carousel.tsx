'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { FEATURED_COLLECTIONS, type FeaturedCollection } from '@/lib/featured-collections';

export default function LiveDealPreviewCarousel() {
  const collections = FEATURED_COLLECTIONS.slice(0, 6); // show first 6 as examples

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* optional background blur */}
      <div className="absolute -inset-6 rounded-[2rem] bg-monad-purple/20 blur-3xl" />
      <Card className="relative overflow-hidden border-monad-purple/30 bg-gradient-to-br from-card/95 via-monad-purple/10 to-cyan-400/10 shadow-2xl shadow-monad-purple/10">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-monad-purple">
                Live deal preview
              </p>
              <h3 className="text-xl font-semibold">Human deal, wallet settled</h3>
            </div>
            <span className="rounded-full border border-monad-purple/40 bg-monad-purple/10 px-3 py-1 text-xs text-monad-purple">
              No custody
            </span>
          </div>

          <div className="overflow-x-auto whitespace-nowrap scrollbar-hidden">
            <div className="inline-flex space-x-4">
              {collections.map((collection) => (
                <div key={collection.address} className="flex-shrink-0 flex items-center gap-3 rounded-xl border border-monad-purple/20 bg-background/60 p-3">
                  {collection.logo ? (
                    <Image
                      src={collection.logo}
                      alt={collection.name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-monad-purple/20 text-lg font-bold text-monad-purple">
                      {collection.name.slice(0, 2)}
                    </div>
                  )}
                  <span className="font-medium text-foreground">{collection.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Settlement</span>
              <span className="text-monad-purple">1 transaction</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-monad-purple to-fuchsia-400" />
            </div>
            <p className="mt-2 text-xs text-foreground">
              Both wallets sign. The contract verifies ownership, approvals, and
              terms before anything moves.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}