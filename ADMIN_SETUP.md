# Admin System Setup Guide

## Khởi động hệ thống Admin nâng cao

Hệ thống admin mới có 5 tabs quản lý: Nhận quà, Đăng ký khóa học, Quản lý nhân viên, Lịch sử chỉnh sửa, Cài đặt khóa học.

### 1. Database Initialization

Chạy lần đầu tiên để tạo các bảng mới:

```bash
npm run dev
# Truy cập http://localhost:3000/api/admin-data (sẽ tạo bảng tự động)
```

Database sẽ tự động khởi tạo các bảng:
- `staff` - Quản lý nhân viên admin
- `audit_logs` - Ghi lại tất cả hoạt động thay đổi dữ liệu
- `course_settings` - Cài đặt khóa học

### 2. Environment Variables

Thêm vào `.env.local`:

```env
# JWT Secret for authentication (change in production)
JWT_SECRET=your-super-secret-key-change-this

# Database URL (keep existing)
DATABASE_URL=postgresql://user:password@host:port/db

# Admin password for legacy admin page (keep existing)
ADMIN_PASSWORD=hacofood2024
```

### 3. Tạo Admin Account đầu tiên

Chạy SQL script dưới PostgreSQL client:

```sql
-- Hash password "password123" bằng bcrypt (salt rounds: 10)
-- Bạn có thể dùng online bcrypt generator hoặc chạy:
-- const hash = await bcrypt.hash("password123", 10)

INSERT INTO staff (name, email, password_hash, role, status)
VALUES (
  'Bếp Cô Hạ',
  'admin@hacofood.vn',
  '$2b$10$YourBcryptHashHere',  -- Replace with actual bcrypt hash
  'admin',
  'active'
);
```

Hoặc tạo nhanh bằng Node.js:

```javascript
// node script.js
const bcrypt = require('bcrypt');

const password = 'password123';
bcrypt.hash(password, 10).then(hash => {
  console.log(hash);
  // Copy hash và dùng trong SQL INSERT
});
```

### 4. Login

Truy cập `http://localhost:3000/admin`

Đăng nhập với:
- Email: `admin@hacofood.vn`
- Password: `password123`

Token JWT sẽ lưu vào `localStorage` tự động.

## Tab 1: Nhận quà

Danh sách người đăng ký nhận quà tặng.
- Tìm kiếm theo tên, email, SĐT
- Xuất CSV

## Tab 2: Đăng ký khóa học

Danh sách người đăng ký khóa học, trạng thái thanh toán.
- Filter theo trạng thái thanh toán
- Xuất CSV

## Tab 3: Quản lý nhân viên

### Thêm nhân viên

Form ở trên cùng:
- Tên
- Email (UNIQUE)
- Mật khẩu (sẽ hash bcrypt tự động)
- Role: Admin hoặc Nhân viên

### Chỉnh sửa nhân viên

Inline edit:
- **Role**: Dropdown để thay đổi quyền (admin/staff)
- **Trạng thái**: Dropdown để khóa/mở tài khoản
- **Xóa**: Soft delete (set status = 'inactive')

Các thay đổi tự động ghi vào audit log.

## Tab 4: Lịch sử chỉnh sửa

Xem tất cả thay đổi dữ liệu:
- Ai thực hiện (user name)
- Hành động: Thêm (INSERT), Sửa (UPDATE), Xóa (DELETE)
- Bảng: gift_leads, course_leads, staff
- Record ID
- Thời gian

### Filters

- **Hành động**: Tất cả / Thêm / Sửa / Xóa
- **Bảng**: Tất cả / Quà tặng / Khóa học / Nhân viên
- **Thời gian**: Có thể extend thêm date range filter

## Tab 5: Cài đặt khóa học

Quản lý thông tin khóa học:
- **Tên khóa học**: "Khóa học Dưa Cà Muối"
- **Giá gốc**: 1.095.000đ (default)
- **Giá khuyến mãi**: 299.000đ (giá hiện tại)
- **Mô tả khóa học**: Text area cho mô tả chi tiết

Lưu ý: Giá được lưu dưới dạng số nguyên (đơn vị: đồng), không dấu phân cách.

## API Endpoints

### Authentication

```
POST /api/auth/login
{
  "email": "admin@hacofood.vn",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@hacofood.vn",
    "name": "Bếp Cô Hạ",
    "role": "admin"
  }
}
```

```
POST /api/auth/logout
(No body needed, handled client-side)
```

```
GET /api/auth/me
Headers: Authorization: Bearer {token}

Response:
{
  "id": 1,
  "email": "admin@hacofood.vn",
  "name": "Bếp Cô Hạ",
  "role": "admin",
  "status": "active",
  "lastLogin": "2024-06-05T10:30:00Z"
}
```

### Staff Management

