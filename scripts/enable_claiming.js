
const hre = require("hardhat");

async function main() {
    const PRESALE_ADDRESS = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
    console.log("Enabling Claiming on:", PRESALE_ADDRESS);

    const Presale = await hre.ethers.getContractFactory("NuerallyPresale");
    const presale = Presale.attach(PRESALE_ADDRESS);

    // Check status
    const isEnabled = await presale.claimingEnabled();
    if (isEnabled) {
        console.log("✅ Claiming is already enabled.");
        return;
    }

    console.log("Activating Claiming...");
    const tx = await presale.enableClaiming();
    console.log("Tx Hash:", tx.hash);
    await tx.wait();

    console.log("✅ Claiming Enabled Successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
