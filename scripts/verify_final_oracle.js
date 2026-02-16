
const ethers = require('ethers');

// Try different RPC
const RPC_URL = "https://1rpc.io/bnb";

// Candidates
// From search: 0x05672A29B036f06a1240f53139C4e6504a252aeE
const ADDR_05672 = "0x05672A29B036f06a1240f53139C4e6504a252aeE";
const ADDR_7767 = "0x776798F1193714bd06118d773e47534D1e958d78";

const ABI = [
    "function description() view returns (string)",
    "function decimals() view returns (uint8)",
    "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
    "function latestAnswer() view returns (int256)"
];

async function check(address, name) {
    console.log(`\nChecking ${name}...`);
    try {
        address = ethers.utils.getAddress(address);
    } catch {
        address = ethers.utils.getAddress(address.toLowerCase());
    }
    console.log(`Address: ${address}`);

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(address, ABI, provider);

    try {
        const dec = await contract.decimals();
        console.log(`  Decimals: ${dec}`);
    } catch (e) { console.log(`  Decimals FAILED: ${e.code || e.message}`); }

    try {
        const desc = await contract.description();
        console.log(`  Description: ${desc}`);
    } catch (e) { console.log(`  Description FAILED: ${e.code || e.message}`); }

    try {
        const data = await contract.latestRoundData();
        console.log(`  V3 Price: ${data[1].toString()}`);
    } catch (e) { console.log(`  V3 FAILED: ${e.code || e.message}`); }

    try {
        const ans = await contract.latestAnswer();
        console.log(`  V2 Price: ${ans.toString()}`);
    } catch (e) { console.log(`  V2 FAILED: ${e.code || e.message}`); }
}

async function main() {
    await check(ADDR_05672, "New Candidate 05672");
    await check(ADDR_7767, "Old Candidate 7767");
}

main();
