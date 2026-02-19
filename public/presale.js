// ------------------------------------------------------------------
// GLOBAL WALLET HANDLERS (USDT ONLY FIX)
// Must be defined immediately to be available for onclick attributes
// ------------------------------------------------------------------
window.openWalletModal = function () {
    console.log("NUCLEAR: openWalletModal triggered");
    const overlay = document.getElementById('walletSelectionOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        // Force layout recalc
        void overlay.offsetWidth;
        overlay.classList.add('active');
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
        overlay.style.zIndex = '99999';
    } else {
        alert("CRITICAL ERROR: Wallet Modal Overlay not found in DOM.");
    }
};

window.openPresaleModal = function () {
    console.log("NUCLEAR: openPresaleModal triggered");
    const overlay = document.getElementById('presaleOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        // Force layout
        void overlay.offsetWidth;
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
        overlay.style.zIndex = '99999';
    }
}

window.selectWallet = async function (type) {
    console.log("NUCLEAR: selectWallet triggered for:", type);

    // UI Cleanup
    const overlay = document.getElementById('walletSelectionOverlay');
    if (overlay) overlay.style.display = 'none';

    let provider = null;

    try {
        if (type === 'metamask') {
            if (window.ethereum) {
                provider = window.ethereum;
            } else {
                alert("MetaMask not found! Please install it.");
                window.open('https://metamask.io/download/', '_blank');
                return;
            }
        } else if (type === 'trust') {
            // Aggressive Trust Wallet Checks
            if (window.trustwallet) {
                provider = window.trustwallet;
            } else if (window.ethereum && window.ethereum.isTrust) {
                provider = window.ethereum;
            } else {
                // Last ditch: just use ethereum and hope it's Trust
                if (window.ethereum) provider = window.ethereum;
                else {
                    alert("Trust Wallet not found! Please install it.");
                    window.open('https://trustwallet.com/browser-extension', '_blank');
                    return;
                }
            }
        }

        if (!provider) {
            alert("No provider found for " + type);
            return;
        }

        console.log("Requesting accounts from:", type);
        await provider.request({ method: 'eth_requestAccounts' });

        // Success! Reload to sync state
        console.log("Connection success - reloading...");
        window.location.reload();

    } catch (e) {
        console.error("Wallet Connection Error:", e);
        // Don't alert if user just closed the modal
        if (!e.message.includes("User rejected")) {
            alert("Connection Error: " + (e.message || "Unknown"));
        }
    }
};

// Presale Logic
const PRESALE_CONFIG = {
    hardcap: 500, // BNB
    raised: 154.5, // Mock initial value
    rates: {
        BNB: 20000000,   // 1 BNB = 20,000,000 NUERALLY
        USDT: 50000      // 1 USDT = 50,000 NUERALLY (Example Rate)
    },
    limits: {
        BNB: { min: 0.1, max: 10 },
        USDT: { min: 50, max: 5000 }
    }
};

// Web3 Config
// Web3 Config
const ENV = "MAINNET"; // Change to "MAINNET" for production

const VALID_CHAINS = {
    MAINNET: 56,   // BNB Smart Chain
    TESTNET: 97,   // BSC Testnet
    LOCAL: 1337    // Hardhat
};

const CONFIG = {
    MAINNET: {
        contractAddress: "0xD3D92Ce27F4845DA867c55da11b350D134fd09B1",
        usdtAddress: "0x55d398326f99059fF775485246999027B3197955", // Binance-Peg BSC-USD
        tokenAddress: "0x0399b646d251F18edefB36DDC581597ABfDcA070",
        chainId: 56,
        chainHex: "0x38",
        rpcUrls: [
            "https://bsc-dataseed.binance.org/",
            "https://bsc-dataseed1.defibit.io/",
            "https://bsc-dataseed1.ninicoin.io/",
            "https://bsc.publicnode.com"
        ],
        blockExplorer: "https://bscscan.com"
    },
    TESTNET: {
        contractAddress: "0x6EE8D8fC4707605DaEeade2F178B142390c4F25d",
        usdtAddress: "0x7546676b5F8b21767C649352fbF202B7Ac7476d4",
        tokenAddress: "0x7dC1787D85b871c76E446690b9acba3Baa45638A",
        chainId: 97,
        chainHex: "0x61",
        rpcUrls: [
            "https://data-seed-prebsc-1-s1.binance.org:8545/",
            "https://data-seed-prebsc-2-s1.binance.org:8545/",
            "https://bsc-testnet.publicnode.com"
        ],
        blockExplorer: "https://testnet.bscscan.com"
    },
    LOCAL: {
        contractAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        usdtAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        tokenAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        chainId: 1337,
        chainHex: "0x539",
        rpcUrls: ["http://127.0.0.1:8545/"],
        blockExplorer: "http://localhost/"
    }
};

const WEB3_CONFIG = CONFIG[ENV];

// Fallback for single RPCUrl legacy usage
WEB3_CONFIG.rpcUrl = WEB3_CONFIG.rpcUrls[0];

// Shared ABIs
WEB3_CONFIG.abi = [
    "function buyWithBNB(address referrer) public payable",
    "function buyWithUSDT(uint256 amount, address referrer) public",
    "function getCurrentPrice() public view returns (uint256)",
    "function tokensSoldInCurrentStage() public view returns (uint256)",
    "function currentStage() public view returns (uint256)",
    "function getLatestPrice() public view returns (uint256)",
    "function totalRaisedBNB() public view returns (uint256)",
    "function getReferralPercent() public view returns (uint256)",
    "function STAGE_ALLOCATION() public view returns (uint256)",
    "function purchasedTokens(address user) public view returns (uint256)",
    "function claimingEnabled() public view returns (bool)",
    "function claim() public",
    "function referralEarnings(address user) public view returns (uint256)"
];

WEB3_CONFIG.erc20Abi = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function balanceOf(address account) public view returns (uint256)"
];

// Helper: Get Robust Provider or Null
// Tries multiple RPCs. If all fail, returns null (doesn't throw).
async function getRobustProvider() {
    for (const url of WEB3_CONFIG.rpcUrls) {
        try {
            const provider = new ethers.providers.JsonRpcProvider(url);
            await provider.getNetwork(); // Test connection
            console.log("Connected to RPC:", url);
            return provider;
        } catch (e) {
            console.warn("RPC Failed:", url, e.message);
        }
    }
    console.error("All Public RPCs Failed.");
    return null;
}

