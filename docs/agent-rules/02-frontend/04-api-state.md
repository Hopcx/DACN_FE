# FE — API state và auth trên codebase hiện tại

## FACT

src/api/axiosClient.js tạo client baseURL từ VITE_API_BASE_URL hoặc /api, withCredentials=true, response interceptor passthrough. Không attach Bearer, không refresh/retry logic. src/services/exampleService.js gọi /example nhưng không có endpoint nghiệp vụ đó trong BE. Login/Register chưa gọi service.

Redux store chỉ app.status; AppProvider giữ sidebarOpen. Chưa có auth slice, server cache hoặc query hooks.

## REQUIRED — API adapter

Giữ Axios là transport chung. Sửa env/proxy thống nhất /web như flows. Thêm authService.login/refresh/me theo controller hiện có; login keyword/password, refresh body refreshToken. response.data là ApiResponse envelope; data.data là payload. withCredentials=true không tạo HttpOnly cookie và không attach JWT tự động.

Một nơi giữ auth state; access token chỉ lưu memory trong baseline hardening. Thời gian chuyển tiếp JSON refresh token có thể giữ memory trong phiên, chấp nhận cần đăng nhập lại khi reload; nếu cần persistent session thì hoàn thiện HttpOnly cookie ở BE trước, không tự lưu token dài hạn vào localStorage. Tách yêu cầu sản phẩm khỏi trạng thái hiện có.

Request interceptor gắn Bearer; response 401 single-flight refresh/replay tối đa một lần, không refresh chính refresh request. Không retry 403. Với nhiều tab phải thiết kế điều phối rotation. Khi có logout endpoint, thu hồi server session; hiện chỉ clear client không đồng nghĩa token đã bị revoke.

Error adapter nhận ApiResponse.Fail, ValidationProblemDetails hoặc body rỗng. Chưa có code/traceId trong envelope hiện tại: chỉ xử lý khi BE đã bổ sung, không bịa field.

## REQUIRED — server state

Tiếp tục Redux Toolkit hiện có. Trước khi thêm cache, chọn một owner: async thunk/service cho phạm vi nhỏ hoặc RTK Query nếu được triển khai. RTK Query là đề xuất thuộc toolkit, chưa có trong source. Không thêm TanStack Query/Zustand mặc định. Không copy cùng response vào Context và Redux.

Pagination phía server cho Rooms đã có nhưng cần fix sorting/maxPageSize; các list khác chưa đồng nhất. Key/cache nếu bổ sung phải có filter/page/resource/user scope. Logout xóa state theo user. Không optimistic-finalize bài thi.

## PROPOSED — draft và submit

Draft theo attemptId/questionId, chỉ answerIds. Save có revision và response savedAt; chỉ báo “đã lưu” khi server xác nhận đúng revision. Local storage nếu có chỉ giúp UX, không là bằng chứng đáp án tới server trước deadline.

Submit dùng key ổn định, backend idempotent. Mất response sau commit thì fetch status/retry cùng key, không tạo lượt mới. Timer hiển thị theo serverNow/expiresAt; backend worker phải finalize khi client đóng. Những API này chưa tồn tại, xem exam-api sketch trước triển khai.
