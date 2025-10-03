import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { buildTimeLockedTransaction, broadcastTransaction, getUTXOs } from './bitcoin.js';
import { createOrdinalInscription } from './ordinals.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false
    }
  });
} else {
  console.warn('⚠️ Supabase environment variables not fully configured. Backend persistence disabled.');
}

async function authenticateRequest(req, res) {
  if (!supabaseAdmin) {
    res.status(500).json({ error: 'Supabase not configured on server' });
    return null;
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Missing Bearer authorization token' });
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: 'Invalid or expired authorization token' });
    return null;
  }

  return data.user;
}

const withAuth = (handler) => async (req, res) => {
  const user = await authenticateRequest(req, res);
  if (!user) return;
  return handler(req, res, user);
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Aeturnum API is running' });
});

/**
 * Create a time-locked transaction with Ordinal inscription
 * POST /api/vault/create
 * Body: {
 *   encryptedData: string,
 *   lockTime: number (unix timestamp),
 *   fundingAddress: string,
 *   network: 'signet' | 'testnet' | 'mainnet'
 * }
 */
app.post('/api/vault/create', withAuth(async (req, res, user) => {
  try {
    const {
      vaultId,
      encryptedData,
      heirAddresses,
      lockTime,
      fundingAddress,
      network = 'signet'
    } = req.body;

    // Validation
    if (!vaultId || !encryptedData || !heirAddresses || !lockTime || !fundingAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['vaultId', 'encryptedData', 'heirAddresses', 'lockTime', 'fundingAddress']
      });
    }

    if (!Array.isArray(heirAddresses) || heirAddresses.length === 0 || heirAddresses.length > 3) {
      return res.status(400).json({ 
        error: 'heirAddresses must be an array with 1-3 addresses'
      });
    }

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

    if (supabaseAdmin) {
      try {
        const lockTimeIso = new Date(lockTime * 1000).toISOString();
        const upsertPayload = {
          owner_id: user.id,
          vault_id: vaultId,
          encrypted_payload: encryptedData,
          lock_time: lockTimeIso,
          lock_days: Math.round((lockTime - Math.floor(Date.now() / 1000)) / (24 * 60 * 60)),
          heirs: heirAddresses,
          network,
          status: 'built',
          metadata: {
            transaction,
            inscription: {
              size: encryptedData.length,
              type: 'text/plain;charset=utf-8'
            }
          }
        };

        const { data: existing, error: fetchError } = await supabaseAdmin
          .from('digitalwill_vaults')
          .select('owner_id')
          .eq('vault_id', vaultId)
          .maybeSingle();

        if (fetchError) {
          console.error('Failed to fetch existing vault prior to update:', fetchError);
        } else if (existing && existing.owner_id !== user.id) {
          return res.status(403).json({ error: 'You are not authorized to modify this vault' });
        }

        const { error: upsertError } = await supabaseAdmin
          .from('digitalwill_vaults')
          .upsert(upsertPayload, { onConflict: 'vault_id' });

        if (upsertError) {
          console.error('Failed to persist vault metadata to Supabase:', upsertError);
        }
      } catch (persistError) {
        console.error('Unexpected error while syncing vault metadata:', persistError);
      }
    }

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
      network,
      vaultId
    });
    
  } catch (error) {
    console.error('Error creating vault:', error);
    res.status(500).json({ 
      error: 'Failed to create vault transaction',
      message: error.message,
      details: error.stack
    });
  }
}));

/**
 * Broadcast a signed transaction
 * POST /api/vault/broadcast
 * Body: {
 *   signedTxHex: string,
 *   network: 'signet' | 'testnet' | 'mainnet'
 * }
 */
app.post('/api/vault/broadcast', withAuth(async (req, res) => {
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
}));

/**
 * Get UTXOs for an address
 * GET /api/address/:address/utxos?network=signet
 */
app.get('/api/address/:address/utxos', withAuth(async (req, res) => {
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
}));

app.get('/api/vaults', withAuth(async (_req, res, user) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured on server' });
    }

    const { data, error } = await supabaseAdmin
      .from('digitalwill_vaults')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to list vaults:', error);
      return res.status(500).json({ error: 'Failed to list vaults' });
    }

    return res.json({ success: true, vaults: data });
  } catch (error) {
    console.error('Unexpected error listing vaults:', error);
    return res.status(500).json({ error: 'Unexpected error listing vaults' });
  }
}));

app.patch('/api/vaults/:vaultId', withAuth(async (req, res, user) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured on server' });
    }

    const { vaultId } = req.params;
    const { status, lockTime, metadata } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (lockTime) updates.lock_time = new Date(lockTime * 1000).toISOString();
    if (metadata) updates.metadata = metadata;

    const { error } = await supabaseAdmin
      .from('digitalwill_vaults')
      .update(updates)
      .eq('vault_id', vaultId)
      .eq('owner_id', user.id);

    if (error) {
      console.error('Failed to update vault:', error);
      return res.status(500).json({ error: 'Failed to update vault metadata' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Unexpected error updating vault:', error);
    return res.status(500).json({ error: 'Unexpected error updating vault' });
  }
}));

app.delete('/api/vaults/:vaultId', withAuth(async (req, res, user) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured on server' });
    }

    const { vaultId } = req.params;
    const { error } = await supabaseAdmin
      .from('digitalwill_vaults')
      .delete()
      .eq('vault_id', vaultId)
      .eq('owner_id', user.id);

    if (error) {
      console.error('Failed to delete vault:', error);
      return res.status(500).json({ error: 'Failed to delete vault' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Unexpected error deleting vault:', error);
    return res.status(500).json({ error: 'Unexpected error deleting vault' });
  }
}));

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
