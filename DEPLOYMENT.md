# Deployment Guide for Aeturnum

## Prerequisites

1. **Node.js 18+** installed
2. **Bitcoin Signet wallet** with some test coins
3. **Git** for version control

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Servers

```bash
# Start both frontend and backend
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### 3. Get Signet Test Coins

Visit https://signetfaucet.com and send some coins to your test address.

## Testing the Application

### Step 1: Create a Vault

1. Navigate to http://localhost:5173
2. Click "Create Your Vault"
3. Enter a test message (e.g., "This is my secret recovery phrase")
4. Set a strong password (save it!)
5. Add 1-3 signet addresses as heirs
6. Choose a lock time (30 days recommended for testing)
7. Complete the wizard

### Step 2: Build Transaction

1. Enter your funded signet address
2. Wait for UTXO detection
3. Click "Build Transaction"
4. Review transaction details

### Step 3: Sign & Broadcast

For MVP testing:
- Click "Sign & Broadcast (Demo)" for simulation
- For real testing, copy the transaction hex and sign with:
  - Leather wallet
  - Sparrow wallet
  - Bitcoin Core CLI

### Step 4: Verify on Explorer

Check your transaction on:
- https://mempool.space/signet
- https://signet.ordinals.com

## Production Deployment

### Frontend (Vercel/Netlify)

```bash
# Build frontend
npm run build

# Deploy to Vercel
vercel deploy

# Or Netlify
netlify deploy --prod
```

### Backend (Railway/Render)

1. Push code to GitHub
2. Connect to Railway/Render
3. Set environment variables:
   - `PORT=3001`
   - `NODE_ENV=production`
4. Deploy

### Environment Variables

Create `.env` file:

```env
# Backend
PORT=3001
NODE_ENV=development
NETWORK=signet

# Frontend (optional)
VITE_API_URL=http://localhost:3001
```

## Bitcoin Network Configuration

### Signet (Testing - Recommended)
- Faucet: https://signetfaucet.com
- Explorer: https://mempool.space/signet
- Ordinals: https://signet.ordinals.com

### Testnet (Alternative Testing)
- Faucet: https://testnet-faucet.mempool.co
- Explorer: https://mempool.space/testnet

### Mainnet (Production - Use with Caution)
- ⚠️ Real Bitcoin required
- ⚠️ Thoroughly test on Signet first
- ⚠️ Audit code before mainnet use

## Troubleshooting

### No UTXOs Found
- Ensure address is funded
- Wait for 1 confirmation
- Check network (signet/testnet/mainnet)

### Transaction Build Fails
- Check UTXO availability
- Ensure sufficient balance (>2000 sats)
- Verify heir addresses are valid

### Broadcast Fails
- Transaction may be too large
- Fee may be too low
- Check network connectivity

## Security Checklist

- [ ] Test encryption/decryption locally
- [ ] Verify password strength requirements
- [ ] Test on Signet before mainnet
- [ ] Backup vault recovery phrases
- [ ] Share passwords with heirs securely
- [ ] Document inheritance process
- [ ] Test heir recovery flow

## API Endpoints

### Health Check
```bash
GET /api/health
```

### Create Vault Transaction
```bash
POST /api/vault/create
Content-Type: application/json

{
  "encryptedData": "base64_encrypted_data",
  "heirAddresses": ["tb1q..."],
  "lockTime": 1234567890,
  "fundingAddress": "tb1q...",
  "network": "signet"
}
```

### Broadcast Transaction
```bash
POST /api/vault/broadcast
Content-Type: application/json

{
  "signedTxHex": "hex_string",
  "network": "signet"
}
```

### Get UTXOs
```bash
GET /api/address/:address/utxos?network=signet
```

## Monitoring

### Check Transaction Status
```bash
curl https://mempool.space/signet/api/tx/:txid
```

### Check Address Balance
```bash
curl https://mempool.space/signet/api/address/:address
```

## Backup & Recovery

### Backup Vault Data
Save the following information securely:
1. Vault ID
2. Password (encrypted storage recommended)
3. Transaction hex
4. Heir addresses
5. Lock time

### Recovery Process for Heirs
1. Wait for lock time to expire
2. Check Bitcoin address for incoming transaction
3. Find Ordinal inscription on explorer
4. Download encrypted data
5. Decrypt using password (shared separately)

## Performance Optimization

### Frontend
- Enable code splitting
- Optimize bundle size
- Use CDN for static assets
- Enable gzip compression

### Backend
- Implement caching for UTXO queries
- Rate limit API endpoints
- Use connection pooling
- Monitor API response times

## Scaling Considerations

### Database (Future Enhancement)
- Store vault metadata
- Track transaction status
- Index inscriptions
- User authentication

### Queue System (Future Enhancement)
- Background transaction building
- Scheduled heartbeat reminders
- Email notifications

## License

MIT License - See LICENSE file

## Support

For issues and questions:
- GitHub Issues: [repository_url]
- Documentation: README.md
- Bitcoin Signet: https://en.bitcoin.it/wiki/Signet

---

**Remember**: This is an MVP. Always test thoroughly before using with real Bitcoin!
