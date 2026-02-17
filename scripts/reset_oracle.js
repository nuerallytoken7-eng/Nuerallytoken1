
const hre = require("hardhat");
const PRESALE_ADDR = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
const STANDARD_ORACLE = "0x0567F2323251f0Aab15fc0bD16F0F5D30716422b";

async function main() {
    console.log("Resetting Oracle to Standard Proxy...");
    const Presale = await hre.ethers.getContractFactory("NuerallyPresale");
    const presale = Presale.attach(PRESALE_ADDR);

    // Checksum
    const addr = hre.ethers.utils.getAddress(STANDARD_ORACLE.toLowerCase());

    const tx = await presale.setPriceFeed(addr);
    console.log(`Tx sent: ${tx.hash}`);
    await tx.wait();
    console.log("✅ Reset Complete.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
