# check-braces.ps1 — JS validation for index.html
# Run before every commit: .\check-braces.ps1
# Checks: brace balance, d-string integrity, bracket nesting

$c = Get-Content "index.html" -Raw -Encoding UTF8
$m = [regex]::Match($c, '<script>(.*?)</script>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
if (-not $m.Success) { Write-Host "WARN: No <script> block found"; exit 0 }

$js = $m.Groups[1].Value
$errs = @()

# 1. Brace/bracket balance
$bDiff = ($js.ToCharArray() | Where-Object { $_ -eq '{' }).Count - ($js.ToCharArray() | Where-Object { $_ -eq '}' }).Count
$qDiff = ($js.ToCharArray() | Where-Object { $_ -eq '[' }).Count - ($js.ToCharArray() | Where-Object { $_ -eq ']' }).Count
if ($bDiff -ne 0) { $errs += "Brace mismatch: { - } = $bDiff" }
if ($qDiff -ne 0) { $errs += "Bracket mismatch: [ - ] = $qDiff" }

# 2. d-string integrity (Python subprocess for regex accuracy)
$pyCheck = @'
import re, sys
js = sys.stdin.read()
for i,line in enumerate(js.split('\n'),1):
    if 'd:"' not in line: continue
    m = re.search(r'd:"((?:[^"\\]|\\.)*)"', line)
    if not m:
        print(f'Line {i}: broken d-string')
'@
$pyCheck | python -c $pyCheck 2>$null | ForEach-Object { if ($_) { $errs += $_ } }

# 3. Report
if ($errs.Count -eq 0) {
    Write-Host "OK: All checks passed" -ForegroundColor Green
    exit 0
} else {
    Write-Host "FAIL:" -ForegroundColor Red
    $errs | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    Write-Host "Fix before committing. To bypass: git commit --no-verify"
    exit 1
}
