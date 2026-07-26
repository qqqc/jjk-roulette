# check-data.ps1 — Deep SEED_DATA validation for index.html
# Run standalone or as part of /lint
# Checks: duplicate IDs, dimension values, item field completeness, phase ordering
# Usage: .\check-data.ps1

$c = Get-Content "index.html" -Raw -Encoding UTF8
$m = [regex]::Match($c, '<script>(.*?)</script>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
if (-not $m.Success) { Write-Host "FAIL: No <script> block found" -ForegroundColor Red; exit 1 }

$js = $m.Groups[1].Value
$DIM_LEVELS = @("E-","E","D","C","B","A","S","SS","SSS","EX")
$errs = @()
$warns = @()
$stats = @()

# --- Stats ---
$phaseMatches = [regex]::Matches($js, 'id:"(p\d+[^"]*)"')
$phaseIds = $phaseMatches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
$roundMatches = [regex]::Matches($js, 'id:"(p\d+_\w+)"')
$roundIds = $roundMatches | ForEach-Object { $_.Groups[1].Value }
$itemCount = ([regex]::Matches($js, '{l:"')).Count

$stats += "Phases: $($phaseIds.Count)"
$stats += "Rounds: $($roundIds.Count)"
$stats += "Items: $itemCount"

# --- Check round ID uniqueness ---
$seen = @{}
foreach ($id in $roundIds) {
    if ($seen.ContainsKey($id)) { $errs += "Duplicate round ID: $id" }
    $seen[$id] = $true
}

# --- Check dimension values ---
$dimPattern = [regex]::new('dim:\{([^}]+)\}')
foreach ($dm in $dimPattern.Matches($js)) {
    $dimBlock = $dm.Groups[1].Value
    $entryPattern = [regex]::new("(\w+):`"([^`"]+)`"")
    foreach ($e in $entryPattern.Matches($dimBlock)) {
        $key = $e.Groups[1].Value
        $val = $e.Groups[2].Value
        if ($val -notin $DIM_LEVELS) {
            $lineNum = ($js.Substring(0, $dm.Index).Split("`n")).Count
            $warns += "Line $lineNum : Unknown dim value `"$val`" for key `"$key`". Valid: $($DIM_LEVELS -join ', ')"
        }
    }
}

# --- Check items for missing critical fields ---
$itemPattern = [regex]::new('\{l:"([^"]*)",[^}]*\}')
$i = 0
foreach ($im in $itemPattern.Matches($js)) {
    $i++
    $item = $im.Groups[0].Value
    $label = $im.Groups[1].Value
    if ([string]::IsNullOrEmpty($label)) {
        $lineNum = ($js.Substring(0, $im.Index).Split("`n")).Count
        $errs += "Line ~$lineNum : Item #$i has empty label"
    }
    if ($item -notmatch 'c:"') {
        $lineNum = ($js.Substring(0, $im.Index).Split("`n")).Count
        $warns += "Line ~$lineNum : Item `"$label`" missing color field (c:)"
    }
}

# --- Check phase ordering ---
$phaseNums = $phaseIds | ForEach-Object { if ($_ -match '^p(\d+)') { [int]$Matches[1] } else { 0 } } | Where-Object { $_ -gt 0 }
for ($j = 0; $j -lt $phaseNums.Count - 1; $j++) {
    if ($phaseNums[$j] -gt $phaseNums[$j + 1]) {
        $warns += "Phase order: p$($phaseNums[$j]) appears before p$($phaseNums[$j+1]) — verify intentional"
    }
}

# --- Report ---
Write-Host "`n=== SEED_DATA Deep Validation ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "STATS:" -ForegroundColor Yellow
$stats | ForEach-Object { Write-Host "  $_" }
Write-Host ""

if ($errs.Count -eq 0) {
    Write-Host "ERRORS: 0" -ForegroundColor Green
} else {
    Write-Host "ERRORS: $($errs.Count)" -ForegroundColor Red
    $errs | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
}
Write-Host ""

if ($warns.Count -eq 0) {
    Write-Host "WARNINGS: 0" -ForegroundColor Green
} else {
    Write-Host "WARNINGS: $($warns.Count)" -ForegroundColor Yellow
    $warns | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
}
Write-Host ""

if ($errs.Count -eq 0 -and $warns.Count -eq 0) {
    Write-Host "RESULT: All deep checks passed!" -ForegroundColor Green
    exit 0
} elseif ($errs.Count -eq 0) {
    Write-Host "RESULT: Passed (warnings only)" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "RESULT: Failed — fix errors above before committing" -ForegroundColor Red
    exit 1
}
