# DACN_FE — mẫu AGENTS.md cho repo

Ghép nội dung này vào AGENTS.md gốc sau khi đặt docs/agent-rules; chưa được commit vào GitHub trong phiên tài liệu.

- Đọc docs/agent-rules/AGENTS.md, audit và contract hiện tại.
- Baseline main 37d5883c8ea272613686aae90dfccadd81bda3c5: JS/JSX, React19, Vite8, AntD6, Tailwind4, Redux Toolkit, Axios, Router7.
- Giữ npm package-lock; không tự chuyển TypeScript hoặc cài TanStack Query/Zustand. Redux app.status và Context sidebar hiện chưa phải auth state.
- Dùng src/api/axiosClient.js chung, cập nhật /web proxy/baseURL đồng bộ BE. response.data là envelope, response.data.data mới là payload.
- Login/Register/SelectRole/dashboard đang placeholder; không dùng navigation role hoặc stats hardcode làm quyền/dữ liệu thật.
- Đọc src/App.jsx/layouts/components trước mở rộng. Route guard là UX; BE vẫn cần authorization.
- Validation theo docs/agent-rules/02-frontend/03-validation.md và DTO hiện tại. Không gửi decimal string vào field double trước khi đổi contract.
- Chấm điểm/deadline ở BE; các attempt APIs chưa có nên phải phối hợp contract/use case, không bịa endpoint.
- Dùng frontend-feature workflow. npm run lint/build có thật; chưa có typecheck/test script. Báo API thật/mock và kiểm tra thực chạy.
