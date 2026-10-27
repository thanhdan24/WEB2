# ASP.NET Core API + Axios + EF Core: hướng dẫn từ đầu đến cuối

## 1. Kết quả của bài thực hành

Bạn xây dựng ứng dụng quản lý sản phẩm gồm frontend HTML/CSS/JavaScript, Axios gửi HTTP request, backend ASP.NET Core có controller, EF Core đọc/ghi dữ liệu và SQLite lưu dữ liệu trên đĩa.

Luồng xử lý: người dùng bấm nút → JavaScript gọi Axios → HTTP request tới controller → DbContext dùng EF Core → SQLite → backend trả HTTP response → frontend cập nhật danh sách.

| Yêu cầu | File/thành phần thực hiện |
|---|---|
| ASP.NET Core backend | backend/Lab.Api/Lab.Api.csproj và Program.cs |
| Controller và GET, POST, PUT, DELETE | Controllers/ProductsController.cs |
| Axios gửi đầy đủ request | frontend/app.js: productApi |
| Kết nối database | appsettings.json, Program.cs, Data/AppDbContext.cs |
| EF Core | Các package trong .csproj và lớp AppDbContext |
| Migration | backend/Lab.Api/Migrations/ |
| Giao diện CRUD | frontend/index.html, app.js, style.css |
| Mẫu request để test riêng | backend/Lab.Api/requests.http |

Đây là bài thực hành chạy local, chưa có đăng nhập hoặc phân quyền. Không đưa API sửa/xóa dữ liệu này ra Internet trước khi bổ sung các chức năng đó. Node chỉ phục vụ file frontend; API backend vẫn chạy bằng ASP.NET Core.

## 2. Cài công cụ trên Windows

### 2.1. Cài .NET SDK

1. Mở https://dotnet.microsoft.com/en-us/download/dotnet/10.0.
2. Trong phần **SDK**, chọn bộ cài Windows phù hợp máy: thường là x64; máy Windows ARM chọn Arm64.
3. Cài đặt đến khi hoàn tất. Cần SDK để build và chạy lệnh, chỉ cài Runtime là chưa đủ.
4. Đóng toàn bộ cửa sổ PowerShell và VS Code đang mở, sau đó mở lại để cập nhật PATH.
5. Kiểm tra bằng PowerShell:

```powershell
dotnet --version
dotnet --list-sdks
```

Phải thấy SDK 10.0.xxx. Project dùng target `net10.0`; SDK 8 hoặc 9 không build được target này.

Nếu gặp `dotnet : The term 'dotnet' is not recognized...`, lỗi nằm ở bộ công cụ hoặc PATH, chưa phải lỗi project. Kiểm tra:

```powershell
Test-Path "C:\Program Files\dotnet\dotnet.exe"
& "C:\Program Files\dotnet\dotnet.exe" --version
```

- Nếu lệnh đầu trả False: cài lại .NET 10 SDK đúng kiến trúc.
- Nếu trả True và lệnh thứ hai chạy được: mở cửa sổ terminal mới. Nếu vẫn lỗi, vào Start → tìm **Edit the system environment variables** → Environment Variables → Path → thêm `C:\Program Files\dotnet\` → OK và mở lại VS Code/PowerShell. Không xóa các mục PATH khác.
- Có thể tạm sử dụng đường dẫn đầy đủ đến `dotnet.exe` thay cho `dotnet`.
- Không cần cài riêng ASP.NET Core runtime nếu đã cài SDK tương ứng.

### 2.2. Cài Node.js và trình soạn thảo

1. Tải Node.js bản LTS tại https://nodejs.org/en/download và cài với npm.
2. Mở lại PowerShell rồi kiểm tra:

```powershell
node --version
npm --version
```

Dùng Node.js LTS hiện hành. Server frontend của bài cần tối thiểu Node 20.

3. Cài VS Code nếu chưa có. Extension C# Dev Kit giúp đọc, debug C#; REST Client là tùy chọn để chạy `requests.http`.
4. SQLite đã được sử dụng thông qua package của EF Core, không cần cài SQLite server hoặc SQL Server. Nếu muốn xem bảng bằng giao diện, có thể dùng phần mềm xem SQLite tùy chọn.

Nếu PowerShell báo `npm.ps1 cannot be loaded because running scripts is disabled`, dùng `npm.cmd` thay cho `npm` trong các lệnh bên dưới. Không cần đổi execution policy toàn hệ thống.

## 3. Giải nén và nhận diện thư mục

Giải nén ZIP vào ổ D. Giả sử thư mục gốc sau giải nén là:

```text
D:\ASP.NET-Core-Axios-CRUD
```

Bên trong thư mục này phải có `backend`, `frontend` và `.config`. Nếu phần mềm giải nén tạo thêm một tầng thư mục cùng tên, hãy đi vào thư mục con có đủ ba thành phần này. Nếu giải nén ở chỗ khác, thay đường dẫn trong mọi lệnh.

Cấu trúc chính:

```text
ASP.NET-Core-Axios-CRUD/
  .config/dotnet-tools.json
  backend/Lab.Api/
    Controllers/ProductsController.cs
    Data/AppDbContext.cs
    Dtos/ProductRequest.cs
    Models/Product.cs
    Migrations/
    Properties/launchSettings.json
    Program.cs
    appsettings.json
    Lab.Api.csproj
    requests.http
  frontend/
    index.html
    style.css
    app.js
    server.mjs
    package.json
    package-lock.json
  scripts/smoke_test.py
  HUONG_DAN_CHI_TIET.md
  KIEM_TRA.md
