# Bài tập 2 + 3: React + ASP.NET Core + SQLite

Ứng dụng đăng ký, đăng nhập bằng email/password và quản lý sản phẩm bằng Axios. React Context giữ user hiện tại; localStorage lưu token, ngày hết hạn và user để duy trì phiên. Mật khẩu chỉ được lưu dưới dạng hash trong DB, không lưu trong localStorage.

## Chạy ứng dụng

Yêu cầu .NET 10 SDK, Node.js 22.12 trở lên (hoặc Node.js 24), Microsoft Edge nếu chạy kiểm thử giao diện.

Tại thư mục gốc, chạy backend:

```powershell
dotnet tool restore
dotnet restore backend/Lab.Api
dotnet ef database update --project backend/Lab.Api
dotnet run --project backend/Lab.Api --launch-profile http
```

Mở terminal thứ hai:

```powershell
cd frontend
npm.cmd ci
npm.cmd start
```

Mở http://localhost:5500. Chọn **Chưa có tài khoản? Đăng ký**, nhập email, mật khẩu và xác nhận mật khẩu. Sau khi đăng ký thành công, đăng nhập để quản lý sản phẩm. API chạy tại http://localhost:5080.

Migration `AddUserAuthentication` bổ sung `Users` và `UserSessions`, giữ nguyên bảng sản phẩm có sẵn. Cần chạy lệnh cập nhật DB trước khi khởi động API. Danh sách sản phẩm hiện dùng chung cho các tài khoản đã đăng nhập.

## Kiểm thử

Khi API đang chạy:

```powershell
python scripts/smoke_test.py
cd frontend
npm.cmd run build
npm.cmd run test:e2e
```

Kiểm thử giao diện tự khởi động frontend tại cổng 5500; dừng frontend đang chạy trước khi chạy lệnh này. Các kiểm thử tạo tài khoản email ngẫu nhiên và xóa sản phẩm do chúng tạo sau khi hoàn tất thành công.

Chi tiết luồng, API và các file thực hiện: [HUONG_DAN_CHI_TIET.md](HUONG_DAN_CHI_TIET.md).
