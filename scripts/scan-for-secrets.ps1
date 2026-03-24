<#
.SYNOPSIS
    CYVhub Secret Scanner — scans the repository for accidentally committed API keys.

.DESCRIPTION
    Run this script from the repo root before any commit, or in CI, to catch
    secrets that should never be in source control.

    Patterns checked:
      - Stripe live/test secret keys  (sk_live_, sk_test_)
      - Stripe live/test publishable  (pk_live_, pk_test_)
      - Stripe webhook secrets        (whsec_)
      - Google API keys               (AIzaSy)
      - JWT-like strings              (long Base64 strings 40+ chars)
      - Generic "password" assignments in .ts/.js files

.USAGE
    pwsh scripts/scan-for-secrets.ps1
    # Run from the CYVHUB-main directory (parent of cyvhub-backend and CYVhub-main)

.NOTES
    .env files are intentionally excluded — they are git-ignored and expected
    to contain real values locally. Only committed source files are scanned.
#>

$ErrorActionPreference = 'Stop'

# Root of the monorepo — adjust if running from a different working directory
$RepoRoot = $PSScriptRoot | Split-Path -Parent

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CYVhub Secret Scanner" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Scanning: $RepoRoot" -ForegroundColor Gray
Write-Host ""

# File extensions to scan (adjust as needed)
$Extensions = @('*.ts', '*.tsx', '*.js', '*.jsx', '*.json', '*.yaml', '*.yml', '*.md')

# Directories / files to skip
$Excludes = @(
    '*/node_modules/*',
    '*/.git/*',
    '*/dist/*',
    '*/build/*',
    '*/.expo/*',
    '*.env',
    '*.env.*',
    '*/dev.db'
)

# Patterns that indicate a secret
$Patterns = @(
    @{ Name = 'Stripe Secret Key (live)';      Pattern = 'sk_live_[A-Za-z0-9]{20,}' },
    @{ Name = 'Stripe Secret Key (test)';      Pattern = 'sk_test_[A-Za-z0-9]{20,}' },
    @{ Name = 'Stripe Publishable Key (live)'; Pattern = 'pk_live_[A-Za-z0-9]{20,}' },
    @{ Name = 'Stripe Publishable Key (test)'; Pattern = 'pk_test_[A-Za-z0-9]{20,}' },
    @{ Name = 'Stripe Webhook Secret';         Pattern = 'whsec_[A-Za-z0-9]{10,}' },
    @{ Name = 'Google API Key';                Pattern = 'AIzaSy[A-Za-z0-9_-]{30,}' },
    @{ Name = 'JWT Token (3-part)';            Pattern = 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+' },
    @{ Name = 'Hardcoded Secret Assignment';   Pattern = '(?:SECRET|PASSWORD|API_KEY|PRIVATE_KEY)\s*=\s*["\x27][A-Za-z0-9+/=_\-!@#$%^&*]{20,}["\x27]' }
)

$Found = 0

foreach ($ext in $Extensions) {
    $files = Get-ChildItem -Path $RepoRoot -Filter $ext -Recurse -File |
        Where-Object {
            $path = $_.FullName -replace '\\', '/'
            $excluded = $false
            foreach ($ex in $Excludes) {
                $pattern = $ex -replace '\*', '.*'
                if ($path -match $pattern) { $excluded = $true; break }
            }
            -not $excluded
        }

    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $content) { continue }

        foreach ($check in $Patterns) {
            if ($content -match $check.Pattern) {
                # Exclude lines that are obviously examples (CHANGE_ME, placeholder, ...)
                $lines = Select-String -Path $file.FullName -Pattern $check.Pattern
                foreach ($line in $lines) {
                    $lineText = $line.Line.Trim()
                    if ($lineText -match 'CHANGE_ME|your_|placeholder|example|sk_live_\.\.|pk_live_\.\.|whsec_\.\.' ) { continue }
                    Write-Host "⚠ POTENTIAL SECRET FOUND" -ForegroundColor Red
                    Write-Host "  Type   : $($check.Name)" -ForegroundColor Yellow
                    Write-Host "  File   : $($file.FullName)" -ForegroundColor Yellow
                    Write-Host "  Line   : $($line.LineNumber)" -ForegroundColor Yellow
                    Write-Host "  Content: $($lineText.Substring(0, [Math]::Min(80, $lineText.Length)))..." -ForegroundColor Yellow
                    Write-Host ""
                    $Found++
                }
            }
        }
    }
}

Write-Host "================================================" -ForegroundColor Cyan
if ($Found -eq 0) {
    Write-Host "  ✅ No secrets found. All clear!" -ForegroundColor Green
} else {
    Write-Host "  ❌ $Found potential secret(s) found. Review and rotate immediately." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Rotation links:" -ForegroundColor White
    Write-Host "    Stripe:      https://dashboard.stripe.com/apikeys" -ForegroundColor Gray
    Write-Host "    Stripe WHK:  https://dashboard.stripe.com/webhooks" -ForegroundColor Gray
    Write-Host "    Google Maps: https://console.cloud.google.com/apis/credentials" -ForegroundColor Gray
    exit 1
}
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
