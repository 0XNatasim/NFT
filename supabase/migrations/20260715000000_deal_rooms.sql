-- Deal Rooms: private bilateral negotiation workspaces ("Live Haggle").
--
-- Design principles (see docs/deal-rooms.md):
--   * Revisions are NON-EXECUTABLE drafts. Only the final mutually-agreed
--     revision is signed as an EIP-712 TradeOrder and becomes a trade_offers
--     row (linked via deal_rooms.final_offer_id / trade_offers.deal_room_id).
--   * Revisions are append-only; a new revision invalidates all acceptances.
--   * The blockchain stays authoritative for ownership, approvals, escrow,
--     nonces, and settlement. Room state is derived from verified receipts.
--   * RLS is enabled with no public policies: all access goes through the
--     service-role API layer, which enforces participant scoping.

-- ---------------------------------------------------------------------
-- deal_rooms
-- ---------------------------------------------------------------------
create table if not exists deal_rooms (
    id                    uuid primary key default gen_random_uuid(),
    chain_id              integer not null,
    -- Participants stored in lexicographic order for deterministic pair
    -- indexing; initiated_by preserves direction.
    participant_a         text not null check (participant_a = lower(participant_a)),
    participant_b         text not null check (participant_b = lower(participant_b)),
    initiated_by          text not null check (initiated_by = lower(initiated_by)),
    source_offer_id       uuid references trade_offers (id) on delete set null,
    source_wanted_post_id uuid references wanted_posts (id) on delete set null,
    final_offer_id        uuid references trade_offers (id) on delete set null,
    current_revision_id   uuid, -- FK added after deal_room_revisions exists
    status                text not null default 'open'
                          check (status in (
                              'open',       -- negotiating (agreement progress lives in acceptances)
                              'agreed',     -- both accepted the current revision
                              'signed',     -- final EIP-712 order created (final_offer_id set)
                              'settled',    -- final offer TradeExecuted (receipt-verified)
                              'declined',   -- a participant declined
                              'cancelled',  -- closed without settling
                              'expired',    -- room expiry passed before signing
                              'superseded'  -- source offer was filled/cancelled elsewhere
                          )),
    -- Optimistic-concurrency token: every mutation checks + increments it.
    version               bigint not null default 1,
    -- Capability token for the realtime broadcast/presence channel. Only ever
    -- returned to authenticated participants.
    realtime_token        uuid not null default gen_random_uuid(),
    declined_by           text check (declined_by = lower(declined_by)),
    decline_reason        text check (decline_reason in ('price', 'items', 'not_trading', 'other')),
    signed_at             timestamptz,
    settled_at            timestamptz,
    expires_at            timestamptz not null,
    last_activity_at      timestamptz not null default now(),
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now(),
    check (participant_a < participant_b),
    check (initiated_by in (participant_a, participant_b))
);

create index if not exists idx_deal_rooms_participant_a
    on deal_rooms (participant_a, last_activity_at desc);
create index if not exists idx_deal_rooms_participant_b
    on deal_rooms (participant_b, last_activity_at desc);
create index if not exists idx_deal_rooms_status_expiry
    on deal_rooms (status, expires_at);
create index if not exists idx_deal_rooms_source_offer
    on deal_rooms (source_offer_id) where source_offer_id is not null;
create index if not exists idx_deal_rooms_final_offer
    on deal_rooms (final_offer_id) where final_offer_id is not null;

-- One live room per (pair, source offer): a second "Suggest changes" on the
-- same offer joins the existing room instead of forking negotiations.
create unique index if not exists idx_deal_rooms_active_source_pair
    on deal_rooms (chain_id, participant_a, participant_b, source_offer_id)
    where source_offer_id is not null
      and status in ('open', 'agreed', 'signed');

drop trigger if exists trg_deal_rooms_updated on deal_rooms;
create trigger trg_deal_rooms_updated before update on deal_rooms
    for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- deal_room_revisions (append-only, non-executable drafts)
-- ---------------------------------------------------------------------
create table if not exists deal_room_revisions (
    id                       uuid primary key default gen_random_uuid(),
    room_id                  uuid not null references deal_rooms (id) on delete cascade,
    revision_number          integer not null check (revision_number > 0),
    proposed_by              text not null check (proposed_by = lower(proposed_by)),
    -- Draft terms mirror the TradeOrder fields (minus nonce/signature, which
    -- exist only on the final signed order).
    maker_address            text not null check (maker_address = lower(maker_address)),
    taker_address            text not null check (taker_address = lower(taker_address)),
    maker_mon_amount         numeric(78, 0) not null default 0 check (maker_mon_amount >= 0),
    taker_mon_amount         numeric(78, 0) not null default 0 check (taker_mon_amount >= 0),
    fee_bps                  integer not null default 0 check (fee_bps between 0 and 500),
    flat_fee                 numeric(78, 0) not null default 0 check (flat_fee >= 0),
    offer_expiry             bigint not null check (offer_expiry > 0),
    -- keccak256 of the canonical draft; binds acceptances + the final order
    -- to these exact terms.
    terms_hash               text not null check (terms_hash ~ '^0x[0-9a-f]{64}$'),
    note                     text check (note is null or char_length(note) <= 240),
    created_at               timestamptz not null default now(),
    unique (room_id, revision_number),
    -- Identical re-proposals are rejected (a "counter" must change something).
    unique (room_id, terms_hash),
    check (maker_address <> taker_address)
);

