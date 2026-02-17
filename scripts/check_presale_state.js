
const hre = require("hardhat");

async function main() {
    const NEW_PRESALE = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
    console.log("Checking Presale State:", NEW_PRESALE);

    const Presale = await hre.ethers.getContractFactory("NuerallyPresale");
    const presale = Presale.attach(NEW_PRESALE);

    // 1. Check Totals
    const raisedUSDT = await presale.totalRaisedUSDT();
    const tokensSold = await presale.totalTokensSold();

    console.log(`\n--- Contract State ---`);
    console.log(`Total Raised USDT: ${hre.ethers.utils.formatUnits(raisedUSDT, 18)}`); // USDT is 18 decimals in this contract config? Wait, assume standard.
    // NOTE: If USDT is 18 decimals in contract config, we use formatUnits(x, 18).
    // The contract converts to 1e18 for calculations.

    console.log(`Total Tokens Sold: ${hre.ethers.utils.formatEther(tokensSold)}`);

    // Interpretation
    if (raisedUSDT.gt(0)) {
        console.log("✅ Valid Purchase Detected!");
    } else {
        console.log("⚠️ No registered purchases (USDT likely sent directly).");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
