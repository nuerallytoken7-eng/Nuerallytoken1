
const hre = require("hardhat");

async function main() {
    console.log("Fixing Referral System on Testnet...");

    // 0. Setup
    const [deployer] = await hre.ethers.getSigners();
    console.log("Account:", deployer.address);

    // Addresses (from presale.js or recent deployment)
    const PRESALE_ADDRESS = "0x6EE8D8fC4707605DaEeade2F178B142390c4F25d"; // Testnet Presale
    const TOKEN_ADDRESS = "0x7dC1787D85b871c76E446690b9acba3Baa45638A";   // Testnet Token

    const token = await hre.ethers.getContractAt("IERC20", TOKEN_ADDRESS);
    const presale = await hre.ethers.getContractAt("NuerallyPresale", PRESALE_ADDRESS);

    // 1. Approve Marketing Wallet (Deployer) -> Presale
    // The Presale contract pays referrals by transferring FROM marketing wallet TO referrer.
    console.log("Approving Presale to spend Marketing Wallet tokens...");
    const approveTx = await token.approve(PRESALE_ADDRESS, hre.ethers.constants.MaxUint256);
    await approveTx.wait();
    console.log("✅ Marketing Wallet Approved!");

    // 2. Ensure Claiming Enabled
    const enabled = await presale.claimingEnabled();
    if (!enabled) {
        console.log("Enabling Claiming...");
        const tx = await presale.enableClaiming();
        await tx.wait();
        console.log("✅ Claiming Enabled!");
    } else {
        console.log("✅ Claiming already enabled.");
    }

    // 3. Reset Launch Time (to bypass 30 day lock for testing)
    // If launchTime is 0, then launchTime + 30 days < now (assuming 0 is 1970)
    // Unless logic is `require(block.timestamp >= launchTime + 30 days)`
    // If launchTime is 0, 0 + 30 days = 30 days. Now is > 30 days. So it passes.

    // Check current launchTime
    const currentLaunchTime = await presale.launchTime();
    console.log("Current Launch Time:", currentLaunchTime.toString());

    if (currentLaunchTime.gt(0)) {
        console.log("Resetting Launch Time to 0 for immediate testing...");
        const timeTx = await presale.setLaunchTime(0);
        await timeTx.wait();
        console.log("✅ Launch Time Reset!");
    } else {
        console.log("✅ Launch Time is already 0 (Immediate Unlock).");
    }

    console.log("\n--- REFERRAL SYSTEM FIXED ---");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
