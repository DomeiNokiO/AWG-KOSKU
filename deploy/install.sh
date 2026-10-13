#!/usr/bin/env bash
# AWG-KOSKU — installer otomatis dari nol untuk CT/VM (Debian/Ubuntu).
# Author: AWGNET-RACING & AGENT AI TEAM
#
# Pemakaian:
#   Interaktif :  bash install.sh
#   Satu baris :  curl -fsSL <raw>/deploy/install.sh | bash
#   Otomatis :  PORT=3000 EMAIL=owner@kosku.test SANDI=rahasia bash install.sh
#
# Variabel env (semua opsional; prompt hanya dipakai kalau TTY tersedia):
#   APP_DIR       lokasi install      default /opt/awg-kosku
#   PORT          port HTTP           default 3000
#   EMAIL         email login awal    default owner@kosku.test
#   SANDI         sandi login awal    default: dibuat acak, dicetak SEKALI di ringkasan
#   NAMA          nama pemilik        default "Pemilik Kos"
#   COOKIE_SECURE 1 kalau di belakang HTTPS  default 0
#
# Installer tidak pernah menghapus data yang sudah ada: kalau APP_DIR sudah
# berisi instalasi, ia berhenti dan meminta update manual (git pull).
set -euo pipefail

REPO_URL="https://github.com/DomeiNokiO/AWG-KOSKU.git"
APP_DIR="${APP_DIR:-/opt/awg-kosku}"
SVC="awg-kosku"
SVC_USER="kosku"
MIN_NODE_MAJOR=22          # node:sqlite (DatabaseSync) butuh Node >= 22.5
NODE_MAJOR_TARGET=24        # LTS yang dipasang kalau node kurang

log() { printf '\033[1;34m[AWG-KOSKU]\033[0m %s\n' "$*"; }
gagal() { printf '\033[1;31m[GAGAL]\033[0m %s\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------- 1. prasyarat
[[ "${EUID}" -eq 0 ]] || gagal "Jalankan sebagai root (sudo bash install.sh)."

[[ -r /etc/os-release ]] || gagal "Tidak bisa membaca /etc/os-release (distro tak dikenal)."
# shellcheck disable=SC1091
. /etc/os-release
case "${ID:-}" in
  debian|ubuntu) log "Distro: ${PRETTY_NAME:-$ID}" ;;
  *) gagal "Distro '$ID' belum didukung. Butuh Debian/Ubuntu." ;;
esac

for perintah in git curl tar; do
  command -v "$perintah" >/dev/null 2>&1 || {
    log "Memasang $perintah via apt..."
    apt-get update -qq && apt-get install -y -qq "$perintah"
  }
done

# ---------------------------------------------------------------- 2. Node.js
node_major() { node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0; }

pasang_node() {
  local arch tarball url shasums
  case "$(uname -m)" in
    x86_64)  arch="x64" ;;
    aarch64) arch="arm64" ;;
    armv7l)  arch="armv7l" ;;
    *) gagal "Arsitektur $(uname -m) tidak dikenal." ;;
  esac
  # Nama berkas diambil dari SHASUMS256.txt resmi -> tidak hardcode patch version.
  shasums="$(curl -fsSL "https://nodejs.org/dist/latest-v${NODE_MAJOR_TARGET}.x/SHASUMS256.txt")" \
    || gagal "Gagal mengambil daftar checksum nodejs.org (butuh internet)."
  tarball="$(printf '%s\n' "$shasums" | grep -oE "node-v[0-9.]+-linux-${arch}\\.tar\\.xz" | head -1)"
  [[ -n "$tarball" ]] || gagal "Nama tarball Node tidak ditemukan di SHASUMS256.txt."
  url="https://nodejs.org/dist/latest-v${NODE_MAJOR_TARGET}.x/${tarball}"
  log "Memasang Node ${tarball#node-} ke /opt/node ..."
  local tmp; tmp="$(mktemp -d)"
  curl -fsSL "$url" -o "$tmp/$tarball"
  (cd "$tmp" && printf '%s  %s\n' "$(printf '%s\n' "$shasums" | grep " $tarball$" | cut -d' ' -f1)" "$tarball" | sha256sum -c -) \
    || { rm -rf "$tmp"; gagal "Checksum Node tidak cocok — file rusak/diubah, batal."; }
  tar -xJf "$tmp/$tarball" -C /opt
  rm -rf "$tmp"
  local dir; dir="$(basename "$tarball" .tar.xz)"
  rm -rf /opt/node && mv "/opt/$dir" /opt/node
  ln -sf /opt/node/bin/node /usr/local/bin/node
  ln -sf /opt/node/bin/npm  /usr/local/bin/npm
  ln -rf /opt/node/bin/npx  /usr/local/bin/npx 2>/dev/null || ln -sf /opt/node/bin/npx /usr/local/bin/npx
}

