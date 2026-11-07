#!/usr/bin/env bash
# check-integrity.sh — controleer register-integriteit van het grootboek
#
# Vergelijkt de documenten op disk met wat de registers claimen, in beide
# richtingen: een registerregel zonder bestand is een FOUT, een bestand
# zonder registerregel een WAARSCHUWING. Waarschuwingen blokkeren niet.
#
# Gebruik:  bash check-integrity.sh [grootboek-pad]
#   grootboek-pad  pad naar de grootboek-map van jouw project
#                  (default: docs/grootboek — het conventiepad, relatief
#                  aan de map waar je het script start)
#
# Exit 0 = geen fouten (ook op een vers, leeg grootboek)
# Exit 1 = fouten gevonden, of het grootboek-pad bestaat niet
#
# Puur bash + coreutils — geen aannames over bun, node of python.

set -uo pipefail

GROOTBOEK="${1:-docs/grootboek}"
REGISTERS="$GROOTBOEK/registers"
# Repo-wortel: twee niveaus boven de grootboek-map (conventie docs/grootboek).
REPO_ROOT="$(cd "$GROOTBOEK/../.." 2>/dev/null && pwd || echo ".")"
ERRORS=0
WARNINGS=0

if [ ! -d "$GROOTBOEK" ]; then
  echo "FOUT: grootboek-map '$GROOTBOEK' niet gevonden."
  echo "Tip: start vanaf de projectroot, of geef het pad mee als argument."
  exit 1
fi

echo "=== Grootboek Integriteitscheck ==="
echo "Pad: $GROOTBOEK"
echo ""

# check_type <label> <register-bestand> <document-map> <bestandsprefix>
#
# Let op: de while-read lussen draaien in de hoofd-shell (process
# substitution, geen pipe) zodat de tellers niet in een subshell verdampen.
check_type() {
  local label="$1" register="$2" docmap="$3" prefix="$4"
  local heeft_docs=0 disk_count=0

  echo "--- $label ---"

  if compgen -G "$docmap/${prefix}-*.md" > /dev/null 2>&1; then
    heeft_docs=1
  fi

  if [ ! -f "$register" ]; then
    if [ "$heeft_docs" -eq 1 ]; then
      echo "FOUT: $(basename "$register") niet gevonden, maar er staan ${prefix}-documenten op disk"
      ERRORS=$((ERRORS + 1))
    else
      echo "Nog geen ${label} (register en documenten ontbreken — prima op een vers grootboek)."
    fi
    echo ""
    return 0
  fi

  # Richting 1: register → disk. Alleen regels die als YAML-veld 'bestand:'
  # beginnen tellen mee; 'bestand:' midden in lopende tekst niet.
  while IFS= read -r file; do
    [ -n "$file" ] || continue
    # Conventie (register-migratie-gids): kale bestandsnaam = relatief aan
    # de type-map; pad mét slash = origineel vanaf de repo-wortel
    # (gemigreerde beslisdocumenten blijven op hun plek staan).
    local doel
    if [[ "$file" == */* ]]; then
      doel="$REPO_ROOT/$file"
    else
      doel="$docmap/$file"
    fi
    if [ ! -f "$doel" ]; then
      echo "FOUT: register verwijst naar $file maar het bestand bestaat niet ($doel)"
      ERRORS=$((ERRORS + 1))
    fi
  done < <(grep -E '^[[:space:]]*bestand:[[:space:]]+' "$register" 2>/dev/null \
           | sed -E 's/^[[:space:]]*bestand:[[:space:]]*//; s/^"//; s/"[[:space:]]*$//' \
           || true)

  # Richting 2: disk → register.
  while IFS= read -r file; do
    [ -n "$file" ] || continue
    disk_count=$((disk_count + 1))
    local base
    base="$(basename "$file")"
    if ! grep -q -F "$base" "$register"; then
      echo "WAARSCHUWING: $base bestaat maar staat niet in het register"
      WARNINGS=$((WARNINGS + 1))
    fi
  done < <(find "$docmap" -maxdepth 1 -name "${prefix}-*.md" 2>/dev/null | sort || true)

  echo "$label op disk: $disk_count"
  echo ""
}

# De vaste documenttypen. Documentmap volgt de conventie; het journaal
# woont in 'journaal/' (niet 'jnl/').
check_type "ADR's" "$REGISTERS/adr-register.yml" "$GROOTBOEK/adr"      "adr"
check_type "HDR's" "$REGISTERS/hdr-register.yml" "$GROOTBOEK/hdr"      "hdr"
check_type "PDR's" "$REGISTERS/pdr-register.yml" "$GROOTBOEK/pdr"      "pdr"
check_type "DFT's" "$REGISTERS/dft-register.yml" "$GROOTBOEK/dft"      "dft"
check_type "JNL's" "$REGISTERS/jnl-register.yml" "$GROOTBOEK/journaal" "jnl"

# --- Livegang (optionele module: alleen toetsen als het register bestaat) ---
echo "--- Livegang ---"
if [ -f "$GROOTBOEK/livegang/register.yml" ]; then
  pending=$(grep -c "status: pending" "$GROOTBOEK/livegang/register.yml" 2>/dev/null || true)
  echo "Open livegang-checklists: ${pending:-0}"
else
  echo "Geen livegang-register (optionele module — niets te toetsen)."
fi
echo ""

# --- Samenvatting ---
count_docs() { find "$1" -maxdepth 1 -name "$2" 2>/dev/null | wc -l | tr -d ' '; }

adr_count=$(count_docs "$GROOTBOEK/adr" "adr-*.md")
hdr_count=$(count_docs "$GROOTBOEK/hdr" "hdr-*.md")
pdr_count=$(count_docs "$GROOTBOEK/pdr" "pdr-*.md")
dft_count=$(count_docs "$GROOTBOEK/dft" "dft-*.md")
jnl_count=$(count_docs "$GROOTBOEK/journaal" "jnl-*.md")
spec_count=$(count_docs "$GROOTBOEK/specs" "*.md")

echo "=== Samenvatting ==="
echo "ADR's: $adr_count | HDR's: $hdr_count | PDR's: $pdr_count | DFT's: $dft_count | JNL's: $jnl_count | Specs: $spec_count"

if [ "$ERRORS" -gt 0 ] || [ "$WARNINGS" -gt 0 ]; then
  echo "Fouten: $ERRORS | Waarschuwingen: $WARNINGS"
else
  echo "Alles in orde."
fi

if [ "$ERRORS" -gt 0 ]; then
  exit 1
fi
exit 0
