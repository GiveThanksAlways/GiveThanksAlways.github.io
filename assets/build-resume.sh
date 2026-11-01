#!/usr/bin/env bash
# Rebuild the resume PDF + web preview from assets/resume.tex (needs nix, pdftoppm, magick).
set -euo pipefail
cd "$(dirname "$0")"
TL=$(nix --extra-experimental-features 'nix-command flakes' build --impure --no-link --print-out-paths --expr \
  'let p = (builtins.getFlake "nixpkgs").legacyPackages.x86_64-linux; in p.texliveBasic.withPackages (ps: with ps; [titlesec marvosym enumitem fancyhdr preprint hyperref ec cm-super])')
tmp=$(mktemp -d)
cp resume.tex "$tmp/"
(cd "$tmp" && "$TL/bin/pdflatex" -interaction=nonstopmode resume.tex >/dev/null)
cp "$tmp/resume.pdf" Resume_Spencer_Willett.pdf
pdftoppm -r 200 -png -singlefile Resume_Spencer_Willett.pdf "$tmp/page"
magick "$tmp/page.png" -quality 88 resume.webp
rm -rf "$tmp"
echo "updated Resume_Spencer_Willett.pdf and resume.webp"
