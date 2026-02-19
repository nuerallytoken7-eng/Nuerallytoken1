const hre = require("hardhat");

async function main() {
    console.log("Checking Recent Purchases on Mainnet...");

    const PRESALE = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";

    // Use a robust public RPC for BSC Mainnet
    const rpcUrls = [
        "https://bsc.publicnode.com",
        "https://1rpc.io/bnb",
        "https://bsc-dataseed.binance.org/"
    ];

    let provider;
    for (const url of rpcUrls) {
        try {
            console.log(`Trying to connect to ${url}...`);
            provider = new hre.ethers.providers.JsonRpcProvider(url);
            await provider.getNetwork();
            console.log("Connected to", url);
            break;
        } catch (e) {
            console.log(`Failed to connect to ${url}: ${e.message}`);
        }
    }

    if (!provider) {
        throw new Error("Could not connect to any BSC RPC.");
    }

    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 2000; // Scan last 2000 blocks (~1.5 hours)
    console.log(`Scanning blocks ${fromBlock} to ${currentBlock}...`);

    const topic = hre.ethers.utils.id("TokensPurchased(address,uint256,uint256,string)");
    console.log("Event Topic:", topic);

    try {
        const logs = await provider.getLogs({
            fromBlock: fromBlock,
            toBlock: currentBlock,
            address: PRESALE,
            topics: [topic]
        });

        if (logs.length === 0) {
            console.log("No purchases found in the last 200 blocks.");
        } else {
            console.log(`Found ${logs.length} purchase(s):\n`);

            const iface = new hre.ethers.utils.Interface([
                "event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost, string currency)"
            ]);

            // Reverse to show newest first
            const sortedLogs = logs.sort((a, b) => b.blockNumber - a.blockNumber);

            sortedLogs.forEach((log) => {
                try {
                    const parsed = iface.parseLog(log);
                    const { buyer, amount, cost, currency } = parsed.args;
                    console.log(`- Block: ${log.blockNumber}`);
                    console.log(`  Buyer: ${buyer}`);
                    console.log(`  Amount: ${hre.ethers.utils.formatEther(amount)} NUERALLY`);
                    console.log(`  Cost: ${hre.ethers.utils.formatEther(cost)} ${currency}`);
                    console.log(`  Tx Hash: ${log.transactionHash}`);
                    console.log("---------------------------------------------------");
                } catch (e) {
                    console.log("Failed to parse log:", log);
                }
            });
        }
    } catch (e) {
        console.error("RPC Error:", e);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
