# Build, delivery và vận hành

## FACT — công cụ hiện tại

BE có DACN_Project.sln và bốn net8.0 project; chưa thấy test project, global.json hoặc CI workflow tại commit đối chiếu. FE có npm scripts dev/build/lint/format/preview; không có typecheck/test. Node engines của Vite 8.0.1 trong lockfile cần đáp ứng khi dựng môi trường, không dùng version Node từ phỏng đoán.

Lệnh hiện có: `dotnet restore DACN_Project.sln`, `dotnet build DACN_Project.sln --no-restore`; FE `npm ci`, `npm run lint`, `npm run build`. Đây là lệnh đề nghị chạy khi triển khai, chưa được thực thi trong static review này. Chưa có test project thì không gọi dotnet test là chứng minh tính đúng nghiệp vụ.

PROPOSED pipeline mục tiêu; không thấy workflow CI trong cây hai repo đã đọc.

## Pipeline tối thiểu

BE: restore phiên bản khóa → build → test Domain/Application → integration SQL cho thay đổi persistence → generate/check OpenAPI → publish artifact. FE: install từ lockfile bằng package manager của repo → lint → test khi được bổ sung → build (typecheck chỉ sau migration TypeScript). Không tự thay npm bằng pnpm nếu chưa có yêu cầu.

Contract thay đổi phải đi cùng FE update hoặc backward compatibility. Không đồng bộ bằng copy entity C# sang TypeScript thủ công không kiểm tra. Pin SDK/Node sau khi xem manifest/engines, không dùng latest trong CI.

## Runtime

HTTPS, reverse proxy SPA fallback đúng (không trả index.html cho /web lỗi), API base URL theo môi trường, CORS allowlist khi cross-origin. Health liveness tách readiness DB; endpoint không tiết lộ cấu hình.

Migration job riêng trước rollout tương thích. Runtime identity chỉ quyền DB cần thiết. Connection pooling và timeout theo tải đo được; không đặt vô hạn để che query chậm.

Worker finalize attempt quá hạn dùng DB làm trạng thái bền; restart phải quét lại việc còn dang dở. Nếu nhiều API instance, claim công việc hoặc finalize idempotent với SQL concurrency, không dựa khóa in-memory.

## Quan sát

Theo dõi lỗi start/save/submit, độ trễ query, số attempt quá hạn chưa finalize, refresh failures, deadlocks và saturation connection. Log correlation ID, không ghi raw answers/credentials vào log kỹ thuật. Backup định kỳ và thử restore với chính sách được chọn.

Chưa có số liệu concurrent users hoặc SLA. Không khẳng định một cấu hình server đủ tải khi chưa load-test bằng môi trường gần thực tế.
