# ASP.NET Core + Axios CRUD

Mở **HUONG_DAN_CHI_TIET.html** bằng trình duyệt để đọc hướng dẫn tiếng Việt từ đầu đến cuối. Bản Markdown tương ứng: HUONG_DAN_CHI_TIET.md.

- Backend: ASP.NET Core 10, controller Products, EF Core 10.0.14, SQLite.
- Frontend: HTML/CSS/JavaScript và Axios (cài qua npm).
- Database được tạo bằng migration InitialCreate đã kèm sẵn.
- Cổng API: http://localhost:5080. Cổng frontend: http://localhost:5500.
- Cài .NET 10 SDK và Node.js LTS trước. Mở hai terminal để chạy hai server.

Từ thư mục gốc:

```powershell
dotnet tool restore
cd .\backend\Lab.Api
dotnet restore
dotnet ef database update
dotnet run --launch-profile http
```

Terminal thứ hai:

```powershell
cd D:\ASP.NET-Core-Axios-CRUD\frontend
npm ci
npm start
```

Thay đường dẫn D: bằng nơi bạn giải nén. Mở http://localhost:5500. Không cần chạy lại `migrations add InitialCreate` vì migration đã tồn tại.
