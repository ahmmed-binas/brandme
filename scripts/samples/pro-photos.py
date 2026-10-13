"""
Downloads the Unsplash photos used by the 2026 profession templates (Dispatch,
Atelier, Roadmap, Radar, Duet) into public/samples/pro as WebP, and writes
CREDITS.md. Unsplash License: free to use, credited anyway. Like public/samples/re
they are left out of free template downloads (lib/templates/export.ts).

    py -3 scripts/samples/pro-photos.py
"""

import io
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "samples" / "pro"

# file name: (Unsplash photo id, photographer username, longest side)
PHOTOS = {
    "trades-avatar": ("photo-1621905252507-b35492cc74b4", "emmages", 1400),
    "trades-wiring": ("photo-1621905251189-08b45d6a269e", "emmages", 2000),
    "trades-panel": ("photo-1758101755915-462eddc23f57", "toolmash", 2000),
    "trades-install": ("photo-1660330589693-99889d60181e", "razesolar", 2000),
    "trades-board": ("photo-1635335874521-7987db781153", "mostafa_mahmoudi24", 2000),
    "trades-meter": ("photo-1553873002-785d775854c9", "hobiindustri", 2000),
    "beauty-avatar": ("photo-1709477542170-f11ee7d471a0", "kalpa_mahagamage", 1400),
    "beauty-eye": ("photo-1709477542149-f4e0e21d590b", "kalpa_mahagamage", 2000),
    "beauty-glow": ("photo-1594465919760-441fe5908ab0", "amiresel", 2000),
    "beauty-pink": ("photo-1630084775816-7abb7383ded5", "vimarco", 2000),
    "beauty-portrait": ("photo-1593351799227-75df2026356b", "iamdivineeffiong", 2000),
    "beauty-backstage": ("photo-1636023730877-233b9237d4ec", "alena_horoshaya", 2000),
    "beauty-kit": ("photo-1596462502278-27bfdc403348", "shamblenstudios", 2000),
    "product-avatar": ("photo-1573496359142-b8d87734a5a2", "wocintechchat", 1400),
    "product-notes": ("photo-1623652554515-91c833e3080e", "byfortytwo", 2000),
    "product-board": ("photo-1503551723145-6c040742065b-v2", "patrickperkins", 2000),
    "product-team": ("photo-1623303647440-967d26b95b47", "byfortytwo", 2000),
    "hr-avatar": ("photo-1581065178047-8ee15951ede6", "palmariannika", 1400),
    "hr-interview": ("photo-1573497620053-ea5300f94f21", "wocintechchat", 2000),
    "hr-handshake": ("photo-1521791136064-7986c2920216", "cytonn_photography", 2000),
    "hr-cv": ("photo-1698047681432-006d2449c631", "resumegenius", 2000),
    "hr-chat": ("photo-1686771416317-b964cc4e0002", "miinrad", 2000),
    "lang-avatar": ("photo-1607990283143-e81e7a2c9349", "sigmund", 1400),
    "lang-desk": ("photo-1787724778903-0963add21d31", "silverkblack", 2000),
    "lang-pen": ("photo-1676312389476-fe01e238b422", "bermixstudio", 2000),
}


def fetch(photo_id: str, size: int) -> Image.Image:
    url = f"https://images.unsplash.com/{photo_id}?w={size}&q=85&fm=jpg"
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    data = urllib.request.urlopen(request, timeout=60).read()
    return Image.open(io.BytesIO(data)).convert("RGB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (photo_id, author, size) in PHOTOS.items():
        image = fetch(photo_id, size)
        image.thumbnail((size, size), Image.LANCZOS)
        target = OUT / f"{name}.webp"
        image.save(target, "WEBP", quality=82, method=6)
        print(f"{name}: {image.size[0]}x{image.size[1]} {target.stat().st_size // 1024} KB")
    rows = "\n".join(
        f"| {name}.webp | {author} | https://unsplash.com/@{author} |" for name, (_, author, _) in PHOTOS.items()
    )
    (OUT / "CREDITS.md").write_text(
        "# Profession template sample photos\n\n"
        "From Unsplash under the Unsplash License (free for commercial use, no attribution required; "
        "credited here anyway). Used in template previews, the gallery and marketing only: **not** "
        "included in free template downloads, because the licence doesn't allow redistributing the "
        "photos as a collection. Made by `scripts/samples/pro-photos.py`.\n\n"
        "| File | Photographer (Unsplash username) | Profile |\n| --- | --- | --- |\n" + rows + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
