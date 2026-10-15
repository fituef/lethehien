# BÁO CÁO TỔNG QUAN DỮ LIỆU ĐÁNH GIÁ (DATA OVERVIEW REPORT)

**Dự án:** Khai phá dữ liệu và Phân tích so sánh dịch vụ tour trải nghiệm xe máy tại TP.HCM  
**Đối tượng nghiên cứu:** **Vespa Adventures** vs **XO Tours**  
**Nguồn thu thập:** Google Maps & Tripadvisor  
**Thời gian dữ liệu:** 2011 – 2026 (15 năm)  

---

## 1. TỔNG QUAN TẬP DỮ LIỆU (DATASET SUMMARY)

Toàn bộ dữ liệu thô đã được xử lý làm sạch, chuẩn hóa schema thống nhất và phân loại theo 2 thương hiệu tour hàng đầu tại TP.HCM.

* **Tổng số bản ghi sạch:** **16,974** bản ghi
* **Tiêu chuẩn làm sạch (Data Cleaning Filter):**
  * Loại bỏ hoàn toàn các đánh giá chấm sao suông không nội dung (`null`, rỗng).
  * **Bộ lọc điều kiện kép cho nội dung bình luận:** Bắt buộc **độ dài >20 ký tự và tối thiểu từ 6 từ trở lên** nhằm loại bỏ triệt để các câu cảm thán cụt lủn không mang ngữ cảnh phân tích (như *"Trải nghiệm tuyệt vời"*, *"Super cool experience"*).
  * Ưu tiên nội dung gốc (`review_text_original`) của du khách trên Google Maps để đảm bảo sắc thái biểu cảm tự nhiên, tránh sai lệch từ dịch máy.
  * Hợp nhất tiêu đề và nội dung (`review_title - review_text`) trên Tripadvisor.
  * Chuẩn hóa thời gian đánh giá về số năm nguyên (`year`).

### Bảng phân bố dữ liệu theo Địa điểm & Nền tảng

| Địa điểm / Thương hiệu | Google Maps | Tripadvisor | Tổng số bản ghi sạch | Tỷ trọng |
| :--- | :---: | :---: | :---: | :---: |
| **Vespa Adventures** | 3,438 | 3,922 | **7,360** | 43.36% |
| **XO Tours** | 2,222 | 7,392 | **9,614** | 56.64% |
| **TỔNG CỘNG** | **5,660** (33.35%) | **11,314** (66.65%) | **16,974** | **100%** |

---

## 2. PHÂN BỐ ĐIỂM ĐÁNH GIÁ (RATING DISTRIBUTION)

Cả hai đơn vị đều sở hữu tỷ lệ đánh giá cực kỳ xuất sắc trên các nền tảng trực tuyến với trên **95%** đánh giá đạt 5 sao tuyệt đối.

| Thang điểm | Vespa Adventures | Tỷ lệ (%) | XO Tours | Tỷ lệ (%) | Tổng cộng |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **5 ⭐** | 7,058 | 95.90% | 9,375 | 97.51% | **16,433** (96.81%) |
| **4 ⭐** | 244 | 3.32% | 200 | 2.08% | **444** (2.62%) |
| **3 ⭐** | 33 | 0.45% | 29 | 0.30% | **62** (0.37%) |
| **2 ⭐** | 14 | 0.19% | 5 | 0.05% | **19** (0.11%) |
| **1 ⭐** | 11 | 0.15% | 5 | 0.05% | **16** (0.09%) |
| **Điểm TB (Mean)** | **4.94 / 5.0** | | **4.97 / 5.0** | | **4.96 / 5.0** |

> **Nhận xét chuyên môn:**  
> Dữ liệu có độ lệch dương rất cao (Positive Skewness). Nhóm đánh giá tiêu cực (1 - 3 sao) chiếm tỷ lệ rất nhỏ (< 1%, tổng cộng 97 bản ghi), được bảo toàn 100% qua bộ lọc làm sạch. Đây chính là nguồn dữ liệu quý giá nhất để khai thác các "điểm nghẽn dịch vụ" (Pain points), sự cố an toàn giao thông, hoặc sự bất tiện về ẩm thực/thời tiết.

---

## 3. PHÂN BỐ THEO NĂM (TEMPORAL DISTRIBUTION: 2011 - 2026)

Tập dữ liệu phản ánh rõ nét toàn bộ chu kỳ phát triển của ngành du lịch trải nghiệm xe máy tại TP.HCM trong 15 năm qua:

