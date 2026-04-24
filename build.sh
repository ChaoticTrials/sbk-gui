#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# sbk-gui — full build script
# Tested on Linux. macOS and Windows (Git Bash /
# WSL) should work with the same prerequisites.
# ──────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
die()     { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ── 1. Rust ────────────────────────────────────
if ! command -v cargo &>/dev/null; then
    info "Rust not found — installing via rustup..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path
    # shellcheck source=/dev/null
    source "$HOME/.cargo/env"
fi

if ! command -v cargo &>/dev/null; then
    # rustup modifies PATH only in new shells; source env manually
    source "$HOME/.cargo/env" 2>/dev/null || true
fi

command -v cargo &>/dev/null || die "cargo still not found after rustup install. Open a new shell and re-run."
info "Rust $(rustc --version)"

# ── 2. Node ≥ 24 ──────────────────────────────
need_node_version=24

check_node() {
    if command -v node &>/dev/null; then
        local ver
        ver=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
        [[ "$ver" -ge "$need_node_version" ]]
    else
        return 1
    fi
}

if ! check_node; then
    # Try nvm
    NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    if [[ -s "$NVM_DIR/nvm.sh" ]]; then
        # shellcheck source=/dev/null
        source "$NVM_DIR/nvm.sh"
        info "Switching to Node $need_node_version via nvm..."
        nvm install "$need_node_version" --no-progress
        nvm use "$need_node_version"
    else
        die "Node >= $need_node_version is required but not found, and nvm is not installed.\nInstall Node $need_node_version from https://nodejs.org or install nvm first."
    fi
fi

check_node || die "Node >= $need_node_version required. Current: $(node --version 2>/dev/null || echo 'not found')"
info "Node $(node --version)"

# ── 3. Linux system dependencies ──────────────
if [[ "$(uname -s)" == "Linux" ]]; then
    missing_pkgs=()
    for pkg in \
        libwebkit2gtk-4.1-dev \
        libgtk-3-dev \
        librsvg2-dev \
        patchelf \
        libssl-dev \
        pkg-config \
        build-essential \
        curl \
        file \
        libdbus-1-3; do
        dpkg -s "$pkg" &>/dev/null 2>&1 || missing_pkgs+=("$pkg")
    done

    if [[ ${#missing_pkgs[@]} -gt 0 ]]; then
        warn "Missing system packages: ${missing_pkgs[*]}"
        if command -v apt-get &>/dev/null; then
            info "Installing via apt-get (sudo required)..."
            sudo apt-get update -qq
            sudo apt-get install -y "${missing_pkgs[@]}"
        else
            die "Please install the missing packages manually:\n  ${missing_pkgs[*]}"
        fi
    else
        info "All system dependencies present."
    fi
fi

# ── 4. npm install ─────────────────────────────
info "Installing npm dependencies..."
npm install

# ── 5. Build ───────────────────────────────────
info "Building sbk-gui (this may take a while on first run)..."
npm run tauri build

info ""
info "Build complete. Artifacts are in src-tauri/target/release/bundle/"

