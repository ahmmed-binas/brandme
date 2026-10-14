# Starts the voice engine for kitefolio.com/tools/voice on this PC.
#
#   .\workers\voice\start.ps1
#
# Keep the window open; the website shows the tool as working while it runs.
# Ctrl+C stops it. Settings are in workers\voice\.env (see README.md).

$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot "..\.."
# The Python 3.11 environment with Chatterbox and CUDA, set up for the marketing voiceover.
$python = Join-Path $root "marketing\.tts\cb\Scripts\python.exe"

if (-not (Test-Path $python)) {
  Write-Host "Chatterbox's Python environment is missing: $python" -ForegroundColor Red
  Write-Host "See workers\voice\README.md, 'First-time setup'."
  exit 1
}

& $python (Join-Path $PSScriptRoot "worker.py")
