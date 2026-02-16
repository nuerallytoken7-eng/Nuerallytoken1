
const ethers = require('ethers');
const RPC_URL = "https://bsc-dataseed.binance.org/";

const rawAddr = "0x0567F2323251f0Aab15fc0bD16F0F5D30716422b";

async function main() {
    console.log("Input:", rawAddr);
    try {
        const checksum = ethers.utils.getAddress(rawAddr.toLowerCase());
        console.log("Checksum:", checksum);

        // Now try to call it
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(checksum, ["function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)"], provider);

        console.log("Calling latestRoundData...");
        const data = await contract.latestRoundData();
        console.log("Success! Price:", data[1].toString());

    } catch (e) {
        console.error("Error:", e.message);
    }
}

main();
