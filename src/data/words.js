import wordBank from "./words.json";

export function generateWords(count = 100) {
  const shuffled = [...wordBank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}