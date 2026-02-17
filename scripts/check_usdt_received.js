
const hre = require("hardhat");

async function main() {
    const OLD_PRESALE = "0x7dC1787D85b871c76E446690b9acba3Baa45638A";
    const NEW_PRESALE = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
    const USDT = "0x55d398326f99059fF775485246999027B3197955";

    const provider = hre.ethers.provider;

    console.log("Checking USDT Balances...");

    const erc20Abi = [
        "function balanceOf(address) view returns (uint256)",
        "function decimals() view returns (uint8)"
    ];
    const usdtContract = new hre.ethers.Contract(USDT, erc20Abi, provider);

    // 1. Check Old Presale
    try {
        const balOld = await usdtContract.balanceOf(OLD_PRESALE);
        console.log(`Old Presale (${OLD_PRESALE}): ${hre.ethers.utils.formatUnits(balOld, 18)} USDT`);
    } catch (e) { console.error("Error reading Old Presale:", e.message); }

    // 2. Check New Presale
    try {
        const balNew = await usdtContract.balanceOf(NEW_PRESALE);
        console.log(`New Presale (${NEW_PRESALE}): ${hre.ethers.utils.formatUnits(balNew, 18)} USDT`);
    } catch (e) { console.error("Error reading New Presale:", e.message); }

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
