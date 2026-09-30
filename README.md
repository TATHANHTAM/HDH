# Ôn tập Hệ điều hành Windows, Linux và Unix

Website tĩnh để ôn 200 câu hỏi trong 8 chương từ tài liệu “Ngân hàng 200 câu hỏi Windows, Linux, Unix”.

## Chức năng

- Ôn lần lượt 25 câu theo từng chương hoặc trộn 200 câu để ôn tổng hợp.
- Kiểm tra đáp án từng câu, xem điểm và các câu đã bỏ qua ở cuối lượt.
- Xem lại đáp án đã chọn và đáp án đúng của các câu làm sai; làm lại các câu đó.
- Danh sách câu sai được lưu trong bộ nhớ của trình duyệt đang dùng và được cập nhật khi trả lời đúng.

## Chạy trên máy

Tại thư mục này, chạy một máy chủ HTTP tĩnh, ví dụ:

```sh
python -m http.server 8000
```

Sau đó mở `http://localhost:8000`. Trang tải câu hỏi và đáp án từ `questions.json`; mở trực tiếp `index.html` bằng giao thức `file://` có thể không tải được dữ liệu.