// ... (existing code) ...

async function updateClaimUI() {
    if (!userAddress) return;

    // Elements
    const claimSection = document.getElementById('claimSection');
    const userPurchased = document.getElementById('userPurchased');
    const claimBtn = document.getElementById('claimBtn');
    const claimStatus = document.getElementById('claimStatus');

    if (!claimSection) return;

    let provider = await getRobustProvider();
    let isWalletProvider = false;

    // FALLBACK STRATEGY: If Public RPCs fail, try using the Wallet
    if (!provider) {
        if (window.ethereum) {
            console.log("Public RPCs failed. Falling back to Wallet Provider...");
            const walletProvider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await walletProvider.getNetwork();

            // Check if wallet is on correct network
            if (network.chainId === WEB3_CONFIG.chainId) {
                provider = walletProvider;
                isWalletProvider = true;
            } else {
                // WALLET IS ON WRONG NETWORK and Public RPCs failed.
                // We cannot read data. We must ask user to switch.
                claimSection.style.display = 'block';
                if (userPurchased) userPurchased.textContent = "Network Sync Needed";
                if (claimBtn) {
                    claimBtn.disabled = false; // Enable click
                    claimBtn.textContent = "Switch Network to Check";
                    claimBtn.onclick = switchToBSC; // Direct switch action
                }
                if (claimStatus) {
                    claimStatus.textContent = "Public connections failed. Please switch network to view claimable tokens.";
                    claimStatus.style.color = "var(--warn)";
                }
                return; // Stop here, wait for switch
            }
        } else {
            // No Wallet AND No Public RPC
            // Show catastrophe error
        }
    }

    if (!provider) {
        // Final Error State (No suitable provider found)
        claimSection.style.display = 'block';
        if (userPurchased) userPurchased.textContent = "Connection Failed";
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.textContent = "Network Error";
        }
        if (claimStatus) {
            claimStatus.textContent = "Could not connect to BSC. Please check your internet or VPN.";
            claimStatus.style.color = "var(--warn)";
        }
        return;
    }

    try {
        const contract = new ethers.Contract(WEB3_CONFIG.contractAddress, WEB3_CONFIG.abi, provider);

        // 1. Get Purchased Amount
        const purchased = await contract.purchasedTokens(userAddress);
        const purchasedFormatted = ethers.utils.formatEther(purchased);

        // 2. Get Claiming Status
        const claimingEnabled = await contract.claimingEnabled();

        console.log(`Claimable: ${purchasedFormatted}, Enabled: ${claimingEnabled}`);

        if (parseFloat(purchasedFormatted) > 0) {
            claimSection.style.display = 'block';
            userPurchased.textContent = parseFloat(purchasedFormatted).toLocaleString() + " NUERALLY";

            if (claimingEnabled) {
                claimBtn.disabled = false;
                claimBtn.textContent = "Claim Tokens";
                claimStatus.textContent = "Ready to claim.";
                claimStatus.style.color = "var(--ok)";

                // Add explicit network check to button click
                claimBtn.onclick = async () => {
                    const isCorrect = await checkChainId();
                    if (!isCorrect) {
                        await switchToBSC();
                        return;
                    }
                    window.claimTokens();
                };

            } else {
                claimBtn.disabled = true;
                claimBtn.textContent = "Claiming Not Live";
                claimStatus.textContent = "Claiming will be enabled soon.";
                claimStatus.style.color = "var(--warn)";
            }
        } else {
            claimSection.style.display = 'block'; // ALWAYS VISIBLE
            userPurchased.textContent = "0.00 NUERALLY";
            claimBtn.disabled = true;
            claimBtn.textContent = "No Tokens to Claim";
            claimStatus.textContent = "Purchase tokens first.";
            claimStatus.style.color = "var(--muted)";
        }
    } catch (e) {
        console.error("Error updating claim UI:", e);
        // Fallback: Show section but indicate error
        claimSection.style.display = 'block';
        if (userPurchased) userPurchased.textContent = "Network Error";
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.textContent = "Connection Failed";
        }
        if (claimStatus) {
            claimStatus.textContent = `Error: ${e.message || "Unknown RPC Error"}`;
            claimStatus.style.color = "var(--warn)";
        }
    }
}

let userAddress = null;
let currentCurrency = 'USDT'; // Default to USDT
let currentReferrer = null;

// Parse URL for Referral (?ref=0x...)
const urlParams = new URLSearchParams(window.location.search);
const refParam = urlParams.get('ref');
if (refParam && refParam.startsWith('0x')) {
    currentReferrer = refParam;
    console.log("Referrer set to:", currentReferrer);
}

// DOM Elements - Selected dynamically to ensure they exist
let presaleOverlay, walletSelectionOverlay, connectBtn, mainConnectBtn, closeModalBtn, closeWalletModalBtn;
let buyBtn, paymentInput, payLabel, tokenOutput, progressBar, raisedDisplay;

// EXPOSE FUNCTION GLOBALLY FOR INLINE CLICK
window.openPresaleModal = function () {
    console.log("openPresaleModal called");
    const overlay = document.getElementById('presaleOverlay');
    if (overlay) {
        openModal(overlay);
        // Force visibility just in case
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
    } else {
        alert("Error: Presale Modal overlay not found! ID mismatch?");
        console.error("Presale Overlay NOT FOUND");
    }
}

