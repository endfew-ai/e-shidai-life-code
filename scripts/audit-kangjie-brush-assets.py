from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "public" / "visuals" / "brush"
EXPECTED = {
    "title-kangjie-entry-v1.webp",
    "theme-kangjie-v1.webp",
    "title-kangjie-hero-v1.webp",
    "title-kangjie-origins-v1.webp",
    "title-kangjie-meihua-v1.webp",
    "title-kangjie-huangji-v1.webp",
    "title-kangjie-result-v1.webp",
    "title-kangjie-source-v1.webp",
    "title-kangjie-boundary-v1.webp",
}


def visible_green_fringe(pixel: tuple[int, int, int, int]) -> bool:
    red, green, blue, alpha = pixel
    return alpha > 0 and green - red >= 20 and green - blue >= 30 and (green - red) * alpha / 255 >= 2


def main() -> None:
    present = {path.name for path in ASSET_DIR.glob("*kangjie*.webp")}
    missing = EXPECTED - present
    if missing:
        raise SystemExit(f"Missing assets: {', '.join(sorted(missing))}")

    failed = False
    for filename in sorted(EXPECTED):
        path = ASSET_DIR / filename
        with Image.open(path).convert("RGBA") as image:
            pixels = list(image.get_flattened_data())
            corners = [image.getpixel((0, 0)), image.getpixel((image.width - 1, 0)), image.getpixel((0, image.height - 1)), image.getpixel((image.width - 1, image.height - 1))]
            fringe = sum(visible_green_fringe(pixel) for pixel in pixels)
            corner_alpha = [pixel[3] for pixel in corners]
            okay = image.mode == "RGBA" and fringe == 0 and corner_alpha == [0, 0, 0, 0]
            print(f"{filename}: {image.width}x{image.height} RGBA, fringe={fringe}, corners={corner_alpha}, {'PASS' if okay else 'FAIL'}")
            failed |= not okay

    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