```

Mở VS Code → File → Open Folder → chọn thư mục gốc này.

## 4. Chạy bộ project có sẵn

### 4.1. Terminal thứ nhất: restore và tạo database

Mở PowerShell trong VS Code, nhập lần lượt:

```powershell
cd D:\ASP.NET-Core-Axios-CRUD
dotnet tool restore
cd .\backend\Lab.Api
dotnet restore
dotnet build
dotnet ef migrations list
dotnet ef database update
dotnet run --launch-profile http
```

Ý nghĩa:

- `dotnet tool restore`: cài công cụ `dotnet-ef` theo manifest có sẵn trong `.config`. Không cần cài global.
- `dotnet restore`: tải các package NuGet được khai báo trong project.
- `dotnet build`: biên dịch và phát hiện lỗi C#.
- `dotnet ef migrations list`: liệt kê migration của bài; trước khi cập nhật database, migration có thể được đánh dấu pending.
- `dotnet ef database update`: thực thi migration, tạo database và bảng.
- `dotnet run`: chạy server API. Để nguyên terminal này.

Kết quả mong đợi: log có `Now listening on: http://localhost:5080`. Mở http://localhost:5080/api/products; lần đầu nhận `[]` vì database chưa có sản phẩm.

**Project đã kèm migration InitialCreate, vì vậy khi chạy bộ có sẵn, KHÔNG chạy lại `dotnet ef migrations add InitialCreate`.** Phần 10 hướng dẫn tự tạo migration khi xây bài từ thư mục mới.

Database có tên `lab-products.db`, nằm trong `backend/Lab.Api` khi bạn chạy theo đúng thư mục trên. API không dùng database giả trong RAM và không dùng `EnsureCreated`. Migration được áp dụng bằng lệnh rõ ràng, không tự sửa schema lúc khởi động API.

### 4.2. Terminal thứ hai: chạy frontend

Bấm nút dấu cộng để mở terminal mới, không tắt terminal API:

```powershell
cd D:\ASP.NET-Core-Axios-CRUD\frontend
npm ci
npm start
```

`npm ci` cài Axios theo file lock. Nếu bạn đang tự dựng mới và chưa có file lock thì dùng `npm install` trước. Mở trình duyệt tại:

http://localhost:5500

Không mở `index.html` bằng cách nhấp đúp, vì địa chỉ `file://` không khớp CORS của bài. Không đổi sang cổng Live Server khác nếu chưa cập nhật CORS.

### 4.3. Thử đủ chức năng

