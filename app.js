// Simple single-file logic for the scheduler.
// Data model in localStorage under key "pbs_data"

const DEFAULT_PLAYERS = [
  "Rajesh","Tarun","Kulwinder","Kishore","Anuroop",
  "Anuj","Shantha","Saketh","Xavier","Rohit"
];

let state = {
  availablePlayers: [...DEFAULT_PLAYERS],
  slots: Array(8).fill(""),
  teams: [], // {id, name, players:[p1,p2]}
  rounds: [], // [{roundName, matches:[{id, homeTeamId, awayTeamId, court, scoreA, scoreB, league:true/false}]}]
  numCourts: 2
};

const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));

function save() {
  localStorage.setItem("pbs_data", JSON.stringify(state));
}

function load() {
  const raw = localStorage.getItem("pbs_data");
  if (raw) {
    try { state = JSON.parse(raw); } catch(e){}
  }
}

function init(){
  load();
  bindUI();
  renderAvailablePlayers();
  renderSlots();
  renderTeams();
  renderSchedule();
  renderStandings();
}

function bindUI(){
  qs("#addPlayerBtn").addEventListener("click", () => {
    const name = qs("#newPlayerName").value.trim();
    if (!name) return alert("Enter a player name");
    if (!state.availablePlayers.includes(name)) state.availablePlayers.push(name);
    qs("#newPlayerName").value = "";
    renderAvailablePlayers();
    save();
  });

  qs("#fillDefaultBtn").addEventListener("click", () => {
    state.slots = DEFAULT_PLAYERS.slice(0,8);
    renderSlots();
    save();
  });

  qs("#randomizeBtn").addEventListener("click", () => {
    const pool = Array.from(new Set(state.availablePlayers));
    if (pool.length < 8) {
      alert("You need at least 8 distinct available players.");
      return;
    }
    shuffle(pool);
    state.slots = pool.slice(0,8);
    renderSlots();
    save();
  });

  qs("#makeTeamsBtn").addEventListener("click", () => {
    const nCourts = parseInt(qs("#numCourts").value) || 2;
    state.numCourts = Math.max(1, Math.min(4, nCourts));
    // Create teams by pairing slots 0+1, 2+3, 4+5, 6+7
    const prefix = qs("#teamNamePrefix").value.trim();
    if (state.slots.some(s => !s)) return alert("Please fill all 8 player slots first");
    const t = [];
    for (let i=0;i<4;i++){
      const players = [state.slots[i*2], state.slots[i*2+1]];
      t.push({id: `T${i+1}`, name: prefix ? `${prefix} ${i+1}` : `Team ${i+1}`, players});
    }
    state.teams = t;
    state.rounds = [];
    renderTeams();
    renderSchedule();
    renderStandings();
    save();
    qs("#teams").classList.remove("hidden");
    qs("#schedule").classList.add("hidden");
    qs("#standings").classList.remove("hidden");
  });

  qs("#generateScheduleBtn").addEventListener("click", () => {
    if (state.teams.length !== 4) return alert("You need 4 teams to make the schedule");
    state.rounds = generateDoubleRoundRobin(state.teams, state.numCourts);
    renderSchedule();
    save();
    qs("#schedule").classList.remove("hidden");
    qs("#standings").classList.remove("hidden");
  });

  qs("#regenerateFromSlotsBtn").addEventListener("click", () => {
    if (state.slots.some(s => !s)) return alert("Fill 8 player slots first");
    // Recreate teams (pairing)
    for (let i=0;i<4;i++){
      const tId = `T${i+1}`;
      const players = [state.slots[i*2], state.slots[i*2+1]];
      const existing = state.teams.find(t => t.id === tId);
      if (existing) { existing.players = players; }
      else state.teams.push({id:tId, name:`Team ${i+1}`, players});
    }
    renderTeams();
    save();
  });

  qs("#computeStandingsBtn").addEventListener("click", () => {
    renderStandings();
    save();
  });

  qs("#scheduleFinalsBtn").addEventListener("click", () => {
    createFinalsAndThirdPlace();
    renderSchedule();
    renderStandings();
    save();
  });

  qs("#resetAllBtn").addEventListener("click", () => {
    if (!confirm("Reset everything? This clears local storage for the scheduler.")) return;
    localStorage.removeItem("pbs_data");
    state = {
      availablePlayers: [...DEFAULT_PLAYERS],
      slots: Array(8).fill(""),
      teams: [],
      rounds: [],
      numCourts: 2
    };
    renderAvailablePlayers();
    renderSlots();
    renderTeams();
    renderSchedule();
    renderStandings();
  });

  // dynamic delegates
  qs("#availablePlayers").addEventListener("click", (ev) => {
    if (ev.target.classList.contains("chip")) {
      const name = ev.target.dataset.name;
      // put into first empty slot
      const idx = state.slots.indexOf("") ;
      const existingSlot = state.slots.indexOf(name);
      if (existingSlot !== -1) {
        // if already in slots, toggle selection highlight only
        return;
      }
      if (idx === -1) return alert("All 8 slots are full. Remove or change slots first.");
      state.slots[idx] = name;
      renderSlots();
      save();
    }
  });

  qs("#playerSlots").addEventListener("change", (ev) => {
    // select boxes in slots changed
    if (ev.target.dataset.slot !== undefined) {
      const idx = parseInt(ev.target.dataset.slot);
      state.slots[idx] = ev.target.value;
      save();
    }
  });

  qs("#playerSlots").addEventListener("click", (ev) => {
    // remove from slot
    if (ev.target.classList.contains("remove-slot")) {
      const idx = parseInt(ev.target.dataset.slot);
      state.slots[idx] = "";
      renderSlots();
      save();
    }
  });

  qs("#teamsContainer").addEventListener("input", (ev) => {
    // team name change
    if (ev.target.classList.contains("team-name")) {
      const id = ev.target.dataset.team;
      const t = state.teams.find(x=>x.id===id);
      if (t) t.name = ev.target.value;
      save();
      renderStandings();
    }
  });

  qs("#teamsContainer").addEventListener("change", (ev) => {
    // team player selects changed
    if (ev.target.classList.contains("team-player")) {
      const id = ev.target.dataset.team;
      const slot = parseInt(ev.target.dataset.slot);
      const t = state.teams.find(x=>x.id===id);
      if (t) {
        t.players[slot] = ev.target.value;
        save();
        renderStandings();
      }
    }
  });

  qs("#roundsContainer").addEventListener("input", (ev) => {
    // scores inline inputs
    if (ev.target.classList.contains("score-input")) {
      const matchId = ev.target.dataset.match;
      const side = ev.target.dataset.side; // a or b
      const val = ev.target.value;
      const match = findMatchById(matchId);
      if (!match) return;
      const n = parseInt(val);
      if (isNaN(n) && val !== "") {
        // allow blank
      } else {
        if (side === 'a') match.scoreA = val === "" ? null : n;
        else match.scoreB = val === "" ? null : n;
        save();
        renderStandings();
      }
    }
  });

  qs("#roundsContainer").addEventListener("click", (ev) => {
    if (ev.target.classList.contains("swap-teams")) {
      const matchId = ev.target.dataset.match;
      const match = findMatchById(matchId);
      if (!match) return;
      const tmp = match.homeTeamId;
      match.homeTeamId = match.awayTeamId;
      match.awayTeamId = tmp;
      // swap scores too
      const tmpS = match.scoreA; match.scoreA = match.scoreB; match.scoreB = tmpS;
      save();
      renderSchedule();
      renderStandings();
    }
  });
}

