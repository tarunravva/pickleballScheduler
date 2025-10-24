import React from "react";

/*
  Compute standings from state.rounds and state.teams.
*/

export default function Standings({ state }) {
  const rows = computeStandings(state);

  return (
    <section className={`card ${rows.length ? "" : "hidden"}`} style={{ marginTop: 12 }}>
      <h2>Standings</h2>
      <table id="standingsTable">
        <thead>
          <tr><th>Rank</th><th>Team</th><th>Wins</th><th>Played</th><th>PF</th><th>PA</th><th>PD</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.teamId}>
              <td>{i + 1}</td>
              <td>{r.teamName}</td>
              <td>{r.wins}</td>
              <td>{r.played}</td>
              <td>{r.PF}</td>
              <td>{r.PA}</td>
              <td>{r.PD}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function computeStandings(state) {
  if (!state.teams) return [];
  const table = {};
  state.teams.forEach((t) => (table[t.id] = { teamId: t.id, teamName: t.name, wins: 0, played: 0, PF: 0, PA: 0 }));
  for (const r of state.rounds || []) {
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
  return Object.values(table).sort((x, y) => {
    if (y.wins !== x.wins) return y.wins - x.wins;
    if (y.PD !== x.PD) return y.PD - x.PD;
    if (y.PF !== x.PF) return y.PF - x.PF;
    return x.teamName.localeCompare(y.teamName);
  });
}