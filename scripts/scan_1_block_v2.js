
const hre = require("hardhat");

async function main() {
    const PRESALE_ADDRESS = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
    // standard signature
    const EVENT_SIG = "event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost, string currency)";
    const TOPIC_0 = hre.ethers.utils.id("TokensPurchased(address,uint256,uint256,string)");

    console.log("Scanning RAW LOGS (V2: 1 Block per Call, 10 concurrent)...");

    const provider = hre.ethers.provider;
    const currentBlock = await provider.getBlockNumber();

    // Look back 5000 blocks to be safe
    const LOOKBACK = 5000;
    const endBlock = currentBlock;
    const startBlock = currentBlock - LOOKBACK;

    console.log(`Scanning ${endBlock} down to ${startBlock}...`);

    // Reverse scan (more likely to find recent buy sooner)
    const BATCH_SIZE = 10;

    for (let i = endBlock; i >= startBlock; i -= BATCH_SIZE) {
        const promises = [];

        for (let j = 0; j < BATCH_SIZE; j++) {
            const blockNum = i - j;
            if (blockNum < startBlock) break;

            promises.push(
                provider.getLogs({
                    fromBlock: blockNum,
                    toBlock: blockNum,
                    address: PRESALE_ADDRESS,
                    topics: [TOPIC_0]
                }).then(logs => ({ block: blockNum, logs })).catch(e => ({ block: blockNum, logs: [], error: e.message }))
            );
        }

        const results = await Promise.all(promises);

        for (const res of results) {
            if (res.logs && res.logs.length > 0) {
                for (const log of res.logs) {
                    const parsed = new hre.ethers.utils.Interface([EVENT_SIG]).parseLog(log);
                    const cost = hre.ethers.utils.formatEther(parsed.args.cost);

                    console.log(`\n🔎 Found Event at Block ${res.block}:`);
                    console.log(`   Buyer: ${parsed.args.buyer}`);
                    console.log(`   Cost: ${cost} ${parsed.args.currency}`);

                    if (Math.abs(parseFloat(cost) - 20.0) < 0.1) {
                        console.log("\n🎯 MATCH FOUND!");
                        console.log("Address:", parsed.args.buyer);
                        console.log("Amount:", hre.ethers.utils.formatEther(parsed.args.amount));
                        // Exit immediately
                        process.exit(0);
                    }
                }
            }
        }

        if (i % 100 === 0) console.log(`Scanned down to ${i}...`);

        // Anti-rate-limit delay
        await new Promise(r => setTimeout(r, 200));
    }
    console.log("Scan complete. No match found.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