| Năm | Vespa Adventures | XO Tours | Tổng cộng theo năm | Giai đoạn thị trường |
| :---: | :---: | :---: | :---: | :--- |
| **2011** | 121 | 197 | 318 | Giai đoạn hình thành mô hình tour xe máy |
| **2012** | 115 | 388 | 503 | Tăng trưởng ban đầu |
| **2013** | 201 | 535 | 736 | Tăng trưởng ban đầu |
| **2014** | 337 | 666 | 1,003 | Bùng nổ du lịch quốc tế |
| **2015** | 472 | 790 | 1,262 | Đạt đỉnh tăng trưởng trên Tripadvisor |
| **2016** | 519 | 917 | 1,436 | Đạt đỉnh tăng trưởng trên Tripadvisor |
| **2017** | 553 | 863 | 1,416 | Giai đoạn ổn định lượng khách |
| **2018** | 755 | 775 | 1,530 | Cạnh tranh song mã |
| **2019** | 508 | 599 | 1,107 | Trước đại dịch |
| **2020** | 79 | 145 | 224 | Dịch COVID-19 bùng phát đầu năm |
| **2021** | 0 | 0 | 0 | **Đóng băng hoàn toàn (Giãn cách xã hội vì COVID-19)** |
| **2022** | 21 | 269 | 290 | Bắt đầu mở cửa du lịch trở lại |
| **2023** | 65 | 715 | 780 | Phục hồi mạnh mẽ |
| **2024** | 674 | 853 | 1,527 | Phục hồi hoàn toàn |
| **2025** | 1,693 | 1,153 | 2,846 | Chuyển dịch mạnh mẽ sang Google Maps |
| **2026** | 1,247 | 749 | 1,996 | Giai đoạn hiện tại (thời điểm cào dữ liệu) |

> **Nhận xét biến động thời gian:**  
>
> 1. Năm 2021 có đúng **0 bản ghi** phản ánh chính xác thực tế lịch sử (TP.HCM đóng cửa du lịch hoàn toàn phòng chống dịch).  
> 2. Giai đoạn 2011 - 2019 chiếm ưu thế bởi **Tripadvisor**, trong khi giai đoạn 2024 - 2026 có sự bùng nổ vượt bậc của đánh giá từ **Google Maps** (nhất là Vespa Adventures với gần 1,700 đánh giá trong năm 2025).

---

## 4. ĐẶC ĐIỂM VĂN BẢN ĐÁNH GIÁ (TEXT & CONTENT CHARACTERISTICS)

| Chỉ số độ dài bình luận | Vespa Adventures | XO Tours | Toàn bộ dữ liệu |
| :--- | :---: | :---: | :---: |
| **Độ dài trung bình (Ký tự)** | 384.9 ký tự | 550.5 ký tự | 478.7 ký tự |
| **Trung vị độ dài (Median ký tự)** | 252.0 ký tự | 440.0 ký tự | 350.0 ký tự |
| **Số từ trung bình (Words)** | ~75 từ | ~103 từ | ~91 từ |
| **Trung vị số từ (Median words)** | 55 từ | 82 từ | 67 từ |
| **Bình luận dài nhất** | 10,592 ký tự (2,071 từ) | 11,780 ký tự (2,164 từ) | 11,780 ký tự (2,164 từ) |
| **Bình luận ngắn nhất (đã lọc)** | 22 ký tự (6 từ) | 26 ký tự (6 từ) | 22 ký tự (6 từ) |

* **Đặc thù nội dung của XO Tours:** Khách hàng viết bình luận dài và chi tiết hơn (trung bình hơn 100 từ/review). Các đánh giá này thường kể lại chi tiết trải nghiệm từng món ăn trong Food Tour và cảm xúc khi được các tài xế nữ mặc Áo Dài đưa đi qua các quận.
* **Đặc thù nội dung của Vespa Adventures:** Đánh giá cô đọng, tập trung vào trải nghiệm lái xe cổ Vespa, cảm giác luồn lách qua các hẻm nhỏ và sự sành điệu, an toàn của người dẫn tour.

---

## 5. ĐẶC ĐIỂM NGÔN NGỮ & HÌNH THỨC DU LỊCH (LANGUAGE & TRAVELER PROFILE)

### Phân bố ngôn ngữ chính

* **Tiếng Anh (English):** Chiếm trên **85%** tổng thể (Vespa Adventures: ~93%, XO Tours: ~77%). Đây là ngôn ngữ chủ đạo rất thuận lợi cho việc áp dụng các mô hình NLP/Sentiment Analysis và Topic Modeling chuẩn tiếng Anh.
* **Tiếng Việt & Các ngôn ngữ khác:** Tiếng Việt xuất hiện nhiều hơn ở các review Google Maps gần đây. Ngoài ra còn có tiếng Đức (German), tiếng Pháp (French), tiếng Hà Lan (Dutch) phản ánh nhóm khách du lịch châu Âu.

### Nhóm khách hàng du lịch (Dựa trên dữ liệu Tripadvisor)

* **Cặp đôi (Couples):** Chiếm tỷ lệ cao nhất (~45% các đánh giá có khai báo).
* **Bạn bè (Friends) & Gia đình (Families):** Nhóm đối tượng phổ biến tiếp theo.
* **Đi một mình (Solo travelers):** XO Tours ghi nhận số lượng khách đi một mình (đặc biệt là khách nữ) rất cao nhờ cam kết an toàn từ đội ngũ tài xế nữ.
