# Настройка Supabase для Life Flow

Секретный ключ `service_role` **никогда** не кладите в JavaScript. В приложении используются только **Project URL** и **anon public key**.

## 1. Создайте проект

1. Откройте [https://supabase.com](https://supabase.com) и создайте проект.
2. Дождитесь готовности базы.

## 2. SQL-схема

1. В панели: **SQL Editor → New query**.
2. Вставьте содержимое файла `supabase/schema.sql` из этого репозитория.
3. Нажмите **Run**.

## 3. Storage

1. **Storage → New bucket**
   - `user-images` — Public: **Yes** (или No + signed URLs; в текущей версии ожидается public URL).
   - `shared-images` — Public: **Yes**.
2. Для каждого bucket: **Policies → New policy**
   - SELECT: разрешить `anon` и `authenticated` (чтение).
   - INSERT/UPDATE: только `authenticated` (для `user-images` путь должен начинаться с `auth.uid()`).
   - Для `shared-images` запись — только если в `profiles.is_admin = true` (можно упростить: authenticated write, а RLS таблицы shared_content уже режет не-админов).

Пример policy для загрузки в `user-images` (authenticated):

```sql
create policy "user upload own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'user-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

## 4. Ключи в приложении

1. **Project Settings → API**
2. Скопируйте **Project URL** и **anon public** key.
3. Откройте `js/core/supabase-config.js` и вставьте:

```js
url: 'https://XXXX.supabase.co',
anonKey: 'eyJhbGciOi...',
```

## 5. Администратор общего контента

После регистрации своего аккаунта в приложении выполните в SQL:

```sql
update public.profiles
set is_admin = true
where email = 'ваш@email.com';
```

Только админы могут писать в `shared_content` (рецепты, упражнения, оверрайды книг и т.д.).

## 6. Auth

В **Authentication → Providers** включите Email.  
При желании отключите «Confirm email» на время разработки (**Providers → Email → Confirm email**).

## 7. Проверка

1. Откройте сайт, **Настройки → Аккаунт и облако** → регистрация.
2. Создайте заметку / привычку → обновите страницу — данные на месте.
3. Выйдите, войдите с другого браузера — данные подтянулись.
4. Отключите сеть — приложение открывается (PWA/SW), правки копятся, после сети уходят в облако.
