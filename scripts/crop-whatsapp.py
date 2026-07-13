import os
from PIL import Image

def process_logo():
    img_path = "/home/zhrysn/Client1/public/whatsapp-logo.png"
    if not os.path.exists(img_path):
        print(f"Error: {img_path} not found")
        return

    # Open image and convert to RGBA
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()

    new_data = []
    # Target background color is off-white #F7F7F7 (247, 247, 247)
    target_color = (247, 247, 247)
    tolerance = 15

    for item in data:
        # Check if pixel is close to target background color
        r_diff = abs(item[0] - target_color[0])
        g_diff = abs(item[1] - target_color[1])
        b_diff = abs(item[2] - target_color[2])
        
        # Also check if it's pure white or very close
        is_bg = (r_diff < tolerance and g_diff < tolerance and b_diff < tolerance) or \
                (item[0] > 250 and item[1] > 250 and item[2] > 250)

        if is_bg:
            # Make transparent
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)

    # Find bounding box of non-transparent content to crop margins
    bbox = img.getbbox()
    if bbox:
        # Crop to the active logo circle
        cropped_img = img.crop(bbox)
        
        # Save back to the public directory as a clean transparent PNG
        cropped_img.save(img_path, "PNG")
        print(f"Successfully cropped and saved transparent logo to {img_path}. Bbox: {bbox}")
    else:
        # Fallback if no bbox found
        img.save(img_path, "PNG")
        print("Saved transparent logo without cropping.")

if __name__ == "__main__":
    process_logo()
