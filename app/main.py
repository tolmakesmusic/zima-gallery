"""Galerie für ZimaOS – Backend.

Alle Daten liegen außerhalb des Containers:
  /data  -> Datenbank, Vorschaubilder, Logos   (Host: /DATA/AppData/zima-gallery)
  /media -> Fotos & Videos                     (Host: /DATA/Gallery)
Dadurch kann das Image jederzeit aktualisiert werden, ohne dass etwas verloren geht.
"""
import hashlib
import json
import logging
import mimetypes
import os
import re
import shutil
import sqlite3
import subprocess
import tempfile
import threading
import time
import uuid
import zipfile
from contextlib import asynccontextmanager, contextmanager
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

from fastapi import Body, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, HTMLResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageOps
from starlette.background import BackgroundTask

try:
    import pillow_heif

    pillow_heif.register_heif_opener()
except Exception:  # pragma: no cover
    pass

APP_VERSION = "1.0.0"
SCHEMA_VERSION = 1
log = logging.getLogger("galerie")
logging.basicConfig(level=logging.INFO)

DATA = Path(os.environ.get("GALLERY_DATA", "/data"))
MEDIA = Path(os.environ.get("GALLERY_MEDIA", "/media"))
LIB = MEDIA / "Mediathek"
ALB = MEDIA / "Alben"
TRASH = MEDIA / ".papierkorb"
TMP = MEDIA / ".tmp"
THUMBS = DATA / "thumbs"
PREV = DATA / "previews"
LOGOS = DATA / "logos"
DB_PATH = DATA / "gallery.db"
STATIC = Path(__file__).parent / "static"

IMG_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif", ".bmp", ".tif", ".tiff", ".avif"}
VID_EXT = {".mp4", ".mov", ".m4v", ".avi", ".mkv", ".webm", ".3gp", ".mts"}
ALL_EXT = IMG_EXT | VID_EXT
CONVERT_EXT = {".heic", ".heif", ".tif", ".tiff", ".bmp"}  # nicht in jedem Browser darstellbar
THUMB_SHORT = 360
DEFAULT_SETTINGS = {"order": "desc", "tile": 110, "badges": True, "trash_days": 30}
IMPORT_LOCK = threading.Lock()
SCAN = {"running": False, "added": 0, "removed": 0, "albums": 0, "finished": None, "error": None}


# ---------------------------------------------------------------- Datenbank
def db():
    c = sqlite3.connect(DB_PATH, timeout=30, check_same_thread=False)
    c.row_factory = sqlite3.Row
    return c


@contextmanager
def conn():
    c = db()
    try:
        yield c
        c.commit()
    finally:
        c.close()


def init_db():
    with conn() as c:
        c.execute("PRAGMA journal_mode=WAL")
        c.executescript(
            """
            CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT);
            CREATE TABLE IF NOT EXISTS labels(
                id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL,
                color TEXT DEFAULT '#8e8e93', logo TEXT, show_badge INTEGER DEFAULT 1);
            CREATE TABLE IF NOT EXISTS albums(
                id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, date TEXT NOT NULL,
                label_id INTEGER, folder TEXT UNIQUE NOT NULL, cover_id INTEGER, created_at TEXT);
            CREATE TABLE IF NOT EXISTS media(
                id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT UNIQUE NOT NULL, filename TEXT,
                kind TEXT, mime TEXT, size INTEGER, width INTEGER, height INTEGER, duration REAL,
                taken_at TEXT, imported_at TEXT, hash TEXT, favorite INTEGER DEFAULT 0,
                label_id INTEGER, album_id INTEGER, deleted_at TEXT, screenshot INTEGER DEFAULT 0);
            CREATE INDEX IF NOT EXISTS ix_media_taken ON media(taken_at);
            CREATE INDEX IF NOT EXISTS ix_media_hash ON media(hash);
            CREATE INDEX IF NOT EXISTS ix_media_album ON media(album_id);
            CREATE INDEX IF NOT EXISTS ix_media_label ON media(label_id);
            """
        )
        row = c.execute("SELECT value FROM meta WHERE key='schema'").fetchone()
        if row is None:
            # Erster Start: Beispiel-Labels anlegen
            for name, color in [("Snapchat", "#FFFC00"), ("WhatsApp", "#25D366"),
                                ("Instagram", "#E1306C"), ("iPhone", "#0A84FF")]:
                c.execute("INSERT OR IGNORE INTO labels(name,color) VALUES(?,?)", (name, color))
            c.execute("INSERT INTO meta VALUES('schema',?)", (str(SCHEMA_VERSION),))
        # Spätere Migrationen hier anhand von int(row['value']) ausführen.


def get_settings(c):
    s = dict(DEFAULT_SETTINGS)
    row = c.execute("SELECT value FROM meta WHERE key='settings'").fetchone()
    if row:
        s.update(json.loads(row["value"]))
    return s


# ---------------------------------------------------------------- Hilfsfunktionen
BAD_CHARS = re.compile(r'[\\/:*?"<>|\x00-\x1f]')


def safe(name: str) -> str:
    name = BAD_CHARS.sub("_", name).strip().strip(".")
    return name[:180] or "datei"


def now_s() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def rel(p: Path) -> str:
    return p.relative_to(MEDIA).as_posix()


def unique_path(d: Path, name: str) -> Path:
    p = d / name
    stem, ext = os.path.splitext(name)
    i = 1
    while p.exists():
        p = d / f"{stem} ({i}){ext}"
        i += 1
    return p


