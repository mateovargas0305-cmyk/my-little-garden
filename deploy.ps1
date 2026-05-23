# deploy.ps1 — Actualiza BUILD_VERSION y sube a GitHub
# Uso: .\deploy.ps1 "mensaje del commit"

$v = [System.DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$sw = [System.IO.File]::ReadAllText("sw.js")
$sw = $sw -replace "const BUILD_VERSION = '\d+'", "const BUILD_VERSION = '$v'"
[System.IO.File]::WriteAllText("sw.js", $sw, [System.Text.Encoding]::UTF8)
Write-Host "BUILD_VERSION -> $v"

git add -A
$msg = if ($args.Count -gt 0) { $args -join " " } else { "deploy $v" }
git commit -m $msg
git push
Write-Host "Deploy listo"
