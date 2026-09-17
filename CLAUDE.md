# Sổ tay SGK — hướng dẫn cho Claude

Web tĩnh tổng hợp kiến thức sách giáo khoa (SGK) theo **lớp → môn → bài**. Mục tiêu: học sinh **nhìn là hiểu**:
định nghĩa, định luật, công thức (đóng khung), ghi chú, mẹo nhớ, lỗi hay nhầm.
Mọi nội dung viết bằng **tiếng Việt có dấu**. Không cần máy chủ: mở `index.html` bằng trình duyệt là chạy (kể cả offline).

## Cấu trúc thư mục

```
index.html                  Trang chủ: chọn lớp (render từ catalog.js)
lop-9/index.html            Trang lớp: chọn môn (render từ catalog.js)
lop-9/khtn.html             Trang môn — KHTN có 3 tab: Vật lí / Hoá học / Sinh học
lop-9/_parts/*.html         Nội dung từng môn/tab (partial) — ĐÂY là nơi viết kiến thức
assets/css/style.css        Giao diện dùng chung (có chế độ tối, in ấn, điện thoại)
assets/js/catalog.js        Danh mục lớp & môn (status ready/soon)
assets/js/main.js           Tab, mục lục tự sinh, ô tìm kiếm, công thức nhanh, sáng/tối, render KaTeX
assets/vendor/katex/        KaTeX 0.16.11 + mhchem (chạy offline)
tools/render_pdf.py         PDF → ảnh từng trang
tools/build.py              Nhúng _parts vào trang môn
tools/check_math.js         Kiểm tra mọi công thức KaTeX render được
.cache/                     Ảnh trang SGK đã render (pages/<lop>/<mon>/p001.jpg…) + KaTeX cho check_math — KHÔNG đẩy git
data/                       Tài liệu SGK (PDF) người dùng đưa vào — KHÔNG đẩy git, không sửa/không di chuyển
```

## Quy trình khi người dùng đưa SGK mới

Tài liệu mới người dùng bỏ vào `data/` (gợi ý đặt `data/lop-X/<ma-mon>.pdf`). `data/` và `.cache/` nằm trong
`.gitignore`: web chỉ dùng `index.html`, `lop-*/`, `assets/`, nên clone về vẫn chạy được; muốn làm lại nội dung thì
cần có PDF trong `data/` và chạy lại bước 1, còn `check_math.js` cần cài lại KaTeX vào `.cache/node`.

1. **Render PDF thành ảnh** (SGK thường là bản scan, `pdftotext` không lấy được chữ):
   `python tools/render_pdf.py "<file.pdf>" .cache/pages/lop-X/<ma-mon>` (cần `pip install pymupdf`).
2. **Đọc mục lục** (thường trang PDF 4–6) → lập bảng *bài → trang*. Ghi lại độ lệch
   *số trang PDF = số trang in + k* (KHTN 9: k = 1).
3. **Đọc hết từng trang** của mỗi bài bằng Read trên ảnh. Không bịa, không lấy kiến thức ngoài SGK
   làm nội dung chính (được thêm *mẹo nhớ / dễ nhầm* ngắn gọn, đúng kiến thức).
   Môn dài → chia cho nhiều agent chạy song song, mỗi agent một môn/khối chương, mỗi agent ghi **một file partial riêng**.
4. **Viết nội dung** vào `lop-X/_parts/<ma-mon>[-<tab>].html` theo mẫu bên dưới.
5. **Tạo trang môn** `lop-X/<ma-mon>.html` (copy `lop-9/khtn.html`; môn một phần thì giữ 1 panel, xoá thanh tab).
   Mỗi panel có cặp đánh dấu `<!-- INCLUDE _parts/... -->` … `<!-- /INCLUDE -->`.
6. **Chạy** `python tools/build.py` để nhúng partial vào trang.
7. **Cập nhật** `assets/js/catalog.js`: `status: "ready"`, `page: "<ma-mon>.html"`. Lớp mới → tạo `lop-X/index.html`
   (copy `lop-9/index.html`, sửa `data-grade` và chữ "Lớp 9"), đặt lớp đó `status: "ready"`.
8. **Kiểm tra**: `node tools/check_math.js` phải báo 0 lỗi (cài KaTeX 1 lần theo ghi chú đầu file).
   Mở trang: mục lục đủ bài, tab chuyển được, giao diện điện thoại không tràn ngang.

Quy ước tên: `lop-6` … `lop-12`; mã môn không dấu, gạch nối: `khtn`, `toan`, `ngu-van`, `tieng-anh`,
`lich-su-dia-li`, `gdcd`, `tin-hoc`, `cong-nghe`. Tab KHTN: `vat-li`, `hoa-hoc`, `sinh-hoc`.

## Mẫu nội dung (partial)

