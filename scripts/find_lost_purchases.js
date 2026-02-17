
const hre = require("hardhat");

async function main() {
    const OLD_PRESALE = "0x7dC1787D85b871c76E446690b9acba3Baa45638A";
    const USDT = "0x55d398326f99059fF775485246999027B3197955";

    // Start block approx 2 days ago (BSC blocks are 3s, so ~28k blocks per day)
    // Let's scan last 50k blocks in chunks of 2k
    const provider = hre.ethers.provider;
    const currentBlock = await provider.getBlockNumber();
    const startBlock = currentBlock - 50000;

    console.log(`Scanning from ${startBlock} to ${currentBlock} for lost purchases...`);

    // 1. TokensPurchased Events
    const Presale = await hre.ethers.getContractFactory("NuerallyPresale");
    const presale = Presale.attach(OLD_PRESALE);
    const pFilter = presale.filters.TokensPurchased();

    // 2. USDT Transfers
    const erc20Abi = ["event Transfer(address indexed from, address indexed to, uint256 value)"];
    const usdtContract = new hre.ethers.Contract(USDT, erc20Abi, provider);
    const uFilter = usdtContract.filters.Transfer(null, OLD_PRESALE);

    // Chunk Loop
    const CHUNK_SIZE = 100;
    for (let i = startBlock; i < currentBlock; i += CHUNK_SIZE) {
        await new Promise(r => setTimeout(r, 200)); // Rate limit
        const toBlock = Math.min(i + CHUNK_SIZE, currentBlock);
        console.log(`Scanning ${i} -> ${toBlock}...`);

        try {
            // Check Purchases
            const pEvents = await presale.queryFilter(pFilter, i, toBlock);
            if (pEvents.length > 0) {
                console.log(`>>> FOUND ${pEvents.length} PURCHASE EVENTS <<<`);
                pEvents.forEach(e => {
                    console.log(`  [PURCHASE] Buyer: ${e.args.buyer}, Pay: ${hre.ethers.utils.formatEther(e.args.paymentAmount)}`);
                });
            }

            // Check USDT Transfers
            const uEvents = await usdtContract.queryFilter(uFilter, i, toBlock);
            if (uEvents.length > 0) {
                console.log(`>>> FOUND ${uEvents.length} USDT TRANSFERS <<<`);
                uEvents.forEach(e => {
                    console.log(`  [USDT] From: ${e.args.from}, Val: ${hre.ethers.utils.formatUnits(e.args.value, 18)}`);
                });
            }

        } catch (e) {
            console.log(`Error scanning chunk ${i}: ${e.message}`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
