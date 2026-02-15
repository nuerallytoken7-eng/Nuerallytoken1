const hre = require("hardhat");

async function main() {
    console.log("Verifying Mainnet Contract Balances...");

    // ADDRESSES
    const TOKEN = "0xc63a84c9AF74902A872472bb0eE9Ae98e18810aD";
    const PRESALE = "0x7dC1787D85b871c76E446690b9acba3Baa45638A";
    const STAKING = "0x3FeD5E95197B49afB47C7F1148e9fcb2b20CC2e9";
    const VESTING = "0x6EE8D8fC4707605DaEeade2F178B142390c4F25d";

    // Attach Token
    const Token = await hre.ethers.getContractFactory("NuerallyToken");
    const token = Token.attach(TOKEN);

    // Helper
    async function checkBalance(name, address, expected) {
        const bal = await token.balanceOf(address);
        const balFmt = hre.ethers.utils.formatUnits(bal, 18);
        console.log(`${name}: ${balFmt} NUERALLY`);

        if (parseFloat(balFmt) === expected) {
            console.log("✅ Verified");
        } else {
            console.log("❌ Mismatch (Expected " + expected + ")");
        }
        console.log("---------------------------------------------------");
    }

    await checkBalance("Presale Contract", PRESALE, 3500000000);
    await checkBalance("Staking Contract", STAKING, 2000000000);
    await checkBalance("Vesting Contract", VESTING, 1500000000);

    // Check Presale Allowance
    console.log("Checking Presale Allowance...");
    const presaleAllowance = await token.allowance("0x4F277Bb31261A123717d8aA6F573775ee11148e7", PRESALE);
    console.log(`Allowance: ${hre.ethers.utils.formatUnits(presaleAllowance, 18)}`);
    if (presaleAllowance.gt(0)) console.log("✅ Allowance Set");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
