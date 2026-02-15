const hre = require("hardhat");

async function main() {
    console.log("Debugging Mainnet Contract Reads...");

    const PRESALE_ADDRESS = "0x7dC1787D85b871c76E446690b9acba3Baa45638A";
    const Presale = await hre.ethers.getContractFactory("NuerallyPresale");
    const contract = Presale.attach(PRESALE_ADDRESS);

    // CHECK NETWORK
    const network = await hre.ethers.provider.getNetwork();
    console.log(`Connected to Chain ID: ${network.chainId}`);

    // Check Oracle on Testnet too
    const testnetOracle = "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526"; // Testnet


    try {
        console.log("0. Checking stored Oracle Address...");
        const feed = await contract.priceFeed();
        console.log("Oracle Address:", feed);
    } catch (e) { console.error("❌ priceFeed read failed:", e.message); }

    try {
        console.log("1. Calling currentStage()...");
        const stage = await contract.currentStage();
        console.log("Stage:", stage.toString());
    } catch (e) { console.error("❌ currentStage failed:", e.message); }

    try {
        console.log("2. Calling tokensSoldInCurrentStage()...");
        const sold = await contract.tokensSoldInCurrentStage();
        console.log("Sold:", hre.ethers.utils.formatEther(sold));
    } catch (e) { console.error("❌ tokensSoldInCurrentStage failed:", e.message); }

    try {
        console.log("3. Calling STAGE_ALLOCATION()...");
        const alloc = await contract.STAGE_ALLOCATION();
        console.log("Allocation:", hre.ethers.utils.formatEther(alloc));
    } catch (e) { console.error("❌ STAGE_ALLOCATION failed:", e.message); }

    try {
        console.log("4. Calling getCurrentPrice()...");
        const price = await contract.getCurrentPrice();
        console.log("Price:", hre.ethers.utils.formatEther(price));
    } catch (e) { console.error("❌ getCurrentPrice failed:", e.message); }

    try {
        console.log("5. Calling getLatestPrice() (BNB Price)...");
        const bnbPrice = await contract.getLatestPrice();
        console.log("BNB Price:", hre.ethers.utils.formatEther(bnbPrice));
    } catch (e) {
        console.error("❌ getLatestPrice failed:", e.message);
        console.error("This is likely the cause of the frontend failure.");
    }

    try {
        console.log(`Checking Presale Code Size (${PRESALE_ADDRESS})...`);
        const pCode = await hre.ethers.provider.getCode(PRESALE_ADDRESS);
        console.log(`Presale Code Size: ${pCode.length}`);

        console.log("Checking WBNB Code Size (0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c)...");
        const wCode = await hre.ethers.provider.getCode("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c");
        console.log(`WBNB Code Size: ${wCode.length}`);

        console.log("Checking PancakeSwap Router Code Size (0x10ED43C718714eb63d5aA57B78B54704E256024E)...");
        const rCode = await hre.ethers.provider.getCode("0x10ED43C718714eb63d5aA57B78B54704E256024E");
        console.log(`Router Code Size: ${rCode.length}`);

        console.log("6. Calling Chainlink Oracle Directly...");
        const oracleAddr = "0x0567f2323251F0aaB15fC0bd16f0F5D30716422b";

        // CHECK CODE SIZE
        const code = await hre.ethers.provider.getCode(oracleAddr);
        console.log(`Oracle Code Size: ${code.length} bytes`);
        if (code === "0x") {
            console.error("❌ Oracle Address has NO CODE. Wrong Network?");
        } else {
            const aggregatorV3InterfaceABI = [
                { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
                { "inputs": [], "name": "description", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
                { "inputs": [], "name": "latestRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }
            ];
            const provider = hre.ethers.provider;
            const oracle = new hre.ethers.Contract(oracleAddr, aggregatorV3InterfaceABI, provider);

            try {
                const dec = await oracle.decimals();
                console.log("Oracle Decimals:", dec);
            } catch (e) { console.error("❌ decimals() failed"); }

            try {
                const desc = await oracle.description();
                console.log("Oracle Description:", desc);
            } catch (e) { console.error("❌ description() failed"); }

            try {
                const roundData = await oracle.latestRoundData();
                console.log("Oracle Price:", roundData.answer.toString());
            } catch (e) { console.error("❌ latestRoundData() failed"); }
        }
    } catch (e) {
        console.error("❌ Direct Oracle check failed:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
