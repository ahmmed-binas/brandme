# Deploys the latest COMMITTED code to the live server (fuccura.com).
#
#   .\scripts\deploy.ps1
#
# 1. Packs the committed code (uncommitted changes and secrets are left out).
# 2. Uploads it to the server.
# 3. Unpacks it over /opt/fuccura and rebuilds the app (about 10 minutes).
#    The server's .env and all data (database, uploads, certificates) are kept.
#
# Needs the "fuccura" SSH shortcut in ~/.ssh/config (key login, no password).

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$uncommitted = git status --porcelain --untracked-files=no
if ($uncommitted) {
  Write-Host "You have uncommitted changes. Only committed code is deployed:" -ForegroundColor Yellow
  Write-Host $uncommitted
}

Write-Host "Packing the latest commit: $(git log --oneline -1)"
git archive --format=tar.gz -o fuccura.tar.gz HEAD

Write-Host "Uploading..."
scp fuccura.tar.gz fuccura:/root/

Write-Host "Rebuilding on the server (about 10 minutes)..."
ssh fuccura "cd /opt/fuccura && tar -xzf /root/fuccura.tar.gz && docker compose up -d --build && docker compose ps"

Write-Host "Done. Check https://fuccura.com" -ForegroundColor Green
