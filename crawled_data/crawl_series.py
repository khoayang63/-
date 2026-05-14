import os
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import re
import unicodedata

def slugify(text):
    text = text.lower()
    text = unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def crawl_series_selenium(url):
    print("Khởi động Chrome...")
    options = Options()
    # options.add_argument("--headless")
    options.add_argument("--window-size=1920,1080")
    
    # Tạo thư mục lưu ảnh nếu chưa có
    save_dir = "series_images"
    os.makedirs(save_dir, exist_ok=True)
    print(f"Đã tạo/kiểm tra thư mục lưu ảnh: {save_dir}/")
    
    driver = webdriver.Chrome(options=options)
    
    try:
        print(f"Đang truy cập: {url}")
        driver.get(url)
        
        # Đợi một chút để trang load JS
        time.sleep(3)
        
        # Cuộn trang xuống một chút để kích hoạt lazy load ảnh (do ảnh dùng data-src)
        driver.execute_script("window.scrollTo(0, 500);")
        time.sleep(1)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
        time.sleep(2)
        
        # Chỉ lấy các thẻ <a> class="item_cate" nằm trong khối SERIES NỔI BẬT
        elements = driver.find_elements(By.CSS_SELECTOR, "div.b_item.mobi_cate a.item_cate")
        
        series_list = []
        for element in elements:
            try:
                # 1. Lấy tên series từ thuộc tính title hoặc text của thẻ span.tit
                series_name = element.get_attribute("title")
                if not series_name:
                    tit_span = element.find_element(By.CSS_SELECTOR, "span.tit")
                    series_name = tit_span.text
                    
                # 2. Lấy URL ảnh (ưu tiên data-src vì nó chứa ảnh gốc cho lazy load)
                img_tag = element.find_element(By.CSS_SELECTOR, "img")
                img_url = img_tag.get_attribute("data-src")
                if not img_url:
                    img_url = img_tag.get_attribute("src")
                    
                if series_name and img_url:
                    series_name = series_name.strip()
                    series_slug = slugify(series_name)
                    
                    # Fix lỗi URL ảnh bắt đầu bằng //
                    if img_url.startswith("//"):
                        img_url = "https:" + img_url
                        
                    # 3. Tải ảnh về thư mục
                    print(f"Đang tải ảnh cho series: {series_name}...")
                    
                    # Lấy đuôi ảnh (jpg, png, webp...) từ URL
                    clean_img_url = img_url.split("?")[0] # Bỏ phần params ?v=123...
                    ext = clean_img_url.split(".")[-1]
                    if ext.lower() not in ["jpg", "jpeg", "png", "webp", "gif"]:
                        ext = "jpg" # Mặc định
                        
                    img_filename = f"{series_slug}.{ext}"
                    img_path = os.path.join(save_dir, img_filename)
                    
                    # Dùng requests để tải ảnh
                    try:
                        img_response = requests.get(img_url, timeout=10)
                        if img_response.status_code == 200:
                            with open(img_path, "wb") as f:
                                f.write(img_response.content)
                        else:
                            print(f"   -> Lỗi tải ảnh: HTTP {img_response.status_code}")
                            img_path = None
                    except Exception as e:
                        print(f"   -> Lỗi khi tải ảnh: {e}")
                        img_path = None
                    
                    # Thêm vào mảng nếu chưa có
                    if not any(s['slug'] == series_slug for s in series_list):
                        series_list.append({
                            "name": series_name,
                            "slug": series_slug,
                            "image_url": img_filename # Chỉ lưu tên file vào DB, trên web tự map đường dẫn
                        })
                        
            except Exception as e:
                print(f"Lỗi khi xử lý 1 item (có thể không phải là series): {e}")
                continue
                
        print(f"\n✅ Đã tìm thấy và tải xong ảnh cho {len(series_list)} series!\n")
        
        if len(series_list) > 0:
            print("--- COPY ĐOẠN LỆNH SAU DÁN VÀO SQL EDITOR TRÊN SUPABASE ---")
            for series in series_list:
                safe_name = series['name'].replace("'", "''")
                # Nếu tải ảnh thành công thì lưu tên ảnh, không thì NULL
                img_val = f"'{series['image_url']}'" if series['image_url'] else "NULL"
                # Đánh dấu is_featured = true luôn vì lấy từ mục nổi bật
                print(f"INSERT INTO public.series (name, slug, image_url, is_featured) VALUES ('{safe_name}', '{series['slug']}', {img_val}, true);")
                
    except Exception as e:
        print(f"Có lỗi xảy ra: {e}")
    finally:
        print("Hoàn tất. Đóng trình duyệt.")
        driver.quit()

if __name__ == "__main__":
    TARGET_URL = "https://mfigure.vn/" # Chú ý: Các thẻ <a class="item_cate"> thường nằm ở trang chủ
    crawl_series_selenium(TARGET_URL)
