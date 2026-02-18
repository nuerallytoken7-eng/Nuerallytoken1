const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Starting Local Deployment...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // 1. Deploy Token
    console.log("Deploying Token...");
    const Token = await hre.ethers.getContractFactory("NuerallyToken");
    const token = await Token.deploy(deployer.address);
    await token.deployed();
    console.log("Token deployed to:", token.address);

    // 2. Deploy MockUSDT
    console.log("Deploying MockUSDT...");
    const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
    const usdt = await MockUSDT.deploy();
    await usdt.deployed();
    console.log("MockUSDT deployed to:", usdt.address);

    // 3. Deploy MockOracle
    console.log("Deploying MockOracle...");
    const MockAggregator = await hre.ethers.getContractFactory("MockAggregator");
    const mockOracle = await MockAggregator.deploy(8, 60000000000); // $600
    await mockOracle.deployed();
    console.log("MockOracle deployed to:", mockOracle.address);

    // 4. Deploy Presale
    console.log("Deploying Presale...");
    const Presale = await hre.ethers.getContractFactory("NuerallyPresale");
    // Params: Token, USDT, Owner, MarketingWallet, Oracle
    const presale = await Presale.deploy(token.address, usdt.address, deployer.address, deployer.address, mockOracle.address);
    await presale.deployed();
    console.log("Presale deployed to:", presale.address);

    // 5. Approvals & Exclusions & Funding
    console.log("Configuring contracts...");
    await token.approve(presale.address, hre.ethers.utils.parseUnits("1000000000", 18));
    await token.excludeFromLimits(presale.address, true);

    // Fund the Presale Contract (Important for Claiming)
    console.log("Funding Presale Contract with 350M Tokens...");
    await token.transfer(presale.address, hre.ethers.utils.parseUnits("350000000", 18));

    // Enable Claiming (for testing purposes)
    console.log("Enabling Claiming...");
    await presale.enableClaiming();

    // 6. Update public/presale.js
    console.log("Updating frontend config...");
    const presaleJsPath = path.join(__dirname, "../public/presale.js");
    let content = fs.readFileSync(presaleJsPath, "utf8");

    // Regex to find LOCAL config block and update addresses
    // We look for the specific keys in the LOCAL object

    // Update Contract Address
    content = content.replace(
        "REPLACE_WITH_LOCAL_CONTRACT",
        presale.address
    );

    // Update USDT Address
    content = content.replace(
        "REPLACE_WITH_LOCAL_USDT",
        usdt.address
    );

    // Update Token Address
    content = content.replace(
        "REPLACE_WITH_LOCAL_TOKEN",
        token.address
    );

    fs.writeFileSync(presaleJsPath, content);
    console.log("✅ public/presale.js updated successfully!");

    console.log("\n--- LOCAL DEPLOYMENT COMPLETE ---");
    console.log("1. Start your local node: npx hardhat node");
    console.log("2. Leave this script running? No, this script is done.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
