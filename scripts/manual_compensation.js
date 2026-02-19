const hre = require("hardhat");

async function main() {
    console.log("Compensating User for Direct Transfer...");

    // Config
    const TOKEN = "0x0399b646d251F18edefB36DDC581597ABfDcA070"; // NUERALLY
    // Found from Tx: 0xd9f1dc129c7d03d8e7aacc5e0d8ac1c1691948b418cf0e71e68a8d8fc3fa8927
    const USER = "0x004F7c1eDA924aFe9635eDCaa724cbDb8c7c6AfB";
    const AMOUNT = "166667"; // 20 USD / 0.00012 = 166,666.666... Rounded up.

    if (!process.env.PRIVATE_KEY) throw new Error("No private key!");

    const rpcUrl = "https://bsc.publicnode.com";
    const provider = new hre.ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new hre.ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log(`Sender: ${wallet.address}`);
    console.log(`Recipient: ${USER}`);
    console.log(`Amount: ${AMOUNT} NUERALLY`);

    const token = new hre.ethers.Contract(TOKEN, [
        "function transfer(address to, uint256 amount) public returns (bool)"
    ], wallet);

    // Prompt? No, we are in non-interactive agent mode.
    // EXECUTE
    console.log("Sending transaction...");
    try {
        const tx = await token.transfer(USER, hre.ethers.utils.parseUnits(AMOUNT, 18));
        console.log(`Transaction Sent: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Compensation Successful!");
    } catch (e) {
        console.error("Transfer Failed:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
