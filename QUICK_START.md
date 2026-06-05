# Quick Start - Admin System Setup

## Bước 1: Cài dependencies

```bash
cd D:\Cô Hạ\Hacofood.vn\hacofood
npm install
```

## Bước 2: Cấu hình environment

Tạo `.env.local` (nếu chưa có):

```env
JWT_SECRET=change-this-to-random-string-in-production
DATABASE_URL=postgresql://user:password@host:port/dbname
ADMIN_PASSWORD=hacofood2024
```

Lưu ý:
- `JWT_SECRET`: Tạo random string mạnh để production
- `DATABASE_URL`: Phải là PostgreSQL database
- `ADMIN_PASSWORD`: Dùng cho legacy admin endpoint

## Bước 3: Tạo Admin Account đầu tiên

### Option A: Dùng script Node.js (Recommended)

```bash
node CREATE_ADMIN.js
```

Script sẽ in ra bcrypt hash. Copy hash đó và chạy SQL:

```sql
-- Paste into your PostgreSQL client
INSERT INTO staff (name, email, password_hash, role, status, created_at)
VALUES (
  'Bếp Cô Hạ',
  'admin@hacofood.vn',
  'PASTE_HASH_HERE',
  'admin',
  'active',
  NOW()
);
```

### Option B: Online bcrypt

1. Truy cập https://bcrypt.online/
2. Tạo hash từ password
3. Copy hash vào SQL INSERT

### Option C: Change password in CREATE_ADMIN.js

```javascript
const ADMIN_PASSWORD = 'your-password'; // Change this
```

Rồi chạy `node CREATE_ADMIN.js`

## Bước 4: Chạy development server

```bash
npm run dev
```

Truy cập: http://localhost:3000/admin

## Bước 5: Login

Nhập:
- **Email**: admin@hacofood.vn (hoặc email bạn tạo)
- **Password**: Mật khẩu bạn đặt

Token sẽ lưu vào localStorage tự động.

## Bước 6: Thêm nhân viên

1. Vào tab "Quản lý nhân viên"
2. Điền form "Thêm nhân viên mới":
   - Tên
   - Email
   - Mật khẩu
   - Role (Admin/Nhân viên)
3. Click "Thêm nhân viên"

Hành động tự động ghi vào audit log.

## Bước 7: Quản lý dữ liệu

### Tab 1: Nhận quà
- Xem danh sách người đăng ký nhận quà
- Tìm kiếm theo tên/email/SĐT
- Xuất CSV

### Tab 2: Đăng ký khóa học
- Xem danh sách đăng ký khóa học
- Xem trạng thái thanh toán
- Xuất CSV

### Tab 3: Quản lý nhân viên
- Tạo nhân viên
- Chỉnh sửa role/status
- Xóa nhân viên (soft delete)

### Tab 4: Lịch sử chỉnh sửa
- Xem tất cả thay đổi dữ liệu
- Filter theo hành động (INSERT/UPDATE/DELETE)
- Filter theo bảng (gift_leads/course_leads/staff)

### Tab 5: Cài đặt khóa học
- Chỉnh sửa tên khóa học
- Chỉnh sửa giá gốc
- Chỉnh sửa giá khuyến mãi
- Chỉnh sửa mô tả
- Lưu thay đổi

## Chuyên sâu: Database

### Create tables manually (nếu auto-init không chạy)

```sql
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES staff(id),
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name TEXT NOT NULL CHECK (table_name IN ('gift_leads', 'course_leads', 'staff')),
  record_id INT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT
);

CREATE TABLE IF NOT EXISTS course_settings (
  id SERIAL PRIMARY KEY,
  course_name TEXT DEFAULT 'Khóa học Dưa Cà Muối',
  course_price INTEGER DEFAULT 1095000,
  discount_price INTEGER DEFAULT 299000,
  course_description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default course settings
INSERT INTO course_settings (course_name, course_price, discount_price)
VALUES ('Khóa học Dưa Cà Muối', 1095000, 299000)
ON CONFLICT DO NOTHING;
```

## Build & Deploy

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Verify build
```bash
npm run build  # Should complete without errors
```

## Troubleshooting

### "Sai email hoặc mật khẩu" khi login
- Kiểm tra email chính xác
- Kiểm tra password chính xác
- Kiểm tra staff.status = 'active'

### "Token hết hạn"
- Đăng xuất rồi đăng nhập lại
- Token hạn 7 ngày

### "Không có quyền"
- Tài khoản phải là admin
- Kiểm tra role = 'admin' trong database

### Data không cập nhật
- Check auto-refresh (mỗi 30s)
- Click "Làm mới" button
- F5 refresh page

### Audit log không ghi
- Kiểm tra user_id là admin (role = 'admin')
- Kiểm tra table audit_logs tồn tại

## Support

Xem chi tiết:
- `ADMIN_SETUP.md` - Hướng dẫn chi tiết
- `IMPLEMENTATION_SUMMARY.md` - Tóm tắt technical

## API Endpoints (if needed)

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hacofood.vn","password":"password123"}'

# Get staff
curl -X GET http://localhost:3000/api/staff \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get audit logs
curl -X GET "http://localhost:3000/api/audit-logs?action=INSERT" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get course settings
curl -X GET http://localhost:3000/api/settings/course
```