function initPresale() {
    console.log("initPresale started");

    // Select Elements
    presaleOverlay = document.getElementById('presaleOverlay');
    walletSelectionOverlay = document.getElementById('walletSelectionOverlay');
    connectBtn = document.getElementById('connectWalletBtn');
    mainConnectBtn = document.getElementById('presaleLink');
    closeModalBtn = document.getElementById('closeModal');
    closeWalletModalBtn = document.getElementById('closeWalletModal');
    buyBtn = document.getElementById('buyBtn');
    paymentInput = document.getElementById('paymentInput');
    payLabel = document.getElementById('payLabel');
    tokenOutput = document.getElementById('tokenOutput');
    progressBar = document.getElementById('progressBar');
    raisedDisplay = document.getElementById('raisedAmount');

    console.log("Main Button:", mainConnectBtn);

    // Force USDT Default
    payoutToken = 'USDT';
    window.toggleCurrency('USDT');

    // Initial Data Fetch
    fetchRawData();

    // Attach listeners
    if (mainConnectBtn) {
        mainConnectBtn.onclick = function (e) {
            e.preventDefault();
            window.openPresaleModal();
        };
    }

    // Wallet Selection Triggers
    if (connectBtn) connectBtn.addEventListener('click', () => openModal(walletSelectionOverlay));

    // Initial UI Setup
    updateCurrencyUI();

    // Auto-refresh data
    setInterval(fetchRawData, 10000);

    // Wallet Listeners
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
                userAddress = accounts[0];
                onWalletConnected();
            } else {
                userAddress = null;
                window.location.reload();
            }
        });

        window.ethereum.on('chainChanged', (_chainId) => {
            window.location.reload();
        });
    }
}

async function fetchRawData() {
    console.log("Fetching presale data...");
    try {
        let provider = await getRobustProvider();

        // Fallback: If Public RPCs fail, try Wallet Provider (if on correct chain)
        if (!provider && window.ethereum) {
            try {
                const walletProvider = new ethers.providers.Web3Provider(window.ethereum);
                const network = await walletProvider.getNetwork();
                if (network.chainId === WEB3_CONFIG.chainId) {
                    console.log("Falling back to Wallet Provider for data fetch");
                    provider = walletProvider;
                }
            } catch (err) {
                console.warn("Wallet fallback check failed:", err);
            }
        }

        if (!provider) {
            console.warn("No provider available. Skipping data fetch.");
            return;
        }

        const contract = new ethers.Contract(WEB3_CONFIG.contractAddress, WEB3_CONFIG.abi, provider);

        // Fetch Data
        const [stageIndex, tokensSold, allocation, priceWei] = await Promise.all([
            contract.currentStage(),
            contract.tokensSoldInCurrentStage(),
            contract.STAGE_ALLOCATION(),
            contract.getCurrentPrice()
        ]);

        // Helper to formatting
        const soldTokens = parseFloat(ethers.utils.formatEther(tokensSold));
        const allocationTokens = parseFloat(ethers.utils.formatEther(allocation));
        const price = parseFloat(ethers.utils.formatEther(priceWei));

        PRESALE_CONFIG.raised = soldTokens;
        PRESALE_CONFIG.hardcap = allocationTokens;
        PRESALE_CONFIG.price = price; // Token Price in USD

        // BNB Price Fallback (API)
        try {
            const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
            const data = await response.json();
            PRESALE_CONFIG.bnbPrice = parseFloat(data.price);
        } catch (err) {
            console.log("BNB Price API failed, using default 600");
            PRESALE_CONFIG.bnbPrice = 600;
        }

        // Update UI Text
        const currentStageNum = parseInt(stageIndex) + 1;
        const headerTitle = document.querySelector('.modal-header h2');
        if (headerTitle) headerTitle.textContent = `Stage ${currentStageNum} Presale`;

        const stageTitle = document.getElementById('stageTitle');
        if (stageTitle) stageTitle.textContent = `Stage ${currentStageNum}`;

        updateProgress();

    } catch (e) {
        console.error("Error fetching data:", e);
    }
}

function updateCurrencyUI() {
    // FORCE USDT ONLY
    currentCurrency = 'USDT';
    payoutToken = 'USDT';

    // Hide BNB Selector if it exists
    const bnbSelector = document.querySelector('.token-selector[data-currency="BNB"]');
    if (bnbSelector) bnbSelector.style.display = 'none';

    // Ensure USDT is active
    const usdtSelector = document.querySelector('.token-selector[data-currency="USDT"]');
    if (usdtSelector) {
        usdtSelector.style.display = 'flex';
        usdtSelector.classList.add('active');
    }

    if (payLabel) payLabel.textContent = `You Pay (USDT)`;

    if (buyBtn) {
        buyBtn.textContent = "Buy with USDT";
        buyBtn.onclick = buyWithUSDT;
        buyBtn.disabled = false;
    }

    updateBuyButtonState();
}

