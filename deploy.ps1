# deploy.ps1 — Incrementa BUILD_VERSION y sube a GitHub
# Uso: .\deploy.ps1 "mensaje del commit"

$sw = [System.IO.File]::ReadAllText("sw.js")
$match = [regex]::Match($sw, "const BUILD_VERSION = '(\d+)'")
$current = [int]$match.Groups[1].Value
$next = ($current + 1).ToString().PadLeft(3, '0')
$sw = $sw -replace "const BUILD_VERSION = '\d+'", "const BUILD_VERSION = '$next'"
[System.IO.File]::WriteAllText("sw.js", $sw, [System.Text.Encoding]::UTF8)
Write-Host "BUILD_VERSION -> $next"
git add -A
$msg = if ($args.Count -gt 0) { $args -join " " } else { "deploy $next" }
git commit -m $msg
git push
Write-Host "Deploy listo - version $next"
