const hre = require("hardhat");

async function main() {
    const DEPLOYER = "0x4F277Bb31261A123717d8aA6F573775ee11148e7"; // From previous script
    const rpcUrl = "https://bsc.publicnode.com"; // Public RPC
    const provider = new hre.ethers.providers.JsonRpcProvider(rpcUrl);

    console.log(`Scanning deployments from ${DEPLOYER} (Last 7 Days)...`);

    const currentBlock = await provider.getBlockNumber();
    const startBlock = currentBlock - 200000; // ~7 days

    // We can't easily filter for "Contract Creation" with standard filters on all RPCs
    // But we can check outgoing transactions from the deployer.
    // However, filtering by "from" in getLogs only works for EVENTS, not native txs.
    // getting full block transactions is too heavy.

    // ALTERNATIVE: Use Etherscan/BscScan API if available? No API key.

    // Fallback: Check hardcoded list of candidate addresses I saw earlier.
    console.log("Checking candidate addresses for activity...");

    const CANDIDATES = [
        "0x7dC1787D85b871c76E446690b9acba3Baa45638A", // Debug script
        "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1", // Current
        "0x6EE8D8fC4707605DaEeade2F178B142390c4F25d", // Testnet
        "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
    ];

    for (const addr of CANDIDATES) {
        try {
            const code = await provider.getCode(addr);
            if (code === "0x") {
                console.log(`[${addr}] -> EOA (Not a contract)`);
                continue;
            }

            // Check USDT Balance of this contract
            const USDT = "0x55d398326f99059fF775485246999027B3197955";
            const usdt = new hre.ethers.Contract(USDT, ["function balanceOf(address) view returns (uint256)"], provider);
            const bal = await usdt.balanceOf(addr);

            console.log(`[${addr}] -> Contract. USDT Balance: ${hre.ethers.utils.formatEther(bal)}`);

        } catch (e) {
            console.log(`[${addr}] -> Error: ${e.message}`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
