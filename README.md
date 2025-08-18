## Uroven Admin — simple Supabase admin for one table

Minimal Next.js admin panel for the `products` table in Supabase. It renders HTML safely, lets editors update descriptions through a lightweight rich‑text editor, and confirm content with audit fields.

### Features
- View `products` with pagination (50 per page) and a built‑in filter: only rows where `description_added = true` are listed
- Safe HTML rendering for `short_description` and `description` (sanitized)
- Inline rich‑text editor (contentEditable) with a small toolbar: Bold, Italic, Underline, H2, Paragraph, Ordered/Unordered lists, Link, Clear formatting
- Live preview inside the editor modal; HTML is sanitized before saving
- “Confirm description” action storing the current user email
- Visual badges for PIM readiness and confirmation status
- Supabase auth (email/password): login and logout

### Tech stack
- Next.js (App Router, TypeScript, Tailwind CSS)
- Supabase JS SDK
- HTML sanitization: `isomorphic-dompurify`

### Getting started
1) Install dependencies
```bash
npm i
```
2) Create `.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
```
3) Run locally
```bash
npm run dev
```
Open `http://localhost:3000`, sign in at `/login`, then go to `/admin`.

### Database schema (products)
Common columns used by the app include: `row_number`, `id` (PIM id), `uid` (uuid), `product_name`, `short_description`, `description`, `description_added`, `push_to_pim`.

This app also expects the following audit/approval columns. Run in Supabase SQL editor:
```sql
-- 1) New columns
alter table public.products
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists description_confirmed boolean not null default false,
  add column if not exists confirmed_by_email text;

-- 2) updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at on public.products;
create trigger trg_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();
```

### Using the editor
- Click “Edit short description” or “Edit full description” on a product card
- Use the toolbar to format text (Bold/Italic/Underline, H2/P, lists, link)
- See changes in the live preview; click “Save” to persist
- Click “Confirm description” to mark it approved; your email will be stored

### Favicon & branding
The app uses `src/app/favicon.ico`. Replace it with your icon to update the favicon. The home page shows the company logo from `src/images/logo.png`.
