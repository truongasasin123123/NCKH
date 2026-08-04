# NCKH Frontend

Frontend cho hệ thống quản lý đề tài nghiên cứu khoa học sinh viên. Ứng dụng cung cấp giao diện riêng cho sinh viên, nhóm trưởng, giảng viên hướng dẫn, thành viên hội đồng và quản trị viên.

## Công nghệ

- React 19, TypeScript và Vite
- Ant Design
- React Router
- Axios và JWT decode

## Chức năng chính

- Đăng ký, xem, chỉnh sửa và theo dõi đề tài theo quyền thành viên.
- Quản lý mốc tiến độ, báo cáo tiến độ và tài liệu minh chứng.
- Xem tài liệu đề tài theo quyền được cấp.
- Xét duyệt nhiều thành viên; hiển thị trạng thái, lịch sử và lý do từ chối.
- Luồng phân công hội đồng theo đề tài: nhóm trưởng gửi yêu cầu, Admin chấp nhận/từ chối, có thể gửi lại yêu cầu bị từ chối.
- Quản lý hội đồng, thành viên hội đồng, loại tài liệu và tài khoản dành cho Admin.
- Nghiệm thu: phiếu chấm, điểm trung bình, điểm cuối cùng và kết luận của Chủ tịch.

## Cấu trúc mã nguồn

```text
src/
├─ components/     # Giao diện tái sử dụng theo chức năng
├─ hooks/          # Logic React: topic-detail, progress-management, ...
├─ pages/          # Các trang và điều hướng
├─ services/       # Gọi REST API, không phụ thuộc giao diện
│  ├─ topic/
│  ├─ council/
│  ├─ progress/
│  └─ notification/
└─ style/
```

## Yêu cầu

- Node.js 20 trở lên
- Backend NestJS đang chạy (mặc định `http://localhost:3000`)

## Cài đặt

```bash
npm install
copy .env.example .env
```

Thiết lập URL backend trong `.env`:

```env
VITE_API_URL=http://localhost:3000
```

Chạy môi trường phát triển:

```bash
npm run dev
```

Ứng dụng mặc định chạy tại `http://localhost:5173`.

## Scripts

```bash
npm run dev      # Chạy Vite development server
npm run build    # Kiểm tra TypeScript và build production
npm run lint     # Kiểm tra lint
npm run preview  # Xem bản build production tại local
```

## Luồng phân công hội đồng

1. Nhóm trưởng gửi yêu cầu theo trạng thái đề tài:
   - `Nháp` → Hội đồng xét duyệt.
   - `Bắt đầu` / `Đã phê duyệt` → Hội đồng theo dõi.
   - `Chờ nghiệm thu` → Hội đồng nghiệm thu.
2. Admin chọn một hội đồng đã có thành viên để chấp nhận hoặc nhập lý do từ chối.
3. Khi được chấp nhận, hội đồng được gán vào đúng đề tài; nhóm trưởng tiếp tục gửi hồ sơ xét duyệt hoặc nghiệm thu theo luồng.

