```markdown
# Pickleball Scheduler (React)

This is a React + Vite single-page app migrated from a small vanilla JS prototype.

Features
- Choose from default players (Rajesh, Tarun, Kulwinder, Kishore, Anuroop, Anuj, Shantha, Saketh, Xavier, Rohit) or add more.
- Fill exactly 8 player slots and make 4 teams (2 players each).
- Optional team name prefix, and full editing of team names/players.
- Generate a double round-robin league where each team plays every other team twice (12 league matches).
- Schedule matches across a configurable number of courts (default 2).
- Enter scores inline — no extra "add score" button. Scores saved in localStorage and editable.
- Standings computed by wins, tiebreaker by point difference (PF - PA), then PF, then team name.
- Create Finals (top 2) and 3rd-place match (bottom 2) after the league.
- Everything stored in localStorage under key `pbs_react_state_v1`.

How to run (locally)
1. Install dependencies:
   npm install

2. Start dev server:
   npm run dev

3. Open http://localhost:5173 (or the port Vite prints).

How to add to your repository
- Create branch `react-conversion`.
- Add these files, commit, push the branch, and open a pull request.
```