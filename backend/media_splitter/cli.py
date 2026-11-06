import argparse
from pathlib import Path

from . import MelConfig, SplitConfig, split_media


def main() -> None:
    ap = argparse.ArgumentParser(description="Split audio/video into fixed-duration chunks.")
    ap.add_argument("inputs", nargs="+", help="media files and/or zip archives")
    ap.add_argument("-d", "--duration", type=float, required=True, help="chunk length in seconds")
    ap.add_argument("-o", "--output", default="split_output.zip")
    ap.add_argument("--audio-format", default="wav")
    ap.add_argument("--audio-bitrate", type=int, default=192, choices=[64, 128, 192, 256, 320],
                    help="lossy bitrate in kbps (ignored for wav/flac)")
    ap.add_argument("--fast-video", action="store_true", help="stream copy (keyframe-snapped cuts)")
    ap.add_argument("--video-output", choices=["video", "audio"], default="video",
                    help="split videos as-is, or extract their audio into padded clips")
    ap.add_argument("--single-folder", action="store_true",
                    help="put all clips at the zip root with unique names (default: one folder per source)")
    ap.add_argument("--no-media", action="store_true",
                    help="omit media clips from the zip (requires --mel to keep spectrograms)")
    ap.add_argument("--no-spectrograms", action="store_true",
                    help="omit spectrogram PNGs from the zip even when --mel is on")
    ap.add_argument("--mel", action="store_true", help="also write mel spectrogram PNGs (default speech parameters)")
    a = ap.parse_args()

    include_media = not a.no_media
    include_spectrograms = a.mel and not a.no_spectrograms
    if not include_media and not include_spectrograms:
        ap.error("--no-media needs --mel so the zip still contains spectrogram PNGs")

    cfg = SplitConfig(
        a.duration,
        audio_format=a.audio_format,
        audio_bitrate=a.audio_bitrate,
        accurate_video=not a.fast_video,
        video_output=a.video_output,
        single_folder=a.single_folder,
        include_media=include_media,
        include_spectrograms=include_spectrograms,
        mel=MelConfig() if a.mel else None,
    )
    report = split_media(
        a.inputs, cfg, a.output,
        on_progress=lambda d, t, name: print(f"[{d}/{t}] {name}", end="\r"),
    )
    print(f"\n{report.total_chunks} chunks -> {report.zip_path}")
    for r in report.failed:
        print(f"FAILED {r.source}: {r.error}")


if __name__ == "__main__":
    main()
