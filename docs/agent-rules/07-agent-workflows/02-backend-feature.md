# Skill workflow — triển khai BE use case

## Baseline v0.2

Giữ Project.Api/Application/Domain/Infrastructure, net8.0/EF8.0.14, AutoMapper/FluentValidation. Đọc audit B01/B02 trước runtime. Contract hiện /web + ApiResponse; interfaces repository ở Domain. Không chỉ thêm controller mà bỏ DI, validator hoặc policy. Chạy restore/build solution thật khi thực hiện code task; test mới phải gắn invariant.

Dùng khi thêm/sửa API hoặc luật nghiệp vụ DACN_Project. Đọc [structure](../01-backend/01-structure.md), [use cases](../01-backend/02-use-cases.md), [security](../01-backend/03-security.md).

1. Xác minh version, DI, route và conventions repo.
2. Xác định actor, resource scope, input/output, invariant, failure codes.
3. Chọn vị trí Domain/Application/Infrastructure/API đúng chiều phụ thuộc.
4. Viết request DTO ngăn overposting; validator; use case; persistence implementation; controller mapping.
5. Xác định transaction/concurrency trước khi có hơn một ghi hoặc count-then-insert.
6. Với thi, đọc [exam engine](../01-backend/04-exam-engine.md) và không nhận score/userId từ client làm giá trị quyết định.
7. Thêm tests vào invariant/authorization/provider behavior bị ảnh hưởng, chạy build/test phù hợp.
8. Cập nhật OpenAPI và liệt kê FE/migration cần đi cùng.

Output: endpoint + contract diff + policy + transaction boundary + test evidence. Không trả repository entity trực tiếp; không tự dùng MediatR hoặc generic UoW chỉ để khớp ví dụ.
