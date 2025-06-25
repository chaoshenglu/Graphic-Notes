import os
from PIL import Image

def compress_images():
    """压缩images文件夹中的图片，将宽度调整为1008px，高度按比例调整"""
    images_folder = 'images'
    target_width = 790
    
    # 支持的图片格式
    supported_formats = ('.jpg', '.jpeg', '.png', '.webp')
    
    if not os.path.exists(images_folder):
        print("错误：images文件夹不存在")
        return
    
    # 获取所有支持格式的图片文件
    image_files = [f for f in os.listdir(images_folder) 
                   if f.lower().endswith(supported_formats)]
    
    if not image_files:
        print("images文件夹中没有找到支持的图片文件")
        return
    
    processed_count = 0
    
    for filename in image_files:
        filepath = os.path.join(images_folder, filename)
        
        try:
            # 打开图片
            with Image.open(filepath) as img:
                # 获取原始尺寸
                original_width, original_height = img.size
                
                # 如果宽度和格式都符合目标，跳过处理
                if original_width == target_width and filename.lower().endswith('.webp'):
                    print(f"跳过 {filename}：宽度和格式都已符合要求")
                    continue
                
                # 计算新的高度（按比例）
                aspect_ratio = original_height / original_width
                new_height = int(target_width * aspect_ratio)
                
                # 如果宽度已经是目标宽度，直接使用原图，否则调整尺寸
                if original_width == target_width:
                    resized_img = img
                else:
                    resized_img = img.resize((target_width, new_height), Image.Resampling.LANCZOS)
                
                # 统一转换为webp格式
                webp_filename = os.path.splitext(filename)[0] + '.webp'
                webp_filepath = os.path.join(images_folder, webp_filename)
                
                # 保存为webp格式
                resized_img.save(webp_filepath, 'WEBP', quality=95, optimize=True)
                
                # 如果原文件不是webp格式，删除原文件
                if not filename.lower().endswith('.webp'):
                    os.remove(filepath)
                    print(f"✅ 处理完成: {filename} -> {webp_filename} ({original_width}x{original_height} -> {target_width}x{new_height})")
                else:
                    print(f"✅ 处理完成: {filename} ({original_width}x{original_height} -> {target_width}x{new_height})")
                
                processed_count += 1
                
        except Exception as e:
            print(f"❌ 处理文件 {filename} 时出错: {str(e)}")
    
    print(f"\n压缩完成，共处理 {processed_count} 个图片文件")

if __name__ == "__main__":
    compress_images()