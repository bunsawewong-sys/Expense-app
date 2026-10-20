# บันทึกรายรับรายจ่าย (Personal Expense Tracker)

แอปบันทึกรายรับรายจ่ายส่วนตัว สร้างด้วย Next.js + Tailwind CSS
ข้อมูลเก็บใน Supabase (ต้องล็อกอินก่อนใช้งาน) ภาษาและโหมดสียังจำไว้ในเบราว์เซอร์

## ฟีเจอร์

- เพิ่มรายการ: เลือกประเภท หมวดหมู่ (ปุ่มไอคอน) จำนวนเงิน สกุลเงิน วันที่ และหมายเหตุ
- แก้ไขรายการ (ไอคอนดินสอ) และลบรายการ (ไอคอนถังขยะ มีกล่องยืนยันก่อนลบ)
- ประวัติรายการจัดกลุ่มรายวัน วันล่าสุดอยู่บน พร้อมยอด รับ / จ่าย / คงเหลือ ของแต่ละวัน
- หลายสกุลเงิน: THB, USD, EUR, JPY, CNY, SGD ยอดรวมแยกตามสกุล (เลือกดูด้วยแท็บเหนือการ์ดสรุป)
- โหมดสี: อัตโนมัติ (06:00–18:00 สว่าง, 18:00–06:00 มืด) / สว่าง / มืด จำค่าที่เลือกไว้
- สลับภาษา ไทย / English ทั้งหน้าจอ จำค่าที่เลือกไว้
- **สแกนสลิป:** ถ่ายรูปหรือเลือกรูปสลิป (หลายใบพร้อมกันได้) ให้ AI (OpenAI) อ่านและเดาประเภท/หมวดให้ ตรวจแก้ก่อนกดบันทึก
- **หน้าสรุป (`/summary`):** เลือกเดือน + สกุลเงิน ดูกราฟแท่งรายรับ-รายจ่ายรายวัน และกราฟวงกลมรายจ่ายตามหมวด
- **ตำแหน่งที่บันทึก:** ฟอร์มหาตำแหน่งจาก GPS ให้อัตโนมัติ (แก้ชื่อสถานที่เองได้ หรือกด ✕ ไม่ระบุ) แสดง 📍 ในประวัติและในการ์ด Teams กดแล้วเปิด Google Maps
- รองรับมือถือ

## ตั้งค่าการสแกนสลิป (ทำครั้งเดียว)

การสแกนสลิปใช้ OpenAI API (รุ่น `gpt-5.4-mini`) ซึ่ง**คิดเงินตามการใช้** ต้องเติมเครดิตในบัญชี OpenAI ก่อน

1. ไปที่ <https://platform.openai.com/api-keys> ล็อกอิน แล้วกด **Create new secret key**
2. เติมเครดิตที่ <https://platform.openai.com/settings/organization/billing> (ขั้นต่ำ $5)
3. เปิดไฟล์ `.env.local` (ถ้ายังไม่มี ให้คัดลอกจาก `.env.example`) แล้ววาง key หลัง `OPENAI_API_KEY=` เช่น `OPENAI_API_KEY=sk-...` แล้วบันทึก
4. ถ้าเปิด `npm.cmd run dev` ค้างไว้ ให้กด `Ctrl + C` แล้วรันใหม่

> ⚠️ รูปสลิปจะถูกส่งไปให้ OpenAI อ่าน (สลิปมีชื่อและเลขบัญชีบางส่วน)
> ไฟล์ `.env.local` จะไม่ถูกส่งขึ้น GitHub ถ้าขึ้น Vercel ให้ใส่ `OPENAI_API_KEY` ใน Project Settings → Environment Variables

## ล็อกอิน ฐานข้อมูล และสิทธิ์ผู้ใช้

