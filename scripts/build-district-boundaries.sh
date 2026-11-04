#!/usr/bin/env bash
# Rebuild the state legislative district boundaries used by the supporter
# heatmap (src/data/districts/).
#
# Source: Census cartographic boundary files, which are the same geographies
# the Census geocoder assigns an address to, so a supporter's
# stateUpperDistrict / stateLowerDistrict always matches a shape here.
#   sldu = State Legislative District, Upper (Senate)
#   sldl = State Legislative District, Lower (Assembly / House)
#
# Simplified to 12% and rounded to 4 decimal places: ~48KB for Nevada's 21
# Senate and 42 Assembly districts, which is small enough to ship in the
# bundle and still accurate at the zoom a choropleth is read at.
#
# Properties are stripped to { district } holding the bare number ("13"),
# matching the Census geocoder's BASENAME.
#
# Usage: scripts/build-district-boundaries.sh [STATE_FIPS] [STATE_SLUG]
#   e.g. scripts/build-district-boundaries.sh 32 nv
set -euo pipefail

FIPS="${1:-32}"
SLUG="${2:-nv}"
YEAR=2023
OUT="$(cd "$(dirname "$0")/.." && pwd)/src/data/districts"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fetch() { # chamber_code output_name
  local code="$1" name="$2"
  local base="cb_${YEAR}_${FIPS}_${code}_500k"
  curl -sfL --max-time 120 -o "$TMP/$base.zip" \
    "https://www2.census.gov/geo/tiger/GENZ${YEAR}/shp/${base}.zip"
  unzip -oq "$TMP/$base.zip" -d "$TMP/$code"
  npx -y mapshaper@0.6.102 "$TMP/$code/$base.shp" \
    -simplify 12% keep-shapes \
    -each 'this.properties = {district: String(+NAME)}' \
    -o format=geojson precision=0.0001 "$OUT/${SLUG}-${name}.json"
  echo "  wrote $OUT/${SLUG}-${name}.json ($(wc -c < "$OUT/${SLUG}-${name}.json") bytes)"
}

mkdir -p "$OUT"
echo "Building district boundaries for FIPS $FIPS ($SLUG)…"
fetch sldu senate
fetch sldl assembly
echo "Done."
