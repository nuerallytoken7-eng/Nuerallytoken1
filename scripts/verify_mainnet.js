
const hre = require("hardhat");

async function main() {
    console.log("Verifying Mainnet Deployment (Features & State)...");

    // NEW ADDRESSES (v2 / Fixed Oracle)
    const TOKEN = "0x0399b646d251F18edefB36DDC581597ABfDcA070";
    const PRESALE = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
    const STAKING = "0x38B8619e467679840D27E5b47912D2bd4aB1c538";
    const VESTING = "0x420E64E092Dd393cC715b99Ce917C063661fcd36";

    // Attach Contracts
    const Token = await hre.ethers.getContractFactory("NuerallyToken");
    const token = Token.attach(TOKEN);

    const Presale = await hre.ethers.getContractFactory("NuerallyPresale");
    const presale = Presale.attach(PRESALE);

    // 1. Verify Token Config
    console.log("\n--- 1. Token Configuration ---");
    console.log("Token Address:", token.address);
    try {
        const name = await token.name();
        const symb = await token.symbol();
        console.log(`Name: ${name}, Symbol: ${symb}`);
    } catch (e) { console.error("Token Read Failed"); }

    // 2. Verify Presale Config
    console.log("\n--- 2. Presale Configuration ---");
    console.log("Presale Address:", presale.address);

    try {
        const stage = await presale.currentStage();
        const price = await presale.getCurrentPrice();
        const active = await presale.presaleActive();

        console.log(`Current Stage: ${stage.toString()} (Should be 0)`);
        console.log(`Current Price (Wei): ${price.toString()}`);
        console.log(`Price ($): ${hre.ethers.utils.formatUnits(price, 18)}`);
        console.log(`Active: ${active}`);

    } catch (e) { console.error("Presale Config Read Failed", e.message); }

    // 3. Verify Oracle (CRITICAL)
    console.log("\n--- 3. Oracle Check (BNB Price) ---");
    try {
        const bnbPriceWei = await presale.getLatestPrice();
        console.log(`BNB Price (Wei): ${bnbPriceWei.toString()}`);
        const bnbPriceUSD = hre.ethers.utils.formatUnits(bnbPriceWei, 18);
        console.log(`BNB Price ($): ${bnbPriceUSD}`);

        if (parseFloat(bnbPriceUSD) > 0) {
            console.log("✅ Oracle is WORKING!");
        } else {
            console.log("❌ Oracle returned 0 or failed.");
        }
    } catch (e) {
        console.error("❌ Oracle Check FAILED:", e.reason || e.message);
    }

    // 4. Simulate BNB Buy (Static Call)
    console.log("\n--- 4. Simulate BNB Buy ---");
    // We can't easily simulate success without sending value, 
    // but we can check if it fails with specific error.
    // However, since we are in hardhat without mainnet fork funds, we can only do read-only calls easily.
    // 'callStatic' might fail if msg.value is 0 but function expects payment.

    // 5. Check Token Balances (Did user fund them?)
    console.log("\n--- 5. Contract Funding Status ---");
    const pBal = await token.balanceOf(PRESALE);
    const sBal = await token.balanceOf(STAKING);
    const vBal = await token.balanceOf(VESTING);

    console.log(`Presale Balance: ${hre.ethers.utils.formatUnits(pBal, 18)} (Target: 3.5B)`);
    console.log(`Staking Balance: ${hre.ethers.utils.formatUnits(sBal, 18)} (Target: 2.0B)`);
    console.log(`Vesting Balance: ${hre.ethers.utils.formatUnits(vBal, 18)} (Target: 1.5B)`);

    if (pBal.eq(0)) console.warn("⚠️ PRESALE NOT FUNDED YET");
    if (sBal.eq(0)) console.warn("⚠️ STAKING NOT FUNDED YET");

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
