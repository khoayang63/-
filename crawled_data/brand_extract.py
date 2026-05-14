import re
import os

# Đường dẫn tới các file
base_dir = os.path.dirname(os.path.abspath(__file__))
sql_file = os.path.join(base_dir, "crawled_figures.sql")
output_file = os.path.join(base_dir, "insert_brands.sql")

brands = set()

print("Đang đọc file crawled_figures.sql...")

try:
    with open(sql_file, 'r', encoding='utf-8') as f:
        for line in f:
            # Dùng Regex để tìm chuỗi: public.brands WHERE slug = 'ten-cua-brand'
            match = re.search(r"public\.brands WHERE slug = '([^']+)'", line)
            if match:
                brands.add(match.group(1))

    # Ghi ra file SQL mới
    with open(output_file, 'w', encoding='utf-8') as out:
        out.write("-- File này chứa lệnh tự động thêm các Brand nếu chưa tồn tại trong CSDL\n\n")
        
        for slug in sorted(brands):
            # Biến slug 'good-smile-company' thành 'Good Smile Company' cho đẹp
            name = " ".join(word.capitalize() for word in slug.split("-"))
            
            # Câu lệnh thêm ON CONFLICT (slug) DO NOTHING
            sql = f"INSERT INTO public.brands (name, slug) VALUES ('{name}', '{slug}') ON CONFLICT (slug) DO NOTHING;\n"
            out.write(sql)

    print(f"✅ Đã trích xuất thành công {len(brands)} brands độc nhất.")
    print(f"✅ Đã tạo file chứa câu lệnh SQL tại: {output_file}")
    print("Bạn có thể copy nội dung file này chạy vào Supabase hoặc dùng lệnh import.")

except FileNotFoundError:
    print(f"❌ Lỗi: Không tìm thấy file {sql_file}")
except Exception as e:
    print(f"❌ Có lỗi xảy ra: {e}")
