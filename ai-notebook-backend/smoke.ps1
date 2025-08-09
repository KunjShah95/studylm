# Simple PowerShell smoke test for core endpoints
param(
  [string]$BaseUrl = "http://127.0.0.1:8000"
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Show($msg){ Write-Host $msg }

try {
  $h = Invoke-WebRequest -UseBasicParsing "$BaseUrl/health"; Show "HEALTH $($h.StatusCode) $($h.Content)"
  try { $r = Invoke-WebRequest -UseBasicParsing -MaximumRedirection 0 "$BaseUrl/" } catch { $r = $_.Exception.Response }
  Show "ROOT $($r.StatusCode) Location=$($r.Headers['Location'])"
  $d = Invoke-WebRequest -UseBasicParsing "$BaseUrl/docs"; Show "DOCS $($d.StatusCode)"
  try { $app = Invoke-WebRequest -UseBasicParsing "$BaseUrl/app"; Show "APP $($app.StatusCode)" } catch { Show ("APP_ERR {0}" -f $_.Exception.Response.StatusCode.Value__) }
  $u = Invoke-WebRequest -UseBasicParsing "$BaseUrl/upload"; Show "UPLOAD_FORM $($u.StatusCode)"
  $ul = Invoke-WebRequest -UseBasicParsing "$BaseUrl/uploads-list"; Show "UPLOADS_LIST $($ul.StatusCode)"
  $id=[guid]::NewGuid().ToString(); $st = Invoke-WebRequest -UseBasicParsing "$BaseUrl/status/$id"; Show "STATUS $($st.StatusCode)"
  $tid='smoke-'+([guid]::NewGuid().ToString()); $body='{"file_id":"'+$tid+'","note":"hello"}';
  $sn = Invoke-WebRequest -UseBasicParsing -Method Post -ContentType 'application/json' -Body $body "$BaseUrl/save_note"; Show "SAVE_NOTE $($sn.StatusCode)"
  $nts = Invoke-WebRequest -UseBasicParsing "$BaseUrl/notes/$tid"; Show "NOTES $($nts.StatusCode)"
  $abody='{"file_id":"'+$tid+'","question":"What is this?"}';
  try { $ask = Invoke-WebRequest -UseBasicParsing -Method Post -ContentType 'application/json' -Body $abody "$BaseUrl/ask"; Show "ASK_OK $($ask.StatusCode)" } catch { Show ("ASK_ERR {0}" -f $_.Exception.Response.StatusCode.Value__) }
  exit 0
} catch {
  Show ("SMOKE_FAILED: $_")
  exit 1
}
