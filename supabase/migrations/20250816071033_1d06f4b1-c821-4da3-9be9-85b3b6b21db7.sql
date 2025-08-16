
-- 1) Ensure profiles are created with HOD details on signup (attach the trigger)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2) Allow HODs to view pending joins for their own department
-- This lets HODs list join requests to review.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pending_department_joins'
      and policyname = 'HODs can view joins for their department'
  ) then
    create policy "HODs can view joins for their department"
      on public.pending_department_joins
      for select
      using (
        exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.is_hod = true
            and p.department_id = pending_department_joins.department_id
        )
      );
  end if;
end
$$;

-- 3) Add a secure function for college admins to assign an approved HOD to a department
-- This does NOT require a join code; it sets the HOD's department directly after approval.
create or replace function public.assign_hod_to_department(
  p_user_id uuid,
  p_department_id uuid,
  p_approver_id uuid
) returns boolean
language plpgsql
security definer
as $$
declare
  dept_college_id uuid;
  approver_ok boolean := false;
begin
  -- Get the college of the department
  select d.college_id into dept_college_id
  from public.departments d
  where d.id = p_department_id and d.is_active = true;

  if dept_college_id is null then
    raise exception 'Department not found or inactive';
  end if;

  -- Verify approver is a super admin or a college admin of this college
  select exists (
    select 1 from public.profiles pa
    where pa.id = p_approver_id
      and pa.role = 'admin'
      and (
        pa.detailed_role = 'super_admin'
        or (pa.detailed_role = 'college_admin' and pa.college_id = dept_college_id)
      )
  ) into approver_ok;

  if not approver_ok then
    raise exception 'Only super admins or the college admin of this college can assign HODs';
  end if;

  -- Ensure the target user is an approved HOD profile
  if not exists (
    select 1 from public.profiles p
    where p.id = p_user_id
      and p.is_hod = true
      and p.pending_approval = false
  ) then
    raise exception 'User is not an approved HOD';
  end if;

  -- Assign the HOD to the department
  update public.profiles
  set
    department_id = p_department_id,
    college_id = dept_college_id,
    detailed_role = 'hod',
    is_active = true,
    updated_at = now()
  where id = p_user_id;

  return true;
end;
$$;
