-- ---------------------------------------------------------------------
-- Add expiry to wanted_posts (wanted board listings)
-- ---------------------------------------------------------------------
-- Wanted listings previously never expired. Add a nullable expires_at so
-- listings can auto-hide once they lapse. NULL means "never expires" for
-- back-compat with rows created before this migration.

alter table wanted_posts
    add column if not exists expires_at timestamptz;

create index if not exists idx_wanted_posts_expires_at
    on wanted_posts (expires_at);
