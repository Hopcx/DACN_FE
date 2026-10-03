# BE — cấu trúc và framework thực tế

FACT: DACN_Project/master tại commit trong README. Solution `DACN_Project.sln`; các project ở root, không có prefix src/.

```text
Project.Api/
  Controllers/ Extensions/ Middlewares/ Services/ Program.cs
Project.Application/
  Common/ DTOs/ Interfaces/Services/ Services/ Mappings/ Validators/
Project.Domain/
  Entities/ Interfaces/Repositories/ Interfaces/ADO/ Interfaces/Crypt/
Project.Infrastructure/
  Persistence/Configurations/ Persistence/Repositories/ Persistence/Seed/
  Persistence/ViewModels/ Migrations/ DependencyInjection.cs
```

## Phiên bản khai báo

| Project | Target / packages chính |
|---|---|
| Tất cả | net8.0, nullable và implicit usings enabled |
| Api | JwtBearer 8.0.14; EF Design 8.0.14; Swashbuckle 6.4.0; Serilog.AspNetCore 8.0.1, Console 5.0.1, File 5.0.0 |
| Application | AutoMapper + DI extensions 12.0.1; FluentValidation 11.9.0, AspNetCore 11.3.0; BCrypt 4.0.3 |
| Infrastructure | EF/SqlServer/Tools 8.0.14; BCrypt 4.0.3 |
| Domain | SqlClient 5.1.6; Configuration.Abstractions 9.0.10 — vi phạm hướng tách I/O mục tiêu |

Đây là PackageReference, chưa restore để xác minh toàn bộ transitive graph. Không thấy global.json/test project/workflow CI trong cây commit. .NET 10 không phải framework hiện tại.

## REQUIRED

Dùng DI đã có AddApplication/AddInfrastructure. Sửa ProjectHopADO constructor trước vì `_configuration` chưa được gán. Đăng ký bảy service còn thiếu theo audit. Không tạo thêm “kiến trúc mới” cạnh project hiện có.

Controller → Application service → Domain repository interface → Infrastructure implementation → scoped DbContext. Existing interface naming có typo IAnswerReposiroty.cs nhưng tên type là IAnswerRepository; đọc type thật trước import/rename.

Giữ AutoMapper cho User, kiểm mapping DTO không có PasswordHash; feature manual mapping có thể tiếp tục khi rõ và an toàn. Validator hiện mới có UserCreateDtoValidator; không nhận định mọi DTO đã validate. API đang dùng Swagger v1 document nhưng route vẫn /web, không phải /api/v1.

Bổ sung use case start/save/submit, IClock/current user abstraction và transaction ở vị trí phù hợp. Không tự nâng framework, thay DI/container, thêm MediatR hoặc generic repository trong nhiệm vụ port.
