import { useState } from 'react';
import { AlertCircle, CheckCircle, Copy, Download, Info, Lock, Unlock, Shield } from 'lucide-react';
import { decryptData } from '../utils/crypto';
import { copyToClipboard, downloadAsFile, formatLockTime, getTimeRemaining } from '../utils/bitcoin';

export default function HeirRecovery({ vault }) {
  const [password, setPassword] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedMessage, setDecryptedMessage] = useState(null);
  const [error, setError] = useState(null);

  if (!vault) {
    return (
      <div className="card text-center">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Select a Vault</h2>
        <p className="text-gray-400">Choose a vault from the dashboard to begin the recovery process.</p>
      </div>
    );
  }

  const handleDecrypt = async () => {
    setError(null);
    setDecryptedMessage(null);

    if (!password) {
      setError('Please enter the password shared with you by the vault creator.');
      return;
    }

    setIsDecrypting(true);
    try {
      const message = await decryptData(vault.encryptedData, password);
      setDecryptedMessage(message);
    } catch (err) {
      console.error('Failed to decrypt vault:', err);
      setError('Unable to decrypt. The password may be incorrect or the data may be corrupted.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleCopy = async () => {
    await copyToClipboard(vault.encryptedData);
  };

  const handleDownload = () => {
    downloadAsFile(vault.encryptedData, `vault-${vault.vaultId}-encrypted.txt`);
  };

  const timeRemaining = getTimeRemaining(vault.lockTime);
  const isReady = timeRemaining === 'Expired';

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Heir Recovery Tools</h2>
          <p className="text-gray-400">
            Use the password provided by the vault creator to unlock the encrypted inheritance data.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 glass-dark rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Lock className="w-4 h-4" />
              Vault ID: <span className="font-mono text-gray-200">{vault.vaultId}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Info className="w-4 h-4" />
              Created: {new Date(vault.createdAt).toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Unlock className={`w-4 h-4 ${isReady ? 'text-green-500' : 'text-yellow-500'}`} />
              {isReady ? 'Lock time has expired' : `Releases on ${formatLockTime(vault.lockTime)}`}
            </div>
            <div className={`flex items-center gap-2 text-sm ${isReady ? 'text-green-400' : 'text-gray-300'}`}>
              <AlertCircle className="w-4 h-4" />
              {isReady ? 'You can now decrypt the vault.' : `Time remaining: ${timeRemaining}`}
            </div>
          </div>

          <div className="p-4 glass-dark rounded-lg text-sm text-gray-300 space-y-2">
            <p className="font-semibold text-white">How to Claim</p>
            <ol className="space-y-2 list-decimal list-inside">
              <li>Enter the password shared by the vault owner.</li>
              <li>Click <strong>Decrypt Message</strong> to reveal the contents.</li>
              <li>Securely store any secrets or instructions provided.</li>
            </ol>
            <p className="text-yellow-400 text-xs">
              ⚠️ Do not share the decrypted message with anyone you do not trust.
            </p>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Encrypted Payload</label>
          <div className="bg-black/50 p-3 rounded text-xs font-mono break-all max-h-40 overflow-auto">
            {vault.encryptedData}
          </div>
          <div className="flex gap-3 mt-3">
            <button onClick={handleCopy} className="btn-secondary text-sm flex items-center justify-center gap-2">
              <Copy className="w-4 h-4" /> Copy
            </button>
            <button onClick={handleDownload} className="btn-secondary text-sm flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Download
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter the password provided by the vault creator"
            className="input-field"
          />
        </div>

        <button
          onClick={handleDecrypt}
          disabled={isDecrypting}
          className="btn-primary inline-flex items-center gap-2"
        >
          {isDecrypting ? 'Decrypting...' : 'Decrypt Message'}
        </button>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {decryptedMessage && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-green-400 font-semibold mb-3">
              <CheckCircle className="w-5 h-5" />
              Message Decrypted Successfully
            </div>
            <div className="bg-black/50 p-3 rounded text-sm text-gray-100 whitespace-pre-wrap">
              {decryptedMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
