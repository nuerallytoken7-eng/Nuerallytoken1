
const hre = require("hardhat");

async function main() {
    const PRESALE_ADDRESS = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
    const TOPIC_0 = hre.ethers.utils.id("TokensPurchased(address,uint256,uint256,string)");

    console.log("Scanning RAW LOGS (Ultra Safe Mode: 100 blocks)...");

    const provider = hre.ethers.provider;
    const currentBlock = await provider.getBlockNumber();
    const CHUNK = 100; // SUPER SMALL CHUNK

    // Scan last 5,000 blocks (should be enough for recent buy)
    for (let i = 0; i < 5000; i += CHUNK) {
        const toBlock = currentBlock - i;
        const fromBlock = toBlock - CHUNK;

        console.log(`Scanning ${fromBlock} -> ${toBlock}...`);

        try {
            const logs = await provider.getLogs({
                fromBlock: fromBlock,
                toBlock: toBlock,
                address: PRESALE_ADDRESS,
                topics: [TOPIC_0]
            });

            for (const log of logs) {
                const parsed = new hre.ethers.utils.Interface([
                    "event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost, string currency)"
                ]).parseLog(log);

                const cost = hre.ethers.utils.formatEther(parsed.args.cost);
                console.log(`  -> Found Event: ${cost} ${parsed.args.currency} from ${parsed.args.buyer}`);

                if (parseFloat(cost) === 20.0) {
                    console.log("\n🎯 FOUND THE BUYER!");
                    console.log("Address:", parsed.args.buyer);
                    console.log("Amount:", hre.ethers.utils.formatEther(parsed.args.amount));
                    return;
                }
            }
        } catch (e) {
            console.log("Error:", e.message);
            // Verify if we can even scan 10 blocks?
            if (i === 0) {
                console.log("RPC is extremely strict. Trying 1 block...");
                // fallback logic not needed if 100 fails we are doomed
            }
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
