import React from "react";

/**
 * Teams UI — simplified, without a "Remove" button or related functionality.
 * Props:
 *  - state: app state
 *  - update: function to update top-level state
 *  - createTeamsFromSlots: creates teams from the 8 slots
 */
export default function Teams({ state, update, createTeamsFromSlots }) {
  const updateTeam = (idx, patch) => {
    const teams = state.teams ? [...state.teams] : [];
    teams[idx] = { ...teams[idx], ...patch };
    update({ teams });
  };

  const updatePlayer = (teamIdx, playerIdx, value) => {
    const teams = state.teams ? [...state.teams] : [];
    const team = { ...teams[teamIdx], players: [...(teams[teamIdx].players || [])] };
    team.players[playerIdx] = value;
    teams[teamIdx] = team;
    update({ teams });
  };

  return (
    <div className="card">
      <h2>Teams</h2>

      <div className="controls actions">
        <button onClick={createTeamsFromSlots}>Create Teams from Slots</button>
        <button
          className="secondary"
          onClick={() => update({ teams: [], rounds: [] })}
        >
          Clear Teams
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        {(!state.teams || state.teams.length === 0) && (
          <p className="muted">No teams yet. Use "Create Teams from Slots" to build teams.</p>
        )}

        {state.teams &&
          state.teams.map((t, idx) => (
            <div className="team-card" key={t.id || idx}>
              <input
                className="team-name"
                value={t.name}
                onChange={(e) => updateTeam(idx, { name: e.target.value })}
                aria-label={`Team ${idx + 1} name`}
              />
              <input
                className="team-player"
                value={t.players?.[0] || ""}
                onChange={(e) => updatePlayer(idx, 0, e.target.value)}
                aria-label={`Team ${idx + 1} player 1`}
              />
              <input
                className="team-player"
                value={t.players?.[1] || ""}
                onChange={(e) => updatePlayer(idx, 1, e.target.value)}
                aria-label={`Team ${idx + 1} player 2`}
              />
            </div>
          ))}
      </div>
    </div>
  );
}