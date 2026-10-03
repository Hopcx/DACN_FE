# Phạm vi bằng chứng

## FACT — nguồn đã phân tích

Nguồn: Gittodoc_testify.txt, đầu file ghi repository `hlk9/testify`, 279 files analyzed. Đây là snapshot export được cung cấp, không có commit SHA hay ngày export để chứng minh đó là bản mới nhất.

Đã tách danh mục file, đọc manifest/bootstrap/DbContext, model và các đường đi chính: đăng nhập, ngân hàng câu hỏi, tạo đề, lịch thi, làm bài, chấm điểm, nộp bài, lịch sử, import/export. Danh mục tự động ở 05-migration là chỉ mục tìm nguồn, không phải xác nhận mọi chức năng hoạt động.

| Phát hiện | Bằng chứng trong snapshot |
|---|---|
| Solution có API, DAL, Web | Testify.sln; các project .csproj |
| Cả ba project target net8.0 | Testify.API/Testify.API.csproj; Testify.DAL/Testify.DAL.csproj; Testify.Web/Testify.Web.csproj |
| EF Core và provider SQL Server 8.0.7 | Testify.DAL/Testify.DAL.csproj |
| MudBlazor 7.* và Blazored.LocalStorage 4.5.0 | Testify.Web/Testify.Web.csproj |
| JWT bearer 8.0.8; EPPlus 7.3.2 | Testify.API/Testify.API.csproj |
| Interactive Server | Testify.Web/Program.cs: AddInteractiveServerComponents, AddInteractiveServerRenderMode |
| Web tham chiếu API và DAL | Testify.Web/Testify.Web.csproj |
| Repository tự tạo DbContext | Testify.DAL/Reposiroties/SubmissionReposiroty.cs và UserRepository.cs |
| Chấm điểm nằm trong Razor | Testify.Web/Components/Pages/ViewExamTest.razor: ScoreExam |
| Có EF migration và model snapshot | Testify.DAL/Migrations/20240823071009_Testify-Final.cs; TestifyDbContextModelSnapshot.cs |

Blazor Interactive Server chạy logic tương tác trên server. Không được mô tả ScoreExam cũ là JavaScript tính điểm trong trình duyệt; vấn đề chuyển đổi là không bê logic tin cậy này sang React.

## FACT — repository mới đã truy cập được

Ngày 23/09/2026, đọc qua GitHub theo URL người dùng xác nhận: Hopcx/DACN_Project tại master `4d5ff309e130f385d207abbc215f5a3b3b4eaa7c` và Hopcx/DACN_FE tại main `37d5883c8ea272613686aae90dfccadd81bda3c5`. Owner chính xác là **Hopcx**; HOPCX_8 là tên hiển thị đã bị nhầm với owner trong lần kiểm tra trước. Kết quả 404 cũ không còn mô tả khả năng truy cập hiện tại.

Đã lấy cây repo không bị truncation, source text C#/JSX/JS/CSS/JSON/manifest và đối chiếu đường đi controller → service → repository → EF cùng UI → Axios. Xem [audit](06-codebase-audit.md) và [endpoint catalogue](../04-contracts/04-current-endpoints.md) có permalink theo commit.

## Giới hạn xác minh

Đây là static code review. Chưa restore/build/run hai ứng dụng hoặc kết nối SQL; chưa biết schema/data thực tế trên server, runtime env, tải, kết quả UAT. Không đọc binary DOCX/ảnh; không bao quát branch khác và lịch sử Git. Những lỗi có bằng chứng source được ghi là vấn đề cần kiểm chứng/sửa, không giả tạo output lỗi runtime.

## Không sao chép vào sản phẩm mới

- DbContext cũ chứa chuỗi kết nối và credentials trực tiếp; appsettings có cấu hình nhạy cảm. Bộ tài liệu chỉ ghi vị trí, không lặp giá trị. Nếu còn sử dụng các giá trị đã lộ trong source, thay thế và chuyển ra cấu hình bí mật.
- AccessController.LoginReturnToken dùng GET với passwordHash. UserRepository.GetByKeyAndPassword so sánh chuỗi hash; không coi package BCrypt đã cài là bằng chứng đang dùng BCrypt cho luồng này.
- SubmissionController nhận entity Submission từ request; ScoreExam tạo điểm và metadata ở Web rồi gọi lưu. Thiết kế mới chỉ nhận đáp án và định danh lượt thi.
- GetScheduleCurrent dùng StartTime >= hiện tại, cần kiểm thử và sửa điều kiện lịch đang diễn ra khi chuyển đổi.
- ScoreExam rẽ nhánh theo số đáp án chọn; một câu nhiều đáp án nhưng chỉ chọn một đáp án đúng có thể được cộng điểm. Ghi nhận sai khác và thống nhất cách chấm theo loại câu hỏi.
