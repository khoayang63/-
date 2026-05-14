from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import re
import unicodedata

def slugify(text):
    """Hàm tạo đường dẫn slug từ tên (hỗ trợ xóa dấu Tiếng Việt)"""
    text = text.lower()
    text = unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def crawl_categories_selenium(url):
    print("Khởi động Chrome...")
    options = Options()
    # options.add_argument("--headless") # Bỏ comment dòng này nếu bạn muốn chạy ngầm
    options.add_argument("--window-size=1920,1080")
    
    # Khởi tạo WebDriver
    driver = webdriver.Chrome(options=options)
    
    try:
        print(f"Đang truy cập: {url}")
        driver.get(url)
        
        # Chờ phần tử ul.filter-type xuất hiện (khác với ul.filter-vendor của brand)
        print("Đang chờ tải danh sách danh mục (loại sản phẩm)...")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "ul.filter-type"))
        )
        time.sleep(2)
        
        # Tìm danh sách các thẻ label trong ul.filter-type
        elements = driver.find_elements(By.CSS_SELECTOR, "ul.filter-type label")
        
        categories = []
        for element in elements:
            category_name = None
            
            try:
                # Tìm thẻ input bên trong (dựa vào ảnh: data-field='product_type')
                input_tag = element.find_element(By.CSS_SELECTOR, "input[data-field='product_type']")
                category_name = input_tag.get_attribute("data-text")
            except:
                # Nếu không có thẻ input, lấy text của thẻ label
                category_name = element.text
                
            if category_name:
                category_name = category_name.strip()
                if category_name != "":
                    category_slug = slugify(category_name)
                    
                    # Kiểm tra trùng lặp
                    if not any(c['slug'] == category_slug for c in categories):
                        categories.append({
                            "name": category_name,
                            "slug": category_slug
                        })
        
        print(f"Đã tìm thấy {len(categories)} danh mục!\n")
        
        if len(categories) > 0:
            print("--- COPY ĐOẠN LỆNH SAU DÁN VÀO SQL EDITOR TRÊN SUPABASE ---")
            for cat in categories:
                # Xử lý escape dấu nháy đơn
                safe_name = cat['name'].replace("'", "''")
                # Insert vào bảng categories
                print(f"INSERT INTO public.categories (name, slug) VALUES ('{safe_name}', '{cat['slug']}');")
                
    except Exception as e:
        print(f"Có lỗi xảy ra: {e}")
    finally:
        print("Hoàn tất. Đóng trình duyệt.")
        driver.quit()

if __name__ == "__main__":
    TARGET_URL = "https://mfigure.vn/collections/all?q=&page=1&view=grid"
    crawl_categories_selenium(TARGET_URL)
