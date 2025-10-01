# Aeturnum - Trustless Digital Dead Man's Switch

A Bitcoin-based dead man's switch that uses **nLockTime** and **Ordinal inscriptions** to securely store and automatically release encrypted data to designated heirs.

## 🔥 What is Aeturnum?

Aeturnum is a trustless protocol that allows you to:
- Store encrypted messages or recovery phrases on Bitcoin
- Automatically release them to heirs if you fail to "check in"
- Maintain complete sovereignty—no centralized backend holds your secrets
- Use Bitcoin's native features for time-locking and immutable storage

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  • Vault Creation Wizard                                     │
│  • Client-side AES-256-GCM Encryption                       │
│  • Wallet Integration (Leather/PSBT)                        │
│  • Heartbeat Reset UI                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend (Node.js + Express)                   │
│  • Time-locked Transaction Builder                          │
│  • Ordinal Inscription Formatter                            │
│  • Bitcoin Network Interface                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Bitcoin Network                            │
│  • nLockTime Transactions                                    │
│  • Ordinal Inscriptions                                      │
│  • Signet/Testnet for Development                           │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Bitcoin wallet (Leather recommended, or private key for testing)

### Installation

```bash
# Install dependencies
npm install

# Start development server (frontend + backend)
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 📖 How It Works

### 1. Create a Vault
1. Enter your secret message or upload a file (<1 KB)
2. Set a strong password (used for encryption)
3. Add 1-3 heir Bitcoin addresses
4. Choose lock time (30, 90, or 365 days)
5. System encrypts data client-side with AES-256-GCM

### 2. Generate Time-Locked Transaction
- Backend creates a Bitcoin transaction with:
  - **Ordinal inscription** containing encrypted data
  - **nLockTime** set to your chosen deadline
  - Output to heir address(es)
- Returns unsigned transaction to you

### 3. Sign & Broadcast (Heartbeat)
- Sign the transaction with your Bitcoin wallet
- Broadcast to Bitcoin network
- Transaction won't confirm until nLockTime expires
- To "reset" the timer, create a new vault with later deadline

### 4. Inheritance (Automatic)
- If you don't reset before deadline, transaction confirms
- Heirs receive BTC + see Ordinal inscription
- They download encrypted blob from Ordinals explorer
- Decrypt locally with password you shared separately

## 🔐 Security Model

### What's Secure
✅ **Client-side encryption** - Password never leaves your browser  
✅ **Trustless execution** - Bitcoin enforces time-locks automatically  
✅ **Immutable storage** - Ordinals can't be censored or deleted  
✅ **No central authority** - Backend never sees plaintext  

### Limitations
⚠️ **Password sharing** - Heirs need the password (share securely offline)  
⚠️ **Single point of failure** - If you lose password, data is unrecoverable  
⚠️ **Network fees** - Bitcoin transaction fees apply  
⚠️ **No automated reminders** - You must manually reset timer  

## 🛠️ Technical Details

### Encryption
- Algorithm: AES-256-GCM
- Key derivation: PBKDF2 with 100,000 iterations
- IV: Randomly generated per encryption
- Format: `iv:salt:ciphertext` (all base64)

### Bitcoin Transaction Structure
```
Transaction:
├── Input: Your funded UTXO
├── Output 1: Ordinal inscription (encrypted data)
├── Output 2: Heir address (546 sats minimum)
└── nLockTime: Future timestamp/block height
```

### Ordinal Inscription Format
```
OP_FALSE
OP_IF
  OP_PUSH "ord"
  OP_PUSH 1
  OP_PUSH "text/plain;charset=utf-8"
  OP_PUSH 0
  OP_PUSH <encrypted_data>
OP_ENDIF
```

## 🧪 Testing

### Using Signet (Recommended)
```bash
# Get signet coins from faucet
# https://signetfaucet.com

# Create a test vault
# Use signet addresses for heirs
# Broadcast to signet network
```

### Verify Inscription
```bash
# Use ord CLI
ord wallet inscriptions

# Or check explorer
# https://signet.ordinals.com
```

### Test Decryption
```javascript
// In browser console
const encrypted = "iv:salt:ciphertext";
const password = "your-password";
// Use the decrypt function from utils/crypto.js
```

## 📁 Project Structure

```
aeturnum/
├── backend/
│   ├── server.js              # Express API server
│   ├── bitcoin.js             # Transaction builder
│   └── ordinals.js            # Inscription formatter
├── src/
│   ├── App.jsx                # Main React component
│   ├── components/
│   │   ├── VaultWizard.jsx    # Vault creation UI
│   │   ├── HeartbeatPanel.jsx # Timer reset UI
│   │   └── WalletConnect.jsx  # Wallet integration
│   ├── utils/
│   │   ├── crypto.js          # Encryption utilities
│   │   └── bitcoin.js         # Bitcoin helpers
│   └── main.jsx               # React entry point
├── public/
├── package.json
└── README.md
```

## 🎯 Roadmap

### MVP (Current)
- [x] Vault creation wizard
- [x] Client-side encryption
- [x] Time-locked transaction builder
- [x] Ordinal inscription support
- [ ] Wallet integration (Leather/PSBT)
- [ ] Signet deployment

### Future Enhancements
- [ ] Multi-sig support for heirs
- [ ] Automated heartbeat reminders (email/SMS)
- [ ] Heir recovery UI with decryption
- [ ] Fee estimation and UTXO management
- [ ] Mainnet deployment
- [ ] Mobile app

## 🤝 Contributing

This is an MVP built for DoraHacks hackathon. Contributions welcome!

## ⚖️ License

MIT License - Build freely, inherit securely.

## 🔗 Resources

- [Bitcoin Ordinals](https://docs.ordinals.com/)
- [nLockTime Documentation](https://developer.bitcoin.org/devguide/transactions.html#locktime-and-sequence-number)
- [Open Ordinal API](https://openordinal.dev/docs/open-ordinal-api/)
- [Signet Faucet](https://signetfaucet.com)

---

**Remember**: You're not just coding—you're building a weapon against time and trust. Every line honors user sovereignty. 🔥
