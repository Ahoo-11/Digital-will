import { Calendar, Clock, Users, Lock, ShieldAlert, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { formatLockTime, getTimeRemaining, truncateAddress } from '../utils/bitcoin';

export default function VaultDashboard({ vaults, loading, error, onSelectVault, onDeleteVault }) {
  if (loading) {
    return (
      <div className="card text-center">
        <Loader2 className="w-10 h-10 text-red-500 mx-auto mb-4 animate-spin" />
        <h2 className="text-2xl font-bold mb-2">Fetching your vaults...</h2>
        <p className="text-gray-400">Please wait while we load data from Supabase.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Unable to load vaults</h2>
        <p className="text-gray-400">
          {error}
        </p>
      </div>
    );
  }

  if (!vaults || vaults.length === 0) {
    return (
      <div className="card text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Vaults Yet</h2>
        <p className="text-gray-400">
          Create your first vault to see it listed here. Vault metadata is stored securely in Supabase—your
          encrypted payload never leaves the browser without encryption.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {vaults
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((vault) => {
          const timeRemaining = getTimeRemaining(vault.lockTime);
          const isExpired = timeRemaining === 'Expired';

          return (
            <div key={vault.vaultId} className="card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    Created {new Date(vault.createdAt).toLocaleString()}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                      <span className="font-mono text-sm">{truncateAddress(vault.vaultId)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Users className="w-4 h-4" />
                      {vault.heirAddresses.length} heir{vault.heirAddresses.length === 1 ? '' : 's'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Lock className="w-4 h-4" />
                      Releases on {formatLockTime(vault.lockTime)}
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${isExpired ? 'text-green-400' : 'text-gray-300'}`}>
                      <Clock className="w-4 h-4" />
                      {isExpired ? 'Ready for heir recovery' : `Time remaining: ${timeRemaining}`}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => onSelectVault?.(vault)}
                    className="btn-primary inline-flex items-center justify-center"
                  >
                    Open Tools
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                  <button
                    onClick={() => onDeleteVault?.(vault)}
                    className="btn-secondary inline-flex items-center justify-center text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
