
-- Crie uma tabela de perfis públicos atrelada ao id do usuário
create table if not exists public.user_profiles (
  id uuid primary key references users(id) on delete cascade,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS: Só o próprio usuário pode ver e editar seu perfil
alter table public.user_profiles enable row level security;

create policy "Users can select own profiles"
  on public.user_profiles
  for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.user_profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles
  for update
  using (auth.uid() = id);

create policy "Users can delete own profile"
  on public.user_profiles
  for delete
  using (auth.uid() = id);
