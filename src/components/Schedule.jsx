import React from "react";

/**
 * Schedule component — ensure finals / 3rd-place buttons stay disabled
 * until all league games have scores entered.
 *
 * Props:
 *  - state: app state (contains rounds)
 *  - update: function to update top-level state
 */
export default function Schedule({ state, update }) {
  // helper: consider a score "entered" if it's not null/undefined and not an empty string
  const isScoreEntered = (val) => val !== null && val !== undefined && String(val).trim() !== "";

  // return true only when every league match has both scores entered
  const allLeagueGamesScored = () => {
    if (!state.rounds || state.rounds.length === 0) return false;
    for (const r of state.rounds) {
      if (!r.matches) continue;
      for (const m of r.matches) {
        if (m.league) {
          if (!isScoreEntered(m.scoreA) || !isScoreEntered(m.scoreB)) {
            return false;
          }
        }
      }
    }
    return true;
  };

  // Disable finals/3rd-place actions until all league games have scores
  const finalsDisabled = !allLeagueGamesScored();

  const handleCreateFinals = () => {
    if (!allLeagueGamesScored()) {
      alert("Enter scores for all league games before creating Finals / 3rd-place matches.");
      return;
    }
    // compute standings
    const table = {};
    state.teams.forEach((t) => (table[t.id] = { teamId: t.id, teamName: t.name, wins: 0, played: 0, PF: 0, PA: 0 }));
    for (const r of state.rounds) {
      for (const m of r.matches) {
        if (m.league === false) continue;
        if (m.scoreA == null || m.scoreB == null) continue;
        const a = table[m.homeTeamId], b = table[m.awayTeamId];
        if (!a || !b) continue;
        a.played++; b.played++;
        a.PF += m.scoreA; a.PA += m.scoreB;
        b.PF += m.scoreB; b.PA += m.scoreA;
        if (m.scoreA > m.scoreB) a.wins++;
        if (m.scoreB > m.scoreA) b.wins++;
      }
    }
    Object.values(table).forEach((r) => (r.PD = r.PF - r.PA));
    const sorted = Object.values(table).sort((x, y) => {
      if (y.wins !== x.wins) return y.wins - x.wins;
      if (y.PD !== x.PD) return y.PD - x.PD;
      if (y.PF !== x.PF) return y.PF - x.PF;
      return x.teamName.localeCompare(y.teamName);
    });
    if (sorted.length < 4) {
      alert("Need 4 teams to create playoffs");
      return;
    }
    const top2 = [sorted[0].teamId, sorted[1].teamId];
    const bottom2 = [sorted[sorted.length - 2].teamId, sorted[sorted.length - 1].teamId];
    const cleaned = state.rounds.filter((r) => r.matches.every((m) => m.league !== false));
    cleaned.push({
      roundName: "3rd Place & Final",
      matches: [
        { id: "P-3rd", homeTeamId: bottom2[0], awayTeamId: bottom2[1], court: 1, scoreA: null, scoreB: null, league: false, title: "3rd Place" },
        { id: "P-Final", homeTeamId: top2[0], awayTeamId: top2[1], court: 2, scoreA: null, scoreB: null, league: false, title: "Final" }
      ]
    });
    update({ rounds: cleaned });
  };

  const handleCreateThirdPlace = () => {
    if (!allLeagueGamesScored()) {
      alert("Enter scores for all league games before creating Finals / 3rd-place matches.");
      return;
    }
    // compute standings
    const table = {};
    state.teams.forEach((t) => (table[t.id] = { teamId: t.id, teamName: t.name, wins: 0, played: 0, PF: 0, PA: 0 }));
    for (const r of state.rounds) {
      for (const m of r.matches) {
        if (m.league === false) continue;
        if (m.scoreA == null || m.scoreB == null) continue;
        const a = table[m.homeTeamId], b = table[m.awayTeamId];
        if (!a || !b) continue;
        a.played++; b.played++;
        a.PF += m.scoreA; a.PA += m.scoreB;
        b.PF += m.scoreB; b.PA += m.scoreA;
        if (m.scoreA > m.scoreB) a.wins++;
        if (m.scoreB > m.scoreA) b.wins++;
      }
    }
    Object.values(table).forEach((r) => (r.PD = r.PF - r.PA));
    const sorted = Object.values(table).sort((x, y) => {
      if (y.wins !== x.wins) return y.wins - x.wins;
      if (y.PD !== x.PD) return y.PD - x.PD;
      if (y.PF !== x.PF) return y.PF - x.PF;
      return x.teamName.localeCompare(y.teamName);
    });
    if (sorted.length < 4) {
      alert("Need 4 teams to create playoffs");
      return;
    }
    const top2 = [sorted[0].teamId, sorted[1].teamId];
    const bottom2 = [sorted[sorted.length - 2].teamId, sorted[sorted.length - 1].teamId];
    const cleaned = state.rounds.filter((r) => r.matches.every((m) => m.league !== false));
    cleaned.push({
      roundName: "3rd Place & Final",
      matches: [
        { id: "P-3rd", homeTeamId: bottom2[0], awayTeamId: bottom2[1], court: 1, scoreA: null, scoreB: null, league: false, title: "3rd Place" },
        { id: "P-Final", homeTeamId: top2[0], awayTeamId: top2[1], court: 2, scoreA: null, scoreB: null, league: false, title: "Final" }
      ]
    });
    update({ rounds: cleaned });
  };

  // new combined handler that ensures validation and then creates playoffs
  const handleCreatePlayoffs = () => {
    if (!allLeagueGamesScored()) {
      alert("Enter scores for all league games before creating Playoffs (Final & 3rd-place).");
      return;
    }
    // reuse existing logic that constructs both 3rd place and final
    handleCreateFinals();
  };

  const setScore = (matchId, side, value) => {
    const rounds = state.rounds.map((r) => ({
      ...r,
      matches: r.matches.map((m) => {
        if (m.id !== matchId) return m;
        const n = value === "" ? null : parseInt(value, 10);
        return side === "a" ? { ...m, scoreA: isNaN(n) ? null : n } : { ...m, scoreB: isNaN(n) ? null : n };
      })
    }));
    update({ rounds });
  };

  const swapTeams = (matchId) => {
    const rounds = state.rounds.map((r) => ({
      ...r,
      matches: r.matches.map((m) => {
        if (m.id !== matchId) return m;
        return { ...m, homeTeamId: m.awayTeamId, awayTeamId: m.homeTeamId, scoreA: m.scoreB, scoreB: m.scoreA };
      })
    }));
    update({ rounds });
  };

  if (!state.rounds || state.rounds.length === 0) {
    return <div className="muted">No schedule yet. Generate schedule to see matches here.</div>;
  }

  return (
    <div>
      {state.rounds.map((r) => (
        <div key={r.roundName} className="round">
          <h4>{r.roundName}</h4>
          {r.matches.map((m) => (
            <div key={m.id} className="match">
              <div className="team">{teamName(state, m.homeTeamId)}</div>
              <input className="score" type="number" value={m.scoreA ?? ""} onChange={(e) => setScore(m.id, "a", e.target.value)} />
              <div className="vs">vs</div>
              <input className="score" type="number" value={m.scoreB ?? ""} onChange={(e) => setScore(m.id, "b", e.target.value)} />
              <div className="team">{teamName(state, m.awayTeamId)}</div>
              <div className="muted">Court {m.court}</div>
              <button className="secondary" onClick={() => swapTeams(m.id)}>Swap teams</button>
            </div>
          ))}
        </div>
      ))}
      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={handleCreatePlayoffs} disabled={finalsDisabled} title={finalsDisabled ? "Enter all league scores first" : "Create Final & 3rd-place"}>
          Create Playoffs (Final & 3rd-place)
        </button>

        {/* ...any other action buttons ... */}
      </div>
    </div>
  );
}

function teamName(state, id) {
  const t = state.teams.find((x) => x.id === id);
  return t ? t.name : id;
}