if command -v node >/dev/null 2>&1 && [[ "$(node_major)" -ge "$MIN_NODE_MAJOR" ]]; then
  log "Node terpasang: $(node --version) (>= $MIN_NODE_MAJOR) — lewati pemasangan."
else
  pasang_node
  hash -r
  command -v node >/dev/null 2>&1 || gagal "Node gagal dipasang."
  [[ "$(node_major)" -ge "$MIN_NODE_MAJOR" ]] || gagal "Node $(node --version) terlalu tua (butuh >= $MIN_NODE_MAJOR)."
fi
NODE_BIN_DIR="$(dirname "$(command -v node)")"

# ------------------------------------------------- 3. konfigurasi (env atau TTY)
# Deteksi TTY dengan MENULIS, bukan sekadar cek keberadaan /dev/tty:
# node device selalu ada (termasuk ssh non-pty), tapi menulisnya di sesi
# tanpa controlling terminal GAGAL -> guard ini jatuh ke mode env var.
if [[ -e /dev/tty ]] && { : > /dev/tty; }; then
  tty_rd() { read -r "$1" < /dev/tty || true; }
  if [[ -z "${PORT:-}" ]]; then
    printf 'Port HTTP [3000]: ' > /dev/tty; tty_rd PORT; PORT="${PORT:-3000}"
  fi
  if [[ -z "${EMAIL:-}" ]]; then
    printf 'Email login pemilik [owner@kosku.test]: ' > /dev/tty; tty_rd EMAIL; EMAIL="${EMAIL:-owner@kosku.test}"
  fi
  if [[ -z "${SANDI:-}" ]]; then
    stty -echo < /dev/tty 2>/dev/null || true
    printf 'Sandi login pemilik (kosong = dibuat acak): ' > /dev/tty; tty_rd SANDI
    stty echo < /dev/tty 2>/dev/null || true
    printf '\n' > /dev/tty
  fi
  if [[ -z "${NAMA:-}" ]]; then
    printf 'Nama pemilik/kos [Pemilik Kos]: ' > /dev/tty; tty_rd NAMA; NAMA="${NAMA:-Pemilik Kos}"
  fi
  if [[ -z "${COOKIE_SECURE:-}" ]]; then
    printf 'Dibelakang HTTPS? 1=ya/0=tidak [0]: ' > /dev/tty; tty_rd COOKIE_SECURE; COOKIE_SECURE="${COOKIE_SECURE:-0}"
  fi
fi
PORT="${PORT:-3000}"
EMAIL="${EMAIL:-owner@kosku.test}"
NAMA="${NAMA:-Pemilik Kos}"
COOKIE_SECURE="${COOKIE_SECURE:-0}"
[[ "$PORT" =~ ^[0-9]+$ ]] || gagal "PORT '$PORT' bukan angka."
[[ "$COOKIE_SECURE" == "0" || "$COOKIE_SECURE" == "1" ]] || gagal "COOKIE_SECURE harus 0 atau 1."
[[ "$EMAIL" == *@* ]] || gagal "EMAIL '$EMAIL' bukan email valid."
if [[ -z "${SANDI:-}" ]]; then
  SANDI="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(18).toString("base64url"))')"
  SANDI_BARU=1
else
  SANDI_BARU=0
fi

# ------------------------------------------------------------- 4. clone (sekali)
if [[ -e "$APP_DIR/.git" ]]; then
  gagal "Instalasi sudah ada di $APP_DIR. Update manual: cd $APP_DIR && git pull && systemctl restart $SVC (jangan jalankan installer ulang — data tidak boleh tertimpa)."
fi
[[ -e "$APP_DIR" ]] && gagal "$APP_DIR sudah ada tapi bukan instalasi Git — pindahkan dulu, jalankan ulang."
# JANGAN mkdir $APP_DIR sebelum clone: git clone menolak tujuan yang sudah ada.
log "Clone $REPO_URL -> $APP_DIR"
git clone --depth 1 "$REPO_URL" "$APP_DIR" || gagal "Clone gagal (butuh internet / cek URL repo)."

cd "$APP_DIR"

