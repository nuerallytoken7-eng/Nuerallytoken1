
const ethers = require('ethers');

const RPC_URL = "https://bsc-dataseed.binance.org/";

const ADDR_1 = "0x0567F2323251f0Aab15fc0bD16F0F5D30716422b"; // The one present in code
const ADDR_2 = "0x14e613acB0C77B847fC55030e87a935f0b5d9540a"; // The one from search?

const ABI = [
    "function description() view returns (string)",
    "function decimals() view returns (uint8)",
    "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)"
];

async function check(address, name) {
    console.log(`Checking ${name} (${address})...`);
    try {
        address = ethers.utils.getAddress(address);
    } catch (e) {
        console.log(`  Invalid Checksum, trying lowercase...`);
        address = address.toLowerCase();
    }

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(address, ABI, provider);

    try {
        const desc = await contract.description();
        console.log(`  Description: ${desc}`);
        const decimals = await contract.decimals();
        console.log(`  Decimals: ${decimals}`);
        const data = await contract.latestRoundData();
        console.log(`  Price: ${data[1].toString()}`);
        console.log(`  Updated At: ${new Date(data[3].toNumber() * 1000).toISOString()}`);
        return true;
    } catch (e) {
        console.error(`  FAILED: ${e.reason || e.message}`);
        return false;
    }
}

async function main() {
    await check(ADDR_1, "Address 1 (Original)");
    await check(ADDR_2, "Address 2 (Search)");
}

main();
