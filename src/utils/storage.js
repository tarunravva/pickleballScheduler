export const DEFAULT_PLAYERS = [
  "Rajesh","Tarun","Kulwinder","Kishore","Anuroop",
  "Anuj","Shantha","Saketh","Xavier","Rohit"
];

const KEY = "pbs_react_state_v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // ignore
  }
}