1. Nhập tên `Bàn phím`, mô tả `Bàn phím cơ`, giá `450000`, số lượng `10`.
2. Bấm **Thêm sản phẩm**: frontend gửi POST, backend tạo bản ghi, trả 201; giao diện gửi GET để tải lại danh sách.
3. Bấm **Tải lại (GET)**: backend trả danh sách với mã 200.
4. Bấm **Sửa** ở một dòng: frontend gọi GET theo ID để lấy thông tin mới nhất; đổi giá thành `500000`, số lượng `8` rồi bấm **Lưu thay đổi**: gửi PUT và nhận 204, tiếp theo tải lại bằng GET.
5. Tắt API bằng Ctrl+C, chạy lại `dotnet run --launch-profile http`, bấm Tải lại: sản phẩm vẫn còn, chứng tỏ database lưu trên đĩa.
6. Bấm **Xóa**, xác nhận: gửi DELETE và nhận 204, tiếp theo GET để cập nhật danh sách.
7. Để xem request, bấm F12 → Network → Fetch/XHR, thực hiện lại các thao tác. Chọn request → xem Request Method, Status Code, Payload và Response. Request OPTIONS trước PUT/DELETE có thể là CORS preflight; đó là hành vi bình thường.

Trong các lần chạy sau, chỉ cần bật API và frontend; chỉ chạy `database update` khi có migration mới, và cài lại package khi cần.

## 5. Các endpoint và dữ liệu

| Method | URL | Chức năng | Thành công |
|---|---|---|---|
| GET | /api/products | Lấy danh sách | 200 + mảng JSON |
| GET | /api/products/{id} | Lấy một sản phẩm | 200 + JSON |
| POST | /api/products | Tạo mới | 201 + JSON + Location |
| PUT | /api/products/{id} | Thay các trường có thể sửa | 204, không có body |
| DELETE | /api/products/{id} | Xóa | 204, không có body |

POST và PUT nhận cùng cấu trúc JSON:

```json
{
  "name": "Bàn phím",
  "description": "Bàn phím cơ",
  "price": 450000,
  "quantity": 10
}
```

Không truyền `id` để tự chọn khóa khi tạo mới. Database tự sinh ID. Lấy ID thật từ response POST hoặc GET, không mặc định mọi lần thêm đều có ID 1.

Các lỗi có chủ đích: dữ liệu sai → 400; ID dương không tồn tại → 404; id sai định dạng hoặc không dương không khớp route → 404. PUT gửi đầy đủ dữ liệu để thay thế các trường có thể sửa; nếu cần cập nhật một phần thì thường thiết kế PATCH riêng.

## 6. Hiểu model, DTO và controller

Mở `Models/Product.cs`: lớp Product mô tả đối tượng lưu database. Gồm khóa `Id`, `Name`, `Description`, `Price`, `Quantity`. EF Core nhận `Id` là khóa chính theo quy ước.

Mở `Dtos/ProductRequest.cs`: DTO chỉ chứa trường frontend được phép gửi. Đây là nơi đặt các DataAnnotations:

- `[Required]`: tên bắt buộc, chuỗi chỉ có khoảng trắng cũng không hợp lệ.
- `[StringLength]`: tên tối đa 100 ký tự, mô tả tối đa 500.
- `[Range]`: giá 0–1 tỷ, số lượng 0–1 triệu.

Các trường số bị bỏ khỏi JSON sẽ nhận giá trị mặc định 0, và 0 hợp lệ trong bài. Nếu yêu cầu phân biệt thiếu số với số 0, dùng kiểu nullable cùng `[Required]`.

Mở `Controllers/ProductsController.cs`:

- Kế thừa `ControllerBase`, không tạo trang HTML.
- `[ApiController]` hỗ trợ binding JSON và tự trả 400 khi ModelState không hợp lệ.
- `[Route("api/products")]` quy định tiền tố endpoint.
- `[HttpGet]`, `[HttpPost]`, `[HttpPut]`, `[HttpDelete]` định tuyến theo HTTP method.
- `AppDbContext` được truyền vào constructor nhờ dependency injection.
- `ToListAsync` thực thi truy vấn; `AsNoTracking` phù hợp thao tác đọc.
- `Add`, sửa thuộc tính và `Remove` mới cập nhật trạng thái trong EF; `SaveChangesAsync` mới ghi xuống database.
- `CreatedAtAction` trả 201 kèm địa chỉ để đọc bản ghi vừa tạo.
- `NoContent` trả 204, vì vậy frontend không cố đọc JSON body của PUT/DELETE.
- `CancellationToken` truyền việc hủy request đến thao tác EF.

