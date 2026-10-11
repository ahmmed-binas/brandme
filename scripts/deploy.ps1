# Deploys the latest COMMITTED code to the live server (fuccura.com).
#
#   .\scripts\deploy.ps1
#
# The heavy part (building the app) runs on THIS PC, not on the server, because the
# server is shared with other work. Steps:
# 1. Packs the committed code (uncommitted changes and secrets are left out).
# 2. Builds the app image here with Docker Desktop (a few minutes the first time).
# 3. Streams the finished image to the server (compressed) and loads it.
# 4. Sends the two config files the server needs and restarts the app.
#    The server's .env and all data (database, uploads, certificates) are kept.
# 5. Clears old images and build cache on the server, so it doesn't fill up.
#
# Needs Docker Desktop running, and the "fuccura" SSH shortcut in ~/.ssh/config.

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$uncommitted = git status --porcelain --untracked-files=no
if ($uncommitted) {
  Write-Host "You have uncommitted changes. Only committed code is deployed:" -ForegroundColor Yellow
  Write-Host $uncommitted
}

# The public settings baked into pre-rendered pages come from the server's .env,
# so the live site always matches it. (These three are public, not secrets.)
Write-Host "Reading the site's public settings from the server..."
$settings = @{}
ssh fuccura "grep -E '^(APP_URL|NEXT_PUBLIC_CONTACT_EMAIL|NEXT_PUBLIC_WHATSAPP_NUMBER)=' /opt/fuccura/.env" |
  ForEach-Object {
    $name, $value = $_ -split "=", 2
    $settings[$name] = $value.Trim().Trim('"')
  }
if (-not $settings["APP_URL"]) { throw "APP_URL is missing from /opt/fuccura/.env on the server." }

Write-Host "Packing the latest commit: $(git log --oneline -1)"
$folder = Join-Path $env:TEMP "fuccura-build"
if (Test-Path $folder) { Remove-Item -Recurse -Force $folder }
New-Item -ItemType Directory $folder | Out-Null
git archive --format=tar -o "$folder.tar" HEAD
tar -xf "$folder.tar" -C $folder
Remove-Item "$folder.tar"

Write-Host "Building the app image on this PC..."
docker build $folder `
  --platform linux/amd64 `
  --tag fuccura-app:latest `
  --build-arg "APP_URL=$($settings['APP_URL'])" `
  --build-arg "NEXT_PUBLIC_CONTACT_EMAIL=$($settings['NEXT_PUBLIC_CONTACT_EMAIL'])" `
  --build-arg "NEXT_PUBLIC_WHATSAPP_NUMBER=$($settings['NEXT_PUBLIC_WHATSAPP_NUMBER'])"
if ($LASTEXITCODE -ne 0) { throw "The build failed; nothing was changed on the server." }

Write-Host "Sending the image to the server (compressed)..."
# cmd's pipe passes binary data safely (PowerShell 5.1's pipe would corrupt it).
cmd /c "docker save fuccura-app:latest | ssh -C fuccura docker load"
if ($LASTEXITCODE -ne 0) { throw "Sending the image failed; the live site is unchanged." }

Write-Host "Sending the config files..."
scp docker-compose.yml Caddyfile fuccura:/opt/fuccura/

Write-Host "Restarting the app..."
ssh fuccura "cd /opt/fuccura && docker compose up -d --no-build && docker compose ps"

Write-Host "Clearing old images and build cache on the server..."
ssh fuccura "docker image prune -f && docker builder prune -af | tail -1"

Remove-Item -Recurse -Force $folder
Write-Host "Done. Check https://fuccura.com" -ForegroundColor Green
