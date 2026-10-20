-- ตำแหน่งที่บันทึกรายการ (ว่างได้ทั้งหมด: รายการเก่า / ไม่อนุญาตให้ใช้ตำแหน่ง / หาตำแหน่งไม่เจอ)
alter table expense_app.transactions
  add column location_name text check (length(location_name) <= 120),            -- ชื่อสถานที่ เช่น "ปทุมวัน, กรุงเทพฯ" (แก้เองได้)
  add column latitude double precision check (latitude between -90 and 90),
  add column longitude double precision check (longitude between -180 and 180),
  add column location_accuracy_m real check (location_accuracy_m >= 0),           -- ความแม่นยำของ GPS (เมตร)
  add constraint location_coords_pair check ((latitude is null) = (longitude is null));