Validation phía frontend giúp nhập liệu thuận tiện; backend vẫn kiểm tra vì client có thể gửi request trực tiếp và bỏ qua giao diện.

## 7. Kết nối database được cấu hình như thế nào?

Mở `appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Data Source=lab-products.db"
}
```

`Data Source` là đường dẫn file SQLite. Đây là đường dẫn tương đối với thư mục làm việc, vì vậy hãy chạy lệnh từ `backend/Lab.Api` như hướng dẫn.

Mở `Program.cs`:

```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Thiếu ConnectionStrings:DefaultConnection.")));
```

`GetConnectionString` đọc cấu hình, `UseSqlite` chọn provider, `AddDbContext` đăng ký DbContext theo scope request.

Mở `Data/AppDbContext.cs`: `DbSet<Product> Products` đại diện tập sản phẩm. `OnModelCreating` khai báo mapping độ dài và nullability. DataAnnotations trên DTO bảo vệ request; mapping trong DbContext mô tả schema. Một số ràng buộc như độ dài không được SQLite cưỡng chế giống SQL Server, nên validation ở API vẫn cần thiết.

SQLite của bài lưu decimal theo mapping mặc định EF Core. API hiện chỉ sắp xếp theo ID; nếu mở rộng truy vấn so sánh/sắp xếp giá ở database, cần xem các hạn chế decimal của SQLite hoặc chuyển sang lưu giá bằng số nguyên đơn vị nhỏ nhất/SQL Server.

## 8. CORS và cổng chạy

Frontend: `http://localhost:5500`. Backend: `http://localhost:5080`. Khác cổng nghĩa là khác origin.

`appsettings.json` cho phép hai origin `http://localhost:5500` và `http://127.0.0.1:5500`. `Program.cs` đăng ký policy và gọi `app.UseCors("Frontend")` trước khi map endpoint controller.

`AllowAnyMethod` cho phép các method HTTP của policy; `AllowAnyHeader` cho phép header như Content-Type. Chúng không thay thế việc xác thực/phân quyền.

Nếu bạn đổi frontend sang cổng 5501, thêm origin đúng `http://localhost:5501` vào cấu hình rồi khởi động lại backend. Nếu đổi backend sang 5081, đổi `applicationUrl` và `baseURL` của Axios cho khớp. CORS origin không có dấu `/` ở cuối.

Bài dùng HTTP local để dễ chạy. Khi triển khai thực tế, cấu hình HTTPS, origin thật và các biện pháp bảo vệ phù hợp môi trường.

## 9. Axios gửi request thế nào?

Mở `frontend/app.js`, phần đầu:

```javascript
const api = axios.create({
  baseURL: 'http://localhost:5080/api',
  timeout: 10000
});

const productApi = {
  getAll: () => api.get('/products'),
  getById: id => api.get(`/products/${id}`),
  create: data => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: id => api.delete(`/products/${id}`)
};
```

Ví dụ `api.post('/products', payload)` tạo URL `http://localhost:5080/api/products`, gửi object dưới dạng JSON. `await` chờ response; response Axios gồm `status`, `data`, `headers` và các thông tin khác.

```javascript
try {
  const response = await productApi.create({
    name: 'Chuột', description: null, price: 150000, quantity: 5
  });
  console.log(response.status); // 201
  console.log(response.data.id); // ID database đã sinh
} catch (error) {
  console.log(error.response?.status); // Có HTTP response lỗi
  console.log(error.response?.data);   // Chi tiết lỗi validation
}
```

`error.response` không có có thể do API chưa chạy, sai cổng, timeout hoặc CORS; mở Network/Console để phân biệt. `timeout` có thể xảy ra sau khi server đã ghi dữ liệu, vì vậy nên tải lại danh sách trước khi bấm tạo lần nữa nếu không chắc request trước thành công.

Frontend bài có `run` để khóa nút trong khi request đang chạy, `try/catch/finally` để hiện lỗi và mở lại nút, và dùng `textContent` khi hiển thị nội dung người dùng. File Axios được phục vụ từ `node_modules` qua server local, không cần CDN sau khi đã cài package.

## 10. Tự tạo lại project từ số 0 và tạo migration

