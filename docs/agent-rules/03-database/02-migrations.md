# DATABASE — EF Code First và chuyển schema

## FACT — vị trí và baseline mới

Context: Project.Infrastructure/Persistence/ProjectDACNDbContext.cs. Migrations: Project.Infrastructure/Migrations. Startup: Project.Api. Existing migration: 20260628110050_2806_updaetmơi11; snapshot: ProjectDACNDbContextModelSnapshot. EF packages 8.0.14. Chưa thấy local dotnet tool manifest; phải dùng dotnet-ef 8.x tương thích.

Connection env đúng là ConnectionStrings__Default. Source mới không hardcode connection trong OnConfiguring; settings vẫn cần secrets ngoài source cho deployment. Không tự reset database vì hiện chưa biết có dữ liệu cần giữ.

## Nơi sở hữu

DbContext, entity configuration và Migrations ở Infrastructure; API là startup project. Một entity configuration một file, đặt precision, length, FK, index và delete behavior tường minh. Connection string inject qua options; không hardcode trong OnConfiguring.

Migrations là source code có review; không chỉ sửa database thủ công rồi bỏ qua model. Không chạy EnsureCreated cùng Migrations trên database quản lý bằng migration. Không xóa/recreate database để sửa lỗi schema có dữ liệu.

## Quy trình thay đổi

1. Đọc schema/model snapshot và migration hiện tại; xác định dữ liệu bị ảnh hưởng.
2. Sửa Domain + configuration + contract liên quan.
3. Generate migration bằng EF tools khớp framework; kiểm Up/Down và SQL sinh ra.
4. Kiểm tra fresh database và nâng từ baseline có dữ liệu đại diện.
5. Kiểm null/duplicate trước thêm NOT NULL/unique; có script xử lý dữ liệu có thể kiểm chứng.
6. Với rename dùng rename thay drop/add nếu cần giữ dữ liệu; với thay kiểu có nguy cơ mất dữ liệu, thêm cột/backfill/chuyển đọc rồi mới dọn.
7. Production áp dụng migration bằng job riêng và tài khoản schema, có backup/restore đã thử. API runtime account không cần quyền sửa schema.

Lệnh theo đường dẫn project đã xác minh; chỉ thực thi khi có nhiệm vụ sửa schema và môi trường phù hợp:

```bash
dotnet ef migrations add AddExamAttempt --project Project.Infrastructure --startup-project Project.Api
dotnet ef migrations script --idempotent --project Project.Infrastructure --startup-project Project.Api
```

Chưa chạy các lệnh trên trong phiên cập nhật tài liệu. Rollback thực tế thường cần roll-forward/restore; Down không đảm bảo phục hồi dữ liệu đã drop.

## Seed

Lookup ID ổn định và datetime cố định nếu HasData. Không Guid.NewGuid/DateTime.Now trong seed model như source cũ. Không seed admin password vào source; bootstrap có secret tạm thời qua cơ chế riêng và bắt đổi nếu cần.

## Nếu giữ dữ liệu cũ — OPEN O02

Lập mapping ID/status/role/timezone/hash; kiểm duplicate/orphan; chụp backup; dry-run ETL staging; đối soát counts, quan hệ và điểm mẫu. Hash không rõ không tự migrate thành login tương thích. Kết quả thi cũ chưa có snapshot phải gắn provenance legacy, không giả tạo snapshot lịch sử từ câu hỏi hiện tại rồi gọi đó là nguyên bản.

Giữ bảng mapping legacyId→newId khi đổi khóa. Không tự nối database trong credentials đã thấy ở tài liệu để thử migration.