def lib_dir(taken: str) -> Path:
    return LIB / taken[:4] / taken[5:7]


def prune(d: Path):
    """Leere Unterordner in Mediathek/Papierkorb aufräumen (Alben bleiben bestehen)."""
    for root in (LIB, TRASH):
        try:
            d.relative_to(root)
        except ValueError:
            continue
        while d != root and d.exists() and not any(d.iterdir()):
            d.rmdir()
            d = d.parent


def quick_hash(p: Path) -> str:
    size = p.stat().st_size
    h = hashlib.sha1(str(size).encode())
    with open(p, "rb") as f:
        h.update(f.read(1 << 20))
        if size > 2 << 20:
            f.seek(-(1 << 20), 2)
            h.update(f.read(1 << 20))
    return h.hexdigest()


def thumb_path(mid: int) -> Path:
    return THUMBS / str(mid // 1000) / f"{mid}.jpg"


def prev_path(mid: int) -> Path:
    return PREV / str(mid // 1000) / f"{mid}.jpg"


def drop_cache(mid: int):
    for p in (thumb_path(mid), prev_path(mid)):
        p.unlink(missing_ok=True)


# ---------------------------------------------------------------- Datum & Metadaten
def valid_dt(y, mo, d, H=0, M=0, S=0):
    try:
        dt = datetime(int(y), int(mo), int(d), int(H), int(M), int(S))
    except (ValueError, TypeError):
        return None
    if dt.year < 1971 or dt > datetime.now() + timedelta(days=2):
        return None
    return dt


def parse_exif_dt(s):
    if not s:
        return None
    if isinstance(s, bytes):
        s = s.decode(errors="ignore")
    m = re.match(r"\s*(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})", str(s))
    return valid_dt(*m.groups()) if m else None


def parse_iso(s):
    if not s:
        return None
    try:
        t = str(s).strip().replace("Z", "+00:00")
        t = re.sub(r"([+-]\d{2})(\d{2})$", r"\1:\2", t)
        dt = datetime.fromisoformat(t)
    except ValueError:
        return None
    if dt.tzinfo is not None:
        # UTC-Zeit -> lokale Zeit; Zeit mit eigenem Offset (iPhone) = Ortszeit der Aufnahme
        dt = dt.astimezone().replace(tzinfo=None) if dt.utcoffset() == timedelta(0) else dt.replace(tzinfo=None)
    return valid_dt(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second)


NAME_RX = [
    re.compile(r"(?<!\d)((?:19|20)\d{2})[-_.]?(\d{2})[-_.]?(\d{2})[ _T.-]?(\d{2})[-_.:h]?(\d{2})[-_.:m]?(\d{2})(?!\d)"),
    re.compile(r"(?<!\d)((?:19|20)\d{2})[-_.]?(\d{2})[-_.]?(\d{2})(?!\d)"),
]


def date_from_name(name: str):
    for rx in NAME_RX:
        for m in rx.finditer(name):
            dt = valid_dt(*m.groups())
            if dt:
                return dt
    return None


def image_meta(p: Path) -> dict:
    r = {"w": None, "h": None, "dt": None, "camera": False, "dur": None}
    try:
        with Image.open(p) as im:
            w, h = im.size
            ex = im.getexif()
            dt = None
            try:
                sub = ex.get_ifd(0x8769)
                dt = parse_exif_dt(sub.get(36867) or sub.get(36868))
            except Exception:
                pass
            dt = dt or parse_exif_dt(ex.get(306))
            if ex.get(274) in (5, 6, 7, 8):
                w, h = h, w
            r.update(w=w, h=h, dt=dt, camera=bool(ex.get(271) or ex.get(272)))
    except Exception as e:
        log.warning("Bild-Metadaten fehlgeschlagen %s: %s", p, e)
    return r


def video_meta(p: Path) -> dict:
    r = {"w": None, "h": None, "dt": None, "camera": False, "dur": None}
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", str(p)],
            capture_output=True, timeout=60).stdout
        j = json.loads(out or b"{}")
    except Exception:
        return r
    fmt = j.get("format", {})
    tags = {k.lower(): v for k, v in (fmt.get("tags") or {}).items()}
    try:
        r["dur"] = float(fmt.get("duration"))
    except (TypeError, ValueError):
        pass
    for s in j.get("streams", []):
        if s.get("codec_type") != "video":
            continue
        w, h = s.get("width"), s.get("height")
        st = {k.lower(): v for k, v in (s.get("tags") or {}).items()}
        rot = 0
        try:
            rot = int(float(st.get("rotate", 0)))
        except ValueError:
            pass
        for sd in s.get("side_data_list") or []:
            if "rotation" in sd:
                try:
                    rot = int(float(sd["rotation"]))
                except ValueError:
                    pass
        if abs(rot) % 180 == 90:
            w, h = h, w
        r["w"], r["h"] = w, h
        if not tags.get("creation_time") and st.get("creation_time"):
            tags["creation_time"] = st["creation_time"]
        break
    r["dt"] = parse_iso(tags.get("com.apple.quicktime.creationdate")) or parse_iso(tags.get("creation_time"))
    return r


SHOT_RX = re.compile(r"screen ?shot|bildschirmfoto|screenrecord|bildschirmaufnahme|screen_recording", re.I)


def build_record(p: Path, name: str, fallback=None) -> dict:
    ext = Path(name).suffix.lower()
    kind = "video" if ext in VID_EXT else "image"
    m = video_meta(p) if kind == "video" else image_meta(p)
    taken = m["dt"] or date_from_name(name) or fallback or datetime.fromtimestamp(p.stat().st_mtime)
    mime = mimetypes.guess_type(name)[0] or ("video/mp4" if kind == "video" else "image/jpeg")
    if ext in (".heic", ".heif"):
        mime = "image/heic"
    shot = bool(SHOT_RX.search(name)) or (ext == ".png" and not m["camera"])
    return {"kind": kind, "mime": mime, "w": m["w"], "h": m["h"], "dur": m["dur"],
            "taken": taken.strftime("%Y-%m-%d %H:%M:%S"), "shot": int(shot)}


def insert_media(c, rec, path: Path, h, label_id, album_id):
    cur = c.execute(
        """INSERT INTO media(path,filename,kind,mime,size,width,height,duration,taken_at,imported_at,
           hash,label_id,album_id,screenshot) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (rel(path), path.name, rec["kind"], rec["mime"], path.stat().st_size, rec["w"], rec["h"],
         rec["dur"], rec["taken"], now_s(), h, label_id, album_id, rec["shot"]))
    return cur.lastrowid


def import_one(c, src: Path, name: str, label_id, album, fallback) -> str:
    base = Path(name).name
    if Path(base).suffix.lower() not in ALL_EXT or base.startswith("."):
        return "skipped"
    with IMPORT_LOCK:
        h = quick_hash(src)
        if c.execute("SELECT 1 FROM media WHERE hash=? AND deleted_at IS NULL", (h,)).fetchone():
            return "duplicate"
        rec = build_record(src, base, fallback)
        dest_dir = (ALB / album["folder"]) if album else lib_dir(rec["taken"])
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = unique_path(dest_dir, safe(base))
        shutil.move(str(src), dest)
        insert_media(c, rec, dest, h, label_id, album["id"] if album else None)
        c.commit()
    return "imported"


def import_zip(c, zp: Path, label_id, album, res):
    with zipfile.ZipFile(zp) as z:
        for info in z.infolist():
            if info.is_dir():
                continue
            base = Path(info.filename).name
            if "__MACOSX" in info.filename or base.startswith("."):
                continue
            if Path(base).suffix.lower() not in ALL_EXT:
                res["skipped"] += 1
                continue
            tmp = zp.parent / f"z_{uuid.uuid4().hex}{Path(base).suffix}"
            try:
                with z.open(info) as src, open(tmp, "wb") as out:
                    shutil.copyfileobj(src, out, 1 << 20)
                res[import_one(c, tmp, base, label_id, album, valid_dt(*info.date_time))] += 1
            except Exception as e:
                res["error"] += 1
                res["errors"].append(f"{base}: {e}")
            finally:
                tmp.unlink(missing_ok=True)


# ---------------------------------------------------------------- Dateien verschieben
def move_file(c, r, dest_dir: Path):
    src = MEDIA / r["path"]
    dest_dir.mkdir(parents=True, exist_ok=True)
    if src.parent == dest_dir:
        return
    dest = unique_path(dest_dir, r["filename"])
    if src.exists():
        shutil.move(str(src), dest)
    c.execute("UPDATE media SET path=?, filename=? WHERE id=?", (rel(dest), dest.name, r["id"]))
    prune(src.parent)


def album_folder(date: str, label_name: Optional[str], name: str) -> str:
    return safe(" ".join(x for x in (date, label_name, name) if x))


def label_name(c, lid):
    if not lid:
        return None
    r = c.execute("SELECT name FROM labels WHERE id=?", (lid,)).fetchone()
    return r["name"] if r else None


def rename_album(c, a, new_folder: str):
    if new_folder == a["folder"]:
        return
    old, new = ALB / a["folder"], ALB / new_folder
    if new.exists():
        raise HTTPException(409, f"Ordner „{new_folder}“ existiert bereits")
    if old.exists():
        old.rename(new)
    else:
        new.mkdir(parents=True)
    oldp, newp = rel(old) + "/", rel(new) + "/"
    for r in c.execute("SELECT id, path FROM media WHERE album_id=?", (a["id"],)).fetchall():
        if r["path"].startswith(oldp):
            c.execute("UPDATE media SET path=? WHERE id=?", (newp + r["path"][len(oldp):], r["id"]))
    c.execute("UPDATE albums SET folder=? WHERE id=?", (new_folder, a["id"]))


def refresh_album_folder(c, aid):
    a = c.execute("SELECT * FROM albums WHERE id=?", (aid,)).fetchone()
    if a:
        rename_album(c, a, album_folder(a["date"], label_name(c, a["label_id"]), a["name"]))


def purge_media(c, r):
    p = MEDIA / r["path"]
    p.unlink(missing_ok=True)
    prune(p.parent)
    drop_cache(r["id"])
    c.execute("DELETE FROM media WHERE id=?", (r["id"],))


# ---------------------------------------------------------------- Vorschaubilder
def _save_jpeg(im: Image.Image, out: Path, short: int, quality: int, long_max: Optional[int] = None):
    im = ImageOps.exif_transpose(im)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        im = bg
    else:
        im = im.convert("RGB")
    w, h = im.size
    scale = short / min(w, h) if short else 1
    if long_max:
        scale = min(scale, long_max / max(w, h))
    if scale < 1:
        im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(f".{uuid.uuid4().hex}.tmp")
    im.save(tmp, "JPEG", quality=quality, optimize=True)
    os.replace(tmp, out)


def make_thumb(r, out: Path):
    src = MEDIA / r["path"]
    try:
        if r["kind"] == "video":
            out.parent.mkdir(parents=True, exist_ok=True)
            tmp = out.with_suffix(f".{uuid.uuid4().hex}.jpg")
            ss = "1" if (r["duration"] or 0) > 2 else "0"
            vf = f"scale='if(gt(iw,ih),-2,{THUMB_SHORT})':'if(gt(iw,ih),{THUMB_SHORT},-2)'"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", ss, "-i", str(src),
                            "-frames:v", "1", "-vf", vf, "-q:v", "4", str(tmp)], timeout=90)
            if tmp.exists() and tmp.stat().st_size > 0:
                os.replace(tmp, out)
                return
            raise RuntimeError("ffmpeg lieferte kein Bild")
        with Image.open(src) as im:
            im.draft("RGB", (THUMB_SHORT * 2, THUMB_SHORT * 2))
            _save_jpeg(im, out, THUMB_SHORT, 78)
    except Exception as e:
        log.warning("Vorschau fehlgeschlagen %s: %s", src, e)
        _save_jpeg(Image.new("RGB", (THUMB_SHORT, THUMB_SHORT), (60, 60, 64)), out, 0, 60)


def ranged_file(path: Path, request: Request, mime: str, download: Optional[str] = None):
    if not path.exists():
        raise HTTPException(404, "Datei nicht gefunden")
    size = path.stat().st_size
    rng = request.headers.get("range")
    m = re.match(r"bytes=(\d*)-(\d*)", rng or "")
    if not m or (not m.group(1) and not m.group(2)):
        return FileResponse(path, media_type=mime, filename=download,
                            content_disposition_type="attachment" if download else "inline",
                            headers={"Accept-Ranges": "bytes"})
    if m.group(1):
        start = int(m.group(1))
        end = min(int(m.group(2)) if m.group(2) else size - 1, size - 1)
    else:
        start, end = max(0, size - int(m.group(2))), size - 1
    if start >= size or start > end:
        return Response(status_code=416, headers={"Content-Range": f"bytes */{size}"})

    def gen():
        with open(path, "rb") as f:
            f.seek(start)
            left = end - start + 1
            while left > 0:
                chunk = f.read(min(1 << 20, left))
                if not chunk:
                    break
                left -= len(chunk)
                yield chunk

    return StreamingResponse(gen(), status_code=206, media_type=mime, headers={
        "Accept-Ranges": "bytes", "Content-Range": f"bytes {start}-{end}/{size}",
        "Content-Length": str(end - start + 1)})


# ---------------------------------------------------------------- Hintergrund
def cleanup_loop():
    while True:
        try:
            with conn() as c:
                days = int(get_settings(c)["trash_days"])
                limit = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")
                for r in c.execute("SELECT * FROM media WHERE deleted_at IS NOT NULL AND deleted_at < ?",
                                   (limit,)).fetchall():
                    purge_media(c, r)
            for p in TMP.iterdir():
                if time.time() - p.stat().st_mtime > 86400:
                    shutil.rmtree(p, ignore_errors=True) if p.is_dir() else p.unlink(missing_ok=True)
        except Exception as e:
            log.warning("Aufräumen fehlgeschlagen: %s", e)
        time.sleep(6 * 3600)


def parse_folder(name: str, labels: dict):
    m = re.match(r"^(\d{4}-\d{2}-\d{2})\s+(.+)$", name)
    if not m:
        return None, None, name
    date, rest = m.groups()
    for lname in sorted(labels, key=len, reverse=True):
        if rest.lower().startswith(lname + " "):
            return date, labels[lname], rest[len(lname) + 1:].strip()
    return date, None, rest


def run_scan():
    SCAN.update(running=True, added=0, removed=0, albums=0, error=None)
    try:
        with conn() as c:
            known = {r["path"]: r["id"] for r in c.execute("SELECT id, path FROM media")}
            for p, mid in known.items():
                if not (MEDIA / p).exists():
                    c.execute("DELETE FROM media WHERE id=?", (mid,))
                    drop_cache(mid)
                    SCAN["removed"] += 1
            c.commit()
            labels = {r["name"].lower(): r["id"] for r in c.execute("SELECT id, name FROM labels")}
            albums = {r["folder"]: r for r in c.execute("SELECT * FROM albums")}
            ALB.mkdir(parents=True, exist_ok=True)
            for d in sorted(ALB.iterdir()):
                if d.is_dir() and not d.name.startswith(".") and d.name not in albums:
                    date, lid, name = parse_folder(d.name, labels)
                    date = date or datetime.fromtimestamp(d.stat().st_mtime).strftime("%Y-%m-%d")
                    c.execute("INSERT INTO albums(name,date,label_id,folder,created_at) VALUES(?,?,?,?,?)",
                              (name, date, lid, d.name, now_s()))
                    SCAN["albums"] += 1
            c.commit()
            albums = {r["folder"]: r["id"] for r in c.execute("SELECT id, folder FROM albums")}
            for root, dirs, files in os.walk(MEDIA):
                dirs[:] = [x for x in dirs if not x.startswith(".")]
                for fn in files:
                    p = Path(root) / fn
                    rp = rel(p)
                    if rp in known or fn.startswith(".") or p.suffix.lower() not in ALL_EXT:
                        continue
                    parts = Path(rp).parts
                    aid = albums.get(parts[1]) if parts[0] == "Alben" and len(parts) > 2 else None
                    try:
                        rec = build_record(p, fn)
                        insert_media(c, rec, p, quick_hash(p), None, aid)
                        SCAN["added"] += 1
                        if SCAN["added"] % 50 == 0:
                            c.commit()
                    except Exception as e:
                        log.warning("Scan: %s: %s", p, e)
    except Exception as e:
        SCAN["error"] = str(e)
    finally:
        SCAN.update(running=False, finished=now_s())


# ---------------------------------------------------------------- App
@asynccontextmanager
async def lifespan(_app):
    for d in (DATA, LIB, ALB, TRASH, TMP, THUMBS, PREV, LOGOS):
        d.mkdir(parents=True, exist_ok=True)
    init_db()
    threading.Thread(target=cleanup_loop, daemon=True).start()
    yield


app = FastAPI(title="Galerie", version=APP_VERSION, lifespan=lifespan)


def media_out(r):
    return {"id": r["id"], "k": "v" if r["kind"] == "video" else "i", "t": r["taken_at"],
            "f": r["favorite"], "l": r["label_id"], "a": r["album_id"],
            "d": round(r["duration"]) if r["duration"] else None, "x": r["deleted_at"]}


@app.get("/api/media")
def list_media(album: Optional[int] = None, favorite: int = 0, label: Optional[int] = None,
               kind: Optional[str] = None, screenshots: int = 0, trash: int = 0,
               onthisday: int = 0, year: Optional[int] = None, order: str = "desc"):
    where, args = ["deleted_at IS NOT NULL" if trash else "deleted_at IS NULL"], []
    if album is not None:
        where.append("album_id=?"); args.append(album)
    if favorite:
        where.append("favorite=1")
    if label is not None:
        where.append("label_id IS NULL" if label == 0 else "label_id=?")
        if label:
            args.append(label)
    if kind in ("image", "video"):
        where.append("kind=?"); args.append(kind)
    if screenshots:
        where.append("screenshot=1")
    if onthisday:
        now = datetime.now()
        where.append("substr(taken_at,6,5)=? AND substr(taken_at,1,4)<?")
        args += [now.strftime("%m-%d"), str(now.year)]
    if year:
        where.append("substr(taken_at,1,4)=?"); args.append(str(year))
    o = "ASC" if order == "asc" else "DESC"
    sort = f"deleted_at DESC" if trash else f"taken_at {o}, id {o}"
    with conn() as c:
        rows = c.execute(f"SELECT * FROM media WHERE {' AND '.join(where)} ORDER BY {sort}", args).fetchall()
    return {"items": [media_out(r) for r in rows]}


def get_media(c, mid):
    r = c.execute("SELECT * FROM media WHERE id=?", (mid,)).fetchone()
    if not r:
        raise HTTPException(404, "Medium nicht gefunden")
    return r


@app.get("/api/media/{mid}")
def media_detail(mid: int):
    with conn() as c:
        r = dict(get_media(c, mid))
    return r


@app.get("/api/media/{mid}/thumb")
def media_thumb(mid: int):
    t = thumb_path(mid)
    if not t.exists():
        with conn() as c:
            make_thumb(get_media(c, mid), t)
    return FileResponse(t, media_type="image/jpeg", headers={"Cache-Control": "public, max-age=604800"})


@app.get("/api/media/{mid}/view")
def media_view(mid: int, request: Request):
    with conn() as c:
        r = get_media(c, mid)
    p = MEDIA / r["path"]
    ext = p.suffix.lower()
    if r["kind"] == "image" and ext in CONVERT_EXT:
        out = prev_path(mid)
        if not out.exists():
            with Image.open(p) as im:
                _save_jpeg(im, out, 0, 88, long_max=2560)
        return FileResponse(out, media_type="image/jpeg", headers={"Cache-Control": "public, max-age=604800"})
    mime = "video/mp4" if ext in (".mov", ".m4v") else r["mime"]
    return ranged_file(p, request, mime)


@app.get("/api/media/{mid}/original")
def media_original(mid: int, request: Request, dl: int = 0):
    with conn() as c:
        r = get_media(c, mid)
    return ranged_file(MEDIA / r["path"], request, r["mime"], r["filename"] if dl else None)


@app.post("/api/media/bulk")
def media_bulk(body: dict = Body(...)):
    ids = [int(i) for i in body.get("ids", [])]
    action, value = body.get("action"), body.get("value")
    if not ids:
        return {"ok": True, "count": 0}
    with conn() as c:
        rows = []
        for i in range(0, len(ids), 500):
            chunk = ids[i:i + 500]
            rows += c.execute(f"SELECT * FROM media WHERE id IN ({','.join('?' * len(chunk))})", chunk).fetchall()
        album = None
        if action == "album":
            album = c.execute("SELECT * FROM albums WHERE id=?", (int(value),)).fetchone()
            if not album:
                raise HTTPException(404, "Album nicht gefunden")
        for r in rows:
            if action == "favorite":
                c.execute("UPDATE media SET favorite=? WHERE id=?", (1 if value else 0, r["id"]))
            elif action == "label":
                c.execute("UPDATE media SET label_id=? WHERE id=?", (int(value) if value else None, r["id"]))
            elif action == "album" and r["deleted_at"] is None:
                move_file(c, r, ALB / album["folder"])
                c.execute("UPDATE media SET album_id=? WHERE id=?", (album["id"], r["id"]))
            elif action == "unalbum" and r["album_id"] and r["deleted_at"] is None:
                move_file(c, r, lib_dir(r["taken_at"]))
                c.execute("UPDATE media SET album_id=NULL WHERE id=?", (r["id"],))
            elif action == "date":
                dt = datetime.fromisoformat(str(value)).strftime("%Y-%m-%d %H:%M:%S")
                c.execute("UPDATE media SET taken_at=? WHERE id=?", (dt, r["id"]))
                if r["album_id"] is None and r["deleted_at"] is None:
                    move_file(c, dict(r), lib_dir(dt))
            elif action == "trash" and r["deleted_at"] is None:
                move_file(c, r, TRASH / str(r["id"]))
                c.execute("UPDATE media SET deleted_at=? WHERE id=?", (now_s(), r["id"]))
            elif action == "restore" and r["deleted_at"]:
                a = c.execute("SELECT folder FROM albums WHERE id=?", (r["album_id"],)).fetchone() if r["album_id"] else None
                move_file(c, r, ALB / a["folder"] if a else lib_dir(r["taken_at"]))
                c.execute("UPDATE media SET deleted_at=NULL, album_id=? WHERE id=?",
                          (r["album_id"] if a else None, r["id"]))
            elif action == "purge" and r["deleted_at"]:
                purge_media(c, r)
    return {"ok": True, "count": len(rows)}


@app.post("/api/import")
def api_import(files: List[UploadFile] = File(...), label_id: str = Form(""),
               album_id: str = Form(""), mtimes: str = Form("[]")):
    lid = int(label_id) if label_id.strip() else None
    try:
        mt = json.loads(mtimes)
    except ValueError:
        mt = []
    res = {"imported": 0, "duplicate": 0, "skipped": 0, "error": 0, "errors": []}
    with conn() as c:
        album = c.execute("SELECT * FROM albums WHERE id=?", (int(album_id),)).fetchone() if album_id.strip() else None
        for i, f in enumerate(files):
            fname = Path(f.filename or "datei").name
            fb = None
            if i < len(mt) and mt[i]:
                try:
                    fb = datetime.fromtimestamp(float(mt[i]) / 1000)
                except (ValueError, OSError):
                    pass
            tmpdir = Path(tempfile.mkdtemp(dir=TMP))
            try:
                tp = tmpdir / ("upload" + Path(fname).suffix.lower())
                with open(tp, "wb") as out:
                    shutil.copyfileobj(f.file, out, 1 << 20)
                if fname.lower().endswith(".zip"):
                    import_zip(c, tp, lid, album, res)
                else:
                    res[import_one(c, tp, fname, lid, album, fb)] += 1
            except Exception as e:
                log.exception("Import fehlgeschlagen")
                res["error"] += 1
                res["errors"].append(f"{fname}: {e}")
            finally:
                shutil.rmtree(tmpdir, ignore_errors=True)
    return res


@app.post("/api/download")
def api_download(ids: str = Form(...)):
    id_list = [int(x) for x in ids.split(",") if x.strip().isdigit()]
    fd, tmp = tempfile.mkstemp(suffix=".zip", dir=TMP)
    os.close(fd)
    used = set()
    with conn() as c, zipfile.ZipFile(tmp, "w", zipfile.ZIP_STORED, allowZip64=True) as z:
        for mid in id_list:
            r = c.execute("SELECT * FROM media WHERE id=?", (mid,)).fetchone()
            if not r or not (MEDIA / r["path"]).exists():
                continue
            name, i = r["filename"], 1
            stem, ext = os.path.splitext(name)
            while name.lower() in used:
                name = f"{stem} ({i}){ext}"; i += 1
            used.add(name.lower())
            z.write(MEDIA / r["path"], name)
    return FileResponse(tmp, media_type="application/zip",
                        filename=f"Galerie-{datetime.now():%Y-%m-%d_%H%M}.zip",
                        background=BackgroundTask(os.remove, tmp))


# ---------------------------------------------------------------- Alben
def album_out(c, a):
    cnt = c.execute("SELECT COUNT(*) n FROM media WHERE album_id=? AND deleted_at IS NULL", (a["id"],)).fetchone()["n"]
    cover = a["cover_id"]
    if not cover or not c.execute("SELECT 1 FROM media WHERE id=? AND deleted_at IS NULL", (cover,)).fetchone():
        r = c.execute("SELECT id FROM media WHERE album_id=? AND deleted_at IS NULL ORDER BY taken_at DESC LIMIT 1",
                      (a["id"],)).fetchone()
        cover = r["id"] if r else None
    return {**dict(a), "count": cnt, "cover": cover}


@app.get("/api/albums")
def albums_list():
    with conn() as c:
        return [album_out(c, a) for a in c.execute("SELECT * FROM albums ORDER BY date DESC, name")]


def _album_fields(body):
    name = (body.get("name") or "").strip()
    date = (body.get("date") or "").strip() or datetime.now().strftime("%Y-%m-%d")
    if not name:
        raise HTTPException(400, "Bitte einen Albumnamen angeben")
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date):
        raise HTTPException(400, "Datum muss JJJJ-MM-TT sein")
    lid = int(body["label_id"]) if body.get("label_id") else None
    return name, date, lid


@app.post("/api/albums")
def album_create(body: dict = Body(...)):
    name, date, lid = _album_fields(body)
    with conn() as c:
        folder = album_folder(date, label_name(c, lid), name)
        if (ALB / folder).exists() or c.execute("SELECT 1 FROM albums WHERE folder=?", (folder,)).fetchone():
            raise HTTPException(409, f"Ordner „{folder}“ existiert bereits")
        (ALB / folder).mkdir(parents=True)
        cur = c.execute("INSERT INTO albums(name,date,label_id,folder,created_at) VALUES(?,?,?,?,?)",
                        (name, date, lid, folder, now_s()))
        return album_out(c, c.execute("SELECT * FROM albums WHERE id=?", (cur.lastrowid,)).fetchone())


@app.patch("/api/albums/{aid}")
def album_update(aid: int, body: dict = Body(...)):
    with conn() as c:
        a = c.execute("SELECT * FROM albums WHERE id=?", (aid,)).fetchone()
        if not a:
            raise HTTPException(404, "Album nicht gefunden")
        if "cover_id" in body:
            c.execute("UPDATE albums SET cover_id=? WHERE id=?", (body["cover_id"], aid))
        if "name" in body:
            name, date, lid = _album_fields(body)
            rename_album(c, a, album_folder(date, label_name(c, lid), name))
            c.execute("UPDATE albums SET name=?, date=?, label_id=? WHERE id=?", (name, date, lid, aid))
        return album_out(c, c.execute("SELECT * FROM albums WHERE id=?", (aid,)).fetchone())


@app.delete("/api/albums/{aid}")
def album_delete(aid: int):
    with conn() as c:
        a = c.execute("SELECT * FROM albums WHERE id=?", (aid,)).fetchone()
        if not a:
            raise HTTPException(404, "Album nicht gefunden")
        for r in c.execute("SELECT * FROM media WHERE album_id=?", (aid,)).fetchall():
            if r["deleted_at"] is None:
                move_file(c, r, lib_dir(r["taken_at"]))
            c.execute("UPDATE media SET album_id=NULL WHERE id=?", (r["id"],))
        d = ALB / a["folder"]
        if d.exists() and not any(d.iterdir()):
            d.rmdir()
        c.execute("DELETE FROM albums WHERE id=?", (aid,))
    return {"ok": True}


# ---------------------------------------------------------------- Labels
def label_out(c, r):
    cnt = c.execute("SELECT COUNT(*) n FROM media WHERE label_id=? AND deleted_at IS NULL", (r["id"],)).fetchone()["n"]
    return {**dict(r), "count": cnt, "logo_url": f"/api/labels/{r['id']}/logo?v={r['logo']}" if r["logo"] else None}


@app.get("/api/labels")
def labels_list():
    with conn() as c:
        return [label_out(c, r) for r in c.execute("SELECT * FROM labels ORDER BY name COLLATE NOCASE")]


@app.post("/api/labels")
def label_create(body: dict = Body(...)):
    name = (body.get("name") or "").strip()
    if not name or BAD_CHARS.search(name):
        raise HTTPException(400, "Ungültiger Name (keine Sonderzeichen wie / : * ? \" < > |)")
    with conn() as c:
        try:
            cur = c.execute("INSERT INTO labels(name,color,show_badge) VALUES(?,?,?)",
                            (name, body.get("color") or "#8e8e93", 1 if body.get("show_badge", True) else 0))
        except sqlite3.IntegrityError:
            raise HTTPException(409, "Label existiert bereits")
        return label_out(c, c.execute("SELECT * FROM labels WHERE id=?", (cur.lastrowid,)).fetchone())


@app.patch("/api/labels/{lid}")
def label_update(lid: int, body: dict = Body(...)):
    with conn() as c:
        r = c.execute("SELECT * FROM labels WHERE id=?", (lid,)).fetchone()
        if not r:
            raise HTTPException(404, "Label nicht gefunden")
        name = (body.get("name") or r["name"]).strip()
        if BAD_CHARS.search(name):
            raise HTTPException(400, "Ungültiger Name")
        try:
            c.execute("UPDATE labels SET name=?, color=?, show_badge=? WHERE id=?",
                      (name, body.get("color", r["color"]),
                       1 if body.get("show_badge", bool(r["show_badge"])) else 0, lid))
        except sqlite3.IntegrityError:
            raise HTTPException(409, "Label existiert bereits")
        if name != r["name"]:
            for a in c.execute("SELECT id FROM albums WHERE label_id=?", (lid,)).fetchall():
                refresh_album_folder(c, a["id"])
        return label_out(c, c.execute("SELECT * FROM labels WHERE id=?", (lid,)).fetchone())


@app.delete("/api/labels/{lid}")
def label_delete(lid: int):
    with conn() as c:
        r = c.execute("SELECT * FROM labels WHERE id=?", (lid,)).fetchone()
        if not r:
            raise HTTPException(404, "Label nicht gefunden")
        c.execute("UPDATE media SET label_id=NULL WHERE label_id=?", (lid,))
        affected = [a["id"] for a in c.execute("SELECT id FROM albums WHERE label_id=?", (lid,))]
        c.execute("UPDATE albums SET label_id=NULL WHERE label_id=?", (lid,))
        for aid in affected:
            refresh_album_folder(c, aid)
        if r["logo"]:
            (LOGOS / r["logo"]).unlink(missing_ok=True)
        c.execute("DELETE FROM labels WHERE id=?", (lid,))
    return {"ok": True}


@app.post("/api/labels/{lid}/logo")
def label_logo_upload(lid: int, file: UploadFile = File(...)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in {".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"}:
        raise HTTPException(400, "Logo muss PNG, JPG, WEBP, GIF oder SVG sein")
    with conn() as c:
        r = c.execute("SELECT * FROM labels WHERE id=?", (lid,)).fetchone()
        if not r:
            raise HTTPException(404, "Label nicht gefunden")
        name = f"{lid}-{int(time.time())}{ext}"
        with open(LOGOS / name, "wb") as out:
            shutil.copyfileobj(file.file, out)
        if r["logo"]:
            (LOGOS / r["logo"]).unlink(missing_ok=True)
        c.execute("UPDATE labels SET logo=? WHERE id=?", (name, lid))
        return label_out(c, c.execute("SELECT * FROM labels WHERE id=?", (lid,)).fetchone())


@app.delete("/api/labels/{lid}/logo")
def label_logo_delete(lid: int):
    with conn() as c:
        r = c.execute("SELECT * FROM labels WHERE id=?", (lid,)).fetchone()
        if r and r["logo"]:
            (LOGOS / r["logo"]).unlink(missing_ok=True)
            c.execute("UPDATE labels SET logo=NULL WHERE id=?", (lid,))
    return {"ok": True}


@app.get("/api/labels/{lid}/logo")
def label_logo(lid: int):
    with conn() as c:
        r = c.execute("SELECT logo FROM labels WHERE id=?", (lid,)).fetchone()
    if not r or not r["logo"] or not (LOGOS / r["logo"]).exists():
        raise HTTPException(404, "Kein Logo")
    return FileResponse(LOGOS / r["logo"], headers={"Cache-Control": "public, max-age=2592000"})


# ---------------------------------------------------------------- Sammlung & System
@app.get("/api/memories")
def memories():
    now = datetime.now()
    with conn() as c:
        rows = c.execute(
            """SELECT substr(taken_at,1,4) y, COUNT(*) n, MAX(id) any_id,
               (SELECT id FROM media m2 WHERE m2.deleted_at IS NULL AND substr(m2.taken_at,1,4)=substr(m.taken_at,1,4)
                AND substr(m2.taken_at,6,5)=? AND m2.kind='image' ORDER BY m2.favorite DESC, m2.taken_at LIMIT 1) img
               FROM media m WHERE deleted_at IS NULL AND substr(taken_at,6,5)=? AND substr(taken_at,1,4)<?
               GROUP BY y ORDER BY y DESC""",
            (now.strftime("%m-%d"), now.strftime("%m-%d"), str(now.year))).fetchall()
    return [{"year": int(r["y"]), "ago": now.year - int(r["y"]), "count": r["n"], "cover": r["img"] or r["any_id"]}
            for r in rows]


@app.get("/api/overview")
def overview():
    with conn() as c:
        def q(where, args=()):
            r = c.execute(f"SELECT COUNT(*) n, MAX(id) cover FROM media WHERE deleted_at IS NULL AND {where}",
                          args).fetchone()
            return {"count": r["n"], "cover": r["cover"]}
        trash = c.execute("SELECT COUNT(*) n FROM media WHERE deleted_at IS NOT NULL").fetchone()["n"]
        return {"favorites": q("favorite=1"), "images": q("kind='image'"), "videos": q("kind='video'"),
                "screenshots": q("screenshot=1"), "unlabeled": q("label_id IS NULL"), "trash": trash}


@app.get("/api/settings")
def settings_get():
    with conn() as c:
        return get_settings(c)


@app.put("/api/settings")
def settings_put(body: dict = Body(...)):
    with conn() as c:
        s = get_settings(c)
        s.update({k: v for k, v in body.items() if k in DEFAULT_SETTINGS})
        c.execute("INSERT OR REPLACE INTO meta VALUES('settings',?)", (json.dumps(s),))
        return s


@app.get("/api/info")
def info():
    with conn() as c:
        r = c.execute("""SELECT SUM(kind='image') img, SUM(kind='video') vid, SUM(size) size
                         FROM media WHERE deleted_at IS NULL""").fetchone()
    du = shutil.disk_usage(MEDIA)
    return {"version": APP_VERSION, "images": r["img"] or 0, "videos": r["vid"] or 0, "size": r["size"] or 0,
            "disk_free": du.free, "disk_total": du.total,
            "media_path": os.environ.get("HOST_MEDIA_PATH", str(MEDIA)),
            "data_path": os.environ.get("HOST_DATA_PATH", str(DATA))}


@app.post("/api/scan")
def scan_start():
    if not SCAN["running"]:
        threading.Thread(target=run_scan, daemon=True).start()
        SCAN["running"] = True
    return SCAN


@app.get("/api/scan")
def scan_status():
    return SCAN


@app.get("/", response_class=HTMLResponse)
def index():
    html = (STATIC / "index.html").read_text(encoding="utf-8").replace("__VERSION__", APP_VERSION)
    return HTMLResponse(html, headers={"Cache-Control": "no-cache"})


app.mount("/static", StaticFiles(directory=STATIC), name="static")
