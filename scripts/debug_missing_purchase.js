const hre = require("hardhat");

async function main() {
    console.log("Debugging Missing Purchase (Checking USDT Transfers)...");

    const PRESALE = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
    const USDT = "0x55d398326f99059fF775485246999027B3197955"; // BSC-USD

    const rpcUrls = [
        "https://bsc.publicnode.com",
        "https://1rpc.io/bnb",
        "https://bsc-dataseed.binance.org/"
    ];

    let provider;
    for (const url of rpcUrls) {
        try {
            provider = new hre.ethers.providers.JsonRpcProvider(url);
            await provider.getNetwork();
            console.log("Connected to", url);
            break;
        } catch (e) { }
    }

    if (!provider) throw new Error("No RPC Connection");

    const endBlock = await provider.getBlockNumber();
    const startBlock = endBlock - 5000; // Scan last 5000 blocks (~3-4 hours)

    console.log(`Scanning blocks ${startBlock} to ${endBlock} for USDT Activity (Approvals & Transfers)...`);

    const usdtContract = new hre.ethers.Contract(USDT, [
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event Approval(address indexed owner, address indexed spender, uint256 value)"
    ], provider);

    // 1. Check Transfers to Presale (Loop to avoid limits)
    let transferLogs = [];
    const transferFilter = usdtContract.filters.Transfer(null, PRESALE);

    for (let i = startBlock; i <= endBlock; i += 1000) {
        const to = Math.min(i + 999, endBlock);
        try {
            const logs = await usdtContract.queryFilter(transferFilter, i, to);
            transferLogs = transferLogs.concat(logs);
        } catch (e) {
            console.log(`Error scanning transfers ${i}-${to}: ${e.message}`);
        }
    }

    if (transferLogs.length > 0) {
        console.log(`\n⚠️ Found ${transferLogs.length} Direct USDT Transfer(s) to Presale:`);
        transferLogs.forEach(log => {
            const amount = hre.ethers.utils.formatEther(log.args.value);
            console.log(`- Time: Block ${log.blockNumber}`);
            console.log(`  From: ${log.args.from}`);
            console.log(`  Amount: ${amount} USDT`);
            console.log(`  Tx: ${log.transactionHash} \n`);
        });
    } else {
        console.log("\n❌ No Direct USDT Transfers found to Presale.");
    }

    // 2. Check Approvals for Presale (Did they at least approve?)
    console.log("\nScanning for Approvals to Pesale...");
    let approvalLogs = [];
    const approvalFilter = usdtContract.filters.Approval(null, PRESALE);

    for (let i = startBlock; i <= endBlock; i += 1000) {
        const to = Math.min(i + 999, endBlock);
        try {
            const logs = await usdtContract.queryFilter(approvalFilter, i, to);
            approvalLogs = approvalLogs.concat(logs);
        } catch (e) {
            console.log(`Error scanning approvals ${i}-${to}: ${e.message}`);
        }
    }

    if (approvalLogs.length > 0) {
        console.log(`\n✅ Found ${approvalLogs.length} Approval(s) for Presale:`);
        approvalLogs.forEach(log => {
            console.log(`- Owner: ${log.args.owner}`);
            console.log(`  Tx: ${log.transactionHash}`);
        });
    } else {
        console.log("❌ No Approvals found for Presale.");
    }

    return;
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