create index if not exists idx_deal_room_revisions_room
    on deal_room_revisions (room_id, revision_number desc);

alter table deal_rooms
    add constraint fk_deal_rooms_current_revision
    foreign key (current_revision_id) references deal_room_revisions (id)
    on delete set null;

-- ---------------------------------------------------------------------
-- deal_room_revision_nfts (display metadata is cache-only)
-- ---------------------------------------------------------------------
create table if not exists deal_room_revision_nfts (
    id               uuid primary key default gen_random_uuid(),
    revision_id      uuid not null references deal_room_revisions (id) on delete cascade,
    side             text not null check (side in ('maker', 'taker')),
    item_position    integer not null check (item_position between 0 and 19),
    contract_address text not null check (contract_address = lower(contract_address)),
    token_id         numeric(78, 0) not null check (token_id >= 0),
    collection_name  text,
    name             text,
    image_url        text,
    rarity_rank      integer check (rarity_rank > 0),
    unique (revision_id, side, item_position),
    unique (revision_id, side, contract_address, token_id)
);

create index if not exists idx_deal_room_revision_nfts_revision
    on deal_room_revision_nfts (revision_id);

-- ---------------------------------------------------------------------
-- deal_room_acceptances (cleared whenever a new revision lands)
-- ---------------------------------------------------------------------
create table if not exists deal_room_acceptances (
    revision_id    uuid not null references deal_room_revisions (id) on delete cascade,
    wallet_address text not null check (wallet_address = lower(wallet_address)),
    accepted_at    timestamptz not null default now(),
    primary key (revision_id, wallet_address)
);

-- ---------------------------------------------------------------------
-- deal_room_events (append-only activity timeline)
-- ---------------------------------------------------------------------
create table if not exists deal_room_events (
    id           bigint generated always as identity primary key,
    room_id      uuid not null references deal_rooms (id) on delete cascade,
    revision_id  uuid references deal_room_revisions (id) on delete set null,
    actor        text check (actor is null or actor = lower(actor)),
    event_type   text not null check (event_type in (
        'room_created', 'revision_proposed', 'revision_agreed',
        'room_agreed', 'room_declined', 'room_cancelled',
        'final_offer_signed', 'room_settled', 'room_expired',
        'room_superseded', 'system'
    )),
    body         text check (body is null or char_length(body) <= 500),
    metadata     jsonb not null default '{}',
    created_at   timestamptz not null default now()
);

create index if not exists idx_deal_room_events_room
    on deal_room_events (room_id, created_at);

-- ---------------------------------------------------------------------
-- notifications (server-persistent, wallet-scoped, deduped)
-- ---------------------------------------------------------------------
create table if not exists notifications (
    id               uuid primary key default gen_random_uuid(),
    recipient_wallet text not null check (recipient_wallet = lower(recipient_wallet)),
    notification_type text not null,
    room_id          uuid references deal_rooms (id) on delete cascade,
    offer_id         uuid references trade_offers (id) on delete cascade,
    actor_wallet     text check (actor_wallet is null or actor_wallet = lower(actor_wallet)),
    title            text not null check (char_length(title) <= 120),
    body             text not null check (char_length(body) <= 280),
    action_path      text not null check (action_path like '/%'),
    dedupe_key       text not null unique,
    read_at          timestamptz,
    created_at       timestamptz not null default now()
);

create index if not exists idx_notifications_recipient_unread
    on notifications (recipient_wallet, created_at desc)
    where read_at is null;

-- ---------------------------------------------------------------------
-- Link the final signed offer back to its room
-- ---------------------------------------------------------------------
alter table trade_offers
    add column if not exists deal_room_id uuid references deal_rooms (id) on delete set null;

create index if not exists idx_trade_offers_deal_room
    on trade_offers (deal_room_id) where deal_room_id is not null;

-- ---------------------------------------------------------------------
-- Row level security: all access through the service-role API layer.
-- ---------------------------------------------------------------------
alter table deal_rooms enable row level security;
alter table deal_room_revisions enable row level security;
alter table deal_room_revision_nfts enable row level security;
alter table deal_room_acceptances enable row level security;
alter table deal_room_events enable row level security;
alter table notifications enable row level security;
