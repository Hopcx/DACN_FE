# FE — cấu trúc và dependency thực tế

FACT: DACN_FE/main theo SHA trong README; source JavaScript/JSX, npm package-lock. Không thấy TypeScript, TanStack Query, RTK Query slice hoặc test/typecheck script.

| Dependency | Version trong lockfile |
|---|---|
| React / React DOM | 19.2.4 |
| Vite | 8.0.1 |
| Ant Design | 6.3.6 |
| Tailwind / @tailwindcss/vite | 4.2.4 |
| Redux Toolkit / react-redux | 2.11.2 / 9.2.0 |
| React Router DOM | 7.13.1 |
| Axios | 1.13.6 |

package.json dùng range ^; lockfile là bản resolve hiện tại. Giữ npm và dùng npm ci khi kiểm build.

```text
src/
  App.jsx main.jsx index.css
  api/axiosClient.js api/index.js
  components/layout/ components/ui/
  context/ hooks/ data/constants.js
  pages/auth/ pages/dashboard/ HomePage.jsx NotFoundPage.jsx
  redux/store.js redux/slices/appSlice.js
  services/exampleService.js utils/format.js
```

main.jsx ghép ConfigProvider → Redux Provider → AppProvider → BrowserRouter. App.jsx có home, login, register, chọn role, admin dashboard, 404. Chưa thấy route guard; role trong navigation state không phải quyền.

## REQUIRED — mở rộng theo code hiện có

Giữ layout và src/api/axiosClient.js. Thay exampleService bằng service thật từng module; không gọi /example như endpoint BE có sẵn. Mỗi module có pages/components/service/validator riêng khi phát triển, có thể nhóm dần src/features/<feature>/ mà không di chuyển hàng loạt code vô cớ.

Redux hiện chỉ app.status; Context giữ UI state hiện có, không nhân đôi auth state ở cả hai. Chọn một nguồn auth session. Nếu cần cache server data, ưu tiên đánh giá RTK Query thuộc toolkit đã có; khi chọn phải ghi adapter baseQuery/axios và cache invalidation. Không thêm TanStack Query/Zustand tự động.

Form hiện tại là HTML controlled inputs/useState. Form nghiệp vụ mới đề xuất AntD Form; chuyển từng màn có test, không ép hai form engine cùng lúc. UI components không chứa policy bảo mật/chấm điểm.

TypeScript migration cần nhiệm vụ riêng và config/build check; hiện tại dùng JS contracts/JSDoc/runtime validation phù hợp, không đưa file .ts hoặc lệnh typecheck chưa tồn tại vào hướng dẫn chạy.

Tailwind v4 đã dùng @tailwindcss/vite trong vite.config.js; giữ @import đúng dòng v4. AntD token đã cấu hình ở main.jsx, ưu tiên gom token khi UI phát triển.
