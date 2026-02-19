const hre = require("hardhat");

async function main() {
    console.log("Checking Presale State on Mainnet...");

    const PRESALE = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
    const rpcUrl = "https://bsc.publicnode.com";
    const provider = new hre.ethers.providers.JsonRpcProvider(rpcUrl);

    const abi = [
        "function claimingEnabled() view returns (bool)",
        "function totalRaisedUSDT() view returns (uint256)",
        "function currentStage() view returns (uint256)",
        "function usdt() view returns (address)"
    ];

    const contract = new hre.ethers.Contract(PRESALE, abi, provider);

    try {
        const claiming = await contract.claimingEnabled();
        const raised = await contract.totalRaisedUSDT();
        const stage = await contract.currentStage();

        console.log(`\n--- Contract Status ---`);
        console.log(`Address: ${PRESALE}`);
        console.log(`Claiming Enabled: ${claiming}`);
        console.log(`Total Raised USDT: ${hre.ethers.utils.formatEther(raised)}`);
        console.log(`Current Stage: ${stage.toString()}`);

        if (claiming) {
            console.log("✅ Claiming IS enabled. Users should be able to claim.");
        } else {
            console.log("⚠️ Claiming is DISABLED. Users cannot claim yet.");
        }

    } catch (e) {
        console.error("Error reading contract:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
