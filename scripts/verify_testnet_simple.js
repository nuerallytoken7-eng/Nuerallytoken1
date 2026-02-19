const hre = require("hardhat");

async function main() {
    console.log("Verifying Testnet Config...");

    const TESTNET_CONFIG = {
        presale: "0x6EE8D8fC4707605DaEeade2F178B142390c4F25d",
        token: "0x7dC1787D85b871c76E446690b9acba3Baa45638A"
    };

    const rpcUrl = "https://data-seed-prebsc-1-s1.binance.org:8545/";
    const provider = new hre.ethers.providers.JsonRpcProvider(rpcUrl);

    // 1. Check Token
    const tokenAbi = ["function name() view returns (string)", "function symbol() view returns (string)"];
    const token = new hre.ethers.Contract(TESTNET_CONFIG.token, tokenAbi, provider);

    try {
        console.log("Checking Token...");
        const name = await token.name();
        const symbol = await token.symbol();
        console.log(`✅ Token Found: ${name} (${symbol})`);
    } catch (e) {
        console.error("❌ Token Check Failed:", e.message);
    }

    // 2. Check Presale
    const presaleAbi = ["function currentStage() view returns (uint256)", "function presaleActive() view returns (bool)"];
    const presale = new hre.ethers.Contract(TESTNET_CONFIG.presale, presaleAbi, provider);

    try {
        console.log("Checking Presale...");
        const stage = await presale.currentStage();
        const active = await presale.presaleActive();
        console.log(`✅ Presale Found: Stage ${stage}, Active: ${active}`);
    } catch (e) {
        console.error("❌ Presale Check Failed:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
