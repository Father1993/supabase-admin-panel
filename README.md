## Uroven Admin — простая панель администратора Supabase для одной таблицы

Минимальная панель администратора Next.js для таблицы `products` в Supabase. Она безопасно отображает HTML, позволяет редакторам обновлять описания через лёгкий редактор форматированного текста и подтверждать содержимое с помощью полей аудита.

### Возможности
- Просмотр `products` с пагинацией (50 на страницу) и встроенным фильтром: отображаются только строки, для которых `description_added = true`
- Безопасный рендеринг HTML для `short_description` и `description` (с очисткой)
- Встроенный редактор форматированного текста (contentEditable) с небольшой панелью инструментов: жирный шрифт, курсив, подчёркивание, H2, абзац, нумерованные/маркированные списки, ссылка, чистое форматирование
- Интерактивный предварительный просмотр в модальном окне редактора; HTML-код очищается перед сохранением.
- Действие «Подтвердить описание» сохраняет адрес электронной почты текущего пользователя.
- Визуальные значки готовности PIM и статуса подтверждения.
- Авторизация Supabase (адрес электронной почты/пароль): вход и выход.

### Технический стек.
- Next.js (App Router, TypeScript, Tailwind CSS).
- Supabase JS SDK.
- Очистка HTML: `isomorphic-dompurify`.

### Начало работы.
1) Установка зависимостей.
```bash
npm i
```
2) Создание `.env.local`.
```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
```
3) Запуск локально.
```bash
npm run dev
```
Открыть. `http://localhost:3000`, войдите в систему по адресу `/login`, затем перейдите в раздел `/admin`.

### Схема базы данных (products)
Приложение использует следующие столбцы: `row_number`, `id` (идентификатор PIM), `uid` (uuid), `product_name`, `short_description`, `description`, `description_added`, `push_to_pim`.

Это приложение также ожидает следующие столбцы аудита/утверждения. Запустите в редакторе SQL Supabase:
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

### Использование редактора
- Нажмите «Изменить краткое описание» или «Изменить полное описание» на карточке товара
- Используйте панель инструментов для форматирования текста (жирный/курсив/подчёркнутый, H2/P, списки, ссылка)
- Смотрите изменения в режиме предварительного просмотра; нажмите «Сохранить» для сохранения
- Нажмите «Подтвердить описание», чтобы отметить его как одобренное; Ваш адрес электронной почты будет сохранён.

### Фавикон и брендинг
Приложение использует `src/app/favicon.ico`. Замените его на свой значок, чтобы обновить фавикон. На главной странице отображается логотип компании из `src/images/logo.png`.


