# HelpdeskApp — Support Ticket System

A support-ticket helpdesk with role-based access control. Customers open tickets and see only their own; agents work the queue and can leave internal notes; admins see everything. Ticket creation is rate-limited per user.

Stack: Next.js 16 (App Router) + TypeScript, Supabase (Postgres + GoTrue) via `@supabase/ssr`, Tailwind v4, Zod. Authorization is hand-written SQL — RLS policies and `SECURITY DEFINER` functions rather than an ORM.

## Features

| | |
|---|---|
| **Accounts** | Email/password registration with confirmation, password reset |
| **Roles** | `customer`, `agent`, `admin` — enforced by Postgres RLS, not just the UI |
| **Tickets** | Create, list, view, reply; status and priority |
| **Staff tools** | Assign tickets, change status, post internal notes customers can't see |
| **Rate limiting** | 10 tickets/hour per user, enforced in the database |
| **Command palette** | ⌘K / Ctrl+K to jump to a ticket or page |

## Setup

```bash
pnpm install
supabase start        # local Postgres + GoTrue + Inbucket mail catcher; runs all migrations
pnpm seed             # 4 demo users + sample tickets, incl. one internal-only note
pnpm dev
```

Open `http://localhost:3000`. Confirmation and password-reset emails land at the local mail catcher: **http://localhost:54324** (Inbucket) — nothing leaves your machine.

Seeded logins (password for all: `demo-password-123`):

| Role | Email | Access |
|---|---|---|
| Admin | `admin@demo.test` | Every ticket and reply, including internal notes |
| Agent | `agent@demo.test` | Every ticket and reply; can assign and change status |
| Customer | `customer@demo.test` | Own tickets only; internal notes hidden |
| Customer | `customer2@demo.test` | Own tickets only — a second tenant to check isolation against |

`pnpm db:reset` re-applies all migrations and wipes local data. `pnpm seed` is idempotent — safe to re-run.

## How it works

**Authentication** is handled by Supabase Auth (GoTrue): `signUp`, `resetPasswordForEmail` → `updateUser`, and cookie-based sessions refreshed in `proxy.ts`. Email links route through `app/auth/confirm/route.ts`, which verifies the OTP server-side so the session cookie is set correctly for SSR. Passwords are hashed by GoTrue (bcrypt) and never handled by application code.

Sign-in is the one flow that does **not** go straight to Supabase from the browser. It posts to [`app/api/auth/login`](app/api/auth/login/route.ts) instead, because a call the server never sees is a call the server cannot rate limit — see brute-force protection below.

**Authorization** lives in the database:

- Roles are stored in a `user_roles` table, never in `auth.users.raw_user_meta_data` — that field is writable by the user via `updateUser()`, so a role kept there could be self-escalated.
- A [Custom Access Token Hook](supabase/migrations/0002_auth_hook.sql) stamps the role into `app_metadata.user_role` inside the signed JWT at issue time, so [RLS policies](supabase/migrations/0003_rls.sql) can read it via `auth.jwt()` with no extra table lookup per request.
- Two helpers with different freshness guarantees: `has_role()` reads the JWT claim (fast, cached until the token refreshes), while `has_role_fresh()` reads the table directly. Read paths use the former; mutating `user_roles` itself uses the latter, so a just-demoted admin can't grant roles with a stale token.
- `lib/auth/roles.ts` mirrors these predicates in TypeScript for UI gating only — hiding buttons, choosing which dashboard renders. RLS is the enforcement boundary.

**Rate limiting** is enforced in Postgres rather than in a route handler. `INSERT` is revoked from `authenticated` on `tickets` and `ticket_replies`, so the only way to create either is through [`create_ticket()` / `add_reply()`](supabase/migrations/0004_rpc.sql). `create_ticket()` takes a per-user advisory lock (closing the check-then-insert race), counts the trailing hour, and returns `retry_after` derived from the oldest ticket in the window. `app/api/tickets/route.ts` translates that into a `429` with `Retry-After` and `X-RateLimit-*` headers.

Because writes are revoked at the grant level, the limit can't be sidestepped by calling PostgREST directly:

```sql
set role authenticated;
insert into tickets (user_id, subject, body) values (auth.uid(), 'bypass', 'x');
-- permission denied for table tickets
```

**Brute-force protection** on sign-in uses the same approach — state in Postgres, enforced server-side. [`0006_login_throttle.sql`](supabase/migrations/0006_login_throttle.sql) records every attempt and applies two bounds:

| Bound | Limit | Stops |
|---|---|---|
| `(email, ip)` | 5 failures / 5 min | Guessing one account from one host |
| `ip` | 20 failures / 15 min | Spraying many accounts from one host |

The tight bound is keyed on **email + IP rather than email alone**, which matters: a pure per-email counter is an account-lockout DoS, since anyone could fail five times against a known address and lock the real owner out. Keying on the pair confines the cooldown to the attacker's own host. The residual gap is a distributed attack on a single account, caught only by the looser per-IP bound; the honest answer there is a CAPTCHA or an edge WAF, not a bigger table.

A successful sign-in clears that pair's recent failures, so a few typos don't strand anyone in a cooldown. During a cooldown even the *correct* password is refused — otherwise the limit wouldn't be one.

The rate-limit table has RLS on with **zero policies and no grants** to `anon`/`authenticated`; the two functions are `SECURITY DEFINER` and granted to `service_role` only. If clients could write that table they could poison the counters and lock other people out, which is why the login route uses the service-role key (server-only, never `NEXT_PUBLIC_`). If that key is absent the limiter degrades rather than locking everyone out of the app.

Error responses are deliberately uniform. Wrong password, unknown address, and unconfirmed email all return the same `401 Invalid email or password.`, and password reset returns the same confirmation whether or not the address exists — verified byte-identical. The login form carries a standing "just registered? check your inbox" hint so real users still get unstuck without the form answering an attacker's question.

## Project structure

```
app/(auth)/          login, register, forgot-password, reset-password
app/(app)/           dashboard, tickets list/detail/new (authenticated shell)
app/api/tickets/     write endpoints -- create, reply, assign, status
app/auth/            OTP confirm, signout
lib/supabase/        browser / server / proxy clients
lib/auth/            session + role helpers
lib/data/            RLS-scoped queries
supabase/migrations/ schema, auth hook, RLS, RPCs, grants
tokens.css           design tokens
```

## Notes

- **Email in production.** Locally everything routes to Inbucket. Hosted Supabase projects cap the built-in SMTP at a few emails per hour, so a deployed instance needs a real provider (Resend, Postmark, etc.) configured or confirmation and reset emails will stop arriving.
- **Role changes propagate on token refresh.** Because the role is a JWT claim, a change takes up to one token lifetime (1h by default) to affect a signed-in user's read access. Privilege-granting operations use `has_role_fresh()` and are unaffected.
- **No admin UI for roles.** Promoting a user to `agent` or `admin` is a SQL operation; see `scripts/seed.ts` for the pattern.
