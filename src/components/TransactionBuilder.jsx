import { useState, useEffect } from 'react';
import { Send, Loader, CheckCircle, AlertCircle, ExternalLink, Copy, Wallet } from 'lucide-react';
import { formatLockTime, getExplorerUrl, getOrdinalsExplorerUrl, truncateAddress, copyToClipboard, downloadAsFile } from '../utils/bitcoin';
import axios from 'axios';

const API_BASE_URL = '/api';

export default function TransactionBuilder({ vaultData, authToken, onVaultUpdated }) {
  const [fundingAddress, setFundingAddress] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [error, setError] = useState(null);
  const [utxos, setUtxos] = useState(null);

  const buildTransaction = async () => {
    if (!fundingAddress) {
      setError('Please enter a funding address');
      return;
    }

    if (!authToken) {
      setError('Authentication required. Please sign in again.');
      return;
    }

    setIsBuilding(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/vault/create`,
        {
          vaultId: vaultData.vaultId,
          encryptedData: vaultData.encryptedData,
          heirAddresses: vaultData.heirAddresses,
          lockTime: vaultData.lockTime,
          fundingAddress: fundingAddress,
          network: vaultData.network
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      setTransaction(response.data.transaction);

      if (onVaultUpdated) {
        try {
          await onVaultUpdated(vaultData.vaultId, {
            status: 'built',
            lockTime: response.data.transaction?.lockTime,
            metadata: {
              transaction: response.data.transaction,
              inscription: response.data.inscription || null
            }
          });
        } catch (updateError) {
          console.error('Failed to update vault record:', updateError);
        }
      }
    } catch (err) {
      console.error('Error building transaction:', err);
      setError(err.response?.data?.error || 'Failed to build transaction');
    } finally {
      setIsBuilding(false);
    }
  };

  const checkUTXOs = async () => {
    if (!fundingAddress) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/address/${fundingAddress}/utxos?network=${vaultData.network}`,
        {
          headers: authToken
            ? {
                Authorization: `Bearer ${authToken}`
              }
            : undefined
        }
      );
      setUtxos(response.data);
    } catch (err) {
      console.error('Error checking UTXOs:', err);
    }
  };

  useEffect(() => {
    if (fundingAddress) {
      const timer = setTimeout(checkUTXOs, 500);
      return () => clearTimeout(timer);
    }
  }, [fundingAddress]);

  const copyTransactionHex = () => {
    copyToClipboard(transaction.hex);
  };

  const downloadTransaction = () => {
    downloadAsFile(transaction.hex, `vault-${vaultData.vaultId}-tx.hex`);
  };

  const simulateBroadcast = async () => {
    setIsBroadcasting(true);
    setError(null);

    try {
      // For MVP, we'll simulate broadcasting
      // In production, user would sign with their wallet first
      await new Promise(resolve => setTimeout(resolve, 2000));

      setBroadcastResult({
        txid: transaction.txid,
        network: vaultData.network,
        explorerUrl: getExplorerUrl(transaction.txid, vaultData.network)
      });
    } catch (err) {
      setError('Failed to broadcast transaction');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <h2 className="text-3xl font-bold mb-6">Build Time-Locked Transaction</h2>

        {/* Vault Summary */}
        <div className="mb-8 p-4 glass-dark rounded-lg">
          <h3 className="font-semibold mb-3">Vault Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Vault ID:</span>
              <span className="font-mono">{truncateAddress(vaultData.vaultId)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Lock Time:</span>
              <span>{formatLockTime(vaultData.lockTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Heirs:</span>
              <span>{vaultData.heirAddresses.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Network:</span>
              <span className="uppercase">{vaultData.network}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Data Size:</span>
              <span>{vaultData.encryptedData.length} bytes</span>
            </div>
          </div>
        </div>

        {/* Funding Address Input */}
        {!transaction && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Funding Address
            </label>
            <p className="text-sm text-gray-400 mb-3">
              Enter a Bitcoin address with funds to pay for the transaction. You'll need at least ~2000 sats.
            </p>
            <input
              type="text"
              value={fundingAddress}
              onChange={(e) => setFundingAddress(e.target.value)}
              placeholder="tb1q... (signet/testnet address)"
              className="input-field font-mono text-sm"
            />

            {utxos && (
              <div className="mt-3 p-3 glass-dark rounded text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Available UTXOs:</span>
                  <span className="font-semibold">{utxos.count}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-400">Total Value:</span>
                  <span className="font-semibold">{utxos.totalValue} sats</span>
                </div>
              </div>
            )}

            {utxos && utxos.count === 0 && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm">
                <div className="flex items-center text-yellow-500">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  No UTXOs found. Fund this address first.
                </div>
                <a
                  href="https://signetfaucet.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 mt-2 inline-flex items-center"
                >
                  Get Signet Coins
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Build Transaction Button */}
        {!transaction && (
          <button
            onClick={buildTransaction}
            disabled={isBuilding || !fundingAddress}
            className="btn-primary w-full"
          >
            {isBuilding ? (
              <>
                <Loader className="w-5 h-5 mr-2 inline animate-spin" />
                Building Transaction...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2 inline" />
                Build Transaction
              </>
            )}
          </button>
        )}

        {/* Transaction Details */}
        {transaction && !broadcastResult && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center text-green-500 mb-2">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-semibold">Transaction Built Successfully</span>
              </div>
              <p className="text-sm text-gray-400">
                Your time-locked transaction has been created. Review the details below.
              </p>
            </div>

            <div className="p-4 glass-dark rounded-lg">
              <h3 className="font-semibold mb-3">Transaction Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction ID:</span>
                  <span className="font-mono">{truncateAddress(transaction.txid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Size:</span>
                  <span>{transaction.size} bytes ({transaction.vsize} vbytes)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fee:</span>
                  <span>{transaction.fee} sats</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Lock Time:</span>
                  <span>{formatLockTime(transaction.lockTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Inputs:</span>
                  <span>{transaction.inputs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Outputs:</span>
                  <span>{transaction.outputs}</span>
                </div>
              </div>
            </div>

            <div className="p-4 glass-dark rounded-lg">
              <h3 className="font-semibold mb-3">Transaction Hex</h3>
              <div className="bg-black/50 p-3 rounded font-mono text-xs break-all">
                {transaction.hex}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={copyTransactionHex} className="btn-secondary text-sm flex-1">
                  <Copy className="w-4 h-4 mr-2 inline" />
                  Copy Hex
                </button>
                <button onClick={downloadTransaction} className="btn-secondary text-sm flex-1">
                  Download
                </button>
              </div>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <h3 className="font-semibold text-yellow-500 mb-2 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Next Steps
              </h3>
              <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                <li>Sign this transaction with your Bitcoin wallet (Leather, Sparrow, etc.)</li>
                <li>Broadcast the signed transaction to the Bitcoin network</li>
                <li>The transaction will confirm after the lock time expires</li>
                <li>Your heirs will receive the encrypted data via Ordinal inscription</li>
              </ol>
            </div>

            <button
              onClick={simulateBroadcast}
              disabled={isBroadcasting}
              className="btn-primary w-full"
            >
              {isBroadcasting ? (
                <>
                  <Loader className="w-5 h-5 mr-2 inline animate-spin" />
                  Broadcasting...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5 mr-2 inline" />
                  Sign & Broadcast (Demo)
                </>
              )}
            </button>
          </div>
        )}

        {/* Broadcast Success */}
        {broadcastResult && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-500 mb-2">
                Transaction Broadcast Successfully!
              </h3>
              <p className="text-gray-400 mb-4">
                Your vault is now active on the Bitcoin network.
              </p>
              <div className="p-3 bg-black/50 rounded font-mono text-sm break-all mb-4">
                {broadcastResult.txid}
              </div>
              <a
                href={broadcastResult.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center"
              >
                View on Explorer
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </div>

            <div className="p-4 glass-dark rounded-lg">
              <h3 className="font-semibold mb-3">What Happens Next?</h3>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• The transaction will remain in mempool until lock time expires</li>
                <li>• After {vaultData.lockTimeDays} days, it will confirm automatically</li>
                <li>• Your heirs will receive the Ordinal inscription</li>
                <li>• They can decrypt the data using the password you shared</li>
                <li>• To reset the timer, create a new vault with a later lock time</li>
              </ul>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center text-red-400">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
