$ErrorActionPreference = "Stop"
$serverDir = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $serverDir ".env"
$templatePath = Join-Path $serverDir ".env.example"

if (!(Test-Path $envPath)) {
  if (!(Test-Path $templatePath)) {
    throw "Cannot find server/.env.example."
  }
  Copy-Item $templatePath $envPath
}

$clientId = (Read-Host "Enter your NEW JDoodle Client ID").Trim()
if (!$clientId -or $clientId.Contains("`n") -or $clientId.Contains("`r")) {
  throw "Client ID cannot be empty or contain line breaks."
}

$secureSecret = Read-Host "Enter your NEW JDoodle Client Secret (input is hidden)" -AsSecureString
$secretPtr = [IntPtr]::Zero
$clientSecret = $null
$tempPath = Join-Path $serverDir ".env.tmp"

try {
  $secretPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureSecret)
  $clientSecret = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPtr)
  if (!$clientSecret -or $clientSecret.Contains("`n") -or $clientSecret.Contains("`r")) {
    throw "Client secret cannot be empty or contain line breaks."
  }

  $lines = [Collections.Generic.List[string]]::new()
  foreach ($line in [IO.File]::ReadAllLines($envPath)) {
    if ($line -notmatch '^\s*JDOODLE_CLIENT_(ID|SECRET)\s*=') {
      $lines.Add($line)
    }
  }

  $lines.Add("JDOODLE_CLIENT_ID=`"$clientId`"")
  $lines.Add("JDOODLE_CLIENT_SECRET=`"$clientSecret`"")
  [IO.File]::WriteAllLines($tempPath, $lines, [Text.UTF8Encoding]::new($false))
  Move-Item -LiteralPath $tempPath -Destination $envPath -Force

  Write-Host "JDoodle credentials saved locally to server/.env. Credential values were not displayed."
  Write-Host "If the API is running with npm run dev, nodemon will restart it automatically."
} finally {
  if ($secretPtr -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPtr)
  }
  $clientSecret = $null
  $secureSecret = $null
  if (Test-Path $tempPath) {
    Remove-Item -LiteralPath $tempPath -Force
  }
}
