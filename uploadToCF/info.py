import os
from PIL import Image

def print_image_info():
    """遍历images文件夹，打印每张图片的尺寸"""
    images_folder = 'images'
    
    # 支持的图片格式
    supported_formats = ('.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp', '.tiff', '.gif')
    
    if not os.path.exists(images_folder):
        print("错误：images文件夹不存在")
        return
    
    # 获取所有支持格式的图片文件
    image_files = [f for f in os.listdir(images_folder) 
                   if f.lower().endswith(supported_formats)]
    
    if not image_files:
        print("images文件夹中没有找到支持的图片文件")
        return
    
    print(f"找到 {len(image_files)} 张图片：\n")
    
    for filename in sorted(image_files):
        filepath = os.path.join(images_folder, filename)
        
        try:
            # 打开图片获取尺寸信息
            with Image.open(filepath) as img:
                width, height = img.size
                file_size = os.path.getsize(filepath)
                file_size_kb = file_size / 1024
                
                print(f"{width} x {height} - {file_size_kb:.1f} KB  {filename}")
                
        except Exception as e:
            print(f"❌ 无法读取文件 {filename}: {str(e)}")
            print()

if __name__ == "__main__":
    print_image_info()