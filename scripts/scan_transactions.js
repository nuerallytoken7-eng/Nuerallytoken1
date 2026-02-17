
const hre = require("hardhat");

async function main() {
    const PRESALE_ADDRESS = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
    console.log("Scanning TRANSACTIONS (getBlockWithTransactions) for interaction with Presale...");

    const provider = hre.ethers.provider;
    const currentBlock = await provider.getBlockNumber();

    // Scan last 1000 blocks (should be enough)
    const LOOKBACK = 1000;

    for (let i = 0; i < LOOKBACK; i++) {
        const blockNum = currentBlock - i;

        if (i % 50 === 0) console.log(`Scanning Block ${blockNum}...`);

        try {
            const block = await provider.getBlockWithTransactions(blockNum);

            if (!block || !block.transactions) continue;

            for (const tx of block.transactions) {
                if (tx.to && tx.to.toLowerCase() === PRESALE_ADDRESS.toLowerCase()) {
                    console.log(`\n🎯 FOUND INTERACTION at Block ${blockNum}!`);
                    console.log(`From: ${tx.from}`);
                    console.log(`Hash: ${tx.hash}`);

                    // We found a transaction to the contract.
                    // Now check if this user has a balance.
                    const Presale = await hre.ethers.getContractFactory("NuerallyPresale");
                    const presale = Presale.attach(PRESALE_ADDRESS);
                    const bal = await presale.purchasedTokens(tx.from);
                    console.log(`Allocated Tokens: ${hre.ethers.utils.formatEther(bal)}`);

                    if (bal.gt(0)) {
                        console.log("✅ THIS IS A BUYER!");
                        return; // We found them
                    } else {
                        console.log("❌ No tokens allocated (failed tx or other call).");
                    }
                }
            }
        } catch (e) {
            console.log(`Error reading block ${blockNum}: ${e.message}`);
        }
    }
    console.log("No interactions found in range.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