async function buyWithUSDT() {
    const amountVal = parseFloat(paymentInput.value);

    // MIN CHECK: 10 USDT
    if (!amountVal || amountVal < 10) {
        alert("Minimum purchase amount is 10 USDT.");
        return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(WEB3_CONFIG.contractAddress, WEB3_CONFIG.abi, signer);

    try {
        // USDT on BSC Mainnet has 18 decimals usually (Binance-Peg BSC-USD)
        const amountWei = ethers.utils.parseUnits(amountVal.toString(), 18);

        buyBtn.textContent = "Processing...";
        buyBtn.disabled = true;

        const tx = await contract.buyWithUSDT(amountWei, currentReferrer || ethers.constants.AddressZero);
        // Alert Hash
        alert("Transaction Sent! Hash: " + tx.hash + "\n\nPlease wait for confirmation...");

        await tx.wait();
        alert("Purchase Successful! Welcome to Nuerally.");

        // Reset UI
        paymentInput.value = "";
        fetchRawData();
        checkUSDTAllowance();
        updateClaimUI(); // Explicitly update user balance immediately
        updateReferralEarnings();

    } catch (e) {
        console.error("Buy failed", e);

        let msg = e.reason || e.message;
        if (msg.includes("user rejected")) {
            msg = "Transaction rejected by user.";
        } else if (msg.includes("insufficient funds")) {
            msg = "Insufficient BNB for gas fees.";
        } else if (msg.includes("allowance")) {
            msg = "Please approve USDT first.";
        }

        alert("Buy Failed: " + msg);

        // Reset Button
        buyBtn.disabled = false;
        checkUSDTAllowance(); // Create correct button state
    }
}

function updateProgress() {
    console.log("Updating progress...");
    const sold = PRESALE_CONFIG.raised;
    const target = PRESALE_CONFIG.hardcap;
    const price = PRESALE_CONFIG.price || 0.00012;

    console.log("Values:", { sold, target, price, currentCurrency });

    console.log("Values:", { sold, target, price, currentCurrency });

    const percentage = target > 0 ? (sold / target) * 100 : 0;

    if (progressBar) progressBar.style.width = `${percentage}%`;

    // Calculate BNB (Assuming 1 BNB = $600 as per contract demo logic)
    const BNB_PRICE = 600;

    // In our config, 'raised' and 'hardcap' are in Tokens.
    const raisedUSD = sold * price;
    const targetUSD = target * price;

    let displayStr = "";

    if (currentCurrency === 'USDT') {
        const raisedStr = raisedUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        const targetStr = targetUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        displayStr = `${raisedStr} / ${targetStr}`;
    } else {
        const raisedBNB = raisedUSD / BNB_PRICE;
        const targetBNB = targetUSD / BNB_PRICE;

        const raisedStr = raisedBNB.toLocaleString('en-US', { maximumFractionDigits: 2 });
        const targetStr = targetBNB.toLocaleString('en-US', { maximumFractionDigits: 2 });
        displayStr = `${raisedStr} BNB / ${targetStr} BNB`;
    }

    if (raisedDisplay) raisedDisplay.textContent = displayStr;

    // Update the bottom status text with USDT values always (as per request)
    // "display in that container target of stage 1 in USDT and how much target has been achieved till now"
    const stageStatusText = document.getElementById('stageStatusText');
    if (stageStatusText) {
        const rStr = raisedUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        const tStr = targetUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        stageStatusText.textContent = `Raised: ${rStr} / Target: ${tStr}`;
    }
}

// -------------------------------------------------------------

// -------------------------------------------------------------
// AI DEMO LOGIC
// -------------------------------------------------------------
async function generateAIImage() {
    const promptInput = document.getElementById('aiPrompt');
    const generateBtn = document.getElementById('generateBtn');
    const aiImage = document.getElementById('aiImage');
    const aiPlaceholder = document.getElementById('aiPlaceholder');
    const aiLoader = document.getElementById('aiLoader');

    const prompt = promptInput.value.trim();
    if (!prompt) {
        alert("Please enter a description first!");
        return;
    }

    // UI Loading State
    generateBtn.disabled = true;
    generateBtn.innerHTML = "<span>⏳ Processing...</span>";
    aiImage.style.display = 'none';
    aiPlaceholder.style.display = 'none';
    aiLoader.style.display = 'flex';

    try {
        // Use Pollinations.ai (Free public API, no key needed)
        // We add a random seed to ensure new images
        const randomSeed = Math.floor(Math.random() * 100000);
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=500&seed=${randomSeed}&nologo=true`;

        // Preload image to avoid flicker
        const img = new Image();
        img.onload = () => {
            aiImage.src = imageUrl;
            aiImage.style.display = 'block';
            aiLoader.style.display = 'none';
            generateBtn.disabled = false;
            generateBtn.innerHTML = "<span>✨ Generate Again</span>";
        };
        img.onerror = () => {
            throw new Error("Failed to load image");
        };
        img.src = imageUrl;

    } catch (error) {
        console.error("AI Generation Error:", error);
        aiLoader.style.display = 'none';
        aiPlaceholder.style.display = 'block';
        aiPlaceholder.textContent = "Error: GPU Node busy. Please try again.";
        generateBtn.disabled = false;
        generateBtn.innerHTML = "<span>✨ Generate</span>";
    }
}


// Add Token to Wallet
async function addTokenToWallet() {
    const tokenAddress = WEB3_CONFIG.tokenAddress;
    const tokenSymbol = 'NUERALLY';
    const tokenDecimals = 18;
    const tokenImage = window.location.origin + '/assets/hero-brain.png';

    // Check if window.ethereum exists
    if (!window.ethereum) {
        // Simple mobile detection
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (isMobile) {
            // Try explicit deep link if not inside a wallet browser
            const currentUrl = window.location.href.replace(/^https?:\/\//, '');
            const deepLink = `https://metamask.app.link/dapp/${currentUrl}`;

            if (confirm("Metamask not detected. Open this page in the MetaMask app to add the token?")) {
                window.location.href = deepLink;
            }
        } else {
            alert("MetaMask is not installed! Please install it to add the token.");
            window.open("https://metamask.io/download/", "_blank");
        }
        return;
    }

    try {
        const wasAdded = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20', // Initially only supports ERC20, but some wallets may support others
                options: {
                    address: tokenAddress,
                    symbol: tokenSymbol,
                    decimals: tokenDecimals,
                    image: tokenImage,
                },
            },
        });

        if (wasAdded) {
            console.log('Token added!');
            alert('NUERALLY Token added to your wallet!');
        } else {
            console.log('Token add rejected');
        }
    } catch (error) {
        console.error(error);
        if (error.code === 4001) {
            // User rejected request
            return;
        }
        alert("Failed to add token: " + (error.message || error));
    }
}

// Auto-init if script loaded
document.addEventListener('DOMContentLoaded', initPresale);

// Helper Functions - Modal Logic
window.openModal = function (modal) {
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('active');
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'auto';
    }, 10);
    console.log("Modal Opened:", modal.id);
}

