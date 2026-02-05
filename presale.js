// Presale Logic
const PRESALE_CONFIG = {
    hardcap: 500, // BNB
    raised: 154.5, // Mock initial value
    rates: {
        BNB: 20000000,   // 1 BNB = 20,000,000 NEURALY
        USDT: 50000      // 1 USDT = 50,000 NEURALY (Example Rate)
    },
    limits: {
        BNB: { min: 0.1, max: 10 },
        USDT: { min: 50, max: 5000 }
    }
};

// Web3 Config
const WEB3_CONFIG = {
    contractAddress: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0", // Local Presale
    usdtAddress: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",      // Mock USDT
    chainId: 1337, // Hardhat Localhost
    chainHex: "0x539",
    rpcUrl: "http://127.0.0.1:8545/",
    blockExplorer: "http://localhost",
    abi: [
        "function buyWithBNB(address referrer) public payable",
        "function buyWithUSDT(uint256 amount, address referrer) public",
        "function getCurrentPrice() public view returns (uint256)",
        "function tokensSoldInCurrentStage() public view returns (uint256)",
        "function currentStage() public view returns (uint256)",
        "function totalRaisedBNB() public view returns (uint256)",
        "function getReferralPercent() public view returns (uint256)",
        "function STAGE_ALLOCATION() public view returns (uint256)"
    ],
    erc20Abi: [
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function allowance(address owner, address spender) public view returns (uint256)",
        "function balanceOf(address account) public view returns (uint256)"
    ]
};

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

// DOM Elements
const presaleOverlay = document.getElementById('presaleOverlay');
const walletSelectionOverlay = document.getElementById('walletSelectionOverlay');
const connectBtn = document.getElementById('connectWalletBtn');
const mainConnectBtn = document.getElementById('presaleLink');
const closeModalBtn = document.getElementById('closeModal');
const closeWalletModalBtn = document.getElementById('closeWalletModal');
const buyBtn = document.getElementById('buyBtn');
const paymentInput = document.getElementById('paymentInput');
const payLabel = document.getElementById('payLabel');
const tokenOutput = document.getElementById('tokenOutput');
const progressBar = document.getElementById('progressBar');
const raisedDisplay = document.getElementById('raisedAmount');
// Note: exchangeRateDisplay logic might need updating if we fetch price dynamic, but staying simple for now

// Initialize
function initPresale() {
    // Note: We don't call updateProgress here immediately because we need data first
    fetchRawData();

    // Main Presale Modal Triggers
    if (mainConnectBtn) {
        mainConnectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(presaleOverlay);
        });
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
        const [stageIndex, tokensSold, allocation] = await Promise.all([
            contract.currentStage(),
            contract.tokensSoldInCurrentStage(),
            contract.STAGE_ALLOCATION()
        ]);

        // Helper to formatting
        const soldFormatted = parseFloat(ethers.utils.formatEther(tokensSold));
        const allocationFormatted = parseFloat(ethers.utils.formatEther(allocation));

        PRESALE_CONFIG.raised = soldFormatted;
        PRESALE_CONFIG.hardcap = allocationFormatted; // Reusing hardcap var for Stage Allocation

        // Update UI
        const currentStageNum = parseInt(stageIndex) + 1;
        const headerTitle = document.querySelector('.modal-header h2');
        if (headerTitle) headerTitle.textContent = `Presale Access (Stage ${currentStageNum})`;

        updateProgress();

    } catch (e) {
        console.error("Error fetching data:", e);
    }
}

function updateProgress() {
    const sold = PRESALE_CONFIG.raised;
    const target = PRESALE_CONFIG.hardcap;

    const percentage = (sold / target) * 100;

    if (progressBar) progressBar.style.width = `${percentage}%`;

    // Format large numbers with commas
    const soldStr = sold.toLocaleString('en-US', { maximumFractionDigits: 0 });
    const targetStr = target.toLocaleString('en-US', { maximumFractionDigits: 0 });

    if (raisedDisplay) raisedDisplay.textContent = `${soldStr} / ${targetStr} NEURALY`;
}

