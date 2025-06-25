#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
删除HTML文件中所有title属性的脚本
"""

import re
import os

def remove_title_attributes(file_path):
    """
    删除HTML文件中所有的title属性
    
    Args:
        file_path (str): HTML文件路径
    
    Returns:
        bool: 操作是否成功
    """
    try:
        # 检查文件是否存在
        if not os.path.exists(file_path):
            print(f"错误：文件 {file_path} 不存在")
            return False
        
        # 读取文件内容
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        print(f"正在处理文件: {file_path}")
        print(f"原始文件大小: {len(content)} 字符")
        
        # 使用正则表达式匹配所有title属性
        # 匹配模式：title="任何内容"（包括转义字符）
        title_pattern = r'\s+title="[^"]*"'
        
        # 查找所有匹配的title属性
        matches = re.findall(title_pattern, content)
        print(f"找到 {len(matches)} 个title属性:")
        
        # 显示找到的title属性
        for i, match in enumerate(matches, 1):
            print(f"  {i}. {match.strip()}")
        
        # 删除所有title属性
        new_content = re.sub(title_pattern, '', content)
        
        print(f"处理后文件大小: {len(new_content)} 字符")
        print(f"删除了 {len(content) - len(new_content)} 个字符")
        
        # 写入修改后的内容
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(new_content)
        
        print(f"✅ 成功删除所有title属性并保存文件")
        return True
        
    except Exception as e:
        print(f"❌ 处理文件时出错: {str(e)}")
        return False

def main():
    """
    主函数
    """
    # 目标文件路径
    html_file = "/Users/lixiang/Desktop/uploadToCF/demo.html"
    
    print("=" * 50)
    print("HTML Title属性删除工具")
    print("=" * 50)
    
    # 执行删除操作
    success = remove_title_attributes(html_file)
    
    if success:
        print("\n🎉 操作完成！所有title属性已被删除。")
    else:
        print("\n❌ 操作失败，请检查错误信息。")

if __name__ == "__main__":
    main()