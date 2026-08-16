# -*- coding: utf-8 -*-
"""يلتقط لقطات المشهد ويجمّعها فيديو MP4 جاهزاً للستوري."""
import os, sys, subprocess, shutil
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS, DUR = 30, 10.0
CHROME = '/opt/pw-browsers/chromium'

def shoot(times, outdir, prefix='f', quality=92):
    os.makedirs(outdir, exist_ok=True)
    paths = []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=['--force-color-profile=srgb',
                                                            '--disable-lcd-text'])
        pg = b.new_page(viewport={'width': 1080, 'height': 1920}, device_scale_factor=1)
        pg.goto('file://' + os.path.join(ROOT, 'story', 'motion.html'))
        pg.wait_for_function('window.ready !== undefined')
        pg.evaluate('window.ready')
        pg.wait_for_timeout(1200)
        for i, t in enumerate(times):
            pg.evaluate('t => window.setFrame(t)', t)
            fp = os.path.join(outdir, f'{prefix}{i:04d}.jpg')
            pg.screenshot(path=fp, type='jpeg', quality=quality)
            paths.append(fp)
            if i % 30 == 0:
                print(f'  {i}/{len(times)}', flush=True)
        b.close()
    return paths

if __name__ == '__main__':
    if sys.argv[1:2] == ['preview']:
        ts = [float(x) for x in sys.argv[2:]]
        shoot(ts, os.path.join(ROOT, 'story', 'preview'), 'p', 88)
        print('preview done')
    else:
        frames = os.path.join(ROOT, 'story', 'frames')
        shutil.rmtree(frames, ignore_errors=True)
        n = int(FPS * DUR)
        shoot([i / FPS for i in range(n)], frames)
        import imageio_ffmpeg
        ff = imageio_ffmpeg.get_ffmpeg_exe()
        out = os.path.join(ROOT, 'story', 'story-motion.mp4')
        subprocess.run([ff, '-y', '-framerate', str(FPS), '-i', os.path.join(frames, 'f%04d.jpg'),
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p',
                        '-profile:v', 'high', '-level', '4.1', '-movflags', '+faststart',
                        '-r', str(FPS), out], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        shutil.rmtree(frames, ignore_errors=True)
        print(out, os.path.getsize(out))
