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
        contractAddress: "0x7dC1787D85b871c76E446690b9acba3Baa45638A",
        usdtAddress: "0x55d398326f99059fF775485246999027B3197955", // Binance-Peg BSC-USD
        tokenAddress: "0xc63a84c9AF74902A872472bb0eE9Ae98e18810aD",
        chainId: 56,
        chainHex: "0x38",
        rpcUrl: "https://bsc-dataseed.binance.org/",
        blockExplorer: "https://bscscan.com"
    },
    TESTNET: {
        contractAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", // Local Hardhat Deployment
        usdtAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // Local MockUSDT
        tokenAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Local Token Address
        chainId: 1337, // Defaulting to Local for now to keep it working
        chainHex: "0x539",
        rpcUrl: "http://127.0.0.1:8545/",
        blockExplorer: "http://localhost"
    }
};

const WEB3_CONFIG = CONFIG[ENV];

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
    "function STAGE_ALLOCATION() public view returns (uint256)"
];

WEB3_CONFIG.erc20Abi = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function balanceOf(address account) public view returns (uint256)"
];

let userAddress = null;
let currentCurrency = 'BNB'; // 'BNB' or 'USDT'
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
        alert("Error: Presale Modal overlay not found!");
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
    console.log("Overlay:", presaleOverlay);

    // Note: We don't call updateProgress here immediately because we need data first
    fetchRawData();

    // Attach listener to Main Button if it exists (Backup to inline onclick)
    if (mainConnectBtn) {
        mainConnectBtn.onclick = function (e) {
            e.preventDefault();
            window.openPresaleModal();
        };
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', () => closeModal(presaleOverlay));

    // Close on click outside
    if (presaleOverlay) {
        presaleOverlay.addEventListener('click', (e) => {
            if (e.target === presaleOverlay) closeModal(presaleOverlay);
        });
    }

    // Wallet Selection Triggers
    if (connectBtn) connectBtn.addEventListener('click', () => openModal(walletSelectionOverlay));
    if (closeWalletModalBtn) closeWalletModalBtn.addEventListener('click', () => closeModal(walletSelectionOverlay));
    if (walletSelectionOverlay) {
        walletSelectionOverlay.addEventListener('click', (e) => {
            if (e.target === walletSelectionOverlay) closeModal(walletSelectionOverlay);
        });
    }

    // Input calculation
    if (paymentInput) paymentInput.addEventListener('input', calculateTokens);

    // Initial button state
    if (buyBtn) buyBtn.addEventListener('click', handleBuy);

    // Add To Wallet Button
    const addToWalletBtn = document.getElementById('addToWalletBtn');
    if (addToWalletBtn) {
        addToWalletBtn.addEventListener('click', addTokenToWallet);
    }

    // Set initial Label
    updateCurrencyUI();

    // Auto-refresh data every 10s
    setInterval(fetchRawData, 10000);
}

async function fetchRawData() {
    try {
        const provider = new ethers.providers.JsonRpcProvider(WEB3_CONFIG.rpcUrl);
        const contract = new ethers.Contract(WEB3_CONFIG.contractAddress, WEB3_CONFIG.abi, provider);

        // Fetch Data in bulk
        // Note: We removed getLatestPrice() because the Oracle on Mainnet is failing
        const [stageIndex, tokensSold, allocation, priceWei] = await Promise.all([
            contract.currentStage(),
            contract.tokensSoldInCurrentStage(),
            contract.STAGE_ALLOCATION(),
            contract.getCurrentPrice()
        ]);

        // Fetch BNB Price from API (Fallback since Contract Oracle fails)
        let bnbPrice = 600; // Default
        try {
            const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
            const data = await response.json();
            bnbPrice = parseFloat(data.price);
            console.log("BNB Price (API):", bnbPrice);
        } catch (apiErr) {
            console.error("API Price Fetch Failed:", apiErr);
        }

        // Helper to formatting
        const soldTokens = parseFloat(ethers.utils.formatEther(tokensSold));
        const allocationTokens = parseFloat(ethers.utils.formatEther(allocation));
        const price = parseFloat(ethers.utils.formatEther(priceWei));

        PRESALE_CONFIG.raised = soldTokens;
        PRESALE_CONFIG.hardcap = allocationTokens;
        PRESALE_CONFIG.price = price; // Token Price in USD
        PRESALE_CONFIG.bnbPrice = bnbPrice; // BNB Price in USD

        // Update UI
        const currentStageNum = parseInt(stageIndex) + 1;
        const headerTitle = document.querySelector('.modal-header h2');

        if (headerTitle) {
            headerTitle.textContent = `Stage ${currentStageNum} Presale`;
        }

        updateProgress();

    } catch (e) {
        console.error("Error fetching data:", e);
    }
}

// ... (calculateTokens remains same) ...

function updateCurrencyUI() {
    if (currentCurrency === 'USDT') {
        // Change button to "Approve USDT" initially, then check allowance
        if (buyBtn) {
            buyBtn.textContent = 'Approve USDT';
            buyBtn.disabled = false;
        }
        checkUSDTAllowance();
    } else {
        // BNB Logic - DISABLED DUE TO ORACLE ISSUE
        if (buyBtn) {
            buyBtn.textContent = 'BNB Disabled (Use USDT)';
            buyBtn.disabled = true;
            buyBtn.style.background = '#ff4d4d'; // Red warning color
            buyBtn.style.borderColor = '#ff4d4d';
        }
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

    try {
        const wasAdded = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
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
        } else {
            console.log('Token add rejected');
        }
    } catch (error) {
        console.log(error);
        alert("Failed to add token: " + (error.message || error));
    }
}

// Auto-init if script loaded
document.addEventListener('DOMContentLoaded', initPresale);
