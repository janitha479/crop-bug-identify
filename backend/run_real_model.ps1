# Runs the backend with the REAL trained model using a Python 3.12 environment.
# First run: creates the venv and installs TensorFlow (a few minutes). Later runs: instant.
#
# Usage (from the backend folder):
#   powershell -ExecutionPolicy Bypass -File .\run_real_model.ps1

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

# 1. Check Python 3.12 is available via the py launcher.
$hasPy312 = $false
try { py -3.12 --version *>$null; if ($LASTEXITCODE -eq 0) { $hasPy312 = $true } } catch {}
if (-not $hasPy312) {
    Write-Host "Python 3.12 not found." -ForegroundColor Red
    Write-Host "Install it from https://www.python.org/downloads/release/python-3120/ (tick 'Add python.exe to PATH'), then re-run this script."
    exit 1
}

$venv = Join-Path $here ".venv312"
$venvPy = Join-Path $venv "Scripts\python.exe"

# 2. Create the venv + install deps on first run.
if (-not (Test-Path $venvPy)) {
    Write-Host "Creating Python 3.12 environment (.venv312)..." -ForegroundColor Cyan
    py -3.12 -m venv $venv
    & $venvPy -m pip install --upgrade pip
    Write-Host "Installing backend + TensorFlow (this can take a few minutes)..." -ForegroundColor Cyan
    & $venvPy -m pip install -r (Join-Path $here "requirements-tf.txt")
}

# 3. Run the backend.
Write-Host "Starting backend with the real model on http://localhost:5000 ..." -ForegroundColor Green
& $venvPy run.py
