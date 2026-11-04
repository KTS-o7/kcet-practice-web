"""Crop a region from a page PNG. Usage: python3 -I scripts/crop.py <page.png> <x0> <y0> <x1> <y1> <out.png>
Coordinates are fractions (0..1) of page width/height; pads by 1.5%; trims to content-ish bounds."""
import sys, os
from PIL import Image
src, out = sys.argv[1], sys.argv[6]
x0, y0, x1, y1 = map(float, sys.argv[2:6])
im = Image.open(src).convert("RGB")
W, H = im.size
p = 0.015
box = (int(max(0, x0 - p) * W), int(max(0, y0 - p) * H), int(min(1, x1 + p) * W), int(min(1, y1 + p) * H))
os.makedirs(os.path.dirname(os.path.abspath(out)) or ".", exist_ok=True)
crop = im.crop(box)
if crop.width > 1100:
    crop = crop.resize((1100, int(crop.height * 1100 / crop.width)))
crop.save(out, optimize=True)
print(out, crop.size)