Phần này dành cho việc học quy trình. Làm trong một thư mục mới, tách khỏi project tải về, tránh đè mã hoặc tạo migration trùng.

### 10.1. Tạo backend và tool manifest

```powershell
mkdir D:\LabTuTao
cd D:\LabTuTao
dotnet new tool-manifest
dotnet tool install dotnet-ef --version 10.0.14
dotnet new webapi --use-controllers --framework net10.0 --no-openapi -o backend/Lab.Api
cd .\backend\Lab.Api
dotnet add package Microsoft.EntityFrameworkCore.Sqlite --version 10.0.14
dotnet add package Microsoft.EntityFrameworkCore.Design --version 10.0.14
```

Dùng cùng phiên bản EF Core provider, Design và dotnet-ef để dễ tái lập bài. Bộ project khóa EF ở 10.0.14 đã dùng khi kiểm thử. Khi nâng phiên bản, nâng đồng bộ provider, Design, dotnet-ef và kiểm tra lại.

Template có thể tạo WeatherForecast controller và model ví dụ. Xóa các file WeatherForecast được template sinh vì bài này dùng ProductsController.

### 10.2. Thêm từng phần mã nguồn

Từ project mẫu tải về, tạo hoặc chép lần lượt:

1. `Models/Product.cs` để mô tả entity.
2. `Dtos/ProductRequest.cs` để nhận và kiểm tra request.
3. `Data/AppDbContext.cs` để mapping database.
4. Thay `Program.cs` bằng bản của bài để đăng ký controllers, DbContext và CORS.
5. Thay `appsettings.json` bằng cấu hình connection string và CORS của bài.
6. `Controllers/ProductsController.cs` chứa đủ endpoint.
7. Thay `Properties/launchSettings.json` để thống nhất cổng 5080.

Đây là quá trình viết code trong các file C# và cấu hình, không có lệnh CLI nào tự hiểu yêu cầu quản lý sản phẩm để viết giúp những phần này. Toàn bộ mã nguồn tương ứng đã có trong ZIP để bạn mở và đọc từng phần.

### 10.3. Tạo migration đầu tiên thật sự

Trong `D:\LabTuTao\backend\Lab.Api`, lúc này CHƯA chép thư mục Migrations từ bản mẫu:

```powershell
dotnet build
dotnet ef migrations add InitialCreate
dotnet ef migrations list
dotnet ef database update
```

`migrations add` so sánh model hiện tại với snapshot rồi sinh code thay đổi schema; lệnh này chưa tạo bảng trong database. `database update` mới thực thi các migration chưa áp dụng.

Thư mục Migrations sẽ có file migration với phương thức `Up` tạo bảng Products, `Down` gỡ bảng, file Designer và `AppDbContextModelSnapshot`. Trong database, bảng `__EFMigrationsHistory` ghi các migration đã áp dụng. Khi làm nhóm, commit cả migration và snapshot, thường không commit file database local.

Có thể kiểm tra đồng bộ model/snapshot:

```powershell
dotnet ef migrations has-pending-model-changes
```

Muốn xem SQL trước khi áp dụng, chạy:

```powershell
dotnet ef migrations script
```

### 10.4. Thử thay đổi schema ở lần tiếp theo

Ví dụ thêm nhóm sản phẩm, thực hiện trong bản tự tạo để không đổi kết quả của bộ mẫu:

1. Ctrl+C dừng API.
2. Thêm vào `Product.cs`:

```csharp
public string? Category { get; set; }
```

3. Thêm mapping trong block `modelBuilder.Entity<Product>` của AppDbContext:

```csharp
entity.Property(p => p.Category).HasMaxLength(100);
```

4. Sinh và áp dụng migration mới:

```powershell
dotnet ef migrations add AddProductCategory
dotnet ef database update
dotnet run --launch-profile http
```

Nếu muốn nhập/sửa Category từ giao diện thì cần thêm trường vào DTO, gán nó trong Create/Update của controller, thêm input vào HTML và payload ở JavaScript. Chỉ thêm entity và migration chưa tự tạo chức năng nhập liệu cho frontend.

