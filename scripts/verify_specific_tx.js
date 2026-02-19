const hre = require("hardhat");

async function main() {
    // User provided hash
    const TX_HASH = "0xd9f1dc129c7d03d8e7aacc5e0d8ac1c1691948b418cf0e71e68a8d8fc3fa8927";

    console.log(`Verifying Transaction: ${TX_HASH}`);

    const rpcUrl = "https://bsc.publicnode.com";
    const provider = new hre.ethers.providers.JsonRpcProvider(rpcUrl);

    try {
        const tx = await provider.getTransaction(TX_HASH);
        const receipt = await provider.getTransactionReceipt(TX_HASH);

        if (!tx || !receipt) {
            console.log("❌ Transaction or Receipt NOT FOUND.");
            return;
        }

        console.log("\n--- Transaction Details ---");
        console.log(`From: ${tx.from}`);
        console.log(`To: ${tx.to}`);
        console.log(`Status: ${receipt.status === 1 ? "✅ SUCCESS" : "❌ FAILED"}`);
        console.log(`Block: ${receipt.blockNumber}`);

        // Decode Logs for USDT Transfer
        const USDT = "0x55d398326f99059fF775485246999027B3197955";

        console.log("\n--- Event Logs ---");
        const iface = new hre.ethers.utils.Interface([
            "event Transfer(address indexed from, address indexed to, uint256 value)",
            "event Approval(address indexed owner, address indexed spender, uint256 value)"
        ]);

        let foundUSDT = false;

        if (receipt.logs) {
            for (const log of receipt.logs) {
                if (log.address.toLowerCase() === USDT.toLowerCase()) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed.name === "Transfer") {
                            const amount = hre.ethers.utils.formatEther(parsed.args.value);
                            console.log(`[USDT Transfer]`);
                            console.log(`  From: ${parsed.args.from}`);
                            console.log(`  To: ${parsed.args.to}`);
                            console.log(`  Value: ${amount} USDT`);

                            if (Math.abs(parseFloat(amount) - 20.0) < 1.0) {
                                console.log("  >>> ✅ FOUND 20 USDT TRANSFER <<<");
                                foundUSDT = true;
                            }
                        }
                    } catch (e) {
                        // console.log(`[USDT Log] (Could not decode) ${log.data}`);
                    }
                }
            }
        }

        if (!foundUSDT && receipt.status === 1) {
            console.log("⚠️ Transaction Success, but NO USDT Transfer found.");
        }

    } catch (e) {
        console.error("Error fetching transaction:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
