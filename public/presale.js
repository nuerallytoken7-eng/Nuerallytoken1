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
        const provider = new ethers.providers.JsonRpcProvider(WEB3_CONFIG.rpcUrl);
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

    // Update active class
    // FORCE USDT ONLY - REMOVED TO ENABLE BNB
    // currentCurrency = 'USDT';

    // Update active class
    if (document.querySelector('.token-selector[data-currency="BNB"]')) {
        // Show BNB Selector
        document.querySelector('.token-selector[data-currency="BNB"]').style.display = 'flex';

        // Remove active from all first
        document.querySelectorAll('.token-selector').forEach(el => el.classList.remove('active'));

        // Add active to current
        const activeEl = document.querySelector(`.token-selector[data-currency="${currentCurrency}"]`);
        if (activeEl) activeEl.classList.add('active');
    }

    if (payLabel) payLabel.textContent = `You Pay (${currentCurrency})`;

    // Update Button State
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
window.toggleCurrency = function (currency) {
    currentCurrency = currency;
    console.log("Currency switched to:", currency);

    // Update active class
    document.querySelectorAll('.token-selector').forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('data-currency') === currency) el.classList.add('active');
    });

    // Update Label
    if (!payLabel) payLabel = document.getElementById('payLabel');
    if (payLabel) {
        payLabel.textContent = `You Pay (${currency})`;
    }

    updateCurrencyUI();
    calculateTokens();
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
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: WEB3_CONFIG.chainHex,
                            chainName: ENV === 'MAINNET' ? 'Binance Smart Chain' : 'BSC Testnet',
                            rpcUrls: [WEB3_CONFIG.rpcUrl],
                            blockExplorerUrls: [WEB3_CONFIG.blockExplorer],
                            nativeCurrency: {
                                name: 'BNB',
                                symbol: 'BNB',
                                decimals: 18
                            }
                        },
                    ],
                });
            } catch (addError) {
                console.error("Failed to add BSC:", addError);
            }
        } else {
            console.error("Failed to switch to BSC:", switchError);
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
        // Check if allowance is enough for the current input amount, or just check generic large amount
        // ideally we check against input amount, but specific amount check causes UI flickering if input changes
        // so we check if > 0 basically or > some threshold. 
        // For simplicity, let's check if it's > 0. If 0, approve. 
        // Better: Check if allowance < VERY_LARGE_NUMBER. 
        // Actually, best is to check against a minimum safe amount or the input amount.
        // Let's stick to the existing logic of checking against 1000000000 for now to minimize risk, 
        // but arguably we should check against input. 

        const amountToCheck = ethers.utils.parseUnits("1000000000", 18);

        if (allowance.lt(amountToCheck)) {
            if (buyBtn) {
                buyBtn.textContent = "Approve USDT";
                buyBtn.onclick = approveUSDT;
                buyBtn.disabled = false;
            }
        } else {
            if (buyBtn) {
                buyBtn.textContent = "Buy Now (USDT)";
                buyBtn.onclick = buyWithUSDT;
                buyBtn.disabled = false;
            }
        }
    } catch (e) {
        console.error("Error checking allowance:", e);
        // Fallback or retry
        setTimeout(checkUSDTAllowance, 3000);
    }
}

async function approveUSDT() {
    if (!userAddress) return;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const usdtContract = new ethers.Contract(WEB3_CONFIG.usdtAddress, WEB3_CONFIG.erc20Abi, signer);

    try {
        buyBtn.textContent = "Approving...";
        buyBtn.disabled = true;
        const tx = await usdtContract.approve(WEB3_CONFIG.contractAddress, ethers.constants.MaxUint256);
        await tx.wait();
        updateBuyButtonState(); // Re-check logic
    } catch (e) {
        console.error("Approve failed", e);
        buyBtn.textContent = "Approve Failed";
        buyBtn.disabled = false;
    }
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

        // Note: usage of referrer
        const tx = await contract.buyWithBNB(currentReferrer || ethers.constants.AddressZero, { value: amountWei });
        alert("Transaction Sent! Hash: " + tx.hash);
        await tx.wait();
        alert("Purchase Successful!");
        fetchRawData();
    } catch (e) {
        console.error("BNB Buy failed", e);
        // Specialized error message for the known Oracle issue
        if (e.message && (e.message.includes("revert") || e.message.includes("execution reverted"))) {
            alert("Transaction Failed (Contract Logic). \n\nIMPORTANT: Use USDT if BNB fails (Mainnet Oracle maintenance).");
        } else {
            alert("Buy failed: " + (e.reason || e.message));
        }
    }
}


