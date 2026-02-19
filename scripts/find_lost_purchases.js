const hre = require("hardhat");

const RPCS = [
    "https://bsc-dataseed.binance.org/",
    "https://bsc-dataseed1.defibit.io/",
    "https://bsc-dataseed1.ninicoin.io/",
    "https://bsc.publicnode.com"
];

const USER = "0x1ca8fc3aa69D8c1baFE0FDA4aDb70AeEAeF5f3E4";
const CURRENT_PRESALE = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
const USDT = "0x55d398326f99059fF775485246999027B3197955";

async function scanWithProvider(rpcUrl) {
    console.log(`\n--- Trying RPC: ${rpcUrl} ---`);
    const provider = new hre.ethers.providers.JsonRpcProvider(rpcUrl);

    try {
        const currentBlock = await provider.getBlockNumber();
        // Scan last 4 days (approx 115,000 blocks at 3s/block) to cover "2-3 days ago"
        const startBlock = currentBlock - 115000;

        console.log(`Scanning outgoing USDT transfers from ${USER}`);
        console.log(`Range: ${startBlock} -> ${currentBlock} (~4 Days)`);

        const usdtContract = new hre.ethers.Contract(USDT, [
            "event Transfer(address indexed from, address indexed to, uint256 value)"
        ], provider);

        const filter = usdtContract.filters.Transfer(USER, null); // From User

        // Chunk Scan
        const CHUNK_SIZE = 5000;
        let foundAny = false;

        for (let i = startBlock; i < currentBlock; i += CHUNK_SIZE) {
            const toBlock = Math.min(i + CHUNK_SIZE - 1, currentBlock);
            process.stdout.write(`Scanning ${i}... \r`);

            const events = await usdtContract.queryFilter(filter, i, toBlock);

            for (const e of events) {
                const amount = hre.ethers.utils.formatEther(e.args.value);
                const to = e.args.to;

                // Check if amount is ~20 (+/- 1.0)
                if (Math.abs(parseFloat(amount) - 20.0) < 1.0) {
                    console.log(`\n\n>>> 🟢 FOUND 20 USDT CANDIDATE <<<`);
                    console.log(`Tx: ${e.transactionHash}`);
                    console.log(`To: ${to}`);
                    console.log(`Val: ${amount} USDT`);
                    console.log(`Block: ${e.blockNumber}`);

                    const timestamp = (await e.getBlock()).timestamp;
                    console.log(`Date: ${new Date(timestamp * 1000).toISOString()}`);

                    if (to.toLowerCase() === CURRENT_PRESALE.toLowerCase()) {
                        console.log("  (⚠️ This is the Current Presale - SKIPPING)");
                    } else {
                        console.log("  >>> ✅ LIKELY THE MISSING PURCHASE! <<<");
                        foundAny = true;
                        // We could stop here, but let's see if there are others
                    }
                }
            }
        }

        return true; // Success scan
    } catch (e) {
        console.warn(`\nRPC Failed or Pruned: ${e.message.slice(0, 100)}...`);
        return false; // Try next
    }
}

async function main() {
    for (const rpc of RPCS) {
        const success = await scanWithProvider(rpc);
        if (success) {
            console.log("\nScan Complete.");
            break;
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
