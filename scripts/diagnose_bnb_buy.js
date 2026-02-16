
const ethers = require('ethers');

const RPC_URL = "https://bsc-dataseed.binance.org/";
const CONTRACT_ADDRESS = "0x7dC1787D85b871c76E446690b9acba3Baa45638A";

const ABI = [
    "function presaleActive() view returns (bool)",
    "function getLatestPrice() view returns (uint256)",
    "function buyWithBNB(address referrer) payable",
    "function MIN_BUY_USD() view returns (uint256)",
    "function priceFeed() view returns (address)"
];

async function main() {
    console.log("Diagnosing BNB Buy...");
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    try {
        const isActive = await contract.presaleActive();
        console.log("Presale Active:", isActive);

        const minBuy = await contract.MIN_BUY_USD();
        console.log("Min Buy USD:", ethers.utils.formatEther(minBuy));

        try {
            const feedAddress = await contract.priceFeed();
            console.log("Price Feed Address:", feedAddress);

            // Check Price Feed Contract Directly
            const feedABI = ["function decimals() view returns (uint8)", "function description() view returns (string)"];
            const feedContract = new ethers.Contract(feedAddress, feedABI, provider);
            try {
                const decimals = await feedContract.decimals();
                const desc = await feedContract.description();
                console.log(`Feed Check: Decimals=${decimals}, Description="${desc}"`);
            } catch (feedErr) {
                console.error("Feed Contract Check Failed:", feedErr.message);
            }
        } catch (e) {
            console.log("Could not read priceFeed address:", e.message);
        }

        console.log("Checking Price Feed...");
        try {
            const price = await contract.getLatestPrice();
            console.log("BNB Price (Wei):", price.toString());
            console.log("BNB Price (USD):", ethers.utils.formatEther(price));
        } catch (e) {
            console.log("getLatestPrice FAILED:", e.reason || e.code || e.message);
        }

        // Simulate Buy Logic
        // We can't easily simulate a write without a signer, but we can check if the math would work
        // 0.1 BNB
        const amountBNB = ethers.utils.parseEther("0.1");
        const bnbPrice = parseFloat(ethers.utils.formatEther(price));
        const usdValue = 0.1 * bnbPrice;

        console.log(`0.1 BNB = $${usdValue}`);

        if (usdValue < 10) {
            console.warn("WARNING: 0.1 BNB is less than $10 minimum! User might be sending too little.");
        } else {
            console.log("0.1 BNB is valid (> $10).");
        }

    } catch (e) {
        console.error("Diagnosis Failed:", e);
    }
}

main();
