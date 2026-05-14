import time
import sys
import re
import unicodedata
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Fix lỗi in tiếng Việt trên Windows CMD
# if sys.platform == 'win32':
#     sys.stdout.reconfigure(encoding='utf-8')

def slugify(text):
    text = text.lower()
    text = unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def crawl_products_by_series():
    print("Khởi động Chrome...")
    options = Options()
    options.add_argument("--window-size=1920,1080")
    driver = webdriver.Chrome(options=options)
    
    # Tạo/Xóa file cũ để ghi mới
    with open("crawled_figures.sql", "w", encoding="utf-8") as f:
        f.write("-- SCRIPT TỰ ĐỘNG MAP ID BẰNG SUBQUERY\n")
        f.write("-- Chạy đoạn này vào Supabase sau khi đã chạy Insert Brand, Category, Series\n\n")

    try:
        # =================================================================
        # BƯỚC 1: VÀO TRANG CHỦ LẤY DANH SÁCH LINK CỦA TỪNG SERIES
        # =================================================================
        homepage_url = "https://mfigure.vn/"
        print(f"Đang truy cập: {homepage_url}")
        driver.get(homepage_url)
        time.sleep(3)
        
        series_elements = driver.find_elements(By.CSS_SELECTOR, "div.b_item.mobi_cate a.item_cate")
        series_links = []
        for el in series_elements:
            href = el.get_attribute("href")
            title = el.get_attribute("title")
            if not title:
                title = el.find_element(By.CSS_SELECTOR, "span.tit").text
            slug = href.split("/")[-1]
            if href and slug:
                series_links.append({"name": title.strip(), "slug": slug, "url": href})
                
        print(f"\n✅ Tìm thấy {len(series_links)} series. Bắt đầu đi vào từng series...\n")
        
        # =================================================================
        # BƯỚC 2: VÀO TỪNG TRANG SERIES VÀ CHUYỂN TRANG
        # =================================================================
        for series in series_links:
            print(f"---------------------------------------------------")
            print(f"🚀 ĐANG CÀO SERIES: {series['name']} ({series['url']})")
            
            driver.get(series['url'])
            time.sleep(3)
            
            current_page = 1
            while True:
                print(f">> Đang xử lý Trang {current_page} của {series['name']}...")
                
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
                time.sleep(1)
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight - 500);")
                time.sleep(2)
                
                # --- CODE CÀO THÔNG TIN CHI TIẾT SẢN PHẨM ---
                # Tìm các link sản phẩm trên trang (class phổ biến của Sapo/Bizweb)
                product_cards = driver.find_elements(By.CSS_SELECTOR, ".product-name a")
                if not product_cards:
                    product_cards = driver.find_elements(By.CSS_SELECTOR, "h3.product-title a, .product-item a, .image_thumb")
                
                # Lấy URL và lọc trùng
                product_urls = [card.get_attribute("href") for card in product_cards if card.get_attribute("href")]
                product_urls = list(dict.fromkeys(product_urls))
                
                print(f"   -> Tìm thấy {len(product_urls)} sản phẩm trên trang này.")
                
                main_window = driver.current_window_handle
                for p_url in product_urls:
                    try:
                        # Giảm thời gian truy cập lấy random từ 0.5 - 1.0s để đỡ bị rate-limit
                        time.sleep(random.uniform(1.5, 2.0))
                        
                        # Mở tab mới để cào chi tiết (nhằm không làm mất trạng thái phân trang)
                        driver.execute_script("window.open(arguments[0]);", p_url)
                        driver.switch_to.window(driver.window_handles[-1])
                        
                        # Đợi load (tìm h1 để đảm bảo đã vào trang chi tiết)
                        WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.CSS_SELECTOR, "h1")))
                        
                        # 1. Tên
                        try: 
                            name_el = driver.find_element(By.CSS_SELECTOR, "h1.product-name, h1.title-product")
                            raw_name = name_el.text.strip()
                            
                            # Cắt bỏ phần [Pre Order] ở đầu nếu có
                            clean_name = re.sub(r'^\[.*?\]\s*', '', raw_name)
                            
                            # Lấy từ đầu cho đến trước tên hãng (loại bỏ phần "(Hãng)..." ở cuối)
                            if '(' in clean_name:
                                clean_name = clean_name.rsplit('(', 1)[0].strip()
                                
                            name = clean_name.replace("'", "''") # Encode nháy đơn cho SQL
                        except: name = "Unknown"
                        
                        # 2. Slug
                        try: slug = driver.find_element(By.CSS_SELECTOR, "input[name='productAlias']").get_attribute("value")
                        except: slug = slugify(name)
                        
                        # 3. Giá
                        try: 
                            price_txt = driver.find_element(By.CSS_SELECTOR, "span.special-price").text
                            price = int(re.sub(r'[^\d]', '', price_txt))
                        except: price = 0
                            
                        # 4. Giá gốc
                        try:
                            old_price_txt = driver.find_element(By.CSS_SELECTOR, "del.old-price").text
                            old_price = int(re.sub(r'[^\d]', '', old_price_txt))
                        except: old_price = "NULL"
                        
                        # 5. Brand (MAPPING ID BẰNG SUBQUERY SQL)
                        try:
                            brand_txt = driver.find_element(By.CSS_SELECTOR, "span#vendor").text
                            brand_slug = slugify(brand_txt)
                            brand_val = f"(SELECT id FROM public.brands WHERE slug = '{brand_slug}')"
                        except: brand_val = "NULL"
                            
                        # 6. Category (MAPPING ID BẰNG SUBQUERY SQL)
                        try:
                            cat_txt = driver.find_element(By.CSS_SELECTOR, "span#type").text
                            cat_slug = slugify(cat_txt)
                            cat_val = f"(SELECT id FROM public.categories WHERE slug = '{cat_slug}')"
                        except: cat_val = "NULL"
                            
                        # 7. Status (pre_order / in_stock)
                        try:
                            btn_txt = driver.find_element(By.CSS_SELECTOR, ".product-action_buynow").text
                            if "Đặt trước" in btn_txt:
                                status = "pre_order"
                            else:
                                status = "in_stock"
                        except: status = "in_stock"
                            
                        # 8. Series (MAPPING ID TỪ BƯỚC 1)
                        series_val = f"(SELECT id FROM public.series WHERE slug = '{series['slug']}')"
                        
                        # TẠO CÂU LỆNH INSERT VÀ GHI VÀO FILE TEXT
                        sql = f"INSERT INTO public.figures (name, slug, price, old_price, brand_id, category_id, series_id, status) " \
                              f"VALUES ('{name}', '{slug}', {price}, {old_price}, {brand_val}, {cat_val}, {series_val}, '{status}');\n"
                              
                        with open("crawled_figures.sql", "a", encoding="utf-8") as f:
                            f.write(sql)
                            
                        print(f"      + Đã cào và tạo SQL: {name[:40]}...")
                        
                    except Exception as e:
                        print(f"      ! Lỗi cào sản phẩm ({p_url}): {e}")
                    finally:
                        # Bắt buộc đóng tab và quay về tab danh sách
                        driver.close()
                        driver.switch_to.window(main_window)
                
                # --- KẾT THÚC CÀO CHI TIẾT TRANG HIỆN TẠI ---
                
                # BƯỚC 3: TÌM VÀ CLICK NÚT CHUYỂN TRANG
                next_page_num = current_page + 1
                try:
                    selector = f"a.page-link[onclick*='doSearch({next_page_num})']"
                    next_page_btn = driver.find_element(By.CSS_SELECTOR, selector)
                    
                    print(f"   -> Đang chuyển sang trang {next_page_num}...")
                    driver.execute_script(f"doSearch({next_page_num})")
                    time.sleep(3) 
                    current_page = next_page_num
                except Exception as e:
                    print(f"   -> Đã cào HẾT series {series['name']}!")
                    break 
                    
    except Exception as e:
        print(f"❌ Lỗi toàn cục: {e}")
    finally:
        driver.quit()
        print("\n🎉 Hoàn tất! Dữ liệu đã được lưu thành công tại file: crawled_figures.sql")

if __name__ == "__main__":
    crawl_products_by_series()
