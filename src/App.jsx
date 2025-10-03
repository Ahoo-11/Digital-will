import { useEffect, useMemo, useState } from 'react';
import { Shield, Github, ExternalLink, LogOut, Loader2, AlertCircle } from 'lucide-react';
import VaultWizard from './components/VaultWizard';
import TransactionBuilder from './components/TransactionBuilder';
import VaultDashboard from './components/VaultDashboard';
import HeirRecovery from './components/HeirRecovery';
import AuthPanel from './components/AuthPanel.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { useVaults } from './hooks/useVaults.js';

function App() {
  const { user, session, loading: authLoading, signOut } = useAuth();
  const { vaults, loading: vaultsLoading, error: vaultsError, createVault, deleteVault } = useVaults(user);
  const [currentView, setCurrentView] = useState('home');
  const [vaultData, setVaultData] = useState(null);
  const [activeTool, setActiveTool] = useState('build');
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (vaultData) {
      const updated = vaults.find((vault) => vault.vaultId === vaultData.vaultId);
      if (updated) {
        setVaultData(updated);
      }
    }
  }, [vaults]);

  const isDashboardAvailable = useMemo(() => vaults.length > 0, [vaults]);

  const handleVaultCreated = async (vault) => {
    setActionError(null);
    try {
      const saved = await createVault(vault);
      setVaultData(saved);
      setActiveTool('build');
      setCurrentView('vaultTools');
      return saved;
    } catch (error) {
      setActionError(error.message || 'Failed to save vault.');
      throw error;
    }
  };

  const resetApp = () => {
    setVaultData(null);
    setCurrentView('home');
  };

  const handleManageVaults = () => {
    setCurrentView('dashboard');
  };

  const handleSelectVault = (vault) => {
    setVaultData(vault);
    setActiveTool('build');
    setCurrentView('vaultTools');
  };

  const handleDeleteVault = async (vault) => {
    if (!vault) return;
    setActionError(null);
    try {
      await deleteVault(vault);
      if (vaultData?.vaultId === vault.vaultId) {
        setVaultData(null);
        setCurrentView('dashboard');
      }
    } catch (error) {
      setActionError(error.message || 'Failed to delete vault.');
    }
  };

  const handleSignOut = async () => {
    setActionError(null);
    await signOut();
    setVaultData(null);
    setCurrentView('home');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        Loading Aeturnum...
      </div>
    );
  }

  if (!user) {
    return <AuthPanel />;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 glass-dark">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold text-gradient">Aeturnum</h1>
                <p className="text-sm text-gray-400">Trustless Digital Dead Man's Switch</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
              <div className="flex items-center space-x-4">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://signetfaucet.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-white transition-colors flex items-center"
                >
                  Get Signet Coins
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
                {isDashboardAvailable && (
                  <button
                    onClick={handleManageVaults}
                    className="btn-secondary text-sm"
                  >
                    Vault Dashboard
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-white font-medium">{user.email}</div>
                  <div className="text-xs text-gray-400">Signed in</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="btn-secondary text-sm inline-flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {currentView === 'home' && (
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="text-5xl font-bold mb-4">
                Your Digital Legacy,
                <br />
                <span className="text-gradient">Secured Forever</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Store encrypted messages on Bitcoin and automatically release them to your heirs
                using time-locked transactions and Ordinal inscriptions.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentView('create')}
                  className="btn-primary text-lg px-8 py-4"
                >
                  Create Your Vault
                </button>
                {isDashboardAvailable && (
                  <button
                    onClick={handleManageVaults}
                    className="btn-secondary text-lg px-8 py-4"
                  >
                    Manage Existing Vaults
                  </button>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mt-16">
              <div className="card">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Trustless</h3>
                <p className="text-gray-400">
                  No central authority. Your data is encrypted client-side and stored on Bitcoin.
                </p>
              </div>

              <div className="card">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Encrypted</h3>
                <p className="text-gray-400">
                  AES-256-GCM encryption ensures only you and your heirs can access the data.
                </p>
              </div>

              <div className="card">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Time-Locked</h3>
                <p className="text-gray-400">
                  Bitcoin's nLockTime ensures automatic release if you don't check in.
                </p>
              </div>
            </div>

            {/* How It Works */}
            <div className="mt-16">
              <h3 className="text-3xl font-bold text-center mb-8">How It Works</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Create Your Vault</h4>
                    <p className="text-gray-400">
                      Enter your secret message, set a password, add heir addresses, and choose a lock time.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Sign & Broadcast</h4>
                    <p className="text-gray-400">
                      Sign the time-locked transaction with your Bitcoin wallet and broadcast it to the network.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Reset or Release</h4>
                    <p className="text-gray-400">
                      Reset the timer by creating a new vault, or let it expire to release to your heirs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Heirs Claim</h4>
                    <p className="text-gray-400">
                      Heirs receive the Ordinal inscription, download the encrypted data, and decrypt with the password.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'create' && (
          <div className="animate-fade-in">
            <button
              onClick={() => setCurrentView('home')}
              className="mb-6 text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </button>
            <VaultWizard onVaultCreated={handleVaultCreated} />
          </div>
        )}

        {currentView === 'dashboard' && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <button
              onClick={() => setCurrentView('home')}
              className="mb-6 text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </button>
            <h2 className="text-3xl font-bold mb-6">Vault Dashboard</h2>
            <VaultDashboard
              vaults={vaults}
              loading={vaultsLoading}
              error={vaultsError || actionError}
              onSelectVault={handleSelectVault}
              onDeleteVault={handleDeleteVault}
            />
          </div>
        )}

        {currentView === 'vaultTools' && vaultData && (
          <div className="animate-fade-in">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="mb-6 text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </button>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setActiveTool('build')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTool === 'build' ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-300'
                }`}
              >
                Build Transaction
              </button>
              <button
                onClick={() => setActiveTool('recover')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTool === 'recover' ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-300'
                }`}
              >
                Heir Recovery
              </button>
              <div className="ml-auto">
                <button
                  onClick={resetApp}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Create New Vault →
                </button>
              </div>
            </div>
            {activeTool === 'build' ? (
              <TransactionBuilder vaultData={vaultData} authToken={session?.access_token} />
            ) : (
              <HeirRecovery vault={vaultData} />
            )}
          </div>
        )}
      </main>

      {(vaultsError || actionError) && currentView !== 'dashboard' && (
        <div className="container mx-auto px-4">
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5" />
            <span>{actionError || vaultsError}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 glass-dark mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400 text-sm">
            <p className="mb-2">
              Built for DoraHacks Hackathon • Powered by Bitcoin Ordinals
            </p>
            <p className="text-xs">
              ⚠️ This is an MVP. Use at your own risk. Always test on Signet first.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
