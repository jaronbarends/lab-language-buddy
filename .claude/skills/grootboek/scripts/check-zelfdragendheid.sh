#!/usr/bin/env bash
# check-zelfdragendheid.sh — controleer of de skill-bron zelfdragend is
#
# De skill wordt geïnstalleerd bij klanten die de ARC-repo niet hebben.
# Dit script scant alle .md-bestanden in de skill-bron op verwijzingen
# naar paden búíten de skill-root. Zo'n buitenpad is een FOUT, tenzij:
#   (a) het gemarkeerd is — op dezelfde regel of binnen 5 regels ervóór
#       staat een illustratie-disclaimer of het woord "illustratie" /
#       "conventie";
#   (b) het bestand opent met het illustratie-disclaimer-blok (het
#       patroon van de bijgesloten voorbeelden) — dan geldt het hele
#       bestand als gemarkeerd;
#   (c) het pad binnen de skill-root zelf bestaat (bijv. scripts/ of
#       references/ van de skill).
#
# Gebruik:  bash check-zelfdragendheid.sh [skill-root]
#   skill-root  pad naar de skill-bron (default: de map boven dit script)
#
# Exit 0 = schoon; exit 1 = lijst van bestand:regel + pad.
#
# Puur bash + coreutils — geen aannames over bun, node of python.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${1:-$(dirname "$SCRIPT_DIR")}"
if [ ! -d "$ROOT" ]; then
  echo "FOUT: skill-root '$ROOT' niet gevonden."
  exit 1
fi
ROOT="$(cd "$ROOT" && pwd)"

# Buitenpaden die we herkennen: ARC-interne mappen, home-paden, hooks,
# en het conventiepad docs/grootboek/… (dat alleen gemarkeerd als
# conventie mag voorkomen).
PATRONEN='~/[A-Za-z0-9._/-]+|\.claude/hooks[A-Za-z0-9._/-]*|docs/(kompas|operatie|grootboek)[A-Za-z0-9._/-]*|scripts/[A-Za-z0-9._/-]+'

# Markeringswoorden die een buitenpad vrijpleiten (op de regel zelf of
# binnen 5 regels ervóór/erná). "illustr" dekt illustratie/illustratief/
# illustreren.
MARKERING='[Ii]llustr|[Cc]onventie'

# Signatuur van het illustratie-disclaimer-blok bovenaan een voorbeeld.
# We kijken in de eerste 40 regels (frontmatter kan lang zijn — het blok
# van hdr-009 valt op regel 29).
DISCLAIMER='[Ii]llustr|niet op te zoeken'
DISCLAIMER_VENSTER=40

FOUTEN=0
GESCAND=0

while IFS= read -r f; do
  GESCAND=$((GESCAND + 1))
  rel_f="${f#"$ROOT"/}"

  # (b) bestand opent met het disclaimer-blok → geheel gemarkeerd
  if head -"$DISCLAIMER_VENSTER" "$f" | grep -qE "$DISCLAIMER"; then
    continue
  fi

  # (d) bestand verklaart de docs/grootboek-conventie in de kop →
  #     conventiepaden (docs/grootboek/…) gelden bestand-breed als
  #     gemarkeerd; andere buitenpaden blijven per regel beoordeeld.
  CONVENTIE_BESTAND=0
  if head -"$DISCLAIMER_VENSTER" "$f" | grep -qE '[Cc]onventie'; then
    CONVENTIE_BESTAND=1
  fi

  # Regels met kandidaat-paden, met regelnummer
  while IFS=: read -r ln line; do
    [ -n "$ln" ] || continue

    # (a) markering op de regel zelf of binnen 5 regels ervóór/erná
    start=$((ln - 5)); [ "$start" -lt 1 ] && start=1
    eind=$((ln + 5))
    if sed -n "${start},${eind}p" "$f" | grep -qE "$MARKERING"; then
      continue
    fi

    # Elk pad op deze regel afzonderlijk beoordelen
    while IFS= read -r p; do
      [ -n "$p" ] || continue

      # (d) conventiepad in een bestand met conventie-verklaring in de kop
      if [ "$CONVENTIE_BESTAND" -eq 1 ] && [[ "$p" == docs/grootboek* ]]; then
        continue
      fi

      # (c) skill-interne paden zijn geen buitenpaden
      kandidaat="$p"
      kandidaat="${kandidaat#.claude/skills/grootboek/}"
      kandidaat="${kandidaat#skills-bron/grootboek/}"
      if [ -e "$ROOT/$kandidaat" ]; then
        continue
      fi

      echo "$rel_f:$ln  $p"
      FOUTEN=$((FOUTEN + 1))
    done < <(grep -oE "$PATRONEN" <<< "$line" || true)
  done < <(grep -nE "$PATRONEN" "$f" || true)
done < <(find "$ROOT" -name '*.md' -type f | sort)

echo ""
echo "=== Zelfdragendheid ==="
echo "Gescand: $GESCAND markdown-bestanden | Niet-gemarkeerde buitenpaden: $FOUTEN"

if [ "$FOUTEN" -gt 0 ]; then
  echo "Markeer elk pad als illustratie of conventie (zie de disclaimer-conventie), of schrijf de inhoud uit."
  exit 1
fi
echo "Schoon — de skill draagt zichzelf."
exit 0