window.closeModal = function (modal) {
    if (!modal) modal = document.getElementById('presaleOverlay'); // Default fallback
    if (!modal) return;
    modal.classList.remove('active');
    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';

    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Toggle Currency
// Toggle Currency - HARDCODED USDT
window.toggleCurrency = function (currency) {
    console.log("Currency toggle ignored - Enforcing USDT");
    currentCurrency = 'USDT';
    payoutToken = 'USDT';

    // Force UI to USDT
    const usdtBtn = document.querySelector('.token-selector[data-currency="USDT"]');
    if (usdtBtn) {
        document.querySelectorAll('.token-selector').forEach(el => el.classList.remove('active'));
        usdtBtn.classList.add('active');
    }

    // Update Label
    const payLabel = document.getElementById('payLabel');
    if (payLabel) payLabel.textContent = `You Pay (USDT)`;

    updateCurrencyUI();
    calculateTokens();
    updateBuyButtonState();
}

// Calculate Tokens
window.calculateTokens = function () {
    // Re-select if needed to be safe
    if (!paymentInput) paymentInput = document.getElementById('paymentInput');
    if (!tokenOutput) tokenOutput = document.getElementById('tokenOutput');

    if (!paymentInput) return;
    const amount = parseFloat(paymentInput.value) || 0;

    // Debug log
    // console.log("Calculating tokens for:", amount);

    if (amount === 0) {
        if (tokenOutput) tokenOutput.value = "0.0";
        return;
    }

    const price = PRESALE_CONFIG.price || 0.00012; // USD per Token
    let tokens = 0;

    if (currentCurrency === 'USDT') {
        tokens = amount / price;
    } else {
        // BNB Calculation
        const bnbPrice = PRESALE_CONFIG.bnbPrice || 600; // USD per BNB
        const amountInUSD = amount * bnbPrice;
        tokens = amountInUSD / price;
    }

    if (tokenOutput) tokenOutput.value = tokens.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// Select Wallet
window.selectWallet = async function (walletType) {
    console.log("Selecting wallet:", walletType);
    if (walletSelectionOverlay) closeModal(walletSelectionOverlay);

    await connectWallet();
}

async function connectWallet() {
    // Mobile Deep Link Check
    if (!window.ethereum && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        console.log("Mobile device detected without Web3. Redirecting to MetaMask...");
        const currentUrl = window.location.href;
        const cleanUrl = currentUrl.replace(/^https?:\/\//, '');
        window.location.href = `https://metamask.app.link/dapp/${cleanUrl}`;
        return;
    }

    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAddress = accounts[0];
            onWalletConnected();
        } catch (error) {
            console.error("User denied account access");
        }
    } else {
        alert("Please install MetaMask or a Web3 Wallet!");
        window.open("https://metamask.io/download/", "_blank");
    }
}

function onWalletConnected() {
    // Update Connect Button
    const shortAddr = userAddress.substring(0, 6) + "..." + userAddress.substring(38);
    if (connectBtn) {
        connectBtn.textContent = shortAddr;
        connectBtn.classList.add('connected');
    }

    // Check Chain ID
    checkChainId();

    // Enable Buy Button if currency is valid
    updateCurrencyUI();

    // Update Claim UI
    updateClaimUI();

    // REFERRAL LOGIC
    const refContainer = document.getElementById('referralContainer');
    const refInput = document.getElementById('myRefLink');
    if (refContainer && refInput) {
        refContainer.style.display = 'block';
        // Construct link: origin + ?ref=ADDRESS
        const origin = window.location.origin;
        // Ensure no double slash if origin ends with / (rare but safe)
        const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;
        refInput.value = `${baseUrl}/?ref=${userAddress}`;

        // Update Earnings
        updateReferralEarnings();
    }
}

// Global Copy Function
window.copyReferral = function () {
    const refInput = document.getElementById('myRefLink');
    if (!refInput) return;

    refInput.select();
    refInput.setSelectionRange(0, 99999); // For mobile

    // Copy to clipboard
    navigator.clipboard.writeText(refInput.value).then(() => {
        const btn = document.querySelector('#referralContainer button');
        if (btn) {
            const oldText = btn.textContent;
            btn.textContent = "COPIED!";
            setTimeout(() => btn.textContent = oldText, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

async function updateReferralEarnings() {
    if (!userAddress) return;
    const earningsEl = document.getElementById('referralEarnings');
    if (!earningsEl) return;

    try {
        let provider = await getRobustProvider();

        // Try to use wallet provider if available and on correct chain for better consistency
        if (window.ethereum) {
            const walletProvider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await walletProvider.getNetwork();
            if (network.chainId === WEB3_CONFIG.chainId) {
                provider = walletProvider;
            }
        }

        if (!provider) return;

        const contract = new ethers.Contract(WEB3_CONFIG.contractAddress, WEB3_CONFIG.abi, provider);
        const earnings = await contract.referralEarnings(userAddress);
        const earningsFormatted = ethers.utils.formatEther(earnings);

        earningsEl.textContent = `${parseFloat(earningsFormatted).toLocaleString()} NUERALLY`;
    } catch (e) {
        console.error("Error fetching referral earnings:", e);
        earningsEl.textContent = "Error";
    }
}

async function checkChainId() {
    if (!window.ethereum) return false;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const { chainId } = await provider.getNetwork();

    // Check against current config (MAINNET/TESTNET)
    if (chainId !== WEB3_CONFIG.chainId) {
        console.warn(`Wrong Chain ID: ${chainId} (Expected: ${WEB3_CONFIG.chainId})`);
        return false;
    }
    return true;
}

async function switchToBSC() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: WEB3_CONFIG.chainHex }],
        });
        // Chain change listener will reload page
    } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
            try {
                // Determine correctly formatted parameters
                const chainName = ENV === 'MAINNET' ? 'Binance Smart Chain'
                    : ENV === 'TESTNET' ? 'BSC Testnet'
                        : 'Localhost 8545';

                const symbol = ENV === 'LOCAL' ? 'ETH' : 'BNB';

                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: WEB3_CONFIG.chainHex,
                            chainName: chainName,
                            rpcUrls: WEB3_CONFIG.rpcUrls, // Use the array directly
                            blockExplorerUrls: [WEB3_CONFIG.blockExplorer],
                            nativeCurrency: {
                                name: symbol,
                                symbol: symbol,
                                decimals: 18
                            }
                        },
                    ],
                });
            } catch (addError) {
                console.error("Failed to add Network:", addError);
                alert("Failed to add network to MetaMask. Please add specifically:\nRPC: " + WEB3_CONFIG.rpcUrls[0] + "\nChain ID: " + WEB3_CONFIG.chainId);
            }
        } else {
            console.error("Failed to switch network:", switchError);
            alert("Failed to switch network: " + switchError.message);
        }
    }
}

