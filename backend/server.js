import express from 'express';
import cors from 'cors';
import { buildTimeLockedTransaction, broadcastTransaction, getUTXOs } from './bitcoin.js';
import { createOrdinalInscription } from './ordinals.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Aeturnum API is running' });
});

/**
 * Create a time-locked transaction with Ordinal inscription
 * POST /api/vault/create
 * Body: {
 *   encryptedData: string,
 *   heirAddresses: string[],
 *   lockTime: number (unix timestamp),
 *   fundingAddress: string,
 *   network: 'signet' | 'testnet' | 'mainnet'
 * }
 */
app.post('/api/vault/create', async (req, res) => {
  try {
    const { encryptedData, heirAddresses, lockTime, fundingAddress, network = 'signet' } = req.body;
    
    // Validation
    if (!encryptedData || !heirAddresses || !lockTime || !fundingAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['encryptedData', 'heirAddresses', 'lockTime', 'fundingAddress']
      });
    }
    
    if (!Array.isArray(heirAddresses) || heirAddresses.length === 0 || heirAddresses.length > 3) {
      return res.status(400).json({ 
        error: 'heirAddresses must be an array with 1-3 addresses'
      });
    }
    
    // Check if lock time is in the future
    const now = Math.floor(Date.now() / 1000);
    if (lockTime <= now) {
      return res.status(400).json({ 
        error: 'lockTime must be in the future'
      });
    }
    
    // Get UTXOs for funding address
    console.log(`Fetching UTXOs for ${fundingAddress} on ${network}...`);
    const utxos = await getUTXOs(fundingAddress, network);
    
    if (!utxos || utxos.length === 0) {
      return res.status(400).json({ 
        error: 'No UTXOs found for funding address. Please fund the address first.',
        fundingAddress,
        network
      });
    }
    
    console.log(`Found ${utxos.length} UTXOs`);
    
    // Create Ordinal inscription script
    const inscriptionScript = createOrdinalInscription(encryptedData);
    
    // Build time-locked transaction
    const transaction = await buildTimeLockedTransaction({
      utxos,
      heirAddresses,
      lockTime,
      inscriptionScript,
      fundingAddress,
      network
    });
    
    res.json({
      success: true,
      transaction: {
        hex: transaction.hex,
        txid: transaction.txid,
        size: transaction.size,
        vsize: transaction.vsize,
        weight: transaction.weight,
        lockTime: transaction.lockTime,
        fee: transaction.fee
      },
      inscription: {
        size: encryptedData.length,
        type: 'text/plain;charset=utf-8'
      },
      heirs: heirAddresses,
      network
    });
    
  } catch (error) {
    console.error('Error creating vault:', error);
    res.status(500).json({ 
      error: 'Failed to create vault transaction',
      message: error.message,
      details: error.stack
    });
  }
});

/**
 * Broadcast a signed transaction
 * POST /api/vault/broadcast
 * Body: {
 *   signedTxHex: string,
 *   network: 'signet' | 'testnet' | 'mainnet'
 * }
 */
app.post('/api/vault/broadcast', async (req, res) => {
  try {
    const { signedTxHex, network = 'signet' } = req.body;
    
    if (!signedTxHex) {
      return res.status(400).json({ 
        error: 'Missing signedTxHex'
      });
    }
    
    console.log(`Broadcasting transaction on ${network}...`);
    const txid = await broadcastTransaction(signedTxHex, network);
    
    res.json({
      success: true,
      txid,
      network,
      explorerUrl: getExplorerUrl(txid, network)
    });
    
  } catch (error) {
    console.error('Error broadcasting transaction:', error);
    res.status(500).json({ 
      error: 'Failed to broadcast transaction',
      message: error.message
    });
  }
});

/**
 * Get UTXOs for an address
 * GET /api/address/:address/utxos?network=signet
 */
app.get('/api/address/:address/utxos', async (req, res) => {
  try {
    const { address } = req.params;
    const { network = 'signet' } = req.query;
    
    const utxos = await getUTXOs(address, network);
    
    res.json({
      success: true,
      address,
      network,
      utxos,
      count: utxos.length,
      totalValue: utxos.reduce((sum, utxo) => sum + utxo.value, 0)
    });
    
  } catch (error) {
    console.error('Error fetching UTXOs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch UTXOs',
      message: error.message
    });
  }
});

/**
 * Get network info
 * GET /api/network/:network/info
 */
app.get('/api/network/:network/info', async (req, res) => {
  try {
    const { network } = req.params;
    
    const networkInfo = {
      signet: {
        name: 'Bitcoin Signet',
        faucet: 'https://signetfaucet.com',
        explorer: 'https://mempool.space/signet',
        ordinalsExplorer: 'https://signet.ordinals.com'
      },
      testnet: {
        name: 'Bitcoin Testnet',
        faucet: 'https://testnet-faucet.mempool.co',
        explorer: 'https://mempool.space/testnet',
        ordinalsExplorer: 'https://testnet.ordinals.com'
      },
      mainnet: {
        name: 'Bitcoin Mainnet',
        faucet: null,
        explorer: 'https://mempool.space',
        ordinalsExplorer: 'https://ordinals.com'
      }
    };
    
    res.json({
      success: true,
      network: networkInfo[network] || networkInfo.signet
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get network info',
      message: error.message
    });
  }
});

function getExplorerUrl(txid, network) {
  const explorers = {
    'mainnet': `https://mempool.space/tx/${txid}`,
    'testnet': `https://mempool.space/testnet/tx/${txid}`,
    'signet': `https://mempool.space/signet/tx/${txid}`,
  };
  return explorers[network] || explorers.signet;
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔥 Aeturnum API server running on http://localhost:${PORT}`);
  console.log(`📡 Network: Signet (default)`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
