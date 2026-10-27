$nodeBin = "C:\Users\HP\AppData\Local\node\node-v22.11.0-win-x64"
$env:PATH = "$nodeBin;$env:PATH"

Write-Host "=== Step 1: Installing main dependencies ==="
& "$nodeBin\npm.cmd" install react-router-dom zustand firebase socket.io-client @types/node

Write-Host "=== Step 2: Installing Tailwind CSS v4 ==="
& "$nodeBin\npm.cmd" install tailwindcss @tailwindcss/vite

Write-Host "=== All done! ==="
