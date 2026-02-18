
const hre = require("hardhat");

async function main() {
    console.log("Checking balance on BSC Testnet...");
    const [deployer] = await hre.ethers.getSigners();

    if (!deployer) {
        console.error("No account found! Check .env file.");
        process.exit(1);
    }

    const address = await deployer.getAddress();
    console.log("Account:", address);

    const balance = await deployer.getBalance();
    console.log("Balance:", hre.ethers.utils.formatEther(balance), "BNB");

    if (balance.eq(0)) {
        console.error("❌ ERROR: Balance is 0 BNB. Please use a faucet to get TBNB.");
        process.exit(1);
    } else {
        console.log("✅ Balance detected. Proceeding...");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
