// Presale Logic
const PRESALE_CONFIG = {
    hardcap: 500, // BNB
    raised: 154.5, // Mock initial value
    rate: 20000000, // 1 BNB = 20,000,000 NEURALY
    minBuy: 0.1,
    maxBuy: 10
};

let userAddress = null;

// DOM Elements
const presaleOverlay = document.getElementById('presaleOverlay');
const walletSelectionOverlay = document.getElementById('walletSelectionOverlay');
const connectBtn = document.getElementById('connectWalletBtn'); // In Modal
const mainConnectBtn = document.getElementById('presaleLink'); // Global CTA
const closeModalBtn = document.getElementById('closeModal');
const closeWalletModalBtn = document.getElementById('closeWalletModal');
const buyBtn = document.getElementById('buyBtn');
const bnbInput = document.getElementById('bnbAmount');
const tokenOutput = document.getElementById('tokenAmount');
const progressBar = document.getElementById('progressBar');
const raisedDisplay = document.getElementById('raisedAmount');

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
    bnbInput.addEventListener('input', calculateTokens);

    // Initial button state
    buyBtn.addEventListener('click', handleBuy);
}

function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function calculateTokens() {
    const amount = parseFloat(bnbInput.value) || 0;
    const tokens = amount * PRESALE_CONFIG.rate;
    tokenOutput.value = tokens.toLocaleString();
}

function updateProgress() {
    const percentage = (PRESALE_CONFIG.raised / PRESALE_CONFIG.hardcap) * 100;
    progressBar.style.width = `${percentage}%`;
    raisedDisplay.textContent = `${PRESALE_CONFIG.raised} / ${PRESALE_CONFIG.hardcap} BNB`;
}

// Web3 Config
const WEB3_CONFIG = {
    contractAddress: "0x0000000000000000000000000000000000000000", // Placeholder: REPLACE WITH REAL CONTRACT
    chainId: 56, // BNB Smart Chain Mainnet (Use 97 for Testnet)
    chainHex: "0x38", // 56 in hex
    rpcUrl: "https://bsc-dataseed.binance.org/",
    blockExplorer: "https://bscscan.com",
    abi: [
        "function buyTokens() public payable",
        "function tokenPrice() public view returns (uint256)",
        "function tokensSold() public view returns (uint256)"
    ]
};

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
    buyBtn.textContent = "Buy NEURALY";
}

async function handleBuy() {
    if (!userAddress) {
        alert('Please connect wallet first');
        return;
    }

    const amount = bnbInput.value;
    const amountFloat = parseFloat(amount);

    if (!amount || amountFloat < PRESALE_CONFIG.minBuy || amountFloat > PRESALE_CONFIG.maxBuy) {
        alert(`Please enter amount between ${PRESALE_CONFIG.minBuy} and ${PRESALE_CONFIG.maxBuy} BNB`);
        return;
    }

    // WEB3 TRANSACTION LOGIC
    try {
        buyBtn.textContent = 'Processing...';
        buyBtn.disabled = true;

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // If contract address is still placeholder, warn user logic won't work on chain
        if (WEB3_CONFIG.contractAddress === "0x0000000000000000000000000000000000000000") {
            console.warn("Using Placeholder Contract Address. Transaction will fail if not updated.");

            // SIMULATION FOR DEMO PURPOSES (Remove this block when live)
            await new Promise(r => setTimeout(r, 2000)); // Fake delay
            alert("This is a DEMO. In production, this would open your wallet to sign a transaction.");
            PRESALE_CONFIG.raised += amountFloat;
            updateProgress();
            buyBtn.textContent = 'Buy NEURALY';
            buyBtn.disabled = false;
            return;
        }

        const contract = new ethers.Contract(WEB3_CONFIG.contractAddress, WEB3_CONFIG.abi, signer);

        // Calculate value in Wei
        const value = ethers.utils.parseEther(amount.toString());

        // Send Transaction
        const tx = await contract.buyTokens({ value: value });

        buyBtn.textContent = 'Confirming...';

        // Wait for Receipt
        const receipt = await tx.wait();

        if (receipt.status === 1) {
            alert('Transaction Successful! Welcome to NEURALY.');
            // Update local UI (In real app, listen to events)
            PRESALE_CONFIG.raised += amountFloat;
            updateProgress();
        } else {
            alert('Transaction Failed!');
        }

    } catch (error) {
        console.error("Buy error:", error);

        if (error.code === 4001) {
            alert('Transaction Rejected by User');
        } else {
            alert('Transaction Failed: ' + (error.reason || error.message));
        }

    } finally {
        buyBtn.textContent = 'Buy NEURALY';
        buyBtn.disabled = false;
    }
}

// Auto-init if script loaded
document.addEventListener('DOMContentLoaded', initPresale);
