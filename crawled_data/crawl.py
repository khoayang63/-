import os

from selenium import webdriver
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import json
import requests

print("🚀 Mở trình duyệt...")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))

os.makedirs("images", exist_ok=True)

all_data = []

for page_id in range(1, 20):
    url = f"https://mfigure.vn/gameprize-figure?q=collections:3102433&page={page_id}&view=grid"
    
    print(f"\n🌐 ===== Trang {page_id} =====")
    
    driver.get(url)

    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".product-grid-item-lm"))
    )

    for _ in range(3):
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)

    products = driver.find_elements(By.CSS_SELECTOR, ".product-grid-item-lm")

    print(f"📦 Tìm thấy {len(products)} sản phẩm trong trang {page_id}")

    page_count = 0  # 🔥 đếm theo trang

    for i, p in enumerate(products, 1):
        try:
            img_tag = p.find_element(By.CSS_SELECTOR, "img")

            img = img_tag.get_attribute("data-src") or img_tag.get_attribute("src")

            if img and img.startswith("//"):
                img = "https:" + img

            if img and "base64" in img:
                img = None

            # 🔥 DOWNLOAD ẢNH
            img_path = None
            if img:
                try:
                    img_name = f"product_{page_id}_{i}.jpg"
                    img_path = os.path.join("images", img_name)

                    response = requests.get(img, timeout=10)

                    with open(img_path, "wb") as f:
                        f.write(response.content)

                except Exception as e:
                    print("⚠️ Lỗi tải ảnh:", e)

            name = p.find_element(By.CSS_SELECTOR, "a.modal-open").get_attribute("title")
            price = p.find_element(By.CSS_SELECTOR, ".special-price").text

            try:
                old_price = p.find_element(By.CSS_SELECTOR, ".old-price").text
            except:
                old_price = None

            try:
                discount = p.find_element(By.CSS_SELECTOR, ".sale-label span").text
            except:
                discount = None

            all_data.append({
                "name": name,
                "price": price,
                "old_price": old_price,
                "discount": discount,
                "image": img_path
            })

            page_count += 1

            # 🔥 log từng sản phẩm (tuỳ chọn)
            print(f"   ✅ [{page_id}-{i}] {name[:40]}...")

        except Exception as e:
            print("❌ Lỗi:", e)

    # 🔥 log tổng trang
    print(f"📊 Trang {page_id} crawl được: {page_count} sản phẩm")
    print(f"📈 Tổng hiện tại: {len(all_data)} sản phẩm")

    time.sleep(2)  # tránh bị chặn

# ✅ Ghi file
with open("data.json", "w", encoding="utf-8") as f:
    json.dump(all_data, f, ensure_ascii=False, indent=4)

print("\n💾 Đã lưu tất cả dữ liệu")
print(f"🎯 Tổng sản phẩm cuối: {len(all_data)}")

driver.quit()