import os
import sys
from PIL import Image

def optimize_images():
    src_dir = "/home/zhrysn/Downloads/urban"
    dest_dir = "/home/zhrysn/Client1/public/food"
    
    # Ensure destination directories exist
    web_dir = os.path.join(dest_dir, "web")
    thumb_dir = os.path.join(dest_dir, "thumb")
    os.makedirs(web_dir, exist_ok=True)
    os.makedirs(thumb_dir, exist_ok=True)
    
    files = sorted(os.listdir(src_dir))
    image_files = [f for f in files if f.lower().endswith(('.jpeg', '.jpg', '.png'))]
    
    print(f"Starting optimization of {len(image_files)} images...")
    
    catalog_items = []
    
    for idx, f in enumerate(image_files):
        src_path = os.path.join(src_dir, f)
        # Rename output files to clean lowercased names
        clean_name = f.lower().replace(".jpg.jpeg", ".jpeg").replace(".jpg(1).jpeg", "_1.jpeg")
        web_path = os.path.join(web_dir, clean_name)
        thumb_path = os.path.join(thumb_dir, clean_name)
        
        try:
            with Image.open(src_path) as img:
                # 1. Save Web optimized version (Max 1400px)
                w, h = img.size
                max_size = 1400
                if w > max_size or h > max_size:
                    if w > h:
                        new_w = max_size
                        new_h = int(h * (max_size / w))
                    else:
                        new_h = max_size
                        new_w = int(w * (max_size / h))
                    img_web = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                else:
                    img_web = img
                
                # Save as compressed JPEG
                img_web.convert("RGB").save(web_path, "JPEG", quality=82, optimize=True)
                
                # 2. Save Thumbnail version (Max 400px)
                thumb_max = 400
                if w > thumb_max or h > thumb_max:
                    if w > h:
                        new_w = thumb_max
                        new_h = int(h * (thumb_max / w))
                    else:
                        new_h = thumb_max
                        new_w = int(w * (thumb_max / h))
                    img_thumb = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                else:
                    img_thumb = img
                
                img_thumb.convert("RGB").save(thumb_path, "JPEG", quality=80, optimize=True)
                
                web_size_kb = os.path.getsize(web_path) / 1024
                thumb_size_kb = os.path.getsize(thumb_path) / 1024
                
                catalog_items.append({
                    "id": idx + 1,
                    "original_name": f,
                    "clean_name": clean_name,
                    "width": w,
                    "height": h,
                    "web_size_kb": web_size_kb,
                    "thumb_size_kb": thumb_size_kb
                })
                
                print(f"[{idx+1}/{len(image_files)}] Optimized {f} -> size: {web_size_kb:.1f} KB (thumb: {thumb_size_kb:.1f} KB)")
        except Exception as e:
            print(f"Error optimizing {f}: {e}")
            
    # Generate the food-preview.html file for local developer preview
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Urban Tiffin - Food Photoshoot Preview Catalog</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #F9F7F2;
            color: #233426;
            margin: 0;
            padding: 40px 20px;
        }
        .header {
            max-width: 1200px;
            margin: 0 auto 40px auto;
            text-align: center;
            border-bottom: 1px solid rgba(35, 52, 38, 0.15);
            padding-bottom: 20px;
        }
        h1 {
            font-family: Georgia, serif;
            font-size: 2.5rem;
            margin: 0 0 10px 0;
        }
        .grid {
            display: grid;
            grid-template-cols: repeat(auto-fill, minmax(280px, 1fr));
            gap: 30px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .card {
            background-color: #ffffff;
            border: 1px solid rgba(35, 52, 38, 0.1);
            box-shadow: 6px 6px 0 rgba(35, 52, 38, 0.05);
            overflow: hidden;
            display: flex;
            flex-col: column;
            flex-direction: column;
        }
        .image-container {
            width: 100%;
            height: 280px;
            background-color: #F1EDE2;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        .card:hover img {
            transform: scale(1.05);
        }
        .info {
            padding: 15px;
            font-size: 0.85rem;
        }
        .title {
            font-weight: bold;
            font-size: 1rem;
            margin-bottom: 8px;
            word-break: break-all;
        }
        .meta {
            color: #666;
            line-height: 1.5;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            background-color: #a07a4b;
            color: #ffffff;
            font-size: 0.7rem;
            font-weight: bold;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Urban Tiffin & Events</h1>
        <p>Food Photoshoot Assets Preview (Optimized for Web)</p>
        <p style="color: #a07a4b; font-weight: bold;">Use this local catalog page to find the image filenames for specific food placements.</p>
    </div>
    <div class="grid">
"""
    
    for item in catalog_items:
        html_content += f"""
        <div class="card">
            <div class="image-container">
                <a href="/food/web/{item['clean_name']}" target="_blank">
                    <img src="/food/thumb/{item['clean_name']}" alt="{item['clean_name']}">
                </a>
            </div>
            <div class="info">
                <div class="title">#{item['id']} - {item['clean_name']}</div>
                <div class="meta">
                    Original: {item['original_name']}<br>
                    Dimensions: {item['width']}x{item['height']}<br>
                    Web size: {item['web_size_kb']:.1f} KB<br>
                    Thumb size: {item['thumb_size_kb']:.1f} KB
                </div>
                <span class="badge">IMAGE</span>
            </div>
        </div>
        """
        
    html_content += """
    </div>
</body>
</html>
"""
    
    with open("/home/zhrysn/Client1/public/food-preview.html", "w") as html_file:
        html_file.write(html_content)
        
    print(f"Asset preview catalog written to /home/zhrysn/Client1/public/food-preview.html")

if __name__ == "__main__":
    optimize_images()
