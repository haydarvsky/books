# -*- coding: utf-8 -*-
"""يلتقط صفحة HTML ثابتة إلى PNG بمقاس الستوري."""
import sys, os
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
page = sys.argv[1] if len(sys.argv) > 1 else 'story.html'
out = sys.argv[2] if len(sys.argv) > 2 else page.replace('.html', '.png')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg = b.new_page(viewport={'width': 1080, 'height': 1920}, device_scale_factor=1)
    pg.goto('file://' + os.path.join(ROOT, 'story', page))
    pg.wait_for_timeout(2500)
    pg.screenshot(path=os.path.join(ROOT, 'story', out))
    b.close()
print(out)