Nếu migration vừa tạo chưa áp dụng và muốn sửa lại, dùng `dotnet ef migrations remove`. Nếu đã áp dụng, cần xem xét rollback hoặc tạo migration sửa; rollback có thể mất dữ liệu ở cột/bảng bị gỡ. Không xóa migration đã áp dụng chỉ để làm mất lỗi.

### 10.5. Tạo frontend

Tại `D:\LabTuTao`, tạo thư mục frontend rồi chép `index.html`, `app.js`, `style.css`, `server.mjs`, `package.json` từ bộ mẫu. Sau đó:

```powershell
cd D:\LabTuTao\frontend
npm install
npm start
```

`npm install` cài Axios được khai báo trong package.json và sinh package-lock.json. Ở lần cài từ mã nguồn đã có lock, dùng `npm ci` để tái lập phiên bản. Server chỉ phục vụ danh sách đường dẫn cho phép, gồm file Axios local.

## 11. Nếu bài yêu cầu dùng SQL Server thay SQLite

Phần này là tùy chọn. SQLite đã là database đáp ứng bài CRUD. Nếu giảng viên chỉ định SQL Server thì thực hiện trên bản sao project; migration phụ thuộc provider nên cần một bộ migration riêng.

1. Cài SQL Server/LocalDB phù hợp và xác nhận instance chạy. LocalDB ví dụ dưới đây cần được cài trước, không phải máy Windows nào cũng có sẵn.
2. Trong bản sao project, dừng API. Di chuyển thư mục Migrations SQLite ra ngoài project (không để file .cs cũ tiếp tục được biên dịch), giữ bản gốc để tham khảo. Dùng database SQL Server mới, không cố chuyển database SQLite bằng đổi connection string.
3. Chạy:

```powershell
dotnet remove package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 10.0.14
```

4. Trong Program.cs, thay `UseSqlite(...)` bằng `UseSqlServer(...)` và giữ cách đọc connection string.
5. Trong block mapping AppDbContext, thêm:

```csharp
entity.Property(p => p.Price).HasPrecision(18, 2);
```

6. Đổi connection string trong appsettings.json (dấu `\\` là escape bắt buộc trong JSON):

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=LabProducts;Trusted_Connection=True;TrustServerCertificate=True"
}
```

Nếu bạn dùng SQL Server Express có instance SQLEXPRESS, thay bằng `Server=.\\SQLEXPRESS` trong JSON. Tên instance phải khớp máy bạn. `TrustServerCertificate=True` trong ví dụ dành cho môi trường học local; khi triển khai cần cấu hình chứng chỉ đúng.

7. Trong bản sao đã chuyển provider và không còn migration SQLite được compile, chạy:

```powershell
dotnet build
dotnet ef migrations add InitialSqlServer
dotnet ef database update
dotnet run --launch-profile http
```

Không cần thay Axios vì URL và cấu trúc JSON của API giữ nguyên.

Nếu SQL Server dùng username/password, không commit mật khẩu vào source. Có thể dùng User Secrets trong môi trường Development; ví dụ đặt connection string thật bằng `dotnet user-secrets init` rồi `dotnet user-secrets set "ConnectionStrings:DefaultConnection" "CHUOI_KET_NOI_CUA_BAN"`. Không nhập nguyên placeholder này để chạy. User Secrets không phải kho mã hóa dùng cho production.

## 12. Test API riêng, không phụ thuộc giao diện

Cách A: VS Code cài REST Client → mở `backend/Lab.Api/requests.http` → bấm Send Request ở từng khối. Chạy POST trước, lấy ID thực và sửa biến `@id` đầu file.

Cách B: dùng PowerShell khi API đang chạy:

```powershell
$baseUrl = "http://localhost:5080/api/products"
$payload = @{
    name = "Ban phim"
    description = "San pham thu nghiem"
    price = 450000
    quantity = 10
} | ConvertTo-Json

# POST
$created = Invoke-RestMethod -Uri $baseUrl -Method Post -ContentType "application/json" -Body $payload
$created
$productId = $created.id

# GET danh sách và chi tiết
Invoke-RestMethod -Uri $baseUrl -Method Get
Invoke-RestMethod -Uri "$baseUrl/$productId" -Method Get

# PUT
$updated = @{
    name = "Ban phim moi"
    description = "Da cap nhat"
    price = 500000
    quantity = 8
} | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/$productId" -Method Put -ContentType "application/json" -Body $updated

