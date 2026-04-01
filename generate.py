"""
One-time build script: processes bird image + depth map into grid JSON.
Run: python3 generate.py
Requires: pip install Pillow
"""
from PIL import Image, ImageOps
import random
import json

BIRD_PATH = "../cc-birdie.png"
DEPTH_PATH = "../cc-birdie-map-2.png"
OUTPUT = "grid-data.json"

HIGHLIGHT = (0xF4, 0xF2, 0x7B)
SHADOW = (0x11, 0x3D, 0x38)

CHAR_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*+=-:;!?/\\|(){}[]<>"

CELL_W = 8
CELL_H = 12
ALPHA_THRESHOLD = 40
GAMMA = 1.0

bird = Image.open(BIRD_PATH).convert("RGBA")
depth = Image.open(DEPTH_PATH).convert("L").resize(bird.size, Image.LANCZOS)
depth = ImageOps.autocontrast(depth, cutoff=1)
gamma_lut = [int(((i / 255.0) ** GAMMA) * 255) for i in range(256)]
depth = depth.point(gamma_lut)

cols = bird.width // CELL_W
rows = bird.height // CELL_H

def lerp(a, b, t):
    return int(a + (b - a) * t)

def lerp_color(c1, c2, t):
    return [lerp(c1[i], c2[i], t) for i in range(3)]

cells = []
for row in range(rows):
    for col in range(cols):
        x0 = col * CELL_W
        y0 = row * CELL_H
        x1 = min(x0 + CELL_W, bird.width)
        y1 = min(y0 + CELL_H, bird.height)

        region = bird.crop((x0, y0, x1, y1))
        pixels = list(region.getdata())
        avg_alpha = sum(p[3] for p in pixels) / len(pixels)

        if avg_alpha < ALPHA_THRESHOLD:
            cells.append(None)
            continue

        depth_region = depth.crop((x0, y0, x1, y1))
        depth_pixels = list(depth_region.getdata())
        avg_depth = sum(depth_pixels) / len(depth_pixels)
        t = avg_depth / 255.0
        color = lerp_color(SHADOW, HIGHLIGHT, t)

        char = random.choice(CHAR_SET)
        cells.append([char, color[0], color[1], color[2]])

output = {
    "cols": cols,
    "rows": rows,
    "cellWidth": CELL_W,
    "cellHeight": CELL_H,
    "cells": cells,
}

with open(OUTPUT, "w") as f:
    json.dump(output, f)

print(f"Generated {OUTPUT}: {cols}x{rows} grid, {sum(1 for c in cells if c)} active cells")
