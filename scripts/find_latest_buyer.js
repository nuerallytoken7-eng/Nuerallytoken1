
const hre = require("hardhat");

async function main() {
    const NEW_PRESALE = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
    console.log("Searching for Buyer in:", NEW_PRESALE);

    const Presale = await hre.ethers.getContractFactory("NuerallyPresale");
    const presale = Presale.attach(NEW_PRESALE);

    const currentBlock = await hre.ethers.provider.getBlockNumber();
    const CHUNK_SIZE = 500;
    const MAX_BLOCKS = 10000;

    // Filter
    const filter = presale.filters.TokensPurchased();

    for (let i = 0; i < MAX_BLOCKS; i += CHUNK_SIZE) {
        const toBlock = currentBlock - i;
        const fromBlock = Math.max(toBlock - CHUNK_SIZE, 0);

        console.log(`Scanning ${fromBlock} -> ${toBlock}...`);

        try {
            const events = await presale.queryFilter(filter, fromBlock, toBlock);
            if (events.length > 0) {
                console.log(`\n🎉 FOUND ${events.length} EVENT(S)!`);
                for (const e of events) {
                    console.log(`Buyer: ${e.args.buyer}`);
                    console.log(`Amount: ${hre.ethers.utils.formatEther(e.args.amount)}`);
                }
                return; // Stop after finding recent events
            }
        } catch (e) {
            console.log(`Error scanning chunk: ${e.message}`);
        }
    }
    console.log("No events found in range.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
