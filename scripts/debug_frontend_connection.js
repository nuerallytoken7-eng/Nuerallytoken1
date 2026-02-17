const ethers = require("ethers");

// CONFIG FROM public/presale.js
const WEB3_CONFIG = {
    contractAddress: "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1",
    usdtAddress: "0x55d398326f99059fF775485246999027B3197955", // Binance-Peg BSC-USD
    tokenAddress: "0x0399b646d251F18edefB36DDC581597ABfDcA070",
    chainId: 56,
    rpcUrl: "https://bsc-dataseed.binance.org/",
};

// Minimal ABI for testing
const ABI = [
    "function claimingEnabled() public view returns (bool)",
    "function currentStage() public view returns (uint256)"
];

async function testConnection() {
    console.log("Testing connection to:", WEB3_CONFIG.rpcUrl);
    console.log("Contract:", WEB3_CONFIG.contractAddress);

    try {
        const provider = new ethers.providers.JsonRpcProvider(WEB3_CONFIG.rpcUrl);

        // 1. Test Network
        console.log("1. Fetching Network...");
        const network = await provider.getNetwork();
        console.log("   ✅ Connected to Chain ID:", network.chainId);

        if (network.chainId !== WEB3_CONFIG.chainId) {
            console.error("   ❌ Chain ID Mismatch! Expected:", WEB3_CONFIG.chainId);
        }

        // 2. Test Contract Read
        console.log("2. Reading Contract State...");
        const contract = new ethers.Contract(WEB3_CONFIG.contractAddress, ABI, provider);

        const isEnabled = await contract.claimingEnabled();
        console.log("   ✅ claimingEnabled:", isEnabled);

        const stage = await contract.currentStage();
        console.log("   ✅ currentStage:", stage.toString());

        console.log("\n✅ RPC and Contract are ACCESSIBLE from this machine.");

    } catch (e) {
        console.error("\n❌ CONNECTION FAILED:");
        console.error(e.message);
        if (e.code) console.error("Error Code:", e.code);
    }
}

testConnection();