function renderAvailablePlayers(){
  const el = qs("#availablePlayers");
  el.innerHTML = "";
  state.availablePlayers.forEach(p => {
    const d = document.createElement("div");
    d.className = "chip";
    d.textContent = p;
    d.dataset.name = p;
    el.appendChild(d);
  });
}

function renderSlots(){
  const el = qs("#playerSlots");
  el.innerHTML = "";
  for (let i=0;i<8;i++){
    const sdiv = document.createElement("div");
    sdiv.className = "slot";
    const sel = document.createElement("select");
    sel.dataset.slot = i;
    const emptyOpt = document.createElement("option");
    emptyOpt.value = ""; emptyOpt.textContent = "(empty)";
    sel.appendChild(emptyOpt);
    // options include available + current value (to avoid drop)
    const opts = Array.from(new Set([...state.availablePlayers, state.slots[i]]));
    opts.forEach(p => {
      if (!p) return;
      const o = document.createElement("option"); o.value = p; o.textContent = p;
      if (p === state.slots[i]) o.selected = true;
      sel.appendChild(o);
    });
    sdiv.appendChild(sel);

    const remove = document.createElement("button");
    remove.textContent = "x"; remove.className="remove-slot";
    remove.dataset.slot = i;
    sdiv.appendChild(remove);

    el.appendChild(sdiv);
  }
}

