
const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Checking balances for:", deployer.address);

    // USDT Address (BSC Mainnet)
    const USDT_ADDR = "0x55d398326f99059fF775485246999027B3197955";
    const USDT_ABI = ["function balanceOf(address) view returns (uint256)"];

    // 1. Check BNB
    const bnbBal = await deployer.getBalance();
    console.log(`BNB Balance: ${hre.ethers.utils.formatEther(bnbBal)} BNB`);

    // 2. Check USDT
    const usdt = new hre.ethers.Contract(USDT_ADDR, USDT_ABI, deployer);
    const usdtBal = await usdt.balanceOf(deployer.address);
    console.log(`USDT Balance: ${hre.ethers.utils.formatUnits(usdtBal, 18)} USDT`);

    if (parseFloat(hre.ethers.utils.formatUnits(usdtBal, 18)) >= 10) {
        console.log("✅ Sufficient USDT for test (Min: 10)");
    } else {
        console.log("❌ Insufficient USDT for test");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
