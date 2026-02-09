import { useEffect, useState } from "react";
import { generateWords } from "./data/words";
import { connectWalletAndSwitchBase, payEntryFee } from "./utils/wallet";
import { supabase } from "./utils/supabase";
import "./App.css";

const CHUNK_SIZE = 4;

export default function App() {
  const [words, setWords] = useState([]);
  const [wordStates, setWordStates] = useState([]);
  const [chunkStart, setChunkStart] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  const [charCount, setCharCount] = useState(0);
  const [input, setInput] = useState("");

  const [time, setTime] = useState(60);
  const [remaining, setRemaining] = useState(60);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);

  const [wallet, setWallet] = useState(null);
  const [txLoading, setTxLoading] = useState(false);

  const [leaderboard, setLeaderboard] = useState([]);
  const [saved, setSaved] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  // Mobile Checker

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    const list = generateWords(200);
    setWords(list);
    setWordStates(new Array(list.length).fill("pending"));
    fetchLeaderboard();
  }, []);


  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (!started || finished) return;

    if (remaining === 0) {
      setFinished(true);
      setStarted(false);
      setEndTime(Date.now()); // 🔒 freeze time
      return;
    }

    const t = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);

    return () => clearInterval(t);
  }, [started, remaining, finished]);



  /* ---------------- GAME ---------------- */
  const startGame = () => {
    setStarted(true);
    setFinished(false);
    setRemaining(time);
    setInput("");
    setSaved(false);
    setCorrect(0);
    setWrong(0);
    setCharCount(0);
    setChunkStart(0);
    setCurrentIndex(0);
    setStartTime(Date.now());
    setEndTime(null);
  };

  const restartGame = () => {
    const list = generateWords(200);
    setWords(list);
    setWordStates(new Array(list.length).fill("pending"));
    setStarted(false);
    setFinished(false);
    setRemaining(time);
    setCorrect(0);
    setWrong(0);
    setCharCount(0);
    setInput("");
    setChunkStart(0);
    setCurrentIndex(0);
    setSaved(false);
    setStartTime(null);
    setEndTime(null);
  };

  const typingSound = new Audio("/sounds/key.mp3");
  typingSound.volume = 0.3;

  const handleKeyDown = (e) => {
    if (!started || finished) return;

    if (currentIndex >= words.length - 1) {
      const more = generateWords(50);
      setWords((prev) => [...prev, ...more]);
      setWordStates((prev) => [
        ...prev,
        ...new Array(more.length).fill("pending"),
      ]);
    }

    if (e.key.length === 1 && e.key !== " ") {
      typingSound.currentTime = 0;
      typingSound.play().catch(() => { });
    }

    if (e.key === " " && input.trim() === "") {
      e.preventDefault();
      return;
    }

    if (e.key === " ") {
      e.preventDefault();

      const typed = input.trim();
      const actual = words[currentIndex];
      const states = [...wordStates];

      if (typed === actual) {
        states[currentIndex] = "correct";
        setCorrect((c) => c + 1);
        setCharCount((c) => c + actual.length + 1);
      } else {
        states[currentIndex] = "wrong";
        setWrong((w) => w + 1);
      }

      setWordStates(states);
      setInput("");

      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      if (nextIndex % CHUNK_SIZE === 0) {
        setChunkStart(nextIndex);
      }
    }
  };


  /* ---------------- STATS ---------------- */
  const accuracy =
    correct + wrong === 0
      ? 0
      : Math.round((correct / (correct + wrong)) * 100);

  const elapsedSeconds =
    startTime && endTime
      ? Math.max(1, Math.round((endTime - startTime) / 1000))
      : startTime
        ? Math.max(1, Math.round((Date.now() - startTime) / 1000))
        : time;

  const elapsedMinutes = elapsedSeconds / 60;

  const practiceWPM =
    correct === 0
      ? 0
      : Math.round((charCount / 5) / elapsedMinutes);

  const rankedMinutes = time / 60;

  const rankedWPM =
    correct === 0
      ? 0
      : Math.round((charCount / 5) / rankedMinutes);




  /* ---------------- WALLET ---------------- */
  const handleConnectWallet = async () => {
    const addr = await connectWalletAndSwitchBase();
    if (addr) setWallet(addr);
    return addr;
  };

  async function saveScore() {
    if (time < 30) {
      alert("⛔ Leaderboard only for 30s+ tests");
      return;
    }

    if (accuracy < 60) {
      alert("⛔ Accuracy must be at least 60%");
      return;
    }

    if (elapsedSeconds < time * 0.8) {
      alert("⛔ Complete at least 80% of the test");
      return;
    }

    if (!wallet || saved) return;

    const { data: existing } = await supabase
      .from("leaderboard")
      .select("wpm")
      .eq("wallet", wallet)
      .single();

    if (existing && rankedWPM <= existing.wpm) {
      alert(`❌ Your best is ${existing.wpm} WPM`);
      setSaved(true);
      return;
    }

    await supabase.from("leaderboard").upsert(
      {
        wallet,
        wpm: rankedWPM,
        accuracy,
        created_at: new Date().toISOString(),
      },
      { onConflict: "wallet" }
    );

    setSaved(true);
    fetchLeaderboard();
  }

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from("leaderboard")
      .select("*")
      .order("wpm", { ascending: false })
      .limit(20);

    setLeaderboard(data || []);
  }

  const visibleWords = words.slice(chunkStart, chunkStart + CHUNK_SIZE);

  if (isMobile) {
    return (
      <div className="mobile-block">
        <h1>⌨️ TypoTester</h1>
        <p>This game is designed for desktop keyboards.</p>
        <p>Please open on a PC or Laptop 🖥️</p>
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div id="mainContainer">
      <h1 className="maintext">TypoTester</h1>
      <p className="decPera">This Is A WEB3 Typing Speed Test Website You Can Check & Save Your Real WPM Build on BASE Network</p>
      <div className="wallet-bar">
        {wallet ? (
          <span className="wallet-address">
            {wallet.slice(0, 6)}...{wallet.slice(-4)}
          </span>
        ) : (
          <button className="wallet-btn" onClick={handleConnectWallet}>
            🔗 Connect Wallet
          </button>
        )}
      </div>

      <div className="layout">
        <div className="container">
          {!started && !finished && (
            <div className="time-select">
              <select
                className="time-dropdown"
                value={time}
                onChange={(e) => {
                  setTime(Number(e.target.value));
                  setRemaining(Number(e.target.value));
                }}
              >
                <option value={15}>15 sec</option>
                <option value={30}>30 sec</option>
                <option value={60}>60 sec</option>
                <option value={120}>120 sec</option>
              </select>

              <button
                className="play-btn"
                disabled={txLoading}
                onClick={async () => {
                  setTxLoading(true);
                  // let addr = wallet || (await handleConnectWallet());
                  // if (!addr) return;
                  // await payEntryFee(addr);
                  // startGame();
                  // setTxLoading(false);
                  try {
                    let addr = wallet || (await handleConnectWallet());
                    if (!addr) return;
                    await payEntryFee(addr);
                    startGame();
                  } finally {
                    setTxLoading(false);
                  }
                }}
              >
                ▶ Play
              </button>
            </div>
          )}

          <div className="words-box centered">
            {visibleWords.map((word, i) => {
              const gi = chunkStart + i;
              return (
                <span
                  key={gi}
                  className={`word ${wordStates[gi]} ${gi === currentIndex ? "active" : ""
                    }`}
                >
                  {word}
                </span>
              );
            })}
          </div>

          <input
            value={input}
            disabled={!started}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type and press space"
          />

          <h3>⏱ {remaining}s</h3>

          {finished && (
            <div className="result">
              <p>✅ Correct: {correct}</p>
              <p>❌ Wrong: {wrong}</p>
              <p>WPM: {practiceWPM}</p>
              <p>Accuracy: {accuracy}%</p>

              <div className="btnBox">
                <button className="btn btn-restart" onClick={restartGame}>
                  🔁 Restart
                </button>
                <button className="btn btn-save" onClick={saveScore} disabled={saved}>
                  🏆 Save to Leaderboard
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="leaderboard">
          <h2 className="leader-title">🏆 Leaderboard</h2>

          {leaderboard.map((row, i) => {
            const rankClass =
              i === 0
                ? "rank-1"
                : i === 1
                  ? "rank-2"
                  : i === 2
                    ? "rank-3"
                    : "rank-other";

            return (
              <div
                key={row.id}
                className={`leader-row ${rankClass}`}
              >
                <span className="rank">#{i + 1}</span>

                <span className="wallet">
                  {row.wallet.slice(0, 6)}…{row.wallet.slice(-4)}
                </span>

                <span className="wpm">{row.wpm} WPM</span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
