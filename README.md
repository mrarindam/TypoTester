# TypoTester 🚀

**TypoTester** is a modern **WEB3-based typing speed test application** where users can measure their real typing speed (WPM), accuracy, and securely save scores on-chain-linked identity using a wallet.

Built with performance, fairness, and anti-cheat logic in mind.

---

## 🔥 Key Features

### ⌨️ Typing Test
- Time-based typing tests: **15s / 30s / 60s / 120s**
- Real-time word highlighting
- Correct & wrong word detection
- Live WPM and accuracy calculation
- Typing sound feedback for better user experience

---

### 🧮 Accurate WPM Logic
- **WPM is calculated using correct characters only**
- Formula used:
WPM = (Correct Characters / 5) / Minutes
- Prevents fake inflation by random typing or space spamming

---

### 🛡️ Anti-Cheat System
To ensure fair scores, multiple cheat-prevention rules are applied:

- ❌ **Empty space spam blocked**
- ❌ **Wrong words do NOT increase WPM**
- ❌ **Leaderboard disabled for tests below 30 seconds**
- ❌ **Accuracy must be at least 60%**
- ❌ **User must complete at least 80% of the test duration**
- ❌ **Only the best score per wallet is saved**
- ❌ **Short-duration score boosting prevented**

These checks ensure that leaderboard rankings reflect **real typing skill**, not abuse.

---

### 🏆 Leaderboard
- Global leaderboard sorted by **highest WPM**
- Wallet-based identity (no username manipulation)
- Rank-based UI styling:
- 🥇 Rank 1
- 🥈 Rank 2
- 🥉 Rank 3
- Others styled separately
- Automatically updates after new valid scores

---

### 🔗 Wallet Integration (WEB3)
- Connect wallet using **Base Network**
- Wallet address is used as a unique identity
- Entry fee logic supported (can be modified)
- Prevents duplicate or fake user identities

---

### 🗄️ Database
- **Supabase** is used as the backend database
- Stores:
- Wallet address
- Best WPM
- Accuracy
- Timestamp
- Secure upsert logic ensures:
- Only better scores replace old ones

---

### 🎧 Sound Effects
- Typing sound plays on valid character input
- Sound does NOT play for:
- Space spam
- Invalid input
- Enhances user feedback without distraction

---

### 📱 Device Support
- Designed primarily for **desktop users**
- Mobile users are gracefully restricted or can be redirected
- Prevents unfair leaderboard entries from mobile keyboards

---

