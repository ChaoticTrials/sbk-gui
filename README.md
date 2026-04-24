# sbk-gui

A desktop archive browser for `.sbk` files. Lets you browse, search, and extract Minecraft world archives created by 
[sbk](https://github.com/ChaoticTrials/sbk) without the command line.

## Features

- **Folder navigation** — browse the archive tree with a breadcrumb path bar and double-click to enter directories
- **File table** — sortable columns (name, type, compressed size, modified time) with resizable widths
- **Extraction** — extract selected files, a quick-extract to the archive's directory, or extract everything; strips path prefix optionally so files land flat in the target folder
- **3-phase progress** — live Decompressing / XZ·ZSTD Decode / Writing progress bars with ETA during extraction; cancel at any point
- **Open in app** — extract a single file to a temp directory and open it with the system default application
- **Name search** — filter the current folder by filename; optionally search across the whole archive
- **Region search** — filter `.mca` files by block coordinates (X/Z) or a block coordinate range; automatically resolves to region filenames
- **Properties** — per-file details: path, type, compressed size, original size, compression ratio, modified time
- **Settings** — prettify extracted JSON, flat extract toggle, extraction thread count, UI scale (0.75–3.0×)

## How to Install

### Linux (apt)

```bash
curl -fsSL https://repo.chaotictrials.de/apt-keyring.gpg \
  | sudo tee /usr/share/keyrings/chaotictrials.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/chaotictrials.gpg] https://repo.chaotictrials.de/ stable main" \
  | sudo tee /etc/apt/sources.list.d/chaotictrials.list
sudo apt update
sudo apt install sbk-gui
```

Alternatively, download the `.deb` directly from the [Releases](https://github.com/ChaoticTrials/sbk-gui/releases) page.

### Windows

Download the `.msi` installer from the [Releases](https://github.com/ChaoticTrials/sbk-gui/releases) page.

### macOS

Download the `.dmg` from the [Releases](https://github.com/ChaoticTrials/sbk-gui/releases) page.

## Building

Requires [Rust](https://www.rust-lang.org/tools/install), [Node.js](https://nodejs.org/) ≥ 24, and [Tauri CLI v2](https://tauri.app/start/prerequisites/).

```bash
npm install
npm run tauri build
# installer/binary at: src-tauri/target/release/bundle/
```

Easier:
```bash
./build.sh
# installer/binary at: src-tauri/target/release/bundle/
```

For development:

```bash
npm run tauri dev
```

## Usage

Open an `.sbk` file via **File → Open** (or drag it onto the window). The archive contents appear as a folder tree.

### Navigating

- Double-click a folder to enter it; use the breadcrumb bar or backspace to go up
- Click column headers to sort; drag column edges to resize

### Extracting

Right-click any selection to open the context menu:

| Action            | Description                                                           |
|-------------------|-----------------------------------------------------------------------|
| Extract Selected... | Choose a destination folder; extracts only the selected files/folders |
| Quick Extract     | Extracts selected files next to the archive (no dialog)               |
| Extract All...    | Choose a destination folder; extracts everything                      |

With **Extract relative to current folder** enabled in settings, the current navigation path is stripped from extracted file paths.

### Region search

Click the grid icon in the toolbar to open the Region Search panel. Enter a block X/Z coordinate (or enable Range for a bounding box) and the file list filters to only the `.mca` files that contain those chunks.

## Settings

| Setting                            | Default        | Description                                                     |
|------------------------------------|----------------|-----------------------------------------------------------------|
| Prettify extracted JSON            | off            | Re-formats JSON files with indentation after extraction         |
| Extract relative to current folder | off            | Strips the current navigation path from extracted file paths    |
| Extraction threads                 | Auto (½ cores) | Number of worker threads; auto uses half the logical core count |
| UI Scale                           | 1.0×           | Scales the entire interface (0.75–3.0×)                         |

Settings are stored at `~/.local/share/de.chaotictrials.sbk-gui/settings.json` (Linux), `%APPDATA%\de.chaotictrials.sbk-gui\settings.json` (Windows), or `~/Library/Application Support/de.chaotictrials.sbk-gui/settings.json` (macOS).
