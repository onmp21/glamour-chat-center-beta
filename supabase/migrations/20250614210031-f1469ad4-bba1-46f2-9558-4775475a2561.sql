
-- 1. Criar bucket media-files se não existir
insert into storage.buckets
  (id, name, public)
values
  ('media-files', 'media-files', true)
on conflict (id) do nothing;

-- 2. Criar bucket avatars se não existir
insert into storage.buckets
  (id, name, public)
values
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 3. Políticas para permitir upload, leitura e remoção em ambos os buckets
-- Para media-files
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where policyname = 'Allow public uploads' and tablename = 'objects'
  ) then
    create policy "Allow public uploads" on storage.objects
      for insert with check (bucket_id in ('media-files', 'avatars'));
  end if;
  if not exists (
    select 1 from pg_policies 
    where policyname = 'Allow public access' and tablename = 'objects'
  ) then
    create policy "Allow public access" on storage.objects
      for select using (bucket_id in ('media-files', 'avatars'));
  end if;
  if not exists (
    select 1 from pg_policies 
    where policyname = 'Allow public delete' and tablename = 'objects'
  ) then
    create policy "Allow public delete" on storage.objects
      for delete using (bucket_id in ('media-files', 'avatars'));
  end if;
end $$;

-- 4. Criar tabela user_profiles se não existir
create table if not exists public.user_profiles (
  id uuid primary key,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. Habilitar RLS e políticas para user_profiles
alter table public.user_profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'Users can select own profiles' and tablename = 'user_profiles'
  ) then
    create policy "Users can select own profiles"
      on public.user_profiles
      for select
      using (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'Users can insert their own profile' and tablename = 'user_profiles'
  ) then
    create policy "Users can insert their own profile"
      on public.user_profiles
      for insert
      with check (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'Users can update own profile' and tablename = 'user_profiles'
  ) then
    create policy "Users can update own profile"
      on public.user_profiles
      for update
      using (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'Users can delete own profile' and tablename = 'user_profiles'
  ) then
    create policy "Users can delete own profile"
      on public.user_profiles
      for delete
      using (auth.uid() = id);
  end if;
end $$;
