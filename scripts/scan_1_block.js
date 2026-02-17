
const hre = require("hardhat");

async function main() {
    const PRESALE_ADDRESS = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
    const TOPIC_0 = hre.ethers.utils.id("TokensPurchased(address,uint256,uint256,string)");

    console.log("Scanning RAW LOGS (The Nuclear Option: 1 Block per Call)...");

    const provider = hre.ethers.provider;
    const currentBlock = await provider.getBlockNumber();

    // Scan last 3,000 blocks (approx 2.5 hours)
    const RANGE = 3000;
    const endBlock = currentBlock;
    const startBlock = currentBlock - RANGE;

    console.log(`Scanning ${startBlock} -> ${endBlock}...`);

    const BATCH_SIZE = 50; // Parallel request batch size

    for (let i = startBlock; i <= endBlock; i += BATCH_SIZE) {
        const promises = [];
        const blockNumbers = [];

        for (let j = 0; j < BATCH_SIZE; j++) {
            const blockNum = i + j;
            if (blockNum > endBlock) break;

            blockNumbers.push(blockNum);
            promises.push(
                provider.getLogs({
                    fromBlock: blockNum,
                    toBlock: blockNum,
                    address: PRESALE_ADDRESS,
                    topics: [TOPIC_0]
                }).catch(e => {
                    // Ignore transient errors in batch, we will retry critical failures manually if needed
                    // but usually 1-block request never fails unless rate limited by Frequency not Size
                    return [];
                })
            );
        }

        // Wait for batch
        if (i % 100 === 0) console.log(`Processing ${i}...`);

        const results = await Promise.all(promises);

        for (const logs of results) {
            if (!logs || logs.length === 0) continue;

            for (const log of logs) {
                const parsed = new hre.ethers.utils.Interface([
                    "event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost, string currency)"
                ]).parseLog(log);

                const cost = hre.ethers.utils.formatEther(parsed.args.cost);
                console.log(`\n🔎 Found Event at Block ${log.blockNumber}:`);
                console.log(`   Buyer: ${parsed.args.buyer}`);
                console.log(`   Cost: ${cost} ${parsed.args.currency}`);

                if (Math.abs(parseFloat(cost) - 20.0) < 0.1) {
                    console.log("\n🎯 MATCH FOUND!");
                    console.log("Address:", parsed.args.buyer);
                    return;
                }
            }
        }

        // Slight delay to be nice
        await new Promise(r => setTimeout(r, 100));
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
