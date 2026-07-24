import argparse
import re
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "public" / "visuals" / "brush"
SOURCE_FILES = (
    ROOT / "index.html",
    ROOT / "kangjie.html",
    ROOT / "app.js",
    ROOT / "kangjie.js",
    ROOT / "app" / "page.tsx",
    ROOT / "app" / "kangjie" / "page.tsx",
)
ASSET_PATTERN = re.compile(r"(?:public)?/visuals/brush/([A-Za-z0-9._-]+\.webp)")
REQUIRED_FIXED = {
    "title-calculation-explain-v2.webp",
    "title-grid-birthday-v2.webp",
    "title-grid-code-v2.webp",
    "title-insight-core-v2.webp",
    "title-insight-pressure-v2.webp",
    "title-insight-care-v2.webp",
    "title-insight-communication-v2.webp",
    "title-self-question-v2.webp",
    "title-judgment-v2.webp",
    "title-tuan-v2.webp",
    "title-image-saying-v2.webp",
    "title-six-lines-v2.webp",
    "title-kangjie-overview-entry-v3.webp",
    "title-kangjie-overview-layers-v2.webp",
    "title-kangjie-overview-scale-v2.webp",
    "title-kangjie-origin-sequence-v2.webp",
    "title-kangjie-origin-calendar-v2.webp",
    "title-kangjie-origin-boundaries-v2.webp",
    "title-kangjie-origin-duration-v2.webp",
    "title-kangjie-method-calendar-v2.webp",
    "title-kangjie-method-object-v2.webp",
    "title-kangjie-method-sound-v2.webp",
    "title-kangjie-method-text-v2.webp",
    "title-kangjie-form-calendar-v2.webp",
    "title-kangjie-form-object-v2.webp",
    "title-kangjie-form-sound-v2.webp",
    "title-kangjie-form-text-v2.webp",
    "title-hex-original-v2.webp",
    "title-hex-mutual-v2.webp",
    "title-hex-changed-v2.webp",
    "title-kangjie-classic-v2.webp",
    "title-moving-line-v2.webp",
    "title-changed-text-v2.webp",
    "title-kangjie-tab-source-v2.webp",
}


def visible_green_fringe(pixel: tuple[int, int, int, int]) -> bool:
    red, green, blue, alpha = pixel
    return alpha > 0 and green - red >= 20 and green - blue >= 30 and (green - red) * alpha / 255 >= 2


def referenced_assets() -> set[str]:
    names: set[str] = set()
    for source in SOURCE_FILES:
        names.update(ASSET_PATTERN.findall(source.read_text(encoding="utf-8")))
    return names


def transparent_border(image: Image.Image) -> bool:
    width, height = image.size
    border = [image.getpixel((x, 0))[3] for x in range(width)]
    border += [image.getpixel((x, height - 1))[3] for x in range(width)]
    border += [image.getpixel((0, y))[3] for y in range(height)]
    border += [image.getpixel((width - 1, y))[3] for y in range(height)]
    return all(alpha == 0 for alpha in border)


def create_contact_sheet(paths: list[Path], output: Path) -> None:
    cell_width, cell_height, columns = 390, 160, 3
    rows = (len(paths) + columns - 1) // columns
    sheet = Image.new("RGBA", (cell_width * columns, cell_height * rows), (3, 11, 22, 255))
    draw = ImageDraw.Draw(sheet)
    for index, path in enumerate(paths):
        with Image.open(path).convert("RGBA") as source:
            source.thumbnail((cell_width - 24, cell_height - 42), Image.Resampling.LANCZOS)
            x = (index % columns) * cell_width + (cell_width - source.width) // 2
            y = (index // columns) * cell_height + 8
            sheet.alpha_composite(source, (x, y))
            draw.text(((index % columns) * cell_width + 10, (index // columns) * cell_height + cell_height - 25), path.name, fill=(221, 183, 102, 255))
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.convert("RGB").save(output, quality=92)


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit every brush-title asset referenced by both static and React pages.")
    parser.add_argument("--contact-sheet", type=Path, help="Optional contact-sheet output path.")
    args = parser.parse_args()

    referenced = referenced_assets()
    missing_references = REQUIRED_FIXED - referenced
    missing_files = {name for name in referenced | REQUIRED_FIXED if not (ASSET_DIR / name).is_file()}
    if missing_references:
        raise SystemExit(f"Required title assets are not referenced: {', '.join(sorted(missing_references))}")
    if missing_files:
        raise SystemExit(f"Missing brush assets: {', '.join(sorted(missing_files))}")

    failed = False
    paths = [ASSET_DIR / name for name in sorted(referenced)]
    for path in paths:
        with Image.open(path) as source:
            source.load()
            rgba = source.convert("RGBA")
            corners = [
                rgba.getpixel((0, 0))[3],
                rgba.getpixel((rgba.width - 1, 0))[3],
                rgba.getpixel((0, rgba.height - 1))[3],
                rgba.getpixel((rgba.width - 1, rgba.height - 1))[3],
            ]
            fringe = sum(visible_green_fringe(pixel) for pixel in rgba.get_flattened_data())
            border_ok = transparent_border(rgba)
            okay = source.mode == "RGBA" and corners == [0, 0, 0, 0] and fringe == 0 and border_ok
            print(
                f"{path.name}: {rgba.width}x{rgba.height}, mode={source.mode}, "
                f"fringe={fringe}, transparent_border={border_ok}, {'PASS' if okay else 'FAIL'}"
            )
            failed |= not okay

    if args.contact_sheet:
        create_contact_sheet([ASSET_DIR / name for name in sorted(REQUIRED_FIXED)], args.contact_sheet)
        print(f"Contact sheet: {args.contact_sheet.resolve()}")

    print(f"Audited {len(paths)} referenced brush assets; required fixed modules: {len(REQUIRED_FIXED)}")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
