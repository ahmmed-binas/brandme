"""
Downloads the Unsplash photos used by the 2026 profession templates (Dispatch,
Atelier, Roadmap, Radar, Duet, Lane, Throttle, Route, Altitude, Control Room, Studio Desk) into public/samples/pro as WebP, and writes
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
    "drive-avatar": ("photo-1507003211169-0a1dd7228f2d", "miracletwentyone", 1400),
    "drive-lesson": ("photo-1553782097-130fef5d3e27", "denizen", 2000),
    "drive-briefing": ("photo-1630406144797-821be1f35d75", "bastroloog", 2000),
    "drive-two": ("photo-1537211790624-e6f568af4b13", "davidemrich", 2000),
    "drive-mirror": ("photo-1611508106567-6218ae6c5f6a", "solarfri", 2000),
    "drive-golden": ("photo-1521136095380-08fbd7be93c8", "darwiiiin", 2000),
    "drive-bike": ("photo-1764605514633-eb9a675ffbb8", "godze", 2000),
    "fly-avatar": ("photo-1775486750740-cb5070f05aa9", "willhaddock", 1400),
    "fly-cockpit": ("photo-1764547167443-1be5ab97e049", "horizonflights", 2000),
    "fly-taxi": ("photo-1788744186978-0d8fb21939c7", "ozzieaviator", 2000),
    "fly-gauges": ("photo-1652610050513-aee5fa596bdc", "grianghraf", 2000),
    "fly-preflight": ("photo-1775486788201-eda6230a6430", "willhaddock", 2000),
    "fly-headset": ("photo-1775486766610-18b17c5fd297", "willhaddock", 2000),
    "fly-field": ("photo-1755252626479-c17bc3cdf8c3", "alpenair", 2000),
    "ops-avatar": ("photo-1676989880361-091e12efc056", "we_are_rising", 1400),
    "content-avatar": ("photo-1611432579402-7037e3e2c1e4", "alexstarnes", 1400),
    "moto-avatar": ("photo-1789997547242-935249681a29", "victoraugusto_melo", 1400),
    "moto-road": ("photo-1598548841213-9cdbcdf8ec47", "gersche", 2000),
    "moto-city": ("photo-1634015190736-3cecd58f89fe", "ryunosuke_kikuno", 2000),
    "moto-curve": ("photo-1590507022928-b8db9b188154", "jusdevoyage", 2000),
    "moto-sport": ("photo-1504160820508-da86e9dc8a28", "joshuaryanphoto", 2000),
    "moto-helmet": ("photo-1556570508-121c77af2a75", "gijsparadijs", 2000),
    "bus-cab": ("photo-1631798262744-5c15818c2e92", "jacklucassmith", 2000),
    "bus-seat": ("photo-1736955075954-fba0a07c5118", "diegosmarines", 2000),
    "bus-interior": ("photo-1564593606425-53fbf6dc3eb1", "christianw", 2000),
    "bus-truck": ("photo-1618582948377-cd7eb0e8cb14", "seffen99", 2000),
    "bus-road": ("photo-1611746351408-c0a1346be8e8", "tirynelson", 2000),
}


def fetch(photo_id: str, size: int) -> Image.Image:
    url = f"https://images.unsplash.com/{photo_id}?w={size}&q=85&fm=jpg"
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    data = urllib.request.urlopen(request, timeout=60).read()
    return Image.open(io.BytesIO(data)).convert("RGB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (photo_id, author, size) in PHOTOS.items():
        if (OUT / f"{name}.webp").exists():
            continue
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
