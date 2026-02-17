
const hre = require("hardhat");

async function main() {
    const PRESALE_ADDRESS = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";

    // Event Signature: TokensPurchased(address buyer, uint256 amount, uint256 cost, string currency)
    // topic0 = keccak256("TokensPurchased(address,uint256,uint256,string)")
    const TOPIC_0 = hre.ethers.utils.id("TokensPurchased(address,uint256,uint256,string)");

    console.log("Scanning RAW LOGS for 20 USDT purchase...");

    const provider = hre.ethers.provider;
    const currentBlock = await provider.getBlockNumber();
    const CHUNK = 1000;

    // Scan last 10,000 blocks
    for (let i = 0; i < 10000; i += CHUNK) {
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

                // Check if cost matches 20 USDT (20 * 1e18)
                const cost = hre.ethers.utils.formatEther(parsed.args.cost);

                if (parseFloat(cost) === 20.0) {
                    console.log("\n🎯 FOUND THE BUYER!");
                    console.log("Address:", parsed.args.buyer);
                    console.log("Amount:", hre.ethers.utils.formatEther(parsed.args.amount));
                    console.log("Tx Hash:", log.transactionHash);
                    return;
                }
            }
        } catch (e) {
            console.log("Error:", e.message);
        }
    }
    console.log("No 20 USDT purchase found in range.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
