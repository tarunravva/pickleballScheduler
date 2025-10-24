import React from "react";

/*
  Player list, add player, fill default, randomize, slots
  Props:
    state, update
*/

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PlayerSetup({ state, update }) {
  const addPlayer = (name) => {
    const n = name.trim();
    if (!n) return;
    if (!state.availablePlayers.includes(n)) {
      update({ availablePlayers: [...state.availablePlayers, n] });
    }
  };

  const fillDefault = () => {
    update({ slots: state.availablePlayers.slice(0, 8) });
  };

  const randomize = () => {
    if (state.availablePlayers.length < 8) {
      alert("Need at least 8 players in the pool");
      return;
    }
    const arr = shuffle([...new Set(state.availablePlayers)]);
    update({ slots: arr.slice(0, 8) });
  };

  const pickChipToFirstEmpty = (name) => {
    const idx = state.slots.indexOf("");
    if (idx === -1) {
      alert("All slots are full");
      return;
    }
    if (state.slots.includes(name)) return;
    const s = [...state.slots];
    s[idx] = name;
    update({ slots: s });
  };

  const removeFromSlot = (i) => {
    const s = [...state.slots];
    s[i] = "";
    update({ slots: s });
  };

  const setSlot = (i, value) => {
    const s = [...state.slots];
    s[i] = value;
    update({ slots: s });
  };

  return (
    <section className="card">
      <h2>1) Players & Setup</h2>
      <div className="row">
        <div className="col">
          <h3>Available players</h3>
          <div className="chip-list">
            {state.availablePlayers.map((p) => (
              <div key={p} className="chip" onClick={() => pickChipToFirstEmpty(p)}>{p}</div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <input id="newPlayer" placeholder="New player name" />
            &nbsp;
            <button onClick={() => { addPlayer(document.getElementById("newPlayer").value); document.getElementById("newPlayer").value = ""; }}>Add</button>
          </div>
        </div>

        <div className="col">
          <h3>8 player slots</h3>
          <div className="slots">
            {state.slots.map((s, i) => (
              <div key={i} className="slot">
                <select value={s} onChange={(e) => setSlot(i, e.target.value)}>
                  <option value="">(empty)</option>
                  {[...new Set([...state.availablePlayers, s])].filter(Boolean).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <button onClick={() => removeFromSlot(i)}>x</button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <button onClick={fillDefault}>Fill with default 8</button>
            &nbsp;
            <button onClick={randomize}>Randomize & assign</button>
          </div>
        </div>
      </div>
    </section>
  );
}