# Skill workflow — thay schema và tối ưu SQL

## Baseline v0.2

EF8.0.14, ProjectDACNDbContext và migrations tại Project.Infrastructure/Migrations; ConnectionStrings:Default. Đã có index unique User/Class. Kiểm Exam–Schedule FK direction và TimeOnly duration theo audit; không tái tạo migration ban đầu vì thiếu schema runtime. SQL version và dữ liệu cần giữ vẫn OPEN.

Dùng khi thêm entity/migration/index, xử lý query chậm hoặc cân nhắc Redis/procedure. Đọc [model](../03-database/01-model.md), [migration](../03-database/02-migrations.md), [performance](../03-database/03-performance.md).

1. Xác minh provider/version, schema hiện tại và dữ liệu cần giữ; không truy cập DB bằng credentials của export.
2. Xác định query/invariant cần phục vụ. Với “chậm”, lấy query/plan/metrics trước; không bịa số đo.
3. Ưu tiên projection/pagination/index phù hợp; kiểm index đã có và chi phí ghi.
4. Thiết kế FK/unique/check/rowversion/transaction; phân biệt update concurrency và insert race.
5. Generate migration, review SQL, xử lý duplicate/null trước constraint; chuẩn bị backfill/rollback.
6. Test SQL Server baseline/fresh và race liên quan; đối soát dữ liệu nếu ETL.
7. Với Redis/procedure, ghi bằng chứng cần thiết, invalidation/ownership/deployment/test và phương án khi lỗi.

Output: model/migration/index diff, lý do, measurement thật hoặc “chưa đo”, ảnh hưởng dữ liệu, test evidence và rollout. Không tối ưu bằng đổi semantics lọc/chấm điểm.
