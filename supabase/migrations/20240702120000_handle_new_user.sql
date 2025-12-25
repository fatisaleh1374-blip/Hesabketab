/**
* Handles new user creation by inserting a new row into the public.users table.
*/
create function public.handle_new_user() 
returns trigger as $$
begin
  -- Extract user details from the new auth.users record
  -- and insert into the public.users table.
  insert into public.users (id, email, first_name, last_name)
  values (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'firstName', -- Extracts firstName from metadata
    new.raw_user_meta_data->>'lastName'  -- Extracts lastName from metadata
  );
  return new;
end;
$$ language plpgsql security definer;

/**
* Trigger to execute the handle_new_user function after a new user is created in auth.users.
*/
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