// Web3 Config
// Global scope for HTML onclick
window.selectWallet = async function (type) {
    closeModal(walletSelectionOverlay);

    let provider;

    try {
        if (type === 'metamask') {
            if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
                provider = window.ethereum;
            } else {
                if (confirm("MetaMask is not installed. Download now?")) {
                    window.open("https://metamask.io/download/", "_blank");
                }
                return;
            }
        } else if (type === 'trust') {
            if (window.trustwallet) {
                provider = window.trustwallet;
            } else if (typeof window.ethereum !== 'undefined' && window.ethereum.isTrust) {
                provider = window.ethereum;
            } else {
                if (confirm("Trust Wallet is not installed. Download now?")) {
                    window.open("https://trustwallet.com/browser-extension/", "_blank");
                }
                return;
            }
        }

        if (provider) {
            // Request Accounts
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            userAddress = accounts[0];

            // Check Network
            await checkAndSwitchNetwork(provider);

            onWalletConnected(type);
        }
    } catch (error) {
        console.error("Wallet connection error:", error);
        alert('Connection Failed: ' + error.message);
    }
};

async function checkAndSwitchNetwork(provider) {
    try {
        const chainId = await provider.request({ method: 'eth_chainId' });
        if (parseInt(chainId, 16) !== WEB3_CONFIG.chainId) {
            try {
                await provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: WEB3_CONFIG.chainHex }],
                });
            } catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask.
                if (switchError.code === 4902) {
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: WEB3_CONFIG.chainHex,
                                chainName: 'BNB Smart Chain',
                                nativeCurrency: {
                                    name: 'BNB',
                                    symbol: 'BNB',
                                    decimals: 18,
                                },
                                rpcUrls: [WEB3_CONFIG.rpcUrl],
                                blockExplorerUrls: [WEB3_CONFIG.blockExplorer],
                            },
                        ],
                    });
                } else {
                    throw switchError;
                }
            }
        }
    } catch (error) {
        console.error("Network switch error:", error);
        alert("Please switch your wallet to BNB Smart Chain to participate.");
    }
}

function onWalletConnected(type) {
    const shortAddr = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
    connectBtn.textContent = `${shortAddr} (${type === 'trust' ? 'Trust' : 'Web3'})`;
    connectBtn.classList.add('connected');

    // Style update for connection
    connectBtn.style.background = 'rgba(67, 255, 168, 0.1)';
    connectBtn.style.borderColor = 'var(--ok)';
    connectBtn.style.color = 'var(--ok)';

    buyBtn.disabled = false;
    updateCurrencyUI(); // Check allowance state if USDT

    // Show Referral Link
    const refLink = `${window.location.origin}${window.location.pathname}?ref=${userAddress}`;
    const refContainer = document.getElementById('referralContainer');
    if (refContainer) {
        refContainer.style.display = 'block';
        document.getElementById('myRefLink').value = refLink;
    }
}

function copyReferral() {
    const copyText = document.getElementById("myRefLink");
    copyText.select();
    navigator.clipboard.writeText(copyText.value);
    alert("Referral Link Copied: " + copyText.value);
}

// USDT Helper: Check Allowance
async function checkUSDTAllowance() {
    if (!userAddress || currentCurrency !== 'USDT') return;

    // Logic placeholder for UI update
    // In real app, we query allowance
    buyBtn.textContent = "Approve USDT";
    // If allowance > 0, set to "Buy NEURALY"
}

