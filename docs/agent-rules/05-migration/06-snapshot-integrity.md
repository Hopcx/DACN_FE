# Nhận diện snapshot

## Baseline GitHub bổ sung v0.2

- BE: Hopcx/DACN_Project, master, `4d5ff309e130f385d207abbc215f5a3b3b4eaa7c`.
- FE: Hopcx/DACN_FE, main, `37d5883c8ea272613686aae90dfccadd81bda3c5`.
- Đọc 244 file text BE + 35 file text FE, không có fetch lỗi trong batch; không đồng nghĩa đọc binary hoặc test runtime.
- Xem audit và endpoint catalogue cho nguồn từng phát hiện. SHA export bên dưới chỉ đại diện Testify cũ.

- Tên nguồn: Gittodoc_testify.txt.
- SHA-256 của bytes file đính kèm: `eba6226d82342bb17fe09bd68f396d264d1055fb9b193c99545061b1e5ada73f`.
- Số block FILE phân tích được: 279.
- Đây là hash của file export, không phải Git commit SHA.
- Không bàn giao lại bản source export có secrets trong bộ rules.

Chỉ mục giữ dòng của bản export để tìm nguồn. Khi có GitHub mới, bổ sung owner/repo, branch, commit và ngày đọc riêng cho BE/FE. Không gắn SHA của export thành commit repo.
