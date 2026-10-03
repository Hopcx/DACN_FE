# DACN_Project — mẫu AGENTS.md cho repo

Ghép nội dung này vào AGENTS.md gốc sau khi đặt docs/agent-rules; không giả định file đã được commit.

- Đọc docs/agent-rules/AGENTS.md và 00-overview/06-codebase-audit.md trước task.
- Baseline master 4d5ff309e130f385d207abbc215f5a3b3b4eaa7c: Project.Api, Project.Application, Project.Domain, Project.Infrastructure, target net8.0/EF8.0.14.
- Giữ AutoMapper 12, FluentValidation 11, BCrypt, JWT, Serilog; không tự nâng .NET10 hoặc thêm MediatR.
- HTTP prefix /web, ApiResponse success/data/message. Đọc catalogue để lấy endpoint thật; Swagger v1 không phải route /api/v1.
- Repository interface hiện ở Domain; implementation ở Infrastructure, riêng ADO/encryption trong Domain là điểm cần refactor. Không thêm I/O mới vào Domain.
- Sửa IADO constructor và đăng ký bảy service thiếu theo audit trước xác minh runtime. Không tuyên bố app hoạt động chỉ vì có controller.
- Loại PasswordHash public DTO, áp dụng policy/resource ownership. Không nhận điểm/userId từ FE làm kết quả quyết định.
- DbContext ProjectDACNDbContext; config ConnectionStrings:Default; migrations thuộc Infrastructure. Giữ dữ liệu và review SQL khi thay schema.
- Dùng workflow backend-feature/database-change/migrate-feature trong docs/agent-rules/07-agent-workflows.
- Kiểm tra lệnh thật: dotnet restore/build DACN_Project.sln; test khi đã có project phù hợp. Báo kết quả thực chạy, không báo test pass cho static review.
