# Đưa bộ tài liệu vào DACN_Project và DACN_FE

Bộ v0.2 là tài liệu dự án đã đối chiếu hai repo tại SHA trong README. Chưa ghi commit hoặc thay đổi hai repository từ phiên này. Các workflow .md được agent đọc theo router; chưa có native SKILL.md được cài tự động.

## Tích hợp vào repo đã xác định

1. Đọc lại commit checkout và chỉ thị hiện hữu; đối chiếu audit v0.2 nếu code đã thay đổi sau baseline. Giữ nguyên chỉ thị hiện có khi chưa có thay đổi được thống nhất.
2. Đặt nguyên bộ folder này dưới `docs/agent-rules/` trong mỗi repo, giữ relative links. Tách code FE/BE nhưng dùng cùng phiên bản tài liệu chung.
3. Dùng [BE-AGENTS.md](BE-AGENTS.md) hoặc [FE-AGENTS.md](FE-AGENTS.md) làm nội dung tham chiếu để ghép vào AGENTS.md gốc tương ứng; không ghi đè mù.
4. Chọn một repo làm chủ các docs contract/decisions, cập nhật bản sao cùng release/version và kiểm diff. Vị trí chủ đề xuất là BE; xác nhận khi truy cập repo.
5. Thêm commit SHA/source date và đổi trạng thái các quyết định đã duyệt. Chỉ đánh dấu ready-to-implement cho từng feature sau khi resolve decision tương ứng; bản v0.2 không phải chứng nhận runtime.

## Dùng với agent

Trong prompt giao task: “Đọc AGENTS.md và docs/agent-rules/AGENTS.md; thực hiện feature Fxx theo workflow tương ứng; đối chiếu code thật; không suy ra phiên bản từ bản dự thảo.”

Không giả định mọi IDE tự nạp mọi file .md. Với công cụ không hỗ trợ AGENTS.md, chỉ rõ entrypoint trong prompt hoặc cấu hình project instructions của công cụ theo tài liệu hiện hành. Nếu chuyển sang .mdc/native skills, giữ tài liệu chung là một nguồn chuẩn, chỉ tạo router theo công cụ sau khi xác minh format/đường dẫn hỗ trợ.

## Phạm vi database

Không tạo repository database riêng trong baseline. Configuration/migrations/schema ownership nằm ở BE; FE có bản tham chiếu để hiểu contract, không được chạy migration trực tiếp từ UI.

## Kiểm tra sau tích hợp

Agent phải tìm được entrypoint, route sang tài liệu đúng lớp và biết OPEN. Build/test dùng lệnh thực tế của repo. Không đưa toàn bộ export có secrets vào repository tài liệu hoặc context mặc định của agent.
