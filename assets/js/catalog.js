/* Danh mục lớp & môn — SỬA Ở ĐÂY khi thêm lớp/môn mới.
   status: "ready" (đã có trang) | "soon" (chưa làm).
   page: đường dẫn tính từ thư mục lớp (vd. "khtn.html"). */
window.CATALOG = [
  { id: "lop-6",  name: "Lớp 6",  level: "THCS", status: "soon", subjects: [] },
  { id: "lop-7",  name: "Lớp 7",  level: "THCS", status: "soon", subjects: [] },
  { id: "lop-8",  name: "Lớp 8",  level: "THCS", status: "soon", subjects: [] },
  {
    id: "lop-9", name: "Lớp 9", level: "THCS", status: "ready",
    subjects: [
      { id: "khtn", name: "Khoa học tự nhiên", icon: "🔬", color: "#2b8a3e",
        desc: "Vật lí · Hoá học · Sinh học", status: "ready", page: "khtn.html" },
      { id: "toan", name: "Toán", icon: "∑", color: "#2563eb", desc: "Đại số · Hình học", status: "soon" },
      { id: "ngu-van", name: "Ngữ văn", icon: "📖", color: "#b7791f", desc: "", status: "soon" },
      { id: "tieng-anh", name: "Tiếng Anh", icon: "🔤", color: "#7c3aed", desc: "", status: "soon" },
      { id: "lich-su-dia-li", name: "Lịch sử và Địa lí", icon: "🌏", color: "#c05621", desc: "", status: "soon" },
      { id: "gdcd", name: "Giáo dục công dân", icon: "🤝", color: "#c53030", desc: "", status: "soon" },
      { id: "tin-hoc", name: "Tin học", icon: "💻", color: "#0e7490", desc: "", status: "soon" },
      { id: "cong-nghe", name: "Công nghệ", icon: "🛠️", color: "#4a5568", desc: "", status: "soon" }
    ]
  },
  { id: "lop-10", name: "Lớp 10", level: "THPT", status: "soon", subjects: [] },
  { id: "lop-11", name: "Lớp 11", level: "THPT", status: "soon", subjects: [] },
  { id: "lop-12", name: "Lớp 12", level: "THPT", status: "soon", subjects: [] }
];