async function updateBuyButtonState() {
    if (!userAddress) {
        if (buyBtn) {
            buyBtn.textContent = "Connect Wallet to Buy";
            buyBtn.disabled = false;
            buyBtn.onclick = () => openModal(walletSelectionOverlay);
        }
        return;
    }

    // Check Network
    const isCorrectChain = await checkChainId();
    if (!isCorrectChain) {
        if (buyBtn) {
            buyBtn.textContent = "Switch Network";
            buyBtn.onclick = switchToBSC;
            buyBtn.disabled = false;
        }
        return;
    }

    if (currentCurrency === 'BNB') {
        if (buyBtn) {
            buyBtn.textContent = "Buy Now (BNB)";
            buyBtn.onclick = buyWithBNB;
            buyBtn.disabled = false;
        }
    } else {
        // USDT Logic (Check Allowance)
        if (buyBtn) buyBtn.textContent = "Checking Allowance...";
        checkUSDTAllowance();
    }
}

async function checkUSDTAllowance() {
    if (!userAddress || currentCurrency !== 'USDT') return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    // Use ERC20 ABI
    const usdtContract = new ethers.Contract(WEB3_CONFIG.usdtAddress, WEB3_CONFIG.erc20Abi, signer);

    try {
        const allowance = await usdtContract.allowance(userAddress, WEB3_CONFIG.contractAddress);

        // RACE CONDITION FIX: Ensure we are still on USDT
        if (currentCurrency !== 'USDT') return;

        // Check if allowance is enough for the current input amount, or just check generic large amount
        // ideally we check against input amount, but specific amount check causes UI flickering if input changes
        // so we check if > 0 basically or > some threshold. 
        // For simplicity, let's check if it's > 0. If 0, approve. 
        // Better: Check if allowance < VERY_LARGE_NUMBER. 
        // Actually, best is to check against a minimum safe amount or the input amount.
        // Let's stick to the existing logic of checking against 1000000000 for now to minimize risk, 
        // but arguably we should check against input. 

        // Check against input amount to avoid over-approval
        const inputVal = parseFloat(document.getElementById('paymentInput').value) || 0;
        let amountToCheck;

        if (inputVal > 0) {
            // Add a tiny buffer (e.g. 1%) or just exact amount? Exact amount is safest for "Review" alert.
            // But if user increases amount later, they need to approve again. This is acceptable.
            amountToCheck = ethers.utils.parseUnits(inputVal.toString(), 18);
        } else {
            // Default check (e.g. 10 USDT min) logic to see if we need ANY approval
            amountToCheck = ethers.utils.parseUnits("10", 18);
        }

        if (allowance.lt(amountToCheck)) {
            if (buyBtn) {
                buyBtn.textContent = "Step 1: Approve USDT";
                buyBtn.onclick = () => approveUSDT(amountToCheck);
                buyBtn.disabled = false;
            }
        } else {
            if (buyBtn) {
                buyBtn.textContent = "Step 2: Buy Now (USDT)";
                buyBtn.onclick = buyWithUSDT;
                buyBtn.disabled = false;
            }
        }
    } catch (e) {
        console.error("Error checking allowance:", e);
        // Fallback or retry
        if (buyBtn) {
            buyBtn.textContent = "Error Checking Allowance";
            setTimeout(() => {
                if (buyBtn) buyBtn.textContent = "Retry Connection";
            }, 2000);
        }
    }
}

async function approveUSDT(amountToApprove) {
    if (!userAddress) return;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const usdtContract = new ethers.Contract(WEB3_CONFIG.usdtAddress, WEB3_CONFIG.erc20Abi, signer);

    try {
        // GAS CHECK
        const hasGas = await checkBNBForGas();
        if (!hasGas) {
            alert("Warning: Your BNB balance is very low. You need BNB to pay for gas fees to approve and buy.");
        }

        buyBtn.textContent = "Approving...";
        buyBtn.disabled = true;

        // If amountToApprove is missing (fallback), use a safe default but not infinite to avoid "Review" scare
        // Or check input again
        if (!amountToApprove) {
            const inputVal = parseFloat(document.getElementById('paymentInput').value) || 0;
            if (inputVal > 0) {
                amountToApprove = ethers.utils.parseUnits(inputVal.toString(), 18);
            } else {
                amountToApprove = ethers.constants.MaxUint256; // Fallback to infinite if input is weird
            }
        }

        const tx = await usdtContract.approve(WEB3_CONFIG.contractAddress, amountToApprove);
        await tx.wait();

        // Check allowance again to move to next step
        updateBuyButtonState();
        alert("Approval Successful! Now click 'Buy Now' to complete the purchase.");

    } catch (e) {
        if (e.message && (e.message.includes("insufficient funds") || e.message.includes("gas"))) {
            alert("Error: Insufficient BNB for gas fees.\n\nYou need a small amount of BNB (approx $0.05) to pay for the transaction fee, even when paying with USDT.");
            buyBtn.textContent = "Need BNB for Gas";
        } else if (e.code === 4001) {
            buyBtn.textContent = "Transaction Rejected";
        } else {
            console.error("Approve failed", e);
            buyBtn.textContent = "Approve Failed (Retry)";
        }

        buyBtn.disabled = false;
        buyBtn.onclick = () => approveUSDT(amountToApprove);
    }
}


async function checkBNBForGas() {
    if (!userAddress) return false;
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const balance = await provider.getBalance(userAddress);
        // extremely low threshold, just checks for non-zero basically
        if (balance.lt(ethers.utils.parseEther("0.001"))) {
            return false;
        }
    } catch (e) {
        console.warn("Could not check BNB balance", e);
    }
    return true;
}

async function handleBuy() {
    if (!userAddress) {
        alert("Please connect wallet first!");
        return;
    }

    if (currentCurrency === 'BNB') {
        buyWithBNB();
    } else {
        // Should have been overridden by checkUSDTAllowance if connected, but fallback:
        checkUSDTAllowance();
    }
}

