# Detiene el bot si está corriendo en segundo plano
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object { $_.CommandLine -match 'index\.js' -and $_.CommandLine -notmatch '--prueba' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force; "Bot detenido (PID $($_.ProcessId))" }
