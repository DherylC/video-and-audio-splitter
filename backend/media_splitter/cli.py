import argparse
from pathlib import Path

from . import SplitConfig, split_media


def main() -> None:
    ap = argparse.ArgumentParser(description="Split audio/video into fixed-duration chunks.")
    ap.add_argument("inputs", nargs="+", help="media files and/or zip archives")
    ap.add_argument("-d", "--duration", type=float, required=True, help="chunk length in seconds")
    ap.add_argument("-o", "--output", default="split_output.zip")
    ap.add_argument("--audio-format", default="wav")
    ap.add_argument("--fast-video", action="store_true", help="stream copy (keyframe-snapped cuts)")
    a = ap.parse_args()

    cfg = SplitConfig(a.duration, audio_format=a.audio_format, accurate_video=not a.fast_video)
    report = split_media(
        a.inputs, cfg, a.output,
        on_progress=lambda d, t, name: print(f"[{d}/{t}] {name}", end="\r"),
    )
    print(f"\n{report.total_chunks} chunks -> {report.zip_path}")
    for r in report.failed:
        print(f"FAILED {r.source}: {r.error}")


if __name__ == "__main__":
    main()
