const hre = require("hardhat");

async function main() {
    console.log("Checking User Allocations on Presale Contract...");

    const PRESALE = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1";
    const rpcUrl = "https://bsc.publicnode.com";
    const provider = new hre.ethers.providers.JsonRpcProvider(rpcUrl);

    const abi = [
        "function purchasedTokens(address) view returns (uint256)"
    ];

    const contract = new hre.ethers.Contract(PRESALE, abi, provider);

    const USERS = [
        "0x1ca8fc3aa69D8c1baFE0FDA4aDb70AeEAeF5f3E4", // Recent buyer (1st case)
        "0x004F7c1eDA924aFe9635eDCaa724cbDb8c7c6AfB"  // Older buyer (2nd case)
    ];

    for (const user of USERS) {
        try {
            const allocation = await contract.purchasedTokens(user);
            console.log(`\nUser: ${user}`);
            console.log(`Purchased Allocation (Claimable): ${hre.ethers.utils.formatEther(allocation)} NUERALLY`);

            if (allocation.gt(0)) {
                console.log("⚠️ This user HAS a claimable balance on the contract!");
            } else {
                console.log("✅ No claimable balance (Correct if direct transfer).");
            }
        } catch (e) {
            console.error(`Error checking ${user}:`, e.message);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
