import React, { useEffect, useState } from "react";
import PlayerSetup from "./components/PlayerSetup";
import Teams from "./components/Teams";
import Schedule from "./components/Schedule";
import Standings from "./components/Standings";
import { DEFAULT_PLAYERS, loadState, saveState } from "./utils/storage";
import { generateDoubleRoundRobin } from "./utils/scheduler";

export default function App() {
  const [state, setState] = useState(() =>
    loadState() || {
      availablePlayers: [...DEFAULT_PLAYERS],
      slots: Array(8).fill(""),
      teams: [],
      rounds: [],
      numCourts: 2,
      courtNumbers: ["1", "2"] // changed to strings (text fields)
    }
  );

  useEffect(() => saveState(state), [state]);

  const update = (patch) => setState((s) => ({ ...s, ...patch }));

  const createTeamsFromSlots = () => {
    if (state.slots.some((s) => !s)) {
      alert("Please fill all 8 slots first");
      return;
    }
    const newTeams = [];
    for (let i = 0; i < 4; i++) {
      const players = [state.slots[i * 2], state.slots[i * 2 + 1]];
      newTeams.push({
        id: `T${i + 1}`,
        name: `Team ${i + 1}`,
        players
      });
    }
    update({ teams: newTeams, rounds: [] });
  };

  const generateSchedule = () => {
    if (!state.teams || state.teams.length === 0) {
      alert("No teams available. Create teams first.");
      return;
    }
    if (state.teams.length !== 4) {
      // app expects 4 teams for this scheduler
      alert("You need exactly 4 teams to generate the schedule.");
      return;
    }

    // ensure courtNumbers fallback
    const courts = Array.isArray(state.courtNumbers) && state.courtNumbers.length > 0
      ? state.courtNumbers.slice(0, Math.max(1, state.numCourts || 2))
      : [1, 2];

    const rounds = generateDoubleRoundRobin(state.teams, state.numCourts || 2, courts);
    update({ rounds });
  };

  return (
    <div className="app">
      {/* Header added: top banner */}
      <header
        className="card"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          alignItems: "flex-start",
        }}
      >
        <h1 style={{ margin: 0 }}>BRCL Pickle ball mini Tournament</h1>
        <div className="muted" style={{ fontSize: 13 }}>
          Manage players, teams & schedule
        </div>
      </header>

      <main>
        <PlayerSetup state={state} update={update} />
        <Teams state={state} update={update} createTeamsFromSlots={createTeamsFromSlots} />
        <div className={state.teams.length ? "" : "hidden"}>
          <div className="card">
            <h2>Schedule</h2>
            <div className="controls">
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                Courts:
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={state.numCourts}
                  onChange={(e) => update({ numCourts: Math.max(1, Math.min(8, Number(e.target.value) || 1)) })}
                  style={{ width: 64 }}
                />
              </label>

              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                Court 1:
                <input
                  type="text"
                  value={state.courtNumbers?.[0] ?? "1"}
                  onChange={(e) => {
                    const v = e.target.value || "";
                    update({ courtNumbers: [v, state.courtNumbers?.[1] ?? "2"] });
                  }}
                  style={{ width: 100 }}
                />
              </label>

              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                Court 2:
                <input
                  type="text"
                  value={state.courtNumbers?.[1] ?? "2"}
                  onChange={(e) => {
                    const v = e.target.value || "";
                    update({ courtNumbers: [state.courtNumbers?.[0] ?? "1", v] });
                  }}
                  style={{ width: 100 }}
                />
              </label>

              <button onClick={generateSchedule}>Generate Double Round-Robin Schedule</button>
              <button onClick={() => update({ rounds: [] })}>Clear Schedule</button>
            </div>
            <Schedule state={state} update={update} />
          </div>

          <Standings state={state} update={update} />
        </div>
      </main>

      <footer>
        <small>Tiebreakers: wins → point difference (PF - PA) → PF → team name. Scores and teams are editable. Data saved in localStorage.</small>
      </footer>
    </div>
  );
}