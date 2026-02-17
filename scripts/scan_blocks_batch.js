
const hre = require("hardhat");

async function main() {
    const PRESALE_ADDRESS = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
    console.log("Scanning TRANSACTIONS (Batch Mode: 10 concurrent) for interaction with Presale...");

    const provider = hre.ethers.provider;
    const currentBlock = await provider.getBlockNumber();

    // Scan last 5000 blocks
    const LOOKBACK = 5000;
    const BATCH_SIZE = 10;

    for (let i = 0; i < LOOKBACK; i += BATCH_SIZE) {
        const promises = [];

        for (let j = 0; j < BATCH_SIZE; j++) {
            const blockNum = currentBlock - (i + j);
            if (blockNum < 0) break;

            promises.push(
                provider.getBlockWithTransactions(blockNum)
                    .then(block => ({ blockNum, block }))
                    .catch(e => ({ blockNum, error: e.message }))
            );
        }

        if (i % 100 === 0) console.log(`Scanning Block ${currentBlock - i}...`);

        const results = await Promise.all(promises);

        for (const res of results) {
            if (res.error) continue;
            if (!res.block || !res.block.transactions) continue;

            for (const tx of res.block.transactions) {
                if (tx.to && tx.to.toLowerCase() === PRESALE_ADDRESS.toLowerCase()) {
                    console.log(`\n🎯 FOUND INTERACTION at Block ${res.blockNum}!`);
                    console.log(`From: ${tx.from}`);
                    console.log(`Hash: ${tx.hash}`);

                    // Check Balance in Presale
                    try {
                        const Presale = await hre.ethers.getContractFactory("NuerallyPresale");
                        const presale = Presale.attach(PRESALE_ADDRESS);
                        const bal = await presale.purchasedTokens(tx.from);
                        console.log(`Allocated Tokens: ${hre.ethers.utils.formatEther(bal)}`);

                        if (bal.gt(0)) {
                            console.log("✅ THIS IS A BUYER!");
                            console.log(`FOUND ADDRESS: ${tx.from}`);
                            return;
                        }
                    } catch (e) { console.log("Error checking balance:", e.message); }
                }
            }
        }

        // Slight delay
        await new Promise(r => setTimeout(r, 200));
    }
    console.log("No interactions found in range.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
