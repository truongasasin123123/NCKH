# Backend API Requirements for Progress Management

## Database Schema

### Table: MocTienDo
```sql
CREATE TABLE MocTienDo (
    MaMoc VARCHAR(50) PRIMARY KEY,
    MaDT VARCHAR(50) NOT NULL,
    TenMoc NVARCHAR(255) NOT NULL,
    MoTa NVARCHAR(1000),
    NgayBatDau DATE NOT NULL,
    NgayKetThuc DATE NOT NULL,
    ThuTu INT NOT NULL,
    TrongSo DECIMAL(5,2) NOT NULL, -- % trọng số (0-100)
    TrangThai NVARCHAR(50) DEFAULT 'Chưa bắt đầu',
    FOREIGN KEY (MaDT) REFERENCES DeTai(MaDT)
);
```

### Table: CapNhatTienDo
```sql
CREATE TABLE CapNhatTienDo (
    MaCapNhat INT IDENTITY(1,1) PRIMARY KEY,
    MaMoc VARCHAR(50) NOT NULL,
    TaiKhoan VARCHAR(50) NOT NULL,
    NgayCapNhat DATETIME DEFAULT GETDATE(),
    PhanTramHT DECIMAL(5,2) NOT NULL, -- % hoàn thành (0-100)
    GhiChu NVARCHAR(1000),
    TepDinhKem NVARCHAR(500), -- URL/path file
    FOREIGN KEY (MaMoc) REFERENCES MocTienDo(MaMoc)
);
```

## API Endpoints

### 1. GET /api/progress/moc/:maDT
- **Description**: Lấy danh sách mốc tiến độ của đề tài
- **Response**: Array of MocTienDo

### 2. GET /api/progress/capnhat/:maMoc
- **Description**: Lấy lịch sử cập nhật của một mốc
- **Response**: Array of CapNhatTienDo

### 3. GET /api/progress/topic/:maDT
- **Description**: Lấy toàn bộ dữ liệu tiến độ đề tài (mốc + cập nhật + % tổng thể)
- **Response**:
```json
{
  "MaDT": "DT001",
  "TenDT": "Đề tài ABC",
  "PhanTramTongThe": 50.0,
  "MocTienDo": [...],
  "CapNhatTienDo": [...]
}
```

### 4. POST /api/progress/moc
- **Description**: Tạo mốc tiến độ mới
- **Body**: MocTienDo (không có MaMoc)
- **Auth**: Chỉ Chủ nhiệm

### 5. PUT /api/progress/moc/:maMoc
- **Description**: Cập nhật mốc tiến độ
- **Body**: Partial<MocTienDo>
- **Auth**: Chỉ Chủ nhiệm

### 6. DELETE /api/progress/moc/:maMoc
- **Description**: Xóa mốc tiến độ
- **Auth**: Chỉ Chủ nhiệm

### 7. POST /api/progress/capnhat
- **Description**: Cập nhật % hoàn thành mốc
- **Body**: CapNhatTienDo (không có MaCapNhat)
- **Auth**: Chủ nhiệm hoặc Thành viên

### 8. POST /api/progress/upload
- **Description**: Upload file minh chứng
- **Body**: FormData with file
- **Response**: { "url": "path/to/file" }

## Business Logic

### Tính % Tổng thể
```sql
-- Trong stored procedure hoặc code
SELECT
    SUM((ISNULL(latest.PhanTramHT, 0) * m.TrongSo) / 100) as PhanTramTongThe
FROM MocTienDo m
LEFT JOIN (
    SELECT MaMoc, PhanTramHT
    FROM CapNhatTienDo c1
    WHERE NgayCapNhat = (
        SELECT MAX(NgayCapNhat)
        FROM CapNhatTienDo c2
        WHERE c2.MaMoc = c1.MaMoc
    )
) latest ON m.MaMoc = latest.MaMoc
WHERE m.MaDT = @MaDT
```

### Tự động cập nhật trạng thái
- Chạy job hàng ngày lúc 8h để cập nhật trạng thái các mốc
- Logic như đã mô tả trong requirements

### Cron Job cho thông báo
- Chạy hàng ngày lúc 8h
- Kiểm tra mốc sắp deadline (7 ngày, 1 ngày)
- Gửi thông báo qua NotificationService
- Khi % tổng = 100%, gửi thông báo hoàn thành

## Authorization
- Sử dụng JWT token để xác thực
- Decode token để lấy VaiTro và TaiKhoan
- Kiểm tra quyền theo logic đã mô tả