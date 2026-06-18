-- ---------------------------------------------------------------------
-- Bind protocol fees into the signed order.
--
-- feeBps and flatFee are now part of the EIP-712 TradeOrder, so the fee a
-- maker and taker agree to is fixed at signing time and the contract owner
-- can never change it on an already-signed order. Persist both so the order
-- can be reconstructed and settled exactly as signed.
-- ---------------------------------------------------------------------

alter table trade_offers
    add column if not exists fee_bps  integer        not null default 100,
    add column if not exists flat_fee numeric(78, 0) not null default 0;
