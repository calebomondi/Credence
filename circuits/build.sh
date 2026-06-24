#!/usr/bin/env bash
set -euo pipefail

CIRCUIT_DIR="$(cd "$(dirname "$0")" && pwd)"
BB="${BB:-bb}"
NARGO="${NARGO:-nargo}"

echo "=== Compiling circuit ==="
cd "$CIRCUIT_DIR/credit_passport"
$NARGO compile

echo "=== Gate count ==="
$BB gates --scheme ultra_honk -b target/credit_passport.json

echo "=== Write verification key ==="
$BB write_vk --scheme ultra_honk -b target/credit_passport.json -o target/vk

echo "=== Done ==="
echo "VK written to: $CIRCUIT_DIR/credit_passport/target/vk"
