import json
import csv
import re

# Đọc data.json
with open('../public/data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Danh sách brand và category
brands = {
    "Bandai Spirits": "Bandai Spirits",
    "Bandai": "Bandai",
    "Taito": "Taito",
    "Good Smile": "Good Smile Company",
    "Nendoroid": "Good Smile Company",
    "Takara Tomy": "Takara Tomy",
    "Konami": "Konami arcade games",
    "Banpresto": "Banpresto",
}

categories = ["Action Figure", "Nendoroid", "Scale Figure", "Plush"]

# Hàm trích xuất giá trị số từ chuỗi giá
def parse_price(price_str):
    if not price_str:
        return 0
    # Loại bỏ ₫ và khoảng trắng, giữ lại số
    price = re.sub(r'[^\d]', '', price_str)
    return int(price) if price else 0

# Hàm tìm brand từ tên sản phẩm
def find_brand(name):
    for keyword, brand in brands.items():
        if keyword in name:
            return brand
    return "Bandai Spirits"  # Default brand

# Hàm tìm category từ tên sản phẩm
def find_category(name):
    if "Nendoroid" in name:
        return "Nendoroid"
    elif "Scale" in name or "Desktop" in name:
        return "Scale Figure"
    elif "Plush" in name:
        return "Plush"
    else:
        return "Action Figure"  # Default category

# Xử lý dữ liệu
processed_data = []
for idx, item in enumerate(data, 1):
    processed_item = {
        'id': idx,
        'name': item.get('name', ''),
        'price': parse_price(item.get('price', '0')),
        'old_price': parse_price(item.get('old_price', '0')),
        'discount': item.get('discount', ''),
        'brand': find_brand(item.get('name', '')),
        'category': find_category(item.get('name', '')),
        'image': item.get('image', ''),
    }
    processed_data.append(processed_item)

# Ghi vào CSV
csv_path = './figure.csv'
with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['id', 'name', 'price', 'old_price', 'discount', 'brand', 'category', 'image'])
    writer.writeheader()
    writer.writerows(processed_data)

print(f"✅ Đã tạo file figure.csv với {len(processed_data)} sản phẩm")
print(f"📁 Đường dẫn: {csv_path}")