```
GET /api/staff
Headers: Authorization: Bearer {token}
(Requires admin role)

Response:
{
  "staff": [
    {
      "id": 1,
      "name": "Bếp Cô Hạ",
      "email": "admin@hacofood.vn",
      "role": "admin",
      "status": "active",
      "created_at": "2024-06-05T10:00:00Z",
      "last_login": "2024-06-05T10:30:00Z"
    }
  ]
}
```

```
POST /api/staff/create
Headers: Authorization: Bearer {token}
{
  "name": "Nhân viên mới",
  "email": "staff@hacofood.vn",
  "password": "password123",
  "role": "staff"
}

Response:
{
  "message": "Tạo nhân viên thành công",
  "staff": { ... }
}
```

```
PATCH /api/staff/:id
Headers: Authorization: Bearer {token}
{
  "role": "admin",  // optional
  "status": "inactive"  // optional
}

Response:
{
  "message": "Cập nhật thành công",
  "staff": { ... }
}
```

```
DELETE /api/staff/:id
Headers: Authorization: Bearer {token}
(Soft delete - sets status to 'inactive')

Response:
{
  "message": "Xóa thành công"
}
```

### Audit Logs

```
GET /api/audit-logs?action=INSERT&table=staff&limit=100&offset=0
Headers: Authorization: Bearer {token}

Query params:
- action: INSERT|UPDATE|DELETE (optional)
- table: gift_leads|course_leads|staff (optional)
- startDate: ISO date string (optional)
- endDate: ISO date string (optional)
- limit: number (default: 100)
- offset: number (default: 0)

Response:
{
  "logs": [
    {
      "id": 1,
      "user_id": 1,
      "user_name": "Bếp Cô Hạ",
      "action": "INSERT",
      "table_name": "staff",
      "record_id": 2,
      "old_value": null,
      "new_value": {
        "id": 2,
        "name": "Nhân viên mới",
        "email": "staff@hacofood.vn",
        "role": "staff",
        "status": "active"
      },
      "created_at": "2024-06-05T10:15:00Z",
      "ip_address": "127.0.0.1"
    }
  ],
  "count": 1,
  "limit": 100,
  "offset": 0
}
```

### Course Settings

```
GET /api/settings/course
(No auth required - public)

Response:
{
  "id": 1,
  "course_name": "Khóa học Dưa Cà Muối",
  "course_price": 1095000,
  "discount_price": 299000,
  "course_description": "...",
  "updated_at": "2024-06-05T10:00:00Z"
}
```

```
PUT /api/settings/course
Headers: Authorization: Bearer {token}
(Requires admin role)
{
  "courseName": "Khóa học Dưa Cà Muối",
  "coursePrice": 1095000,
  "discountPrice": 299000,
  "courseDescription": "..."
}

Response:
{
  "message": "Cập nhật thành công",
  "settings": { ... }
}
```

## Auto Audit Logging

Mỗi hành động thay đổi dữ liệu sẽ tự động ghi log:

1. **Tạo nhân viên** → INSERT audit log
2. **Chỉnh sửa nhân viên** → UPDATE audit log (ghi old_value và new_value)
3. **Xóa nhân viên** → DELETE audit log

Audit log bao gồm:
- user_id: ID người thực hiện
- action: INSERT/UPDATE/DELETE
- table_name: gift_leads/course_leads/staff
- record_id: ID bản ghi bị thay đổi
- old_value: Giá trị cũ (JSON)
- new_value: Giá trị mới (JSON)
- ip_address: IP của request
- created_at: Thời gian thực hiện

## Security

1. **JWT Token**: Có thời hạn 7 ngày, lưu tại localStorage
2. **Password**: Hash bcrypt với 10 salt rounds
3. **Authorization**: Tất cả endpoint API (trừ settings/course GET) cần token JWT
4. **Role-based**: Chỉ admin mới có quyền quản lý staff, audit logs, settings
5. **IP tracking**: Mỗi audit log ghi lại IP address của request

## Production Checklist

- [ ] Đổi `JWT_SECRET` thành giá trị random mạnh
- [ ] Đổi `ADMIN_PASSWORD` nếu vẫn dùng legacy admin page
- [ ] Tạo admin account đầu tiên bằng bcrypt hash
- [ ] Enable HTTPS trong production
- [ ] Cấu hình CORS nếu cần
- [ ] Regular backup database
- [ ] Monitor audit logs định kỳ

## Troubleshooting

### Lỗi "Invalid token"
- Token hết hạn (7 ngày) → Cần đăng nhập lại
- Token không được gửi đúng → Kiểm tra header `Authorization: Bearer {token}`

### Lỗi "Không có quyền"
- Tài khoản không phải admin
- Token hết hạn

### Password không đúng
- Kiểm tra bcrypt hash trong database
- Verify password logic dùng bcrypt.compare()

### Audit log không ghi
- Kiểm tra table `audit_logs` tồn tại
- Kiểm tra user_id hợp lệ (FK → staff.id)
