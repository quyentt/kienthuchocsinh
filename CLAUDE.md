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

### Môn Toán

Trang `lop-9/toan.html`: 2 tab theo tập (`tap-1` class `t1`, `tap-2` class `t2`), mỗi tab 2 partial
(`_parts/toan-tap-1a.html`…). Id dùng chung tiền tố `toan-` (số bài/chương không trùng giữa 2 tập):
`toan-chuong-1`, `toan-bai-1`, `toan-on-tap-chuong-1`. Chương: `<h2 class="chapter-title"><span>Chương I · Đại số</span>…</h2>`.
- Mỗi bài: `lesson-goal` → các mục `h4` theo SGK → `key-points`. Trong mỗi mục:
  `box def` (định nghĩa, khái niệm) · `box law` (định lí, tính chất — `data-label="⚖️ Định lí …"`) ·
  `div.formula` (mọi công thức / hằng đẳng thức / hệ thức) · `box note` (Chú ý, Nhận xét của SGK) ·
  **`box method`** (🧭 Cách giải một dạng toán: `<p class="box-title">Dạng: …</p>` + `ol.steps`) ·
  `box example` (Ví dụ SGK có lời giải, trình bày gọn, đủ bước) · `box warn` (lỗi hay gặp: quên điều kiện, sai dấu…).
- Hình học: vẽ SVG cho định nghĩa/định lí có hình (tam giác vuông với cạnh kề/đối/huyền, đường tròn, dây, cung,
  tiếp tuyến, góc nội tiếp, tứ giác nội tiếp, hình trụ/nón/cầu…). Nhãn điểm in nghiêng như SGK.
- Mục "Luyện tập chung", "Bài tập cuối chương" không thành bài riêng; thay bằng một bài **Ôn tập chương**
  (`lesson-no` = "Ôn tập") cuối mỗi chương: bảng/tóm tắt công thức chính, sơ đồ các dạng toán và cách giải.
- Hoạt động thực hành trải nghiệm, bảng tra cứu thuật ngữ: không làm bài riêng (bảng giải thích thuật ngữ dùng để
  viết định nghĩa cho chuẩn).
- Kí hiệu cung: `\overset{\frown}{AB}` (KaTeX 0.16.11 không có `\wideparen`/`\overparen`). Tiêu đề chương/bài
  có thể chứa KaTeX (mục lục giữ nguyên công thức).
- Không dùng chữ viết tắt tự đặt; kí hiệu toán chuẩn (Δ, ⇔, ∈, (O; R), sin/cos/tan/cot) thì được.

### Môn Lịch sử và Địa lí

Trang `lop-9/lich-su-dia-li.html`: 3 tab `lich-su` (class `ls`), `dia-li` (`dl`), `chu-de-chung` (`cd`).
Id tiền tố `ls-`, `dl-`, `cd-` (vd. `ls-chuong-1`, `ls-bai-1`, `dl-bai-12`, `cd-chu-de-1`).
`<body data-quick-selector=".formula, .timeline, .stats">` → nút tra nhanh gom **mốc thời gian và số liệu**
thay vì công thức (tên nút "∑ Mốc & số liệu").
- **Lịch sử**, mỗi bài: bối cảnh → diễn biến → kết quả, ý nghĩa. Dùng:
  `ol.timeline` (`<li><span class="t-date">9-1945</span>…<span class="t-note">ghi chú</span></li>`) cho chuỗi sự kiện;
  `box def` (khái niệm: chiến tranh lạnh, toàn cầu hoá…), `box law data-label="📜 Nội dung chính"` cho nội dung
  văn kiện/hiệp định, `box note` (tư liệu, Em có biết), `box example` (nhân vật, trận đánh tiêu biểu),
  bảng so sánh giai đoạn, `div.flow` cho quan hệ nhân quả.
- **Địa lí**, mỗi bài/vùng: vị trí & phạm vi → điều kiện tự nhiên → dân cư → kinh tế (theo ngành) → ý nghĩa.
  Dùng `div.stats` (`<div><b>104,1 triệu</b><span>dân số 2024</span></div>`) cho số liệu nổi bật,
  bảng cơ cấu/sản lượng, `box fact` cho đặc điểm, `div.formula` cho công thức tính (mật độ dân số, tỉ lệ…).
  Số liệu ghi rõ **năm** và chép đúng SGK (sách dùng số liệu 2024, tỉnh/thành sau sáp nhập 2025).
