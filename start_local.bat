@echo off
echo ===================================================
echo   NUERALLY LOCAL ENVIRONMENT SETUP
echo ===================================================

echo 1. Starting Hardhat Node (in new window)...
start "Hardhat Node" cmd /k npx hardhat node

echo.
echo Waiting 10 seconds for node to initialize...
timeout /t 10

echo.
echo 2. Deploying Contracts & Updating Config...
call npx hardhat run scripts/deploy_local.js --network localhost

echo.
echo 3. Starting Website...
echo Please open: http://localhost:5173
call npm run dev

pause
