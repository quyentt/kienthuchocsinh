"""Nhúng các file nội dung (partial) vào trang môn học.

Trong trang HTML, đặt cặp đánh dấu:
    <!-- INCLUDE _parts/khtn-vat-li.html -->
    <!-- /INCLUDE -->
Mỗi lần chạy, mọi thứ giữa hai dấu sẽ được thay bằng nội dung mới nhất của file partial
(đường dẫn tính từ thư mục chứa trang). Chạy lại bao nhiêu lần cũng được.

Cách dùng:
    python tools/build.py
"""
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
PATTERN = re.compile(r"(<!-- INCLUDE (\S+) -->)(.*?)(<!-- /INCLUDE -->)", re.S)


def build_page(page: Path) -> bool:
    text = page.read_text(encoding="utf-8")

    def replace(match):
        source = page.parent / match.group(2)
        if not source.exists():
            print("Chưa có file, bỏ qua:", source.relative_to(ROOT))
            return match.group(0)
        part = source.read_text(encoding="utf-8").strip()
        return f"{match.group(1)}\n{part}\n{match.group(4)}"

    new = PATTERN.sub(replace, text)
    if new != text:
        page.write_text(new, encoding="utf-8", newline="\n")
        return True
    return False


def main():
    for page in sorted(ROOT.glob("lop-*/*.html")):
        if build_page(page):
            print("Đã cập nhật", page.relative_to(ROOT))


if __name__ == "__main__":
    main()
