# DACN — bộ quy tắc AI Agent v0.2

Cập nhật ngày 23/09/2026 sau khi đọc hai repository public. Giữ bộ file và đường dẫn hiện có để các liên kết cũ tiếp tục dùng được; phiên bản nội dung hiện tại là **v0.2**.

| Nguồn | Branch dùng đối chiếu | Commit |
|---|---|---|
| [DACN_Project](https://github.com/Hopcx/DACN_Project) | master (default) | `4d5ff309e130f385d207abbc215f5a3b3b4eaa7c` |
| [DACN_FE](https://github.com/Hopcx/DACN_FE) | main (default) | `37d5883c8ea272613686aae90dfccadd81bda3c5` |
| Testify | Export Gittodoc_testify.txt do người dùng cung cấp | Không có Git SHA; giữ hash export trong snapshot-integrity |

## Thay đổi quan trọng

- BE thực tế .NET 8, EF Core 8.0.14, bốn project Project.*; đã có AutoMapper, FluentValidation, JWT, BCrypt, Serilog và EF migrations.
- FE thực tế JavaScript/JSX, React 19.2.4, Vite 8.0.1, Ant Design 6.3.6, Tailwind 4.2.4, Redux Toolkit 2.11.2, Axios 1.13.6. Không ép TypeScript/TanStack Query hoặc nâng .NET 10 trong nhiệm vụ chuyển chức năng.
- API hiện tại `/web/*`, envelope `success/data/message`. Đã bổ sung catalogue endpoint, flow kết nối đúng port/path và khoảng trống chức năng.
- FE auth/dashboard đang ở mức giao diện placeholder; BE nhiều CRUD đã có source nhưng còn blocker DI/configuration, phân quyền và bảo vệ dữ liệu. Không gọi đó là hệ thống đã chuyển hoàn chỉnh.

## Bắt đầu đọc

1. [AGENTS.md](AGENTS.md): quy tắc tổng thể và định tuyến tài liệu.
2. [Codebase audit](00-overview/06-codebase-audit.md): phát hiện cụ thể, dẫn nguồn tại commit, thứ tự xử lý.
3. [Architecture](00-overview/02-architecture.md) và [flows](00-overview/03-flows.md): hiện trạng và đích cần bổ sung.
4. [Parity matrix](05-migration/01-parity-matrix.md): Testify ↔ BE ↔ FE theo 26 nhóm nghiệp vụ.
5. [Current endpoints](04-contracts/04-current-endpoints.md): route thực tế và trạng thái auth/DI theo source.
6. [INDEX.md](INDEX.md): danh sách toàn bộ file.

## Phân chia

| Folder | Nội dung |
|---|---|
| 00-overview | Bằng chứng, kiến trúc, flow, stack, audit và quyết định |
| 01-backend | Project.* layers, service/repository, auth, engine thi, Excel/report |
| 02-frontend | JSX/Redux/Axios, UI, validation và trạng thái API |
| 03-database | SQL Server, EF Code First, migrations, index, concurrency |
| 04-contracts | Contract hiện tại và thiết kế API thi chưa tồn tại |
| 05-migration | Parity, backlog, chỉ mục Testify và snapshot |
| 06-quality | Nghiệm thu, kiểm thử, vận hành |
| 07-agent-workflows | Quy trình Markdown cho agent theo nhiệm vụ |
| 08-integration | Hướng dẫn tích hợp và AGENTS riêng theo repo |

FACT = có bằng chứng source; không đồng nghĩa đã chạy thành công. REQUIRED = quy tắc cần thực hiện khi triển khai; không có nghĩa code đã được sửa. PROPOSED = thiết kế cần bổ sung; OPEN = thiếu quyết định nghiệp vụ/dữ liệu. Các workflow là tài liệu dự án, chưa phải native skill đã cài tự động.

Đã đọc source/configuration và kiểm tra tĩnh; chưa chạy BE, FE hoặc database. Chỉ cập nhật bộ tài liệu; không có commit sửa hai ứng dụng. Chưa đọc nội dung binary DOCX trong Project.Api/Docs, ảnh hoặc toàn bộ lịch sử Git/branch khác.

## Còn cần quyết định

Giữ dữ liệu cũ hay database mới; cách chấm nhiều đáp án/làm tròn/số lượt/deadline; phạm vi Teacher; phần Testify chỉ có UI/enum có làm ngay không. Xem [decision register](00-overview/04-decisions.md). Không cần gửi lại URL của hai repo.