Mỗi partial là chuỗi `section.chapter` → `article.lesson`. **Id phải duy nhất trong cả trang**, có tiền tố theo tab:
`ly-`, `hoa-`, `sinh-` (môn một phần: dùng mã môn, vd. `toan-`). Mục lục tự sinh từ `.chapter-title` và `.lesson-title`.

```html
<section class="chapter" id="ly-chuong-1">
  <h2 class="chapter-title"><span>Chương I</span>Năng lượng cơ học</h2>

  <article class="lesson" id="ly-bai-2">
    <h3 class="lesson-title"><span class="lesson-no">Bài 2</span>Động năng. Thế năng</h3>
    <p class="lesson-goal">Cần nắm: biểu thức động năng; biểu thức thế năng trọng trường.</p>

    <h4>1. Động năng</h4>
    <div class="box def">
      <p><b>Động năng</b> là năng lượng mà vật có được do <span class="kw">chuyển động</span>.</p>
      <p>Động năng phụ thuộc vào <b>khối lượng</b> và <b>tốc độ</b> của vật.</p>
    </div>
    <div class="formula">
      <div class="formula-name">Động năng</div>
      <div class="formula-body">\[ W_\text{đ} = \frac{1}{2}mv^2 \]</div>
      <ul class="formula-legend">
        <li>\(m\): khối lượng (kg)</li>
        <li>\(v\): tốc độ (m/s)</li>
        <li>\(W_\text{đ}\): động năng (J)</li>
      </ul>
    </div>
    <div class="box tip"><p>Tốc độ tăng 2 lần → động năng tăng <b>4 lần</b> (vì có \(v^2\)).</p></div>

    <div class="key-points">
      <ul><li>…</li></ul>
    </div>
  </article>
</section>
```

### Các khối có sẵn (chọn đúng loại — màu & nhãn tự hiện)

| Class | Dùng cho | Nhãn tự hiện |
|---|---|---|
| `div.box.def` | Khái niệm, định nghĩa | 📘 Định nghĩa |
| `div.box.law` | Định luật, định lý, quy tắc, nguyên lí, quy luật | ⚖️ Định luật · Quy tắc |
| `div.box.fact` | Tính chất, đặc điểm, phân loại | 🔎 Tính chất · Đặc điểm |
| `div.box.note` | Ghi chú, lưu ý của SGK, mở rộng | 📝 Ghi chú |
| `div.box.tip` | Mẹo nhớ, cách hiểu nhanh | 💡 Mẹo nhớ |
| `div.box.warn` | Lỗi hay nhầm, điều kiện bắt buộc | ⚠️ Dễ nhầm |
| `div.box.example` | Ví dụ / bài tập mẫu có lời giải ngắn | ✏️ Ví dụ |
| `div.formula` | **Mọi công thức** — luôn đóng khung, có `formula-name`, `formula-body`, `formula-legend` (kí hiệu + đơn vị) | — |
| `div.formula-row` | Bọc nhiều `.formula` ngắn đứng cạnh nhau | — |
| `div.equation` | Phương trình hoá học (dùng `\ce{}`) | — |
| `div.key-points` | "Ghi nhớ nhanh" cuối mỗi bài (bắt buộc, 3–6 ý) | 🎯 Ghi nhớ nhanh |
| `ol.steps` | Quy trình có thứ tự (các bước thí nghiệm, cơ chế) | — |
| `div.flow` | Chuỗi ngắn: `<span>A</span><i>→</i><span>B</span>` | — |
| `div.table-wrap > table` | So sánh, phân loại, bảng tính chất | — |
| `figure.diagram > svg + figcaption` | Sơ đồ SVG tự vẽ (tia sáng, mạch điện, sơ đồ lai…) | — |
| `div.two-col` | Đặt 2 hộp cạnh nhau để so sánh | — |
| `span.kw` / `span.hl` | Từ khoá tô màu / tô nền | — |

- Đổi nhãn hộp khi cần: `<div class="box law" data-label="⚖️ Định luật Ohm">`.
- Tiêu đề trong hộp: `<p class="box-title">…</p>`.
- Tiêu đề mục trong bài: `h4` (mục lớn, đánh số 1, 2, 3…), `h5` (mục nhỏ).

### Nút "∑ Công thức nhanh"

Trang môn nào có `.formula`/`.equation` sẽ **tự có** nút "∑ Công thức nhanh" trên thanh trên cùng (phím tắt `F`,
link thẳng `<trang>.html#cong-thuc`). Nút mở bảng tra gom mọi khung công thức theo tab → bài, có ô tìm (không dấu),
lọc theo tab, bật/tắt phương trình hoá học, nút in. Không cần viết thêm gì, nhưng phải tuân thủ:
- Mọi công thức cần tra khi làm bài tập **phải** nằm trong `div.formula` (công thức chỉ viết inline sẽ không vào bảng tra).
- `formula-name` phải tự rõ nghĩa khi đứng ngoài bài: "Điện trở tương đương (song song)", không ghi "Công thức 2".
- `formula-legend` luôn ghi kí hiệu + đơn vị; công thức suy ra đặt trong `formula-note` để hiện cùng.

