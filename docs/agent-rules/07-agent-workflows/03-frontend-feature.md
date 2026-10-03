# Skill workflow — triển khai React feature

## Baseline v0.2

FE hiện JS/JSX + Redux Toolkit + Axios + AntD/Tailwind; giữ npm lockfile, src/api/axiosClient.js và layouts hiện hữu. Login/Register/dashboard còn placeholder. Đọc current-endpoints trước gọi API; không dùng /api/v1, /auth/register hoặc /example như route có sẵn. npm run lint/build có thật; typecheck chỉ sau task migration TypeScript.

Dùng khi port trang Razor hoặc tạo/sửa giao diện DACN_FE. Đọc [FE structure](../02-frontend/01-structure.md), [UI](../02-frontend/02-ui.md), [validation](../02-frontend/03-validation.md), [API state](../02-frontend/04-api-state.md).

1. Đọc manifest/router/layout/components hiện có và contract BE đã xác nhận.
2. Xác định route, role UX, feature state, fields và loading/empty/error/success.
3. Tái sử dụng control/token; component chỉ chịu UI, API qua feature client/hooks.
4. Dùng một form engine, map field errors, validate number/date đúng kiểu contract.
5. Kiểm authorization response 401/403; không coi guard/hidden button là bảo mật.
6. Với thi, chỉ giữ lựa chọn và hiển thị timer; server quyết điểm/deadline. Kiểm save revision và retry submit.
7. Chạy lint/build và test behavior liên quan khi test infrastructure đã có; kiểm viewport/focus với UI thực nếu môi trường cho phép.
8. Báo route, screenshot nếu đã chụp, API thật/mock, kiểm tra đã chạy và phần thiếu.

Không đưa dữ liệu demo vào màn production để che API chưa có. Khi contract chưa tồn tại, tạo sketch có nhãn PROPOSED và đồng bộ BE trước VERIFIED.
