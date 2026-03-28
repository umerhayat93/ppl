const socket = new WebSocket("wss://ppl2026-backend.onrender.com");

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "live_update") {
    updateOverlay(data.payload);
  }
};

function updateOverlay(d) {
  if (!d) return;

  document.getElementById("teams").innerText =
    d.battingFirst + " v " + d.bowlingFirst;

  document.getElementById("score").innerText =
    `${d.runs}-${d.wickets}`;

  const overs = Math.floor(d.balls / 6) + "." + (d.balls % 6);
  document.getElementById("overs").innerText = overs;

  document.getElementById("striker").innerText =
    `${d.striker.name} ${d.striker.runs} ${d.striker.balls}`;

  document.getElementById("nonstriker").innerText =
    `${d.nonstriker.name} ${d.nonstriker.runs} ${d.nonstriker.balls}`;

  const b = d.currentBowler;
  document.getElementById("bowler").innerText =
    `${b.name} ${b.wickets}-${b.runsConceded} ${Math.floor(b.ballsBowled/6)}.${b.ballsBowled%6}`;

  // THIS OVER
  const ballsDiv = document.getElementById("balls");
  ballsDiv.innerHTML = "";

  const last6 = d.lastBalls.slice(-6);

  last6.forEach(ball => {
    const el = document.createElement("div");
    el.classList.add("ball");

    if (ball === "4") el.classList.add("four");
    if (ball === "6") el.classList.add("six");
    if (ball === "W") el.classList.add("wicket");

    el.innerText = ball;
    ballsDiv.appendChild(el);
  });

  // REQUIRED RATE
  if (d.requiredRate) {
    document.getElementById("required").innerText =
      "REQ " + d.requiredRate.toFixed(2);
  }
}
