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
    contractAddress: "0x0000000000000000000000000000000000000000", // Presale Contract
    usdtAddress: "0x55d398326f99059fF775485246999027B3197955",      // USDT (BEP-20) Mainnet Address
    chainId: 56, // BNB Smart Chain
    chainHex: "0x38",
    rpcUrl: "https://bsc-dataseed.binance.org/",
    blockExplorer: "https://bscscan.com",
    abi: [
        "function buyTokens() public payable",
        "function buyTokensUSDT(uint256 amount) public",
        "function tokenPrice() public view returns (uint256)",
        "function tokensSold() public view returns (uint256)"
    ],
    erc20Abi: [
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function allowance(address owner, address spender) public view returns (uint256)",
        "function balanceOf(address account) public view returns (uint256)"
    ]
};

let userAddress = null;
let currentCurrency = 'BNB'; // 'BNB' or 'USDT'

// DOM Elements
const presaleOverlay = document.getElementById('presaleOverlay');
const walletSelectionOverlay = document.getElementById('walletSelectionOverlay');
const connectBtn = document.getElementById('connectWalletBtn');
const mainConnectBtn = document.getElementById('presaleLink');
const closeModalBtn = document.getElementById('closeModal');
const closeWalletModalBtn = document.getElementById('closeWalletModal');
const buyBtn = document.getElementById('buyBtn');
const paymentInput = document.getElementById('bnbAmount'); // Renamed from bnbInput
const payLabel = document.getElementById('payLabel');
const tokenOutput = document.getElementById('tokenAmount'); // Fixed ID
const progressBar = document.getElementById('progressBar');
const raisedDisplay = document.getElementById('raisedAmount');
const exchangeRateDisplay = document.querySelector('.exchange-rate');

// Initialize
function initPresale() {
    updateProgress();

    // Main Presale Modal Triggers
    mainConnectBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(presaleOverlay);
    });

    closeModalBtn.addEventListener('click', () => closeModal(presaleOverlay));

    // Close on click outside
    presaleOverlay.addEventListener('click', (e) => {
        if (e.target === presaleOverlay) closeModal(presaleOverlay);
    });

    // Wallet Selection Triggers
    connectBtn.addEventListener('click', () => openModal(walletSelectionOverlay));
    closeWalletModalBtn.addEventListener('click', () => closeModal(walletSelectionOverlay));
    walletSelectionOverlay.addEventListener('click', (e) => {
        if (e.target === walletSelectionOverlay) closeModal(walletSelectionOverlay);
    });

    // Input calculation
    paymentInput.addEventListener('input', calculateTokens);

    // Initial button state
    buyBtn.addEventListener('click', handleBuy);

    // Set initial Label
    updateCurrencyUI();
}

function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}


// Global scope for HTML onclick
window.toggleCurrency = function (currency) {
    currentCurrency = currency;

    // Update active class
    const selectors = document.querySelectorAll('#currencyToggle .token-selector');
    selectors.forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('data-currency') === currency) {
            el.classList.add('active');
        }
    });

    updateCurrencyUI();
    calculateTokens();
}

function updateCurrencyUI() {
    // Update Label
    payLabel.textContent = `You Pay (${currentCurrency})`;

    // Update Rate Text
    const rate = PRESALE_CONFIG.rates[currentCurrency].toLocaleString();
    exchangeRateDisplay.textContent = `1 ${currentCurrency} = ${rate} NEURALY`;

    // Update Button Text logic
    if (currentCurrency === 'USDT' && userAddress) {
        checkUSDTAllowance();
    } else {
        buyBtn.textContent = userAddress ? "Buy NEURALY" : "Connect Wallet to Buy";
    }
}

function calculateTokens() {
    const amount = parseFloat(paymentInput.value) || 0;
    const rate = PRESALE_CONFIG.rates[currentCurrency];
    const tokens = amount * rate;
    tokenOutput.value = tokens.toLocaleString();
}

function updateProgress() {
    const percentage = (PRESALE_CONFIG.raised / PRESALE_CONFIG.hardcap) * 100;
    progressBar.style.width = `${percentage}%`;
    raisedDisplay.textContent = `${PRESALE_CONFIG.raised} / ${PRESALE_CONFIG.hardcap} BNB`;
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

        if (currentCurrency === 'BNB') {
            const value = ethers.utils.parseEther(amount.toString());
            tx = await contract.buyTokens({ value: value });
        } else {
            const value = ethers.utils.parseUnits(amount.toString(), 18); // USDT usually 18 decimals on BSC? (Check: BSC-USDT is 18)
            tx = await contract.buyTokensUSDT(value);
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
            alert('Transaction Failed: ' + (error.reason || error.message));
        }

    } finally {
        if (!buyBtn.textContent.includes("Approve")) {
            buyBtn.textContent = 'Buy NEURALY';
            buyBtn.disabled = false;
        }
    }
}

// Auto-init if script loaded
document.addEventListener('DOMContentLoaded', initPresale);