### Công thức & hoá học (KaTeX)

- Inline `\( … \)`, riêng dòng `\[ … \]`. **Không** dùng `$…$`.
- Chữ tiếng Việt trong công thức phải bọc `\text{}`: `W_\text{đ}`, `W_\text{t}`, `\text{(J)}`.
- Hoá học dùng mhchem: `\(\ce{H2SO4}\)`, `\[\ce{Fe + 2HCl -> FeCl2 + H2 ^}\]`,
  điều kiện trên/dưới mũi tên: `\ce{->[t^\circ]}`, `\ce{<=>[H2SO4\ \text{đặc}][t^\circ]}` (chữ Việt trên mũi tên bọc `\text{}`).
- Dấu thập phân kiểu Việt Nam: viết `0{,}45` trong công thức, `0,45` trong văn bản.
- Đơn vị viết sau kí hiệu trong `formula-legend`, dạng "\(R\): điện trở (Ω)".
- Công thức suy ra / biến đổi (vd. \(v = \sqrt{2W_\text{đ}/m}\)) đặt thêm trong cùng khung, hoặc `formula-note`.

### Nguyên tắc biên soạn "nhìn là hiểu"

- **Bám sát SGK**: đủ mọi định nghĩa, định luật, công thức, bảng, kết luận "Em đã học" của từng bài.
  Bỏ qua câu hỏi thảo luận/mở bài, trừ khi nó chứa kiến thức.
- Câu ngắn, gạch đầu dòng; mỗi hộp một ý. Tô `b`/`.kw` cho từ khoá.
- Mỗi bài: `lesson-goal` (cần nắm) → các mục `h4` → `key-points`.
- Thêm `tip`/`warn` khi thật sự giúp nhớ (đơn vị hay nhầm, dấu, điều kiện áp dụng, so sánh dễ lẫn).
- Nội dung so sánh → dùng bảng. Quy trình → `ol.steps`. Chuỗi biến đổi → `div.flow`.
- Sơ đồ SVG: chỉ vẽ khi giúp hiểu (đường truyền tia sáng, mạch điện, sơ đồ lai), dùng `viewBox`,
  chữ SVG không đặt màu cứng (CSS lo màu), nét dùng class `stroke`/`accent`; kích thước vừa phải (≤ 480px rộng).
- Không chèn ảnh chụp từ SGK.
- HTML hợp lệ, thụt lề 2 dấu cách, UTF-8.

## Kinh nghiệm rút ra

- Chia agent theo môn/tab chạy song song; prompt cho agent phải có: bắt đọc CLAUDE.md, dải trang PDF, mục lục bài,
  file đầu ra duy nhất, tiền tố id, yêu cầu chạy `check_math.js` trên partial, **cấm** chạy `build.py`/sửa file khác,
  và báo cáo cuối liệt kê chỗ không chắc + nội dung tự thêm ngoài SGK. Sau đó người điều phối build và kiểm tra.
- Nội dung ngoài SGK (câu nhớ, ví dụ tự tính) chỉ giữ nếu đúng và thật sự giúp nhớ; bỏ câu nhớ gượng ép.
  Khi SGK ghi số liệu lạ, giữ nguyên và ghi "(theo SGK)".
- Chụp màn hình kiểm tra bằng Edge headless (`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe
  --headless=new --screenshot=… --window-size=… --virtual-time-budget=5000`). Edge headless không thu nhỏ cửa sổ
  dưới ~500px và chụp sai khi trang đã cuộn → tạo file HTML tạm (trong scratchpad) chứa các `<iframe>` rộng 380px
  (điện thoại) và 1000px (máy tính) trỏ tới `khtn.html#<id-bài>` rồi chụp file đó.
- Không viết `\` trơn trong văn bản HTML ngoài công thức (bị hiển thị thẳng ra).

## Tiến độ

| Lớp | Môn | Nguồn | Trạng thái |
|---|---|---|---|
| 9 | KHTN (Lí/Hoá/Sinh) | `data/thuvienhoclieu.com-SGK-KHTN-Lop-9-thong-nhat-.pdf` — Kết nối tri thức, 230 trang, trang PDF = trang in + 1 | Xong 2026-09-17: 15 chương, 51 bài, 798 công thức |

Phân chia KHTN 9 (số trang PDF): Bài 1 (chung, đặt ở tab Hoá) 7–15 · **Vật lí** Chương I–V (Bài 2–17) 16–87 ·
**Hoá học** Chương VI–X (Bài 18–35) 88–159 · **Sinh học** Chương XI–XIV (Bài 36–51) 160–224, thuật ngữ 225–227.
