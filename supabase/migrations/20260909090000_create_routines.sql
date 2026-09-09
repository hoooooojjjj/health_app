create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  constraint routine_exercises_routine_exercise_key unique (routine_id, exercise_id),
  constraint routine_exercises_routine_position_key unique (routine_id, position)
);

create index if not exists routines_user_created_at_idx
  on public.routines (user_id, created_at desc);

create index if not exists routine_exercises_routine_position_idx
  on public.routine_exercises (routine_id, position);

alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;

create policy "Users can read own routines"
  on public.routines
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create own routines"
  on public.routines
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can read exercises in own routines"
  on public.routine_exercises
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.routines
      where routines.id = routine_exercises.routine_id
        and routines.user_id = (select auth.uid())
    )
  );

create policy "Users can add exercises to own routines"
  on public.routine_exercises
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.routines
      where routines.id = routine_exercises.routine_id
        and routines.user_id = (select auth.uid())
    )
  );

grant select, insert on public.routines to authenticated;
grant select, insert on public.routine_exercises to authenticated;

create or replace function public.create_routine_with_exercises(
  p_name text,
  p_exercise_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_routine_id uuid;
  requested_count integer;
  existing_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 80 then
    raise exception 'Routine name must be between 1 and 80 characters' using errcode = '22023';
  end if;

  requested_count := cardinality(p_exercise_ids);

  if requested_count is null or requested_count < 1 or requested_count > 50 then
    raise exception 'A routine must contain between 1 and 50 exercises' using errcode = '22023';
  end if;

  if (select count(distinct exercise_id) from unnest(p_exercise_ids) as exercise_id) <> requested_count then
    raise exception 'Duplicate exercises are not allowed' using errcode = '22023';
  end if;

  select count(*)
    into existing_count
    from public.exercises
    where id = any(p_exercise_ids);

  if existing_count <> requested_count then
    raise exception 'One or more exercises do not exist' using errcode = '23503';
  end if;

  insert into public.routines (user_id, name)
  values (auth.uid(), btrim(p_name))
  returning id into new_routine_id;

  insert into public.routine_exercises (routine_id, exercise_id, position)
  select new_routine_id, selected.exercise_id, selected.ordinality - 1
  from unnest(p_exercise_ids) with ordinality as selected(exercise_id, ordinality);

  return new_routine_id;
end;
$$;

revoke all on function public.create_routine_with_exercises(text, uuid[]) from public;
revoke all on function public.create_routine_with_exercises(text, uuid[]) from anon;
grant execute on function public.create_routine_with_exercises(text, uuid[]) to authenticated;