# DELETE
Invoke-RestMethod -Uri "$baseUrl/$productId" -Method Delete
```

PUT và DELETE thành công không in object JSON vì trả 204. Gọi GET chi tiết sau DELETE phải nhận 404.

Các tình huống cần kiểm tra: POST tên rỗng/giá âm/số lượng âm trả 400; GET/PUT/DELETE ID không tồn tại trả 404; thêm sản phẩm rồi restart API vẫn đọc được; frontend gửi đủ bốn method trong Network.

Kèm `scripts/smoke_test.py` dùng Python standard library để test HTTP. Python chỉ cần nếu muốn chạy script test, không bắt buộc để chạy ứng dụng:

```powershell
cd D:\ASP.NET-Core-Axios-CRUD
python .\scripts\smoke_test.py
```

Script tạo sản phẩm tạm, kiểm tra endpoint và dọn bản ghi đó khi hoàn tất. API phải chạy trước.

Nếu không cài Python, có thể kiểm thử trực tiếp các wrapper Axios bằng Node sau khi đã chạy npm ci trong frontend:

```powershell
cd D:\ASP.NET-Core-Axios-CRUD
node .\scripts\smoke_axios.cjs
```

Kết quả kiểm tra và giới hạn môi trường thực tế được ghi trong KIEM_TRA.md.

## 13. Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| `dotnet` không nhận | Cài SDK, mở lại terminal, kiểm tra PATH theo mục 2 |
| NETSDK1045 | SDK chưa hỗ trợ net10.0; cài .NET 10 SDK |
| `dotnet ef` không nhận | Chạy `dotnet tool restore` ở thư mục gốc, sau đó chạy EF từ thư mục Lab.Api |
| `No project was found` | Chuyển vào backend/Lab.Api, nơi có file .csproj |
| `no such table: Products` | Dừng API, chạy `dotnet ef database update` trong đúng thư mục backend |
| Migration tên đã tồn tại | Bộ tải về đã có InitialCreate; chỉ chạy database update |
| `Failed to fetch` / Network Error | API có chạy không, baseURL/cổng/CORS có khớp không, xem Console/Network |
| Cổng 5080 hoặc 5500 đang được dùng | Dừng phiên chạy cũ bằng Ctrl+C hoặc đổi cổng đồng bộ cấu hình |
| `npm.ps1` bị chặn | Dùng npm.cmd ci và npm.cmd start |
| `Cannot find module axios` / Axios file 500 | Chạy npm ci trong frontend, kiểm tra npm cài thành công |
| `axios is not defined` | Kiểm tra /axios.min.js tải được, chạy frontend qua npm start |
| NuGet/npm tải thất bại | Kiểm tra mạng, proxy và quyền truy cập nguồn package; chưa thể build nếu thiếu package |
| API chạy nhưng /swagger trả 404 | Bộ này không cài Swagger; test bằng requests.http, PowerShell hoặc frontend |
| SQL Server login/instance lỗi | Kiểm tra dịch vụ SQL Server, tên instance, quyền tài khoản và connection string |

Không xóa database để chữa lỗi migration nếu còn dữ liệu cần giữ. Khi cần nhờ hỗ trợ, gửi nguyên lệnh vừa chạy, thư mục hiện tại và phần lỗi đầu tiên.

## 14. Tài liệu tham khảo chính thức

- .NET SDK: https://dotnet.microsoft.com/en-us/download/dotnet/10.0
- Cài .NET trên Windows: https://learn.microsoft.com/en-us/dotnet/core/install/windows
- Controller API: https://learn.microsoft.com/en-us/aspnet/core/web-api/?view=aspnetcore-10.0
- EF Core và SQLite: https://learn.microsoft.com/en-us/ef/core/get-started/
- Công cụ EF: https://learn.microsoft.com/en-us/ef/core/cli/dotnet
- Migration: https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/managing
- CORS: https://learn.microsoft.com/en-us/aspnet/core/security/cors?view=aspnetcore-10.0
- SQL Server provider: https://learn.microsoft.com/en-us/ef/core/providers/sql-server/
- Axios: https://axios-http.com/docs/api_intro
- Node.js: https://nodejs.org/en/download
