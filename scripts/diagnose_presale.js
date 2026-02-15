const { ethers } = require("hardhat");

const PRESALE_ADDRESS = "0x7dC1787D85b871c76E446690b9acba3Baa45638A";
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

const ABI = [
    "function presaleActive() view returns (bool)",
    "function currentStage() view returns (uint256)",
    "function getCurrentPrice() view returns (uint256)",
    "function totalTokensSold() view returns (uint256)",
    "function tokensSoldInCurrentStage() view returns (uint256)",
    "function totalRaisedUSDT() view returns (uint256)",
    "function totalRaisedBNB() view returns (uint256)",
    "function token() view returns (address)",
    "function usdt() view returns (address)",
    "function getLatestPrice() view returns (uint256)",
    "function owner() view returns (address)"
];

async function main() {
    console.log("Checking Presale Contract:", PRESALE_ADDRESS);

    // 1. Setup Provider
    const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");

    // 2. Load Contract
    const presale = new ethers.Contract(PRESALE_ADDRESS, ABI, provider);

    try {
        // 3. Check State Variables
        console.log("-- Reading State --");

        try {
            const isActive = await presale.presaleActive();
            console.log("Presale Active:", isActive);
        } catch (e) { console.log("presaleActive failed:", e.message); }

        try {
            const currentStage = await presale.currentStage();
            console.log("Current Stage:", currentStage.toString());
        } catch (e) { console.log("currentStage failed:", e.message); }

        try {
            const price = await presale.getCurrentPrice();
            console.log("Current Price:", ethers.utils.formatUnits(price, 18), "USDT");
        } catch (e) { console.log("getCurrentPrice failed:", e.message); }

        try {
            const totalSold = await presale.totalTokensSold();
            console.log("Total Sold:", ethers.utils.formatEther(totalSold));
        } catch (e) { console.log("totalTokensSold failed:", e.message); }

        try {
            const usdtRaised = await presale.totalRaisedUSDT();
            console.log("USDT Raised:", ethers.utils.formatEther(usdtRaised));
        } catch (e) { console.log("totalRaisedUSDT failed:", e.message); }

        try {
            const bnbRaised = await presale.totalRaisedBNB();
            console.log("BNB Raised:", ethers.utils.formatEther(bnbRaised));
        } catch (e) { console.log("totalRaisedBNB failed:", e.message); }

        // 4. Check Config Addresses
        console.log("-- Checking Config --");
        try {
            const tokenAddr = await presale.token();
            console.log("Configured Token Address:", tokenAddr);
        } catch (e) { console.log("token() failed:", e.message); }

        try {
            const usdtAddr = await presale.usdt();
            console.log("Configured USDT Address:", usdtAddr);
            if (usdtAddr.toLowerCase() !== USDT_ADDRESS.toLowerCase()) {
                console.error("CRITICAL: USDT Address mismatch!");
            } else {
                console.log("USDT Address matches Mainnet USDT.");
            }
        } catch (e) { console.log("usdt() failed:", e.message); }

        // 5. Check Oracle (BNB Price)
        console.log("-- Checking Oracle --");
        try {
            const bnbPrice = await presale.getLatestPrice();
            console.log("BNB Price (from Oracle):", ethers.utils.formatEther(bnbPrice));
        } catch (e) {
            console.error("CRITICAL: Oracle getLatestPrice failed!");
            console.error(e.message);
        }

    } catch (error) {
        console.error("Error reading contract:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