- Bài **Thực hành** rút gọn: mục tiêu, các bước (`ol.steps`), kết luận mẫu.
- Không chép nguyên đoạn dài; tách ý thành gạch đầu dòng, in đậm từ khoá, mỗi bài có `key-points`.

### Môn ngoại ngữ (Tiếng Anh)

Trang một panel (`section.panel.en`, không thanh tab), nhiều INCLUDE liên tiếp (mỗi chủ điểm một partial
`_parts/tieng-anh-N.html`). `<body data-quick-title="Cấu trúc nhanh" data-quick-unit="cấu trúc" data-quick-hint="…">`
để nút tra nhanh thành "∑ Cấu trúc nhanh". Chương = **chủ điểm (Theme)**, bài = **Unit**; id `ta-chu-diem-N`, `ta-unit-N`.
Bài Review không có kiến thức mới → không tạo bài riêng. Mỗi Unit theo thứ tự:

```html
<article class="lesson" id="ta-unit-1">
  <h3 class="lesson-title"><span class="lesson-no">Unit 1</span>Local Community <span class="vi-title">Cộng đồng địa phương</span></h3>
  <p class="lesson-goal">Cần nắm: …</p>

  <h4>1. Vocabulary — Từ vựng</h4>
  <div class="table-wrap"><table class="vocab">
    <thead><tr><th>Từ / cụm từ</th><th>Loại</th><th>Phiên âm</th><th>Nghĩa</th></tr></thead>
    <tbody>
      <tr><td>artisan</td><td class="pos">n</td><td class="ipa">/ˌɑːtɪˈzæn/</td><td>thợ làm nghề thủ công</td></tr>
    </tbody>
  </table></div>
  <!-- cụm từ / collocation / word family: box note data-label="🔗 Cụm từ hay gặp" -->

  <h4>2. Pronunciation — Phát âm</h4>
  <div class="box law" data-label="🔊 Quy tắc phát âm">… ví dụ: <span class="en">com<span class="stress">mu</span>nity</span></div>

  <h4>3. Grammar — Ngữ pháp</h4>
  <div class="formula">
    <div class="formula-name">Câu hỏi gián tiếp với từ để hỏi + to-V</div>
    <div class="formula-body pattern"><i>S</i> + <b>ask / wonder / (don't) know</b> + <b>wh-word</b> + <b>to V</b></div>
    <ul class="formula-legend"><li>Dùng khi: …</li><li>Lưu ý: …</li></ul>
    <div class="formula-note"><span class="en">I don't know where to go.</span> <span class="vi">Tôi không biết đi đâu.</span></div>
  </div>
  <ul class="examples"><li><span class="en">…</span><span class="vi">…</span></li></ul>

  <h4>4. Everyday English — Giao tiếp</h4>   <!-- bảng: Chức năng | Mẫu câu (tiếng Anh, class en) -->
  <h4>5. Skills — Kĩ năng</h4>               <!-- ý chính bài đọc, dàn ý bài viết (ol.steps), từ nối/mẫu câu hữu ích -->
  <div class="key-points">…</div>
</article>
```

- Từ vựng lấy **đủ** từ Glossary cuối sách (từ, loại từ, phiên âm, nghĩa — chép đúng IPA) + bổ sung cụm từ quan trọng trong Unit.
- Mỗi điểm ngữ pháp = một `div.formula` với `formula-body pattern`: `<b>` = từ cố định, `<i>` = chỗ điền (S, V-ing, O…).
  Có cách dùng, lưu ý, ví dụ kèm dịch. Bảng so sánh khi dễ lẫn (defining vs non-defining…).
