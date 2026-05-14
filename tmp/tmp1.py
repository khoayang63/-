import pandas as pd
import re


df = pd.read_csv("./figure.csv", encoding='utf-8')


# Chuyển discount thành integer (bỏ "- " và "%")
df['discount'] = df['discount'].str.extract('(\d+)')[0].astype(int)

# Ghi đè lại vào file
df.to_csv("./figure.csv", index=False, encoding='utf-8')

print("✅ Đã xóa cột id, chuyển discount thành integer và ghi đè vào figure.csv")
print(df.head())