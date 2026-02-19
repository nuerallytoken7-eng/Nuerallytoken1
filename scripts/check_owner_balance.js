const hre = require("hardhat");

async function main() {
    console.log("Checking Deployer Balance on Mainnet...");

    const TOKEN = "0x0399b646d251F18edefB36DDC581597ABfDcA070";
    const rpcUrl = "https://bsc.publicnode.com";
    const provider = new hre.ethers.providers.JsonRpcProvider(rpcUrl);

    const USER = "0x1ca8fc3aa69D8c1baFE0FDA4aDb70AeEAeF5f3E4";
    console.log("Checking User Balance:", USER);

    const tokenAbi = ["function balanceOf(address) view returns (uint256)"];
    const token = new hre.ethers.Contract(TOKEN, tokenAbi, provider);

    const balance = await token.balanceOf(USER);
    console.log(`User Balance: ${hre.ethers.utils.formatEther(balance)} NUERALLY`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
