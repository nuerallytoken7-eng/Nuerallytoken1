const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Distributing supply from account:", deployer.address);

    // CONTRACT ADDRESSES (From Mainnet Deployment V2)
    const TOKEN_ADDRESS = "0x0399b646d251F18edefB36DDC581597ABfDcA070";
    const PRESALE_ADDRESS = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
    const STAKING_ADDRESS = "0x38B8619e467679840D27E5b47912D2bd4aB1c538";
    const VESTING_ADDRESS = "0x420E64E092Dd393cC715b99Ce917C063661fcd36";

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
