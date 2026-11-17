"""Build small demo GIFs for the homepage cards.

python make_gifs.py <frames_root>
  <frames_root>/fr_zigzag, fr_forest : frames from record.mjs (NNN_<ms>.jpg)
Existing GIFs from the project repos are re-encoded at the same size.
"""
import glob
import os
import pathlib
import sys

from PIL import Image, ImageSequence

W = 480  # cards are ~220 px wide; 480 keeps them sharp on hi-dpi screens
OUT = pathlib.Path(__file__).resolve().parents[2] / "img" / "demos"
DOCS = pathlib.Path.home() / "Documents"


def fit(im):
    im = im.convert("RGB")
    h = round(im.height * W / im.width)
    return im.resize((W, h), Image.LANCZOS)


def save(frames, durs, name, colors=96, start=0):
    # rotate so the GIF's first (poster) frame shows content, not a blank loading screen
    frames, durs = frames[start:] + frames[:start], durs[start:] + durs[:start]
    pal = [f.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE) for f in frames]
    p = OUT / f"{name}.gif"
    pal[0].save(p, save_all=True, append_images=pal[1:], duration=durs, loop=0, optimize=True, disposal=1)
    print(f"{name}.gif {frames[0].size} {len(frames)} frames {os.path.getsize(p)//1024} KB")


def from_frames(folder, name, colors=96, step=1, start=0, crop=None):
    fs = sorted(glob.glob(os.path.join(folder, "*.jpg")))
    keep = [f for i, f in enumerate(fs) if i % step == 0 or i == len(fs) - 1]
    frames = [fit(Image.open(f).crop(crop) if crop else Image.open(f)) for f in keep]
    # a dropped frame's time goes to the frame kept before it
    durs = [int(pathlib.Path(f).stem.split("_")[1]) * (step if 0 < i < len(keep) - 1 else 1) for i, f in enumerate(keep)]
    save(frames, durs, name, colors, start % len(frames))


def from_gif(path, name, colors=96, step=1, start=0):
    src = Image.open(path)
    frames, durs = [], []
    for i, fr in enumerate(ImageSequence.Iterator(src)):
        d = fr.info.get("duration", 100)
        if i % step:
            durs[-1] += d
            continue
        frames.append(fit(fr.copy()))
        durs.append(d)
    save(frames, durs, name, colors, start)


if __name__ == "__main__":
    root = sys.argv[1]
    OUT.mkdir(parents=True, exist_ok=True)
    from_frames(os.path.join(root, "fr_zigzag"), "zigzagnetvis")
    from_frames(os.path.join(root, "fr_forest"), "forestvis", colors=64, step=2, start=-1)
    from_gif(DOCS / "ClinicalPath_web/media/clinicalpath_web.gif", "clinicalpath")
    from_gif(DOCS / "dynetvis-web/docs/demo.gif", "dynetvis")
    # LargeNetVis: only the left part of the 1440x810 window holds the views
    from_frames(os.path.join(root, "fr_lnv"), "largenetvis", crop=(0, 30, 960, 630))