- **ข้อมูลอยู่ใน Supabase:** อยู่ใน schema `expense_app` สร้างจากไฟล์ `supabase/migrations/0001_expense_app.sql`
  - มี 3 ตาราง คือ `users`, `sessions` และ `transactions`
  - เบราว์เซอร์เข้าถึงตารางตรง ๆ ไม่ได้ เพราะเปิด RLS ไว้โดยไม่มี policy และถอนสิทธิ์ anon ออกแล้ว ทุกคำขอต้องผ่าน API ของแอป ซึ่งตรวจสิทธิ์ทุกครั้ง
- **ล็อกอิน:** เป็นระบบของแอปเอง (ไม่ใช้ Supabase Auth) รหัสผ่านเข้ารหัสด้วย scrypt และ cookie อยู่ได้ 7 วัน
- **สิทธิ์ 2 ระดับ**
  - **admin:** เห็นรายการของทุกคน (เลือกดูรายคนได้) และจัดการผู้ใช้ที่เมนู "ผู้ใช้"
  - **user:** เห็นเฉพาะรายการของตัวเอง
- **ครั้งแรก:** เปิดแอปแล้วจะถูกพาไปหน้า `/setup` ให้สร้าง admin คนแรก หลังจากนั้นผู้ใช้คนอื่นต้องให้ admin สร้างให้
- **ข้อมูลเดิมใน localStorage:** หลังล็อกอินจะมีแถบ "นำเข้าเป็นของฉัน" ให้กดย้ายเข้า database

### ตั้งค่า Supabase
1. ไปที่ Supabase Dashboard แล้วเปิดโปรเจกต์ เข้า **Project Settings → API Keys**
2. คัดลอก **service_role** key (secret) มาใส่ `SUPABASE_SERVICE_ROLE_KEY=` ใน `.env.local` และใน Vercel
   ห้ามแชร์ key นี้ และห้ามใส่ไว้ในโค้ด

### ตั้งค่าแจ้งเตือน Microsoft Teams (ทีม ExpenseTeam ช่อง Announcement)
1. ใน Teams ไปที่ช่อง **Announcement** กด **⋯ → Workflows**
2. เลือกแม่แบบ **"Post to a channel when a webhook request is received"** แล้วตั้งชื่อ เช่น Expense App
3. ตรวจว่า Team เป็น **ExpenseTeam** และ Channel เป็น **Announcement** แล้วกด **Add workflow**
4. คัดลอก URL ที่ได้มาใส่ `TEAMS_WEBHOOK_URL=` ใน `.env.local` และใน Vercel
5. ทุกครั้งที่บันทึกรายการใหม่ แอปจะส่ง Adaptive Card เข้าช่องนั้น ถ้าบันทึกหลายสลิปพร้อมกันจะได้การ์ดรวม 1 ใบ

> ถ้าส่งการ์ดไม่สำเร็จ รายการยังถูกบันทึกตามปกติ ดูสาเหตุได้ใน log ของเซิร์ฟเวอร์

## วิธีรันแอป (ทีละขั้น)

1. เปิดโปรแกรม **PowerShell** หรือ **Terminal**
2. เข้าไปที่โฟลเดอร์โปรเจกต์

   ```bash
   cd "C:\9Expert Training-Build-Business App with Claude Code-Version 1\App\02-Expense App\expense-tracker"
   ```

3. ถ้าเพิ่งดาวน์โหลดโปรเจกต์มาใหม่ (ยังไม่มีโฟลเดอร์ `node_modules`) ให้ติดตั้งก่อน ทำแค่ครั้งแรกครั้งเดียว

   ```bash
   npm.cmd install
   ```

4. เปิดแอป (ใน PowerShell ให้พิมพ์ `npm.cmd` แทน `npm` ดูหัวข้อ "แก้ปัญหา" ด้านล่าง)

   ```bash
   npm.cmd run dev
   ```

5. เปิดเบราว์เซอร์ไปที่ <http://localhost:3000>
6. ใช้เสร็จแล้ว กลับไปที่หน้าต่าง Terminal แล้วกด `Ctrl + C` เพื่อปิดแอป

## แก้ปัญหา

