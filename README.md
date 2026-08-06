# epubkit-selfhost

[![Build and Publish Docker Image](https://github.com/malv-ryx/epubkit-selfhost/actions/workflows/docker.yml/badge.svg)](https://github.com/malv-ryx/epubkit-selfhost/actions/workflows/docker.yml)
[![GHCR Container](https://img.shields.io/badge/GHCR-ghcr.io%2Fmalv--ryx%2Fepubkit--selfhost-2088FF?logo=github)](https://github.com/malv-ryx/epubkit-selfhost/pkgs/container/epubkit-selfhost)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A self-hostable, web-based EPUB optimizer tailored for **XTEINK X4**, **X4 Pro**, and **X3** e-ink readers. Just drop in any EPUB file(s) to generate clean, ultra-lightweight e-book files ready for your XTEINK device.

This repository is a self-hosting friendly fork of [b1rdmania/epubkit](https://github.com/b1rdmania/epubkit). It features a revised **Docker environment compiled for broad x86-64 CPU compatibility** (eliminating `SIGILL` / Code 132 AVX instruction crashes on virtualized VPS hosts and older CPUs), an enhanced **Pitch Black OLED Dark Mode UI**, interactive option tooltips, batch upload management, and automated CI/CD builds via GitHub Container Registry (GHCR).

---

## 🚀 Quick Start (Deploy in 30 Seconds)

You do **not** need to clone the source code or build anything locally. You can run the pre-built container directly from GHCR.

### Option A: Single Docker Command

```bash
docker run -d \
  --name epubkit \
  -p 8003:8000 \
  --restart unless-stopped \
  ghcr.io/malv-ryx/epubkit-selfhost:latest
```

Open `http://localhost:8003` (or `http://YOUR-SERVER-IP:8003`) in your web browser.

---

### Option B: Docker Compose

Create a file named `docker-compose.yml`:

```yaml
services:
  epubkit:
    image: ghcr.io/malv-ryx/epubkit-selfhost:latest
    container_name: epubkit
    restart: unless-stopped
    ports:
      - "8003:8000"
```

Start the container:

```bash
docker compose up -d
```

---

### Option C: Build from Source (Local Development)

If you want to modify the code or build the image locally on your machine:

1. Clone this repository:
```bash
git clone https://github.com/malv-ryx/epubkit-selfhost.git
cd epubkit-selfhost
```

2. Start using Docker Compose:
```bash
docker compose up -d --build
```

---

## ✨ Web UI & Enhancements

* 🌓 **Theme Switcher**: Instant toggle between Light Mode and pitch-black **OLED Dark Mode** (`#000000`) with high-contrast typography.
* 📦 **Batch Controls**: Upload multiple EPUB files with **`+ Add Files`**, **`Clear All`**, and **`↺ Revert`** metadata editing controls.
* 🎉 **Total Savings Banner**: Displays aggregated storage savings (e.g. `Saved 24.5 MB across 3 books — 82.8% reduction`).
* 🔍 **Collapsible Log Drawer**: Detailed image resolution logs (`clamped 1456x2200 → 480x640`) are neatly tucked inside an expandable drawer.
* ⓘ **Interactive Tooltips**: Hover over technical toggles to inspect device quantization parameters.
* 🔒 **DRM Detection**: Early warning badge for Adobe/Kobo DRM-encrypted books.

---

## ⚙️ Features & Processing Pipeline

`epubkit` runs an automated 20-step optimization pipeline on every uploaded EPUB:

| Step | Feature | Description |
| :---: | :--- | :--- |
| **1** | **DRM Check** | Detects DRM-protected files and stops early with a clear warning badge. |
| **2** | **Fast Selective Extract** | Reads OPF, XML, and cover previews directly from the ZIP stream in ~10ms. |
| **3** | **Parse Structure** | Locates OPF package manifests and builds single-pass DOM reference maps. |
| **4** | **Read Metadata** | Extracts title, author, series, language, and cover image paths. |
| **5** | **Apply Edits** | Overwrites title and author metadata if edited directly in the web UI. |
| **6** | **Catalog Content** | Maps all XHTML, CSS, image, and font files in the EPUB. |
| **7** | **Process Images** | Single-pass resizing to target device screen (X4/X4 Pro: 480x800, X3: 528x792, max 1024x1024), 4-level hardware grayscale quantization with Floyd-Steinberg dithering, autocontrast histogram stretching, and contrast boost. Light Novel mode rotates/splits landscape double-page spreads. |
| **8** | **Fix SVG Covers** | Unwraps SVG-wrapped cover images (common in Gutenberg & store EPUBs). |
| **9** | **Generate Cover** | Creates a clean title/author cover image if none exists. |
| **10** | **Update References** | Rewrites internal hrefs and srcs to match processed baseline JPEGs. |
| **11** | **Repair HTML & Strip Attributes** | Single-pass DOM traversal with `lxml`; strips bloat attributes (`data-*`, `aria-*`, `role`, `tabindex`) to save RAM. |
| **12** | **Remove Unused CSS** | Scans XHTML files and strips CSS rules that don't match content elements. |
| **13** | **Remove Embedded Fonts** | Strips `@font-face` rules, deletes font files (`.ttf`, `.otf`, `.woff`), and cleans OPF manifests. |
| **14** | **Normalize Whitespace** | Removes excessive empty divs/paragraphs, adds `page-break-before` to chapter headings. |
| **15** | **Text Cleanup** | Fast-path fix for double spaces, OCR ligatures (`fi`, `fl`, `ffi`), smart quotes, mojibake encoding errors, and Unicode NFC normalization. |
| **16** | **Clean Metadata** | Removes store-specific bloat tags (Calibre, iBooks, Kindle, Amazon, Kobo). |
| **17** | **Fix TOC** | Validates Table of Contents; generates one from headings if missing. |
| **18** | **Clean OS Artifacts** | Removes `.DS_Store`, `Thumbs.db`, `__MACOSX`, and `desktop.ini`. |
| **19** | **Repackage** | Rebuilds EPUB ZIP with correct mimetype entry and deflate compression. |
| **20** | **Output Filename** | Generates a clean `Author - Title.epub` output file. |

---

## 📱 Hardware & Device Targets

Tailored for [XTEINK X4 / X4 Pro](https://xteink.com/) and [XTEINK X3](https://www.xteink.com/products/xteink-x3) e-ink readers running custom firmware like [CrossPoint](https://github.com/crosspoint-reader/crosspoint-reader).

| Spec | XTEINK X4 & X4 Pro Target | XTEINK X3 Target |
| :--- | :--- | :--- |
| **Display** | 480x800 portrait (4.3" panel) | 528x792 portrait (3.7" panel) |
| **Grayscale** | 4 levels (SSD1677): black, dark gray, light gray, white | 4-level SSD1677 hardware |
| **Processor** | ESP32-C3 @ 160MHz | ESP32-C3 |
| **Usable RAM** | ~380KB | ~380KB |
| **Max Image** | 1024x1024 px | 1024x1024 px |

*Note: The optimizer works for any e-ink reader or custom firmware that renders EPUB files!*

---

## 🛠️ Tech Stack

* **[FastAPI](https://fastapi.tiangolo.com/)** — Async Python backend framework
* **[Pillow](https://python-pillow.org/)** — Image quantization & dithering
* **[lxml](https://lxml.de/)** — High-performance XML/HTML parsing & cleanup
* **[cssutils](https://cssutils.readthedocs.io/)** — CSS parser & optimizer
* **Server-Sent Events (SSE)** — Real-time progress updates in the web UI

---

## 📢 DRM Notice

`epubkit` cannot process DRM-protected files. It will automatically detect DRM and notify you with a warning badge. You must strip DRM prior to uploading (e.g., using Calibre with DeDRM tools).

---

## 🙏 Credits & Acknowledgements

* **Original Creator**: Developed by [@b1rdmania](https://github.com/b1rdmania) ([b1rdmania/epubkit](https://github.com/b1rdmania/epubkit)).
* **Self-Host Fork & Optimizations**: Maintained by [@malv-ryx](https://github.com/malv-ryx/).
* Inspired by tools & workflows from:
  * [zgredex/baseline_jpg_converter](https://github.com/zgredex/baseline_jpg_converter)
  * [CrossPoint Reader](https://github.com/crosspoint-reader/crosspoint-reader)
  * [kxrz/calibre_workflow](https://github.com/kxrz/calibre_workflow)
  * [bigbag/papyrix-reader](https://github.com/bigbag/papyrix-reader)

---

## 📄 License

[MIT License](LICENSE)
