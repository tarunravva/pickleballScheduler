// Defensive, reliable round-robin + double round-robin scheduler.
// Exports a named function generateDoubleRoundRobin used by App.jsx.

function roundRobin(teamIds) {
  // standard circle method
  const teams = [...teamIds];
  const odd = teams.length % 2 === 1;
  if (odd) teams.push(null); // null = bye

  const n = teams.length;
  const rounds = [];

  for (let round = 0; round < n - 1; round++) {
    const matches = [];
    for (let i = 0; i < n / 2; i++) {
      const a = teams[i];
      const b = teams[n - 1 - i];
      if (a !== null && b !== null) {
        matches.push({ home: a, away: b });
      }
    }
    rounds.push({ roundName: `Round ${round + 1}`, matches });
    // rotate (keep first fixed)
    teams.splice(1, 0, teams.pop());
  }

  return rounds;
}

export function generateDoubleRoundRobin(teams, numCourts = 2, courtNumbers = [1, 2]) {
  if (!teams || !Array.isArray(teams) || teams.length === 0) {
    console.warn("generateDoubleRoundRobin: no teams provided");
    return [];
  }

  // normalize team identifiers (accept array of objects or strings)
  const teamIds = teams.map((t) => {
    if (typeof t === "string") return t;
    if (t && typeof t === "object") return t.id ?? t.name ?? JSON.stringify(t);
    return String(t);
  });

  // build single round-robin (each pair once)
  const singleRounds = roundRobin(teamIds);

  // determine courts to use (respect provided courtNumbers and numCourts)
  const courts =
    Array.isArray(courtNumbers) && courtNumbers.length > 0
      ? courtNumbers.slice(0, Math.max(1, numCourts || 1))
      : Array.from({ length: Math.max(1, numCourts || 1) }, (_, i) => i + 1);

  const rounds = [];

  // Two passes: first (home as listed), second (swap home/away) => double round-robin
  for (let pass = 0; pass < 2; pass++) {
    singleRounds.forEach((r) => {
      const matches = r.matches.map((m, i) => {
        const court = courts[i % courts.length];
        return {
          id: `${r.roundName.replace(/\s+/g, "_")}-m${i + 1}-p${pass + 1}`,
          homeTeamId: pass === 0 ? m.home : m.away,
          awayTeamId: pass === 0 ? m.away : m.home,
          court,
          scoreA: null,
          scoreB: null,
          league: true
        };
      });
      rounds.push({
        roundName: pass === 0 ? r.roundName : `${r.roundName} (return)`,
        matches
      });
    });
  }

  return rounds;
}