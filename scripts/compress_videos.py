import os
import subprocess

def compress_videos():
    src_dir = "/home/zhrysn/Downloads/urban"
    dest_dir = "/home/zhrysn/Client1/public/food/video"
    os.makedirs(dest_dir, exist_ok=True)
    
    files = sorted(os.listdir(src_dir))
    video_files = [f for f in files if f.lower().endswith(('.mp4', '.mov'))]
    
    print(f"Starting compression of {len(video_files)} videos...")
    
    for idx, f in enumerate(video_files):
        src_path = os.path.join(src_dir, f)
        clean_name = f.lower().replace(".mp4", "_720p.mp4").replace(".mov", "_720p.mp4")
        dest_path = os.path.join(dest_dir, clean_name)
        
        print(f"[{idx+1}/{len(video_files)}] Compressing {f} -> {clean_name}...")
        
        # ffmpeg command: scale to 720p, remove audio, crf=30, faststart for progressive playback
        cmd = [
            "ffmpeg", "-y",
            "-i", src_path,
            "-vf", "scale=-2:720", # Maintain aspect ratio with height 720
            "-an",                 # Remove audio
            "-vcodec", "libx264",
            "-crf", "30",          # Higher compression for background loops
            "-preset", "fast",
            "-profile:v", "baseline",
            "-movflags", "+faststart",
            dest_path
        ]
        
        try:
            # Run ffmpeg and capture output
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if result.returncode == 0:
                original_size = os.path.getsize(src_path) / (1024 * 1024)
                new_size = os.path.getsize(dest_path) / (1024 * 1024)
                print(f"-> Done! Size: {original_size:.2f} MB -> {new_size:.2f} MB (Saved {((original_size-new_size)/original_size)*100:.1f}%)")
            else:
                print(f"-> Error compressing {f}: {result.stderr}")
        except Exception as e:
            print(f"-> Exception compressing {f}: {e}")

if __name__ == "__main__":
    compress_videos()
