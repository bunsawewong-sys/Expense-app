# บันทึกรายรับรายจ่าย (Personal Expense Tracker)

แอปบันทึกรายรับรายจ่ายส่วนตัว สร้างด้วย Next.js + Tailwind CSS
ข้อมูลทั้งหมดเก็บไว้ในเบราว์เซอร์ (localStorage) ของเครื่องที่ใช้งาน

## ฟีเจอร์

- เพิ่มรายการ: เลือกประเภท หมวดหมู่ (ปุ่มไอคอน) จำนวนเงิน สกุลเงิน วันที่ และหมายเหตุ
- แก้ไขรายการ (ไอคอนดินสอ) และลบรายการ (ไอคอนถังขยะ มีกล่องยืนยันก่อนลบ)
- ประวัติรายการจัดกลุ่มรายวัน วันล่าสุดอยู่บน พร้อมยอด รับ / จ่าย / คงเหลือ ของแต่ละวัน
- หลายสกุลเงิน: THB, USD, EUR, JPY, CNY, SGD ยอดรวมแยกตามสกุล (เลือกดูด้วยแท็บเหนือการ์ดสรุป)
- โหมดสี: อัตโนมัติ (06:00–18:00 สว่าง, 18:00–06:00 มืด) / สว่าง / มืด จำค่าที่เลือกไว้
- สลับภาษา ไทย / English ทั้งหน้าจอ จำค่าที่เลือกไว้
- รองรับมือถือ

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
| `src/app/page.tsx` | หน้าหลัก: ถือรายการทั้งหมดและภาษา, เพิ่ม/แก้ไข/ลบ, อ่าน/บันทึก localStorage |
| `src/app/layout.tsx` | กรอบหน้าเว็บ ฟอนต์ไทย และสคริปต์เลือกโหมดสีก่อนหน้าเว็บแสดง |
| `src/app/globals.css` | สีหลัก (`--color-brand: #2486ff`) และการตั้งค่าโหมดมืด |
| `src/components/TransactionForm.tsx` | ฟอร์มเพิ่ม/แก้ไขรายการ (ใช้ตัวเดียวกัน) |
| `src/components/CategoryPicker.tsx` | ปุ่มเลือกหมวดหมู่ |
| `src/components/TransactionLog.tsx` | ประวัติรายการจัดกลุ่มรายวัน พร้อมปุ่มแก้ไข/ลบ |
| `src/components/SummaryCards.tsx` | การ์ดสรุป 3 ใบ + แท็บเลือกสกุลเงิน |
| `src/components/Modal.tsx` | กล่องลอย (ใช้กับแก้ไขและยืนยันลบ) |
| `src/components/DeleteConfirm.tsx` | เนื้อหากล่องยืนยันลบ |
| `src/components/ThemeToggle.tsx` / `LanguageToggle.tsx` | ปุ่มสลับโหมดสี / ภาษา |
| `src/components/Icons.tsx` | ไอคอน SVG (ดินสอ ถังขยะ ดวงอาทิตย์ พระจันทร์ นาฬิกา) |
| `src/lib/transactions.ts` | ชนิดข้อมูล, อ่าน/เขียน localStorage, แปลงข้อมูลเก่า, รวมยอด, จัดกลุ่มรายวัน, รูปแบบวันที่ |
| `src/lib/currencies.ts` | รายชื่อสกุลเงินและการแสดงจำนวนเงิน |
| `src/lib/categories.ts` | รายชื่อหมวดหมู่ (ไอคอน + ชื่อไทย/อังกฤษ) |
| `src/lib/i18n.ts` | ข้อความทุกจุดบนหน้าจอ ภาษาไทยและอังกฤษ |
| `src/lib/theme.ts` | กติกาโหมดสีตามเวลา |

## ข้อควรรู้เรื่องข้อมูล

- ข้อมูลอยู่ใน **เบราว์เซอร์ตัวที่ใช้เปิดแอป** เท่านั้น ถ้าเปิดจาก Chrome แล้วไปเปิดจาก Edge จะไม่เห็นข้อมูลเดียวกัน
- ถ้าล้างประวัติ/ข้อมูลเว็บไซต์ (Clear browsing data) ข้อมูลในแอปจะหายด้วย
- รายการจากแอปเวอร์ชันแรก (ก่อนมีสกุลเงิน/หมวดหมู่) จะถูกแปลงเป็น THB หมวด "อื่น ๆ" และข้อความเดิมย้ายไปเป็นหมายเหตุ
  ก่อนแปลง แอปสำรองข้อมูลเดิมไว้ที่ localStorage ชื่อ `expense-tracker:transactions:backup-v1`
