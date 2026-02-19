const hre = require("hardhat");

async function main() {
    console.log("Debugging Presale Contract...");

    const PRESALE = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
    const rpcUrl = "https://bsc.publicnode.com";
    const provider = new hre.ethers.providers.JsonRpcProvider(rpcUrl);

    // 1. Check if contract exists
    const code = await provider.getCode(PRESALE);
    if (code === "0x") {
        console.error("❌ No code at this address! It's an EOA or not deployed.");
        return;
    }
    console.log("✅ Contract Code found (Length: " + code.length + ")");

    // 2. Try minimal ABI
    // If it's a Proxy, we might need the implementation ABI.
    // Let's try to read 'owner' or 'USDT'
    const abi = [
        "function owner() view returns (address)",
        "function USDT() view returns (address)",
        "function totalRaised() view returns (uint256)"
    ];

    const contract = new hre.ethers.Contract(PRESALE, abi, provider);

    try {
        console.log("Reading owner...");
        const owner = await contract.owner();
        console.log("Owner:", owner);
    } catch (e) {
        console.log("Failed to read owner:", e.reason || e.code);
    }

    try {
        console.log("Reading USDT address...");
        const usdt = await contract.USDT();
        console.log("USDT Address:", usdt);
    } catch (e) {
        console.log("Failed to read USDT:", e.reason || e.code);
    }

    try {
        console.log("Reading totalRaised...");
        const raised = await contract.totalRaised();
        console.log("Total Raised:", hre.ethers.utils.formatEther(raised));
    } catch (e) {
        console.log("Failed to read totalRaised:", e.reason || e.code);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