function renderTeams(){
  const el = qs("#teamsContainer");
  el.innerHTML = "";
  if (!state.teams || state.teams.length === 0) {
    el.innerHTML = `<p>No teams yet. Create teams from player slots first.</p>`;
    return;
  }
  state.teams.forEach(t=>{
    const card = document.createElement("div");
    card.className = "team-card";
    const h = document.createElement("h4");
    h.textContent = t.name;
    card.appendChild(h);

    const nameInput = document.createElement("input");
    nameInput.value = t.name;
    nameInput.className = "team-name";
    nameInput.dataset.team = t.id;
    card.appendChild(nameInput);

    t.players.forEach((p, idx) => {
      const sel = document.createElement("select");
      sel.className = "team-player";
      sel.dataset.team = t.id;
      sel.dataset.slot = idx;
      const all = Array.from(new Set([...state.availablePlayers, ...state.slots]));
      const emptyOpt = document.createElement("option"); emptyOpt.value = ""; emptyOpt.textContent="(empty)";
      sel.appendChild(emptyOpt);
      all.forEach(name=>{
        if (!name) return;
        const o = document.createElement("option"); o.value = name; o.textContent = name;
        if (name === p) o.selected = true;
        sel.appendChild(o);
      });
      card.appendChild(sel);
    });

    el.appendChild(card);
  });
}

function renderSchedule(){
  const el = qs("#roundsContainer");
  el.innerHTML = "";
  if (!state.rounds || state.rounds.length === 0) {
    el.innerHTML = "<p>No schedule yet. Generate schedule after creating teams.</p>";
    return;
  }
  state.rounds.forEach(round=>{
    const rdiv = document.createElement("div");
    rdiv.className = "round";
    const title = document.createElement("h4");
    title.textContent = round.roundName;
    rdiv.appendChild(title);

    round.matches.forEach(m=>{
      const mdiv = document.createElement("div");
      mdiv.className = "match";
      const teamA = document.createElement("div"); teamA.className = "team";
      teamA.textContent = teamNameById(m.homeTeamId);
      const inputA = document.createElement("input");
      inputA.className = "score-input score";
      inputA.type = "number";
      inputA.value = m.scoreA != null ? m.scoreA : "";
      inputA.dataset.match = m.id;
      inputA.dataset.side = "a";

      const vs = document.createElement("div"); vs.textContent = "vs";

      const inputB = document.createElement("input");
      inputB.className = "score-input score";
      inputB.type = "number";
      inputB.value = m.scoreB != null ? m.scoreB : "";
      inputB.dataset.match = m.id;
      inputB.dataset.side = "b";

      const teamB = document.createElement("div"); teamB.className = "team";
      teamB.textContent = teamNameById(m.awayTeamId);

      const courtInfo = document.createElement("div");
      courtInfo.textContent = `Court ${m.court}`;
      courtInfo.className = "muted";

      const swapBtn = document.createElement("button");
      swapBtn.textContent = "Swap teams";
      swapBtn.className = "swap-teams secondary";
      swapBtn.dataset.match = m.id;

      mdiv.appendChild(teamA);
      mdiv.appendChild(inputA);
      mdiv.appendChild(vs);
      mdiv.appendChild(inputB);
      mdiv.appendChild(teamB);
      mdiv.appendChild(courtInfo);
      mdiv.appendChild(swapBtn);

      rdiv.appendChild(mdiv);
    });

    el.appendChild(rdiv);
  });
}

function teamNameById(id){
  const t = state.teams.find(x=>x.id===id);
  return t ? t.name : id;
}

function generateDoubleRoundRobin(teams, numCourts){
  // Using circle method for even number of teams (4).
  // First create single round-robin rounds, then duplicate for second leg.
  const tIds = teams.map(t=>t.id);
  const singleRounds = roundRobin(tIds);
  // singleRounds is array of rounds, each round is array of pairs [a,b]
  const rounds = [];
  singleRounds.forEach((pairs, idx)=>{
    // create round object
    const matches = pairs.map((pair, i) => ({
      id: `L${idx+1}-${i+1}`,
      homeTeamId: pair[0],
      awayTeamId: pair[1],
      court: (i % numCourts) + 1,
      scoreA: null, scoreB: null,
      league: true
    }));
    rounds.push({roundName: `Round ${idx+1}`, matches});
  });
  // second half: reverse home/away
  singleRounds.forEach((pairs, idx)=>{
    const matches = pairs.map((pair, i) => ({
      id: `L${idx+1+singleRounds.length}-${i+1}`,
      homeTeamId: pair[1],
      awayTeamId: pair[0],
      court: (i % numCourts) + 1,
      scoreA: null, scoreB: null,
      league: true
    }));
    rounds.push({roundName: `Round ${idx+1+singleRounds.length}`, matches});
  });
  return rounds;
}

