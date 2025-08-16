param(
    [Parameter(Mandatory=$true)]
    [int]$Port
)

Write-Host "Looking for processes running on port $Port..." -ForegroundColor Yellow

# Find processes using the specified port
$processes = netstat -ano | Select-String ":$Port\s" | Where-Object { $_ -match "LISTENING" }

if ($processes.Count -eq 0) {
    Write-Host "No processes found listening on port $Port" -ForegroundColor Green
    exit 0
}

Write-Host "Found processes listening on port ${Port}:" -ForegroundColor Cyan

# Extract PIDs and kill processes
$killedCount = 0
foreach ($line in $processes) {
    # Extract PID from the netstat output (last column)
    if ($line -match '\s+(\d+)\s*$') {
        $processId = $matches[1]
        
        try {
            # Get process name for better output
            $processName = (Get-Process -Id $processId -ErrorAction SilentlyContinue).ProcessName
            if ($processName) {
                Write-Host "  PID $processId ($processName)" -ForegroundColor White
            } else {
                Write-Host "  PID $processId" -ForegroundColor White
            }
            
            # Kill the process
            taskkill /PID $processId /F | Out-Null
            Write-Host "    ✓ Process $processId terminated" -ForegroundColor Green
            $killedCount++
        }
        catch {
            Write-Host "    ✗ Failed to terminate process $processId" -ForegroundColor Red
        }
    }
}

if ($killedCount -gt 0) {
    Write-Host "`nSuccessfully terminated $killedCount process(es) on port ${Port}" -ForegroundColor Green
} else {
    Write-Host "`nNo processes were terminated" -ForegroundColor Yellow
}

# Verify the port is now free
Start-Sleep -Seconds 1
$verification = netstat -ano | Select-String ":${Port}\s" | Where-Object { $_ -match "LISTENING" }
if ($verification.Count -eq 0) {
    Write-Host "Port ${Port} is now free ✓" -ForegroundColor Green
} else {
    Write-Host "Warning: Some processes may still be running on port ${Port}" -ForegroundColor Yellow
}
