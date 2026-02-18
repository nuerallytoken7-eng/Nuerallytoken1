
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Starting BSC Testnet Deployment...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const balance = await deployer.getBalance();
    console.log("Account balance:", hre.ethers.utils.formatEther(balance), "BNB");

    // 1. Deploy Token
    console.log("Deploying Token...");
    const Token = await hre.ethers.getContractFactory("NuerallyToken");
    // Constructor args: initialOwner
    const token = await Token.deploy(deployer.address);
    await token.deployed();
    console.log("Token deployed to:", token.address);

    // 2. Deploy MockUSDT (Because we need USDT for testing)
    console.log("Deploying MockUSDT...");
    const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
    const usdt = await MockUSDT.deploy();
    await usdt.deployed();
    console.log("MockUSDT deployed to:", usdt.address);

    // 3. Deploy Chainlink Oracle (Mock)
    console.log("Deploying MockOracle...");
    const MockAggregator = await hre.ethers.getContractFactory("MockAggregator");
    const oracle = await MockAggregator.deploy(8, 30000000000); // 8 decimals, $300
    await oracle.deployed();
    console.log("MockOracle deployed to:", oracle.address);

    // 4. Deploy Presale
    console.log("Deploying Presale...");
    const Presale = await hre.ethers.getContractFactory("NuerallyPresale");
    // Constructor: token, usdt, owner (deployer), marketingWallet (deployer), priceFeed
    const presale = await Presale.deploy(
        token.address,
        usdt.address,
        deployer.address,
        deployer.address, // Marketing Wallet = Deployer for now
        oracle.address
    );
    await presale.deployed();
    console.log("Presale deployed to:", presale.address);

    // 5. Approvals & Exclusions & Funding
    console.log("Configuring contracts...");
    // Approve Presale to spend tokens? No, Presale holds tokens.
    // Exclude Presale from fees/limits if any
    await token.excludeFromLimits(presale.address, true);

    // Fund the Presale Contract (Important for Claiming)
    console.log("Funding Presale Contract with 350M Tokens...");
    const fundTx = await token.transfer(presale.address, hre.ethers.utils.parseUnits("350000000", 18));
    await fundTx.wait();

    // Enable Claiming (for testing purposes immediately?)
    // Let's enable it so user doesn't have to call another script
    console.log("Enabling Claiming...");
    const enableTx = await presale.enableClaiming();
    await enableTx.wait();

    // 6. Update public/presale.js
    console.log("Updating frontend config...");
    const presaleJsPath = path.join(__dirname, "../public/presale.js");
    let content = fs.readFileSync(presaleJsPath, "utf8");

    // Update TESTNET section
    // Use regex to replace the values inside the configuration object
    // Note: This regex is a bit fragile, it assumes standard formatting.

    // Replace Contract Address
    content = content.replace(/TESTNET: \{[\s\S]*?contractAddress: "[^"]*",/g, (match) => {
        return match.replace(/contractAddress: "[^"]*"/, `contractAddress: "${presale.address}"`);
    });

    // Replace USDT Address
    content = content.replace(/TESTNET: \{[\s\S]*?usdtAddress: "[^"]*",/g, (match) => {
        return match.replace(/usdtAddress: "[^"]*"/, `usdtAddress: "${usdt.address}"`);
    });

    // Replace Token Address
    content = content.replace(/TESTNET: \{[\s\S]*?tokenAddress: "[^"]*",/g, (match) => {
        return match.replace(/tokenAddress: "[^"]*"/, `tokenAddress: "${token.address}"`);
    });

    fs.writeFileSync(presaleJsPath, content);
    console.log("✅ public/presale.js updated successfully!");

    console.log("");
    console.log("--- TESTNET DEPLOYMENT COMPLETE ---");
    console.log("1. Update ENV to 'TESTNET' in public/presale.js manually or automatically?");
    console.log("   (Script assumes you will switch ENV yourself or separate script)");

    // Auto-update ENV to TESTNET?
    // Let's do it for convenience.
    if (content.includes('const ENV = "LOCAL";')) {
        content = content.replace('const ENV = "LOCAL";', 'const ENV = "TESTNET";');
        fs.writeFileSync(presaleJsPath, content);
        console.log("✅ Switched ENV to 'TESTNET' in presale.js");
    }

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
