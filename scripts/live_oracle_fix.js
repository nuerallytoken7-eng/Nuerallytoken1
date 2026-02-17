
const hre = require("hardhat");

const PRESALE_ADDR = "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1"; // V2

// Potential Addresses
const CANDIDATES = [
    { addr: "0x0567F2323251f0Aab15fc0bD16F0F5D30716422b", name: "Chainlink Proxy (Standard)" },
    { addr: "0x05672A29B036f06a1240f53139C4e6504a252aeE", name: "Chainlink Feed Registry?" },
    { addr: "0x14e613acB0C77B847fC55030e87a935f0b5d9540a", name: "Search Result A" },
    { addr: "0x776798F1193714bd06118d773e47534D1e958d78", name: "Current Failed Address" }
];

async function main() {
    console.log("Starting Live Oracle Fix...");

    const Presale = await hre.ethers.getContractFactory("NuerallyPresale");
    const presale = Presale.attach(PRESALE_ADDR);

    // Check current state via STATIC CALL first (save gas)
    console.log("Checking current state...");
    try {
        const p = await presale.getLatestPrice();
        console.log(`Current Oracle WORKS! Price: ${p.toString()}`);
        return;
    } catch (e) {
        console.log("Current Oracle FAILS. Attempting fix...");
    }

    for (const cand of CANDIDATES) {
        // Fix Checksum
        let addr;
        try {
            addr = hre.ethers.utils.getAddress(cand.addr);
        } catch {
            addr = hre.ethers.utils.getAddress(cand.addr.toLowerCase());
        }

        console.log(`\nTesting Candidate: ${cand.name} (${addr})`);

        try {
            // 1. Update Contract
            console.log("  -> Setting Price Feed...");
            const tx = await presale.setPriceFeed(addr);
            console.log(`  -> Tx sent: ${tx.hash}`);
            await tx.wait();
            console.log("  -> Confirmed.");

            // 2. Verify
            console.log("  -> Verifying...");
            const price = await presale.getLatestPrice();
            console.log(`  ✅ SUCCESS! Price found: ${price.toString()}`);
            console.log(`  -> Addr: ${cand.addr}`);
            process.exit(0);
        } catch (e) {
            console.log(`  ❌ FAILED: ${e.reason || e.message}`);
        }
    }

    console.log("\nAll candidates failed.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
