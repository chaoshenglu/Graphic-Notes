import os, re, base64
from bs4 import BeautifulSoup



# STEP 1: 读取 HTML
with open("product.html", "r", encoding="utf-8") as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

# 只查找具有特定class的img标签
img_tags = soup.find_all('img', class_='descV8-singleImage-image lazyload')

# 创建本地图片文件夹
if not os.path.exists('images'):
    os.makedirs('images')

# STEP 2: 提取 base64 并保存到本地文件夹
for idx, tag in enumerate(img_tags):
    src = tag.get("src")
    if src and src.startswith("data:image/"):
        match = re.match(r"data:image/(\w+);base64,(.*)", src)
        if not match:
            continue
        ext, b64_data = match.groups()
        img_bytes = base64.b64decode(b64_data)

        # 生成本地文件名并保存
        filename = f"img_{idx}.{ext}"
        filepath = os.path.join('images', filename)
        with open(filepath, 'wb') as f:
            f.write(img_bytes)
        print(f"已保存图片: {filepath}")
        


# STEP 3: 注释掉HTML替换代码
# html_str = str(soup)
# for old_src, new_url in image_map.items():
#     html_str = html_str.replace(old_src, new_url)

# STEP 4: 注释掉HTML输出代码
# with open("product_clean.html", "w", encoding="utf-8") as f:
#     f.write(html_str)

print(f"✅ 已完成图片提取，共找到 {len(img_tags)} 个符合条件的图片，保存在 images 文件夹中")