**`npm : The term 'npm' is not recognized ...`**
หน้าต่าง Terminal นั้นเปิดไว้ก่อนติดตั้ง Node.js จึงยังไม่รู้จักโปรแกรมใหม่
ให้ปิดแล้วเปิด Terminal ใหม่ (ถ้าใช้ Terminal ในแอป Claude ให้ปิดแอป Claude แล้วเปิดใหม่)
หรือพิมพ์คำสั่งนี้ในหน้าต่างเดิม เพื่อโหลดรายชื่อโปรแกรมใหม่:

```bash
$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
```

**`npm.ps1 cannot be loaded because running scripts is disabled on this system`**
Windows ตั้งค่าเริ่มต้นไม่ให้ PowerShell รันไฟล์สคริปต์ `.ps1` และคำสั่ง `npm` เฉย ๆ ไปเรียกไฟล์ `npm.ps1`
ให้พิมพ์ `npm.cmd` แทน `npm` (ทำงานเหมือนกันทุกอย่าง)

**แก้ไฟล์ `globals.css` แล้วสี/โหมดมืดไม่เปลี่ยน**
เซิร์ฟเวอร์ `npm.cmd run dev` จำการตั้งค่า Tailwind ชุดเก่าไว้ ให้กด `Ctrl + C` ปิด แล้วรัน `npm.cmd run dev` ใหม่

## โครงสร้างไฟล์ที่สำคัญ

| ไฟล์ | หน้าที่ |
|---|---|
| `src/app/page.tsx` | หน้าหลัก: ถือรายการทั้งหมด, เพิ่ม/แก้ไข/ลบ, อ่าน/บันทึก localStorage |
| `src/app/summary/page.tsx` | หน้าสรุป (อ่านข้อมูลอย่างเดียว) |
| `src/app/api/scan-slip/route.ts` | API ฝั่งเซิร์ฟเวอร์: ส่งรูปสลิปให้ OpenAI อ่าน (API key อยู่ฝั่งนี้เท่านั้น) |
| `src/app/layout.tsx` | กรอบหน้าเว็บ ฟอนต์ไทย สคริปต์เลือกโหมดสี และครอบทุกหน้าด้วย AppShell |
| `src/app/globals.css` | สีหลัก (`--color-brand: #2486ff`), การตั้งค่าโหมดมืด และสีของกราฟ |
| `src/components/AppShell.tsx` | ส่วนหัว + เมนู รายการ/สรุป + ภาษา (ใช้ร่วมกันทุกหน้า) |
| `src/components/SlipScanner.tsx` | ปุ่มถ่าย/เลือกรูปสลิป และกล่องตรวจรายการก่อนบันทึก |
| `src/components/SummaryDashboard.tsx` | เนื้อหาหน้าสรุป (เลือกเดือน/สกุล, การ์ด, กราฟ) |
| `src/components/charts/DailyBarChart.tsx` | กราฟแท่งรายรับ-รายจ่ายรายวัน (SVG) |
| `src/components/charts/CategoryPieChart.tsx` | กราฟวงกลมรายจ่ายตามหมวด (SVG) |
| `src/lib/scanSlip.ts` | ย่อรูป, ส่งไปอ่าน, รอแล้วลองใหม่เมื่อโควต้าเต็ม |
| `src/components/TransactionForm.tsx` | ฟอร์มเพิ่ม/แก้ไขรายการ (ใช้ตัวเดียวกัน) |
| `src/components/CategoryPicker.tsx` | ปุ่มเลือกหมวดหมู่ |
| `src/components/TransactionLog.tsx` | ประวัติรายการจัดกลุ่มรายวัน พร้อมปุ่มแก้ไข/ลบ |
| `src/components/SummaryCards.tsx` | การ์ดสรุป 3 ใบ + แท็บเลือกสกุลเงิน |
| `src/components/Modal.tsx` | กล่องลอย (ใช้กับแก้ไข ยืนยันลบ และตรวจสลิป) |
| `src/components/DeleteConfirm.tsx` | เนื้อหากล่องยืนยันลบ |
| `src/components/LocationField.tsx` / `LocationLink.tsx` | ช่องตำแหน่งในฟอร์ม / ลิงก์ 📍 ไป Google Maps |
| `src/lib/location.ts` | ขอพิกัดจากเบราว์เซอร์ + สร้างลิงก์แผนที่ |
| `src/app/api/geocode/route.ts` + `src/lib/server/geocode.ts` | แปลงพิกัดเป็นชื่อสถานที่ (OpenStreetMap Nominatim ฟรี ไม่ต้องมี key) |
| `src/components/ThemeToggle.tsx` / `LanguageToggle.tsx` | ปุ่มสลับโหมดสี / ภาษา |
| `src/components/Icons.tsx` | ไอคอน SVG (ดินสอ ถังขยะ ดวงอาทิตย์ พระจันทร์ นาฬิกา) |
| `src/lib/transactions.ts` | ชนิดข้อมูล, อ่าน/เขียน localStorage, แปลงข้อมูลเก่า, รวมยอด, จัดกลุ่มรายวัน, สรุปรายเดือน, รูปแบบวันที่ |
| `src/lib/currencies.ts` | รายชื่อสกุลเงินและการแสดงจำนวนเงิน |
| `src/lib/categories.ts` | รายชื่อหมวดหมู่ (ไอคอน + ชื่อไทย/อังกฤษ) |
| `src/lib/i18n.ts` | ข้อความทุกจุดบนหน้าจอ ภาษาไทยและอังกฤษ |
| `src/lib/theme.ts` | กติกาโหมดสีตามเวลา |

