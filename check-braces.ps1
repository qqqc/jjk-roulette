# check-braces.ps1 — JS validation for index.html + js/*.js
# Run before every commit: .\check-braces.ps1
# Checks: brace balance, d-string integrity, bracket nesting

$errs = @()

function CheckJS($path, $label) {
  if (-not (Test-Path $path)) { Write-Host "SKIP: $label (not found)" -ForegroundColor Yellow; return }
  $js = Get-Content $path -Raw -Encoding UTF8

  $openB = ($js.ToCharArray() | Where-Object { $_ -eq '{' }).Count
  $closeB = ($js.ToCharArray() | Where-Object { $_ -eq '}' }).Count
  $openQ = ($js.ToCharArray() | Where-Object { $_ -eq '[' }).Count
  $closeQ = ($js.ToCharArray() | Where-Object { $_ -eq ']' }).Count
  if ($openB -ne $closeB) { $errs += ($label + ": Brace mismatch `{ - `} = " + ($openB - $closeB)) }
  if ($openQ -ne $closeQ) { $errs += ($label + ": Bracket mismatch [ - ] = " + ($openQ - $closeQ)) }

  $pyCheck = @'
import re, sys
js = sys.stdin.read()
for i,line in enumerate(js.split('\n'),1):
    if 'd:"' not in line: continue
    m = re.search(r'd:"((?:[^"\\]|\\.)*)"', line)
    if not m:
        print(f'Line {i}: broken d-string')
'@
  $js | python -c $pyCheck 2>$null | ForEach-Object { if ($_) { $errs += ($label + ": " + $_) } }
}

CheckJS "index.html" "index.html"
Get-ChildItem "js/*.js" 2>$null | ForEach-Object { CheckJS $_.FullName $_.Name }

if ($errs.Count -eq 0) {
    Write-Host "OK: All checks passed" -ForegroundColor Green
    exit 0
} else {
    Write-Host "FAIL:" -ForegroundColor Red
    $errs | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    Write-Host "Fix before committing. To bypass: git commit --no-verify"
    exit 1
}
