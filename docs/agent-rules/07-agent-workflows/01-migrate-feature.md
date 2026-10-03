# Skill workflow — chuyển một feature xuyên FE/BE/database

## Baseline v0.2

URL/branch/SHA đã chốt trong README và audit; không yêu cầu người dùng gửi lại URL. Khi task bắt đầu, đọc commit checkout thực tế để phát hiện thay đổi sau baseline. Dùng parity matrix đã có BE/FE columns. Không nâng .NET10/chuyển TypeScript/thêm TanStack Query nếu không có task riêng.

Dùng khi: người dùng yêu cầu port một feature Testify hoặc đối chiếu chức năng cũ/mới. Đây là quy trình Markdown để agent đọc qua AGENTS.md, không phải skill đã cài trong ChatGPT.

## Input

Feature ID hoặc mô tả; export cũ; checkout BE/FE đã xác định branch/commit; contract/decision hiện hành. Nếu thiếu checkout, chỉ phân tích nguồn và thiết kế có nhãn PROPOSED, không giả vờ đã sửa code.

## Thực hiện

1. Đọc [parity matrix](../05-migration/01-parity-matrix.md) và [evidence](../00-overview/01-evidence.md).
2. Tìm legacy page → service → controller → repository → model; ghi symbol và invariant, phân biệt stub với flow có code.
3. Đọc source thực tế hai repo, test và dirty diff. Lập bảng đã có/thiếu/khác; không overwrite code để khớp cấu trúc mẫu.
4. Đọc [HTTP contract](../04-contracts/01-http.md), xác định DTO, quyền, transaction, lỗi và UI states.
5. Ghi các thay đổi hành vi cần quyết định; tiếp tục phần độc lập, chỉ hỏi phần ảnh hưởng semantics không thể xác minh.
6. Thực hiện schema/use case/API/FE theo dependency. Không thêm Redis/microservice ngoài phạm vi.
7. Kiểm theo [acceptance](../06-quality/01-acceptance.md), đặc biệt quyền âm tính và sai khác legacy.
8. Cập nhật parity với đường dẫn/commit/test evidence và báo kết quả.

## Output bắt buộc

Feature ID; file đã sửa; hành vi cũ→mới; contract/schema change; test thực chạy và kết quả; việc còn thiếu. Không ghi “hoàn chỉnh” nếu chỉ mock FE hoặc chưa gọi API thật.
