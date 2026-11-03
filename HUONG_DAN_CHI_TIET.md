# Kết hợp bài tập 1 và 2: đăng ký, đăng nhập và CRUD

## Các phần thực hiện

| Yêu cầu | File thực hiện |
| --- | --- |
| Form đăng ký/đăng nhập, xác nhận mật khẩu | `frontend/src/main.jsx` |
| Validate email, mật khẩu tại frontend | `frontend/src/main.jsx` |
| Validate bắt buộc tại API | `backend/Lab.Api/Dtos/AuthRequest.cs` |
| Lưu user, query email, kiểm tra password hash | `backend/Lab.Api/Controllers/AuthController.cs` |
| React Context, khôi phục và đăng xuất | `frontend/src/AuthContext.jsx` |
| Axios dùng chung, tự gắn Bearer token | `frontend/src/api.js`, `AuthContext.jsx` |
| CRUD sản phẩm bằng React | `frontend/src/Products.jsx` |
| Xác thực token và tra DB | `backend/Lab.Api/Auth/SessionAuthenticationHandler.cs` |
| Bảng user và phiên, email duy nhất | `backend/Lab.Api/Data/AppDbContext.cs`, `Models/`, `Migrations/` |

## Luồng đăng ký

1. Người dùng nhập email, password và xác nhận password. React kiểm tra email, giới hạn 254 ký tự, password từ 8 đến 128 ký tự, không chỉ chứa khoảng trắng và xác nhận khớp.
2. Axios gọi `POST /api/auth/register`. Backend kiểm tra dữ liệu lại qua DataAnnotations, chuẩn hóa email thành chữ thường và kiểm tra email trùng trong DB.
3. `PasswordHasher<User>` tạo hash kèm salt. EF Core lưu `Email` và `PasswordHash` trong SQLite. Unique index bảo đảm không có hai user cùng email kể cả khi đăng ký đồng thời.
4. API trả `201` cùng id/email. Frontend chuyển sang form đăng nhập và xóa các trường mật khẩu. Email trùng trả `409`; dữ liệu sai trả `400`.

## Luồng đăng nhập và phiên

1. Axios gọi `POST /api/auth/login`. Backend query bảng `Users` theo email đã chuẩn hóa, rồi gọi `VerifyHashedPassword` so sánh password với hash. Sai email hoặc password trả cùng thông báo `401`.
2. Đăng nhập thành công tạo token ngẫu nhiên 32 byte, hết hạn sau 7 ngày. DB chỉ giữ SHA-256 của token trong `UserSessions`. API trả `{ token, expiresAt, user: { id, email } }`.
3. `AuthProvider` lưu kết quả vào localStorage với key `lab.auth`, đặt user vào state và gắn `Authorization: Bearer <token>` cho Axios. Các component dùng `useAuth()` đọc user qua Context.
4. Khi tải lại trang, ứng dụng đọc localStorage và gọi `GET /api/auth/me` để xác minh token và lấy user từ DB. Màn hình chờ xuất hiện trong lúc kiểm tra. User bị sửa trong localStorage không được dùng thay cho kết quả DB.
5. Backend xác thực mỗi request bằng hash token, ngày hết hạn và user trong DB. API sản phẩm có `[Authorize]`; không thể truy cập chỉ bằng cách thay localStorage.
6. Khi nhận `401`, Context xóa phiên và quay về đăng nhập. Khi mất kết nối trong lúc khôi phục, ứng dụng giữ dữ liệu phiên để người dùng thử lại. Phiên hết hạn tự quay về đăng nhập. Sự kiện `storage` đồng bộ thay đổi giữa các tab.
7. Đăng xuất gọi `POST /api/auth/logout` để xóa phiên trong DB, sau đó xóa Context và localStorage. Token cũ không dùng lại được. Nếu API không kết nối được, ứng dụng báo lỗi để người dùng thử đăng xuất lại.

## API

| Method | Endpoint | Nội dung |
| --- | --- | --- |
| POST | `/api/auth/register` | Body `{ email, password }`; trả `201`, `400`, `409` |
| POST | `/api/auth/login` | Body `{ email, password }`; trả token và user hoặc `400`/`401` |
| GET | `/api/auth/me` | Bearer token; trả id/email hoặc `401` |
| POST | `/api/auth/logout` | Bearer token; thu hồi phiên, trả `204` |
| GET, POST | `/api/products` | Danh sách/thêm sản phẩm; cần đăng nhập |
| GET, PUT, DELETE | `/api/products/{id}` | Xem/sửa/xóa sản phẩm; cần đăng nhập |

Mẫu gọi API có trong `backend/Lab.Api/requests.http`. Cấu hình DB và CORS trong `appsettings.json`. Có thể đặt `VITE_API_URL` để đổi địa chỉ API frontend (mặc định `http://localhost:5080/api`); khi đổi origin frontend cần cập nhật CORS tương ứng.

## Kiểm tra kết quả

Xem lệnh cài đặt và chạy trong [README.md](README.md). Kiểm thử HTTP bao phủ validate, email trùng, đăng nhập sai, phiên hợp lệ/thu hồi/giả mạo, CORS và CRUD. Kiểm thử Playwright trên Edge bao phủ form, xác nhận password, đăng nhập, tải lại trang, dữ liệu user bị sửa trong localStorage, CRUD và đăng xuất giữa nhiều tab.

Đây là bài thực hành chạy local. Chưa có xác minh email, quên mật khẩu, giới hạn số lần đăng nhập hoặc phân quyền sản phẩm theo chủ sở hữu. Khi triển khai thực tế cần HTTPS và đánh giá cách lưu token trong localStorage vì JavaScript cùng origin có thể đọc token.

Tài liệu tham khảo: [React useContext](https://react.dev/reference/react/useContext), [ASP.NET Core IPasswordHasher](https://github.com/dotnet/aspnetcore/blob/main/src/Identity/Extensions.Core/src/IPasswordHasher.cs).
