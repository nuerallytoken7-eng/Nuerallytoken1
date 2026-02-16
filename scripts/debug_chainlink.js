
const ethers = require('ethers');
const RPC_URL = "https://bsc-dataseed.binance.org/";

const PROXY_ADDR = "0x0567f2323251F0aaB15fC0bd16f0F5D30716422b";

const PROXY_ABI = [
    "function aggregator() view returns (address)",
    "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
    "function decimals() view returns (uint8)",
    "function description() view returns (string)"
];

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

    // Check Chain ID
    const net = await provider.getNetwork();
    console.log("Network ChainID:", net.chainId); // Should be 56

    // Check Proxy
    const contract = new ethers.Contract(PROXY_ADDR, PROXY_ABI, provider);
    console.log(`Checking Proxy: ${PROXY_ADDR}`);

    try {
        const aggr = await contract.aggregator();
        console.log(`  -> aggregator(): ${aggr}`);
    } catch (e) {
        console.log(`  -> aggregator() FAILED: ${e.code || e.message}`);
    }

    try {
        const desc = await contract.description();
        console.log(`  -> description(): ${desc}`);
    } catch (e) {
        console.log(`  -> description() FAILED: ${e.code || e.message}`);
    }

    try {
        const data = await contract.latestRoundData();
        console.log(`  -> latestRoundData(): ${data[1].toString()}`);
    } catch (e) {
        console.log(`  -> latestRoundData() FAILED: ${e.code || e.message}`);
    }
}

main();
