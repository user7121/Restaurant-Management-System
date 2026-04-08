#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  RMS Start Script
#  Detects the host machine's LAN IP and passes it to Docker
#  so QR codes point to an address phones can actually reach.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# ── Detect LAN IP ─────────────────────────────────────────────
detect_ip() {
  # Try common interfaces in priority order
  for iface in eth0 en0 wlan0 wlp2s0 enp3s0; do
    IP=$(ip addr show "$iface" 2>/dev/null | awk '/inet / {print $2}' | cut -d/ -f1 | head -1)
    if [[ -n "$IP" ]]; then echo "$IP"; return; fi
  done
  # Fallback: pick first non-loopback IPv4
  IP=$(hostname -I 2>/dev/null | tr ' ' '\n' | grep -v '^127\.' | grep -E '^[0-9]+\.' | head -1)
  if [[ -n "$IP" ]]; then echo "$IP"; return; fi
  # macOS fallback
  IP=$(ipconfig getifaddr en0 2>/dev/null || true)
  if [[ -n "$IP" ]]; then echo "$IP"; return; fi
  echo "127.0.0.1"
}

export HOST_IP="$(detect_ip)"

echo "╔══════════════════════════════════════════════════╗"
echo "║  Restaurant Management System                    ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Host LAN IP  : $HOST_IP"
echo "║  Admin Panel  : http://$HOST_IP:5173"
echo "║  Customer App : http://$HOST_IP:5174"
echo "║  Backend API  : http://$HOST_IP:5000"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  📱  QR codes will point to: http://$HOST_IP:5174"
echo "  🔗  Any device on the same Wi-Fi can now open the menu!"
echo ""

# Build and launch
docker compose up --build "$@"