async function buyWithBNB() {
    const amountVal = parseFloat(paymentInput.value);
    if (!amountVal || amountVal <= 0) {
        alert("Enter a valid amount");
        return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(WEB3_CONFIG.contractAddress, WEB3_CONFIG.abi, signer);

    try {
        const amountWei = ethers.utils.parseEther(amountVal.toString());

        if (buyBtn) {
            buyBtn.textContent = "Processing...";
            buyBtn.disabled = true;
        }

        // Note: usage of referrer
        const tx = await contract.buyWithBNB(currentReferrer || ethers.constants.AddressZero, { value: amountWei });
        alert("Transaction Sent! Hash: " + tx.hash);
        await tx.wait();
        alert("Purchase Successful!");
        fetchRawData();
        updateClaimUI(); // Explicitly update user balance immediately

        // Reset button
        if (buyBtn) {
            buyBtn.textContent = "Buy Now (BNB)";
            buyBtn.disabled = false;
        }
    } catch (e) {
        console.error("BNB Buy failed", e);

        // Reset button
        if (buyBtn) {
            buyBtn.textContent = "Buy Now (BNB)";
            buyBtn.disabled = false;
        }

        // Specialized error message for the known Oracle issue
        // Specialized error message for the known Oracle issue
        if (e.message && (e.message.includes("revert") || e.message.includes("execution reverted"))) {
            alert("Transaction Failed (Contract Logic). \n\nIMPORTANT: Use USDT if BNB fails (Mainnet Oracle maintenance).");
        } else {
            alert("Buy failed: " + (e.reason || e.message));
        }
    }
}


// --- CLAIM LOGIC ---

async function updateClaimUI() {
    if (!userAddress) return;

    // Elements
    const claimSection = document.getElementById('claimSection');
    const userPurchased = document.getElementById('userPurchased');
    const claimBtn = document.getElementById('claimBtn');
    const claimStatus = document.getElementById('claimStatus');

    if (!claimSection) return;

    try {
        // USE READ-ONLY RPC with fallback
        const provider = await getRobustProvider();
        const contract = new ethers.Contract(WEB3_CONFIG.contractAddress, WEB3_CONFIG.abi, provider);

        // 1. Get Purchased Amount
        const purchased = await contract.purchasedTokens(userAddress);
        const purchasedFormatted = ethers.utils.formatEther(purchased);

        // 2. Get Claiming Status
        const claimingEnabled = await contract.claimingEnabled();

        console.log(`Claimable: ${purchasedFormatted}, Enabled: ${claimingEnabled}`);

        if (parseFloat(purchasedFormatted) > 0) {
            claimSection.style.display = 'block';
            userPurchased.textContent = parseFloat(purchasedFormatted).toLocaleString() + " NUERALLY";

            if (claimingEnabled) {
                claimBtn.disabled = false;
                claimBtn.textContent = "Claim Tokens";
                claimStatus.textContent = "Ready to claim.";
                claimStatus.style.color = "var(--ok)";

                // Add explicit network check to button click
                claimBtn.onclick = async () => {
                    const isCorrect = await checkChainId();
                    if (!isCorrect) {
                        await switchToBSC();
                        return;
                    }
                    window.claimTokens();
                };

            } else {
                claimBtn.disabled = true;
                claimBtn.textContent = "Claiming Not Live";
                claimStatus.textContent = "Claiming will be enabled soon.";
                claimStatus.style.color = "var(--warn)";
            }
        } else {
            claimSection.style.display = 'block'; // ALWAYS VISIBLE
            userPurchased.textContent = "0.00 NUERALLY";
            claimBtn.disabled = true;
            claimBtn.textContent = "No Tokens to Claim";
            claimStatus.textContent = "Purchase tokens first.";
            claimStatus.style.color = "var(--muted)";
        }
    } catch (e) {
        console.error("Error updating claim UI:", e);
        // Fallback: Show section but indicate error
        claimSection.style.display = 'block';
        if (userPurchased) userPurchased.textContent = "Network Error";
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.textContent = "Connection Failed";
        }
        if (claimStatus) {
            // Show detailed error for debugging
            claimStatus.textContent = `Error: ${e.message || "Unknown RPC Error"}`;
            claimStatus.style.color = "var(--warn)";
        }
    }
}

window.claimTokens = async function () {
    if (!userAddress) return;
    const claimBtn = document.getElementById('claimBtn');

    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(WEB3_CONFIG.contractAddress, WEB3_CONFIG.abi, signer);

        claimBtn.textContent = "Claiming...";
        claimBtn.disabled = true;

        const tx = await contract.claim();
        alert("Claim Transaction Sent! Hash: " + tx.hash);
        await tx.wait();

        alert("Tokens Claimed Successfully! Check your wallet.");

        // Auto-prompt to add token
        try {
            await addTokenToWallet();
        } catch (ignore) { }

        updateClaimUI(); // Refresh

    } catch (e) {
        console.error("Claim failed:", e);
        alert("Claim failed: " + (e.reason || e.message));
        claimBtn.disabled = false;
        claimBtn.textContent = "Claim Tokens";
    }
}

// --- MOCK USDT FAUCET (LOCAL & TESTNET) ---
if (false) { // HIDDEN AS PER REQUEST
    const container = document.createElement('div');
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.left = "20px";
    container.style.zIndex = "9999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";

    // Mint Button
    const mintBtn = document.createElement('button');
    mintBtn.innerText = "🛠 Mint 1000 Test USDT";
    Object.assign(mintBtn.style, {
        padding: "10px 15px",
        background: "#FFC107",
        color: "#000",
        border: "none",
        borderRadius: "8px",
        fontWeight: "bold",
        cursor: "pointer"
    });
    mintBtn.onclick = async () => {
        if (!userAddress) return alert("Connect Wallet First!");
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const usdt = new ethers.Contract(WEB3_CONFIG.usdtAddress, ["function mint(address to, uint256 amount) public"], signer);
            const tx = await usdt.mint(userAddress, ethers.utils.parseUnits("1000", 18));
            alert("Minting 1000 USDT... Hash: " + tx.hash);
            await tx.wait();
            alert("Mint Success! Balance Updated.");
        } catch (e) {
            console.error(e);
            alert("Mint Failed: " + e.message);
        }
    };

    // Add Token Button
    const addTokenBtn = document.createElement('button');
    addTokenBtn.innerText = "🦊 Add NUERALLY to MetaMask";
    Object.assign(addTokenBtn.style, {
        padding: "10px 15px",
        background: "#F6851B", // MetaMask Orange
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontWeight: "bold",
        cursor: "pointer"
    });
    addTokenBtn.onclick = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: WEB3_CONFIG.tokenAddress,
                        symbol: 'NUERALLY',
                        decimals: 18,
                    },
                },
            });
        } catch (error) {
            console.error("Failed to add token", error);
        }
    };

    // Check Referrals Button
    const refBtn = document.createElement('button');
    refBtn.innerText = "💰 Check Referral Earnings";
    Object.assign(refBtn.style, {
        padding: "10px 15px",
        background: "#2196F3", // Blue
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontWeight: "bold",
        cursor: "pointer"
    });
    refBtn.onclick = window.checkReferrals;

    container.appendChild(mintBtn);
    container.appendChild(addTokenBtn);
    container.appendChild(refBtn);
    document.body.appendChild(container);
}

