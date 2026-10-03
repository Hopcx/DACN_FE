# HTTP contract: hiện tại và quy tắc phát triển

## FACT — contract đang có

Các controller nghiệp vụ dùng `/web/*`; WeatherForecast dùng route theo controller. SwaggerDoc version v1 không làm path thành /api/v1. Xem [catalogue](04-current-endpoints.md) để lấy action path thật.

`ApiResponse<T>` có Success, Data, Message. Với JSON web camelCase: `{ "success": true, "data": ..., "message": null }`. Axios interceptor hiện trả nguyên response, nên envelope là response.data, payload là response.data.data. Không destructure payload ở sai tầng.

Room list trả ApiResponse<PagedResult<RoomResponseDto>>; PagedResult có items, totalCount, page, pageSize (không có totalPages). Query mặc định Page=1/PageSize=10. Các list khác thường trả array trong data, không được giả định đều đã phân trang.

HTTP create dùng 201 với Created("", ...); delete thường 200 envelope; lỗi controller 400/404 envelope. Middleware map ValidationException/BadRequestException=400, NotFound=404, unexpected=500, trả ApiResponse.Fail. MVC model-validation tự động có thể trả ValidationProblemDetails; 401/403 từ middleware có thể không có envelope. Chưa chạy để pin toàn bộ response runtime.

## REQUIRED — compatibility trước khi chuẩn hóa

Giữ prefix/envelope hiện có khi port FE. Viết error adapter nhận được envelope, validation problem hoặc body rỗng. Không nhận định mọi lỗi là ProblemDetails hoặc có code/traceId khi current DTO chưa chứa chúng.

Bổ sung code/fieldErrors/traceId và chuẩn hóa HTTP theo một change có OpenAPI/contract tests + FE adapter đi cùng. Không đổi tất cả endpoint sang /api/v1 chỉ để khớp v0.1. Nếu chọn versioning sau này, ghi transition rõ.

## HTTP semantics mục tiêu

200 đọc/update, 201 tạo có Location phù hợp, 204 cho thao tác không body nếu đã đổi contract; 400 invalid, 401 unauthenticated, 403 forbidden, 404 missing, 409 state/concurrency/idempotency conflict, 429 rate limit, 500 unexpected. Không bọc mọi lỗi bằng status 200.

List mới phải validate page/pageSize và sort allowlist; hiện chưa áp dụng đồng nhất. Payload không chứa entity navigation hoặc secret.

## PROPOSED — engine thi

Start/submit cần Idempotency-Key, identity+operation+key scope, request hash. Cùng key/cùng request trả cùng kết quả; payload khác trả conflict. Unique Submission.AttemptId vẫn bảo vệ sau TTL. Save draft dùng revision hoặc rowversion mapping rõ. Chưa có các cơ chế này trong snapshot hiện tại.

OpenAPI là contract build artifact khi thiết lập pipeline. Hiện chỉ thấy Swagger startup, chưa thấy artifact client generation. Không gọi lệnh generate chưa được khai báo trong repo.
