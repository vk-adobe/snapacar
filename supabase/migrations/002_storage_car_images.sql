-- Run after 001_snapacar.sql. Creates public bucket + RLS for car photos.
-- Dashboard: Storage → should show bucket "car-images" after this.

insert into storage.buckets (id, name, public)
values ('car-images', 'car-images', true)
on conflict (id) do nothing;

drop policy if exists "car_images_public_read" on storage.objects;
create policy "car_images_public_read"
  on storage.objects for select
  using (bucket_id = 'car-images');

drop policy if exists "car_images_authenticated_upload" on storage.objects;
create policy "car_images_authenticated_upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'car-images');

drop policy if exists "car_images_owner_update" on storage.objects;
create policy "car_images_owner_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'car-images');

drop policy if exists "car_images_owner_delete" on storage.objects;
create policy "car_images_owner_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'car-images');