## ข้อควรรู้เรื่องข้อมูล

- ข้อมูลอยู่ใน Supabase ล็อกอินจากเครื่องไหนหรือเบราว์เซอร์ไหนก็เห็นข้อมูลชุดเดียวกัน
- ข้อมูลเก่าจากเวอร์ชันที่เก็บใน localStorage: กด "นำเข้าเป็นของฉัน" แล้วแอปจะย้ายข้อมูลนั้นไปเก็บที่ key `expense-tracker:transactions:imported` (ไม่ลบทิ้ง)
- รายการจากแอปเวอร์ชันแรก (ก่อนมีสกุลเงิน/หมวดหมู่) จะถูกแปลงเป็น THB หมวด "อื่น ๆ" และข้อความเดิมย้ายไปเป็นหมายเหตุ
  ก่อนแปลง แอปสำรองข้อมูลเดิมไว้ที่ localStorage ชื่อ `expense-tracker:transactions:backup-v1`

## ตำแหน่ง (location) และความเป็นส่วนตัว

- ครั้งแรกเบราว์เซอร์จะถาม "อนุญาตให้ใช้ตำแหน่งไหม" ต้องกดอนุญาตจึงจะหาตำแหน่งให้อัตโนมัติ (ใช้ได้บน https และ localhost)
- ไม่อนุญาตหรือหาไม่เจอ **ยังบันทึกได้ตามปกติ** พิมพ์ชื่อสถานที่เองได้ หรือปล่อยว่าง = "ไม่ระบุตำแหน่ง"
- บนคอมพิวเตอร์ไม่มี GPS ตำแหน่งมาจาก Wi-Fi/IP อาจคลาดหลายร้อยเมตร (แอปเก็บค่าความแม่นยำ ± เมตร ไว้ด้วย)
- ชื่อสถานที่ได้จาก OpenStreetMap (Nominatim) โดยเซิร์ฟเวอร์ของแอปส่งไปแค่พิกัด ไม่ส่งข้อมูลผู้ใช้
- **ตำแหน่งจะขึ้นในการ์ด Teams ที่ทุกคนในช่องเห็น** ควรแจ้งพนักงานก่อนเริ่มใช้ และใครไม่อยากระบุก็กด ✕ ได้ทุกครั้ง
- ตั้งค่าฐานข้อมูล: รัน `supabase/migrations/0002_transaction_location.sql` (เพิ่มคอลัมน์ตำแหน่ง รายการเก่าไม่กระทบ)
