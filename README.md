# Айдана Sweets

Магазин шоколада с админ-панелью и базой Supabase.

## Запуск

```bash
npm install
npm start
```

- Сайт: http://localhost:3000
- Админ: http://localhost:3000/admin/login.html (логин `admin`, пароль `admin123`)

## Supabase (один раз)

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard) → ваш проект → **SQL Editor**
2. Вставьте и выполните содержимое файла `supabase/schema.sql`
3. После этого товары из админки появятся на главной странице

## Структура

- `public/index.html` + `style.css` — витрина (дизайн без изменений)
- `public/js/supabase-client.js` — работа с БД
- `public/admin/` — админ-панель (товары CRUD)
