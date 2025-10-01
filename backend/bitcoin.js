import * as bitcoin from 'bitcoinjs-lib';
import axios from 'axios';

// Network configurations
const NETWORKS = {
  mainnet: bitcoin.networks.bitcoin,
  testnet: bitcoin.networks.testnet,
  signet: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'tb',
    bip32: {
      public: 0x043587cf,
      private: 0x04358394,
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
  },
  regtest: bitcoin.networks.regtest
};

// API endpoints for different networks
const API_ENDPOINTS = {
  mainnet: 'https://blockstream.info/api',
  testnet: 'https://blockstream.info/testnet/api',
  signet: 'https://mempool.space/signet/api',
};

/**
 * Get UTXOs for an address
 */
export async function getUTXOs(address, network = 'signet') {
  try {
    const apiUrl = API_ENDPOINTS[network];
    const response = await axios.get(`${apiUrl}/address/${address}/utxo`);
    
    return response.data.map(utxo => ({
      txid: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
      status: utxo.status
    }));
  } catch (error) {
    console.error('Error fetching UTXOs:', error.message);
    throw new Error(`Failed to fetch UTXOs: ${error.message}`);
  }
}

/**
 * Get transaction hex
 */
export async function getTransactionHex(txid, network = 'signet') {
  try {
    const apiUrl = API_ENDPOINTS[network];
    const response = await axios.get(`${apiUrl}/tx/${txid}/hex`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction hex:', error.message);
    throw new Error(`Failed to fetch transaction: ${error.message}`);
  }
}

/**
 * Build a time-locked transaction with Ordinal inscription
 */
export async function buildTimeLockedTransaction({
  utxos,
  heirAddresses,
  lockTime,
  inscriptionScript,
  fundingAddress,
  network = 'signet'
}) {
  try {
    const networkConfig = NETWORKS[network];
    const psbt = new bitcoin.Psbt({ network: networkConfig });
    
    // Set locktime
    psbt.setLocktime(lockTime);
    
    // Calculate total input value
    let totalInput = 0;
    
    // Add inputs from UTXOs
    for (const utxo of utxos) {
      const txHex = await getTransactionHex(utxo.txid, network);
      
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        nonWitnessUtxo: Buffer.from(txHex, 'hex'),
        sequence: 0xfffffffe // Enable nLockTime
      });
      
      totalInput += utxo.value;
    }
    
    // Output 1: Ordinal inscription (OP_RETURN or Taproot)
    // For simplicity, we'll use OP_RETURN for the inscription
    // In production, use proper Ordinal inscription format with Taproot
    psbt.addOutput({
      script: inscriptionScript,
      value: 0 // OP_RETURN outputs have 0 value
    });
    
    // Output 2: Send to first heir (or split among heirs)
    // Minimum dust limit
    const dustLimit = 546;
    const estimatedFee = 1000; // Rough estimate, should calculate properly
    
    const valuePerHeir = Math.floor((totalInput - estimatedFee) / heirAddresses.length);
    
    if (valuePerHeir < dustLimit) {
      throw new Error(`Insufficient funds. Need at least ${dustLimit * heirAddresses.length + estimatedFee} sats`);
    }
    
    // Add outputs for each heir
    for (const heirAddress of heirAddresses) {
      psbt.addOutput({
        address: heirAddress,
        value: valuePerHeir
      });
    }
    
    // Calculate actual fee
    const estimatedSize = psbt.data.inputs.length * 148 + psbt.data.outputs.length * 34 + 10;
    const fee = Math.ceil(estimatedSize * 2); // 2 sat/vbyte
    
    // Adjust last output to account for fee
    const lastOutputIndex = psbt.data.outputs.length - 1;
    psbt.data.outputs[lastOutputIndex].value = valuePerHeir - fee;
    
    // Extract transaction hex (unsigned)
    const tx = psbt.__CACHE.__TX;
    const txHex = tx.toHex();
    const txid = tx.getId();
    
    return {
      hex: txHex,
      txid: txid,
      psbt: psbt.toBase64(),
      size: tx.byteLength(),
      vsize: tx.virtualSize(),
      weight: tx.weight(),
      lockTime: lockTime,
      fee: fee,
      inputs: psbt.data.inputs.length,
      outputs: psbt.data.outputs.length
    };
    
  } catch (error) {
    console.error('Error building transaction:', error);
    throw error;
  }
}

/**
 * Broadcast a signed transaction
 */
export async function broadcastTransaction(txHex, network = 'signet') {
  try {
    const apiUrl = API_ENDPOINTS[network];
    const response = await axios.post(`${apiUrl}/tx`, txHex, {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error broadcasting transaction:', error.message);
    if (error.response) {
      throw new Error(`Broadcast failed: ${error.response.data}`);
    }
    throw new Error(`Failed to broadcast transaction: ${error.message}`);
  }
}

/**
 * Estimate transaction fee
 */
export async function estimateFee(network = 'signet') {
  try {
    const apiUrl = API_ENDPOINTS[network];
    const response = await axios.get(`${apiUrl}/fee-estimates`);
    
    // Get fee for next block (fastest)
    const feeRate = response.data['1'] || 2; // Default to 2 sat/vbyte
    
    return Math.ceil(feeRate);
  } catch (error) {
    console.error('Error estimating fee:', error.message);
    return 2; // Default fallback
  }
}

/**
 * Get address balance
 */
export async function getAddressBalance(address, network = 'signet') {
  try {
    const apiUrl = API_ENDPOINTS[network];
    const response = await axios.get(`${apiUrl}/address/${address}`);
    
    return {
      confirmed: response.data.chain_stats.funded_txo_sum - response.data.chain_stats.spent_txo_sum,
      unconfirmed: response.data.mempool_stats.funded_txo_sum - response.data.mempool_stats.spent_txo_sum,
      total: (response.data.chain_stats.funded_txo_sum - response.data.chain_stats.spent_txo_sum) +
             (response.data.mempool_stats.funded_txo_sum - response.data.mempool_stats.spent_txo_sum)
    };
  } catch (error) {
    console.error('Error fetching balance:', error.message);
    throw new Error(`Failed to fetch balance: ${error.message}`);
  }
}
