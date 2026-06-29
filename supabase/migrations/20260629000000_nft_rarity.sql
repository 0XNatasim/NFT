-- Store OpenSea rarity ranks and optional deal rarity targeting.

alter table trade_offer_nfts
  add column if not exists rarity_rank integer check (rarity_rank is null or rarity_rank > 0);

alter table trade_offers
  add column if not exists required_max_rarity_rank integer check (required_max_rarity_rank is null or required_max_rarity_rank > 0);
