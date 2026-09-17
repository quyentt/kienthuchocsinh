"""Chuyển từng trang PDF SGK thành ảnh JPEG để đọc (SGK thường là bản scan, không trích được chữ).

Cách dùng:
    python tools/render_pdf.py <file.pdf> <thu_muc_ra> [dpi]

Ví dụ:
    python tools/render_pdf.py "data/thuvienhoclieu.com-SGK-KHTN-Lop-9-thong-nhat-.pdf" .cache/pages/lop-9/khtn

Ảnh ra: p001.jpg, p002.jpg, ... (số thứ tự = số trang PDF, KHÔNG phải số trang in trên sách).
Cần: pip install pymupdf
"""
import sys
from pathlib import Path

import pymupdf


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    pdf, out = Path(sys.argv[1]), Path(sys.argv[2])
    dpi = int(sys.argv[3]) if len(sys.argv) > 3 else 110
    out.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(pdf)
    for i, page in enumerate(doc, start=1):
        target = out / f"p{i:03d}.jpg"
        if not target.exists():
            page.get_pixmap(dpi=dpi).save(target, jpg_quality=80)
    print(f"{doc.page_count} trang -> {out}")


if __name__ == "__main__":
    main()
