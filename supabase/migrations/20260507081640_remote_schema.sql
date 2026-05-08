drop policy "agents_select_all" on "public"."agents";

revoke delete on table "public"."agents" from "anon";

revoke insert on table "public"."agents" from "anon";

revoke references on table "public"."agents" from "anon";

revoke select on table "public"."agents" from "anon";

revoke trigger on table "public"."agents" from "anon";

revoke truncate on table "public"."agents" from "anon";

revoke update on table "public"."agents" from "anon";

revoke delete on table "public"."agents" from "authenticated";

revoke insert on table "public"."agents" from "authenticated";

revoke references on table "public"."agents" from "authenticated";

revoke select on table "public"."agents" from "authenticated";

revoke trigger on table "public"."agents" from "authenticated";

revoke truncate on table "public"."agents" from "authenticated";

revoke update on table "public"."agents" from "authenticated";

revoke delete on table "public"."agents" from "service_role";

revoke insert on table "public"."agents" from "service_role";

revoke references on table "public"."agents" from "service_role";

revoke select on table "public"."agents" from "service_role";

revoke trigger on table "public"."agents" from "service_role";

revoke truncate on table "public"."agents" from "service_role";

revoke update on table "public"."agents" from "service_role";

revoke delete on table "public"."clients" from "anon";

revoke insert on table "public"."clients" from "anon";

revoke references on table "public"."clients" from "anon";

revoke select on table "public"."clients" from "anon";

revoke trigger on table "public"."clients" from "anon";

revoke truncate on table "public"."clients" from "anon";

revoke update on table "public"."clients" from "anon";

revoke delete on table "public"."clients" from "authenticated";

revoke insert on table "public"."clients" from "authenticated";

revoke references on table "public"."clients" from "authenticated";

revoke select on table "public"."clients" from "authenticated";

revoke trigger on table "public"."clients" from "authenticated";

revoke truncate on table "public"."clients" from "authenticated";

revoke update on table "public"."clients" from "authenticated";

revoke delete on table "public"."clients" from "service_role";

revoke insert on table "public"."clients" from "service_role";

revoke references on table "public"."clients" from "service_role";

revoke select on table "public"."clients" from "service_role";

revoke trigger on table "public"."clients" from "service_role";

revoke truncate on table "public"."clients" from "service_role";

revoke update on table "public"."clients" from "service_role";

alter table "public"."agents" drop constraint "agents_email_key";

alter table "public"."clients" drop constraint "clients_email_unique";

alter table "public"."clients" drop constraint "clients_user_id_fkey";

alter table "public"."appointments" drop constraint "appointments_agent_id_fkey";

alter table "public"."appointments" drop constraint "appointments_client_id_fkey";

alter table "public"."agents" drop constraint "agents_pkey";

alter table "public"."clients" drop constraint "clients_pkey";

drop index if exists "public"."agents_email_key";

drop index if exists "public"."agents_pkey";

drop index if exists "public"."clients_email_unique";

drop index if exists "public"."clients_pkey";

drop index if exists "public"."idx_clients_user_id";

drop table "public"."agents";

drop table "public"."clients";


  create table "public"."profiles" (
    "id" uuid not null,
    "full_name" text not null,
    "email" text not null,
    "role" text default 'agent'::text,
    "created_at" timestamp with time zone default now(),
    "phone" text,
    "specialty" text,
    "is_active" boolean default true,
    "metadata" jsonb default '{}'::jsonb
      );


alter table "public"."profiles" enable row level security;

alter table "public"."appointments" add column "created_by" uuid;

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."appointments" add constraint "appointments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."appointments" validate constraint "appointments_created_by_fkey";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'agent'::text, 'client'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."appointments" add constraint "appointments_agent_id_fkey" FOREIGN KEY (agent_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."appointments" validate constraint "appointments_agent_id_fkey";

alter table "public"."appointments" add constraint "appointments_client_id_fkey" FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."appointments" validate constraint "appointments_client_id_fkey";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";


  create policy "appointments_insert_policy"
  on "public"."appointments"
  as permissive
  for insert
  to public
with check (true);



  create policy "appointments_select_policy"
  on "public"."appointments"
  as permissive
  for select
  to public
using (true);



  create policy "appointments_update_policy"
  on "public"."appointments"
  as permissive
  for update
  to public
using (true);



  create policy "Admins can delete profiles"
  on "public"."profiles"
  as permissive
  for delete
  to authenticated
using ((( SELECT profiles_1.role
   FROM public.profiles profiles_1
  WHERE (profiles_1.id = auth.uid())) = 'admin'::text));



  create policy "Allow authenticated delete"
  on "public"."profiles"
  as permissive
  for delete
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Allow authenticated insert"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Allow authenticated select"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Enable delete for authenticated users"
  on "public"."profiles"
  as permissive
  for delete
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Enable insert for authenticated users"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Enable read access for authenticated users"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "profiles_read_all"
  on "public"."profiles"
  as permissive
  for select
  to public
using (true);



