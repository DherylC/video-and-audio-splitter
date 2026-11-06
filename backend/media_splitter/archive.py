from __future__ import annotations

import shutil
import zipfile
from pathlib import Path


def safe_extract(zip_path: Path, dest: Path) -> list[Path]:
    """Extract a zip, blocking path traversal and skipping macOS/hidden junk."""
    dest = dest.resolve()
    extracted: list[Path] = []
    with zipfile.ZipFile(zip_path) as zf:
        for info in zf.infolist():
            if info.is_dir():
                continue
            parts = Path(info.filename).parts
            if "__MACOSX" in parts or any(p.startswith(".") for p in parts):
                continue
            target = (dest / info.filename).resolve()
            if dest not in target.parents:
                continue  # zip-slip
            target.parent.mkdir(parents=True, exist_ok=True)
            # Stream instead of reading the whole member into memory.
            with zf.open(info) as src, open(target, "wb") as out:
                shutil.copyfileobj(src, out)
            extracted.append(target)
    return extracted


def build_zip(
    folder: Path,
    zip_path: Path,
    include_media: bool = True,
    include_spectrograms: bool = True,
) -> Path:
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in sorted(folder.rglob("*")):
            if not f.is_file():
                continue
            if f.suffix.lower() == ".png":
                if not include_spectrograms:
                    continue
            elif not include_media:
                continue
            zf.write(f, f.relative_to(folder))
    return zip_path
