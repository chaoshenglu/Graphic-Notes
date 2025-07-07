import re
import requests
import os
import json
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

def extract_image_urls_from_html(html_file_path):
    """从HTML文件中提取所有图片链接，排除高度小于5px的图片"""
    with open(html_file_path, 'r', encoding='utf-8') as file:
        html_content = file.read()
    
    # 使用BeautifulSoup解析HTML
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # 查找所有img标签
    img_tags = soup.find_all('img')
    
    image_urls = []
    filtered_count = 0
    
    for img in img_tags:
        src = img.get('src')
        if not src:
            continue
            
        # 检查图片高度，排除小于5px的图片
        height = get_image_height(img)
        if height is not None and height < 5:
            filtered_count += 1
            print(f"已过滤高度为 {height}px 的图片: {src}")
            continue
            
        # 处理相对URL，转换为绝对URL
        if src.startswith('//'):
            src = 'https:' + src
        elif src.startswith('/'):
            src = 'https://img.alicdn.com' + src
        image_urls.append(src)
    
    if filtered_count > 0:
        print(f"\n共过滤掉 {filtered_count} 张高度小于5px的图片")
    
    return image_urls

def get_image_height(img_tag):
    """从img标签中提取图片高度"""
    # 首先检查height属性
    height_attr = img_tag.get('height')
    if height_attr:
        try:
            return float(re.sub(r'[^0-9.]', '', str(height_attr)))
        except (ValueError, TypeError):
            pass
    
    # 检查style属性中的height
    style = img_tag.get('style', '')
    if style:
        # 匹配height: XXXpx格式
        height_match = re.search(r'height\s*:\s*([0-9.]+)px', style, re.IGNORECASE)
        if height_match:
            try:
                return float(height_match.group(1))
            except (ValueError, TypeError):
                pass
    
    # 如果都没有找到，返回None表示无法确定高度
    return None

def download_images(image_urls, download_dir):
    """下载图片到指定目录"""
    # 确保下载目录存在
    os.makedirs(download_dir, exist_ok=True)
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    downloaded_count = 0
    
    for i, url in enumerate(image_urls):
        try:
            print(f"正在下载第 {i+1}/{len(image_urls)} 张图片: {url}")
            
            # 发送请求下载图片
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            # 从URL中提取文件名
            parsed_url = urlparse(url)
            filename = os.path.basename(parsed_url.path)
            
            # 如果没有文件扩展名，根据Content-Type添加
            if not filename or '.' not in filename:
                content_type = response.headers.get('content-type', '')
                if 'jpeg' in content_type or 'jpg' in content_type:
                    filename = f"image_{i+1}.jpg"
                elif 'png' in content_type:
                    filename = f"image_{i+1}.png"
                else:
                    filename = f"image_{i+1}.jpg"  # 默认使用jpg
            
            # 保存图片
            file_path = os.path.join(download_dir, filename)
            with open(file_path, 'wb') as f:
                f.write(response.content)
            
            downloaded_count += 1
            print(f"✓ 下载成功: {filename}")
            
        except Exception as e:
            print(f"✗ 下载失败 {url}: {str(e)}")
    
    print(f"\n下载完成！成功下载 {downloaded_count}/{len(image_urls)} 张图片")

if __name__ == "__main__":
    # HTML文件路径
    html_file = "/Users/lixiang/projects/chrome-plugin/Graphic Notes/uploadToCF/test.html"
    
    # 下载目录
    download_directory = "/Users/lixiang/Downloads"
    
    # 提取图片链接
    print("正在提取图片链接...")
    image_urls = extract_image_urls_from_html(html_file)
    
    # 打印图片链接数组
    print(f"\n找到 {len(image_urls)} 个图片链接:")
    print("\n图片链接数组 (JSON格式):")
    print(json.dumps(image_urls, indent=2, ensure_ascii=False))
    
    # print("\n图片链接数组 (编号列表):")
    # for i, url in enumerate(image_urls, 1):
    #     print(f"{i}. {url}")
    
    print("\n" + "="*50)
    
    # 下载所有图片
    if image_urls:
        download_images(image_urls, download_directory)
    else:
        print("没有找到图片链接！")