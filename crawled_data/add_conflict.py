import os

# Đường dẫn tới file SQL
base_dir = os.path.dirname(os.path.abspath(__file__))
sql_file = os.path.join(base_dir, "crawled_figures.sql")

print(f"Đang xử lý file: {sql_file}")

try:
    with open(sql_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    count = 0
    for line in lines:
        # Nếu dòng là câu lệnh INSERT và chưa có dòng ON CONFLICT
        if line.startswith("INSERT INTO public.figures") and "ON CONFLICT" not in line:
            # Tìm chỗ kết thúc ); và thay thế
            if line.strip().endswith(");"):
                line = line.rstrip()[:-2] + ") ON CONFLICT (slug) DO NOTHING;\n"
                count += 1
        new_lines.append(line)

    # Ghi đè lại file cũ
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    print(f"✅ Thành công! Đã thêm ON CONFLICT cho {count} dòng lệnh INSERT.")

except Exception as e:
    print(f"❌ Lỗi: {e}")
