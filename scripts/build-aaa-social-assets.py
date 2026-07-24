#!/usr/bin/env python3
"""Build the optimized AAA artwork and exact-title social preview."""

from __future__ import annotations

import argparse
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps


def atomic_save_webp(image: Image.Image, destination: Path, quality: int = 88, lossless: bool = False) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(f"{destination.stem}.tmp{destination.suffix}")
    image.save(temporary, "WEBP", quality=quality, lossless=lossless, method=6, exact=True)
    with Image.open(temporary) as check:
        check.load()
        if check.size != image.size:
            raise RuntimeError(f"Unexpected WebP size for {destination}: {check.size}")
    os.replace(temporary, destination)


def atomic_save_png(image: Image.Image, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(f"{destination.stem}.tmp{destination.suffix}")
    image.save(temporary, "PNG", optimize=True)
    with Image.open(temporary) as check:
        check.load()
        if check.size != image.size:
            raise RuntimeError(f"Unexpected PNG size for {destination}: {check.size}")
    os.replace(temporary, destination)


def resize_overlay(image: Image.Image, max_width: int, max_height: int) -> Image.Image:
    overlay = image.convert("RGBA")
    overlay.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
    return overlay


def clean_visible_green_fringe(image: Image.Image) -> Image.Image:
    cleaned = image.convert("RGBA")
    pixels = cleaned.load()
    for y in range(cleaned.height):
        for x in range(cleaned.width):
            red, green, blue, alpha = pixels[x, y]
            if alpha > 0 and green - red >= 20 and green - blue >= 30 and (green - red) * alpha / 255 >= 2:
                pixels[x, y] = (red, min(green, red + 19), blue, alpha)
    return cleaned


def optimize_artwork(project_root: Path) -> None:
    artwork = (
        project_root / "public" / "visuals" / "hero-celestial-aaa-v1.webp",
        project_root / "public" / "visuals" / "life-path-instrument-aaa-v1.webp",
    )
    for path in artwork:
        with Image.open(path) as source:
            optimized = source.convert("RGB")
        atomic_save_webp(optimized, path)


def build_web_brush_assets(project_root: Path) -> None:
    brush_root = project_root / "public" / "visuals" / "brush"
    assets = (
        ("brand-life-numerology-aaa-v1.webp", "brand-life-numerology-aaa-web-v1.webp", 720, True),
        ("theme-xuanxing-v4.webp", "theme-xuanxing-web-v1.webp", 640, False),
        ("title-hero-v5.webp", "title-hero-web-v1.webp", 900, True),
        ("title-birthday-v4.webp", "title-birthday-web-v1.webp", 600, False),
        ("title-spectrum-v4.webp", "title-spectrum-web-v1.webp", 600, False),
        ("title-iching-v4.webp", "title-iching-web-v1.webp", 600, False),
        ("title-kangjie-entry-v1.webp", "title-kangjie-entry-web-v1.webp", 600, True),
        ("title-rules-v4.webp", "title-rules-web-v1.webp", 640, False),
        ("title-source-v5.webp", "title-source-web-v1.webp", 640, False),
        ("title-disclaimer-v5.webp", "title-disclaimer-web-v1.webp", 640, False),
        ("title-workspace-v1.webp", "title-workspace-web-v1.webp", 640, False),
    )
    for source_name, destination_name, max_width, lossless in assets:
        with Image.open(brush_root / source_name) as source:
            optimized = source.convert("RGBA")
            optimized.thumbnail((max_width, max_width), Image.Resampling.LANCZOS)
        if lossless:
            optimized = clean_visible_green_fringe(optimized)
        atomic_save_webp(optimized, brush_root / destination_name, quality=90, lossless=lossless)


def build_social_card(project_root: Path, background_path: Path) -> Path:
    public_visuals = project_root / "public" / "visuals"
    brand_path = public_visuals / "brush" / "brand-life-numerology-aaa-v1.webp"
    tagline_path = public_visuals / "brush" / "title-hero-v5.webp"

    with Image.open(background_path) as source:
        background = ImageOps.fit(
            source.convert("RGB"),
            (1200, 630),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5),
        )
    background = ImageEnhance.Contrast(background).enhance(1.04)
    canvas = background.convert("RGBA")

    shade = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shade_pixels = shade.load()
    for x in range(canvas.width):
        strength = int(148 * max(0.0, 1.0 - x / 720))
        for y in range(canvas.height):
            shade_pixels[x, y] = (2, 11, 22, strength)
    shade = shade.filter(ImageFilter.GaussianBlur(radius=16))
    canvas = Image.alpha_composite(canvas, shade)

    ornament = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(ornament)
    draw.line((64, 64, 470, 64), fill=(202, 151, 61, 175), width=2)
    draw.ellipse((57, 57, 71, 71), outline=(239, 194, 98, 220), width=2)
    draw.line((64, 566, 520, 566), fill=(202, 151, 61, 120), width=1)
    canvas = Image.alpha_composite(canvas, ornament)

    with Image.open(brand_path) as source:
        brand = resize_overlay(source, 500, 146)
    with Image.open(tagline_path) as source:
        tagline = resize_overlay(source, 470, 285)

    canvas.alpha_composite(brand, (62, 96))
    canvas.alpha_composite(tagline, (66, 250))

    output = project_root / "public" / "og-life-numerology-aaa-v1.png"
    atomic_save_png(canvas.convert("RGB"), output)
    atomic_save_png(canvas.convert("RGB"), project_root / output.name)
    return output


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-root", type=Path, required=True)
    parser.add_argument("--background", type=Path, required=True)
    args = parser.parse_args()

    project_root = args.project_root.resolve()
    background_path = args.background.resolve()
    if not background_path.is_file():
        raise FileNotFoundError(background_path)

    optimize_artwork(project_root)
    build_web_brush_assets(project_root)
    output = build_social_card(project_root, background_path)
    print(output)


if __name__ == "__main__":
    main()
