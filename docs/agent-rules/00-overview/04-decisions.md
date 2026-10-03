# Decision register v0.2

FACT phản ánh commit đã đọc. REQUIRED là quy tắc triển khai trên codebase hiện hữu. PROPOSED không được ngầm coi là đã có code.

| ID | Quyết định / trạng thái | Căn cứ và tác động |
|---|---|---|
| A01 | Giữ bốn project Project.* — REQUIRED | Khung đã có; sửa boundary I/O Domain và auth controller theo từng việc |
| A02 | Baseline .NET 8 / EF 8.0.14 — FACT | Nâng .NET 10 là nhiệm vụ riêng, không tự nâng trong port feature; đánh giá vòng đời trước production |
| A03 | JavaScript JSX + Vite — FACT/REQUIRED | TypeScript strict là lựa chọn migration riêng, chưa có tsconfig/typecheck script |
| A04 | Ant Design 6 + Tailwind 4 — FACT/REQUIRED | Cả hai đã được bootstrap; form hiện tại vẫn là HTML/useState |
| A05 | Giữ Redux Toolkit + Context và Axios — REQUIRED | Không thêm TanStack Query/Zustand mặc định; có thể mở rộng bằng RTK Query khi cần, đây chưa là code đang có |
| A06 | Form mới ưu tiên Ant Design Form — PROPOSED | Chuyển từng form; không gọi HTML form hiện tại là AntD Form |
| A07 | EF Code First + SQL Server — FACT/REQUIRED | DbContext/configurations/migration đã có; phiên bản SQL engine/data deployed vẫn OPEN |
| A08 | Chưa triển khai Redis — REQUIRED baseline | Không thấy dependency/tích hợp Redis; chưa có tải để chứng minh cần |
| A09 | Index theo query; chưa thêm procedure mặc định — REQUIRED | Repo có IADO/helper raw SQL, không phải bằng chứng có stored procedure nghiệp vụ đã deploy |
| A10 | Giữ AutoMapper 12 + FluentValidation 11 — REQUIRED | Đã dùng cho User; mở rộng có kiểm chứng, không thay bằng framework mới |
| A11 | Attempt/snapshot/server grading — PROPOSED cần bổ sung | Submission CRUD hiện nhận điểm, chưa có engine thi tin cậy |
| A12 | Giữ contract auth body để tích hợp, rồi harden có kế hoạch — REQUIRED | Hiện trả accessToken/refreshToken JSON; HttpOnly cookie và token hash là đích chuyển đổi, chưa tồn tại |
| A13 | `/web/*` và ApiResponse — FACT/REQUIRED | Không gọi `/api/v1` hay assume response ProblemDetails cho mọi lỗi |

## OPEN và mục đã giải quyết

| ID | Trạng thái | Nội dung |
|---|---|---|
| O01 | RESOLVED | URL đã xác nhận; dùng default branch master BE, main FE, pin SHA trong README |
| O02 | OPEN | Có migrate dữ liệu Testify cũ hay dùng database mới? |
| O03 | OPEN | FillAnswer, ranked, báo cáo placeholder có phải làm ngay? |
| O04 | RESOLVED baseline | FE đã có Ant Design/Tailwind; tiếp tục dùng, không cần hỏi chọn lại UI library |
| O05 | OPEN | Chấm multiple-choice, rounding, tính số lượt lúc start hay finalize |
| O06 | OPEN | Deadline min(start+duration, scheduleEnd) hay được làm hết duration |
| O07 | OPEN | Quyền Teacher; public registration có được phép không, role mặc định nào |
| O08 | OPEN | Chính sách sửa lịch/đề đã có người thi |
| O09 | OPEN | Timezone dữ liệu DateTime cũ; không tự chuyển UTC |
| O10 | OPEN | Concurrent users, deployment, SLA và retention |
| O11 | OPEN | Agent chính là Codex/Cursor/Copilot để đóng gói native rule adapters |

Tiếp tục phần độc lập đã đủ bằng chứng; chỉ hỏi khi quyết định thay đổi semantics. Xem [audit](06-codebase-audit.md) cho thứ tự blocker cần xử lý. Nguồn vòng đời framework ở [external sources](05-external-sources.md), tách khỏi version hiện tại trong csproj.
