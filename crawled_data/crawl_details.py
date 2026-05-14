import os
import time
import requests
import re
import unicodedata
import random
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def setup_driver():
    print("Khởi động Chrome...")
    chrome_options = Options()
    # chrome_options.add_argument("--headless")
    chrome_options.add_argument("--window-size=1920,1080")
    driver = webdriver.Chrome(options=chrome_options)
    return driver

def slugify(text):
    text = text.lower()
    text = unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def crawl_product_details(driver, product_url, slug):
    """ Hàm cào ảnh và description của 1 sản phẩm """
    driver.get(product_url)
    
    # Đợi trang tải xong phần nội dung
    try:
        WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.CSS_SELECTOR, "h1")))
    except:
        time.sleep(2)
        
    html = driver.page_source
    soup = BeautifulSoup(html, 'html.parser')
    
    # ==========================================
    # 1. CÀO ẢNH VÀ LƯU VÀO FOLDER
    # ==========================================
    image_dir = "./figure_images"
    os.makedirs(image_dir, exist_ok=True)
    
    image_sql_list = []
    swiper_wrapper = soup.find('div', class_='swiper-wrapper')
    
    if swiper_wrapper:
        img_tags = swiper_wrapper.find_all('img')
        for idx, img in enumerate(img_tags):
            img_url = img.get('data-img') or img.get('src')
            if not img_url: continue
                
            if img_url.startswith('//'):
                img_url = 'https:' + img_url
                
            # Lưu thẳng đường dẫn ảnh gốc vào file SQL
            sql = f"INSERT INTO public.figure_images (figure_id, image_url) VALUES ((SELECT id FROM public.figures WHERE slug = '{slug}'), '{img_url}');\n"
            image_sql_list.append(sql)

    # ==========================================
    # 2. CÀO DESCRIPTION (LOẠI BỎ ẢNH)
    # ==========================================
    update_desc_sql = ""
    rte_div = soup.find('div', class_='position-relative rte')
    
    if rte_div:
        for img in rte_div.find_all('img'):
            img.decompose()
            
        description_html = "".join([str(tag) for tag in rte_div.contents])
        description_html = description_html.replace("'", "''").strip()
        
        update_desc_sql = f"UPDATE public.figures SET description = '{description_html}' WHERE slug = '{slug}';\n"
        
    return update_desc_sql, image_sql_list

def main():
    driver = setup_driver()
    
    # Reset file SQL mới tinh
    with open("crawled_details.sql", "w", encoding="utf-8") as f:
        f.write("-- SCRIPT CẬP NHẬT DESCRIPTION VÀ TẢI ẢNH HÀNG LOẠT\n\n")

    try:
        # BƯỚC 1: Vào trang chủ lấy danh sách Series
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
        
        # BƯỚC 2: Vào từng trang Series và lặp từng trang pagination
        for series in series_links:
            print(f"---------------------------------------------------")
            print(f"🚀 ĐANG CÀO ẢNH VÀ MÔ TẢ SERIES: {series['name']}")
            
            driver.get(series['url'])
            time.sleep(3)
            
            current_page = 1
            while True:
                print(f">> Đang xử lý Trang {current_page} của {series['name']}...")
                
                # Cuộn trang để script lazyload hiển thị sản phẩm
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
                time.sleep(1)
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight - 500);")
                time.sleep(2)
                
                # Tìm thẻ chứa link sản phẩm
                product_cards = driver.find_elements(By.CSS_SELECTOR, ".product-name a")
                if not product_cards:
                    product_cards = driver.find_elements(By.CSS_SELECTOR, "h3.product-title a, .product-item a, .image_thumb")
                
                # Lọc URL trùng lặp
                product_urls = [card.get_attribute("href") for card in product_cards if card.get_attribute("href")]
                product_urls = list(dict.fromkeys(product_urls))
                
                print(f"   -> Tìm thấy {len(product_urls)} sản phẩm trên trang này.")
                
                # BƯỚC 3: Mở từng tab sản phẩm để cào ảnh và mô tả
                main_window = driver.current_window_handle
                for p_url in product_urls:
                    try:
                        # TẠM DỪNG TỪ 2 - 4 GIÂY ĐỂ TRÁNH BỊ CHẶN (RATE LIMIT)
                        time.sleep(random.uniform(1.0, 1.5))
                        
                        # Mẹo: Lấy trực tiếp slug từ URL vì trang web này để slug ở cuối link
                        slug = p_url.split("/")[-1]
                        
                        # Mở tab mới
                        driver.execute_script("window.open(arguments[0]);", p_url)
                        driver.switch_to.window(driver.window_handles[-1])
                        
                        # Chạy hàm cào chi tiết
                        update_sql, img_sqls = crawl_product_details(driver, p_url, slug)
                        
                        # Ghi vào file ngay lập tức để tránh mất dữ liệu nếu sập giữa chừng
                        with open("crawled_details.sql", "a", encoding="utf-8") as f:
                            if update_sql:
                                f.write(update_sql)
                            for sql in img_sqls:
                                f.write(sql)
                                
                        print(f"      + Hoàn tất tải ảnh và mô tả: {slug[:30]}...")
                        
                    except Exception as e:
                        print(f"      ! Lỗi sản phẩm ({p_url}): {e}")
                    finally:
                        # Đóng tab, quay lại tab chính
                        driver.close()
                        driver.switch_to.window(main_window)
                
                # BƯỚC 4: Chuyển trang
                next_page_num = current_page + 1
                try:
                    selector = f"a.page-link[onclick*='doSearch({next_page_num})']"
                    next_page_btn = driver.find_element(By.CSS_SELECTOR, selector)
                    
                    print(f"   -> Đang chuyển sang trang {next_page_num}...")
                    driver.execute_script(f"doSearch({next_page_num})")
                    time.sleep(3) 
                    current_page = next_page_num
                except Exception:
                    print(f"   -> Đã cào HẾT series {series['name']}!")
                    break 
                    
    except Exception as e:
        print(f"❌ Lỗi toàn cục: {e}")
    finally:
        driver.quit()
        print("\n🎉 Hoàn tất! Dữ liệu nằm trong crawled_details.sql và ảnh nằm trong thư mục ./figure_images")

if __name__ == "__main__":
    main()
