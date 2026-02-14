const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const balance = await deployer.getBalance();
    console.log(`Balance of ${deployer.address}: ${hre.ethers.utils.formatEther(balance)} BNB`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
