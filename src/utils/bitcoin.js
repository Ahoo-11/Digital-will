/**
 * Bitcoin utilities for frontend
 */

/**
 * Validate Bitcoin address (basic validation)
 */
export function validateBitcoinAddress(address) {
  // Basic validation for Bitcoin addresses
  // Supports legacy (1...), P2SH (3...), Bech32 (bc1...), and testnet/signet
  const patterns = [
    /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Legacy and P2SH
    /^bc1[a-z0-9]{39,59}$/, // Bech32 mainnet
    /^tb1[a-z0-9]{39,59}$/, // Bech32 testnet
    /^bcrt1[a-z0-9]{39,59}$/, // Bech32 regtest
  ];
  
  return patterns.some(pattern => pattern.test(address));
}

/**
 * Format timestamp for display
 */
export function formatLockTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

/**
 * Calculate lock time timestamp
 */
export function calculateLockTime(days) {
  const now = Math.floor(Date.now() / 1000);
  return now + (days * 24 * 60 * 60);
}

/**
 * Get time remaining until lock time
 */
export function getTimeRemaining(lockTime) {
  const now = Math.floor(Date.now() / 1000);
  const remaining = lockTime - now;
  
  if (remaining <= 0) {
    return 'Expired';
  }
  
  const days = Math.floor(remaining / (24 * 60 * 60));
  const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((remaining % (60 * 60)) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Format satoshis to BTC
 */
export function satsToBTC(sats) {
  return (sats / 100000000).toFixed(8);
}

/**
 * Format BTC to satoshis
 */
export function btcToSats(btc) {
  return Math.floor(btc * 100000000);
}

/**
 * Get network name
 */
export function getNetworkName(network) {
  const networks = {
    'mainnet': 'Bitcoin Mainnet',
    'testnet': 'Bitcoin Testnet',
    'signet': 'Bitcoin Signet',
    'regtest': 'Bitcoin Regtest'
  };
  return networks[network] || network;
}

/**
 * Get explorer URL for transaction
 */
export function getExplorerUrl(txid, network = 'signet') {
  const explorers = {
    'mainnet': `https://mempool.space/tx/${txid}`,
    'testnet': `https://mempool.space/testnet/tx/${txid}`,
    'signet': `https://mempool.space/signet/tx/${txid}`,
  };
  return explorers[network] || explorers.signet;
}

/**
 * Get ordinals explorer URL
 */
export function getOrdinalsExplorerUrl(inscriptionId, network = 'signet') {
  const explorers = {
    'mainnet': `https://ordinals.com/inscription/${inscriptionId}`,
    'testnet': `https://ordinals.com/inscription/${inscriptionId}`,
    'signet': `https://signet.ordinals.com/inscription/${inscriptionId}`,
  };
  return explorers[network] || explorers.signet;
}

/**
 * Truncate address for display
 */
export function truncateAddress(address, startChars = 8, endChars = 6) {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}

/**
 * Download text as file
 */
export function downloadAsFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read file as text
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

/**
 * Validate file size
 */
export function validateFileSize(file, maxSizeKB = 1) {
  const maxBytes = maxSizeKB * 1024;
  return file.size <= maxBytes;
}