# ------------------------------------------------------------ 5. install & build
log "npm ci (kunci dari package-lock.json)..."
npm ci --no-audit --no-fund || gagal "npm ci gagal."

log "Build produksi (lint + typecheck ikut jalan; error memblokir)..."
npm run build || gagal "Build gagal — perbaiki dulu sebelum lanjut."

# ------------------------------------------------------------- 6. .env & akun awal
SESSION_SECRET="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(48).toString("base64url"))')"
umask 077
cat > .env <<EOF
# AWG-KOSKU — dibuat installer $(date -u +%FT%TZ). Backup file ini: berisi rahasia.
KOSKU_SESSION_SECRET=$SESSION_SECRET
PORT=$PORT
KOSKU_COOKIE_SECURE=$COOKIE_SECURE
EOF
chmod 600 .env
log ".env ditulis (mode 600, secret dibuat acak 48 byte)."

id -u "$SVC_USER" >/dev/null 2>&1 || useradd --system --home-dir "$APP_DIR" --shell /usr/sbin/nologin "$SVC_USER"
chown -R "$SVC_USER:$SVC_USER" "$APP_DIR"

log "Seed akun awal ($EMAIL)..."
runuser -u "$SVC_USER" -- env EMAIL="$EMAIL" SANDI="$SANDI" NAMA="$NAMA" node scripts/seed.mjs \
  || gagal "Seed gagal — cek pesan di atas."

# ------------------------------------------------------------ 7. unit systemd
log "Unit systemd $SVC..."
cat > "/etc/systemd/system/$SVC.service" <<EOF
[Unit]
Description=AWG-KOSKU — dashboard manajemen kos
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$SVC_USER
Group=$SVC_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
Environment=PATH=$NODE_BIN_DIR:/usr/local/bin:/usr/bin:/bin
ExecStart=$APP_DIR/node_modules/.bin/next start -H 0.0.0.0
Restart=on-failure
RestartSec=3
TimeoutStopSec=15
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=full

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now "$SVC" >/dev/null 2>&1 || gagal "systemctl enable --now gagal. Cek: journalctl -u $SVC -e"

# ---------------------------------------------------------------- 8. health check
log "Health check port $PORT (maks 60 detik)..."
SEHAT=0
for _ in $(seq 1 30); do
  KODE_MASUK="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://localhost:$PORT/masuk" || true)"
  [[ "$KODE_MASUK" == "200" ]] && { SEHAT=1; break; }
  sleep 2
done
[[ "$SEHAT" == "1" ]] || {
  systemctl status "$SVC" --no-pager -l | tail -15 >&2
  journalctl -u "$SVC" -n 30 --no-pager >&2
  gagal "Service tidak sehat setelah 60 detik (/masuk tidak 200)."
}
KODE_GW="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://localhost:$PORT/" || true)"
[[ "$KODE_GW" == "307" || "$KODE_GW" == "302" ]] \
  || gagal "Gerbang / balas $KODE_GW (harus redirect ke /masuk — artinya sesi/proxy bermasalah)."

# --------------------------------------------------------------- 9. ringkasan
IP_LOKAL="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
IP_LOKAL="${IP_LOKAL:-<IP-mesin>}"
printf '\n\033[1;32m=== AWG-KOSKU terpasang ===\033[0m\n'
printf 'URL        : http://%s:%s/masuk\n' "$IP_LOKAL" "$PORT"
printf 'Login      : %s\n' "$EMAIL"
if [[ "$SANDI_BARU" == "1" ]]; then
  printf 'Sandi      : %s   <-- SATU-SATUNYA kali dicetak; simpan sekarang (tidak disimpan di file mana pun).\n' "$SANDI"
else
  printf 'Sandi      : (sesuai yang Anda masukkan)\n'
fi
printf 'Aplikasi   : %s\n' "$APP_DIR"
printf 'Database   : %s/data/kosku.sqlite\n' "$APP_DIR"
printf 'Konfigurasi: %s/.env  (rahasia!)\n' "$APP_DIR"
printf 'Service    : systemctl {status|restart|stop} %s\n' "$SVC"
printf 'Log        : journalctl -u %s -f\n' "$SVC"
printf 'Env opsional (tulis ke .env lalu restart): KOSKU_SESSION_TTL_HOURS=12, KOSKU_DB_PATH=/path/db.sqlite\n'
printf 'Update      : cd %s && git pull && npm ci && npm run build && systemctl restart %s\n' "$APP_DIR" "$SVC"
printf '\n'
