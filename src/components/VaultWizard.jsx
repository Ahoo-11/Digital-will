import { useState } from 'react';
import { Lock, Users, Clock, FileText, Upload, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { encryptData, validatePassword, generateVaultId, estimateEncryptedSize } from '../utils/crypto';
import { validateBitcoinAddress, calculateLockTime, formatLockTime, readFileAsText, validateFileSize } from '../utils/bitcoin';

const LOCK_TIME_OPTIONS = [
  { days: 30, label: '30 Days' },
  { days: 90, label: '90 Days (3 Months)' },
  { days: 365, label: '365 Days (1 Year)' }
];

export default function VaultWizard({ onVaultCreated }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    message: '',
    password: '',
    confirmPassword: '',
    heirAddresses: [''],
    lockTimeDays: 30,
    network: 'signet'
  });
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [vaultData, setVaultData] = useState(null);

  // Step 1: Enter message or upload file
  const handleMessageChange = (e) => {
    setFormData({ ...formData, message: e.target.value });
    setErrors({ ...errors, message: null });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateFileSize(file, 1)) {
      setErrors({ ...errors, message: 'File must be less than 1 KB' });
      return;
    }

    try {
      const content = await readFileAsText(file);
      setFormData({ ...formData, message: content });
      setErrors({ ...errors, message: null });
    } catch (error) {
      setErrors({ ...errors, message: 'Failed to read file' });
    }
  };

  // Step 2: Set password
  const handlePasswordChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: null });
  };

  // Step 3: Add heirs
  const handleHeirChange = (index, value) => {
    const newHeirs = [...formData.heirAddresses];
    newHeirs[index] = value;
    setFormData({ ...formData, heirAddresses: newHeirs });
    setErrors({ ...errors, [`heir${index}`]: null });
  };

  const addHeir = () => {
    if (formData.heirAddresses.length < 3) {
      setFormData({ ...formData, heirAddresses: [...formData.heirAddresses, ''] });
    }
  };

  const removeHeir = (index) => {
    const newHeirs = formData.heirAddresses.filter((_, i) => i !== index);
    setFormData({ ...formData, heirAddresses: newHeirs });
  };

  // Step 4: Set lock time
  const handleLockTimeChange = (days) => {
    setFormData({ ...formData, lockTimeDays: days });
  };

  // Validation
  const validateStep = (stepNumber) => {
    const newErrors = {};

    if (stepNumber === 1) {
      if (!formData.message.trim()) {
        newErrors.message = 'Please enter a message or upload a file';
      }
      if (formData.message.length > 1024) {
        newErrors.message = 'Message must be less than 1 KB';
      }
    }

    if (stepNumber === 2) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0];
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (stepNumber === 3) {
      formData.heirAddresses.forEach((address, index) => {
        if (!address.trim()) {
          newErrors[`heir${index}`] = 'Address is required';
        } else if (!validateBitcoinAddress(address)) {
          newErrors[`heir${index}`] = 'Invalid Bitcoin address';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  // Create vault
  const createVault = async () => {
    if (!validateStep(3)) return;

    setIsProcessing(true);
    try {
      // Generate vault ID
      const vaultId = generateVaultId();

      // Encrypt data
      const encryptedData = await encryptData(formData.message, formData.password);

      // Calculate lock time
      const lockTime = calculateLockTime(formData.lockTimeDays);

      // Store vault data
      const vault = {
        vaultId,
        encryptedData,
        lockTime,
        lockTimeDays: formData.lockTimeDays,
        heirAddresses: formData.heirAddresses.filter(a => a.trim()),
        network: formData.network,
        createdAt: Date.now()
      };

      setVaultData(vault);
      setStep(5); // Move to final step

      // Callback to parent
      if (onVaultCreated) {
        onVaultCreated(vault);
      }
    } catch (error) {
      console.error('Error creating vault:', error);
      setErrors({ general: 'Failed to create vault. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyRecoveryPhrase = () => {
    const phrase = `Vault ID: ${vaultData.vaultId}\nPassword: ${formData.password}`;
    navigator.clipboard.writeText(phrase);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex items-center ${s < 4 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-all ${
                    step > s ? 'bg-red-600' : 'bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-400 mt-2">
          <span>Message</span>
          <span>Password</span>
          <span>Heirs</span>
          <span>Lock Time</span>
        </div>
      </div>

      {/* Step content */}
      <div className="card animate-fade-in">
        {/* Step 1: Message */}
        {step === 1 && (
          <div>
            <div className="flex items-center mb-6">
              <FileText className="w-6 h-6 text-red-500 mr-3" />
              <h2 className="text-2xl font-bold">Enter Your Secret Message</h2>
            </div>
            <p className="text-gray-400 mb-6">
              Type a message or upload a text file (max 1 KB) that will be encrypted and stored.
            </p>

            <textarea
              value={formData.message}
              onChange={handleMessageChange}
              placeholder="Enter your secret message, recovery phrase, or important information..."
              className="input-field min-h-[200px] font-mono text-sm"
              maxLength={1024}
            />
            <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
              <span>{formData.message.length} / 1024 characters</span>
              <span>~{estimateEncryptedSize(formData.message)} bytes encrypted</span>
            </div>

            {errors.message && (
              <div className="flex items-center mt-3 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.message}
              </div>
            )}

            <div className="mt-6">
              <label className="btn-secondary cursor-pointer inline-flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Upload File
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Password */}
        {step === 2 && (
          <div>
            <div className="flex items-center mb-6">
              <Lock className="w-6 h-6 text-red-500 mr-3" />
              <h2 className="text-2xl font-bold">Set Encryption Password</h2>
            </div>
            <p className="text-gray-400 mb-6">
              Choose a strong password. This will be used to encrypt your data. <strong>Save it securely!</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handlePasswordChange('password', e.target.value)}
                  placeholder="Enter a strong password"
                  className="input-field"
                />
                {errors.password && (
                  <div className="flex items-center mt-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.password}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className="input-field"
                />
                {errors.confirmPassword && (
                  <div className="flex items-center mt-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.confirmPassword}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 p-4 glass-dark rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-yellow-500" />
                Password Requirements
              </h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• At least 12 characters</li>
                <li>• Uppercase and lowercase letters</li>
                <li>• Numbers and special characters</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 3: Heirs */}
        {step === 3 && (
          <div>
            <div className="flex items-center mb-6">
              <Users className="w-6 h-6 text-red-500 mr-3" />
              <h2 className="text-2xl font-bold">Add Heir Addresses</h2>
            </div>
            <p className="text-gray-400 mb-6">
              Enter 1-3 Bitcoin addresses that will receive your encrypted data when the time lock expires.
            </p>

            <div className="space-y-4">
              {formData.heirAddresses.map((address, index) => (
                <div key={index}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">
                        Heir {index + 1} Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => handleHeirChange(index, e.target.value)}
                        placeholder="bc1q... or tb1q... (signet/testnet)"
                        className="input-field font-mono text-sm"
                      />
                    </div>
                    {formData.heirAddresses.length > 1 && (
                      <button
                        onClick={() => removeHeir(index)}
                        className="mt-8 text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {errors[`heir${index}`] && (
                    <div className="flex items-center mt-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {errors[`heir${index}`]}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {formData.heirAddresses.length < 3 && (
              <button onClick={addHeir} className="btn-secondary mt-4">
                + Add Another Heir
              </button>
            )}
          </div>
        )}

        {/* Step 4: Lock Time */}
        {step === 4 && (
          <div>
            <div className="flex items-center mb-6">
              <Clock className="w-6 h-6 text-red-500 mr-3" />
              <h2 className="text-2xl font-bold">Set Lock Time</h2>
            </div>
            <p className="text-gray-400 mb-6">
              Choose how long before the vault automatically releases to your heirs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LOCK_TIME_OPTIONS.map((option) => (
                <button
                  key={option.days}
                  onClick={() => handleLockTimeChange(option.days)}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    formData.lockTimeDays === option.days
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-3xl font-bold mb-2">{option.days}</div>
                  <div className="text-sm text-gray-400">{option.label}</div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 glass-dark rounded-lg">
              <div className="text-sm text-gray-400">
                <strong>Lock time expires:</strong>
                <div className="mt-2 text-white">
                  {formatLockTime(calculateLockTime(formData.lockTimeDays))}
                </div>
              </div>
            </div>

            {errors.general && (
              <div className="flex items-center mt-4 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.general}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && vaultData && (
          <div>
            <div className="flex items-center mb-6 text-green-500">
              <CheckCircle className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-bold">Vault Created Successfully!</h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 glass-dark rounded-lg">
                <h3 className="font-semibold mb-2">Vault Recovery Phrase</h3>
                <div className="font-mono text-sm bg-black/50 p-3 rounded">
                  <div>Vault ID: {vaultData.vaultId}</div>
                  <div className="mt-2">Password: {formData.password}</div>
                </div>
                <button
                  onClick={copyRecoveryPhrase}
                  className="btn-secondary mt-3 text-sm"
                >
                  <Copy className="w-4 h-4 mr-2 inline" />
                  Copy Recovery Phrase
                </button>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <h3 className="font-semibold text-yellow-500 mb-2 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  IMPORTANT - Save This Information
                </h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Save your recovery phrase in a secure location</li>
                  <li>• Share the password with your heirs through a secure channel</li>
                  <li>• We cannot recover your password if lost</li>
                  <li>• Next step: Sign and broadcast the transaction</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 && step < 5 && (
            <button onClick={prevStep} className="btn-secondary">
              ← Previous
            </button>
          )}
          {step < 4 && (
            <button onClick={nextStep} className="btn-primary ml-auto">
              Next →
            </button>
          )}
          {step === 4 && (
            <button
              onClick={createVault}
              disabled={isProcessing}
              className="btn-primary ml-auto"
            >
              {isProcessing ? 'Creating Vault...' : 'Create Vault'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
