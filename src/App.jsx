import { useState } from 'react';
import { Shield, Github, ExternalLink } from 'lucide-react';
import VaultWizard from './components/VaultWizard';
import TransactionBuilder from './components/TransactionBuilder';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [vaultData, setVaultData] = useState(null);

  const handleVaultCreated = (vault) => {
    setVaultData(vault);
    setCurrentView('transaction');
  };

  const resetApp = () => {
    setVaultData(null);
    setCurrentView('home');
  };

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
              <button
                onClick={() => setCurrentView('create')}
                className="btn-primary text-lg px-8 py-4"
              >
                Create Your Vault
              </button>
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

        {currentView === 'transaction' && vaultData && (
          <div className="animate-fade-in">
            <button
              onClick={resetApp}
              className="mb-6 text-gray-400 hover:text-white transition-colors"
            >
              ← Create New Vault
            </button>
            <TransactionBuilder vaultData={vaultData} />
          </div>
        )}
      </main>

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
