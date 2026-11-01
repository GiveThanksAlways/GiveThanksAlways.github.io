#!/usr/bin/env bash
# Rebuild the resume PDF + web preview from assets/resume.tex (needs nix and poppler's pdftocairo).
set -euo pipefail
cd "$(dirname "$0")"
TL=$(nix --extra-experimental-features 'nix-command flakes' build --impure --no-link --print-out-paths --expr \
  'let p = (builtins.getFlake "nixpkgs").legacyPackages.x86_64-linux; in p.texliveBasic.withPackages (ps: with ps; [titlesec marvosym enumitem fancyhdr preprint hyperref ec cm-super])')
tmp=$(mktemp -d)
cp resume.tex "$tmp/"
(cd "$tmp" && "$TL/bin/pdflatex" -interaction=nonstopmode resume.tex >/dev/null)
cp "$tmp/resume.pdf" Resume_Spencer_Willett.pdf
pdftocairo -svg Resume_Spencer_Willett.pdf resume.svg   # vector preview: sharp at any zoom
rm -rf "$tmp"
echo "updated Resume_Spencer_Willett.pdf and resume.svg"