// --- REFERRAL CHECK LOGIC ---
window.checkReferrals = async function () {
    console.log("checkReferrals started");
    if (!window.ethereum) return alert("No Crypto Wallet Found!");
    if (!userAddress) return alert("Connect Wallet First!");
    console.log("Checking referrals for:", userAddress);

    try {
        console.log("Connecting to provider...");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(WEB3_CONFIG.contractAddress, WEB3_CONFIG.abi, signer);

        console.log("Fetching earnings for:", userAddress);
        // Fetch Data
        const earnings = await contract.referralEarnings(userAddress);
        console.log("Raw Earnings:", earnings.toString());
        const earningsFmt = ethers.utils.formatEther(earnings);

        const enabled = await contract.claimingEnabled();
        const launchTime = await contract.launchTime();

        // Calculate Lock
        const now = Math.floor(Date.now() / 1000);
        const unlockTime = launchTime.add(30 * 24 * 60 * 60); // 30 days
        const isLocked = now < unlockTime;

        let msg = `📊 **Referral Status**\n\n`;
        msg += `Earnings: ${earningsFmt} NUERALLY\n`;
        msg += `Claiming Active: ${enabled ? "✅ Yes" : "❌ No"}\n`;

        if (launchTime.gt(0)) {
            msg += `Unlock Time: ${new Date(unlockTime * 1000).toLocaleString()}\n`;
        }

        if (parseFloat(earningsFmt) <= 0) {
            alert(msg + "\nNo earnings to claim yet. Share your link!");
            return;
        }

        if (!enabled) {
            alert(msg + "\nWait for the Owner to enable claiming.");
            return;
        }

        if (isLocked && launchTime.gt(0)) {
            alert(msg + "\nRewards are locked for 30 days after launch.");
            return;
        }

        // If we get here, they can claim!
        if (confirm(`${msg}\n🎉 You can claim ${earningsFmt} NUERALLY!\n\nClick OK to Claim now.`)) {
            try {
                const tx = await contract.claimReferralRewards();
                alert("Claiming... Hash: " + tx.hash);
                await tx.wait();
                alert("Success! Rewards claimed.");
            } catch (err) {
                console.error(err);
                alert("Claim Failed: " + (err.reason || err.message));
            }
        }

    } catch (e) {
        console.error("Referral Check Failed", e);
        alert("Error checking referrals: " + e.message);
    }
};

// --- DEBUG LOGIC ---
window.debugFindPurchase = async function () {
    const debugResult = document.getElementById('debugResult');
    const btn = document.querySelector('button[onclick="window.debugFindPurchase()"]');

    // Check if ethereum is available
    if (!window.ethereum) {
        if (debugResult) debugResult.textContent = "Error: No Wallet Found";
        alert("No Wallet Found. Please install MetaMask.");
        return;
    }

    try {
        if (btn) {
            btn.disabled = true;
            btn.textContent = "Scanning... (Please Wait)";
        }
        if (debugResult) debugResult.textContent = "Initializing Scan...";

        // Request connection if not connected (needed for read? maybe not, but good to have)
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const presaleAddress = WEB3_CONFIG.contractAddress;

        // Topic 0 for TokensPurchased
        const topic0 = ethers.utils.id("TokensPurchased(address,uint256,uint256,string)");

        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 5000); // Last 5000 blocks

        if (debugResult) debugResult.textContent = `Scanning blocks ${fromBlock} to ${currentBlock}...`;

        const logs = await provider.getLogs({
            fromBlock: fromBlock,
            toBlock: currentBlock,
            address: presaleAddress,
            topics: [topic0]
        });

        if (logs.length === 0) {
            if (debugResult) debugResult.textContent = "No recent purchases found.";
            if (btn) {
                btn.textContent = "Scan Again";
                btn.disabled = false;
            }
            return;
        }

        let msg = `Found ${logs.length} Purchases:\n`;
        let foundMatch = false;

        for (const log of logs) {
            const parsed = new ethers.utils.Interface([
                "event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost, string currency)"
            ]).parseLog(log);

            const cost = ethers.utils.formatEther(parsed.args.cost);
            const buyer = parsed.args.buyer;
            const amount = ethers.utils.formatEther(parsed.args.amount);

            // Highlight the 20 USDT one
            if (Math.abs(parseFloat(cost) - 20.0) < 0.1) {
                foundMatch = true;
                msg = `🎯 MATCH FOUND!\nBuyer: ${buyer}\nAmount: ${amount} NUERALLY\n\n(This address has the tokens!)`;

                alert(`FOUND IT!\n\nBuyer: ${buyer}\nAmount: ${amount} NUERALLY\n\nIf this is NOT you, please copy this address and send it to support.`);

                if (debugResult) {
                    debugResult.style.color = "#43ffa8"; // Green
                    debugResult.innerText = `MATCH FOUND: ${buyer}`;
                }
                if (btn) btn.textContent = "Scan Complete";
                console.log("MATCH FOUND:", buyer);
                return;
            }
        }

        if (!foundMatch) {
            msg = "Found purchases but NOT the 20 USDT one.";
        }

        if (debugResult) debugResult.innerText = msg;
        if (btn) {
            btn.textContent = "Scan Complete";
            btn.disabled = false;
        }

    } catch (e) {
        console.error(e);
        if (debugResult) debugResult.textContent = "Scan Failed: " + (e.message || "RPC Error");
        if (btn) {
            btn.textContent = "Retry Scan";
            btn.disabled = false;
        }
    }
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Ready - Firing initPresale");
    if (typeof initPresale === 'function') initPresale();
});
