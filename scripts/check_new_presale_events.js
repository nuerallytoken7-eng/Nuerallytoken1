
const hre = require("hardhat");

async function main() {
    const NEW_PRESALE = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";

    console.log("Scanning New Presale:", NEW_PRESALE);

    const Presale = await hre.ethers.getContractFactory("NuerallyPresale");
    const presale = Presale.attach(NEW_PRESALE);

    // Filter for TokensPurchased
    const filter = presale.filters.TokensPurchased();

    // Scan from deployment (should be recent)
    // We can just scan last 5000 blocks to be safe and fast
    const currentBlock = await hre.ethers.provider.getBlockNumber();
    const startBlock = currentBlock - 5000;

    console.log(`Scanning blocks ${startBlock} to ${currentBlock}...`);

    const events = await presale.queryFilter(filter, startBlock, "latest");

    console.log(`Found ${events.length} Purchase Events:`);

    for (const e of events) {
        console.log(`\n--- Purchase Found ---`);
        console.log(`Buyer: ${e.args.buyer}`);
        console.log(`Amount (Tokens): ${hre.ethers.utils.formatEther(e.args.amount)}`);
        console.log(`Cost: ${hre.ethers.utils.formatEther(e.args.cost)}`); // Normalized 18 decimals?
        console.log(`Currency: ${e.args.currency}`);

        // Check Allocation in Contract
        const allocation = await presale.purchasedTokens(e.args.buyer);
        console.log(`Contract Allocation: ${hre.ethers.utils.formatEther(allocation)} NUERALLY`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
