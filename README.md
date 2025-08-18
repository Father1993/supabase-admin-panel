## Uroven Admin — простая админка для Supabase

Коротко о проекте: минимальная админ-панель на Next.js для просмотра таблицы `products` из Supabase с аккуратным рендером HTML в описаниях.

### Функционал
- Просмотр таблицы `products` (поля: `product_name`, `short_description`, `description`, `id`, `uid`, `row_number`, `push_to_pim`).
- Фильтр: показываются только записи, где `description_added = true`.
- Пагинация: по 50 записей на страницу.
- Безопасный вывод HTML в `short_description` и `description` (санитизация).
- Вход по email/паролю Supabase, выход из аккаунта.

### Технологии
- Next.js (App Router, TypeScript, Tailwind CSS)
- Supabase JS SDK
- Sanitизация HTML: `isomorphic-dompurify`

### Быстрый старт
1. Установить зависимости:
```bash
npm i
```
2. Создать `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```
3. Запустить dev-сервер и открыть `http://localhost:3000`:
```bash
npm run dev
```
4. Войти на странице `/login`, затем открыть `/admin`.

### Права в Supabase (если RLS отключён)
```sql
grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
```

> Примечание: ключ `SERVICE_ROLE_KEY` не используется на клиенте. Для браузера достаточно `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