function roundRobin(teamIds){
  // classic algorithm for even teams
  const n = teamIds.length;
  if (n % 2 !== 0) teamIds.push(null);
  const rounds = [];
  const teams = teamIds.slice();
  const fixed = teams[0];
  let rotating = teams.slice(1);
  for (let r=0;r<n-1;r++){
    const pairs = [];
    const left = [fixed, ...rotating.slice(0, Math.floor((n-1)/2))];
    const right = [...rotating.slice(Math.floor((n-1)/2)).reverse()];
    for (let i=0;i<left.length;i++){
      const a = left[i], b = right[i];
      if (a && b) pairs.push([a,b]);
    }
    rounds.push(pairs);
    // rotate
    rotating.unshift(rotating.pop());
  }
  return rounds;
}

function shuffle(a){
  for (let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
}

function findMatchById(id){
  for (const r of state.rounds){
    for (const m of r.matches){
      if (m.id === id) return m;
    }
  }
  return null;
}

function computeStandings(){
  // For each team: wins, played, PF, PA, PD
  const table = {};
  state.teams.forEach(t => table[t.id] = {teamId:t.id, teamName:t.name, wins:0, played:0, PF:0, PA:0});
  for (const r of state.rounds){
    for (const m of r.matches){
      if (!m.league) continue;
      const a = m.homeTeamId, b = m.awayTeamId;
      if (!table[a] || !table[b]) continue;
      if (m.scoreA == null || m.scoreB == null) continue; // match not completed
      table[a].played++; table[b].played++;
      table[a].PF += m.scoreA; table[a].PA += m.scoreB;
      table[b].PF += m.scoreB; table[b].PA += m.scoreA;
      if (m.scoreA > m.scoreB) table[a].wins++;
      else if (m.scoreB > m.scoreA) table[b].wins++;
      // ties are possible? We'll count no wins for tie.
    }
  }
  // Convert to array and sort by wins desc, then PD, then PF, then team name asc
  const arr = Object.values(table);
  arr.forEach(r => r.PD = r.PF - r.PA);
  arr.sort((x,y) => {
    if (y.wins !== x.wins) return y.wins - x.wins;
    if (y.PD !== x.PD) return y.PD - x.PD;
    if (y.PF !== x.PF) return y.PF - x.PF;
    return x.teamName.localeCompare(y.teamName);
  });
  return arr;
}

function renderStandings(){
  qs("#standings").classList.remove("hidden");
  const tbody = qs("#standingsTable tbody");
  tbody.innerHTML = "";
  if (state.teams.length === 0) return;
  const arr = computeStandings();
  arr.forEach((row, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${idx+1}</td><td>${row.teamName}</td><td>${row.wins}</td><td>${row.played}</td><td>${row.PF}</td><td>${row.PA}</td><td>${row.PD}</td>`;
    tbody.appendChild(tr);
  });
}

function createFinalsAndThirdPlace(){
  // Determine top2 and bottom2 by current standings (league matches only)
  const s = computeStandings();
  if (s.length < 4) return alert("You need 4 teams for finals");
  const top2 = s.slice(0,2).map(x=>x.teamId);
  const bottom2 = s.slice(-2).map(x=>x.teamId);

  // Append a "Playoffs" section to rounds
  // Remove existing finals if any (non-league marked)
  state.rounds = state.rounds.filter(r => r.matches.every(m => m.league));
  const playoffRound = {
    roundName: "3rd Place & Final",
    matches: [
      {
        id: "P-3rd",
        homeTeamId: bottom2[0],
        awayTeamId: bottom2[1],
        court: 1,
        scoreA: null, scoreB: null,
        league: false,
        title: "3rd Place"
      },
      {
        id: "P-Final",
        homeTeamId: top2[0],
        awayTeamId: top2[1],
        court: 2,
        scoreA: null, scoreB: null,
        league: false,
        title: "Final"
      }
    ]
  };
  state.rounds.push(playoffRound);
  save();
  alert("Playoffs created: top 2 -> Final, bottom 2 -> 3rd place. Enter scores inline.");
}

window.addEventListener("load", () => {
  document.body.classList.add("pbs-theme");
  init();
});