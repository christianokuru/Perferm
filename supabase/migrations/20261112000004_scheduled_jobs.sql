-- Perferm — background jobs (pg_cron).
create extension if not exists pg_cron with schema pg_catalog;

-- Release checkouts that were never paid (stock is only taken at payment, so this is bookkeeping).
select cron.schedule('perferm-expire-pending-orders', '*/15 * * * *', $$select public.expire_pending_orders()$$);
-- Keep the rate-limit table small.
select cron.schedule('perferm-purge-rate-limits', '17 * * * *', $$select public.purge_rate_limits()$$);