async function handleBuy() {
    if (!userAddress) {
        alert('Please connect wallet first');
        return;
    }

    const amount = paymentInput.value;
    const amountFloat = parseFloat(amount);
    const limits = PRESALE_CONFIG.limits[currentCurrency];

    if (!amount || amountFloat < limits.min || amountFloat > limits.max) {
        alert(`Please enter amount between ${limits.min} and ${limits.max} ${currentCurrency}`);
        return;
    }

    // WEB3 TRANSACTION LOGIC
    try {
        buyBtn.disabled = true;
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // If USDT and button says Approve
        if (currentCurrency === 'USDT' && buyBtn.textContent.includes("Approve")) {
            buyBtn.textContent = 'Approving...';

            if (WEB3_CONFIG.contractAddress.includes("0x000")) {
                await new Promise(r => setTimeout(r, 1500));
                alert("DEMO: USDT Approved!");
                buyBtn.textContent = "Buy NEURALY";
                buyBtn.disabled = false;
                return;
            }

            // Real Approval Logic
            const usdtContract = new ethers.Contract(WEB3_CONFIG.usdtAddress, WEB3_CONFIG.erc20Abi, signer);
            const tx = await usdtContract.approve(WEB3_CONFIG.contractAddress, ethers.constants.MaxUint256);
            await tx.wait();

            buyBtn.textContent = "Buy NEURALY";
            buyBtn.disabled = false;
            return;
        }

        // BUY LOGIC
        buyBtn.textContent = 'Processing...';

        // Demo Check
        if (WEB3_CONFIG.contractAddress.includes("0x000")) {
            await new Promise(r => setTimeout(r, 2000));
            alert(`DEMO: Successfully bought with ${amount} ${currentCurrency}!`);
            PRESALE_CONFIG.raised += (currentCurrency === 'BNB' ? amountFloat : 0); // Only track BNB for demo bar
            updateProgress();
            buyBtn.textContent = 'Buy NEURALY';
            buyBtn.disabled = false;
            return;
        }

        const contract = new ethers.Contract(WEB3_CONFIG.contractAddress, WEB3_CONFIG.abi, signer);
        let tx;

        // Use the referrer from global state, or zero address
        const referrer = currentReferrer || "0x0000000000000000000000000000000000000000";

        if (currentCurrency === 'BNB') {
            const value = ethers.utils.parseEther(amount.toString());
            // Call buyWithBNB(referrer) with manual gas limit
            tx = await contract.buyWithBNB(referrer, {
                value: value,
                gasLimit: 500000
            });
        } else {
            const value = ethers.utils.parseUnits(amount.toString(), 18);
            // Call buyWithUSDT(amount, referrer) with manual gas limit
            tx = await contract.buyWithUSDT(value, referrer, {
                gasLimit: 500000
            });
        }

        const receipt = await tx.wait();

        if (receipt.status === 1) {
            alert('Transaction Successful!');
            // Update local UI (In real app, listen to events)
            // For demo, only BNB contributes to raised amount
            if (currentCurrency === 'BNB') {
                PRESALE_CONFIG.raised += amountFloat;
            }
            updateProgress();
        } else {
            alert('Transaction Failed!');
        }

    } catch (error) {
        console.error("Transaction error:", error);

        if (error.code === 4001) {
            alert('Transaction Rejected by User');
        } else {
            // Show more detail for debugging
            const reason = error.reason || error.data?.message || error.message;
            alert('Transaction Failed: ' + reason);
        }

    } finally {
        if (!buyBtn.textContent.includes("Approve")) {
            buyBtn.textContent = 'Buy NEURALY';
            buyBtn.disabled = false;
        }
    }
}


// -------------------------------------------------------------
// HELPER FUNCTIONS (Previously Missing)
// -------------------------------------------------------------

function openModal(modal) {
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent bg scrolling
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

window.toggleCurrency = function (currency) {
    currentCurrency = currency;

    // Update active class on selectors
    document.querySelectorAll('.token-selector').forEach(el => {
        if (el.dataset.currency === currency) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    // Update Input Label
    if (payLabel) {
        payLabel.textContent = `You Pay (${currency})`;
    }

    // Reset Inputs
    if (paymentInput) paymentInput.value = '';
    if (tokenOutput) tokenOutput.value = '';

    // Trigger UI Update for Button State
    updateCurrencyUI();
};

function updateCurrencyUI() {
    if (currentCurrency === 'USDT') {
        checkUSDTAllowance();
    } else {
        // BNB Logic
        if (buyBtn) {
            buyBtn.textContent = 'Buy NEURALY';
            // Only disable if wallet not connected? 
            // Actually handleBuy checks wallet. 
            // Just ensure it doesn't say "Approve"
        }
    }
}

function calculateTokens() {
    if (!paymentInput || !tokenOutput) return;

    const amount = parseFloat(paymentInput.value);
    if (isNaN(amount)) {
        tokenOutput.value = '';
        return;
    }

    const rate = PRESALE_CONFIG.rates[currentCurrency];
    const tokens = amount * rate;

    // Format with commas
    tokenOutput.value = tokens.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// -------------------------------------------------------------

// Auto-init if script loaded
document.addEventListener('DOMContentLoaded', initPresale);
