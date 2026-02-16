
const ethers = require('ethers');
const RPC_URL = "https://bsc-dataseed.binance.org/";

// Corrected from "0x14e613ac0x14e613ac..." -> Looks like repeat
// Likely: 0x14e613ac246a39b36bc940a027fc640724068c96?

const RAW_ADDR = "0x14e613ac246a39b36bc940a027fc640724068c96"; // Guessing

async function main() {
    console.log("Input:", RAW_ADDR);

    // Check checksum
    let addr;
    try {
        addr = ethers.utils.getAddress(RAW_ADDR);
        console.log("Checksum match:", addr);
    } catch (e) {
        console.log("Checksum fail/invalid, trying lower...");
        try {
            addr = ethers.utils.getAddress(RAW_ADDR.toLowerCase());
            console.log("Fixed Checksum:", addr);
        } catch (e2) {
            console.error("FATAL: Cannot fix address:", e2.message);
            return;
        }
    }

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(addr, [
        "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
        "function description() view returns (string)",
        "function decimals() view returns (uint8)"
    ], provider);

    try {
        const desc = await contract.description();
        console.log("Description:", desc);
        const data = await contract.latestRoundData();
        console.log("Price:", data[1].toString());
    } catch (e) {
        console.error("Call Failed:", e.code || e.message);
    }
}

main();
