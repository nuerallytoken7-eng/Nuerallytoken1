const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Distributing supply from account:", deployer.address);

    // CONTRACT ADDRESSES (From Mainnet Deployment)
    const TOKEN_ADDRESS = "0xc63a84c9AF74902A872472bb0eE9Ae98e18810aD";
    const PRESALE_ADDRESS = "0x7dC1787D85b871c76E446690b9acba3Baa45638A";
    const STAKING_ADDRESS = "0x3FeD5E95197B49afB47C7F1148e9fcb2b20CC2e9";
    const VESTING_ADDRESS = "0x6EE8D8fC4707605DaEeade2F178B142390c4F25d";

    // Amounts
    const PRESALE_AMOUNT = "3500000000"; // 3.5 Billion
    const STAKING_AMOUNT = "2000000000"; // 2.0 Billion
    const VESTING_AMOUNT = "1500000000"; // 1.5 Billion

    // Attach to Token
    const Token = await hre.ethers.getContractFactory("NuerallyToken");
    const token = Token.attach(TOKEN_ADDRESS);

    // Check Balance
    const balance = await token.balanceOf(deployer.address);
    console.log("Current Balance:", hre.ethers.utils.formatUnits(balance, 18));

    // 1. Send to Presale
    console.log(`Sending ${PRESALE_AMOUNT} to Presale...`);
    const tx1 = await token.transfer(PRESALE_ADDRESS, hre.ethers.utils.parseUnits(PRESALE_AMOUNT, 18));
    await tx1.wait();
    console.log("Transaction 1 Confirmed.");

    // 2. Send to Staking
    console.log(`Sending ${STAKING_AMOUNT} to Staking...`);
    const tx2 = await token.transfer(STAKING_ADDRESS, hre.ethers.utils.parseUnits(STAKING_AMOUNT, 18));
    await tx2.wait();
    console.log("Transaction 2 Confirmed.");

    // 3. Send to Vesting
    console.log(`Sending ${VESTING_AMOUNT} to Vesting...`);
    const tx3 = await token.transfer(VESTING_ADDRESS, hre.ethers.utils.parseUnits(VESTING_AMOUNT, 18));
    await tx3.wait();
    console.log("Transaction 3 Confirmed.");

    console.log("\nSuccess! Supply Distributed.");

    // Final Balance Check
    const finalBalance = await token.balanceOf(deployer.address);
    console.log("Remaining Balance:", hre.ethers.utils.formatUnits(finalBalance, 18));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
