import re
import json
import requests
import os
from bs4 import BeautifulSoup
from PIL import Image
from io import BytesIO

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
        height = get_image_height_by_download(src)
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

def get_image_height_by_download(image_url):
    """通过下载图片获取真实高度"""
    try:
        # 处理相对URL
        if image_url.startswith('//'):
            image_url = 'https:' + image_url
        elif image_url.startswith('/'):
            image_url = 'https://img.alicdn.com' + image_url
            
        # 下载图片
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(image_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # 使用PIL获取图片尺寸
        image = Image.open(BytesIO(response.content))
        width, height = image.size
        
        print(f"图片 {image_url[:60]}... 真实尺寸: {width}x{height}")
        return height
        
    except Exception as e:
        print(f"下载图片失败 {image_url[:60]}...: {str(e)}")
        return None

def print_image_urls(image_urls):
    """打印图片链接数组"""
    print(f"\n找到 {len(image_urls)} 个图片链接:")
    print("\n图片链接数组 (JSON格式):")
    print(json.dumps(image_urls, indent=2, ensure_ascii=False))
    
    # print("\n图片链接数组 (编号列表):")
    # for i, url in enumerate(image_urls, 1):
    #     print(f"{i}. {url}")

if __name__ == "__main__":
    # HTML文件路径
    html_file = "/Users/lixiang/projects/chrome-plugin/Graphic Notes/uploadToCF/test.html"
    
    # 提取图片链接
    print("正在提取图片链接...")
    image_urls = extract_image_urls_from_html(html_file)
    
    # 打印图片链接数组
    print_image_urls(image_urls)
    
    print("\n" + "="*50)
    print("图片链接提取完成！")