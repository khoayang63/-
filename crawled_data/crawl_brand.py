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

def crawl_brands_selenium(url):
    print("Khởi động Chrome...")
    options = Options()
    # options.add_argument("--headless") # Bỏ comment dòng này nếu bạn muốn chạy ngầm (không mở cửa sổ Chrome)
    options.add_argument("--window-size=1920,1080")
    
    # Khởi tạo WebDriver
    driver = webdriver.Chrome(options=options)
    
    try:
        print(f"Đang truy cập: {url}")
        driver.get(url)
        
        # Chờ tối đa 10s cho đến khi khung chứa các hãng (ul.filter-vendor) xuất hiện
        print("Đang chờ tải danh sách thương hiệu...")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "ul.filter-vendor"))
        )
        # Nghỉ thêm 2s cho chắc chắn JS render xong toàn bộ các hãng
        time.sleep(2)
        
        # Lấy tất cả các thẻ input (hoặc label) chứa thông tin thương hiệu
        elements = driver.find_elements(By.CSS_SELECTOR, "ul.filter-vendor label")
        
        brands = []
        for element in elements:
            brand_name = None
            
            # Cố gắng lấy từ thẻ input bên trong (như hình 1)
            try:
                input_tag = element.find_element(By.CSS_SELECTOR, "input[data-field='vendor']")
                brand_name = input_tag.get_attribute("data-text")
            except:
                # Nếu không có input, lấy luôn text hiển thị của thẻ label (như hình 2)
                brand_name = element.text
                
            if brand_name:
                brand_name = brand_name.strip() # Cắt bỏ khoảng trắng thừa ở 2 đầu
                if brand_name != "":
                    brand_slug = slugify(brand_name)
                    
                    # Kiểm tra trùng lặp trước khi thêm
                    if not any(b['slug'] == brand_slug for b in brands):
                        brands.append({
                            "name": brand_name,
                            "slug": brand_slug
                        })
        
        print(f"Đã tìm thấy {len(brands)} thương hiệu!\n")
        
        if len(brands) > 0:
            print("--- COPY ĐOẠN LỆNH SAU DÁN VÀO SQL EDITOR TRÊN SUPABASE ---")
            for brand in brands:
                # Xử lý escape dấu nháy đơn trong tên hãng (vd: Hãng 'A' -> Hãng ''A'')
                safe_name = brand['name'].replace("'", "''")
                print(f"INSERT INTO public.brands (name, slug) VALUES ('{safe_name}', '{brand['slug']}');")
                
    except Exception as e:
        print(f"Có lỗi xảy ra: {e}")
    finally:
        print("Hoàn tất. Đóng trình duyệt.")
        driver.quit()

if __name__ == "__main__":
    TARGET_URL = "https://mfigure.vn/collections/all?q=&page=1&view=grid"
    crawl_brands_selenium(TARGET_URL)
