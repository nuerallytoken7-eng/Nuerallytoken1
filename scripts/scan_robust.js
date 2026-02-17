
const hre = require("hardhat");

async function main() {
    const PRESALE_ADDRESS = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
    console.log("Scanning TRANSACTIONS (Robust Sequential Mode)...");

    const provider = hre.ethers.provider;
    const currentBlock = await provider.getBlockNumber();
    const LOOKBACK = 2000;

    for (let i = 0; i < LOOKBACK; i++) {
        const blockNum = currentBlock - i;
        process.stdout.write(`\rScanning ${blockNum}...`);

        try {
            // Sequential scan to avoid any rate limit issues
            const block = await provider.getBlockWithTransactions(blockNum);

            if (block && block.transactions) {
                for (const tx of block.transactions) {
                    if (tx.to && tx.to.toLowerCase() === PRESALE_ADDRESS.toLowerCase()) {
                        console.log(`\n\n🎯 INTERACTION FOUND at Block ${blockNum}!`);
                        console.log(`From: ${tx.from}`);
                        console.log(`Hash: ${tx.hash}`);

                        // Check balance
                        const Presale = await hre.ethers.getContractFactory("NuerallyPresale");
                        const presale = Presale.attach(PRESALE_ADDRESS);
                        const bal = await presale.purchasedTokens(tx.from);
                        console.log(`Balance: ${hre.ethers.utils.formatEther(bal)}`);

                        if (bal.gt(0)) {
                            console.log("✅ CONFIRMED BUYER!");
                            return;
                        }
                    }
                }
            }
        } catch (e) {
            // Ignore errors and continue (block might be skipped but we have no choice)
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
