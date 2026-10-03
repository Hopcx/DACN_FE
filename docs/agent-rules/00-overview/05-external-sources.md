# Nguồn kỹ thuật được đối chiếu

Đọc ngày 23/09/2026. Nguồn chính thức dùng để kiểm tra các đề xuất kỹ thuật, không phải bằng chứng hiện trạng repo.

- [.NET support](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core): .NET 8 kết thúc hỗ trợ 10/11/2026; .NET 10 là LTS đến tháng 11/2028. Không cần khóa ngày cụ thể cuối hỗ trợ .NET 10 trong code.
- [Vite guide](https://vite.dev/guide/): kiểm tra yêu cầu Node và quy trình build theo major Vite thực tế; pin môi trường CI phù hợp engines.
- [Tailwind Vite](https://tailwindcss.com/docs/installation/using-vite): với dòng v4 dùng @tailwindcss/vite và CSS import. Không chép cấu hình v3 sang v4.
- [EF efficient querying](https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying): projection, giới hạn kết quả, index theo query, tránh roundtrip N+1.
- [EF concurrency](https://learn.microsoft.com/en-us/ef/core/saving/concurrency): concurrency token và xử lý DbUpdateConcurrencyException; SQL Server rowversion là token, không phải datetime.
- [ASP.NET CORS](https://learn.microsoft.com/en-us/aspnet/core/security/cors?view=aspnetcore-10.0): cấu hình origin và credentials theo deployment, không dùng wildcard origin với credentials.

Ant Design đã có trong FE; TanStack Query không có và không còn là baseline v0.2. Use case engine thi, draft API và mô hình attempt là đề xuất chưa triển khai. Version hiện tại lấy manifests/lockfile GitHub, không lấy từ tài liệu web. Khi cài package, kiểm tra tài liệu chính thức, peer dependencies và lockfile.