- Câu tiếng Anh bọc `span.en`, bản dịch `span.vi`. Âm tiết nhận trọng âm bọc `span.stress`.
- Không dùng KaTeX cho môn này (trang không nạp KaTeX).
- **Kí hiệu viết tắt** (sb, sth, one's, S, V, O, N, V-ing, to V, V3…): trang có `details.abbr-legend` ngay đầu
  `.content` (ngoài INCLUDE). Mỗi mục `<div data-term="sb" data-inline>` → JS tự gạch chấm + bong bóng nghĩa:
  `data-inline` = tìm cả trong câu chữ (chỉ dùng cho kí hiệu không thể trùng từ thường), không có = chỉ gắn vào
  ô `<i>` của khung cấu trúc; nhiều cách viết nối bằng `|` (`to V|to-V`). **Dùng kí hiệu mới trong nội dung thì
  phải thêm vào bảng này** — người dùng từng không hiểu "sb/sth". Môn khác cũng dùng được khối này.
- Bài phát âm luyện **âm** (không phải trọng âm): cũng dùng `span.stress` để tô chữ cái mang âm cần luyện.
- Glossary SGK có thể in sai (IPA, nghĩa): chép đúng sách, chỉ sửa lỗi rõ ràng và ghi chú lại, vd.
  `thuốc trừ sâu <span class="muted">(Glossary SGK ghi “…”)</span>`.

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
- **Kiểm độ lệch trang ở nhiều vị trí** (đầu – giữa – cuối sách) bằng cách cắt dải số trang ở đáy ảnh rồi ghép lại
  thành một ảnh; sách scan có thể thiếu trang, làm độ lệch thay đổi giữa chừng.
- Không viết `\` trơn trong văn bản HTML ngoài công thức (bị hiển thị thẳng ra).
- Công thức quá rộng: JS `fitFormulas()` tự xếp dọc `.formula-row`, thu nhỏ `.formula-body`/`.equation`
  (biến `--fit`) và cho công thức trong câu cuộn ngang (`.k-scroll`). Vẫn nên chủ động **tách công thức dài
  thành nhiều dòng** (`egin{aligned}` hoặc hai khối `\[ \]`) thay vì dựa vào thu nhỏ.
- Lưới CSS phải dùng `minmax(min(Xpx, 100%), 1fr)` và `.steps` dùng `minmax(0, 1fr)`, nếu không trang tràn ngang
  trên điện thoại.
- Kiểm tra tràn: script tạm trong scratchpad mở từng tab trong iframe rộng 1100px và 380px, đếm phần tử có
  `getBoundingClientRect().right > clientWidth` và `.formula-body` có `scrollWidth > clientWidth`. Mục tiêu: 0.
- Class của panel (`ly`, `hoa`, `sinh`, `en`) không được trùng class dùng trong nội dung: selector nội dung
  phải gắn thẻ (vd. `span.en`, không phải `.en`) — từng làm cả trang Tiếng Anh bị in nghiêng.

## Tiến độ

| Lớp | Môn | Nguồn | Trạng thái |
|---|---|---|---|
| 9 | KHTN (Lí/Hoá/Sinh) | `data/thuvienhoclieu.com-SGK-KHTN-Lop-9-thong-nhat-.pdf` — Kết nối tri thức, 230 trang, trang PDF = trang in + 1 | Xong 2026-09-17: 15 chương, 51 bài, 798 công thức |
| 9 | Tiếng Anh | `data/Tiếng Anh 9 Global Success.pdf` — 139 trang, số trang PDF lệch không đều (thiếu trang in 5) → tra theo bảng dưới | Xong 2026-09-18: 4 chủ điểm, 12 Unit, 266 từ vựng, 26 cấu trúc |
| 9 | Toán (2 tập) | `data/thuvienhoclieu.com-SGK-Toan-9-tu-nam-2026-Tap-1.pdf` (122 tr) + `…-Tap-2.pdf` (134 tr) — Kết nối tri thức, cả hai: trang PDF = trang in + 1 | Xong 2026-09-18: 10 chương, 42 bài, 113 công thức, 78 cách giải, 49 hình SVG |
| 9 | Lịch sử và Địa lí | `data/thuvienhoclieu.com-SGK-Lich-Su-Va-Dia-Li-Lop-9-thong-nhat.pdf` — 242 trang; **trang PDF = trang in + 2 đến p164, từ p165 trở đi = trang in + 1 vì PDF THIẾU trang in 163** | Xong 2026-09-18: 12 chương, 45 bài, 214 mốc thời gian, 40 khối số liệu, 99 bảng |

Phân chia KHTN 9 (số trang PDF): Bài 1 (chung, đặt ở tab Hoá) 7–15 · **Vật lí** Chương I–V (Bài 2–17) 16–87 ·
**Hoá học** Chương VI–X (Bài 18–35) 88–159 · **Sinh học** Chương XI–XIV (Bài 36–51) 160–224, thuật ngữ 225–227.

Phân chia Tiếng Anh 9 (số trang PDF; mỗi Unit 10 trang): Book map 4–6 · Chủ điểm 1 *Our Communities*: U1 7–16, U2 17–26,
U3 27–36, Review 1 37–38 · Chủ điểm 2 *Our Heritage*: U4 39–48, U5 49–58, U6 59–68, Review 2 69–70 ·
Chủ điểm 3 *Our World*: U7 71–80, U8 81–90, U9 91–100, Review 3 101–102 · Chủ điểm 4 *Visions of the Future*:
U10 103–112, U11 113–122, U12 123–132, Review 4 133–134 · Glossary 135–138 (bản nét, cắt đôi cột:
`.cache/pages/lop-9/tieng-anh/glossary/p135a.jpg`…`p138b.jpg`).

Phân chia Toán 9 (số trang PDF; ảnh ở `.cache/pages/lop-9/toan-tap-1/`, `toan-tap-2/`):
**Tập 1** — mục lục p005 · Ch I Phương trình và hệ hai phương trình bậc nhất hai ẩn (B1–3) 6–26 ·
Ch II Phương trình và bất phương trình bậc nhất một ẩn (B4–6) 27–44 · Ch III Căn bậc hai và căn bậc ba (B7–10) 45–66 ·
Ch IV Hệ thức lượng trong tam giác vuông (B11–12) 67–83 · Ch V Đường tròn (B13–17) 84–114 ·
HĐ trải nghiệm 115–118 · thuật ngữ 119–122.
**Tập 2** — mục lục p004 · Ch VI Hàm số y = ax² (a ≠ 0). Phương trình bậc hai một ẩn (B18–21) 5–32 ·
Ch VII Tần số và tần số tương đối (B22–24) 33–56 · Ch VIII Xác suất của biến cố trong một số mô hình xác suất đơn giản
(B25–26) 57–67 · Ch IX Đường tròn ngoại tiếp và đường tròn nội tiếp (B27–30) 68–93 · Ch X Một số hình khối trong
thực tiễn (B31–32) 94–111 · HĐ trải nghiệm 112–127 · ôn tập cuối năm 128–130 · thuật ngữ 131–134.

Phân chia Lịch sử và Địa lí 9 (số trang PDF; mục lục p005–p006):
⚠️ Độ lệch trang không đều: p009–p164 = trang in + 2; **trang in 163 không có trong file PDF**; p165–p242 = trang in + 1.
(Trang 163 thuộc Bài 12 Địa lí — phần chăn nuôi, lâm nghiệp, thuỷ sản và đầu mục công nghiệp của vùng
Trung du và miền núi phía Bắc.) Luôn kiểm số trang in ở góc dưới ảnh trước khi giao dải trang cho agent.
**Lịch sử** — Ch1 Thế giới 1918–1945 (B1–4) 9–23 · Ch2 Việt Nam 1918–1945 (B5–8) 24–42 ·
Ch3 Thế giới 1945–1991 (B9–12) 43–62 · Ch4 Việt Nam 1945–1975 (B13–17) 63–94 ·
Ch5 Thế giới từ 1991 (B18–19) 95–102 · Ch6 Việt Nam từ 1976 (B20) 103–112 · Ch7 Cách mạng KH–KT (B21) 113–117.
**Địa lí** — Ch1 Địa lí dân cư (B1–4) 119–130 · Ch2 Địa lí các ngành kinh tế (B5–11) 131–159 ·
Ch3 Địa lí các vùng kinh tế – xã hội (B12–21) 160–222.
**Chủ đề chung** 223–237 (Đô thị; Văn minh châu thổ sông Hồng và sông Cửu Long; Biển Đông).
Thuật ngữ: Lịch sử p237, Địa lí p238 (p239 là bảng phiên âm).
