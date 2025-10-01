# Quick Start Guide - Aeturnum

Get your digital dead man's switch running in 5 minutes!

## 🚀 Installation

```bash
# 1. Install dependencies
npm install

# 2. Start the app
npm run dev
```

The app will open at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## 💰 Get Test Coins

Before creating a vault, you need Signet test coins:

1. Generate a Signet address (use any Bitcoin wallet that supports Signet)
2. Visit https://signetfaucet.com
3. Enter your address and request coins
4. Wait ~10 minutes for confirmation

## 📝 Create Your First Vault

### Step 1: Enter Your Message
```
Example: "My Bitcoin seed phrase: abandon abandon abandon..."
```
- Max 1 KB (about 1000 characters)
- Can upload a .txt file instead

### Step 2: Set Password
```
Example: MySecureP@ssw0rd2024!
```
- Minimum 12 characters
- Must include: uppercase, lowercase, numbers, special chars
- **SAVE THIS PASSWORD** - you cannot recover it!

### Step 3: Add Heir Addresses
```
Example Signet addresses:
tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx
tb1q9pvjqz5u5sdgpatg3wn0ce438u5cyv85lly0pc
```
- Add 1-3 Bitcoin addresses
- These will receive your encrypted data
- Use Signet addresses for testing

### Step 4: Choose Lock Time
- **30 days** - Short test period
- **90 days** - Medium term
- **365 days** - Long term

### Step 5: Save Recovery Info
```
Vault ID: 550e8400-e29b-41d4-a716-446655440000
Password: MySecureP@ssw0rd2024!
```
- Copy this information
- Store it securely
- Share password with heirs (offline!)

## 🔨 Build & Broadcast Transaction

### Step 1: Enter Funding Address
```
Your funded Signet address:
tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx
```
- Must have at least 2000 sats
- Will be used to pay transaction fees

### Step 2: Build Transaction
- Click "Build Transaction"
- Wait for transaction to be created
- Review transaction details

### Step 3: Sign & Broadcast

**Option A: Demo Mode (Testing)**
- Click "Sign & Broadcast (Demo)"
- Simulates the broadcast process

**Option B: Real Signing (Recommended)**

Using Sparrow Wallet:
1. Copy transaction hex
2. Open Sparrow → Tools → Sign/Verify
3. Paste hex and sign
4. Broadcast signed transaction

Using Bitcoin Core:
```bash
bitcoin-cli -signet signrawtransactionwithwallet <hex>
bitcoin-cli -signet sendrawtransaction <signed_hex>
```

## 🔍 Verify Your Vault

### Check Transaction
```
https://mempool.space/signet/tx/YOUR_TXID
```

### Check Ordinal Inscription
```
https://signet.ordinals.com/inscription/YOUR_INSCRIPTION_ID
```

## 👥 Heir Recovery Process

When the lock time expires, your heirs can recover the data:

### Step 1: Check Bitcoin Address
Heirs monitor their Bitcoin address for incoming transactions.

### Step 2: Find Inscription
1. Go to https://signet.ordinals.com
2. Search for the transaction
3. Find the Ordinal inscription

### Step 3: Download Encrypted Data
Copy the encrypted data from the inscription.

### Step 4: Decrypt Locally
```javascript
// Use the decrypt function from the app
const encrypted = "iv:salt:ciphertext";
const password = "MySecureP@ssw0rd2024!";
// Decrypt to get original message
```

Or use the web app's decryption tool (coming soon).

## ⏰ Reset Timer (Heartbeat)

To prove you're still alive and reset the timer:

1. Create a new vault with the same heirs
2. Set a new lock time (further in the future)
3. Broadcast the new transaction
4. The old transaction becomes invalid

## 🧪 Testing Checklist

- [ ] Create vault with test message
- [ ] Verify password strength
- [ ] Add valid Signet addresses
- [ ] Fund address with test coins
- [ ] Build transaction successfully
- [ ] Sign and broadcast transaction
- [ ] Verify on block explorer
- [ ] Check Ordinal inscription
- [ ] Test decryption with password
- [ ] Share recovery info with test heir

## 🐛 Common Issues

### "No UTXOs found"
**Solution**: Fund your address with Signet coins from the faucet.

### "Invalid Bitcoin address"
**Solution**: Use Signet addresses (starting with `tb1q...`).

### "Transaction build failed"
**Solution**: Ensure you have at least 2000 sats in your funding address.

### "Password too weak"
**Solution**: Use at least 12 characters with mixed case, numbers, and symbols.

### "File too large"
**Solution**: Keep messages under 1 KB (1024 characters).

## 📚 Next Steps

1. **Test the full flow** on Signet
2. **Document your process** for heirs
3. **Share password securely** (offline, encrypted)
4. **Set calendar reminders** to reset timer
5. **Create backup vaults** for redundancy

## 🔐 Security Best Practices

1. **Never share password online**
2. **Use strong, unique passwords**
3. **Test on Signet before mainnet**
4. **Backup vault recovery info**
5. **Educate heirs on recovery process**
6. **Use hardware wallets for signing**
7. **Verify all addresses carefully**

## 💡 Pro Tips

- **Split secrets**: Don't put all info in one vault
- **Multiple heirs**: Add 2-3 heirs for redundancy
- **Test recovery**: Do a dry run with heirs
- **Document process**: Write clear instructions
- **Regular resets**: Set reminders to reset timer
- **Backup everything**: Save all vault data offline

## 🆘 Need Help?

- **Documentation**: See README.md
- **Deployment**: See DEPLOYMENT.md
- **API Reference**: See backend/server.js
- **Bitcoin Signet**: https://en.bitcoin.it/wiki/Signet
- **Ordinals**: https://docs.ordinals.com

## ⚠️ Important Warnings

- **This is an MVP** - test thoroughly before real use
- **Password cannot be recovered** - save it securely
- **Heirs need the password** - share it separately
- **Transaction fees apply** - ensure sufficient funds
- **No automated reminders** - set your own reminders

---

**Ready to build your digital legacy? Start now!** 🔥

```bash
npm run dev
```

Then open http://localhost:5173 and create your first vault!
