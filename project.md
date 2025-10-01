**Prompt for Junior Developer: Build the MVP of “Aeturnum” – A Trustless Digital Dead Man’s Switch**

---

**Objective:**  
You are tasked with building a minimal, functional prototype (MVP) of **Aeturnum**—a trustless, on-chain Dead Man’s Switch powered by Bitcoin. This service lets users securely store encrypted data (e.g., recovery phrases, final messages) and automatically release it to designated heirs if the user fails to “check in” before a deadline.

Your MVP must demonstrate the core mechanics using Bitcoin’s native features: **nLockTime**, **Ordinal inscriptions**, and **client-side encryption**. No centralized backend should hold sensitive data.

---

### 🧩 Core Requirements

#### 1. **Vault Creation Wizard (Frontend)**
- Build a simple, single-page web UI (React/Vanilla JS is fine).
- The user should be able to:
  - Type a message **OR** upload a small text file (<1 KB).
  - Enter a **strong password** (used for encryption—never sent to any server).
  - Input **1–3 Bitcoin addresses** representing their heirs.
  - Choose a **lock time** (e.g., 30, 90, or 365 days from now).
- On submit:
  - **Encrypt the data client-side** using AES-256-GCM (or similar) with the user’s password.
  - Generate a **unique vault ID** (e.g., UUID).
  - Display a **“vault recovery phrase”** (just the password + vault ID)—emphasize: *“Save this. We cannot recover it.”*

> 💡 **Security Note**: All encryption must happen in the browser. Never transmit plaintext or password to your backend.

#### 2. **Time-Locked Transaction Builder (Backend)**
- Create a lightweight backend (Node.js/Python) that:
  - Accepts the **encrypted data blob** (as hex/base64) and heir addresses from the frontend.
  - Constructs a **Bitcoin transaction** with two outputs:
    1. An **Ordinal inscription** containing the encrypted data (use the [Ordinals inscription format](https://docs.ordinals.com/inscriptions.html)).
    2. A small BTC amount (e.g., 546 satoshis) sent to a **multi-sig or shared address** derived from the heirs’ addresses (for MVP, you may send to a single heir address or use a simple 1-of-N scheme).
  - Sets **nLockTime** to the chosen future timestamp (in block height or UNIX time).
  - Returns the **raw, unsigned transaction** to the frontend.

> ⚠️ **Do NOT broadcast this transaction yet!** The user must sign it themselves.

#### 3. **User “Heartbeat” Mechanism (Frontend + Wallet Integration)**
- After vault creation, show the user:
  - A **“Reset Timer” button**.
  - Instructions: *“To keep your vault locked, sign and broadcast this transaction before [lock time].”*
- When clicked:
  - Use a browser-based Bitcoin wallet (e.g., Leather, Sparrow via PSBT, or a simple private key input for demo) to:
    - **Sign the time-locked transaction**.
    - Broadcast it to the Bitcoin network (via Blockstream API, Mempool.space, or similar).
  - Once confirmed, the vault is “armed.” The user can later create a **new vault** with a later nLockTime to “reset” the switch.

#### 4. **Inheritance Flow (Passive – No Code Needed for MVP)**
- Document how heirs would recover data:
  - Monitor the Bitcoin address they provided.
  - When the time-locked transaction confirms (after nLockTime), they’ll receive BTC + see an Ordinal inscription.
  - They go to an Ordinals explorer (e.g., ord.io), find the inscription, download the encrypted blob.
  - They decrypt it locally using the **password** the user shared with them separately (e.g., via email, safe, etc.).

> ✅ **MVP Scope Note**: You don’t need to build the heir recovery UI—just ensure the inscription is valid and decryptable.

---

### 🔧 Tech Stack Guidance
- **Frontend**: React + TypeScript (or plain HTML/JS for simplicity)
- **Encryption**: Use `crypto.subtle` (Web Crypto API) or `tweetnacl`/`forge` for AES
- **Bitcoin**: 
  - Use `bitcoinjs-lib` (JS) or `python-bitcoinlib` to build transactions
  - Use `ord` CLI or `ord-rust` logic to format inscriptions (or manually construct the inscription envelope)
- **Broadcast**: Use Blockstream API (`https://blockstream.info/api/tx`) or Mempool.space API
- **Wallet**: For demo, allow private key input (⚠️ warn user it’s unsafe!) or integrate with Leather wallet via PSBT

---

### 🚫 What’s Out of Scope (For MVP)
- Multi-sig key management beyond basic address input
- Automated heartbeat reminders (email/SMS)
- Heir decryption UI
- Fee estimation or UTXO selection logic (assume user funds a dedicated vault wallet)

---

### 📦 Deliverables
1. A working web app (localhost is fine) that lets a user:
   - Create an encrypted vault
   - Generate a time-locked, inscribed transaction
   - Sign & broadcast it (simulated or real)
2. A README.md explaining:
   - How to run the app
   - How the protocol works
   - Security assumptions and limitations
3. Sample transaction on testnet (or signet) demonstrating a valid inscription + nLockTime

---

### 💡 Pro Tips
- Start with **signet**—it’s faster and free.
- Use `bitcoin-cli` or `ord` to verify your inscription works.
- Test decryption separately: encrypt → save blob → decrypt with password.
- Emphasize **user education**: “This only works if your heirs know the password!”

---

**Remember**: You’re not just coding—you’re building a **weapon against time and trust**. Every line should honor the user’s sovereignty. Now go forge their digital legacy. 🔥