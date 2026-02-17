
const hre = require("hardhat");

async function main() {
    const PRESALE_ADDRESS = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
    const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

    // Transfer(address from, address to, uint256 value)
    // topic0 = keccak256("Transfer(address,address,uint256)")
    const TOPIC_0 = hre.ethers.utils.id("Transfer(address,address,uint256)");

    // topic2 = to (Presale Address, padded)
    const TOPIC_2 = hre.ethers.utils.hexZeroPad(PRESALE_ADDRESS, 32);

    console.log("Scanning USDT Transfers TO Presale...");

    const provider = hre.ethers.provider;
    const currentBlock = await provider.getBlockNumber();

    // Scan last 10,000 blocks
    const CHUNK = 100; // Reduce chunk size significantly

    for (let i = 0; i < 10000; i += CHUNK) {
        const toBlock = currentBlock - i;
        const fromBlock = toBlock - CHUNK;

        console.log(`Scanning ${fromBlock} -> ${toBlock}...`);

        try {
            const logs = await provider.getLogs({
                fromBlock: fromBlock,
                toBlock: toBlock,
                address: USDT_ADDRESS,
                topics: [TOPIC_0, null, TOPIC_2] // topic1 = from (any), topic2 = to (presale)
            });

            for (const log of logs) {
                const parsed = new hre.ethers.utils.Interface([
                    "event Transfer(address indexed from, address indexed to, uint256 value)"
                ]).parseLog(log);

                const val = hre.ethers.utils.formatEther(parsed.args.value);
                console.log(`\n💸 Found Transfer: ${val} USDT from ${parsed.args.from}`);

                if (Math.abs(parseFloat(val) - 20.0) < 0.1) {
                    console.log("\n🎯 MATCH FOUND!");
                    console.log("Address:", parsed.args.from);
                    return;
                }
            }
        } catch (e) {
            console.log("Error:", e.message);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
