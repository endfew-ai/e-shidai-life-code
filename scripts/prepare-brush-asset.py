"""Trim and encode visual assets after the imagegen chroma-key helper.

Run the imagegen skill's remove_chroma_key.py first. This script then trims
the transparent canvas, adds safe padding, scales it, and writes lossless WebP.

Examples:
  python scripts/prepare-brush-asset.py alpha keyed.png public/visuals/brush/title.webp
  python scripts/prepare-brush-asset.py opaque source.png public/visuals/hero-background.webp
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def _clean_fringe(image: Image.Image) -> Image.Image:
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = pixels[x, y]
            is_green_fringe = (
                alpha < 128
                and green > max(red, blue) + 12
                and green > red * 1.18
                and green > blue * 1.18
            )
            if alpha < 8 or is_green_fringe:
                pixels[x, y] = (0, 0, 0, 0)
            elif alpha < 192 and green > red + 16 and green > blue + 24:
                pixels[x, y] = (red, min(green, red + 8), blue, alpha)
    return image


def _trim_alpha(image: Image.Image) -> Image.Image:
    image = _clean_fringe(image.convert("RGBA"))
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("The alpha image has no visible pixels.")
    padding = max(18, round(min(image.size) * 0.025))
    cropped = image.crop(bbox)
    padded = Image.new("RGBA", (cropped.width + padding * 2, cropped.height + padding * 2), (0, 0, 0, 0))
    padded.alpha_composite(cropped, (padding, padding))
    return padded


def _resize(image: Image.Image, max_width: int) -> Image.Image:
    if image.width <= max_width:
        return image
    height = round(image.height * max_width / image.width)
    return image.resize((max_width, height), Image.Resampling.LANCZOS)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("alpha", "opaque"))
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--max-width", type=int, default=1200)
    args = parser.parse_args()

    if not args.source.is_file():
        raise FileNotFoundError(args.source)
    image = Image.open(args.source)
    image = _trim_alpha(image) if args.mode == "alpha" else image.convert("RGB")
    image = _resize(image, args.max_width)
    if args.mode == "alpha":
        image = _clean_fringe(image)

    args.destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(args.destination, "WEBP", lossless=True, method=6, exact=True)
    print(f"{args.destination} | {image.mode} | {image.width}x{image.height}")


if __name__ == "__main__":
    main()
