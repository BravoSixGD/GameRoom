import {
  login,
  db,
  ref,
  get,
  set,
  update,
  onValue,
  onDisconnect,
  auth
} from "./core/firebase.js";

import {
  catalog,
  initialState
} from "./core/games.js";


const $ = s => document.querySelector(s);

const screens = [
  "landing",
  "slotScreen",
  "lobby",
  "gameScreen"
];

const reactions = ["❤️", "😂", "😭", "😡", "👏"];

const questions = [
  ["Always be 10 minutes late", "Always be 20 minutes early"],
  ["Explore space", "Explore the deep ocean"],
  ["Give up music for a year", "Give up movies for a year"],
  ["Have unlimited travel", "Have unlimited food delivery"],
  ["Know every language", "Play every instrument"],
  ["Live by the beach", "Live in the mountains"],
  ["Only text for a week", "Only voice-call for a week"],
  ["Rewatch a favorite", "Try something completely new"],
  ["Have a pause button", "Have a rewind button"],
  ["Plan every trip", "Travel completely spontaneously"],
  ["Always know the weather", "Always know the traffic"],
  ["Have breakfast for every meal", "Never eat breakfast food again"],
  ["Visit the past", "Visit the future"],
  ["Be able to fly", "Be able to breathe underwater"],
  ["Have a personal chef", "Have a personal driver"],
  ["Live without music", "Live without movies"],
  ["Always have perfect Wi-Fi", "Always have a fully charged phone"],
  ["Travel somewhere new every month", "Return to your favorite place every month"],
  ["Be extremely lucky", "Be extremely talented"],
  ["Read minds", "See ten minutes into the future"]
];


let room = null;
let roomCode = null;
let mySlot = null;
let nickname = "";
let unsub = null;
let lastReaction = 0;
let sound = true;
let selectedGame = null;


/* --------------------------------------------------
   GENERAL HELPERS
-------------------------------------------------- */

const show = id => {
  screens.forEach(screen => {
    $("#" + screen).classList.toggle("hidden", screen !== id);
  });
};

const toast = text => {
  const el = $("#toast");

  el.textContent = text;
  el.classList.remove("hidden");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    el.classList.add("hidden");
  }, 1900);
};

const makeCode = () =>
  Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();

const cleanName = value =>
  (value || "")
    .trim()
    .slice(0, 18);

function roomRef(path = "") {
  return ref(
    db,
    `rooms/${roomCode}${path ? "/" + path : ""}`
  );
}

function other(slot = mySlot) {
  return slot === "A" ? "B" : "A";
}

function playerName(slot) {
  return room?.players?.[slot]?.name || `Player ${slot}`;
}

function gameById(id) {
  return catalog.find(game => game.id === id);
}


/* --------------------------------------------------
   STARTUP
-------------------------------------------------- */

async function boot() {
  await login();

  renderTiles();
  renderReactions();

  const inviteCode =
    new URLSearchParams(location.search).get("room");

  if (inviteCode) {
    $("#roomCode").value =
      inviteCode.toUpperCase();
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .catch(() => {});
  }
}


/* --------------------------------------------------
   GAME TILES
-------------------------------------------------- */

function renderTiles() {
  $("#gameTiles").innerHTML =
    catalog.map(game => `
      <button
        class="tile"
        data-game="${game.id}"
        aria-label="${game.name}"
      >
        <span class="emoji">${game.emoji}</span>
        <b>${game.name}</b>
      </button>
    `).join("");
}


function openGameInfo(gameId) {
  const game = gameById(gameId);

  if (!game) return;

  selectedGame = gameId;

  $("#gameInfoEmoji").textContent =
    game.emoji;

  $("#gameInfoTitle").textContent =
    game.name;

  $("#gameInfoDescription").textContent =
    game.subtitle;

  $("#gameInfoRules").textContent =
    game.rules;

  $("#gameInfoDialog").showModal();
}


function closeGameInfo() {
  $("#gameInfoDialog").close();
}


/* --------------------------------------------------
   REACTIONS
-------------------------------------------------- */

function renderReactions() {
  for (const id of [
    "lobbyReactions",
    "gameReactions"
  ]) {
    $("#" + id).innerHTML =
      reactions.map(emoji => `
        <button
          class="reaction"
          data-reaction="${emoji}"
          aria-label="Send ${emoji}"
        >
          ${emoji}
        </button>
      `).join("");
  }
}


async function react(emoji) {
  if (!roomCode || !mySlot) return;

  await set(
    roomRef("reaction"),
    {
      from: mySlot,
      emoji,
      at: Date.now()
    }
  );
}


/* --------------------------------------------------
   ROOM CREATION / JOINING
-------------------------------------------------- */

async function createRoom() {
  nickname =
    cleanName($("#nickname").value);

  if (!nickname) {
    return landingMessage(
      "Enter a nickname first."
    );
  }

  roomCode = makeCode();
  mySlot = "A";

  const data = {
    createdAt: Date.now(),

    players: {
      A: {
        uid: auth.currentUser.uid,
        name: nickname,
        online: true,
        lastSeen: Date.now()
      },
      B: ""
    },

    challenge: "",

    activeGame: "",

    stats: {
      A: {
        wins: 0
      },
      B: {
        wins: 0
      },
      draws: 0,
      total: 0,
      byGame: {}
    },

    reaction: ""
  };

  await set(
    roomRef(),
    data
  );

  await enterRoom();
}


async function joinStart() {
  nickname =
    cleanName($("#nickname").value);

  roomCode =
    $("#roomCode")
      .value
      .trim()
      .toUpperCase();

  if (
    !nickname ||
    roomCode.length !== 6
  ) {
    return landingMessage(
      "Enter a nickname and 6-character room code."
    );
  }

  const snapshot =
    await get(roomRef());

  if (!snapshot.exists()) {
    return landingMessage(
      "Room not found."
    );
  }

  room = snapshot.val();

  $("#slotAName").textContent =
    room.players?.A?.name ||
    "Available";

  $("#slotBName").textContent =
    room.players?.B?.name ||
    "Available";

  show("slotScreen");
}


async function claimSlot(slot) {
  const snapshot =
    await get(roomRef());

  if (!snapshot.exists()) {
    return toast(
      "Room disappeared."
    );
  }

  const currentRoom =
    snapshot.val();

  const existing =
    currentRoom.players?.[slot];

  if (
    existing &&
    typeof existing === "object" &&
    existing.uid !== auth.currentUser.uid &&
    existing.online
  ) {
    return toast(
      `Player ${slot} is currently occupied.`
    );
  }

  mySlot = slot;

  await set(
    roomRef(`players/${slot}`),
    {
      uid: auth.currentUser.uid,
      name: nickname,
      online: true,
      lastSeen: Date.now()
    }
  );

  await enterRoom();
}


async function enterRoom() {
  history.replaceState(
    {},
    "",
    `${location.pathname}?room=${roomCode}`
  );

  await onDisconnect(
    roomRef(
      `players/${mySlot}/online`
    )
  ).set(false);

  if (unsub) {
    unsub();
  }

  unsub = onValue(
    roomRef(),
    snapshot => {
      if (!snapshot.exists()) return;

      room = snapshot.val();

      renderRoom();
    }
  );

  show("lobby");
}


function landingMessage(text) {
  $("#landingMsg").textContent =
    text;
}


/* --------------------------------------------------
   ROOM RENDERING
-------------------------------------------------- */

function renderRoom() {
  $("#roomLabel").textContent =
    roomCode;

  $("#playerA").textContent =
    room.players?.A?.name ||
    "Waiting…";

  $("#playerB").textContent =
    room.players?.B?.name ||
    "Waiting…";

  $("#scoreA").textContent =
    room.stats?.A?.wins || 0;

  $("#scoreB").textContent =
    room.stats?.B?.wins || 0;


  renderChallenge();


  if (
    room.activeGame &&
    typeof room.activeGame === "object" &&
    room.activeGame.status === "playing"
  ) {
    show("gameScreen");
    renderGame();
  } else if (
    !$("#gameScreen")
      .classList
      .contains("hidden")
  ) {
    $("#gameMount").innerHTML = "";
    show("lobby");
  }


  const reaction =
    room.reaction;

  if (
    reaction &&
    typeof reaction === "object" &&
    reaction.at > lastReaction &&
    reaction.from !== mySlot
  ) {
    lastReaction =
      reaction.at;

    toast(
      `${playerName(reaction.from)}: ${reaction.emoji}`
    );
  }
}


function renderChallenge() {
  const challenge =
    room.challenge;

  const banner =
    $("#challengeBanner");

  if (
    challenge &&
    typeof challenge === "object" &&
    challenge.to === mySlot
  ) {
    const game =
      gameById(challenge.game);

    banner.classList.remove(
      "hidden"
    );

    banner.innerHTML = `
      <b>
        ${playerName(challenge.from)}
        wants to play
        ${game?.name || "a game"}
      </b>

      <div class="actions">
        <button id="acceptCh">
          Accept
        </button>

        <button id="declineCh">
          Decline
        </button>
      </div>
    `;

    $("#acceptCh").onclick =
      () =>
        acceptChallenge(
          challenge
        );

    $("#declineCh").onclick =
      () =>
        update(
          roomRef(),
          {
            challenge: ""
          }
        );

  } else {
    banner.classList.add(
      "hidden"
    );

    banner.innerHTML = "";
  }
}


/* --------------------------------------------------
   CHALLENGES
-------------------------------------------------- */

async function challenge(gameId) {
  if (
    !room.players?.A ||
    !room.players?.B ||
    typeof room.players.A !== "object" ||
    typeof room.players.B !== "object"
  ) {
    return toast(
      "Waiting for the other player."
    );
  }

  await update(
    roomRef(),
    {
      challenge: {
        from: mySlot,
        to: other(),
        game: gameId,
        at: Date.now()
      }
    }
  );

  toast(
    "Challenge sent!"
  );
}


async function acceptChallenge(
  challengeData
) {
  const state =
    initialState(
      challengeData.game,
      Math.random() < 0.5
        ? "A"
        : "B"
    );

  $("#gameMount").innerHTML = "";

  await update(
    roomRef(),
    {
      challenge: "",
      activeGame: {
        id: challengeData.game,
        status: "playing",
        state,
        startedAt: Date.now(),
        resultRecorded: false
      }
    }
  );
}


/* --------------------------------------------------
   SHARE ROOM
-------------------------------------------------- */

async function shareRoom() {
  const url =
    `${location.origin}${location.pathname}?room=${roomCode}`;

  if (navigator.share) {
    await navigator.share({
      title: "Game Room",
      text:
        `Join my private Game Room — code ${roomCode}`,
      url
    }).catch(() => {});
  } else {
    prompt(
      "Copy this invite link:",
      url
    );
  }
}


/* --------------------------------------------------
   ACTIVE GAME
-------------------------------------------------- */

function renderGame() {
  const active =
    room.activeGame;

  if (
    !active ||
    typeof active !== "object"
  ) {
    return;
  }

  const game =
    gameById(active.id);

  const state =
    active.state || {};

  if (!game) {
    $("#gameMount").innerHTML =
      "<p>Game unavailable.</p>";

    return;
  }

  $("#gameTitle").textContent =
    game.name;


  if (state.winner) {
    $("#turnLabel").textContent =
      winnerText(state);
  }

  else if (
    active.id === "rps"
  ) {
    $("#turnLabel").textContent =
      `First to 3 rounds`;
  }

  else if (
    active.id === "wyr"
  ) {
    $("#turnLabel").textContent =
      `Compare your choices`;
  }

  else if (state.turn) {
    $("#turnLabel").textContent =
      `${playerName(state.turn)}'s turn`;
  }

  else {
    $("#turnLabel").textContent =
      "";
  }


  /*
    Always clear the previous game's
    HTML before rendering a different
    game.

    This prevents the old board from
    remaining visible if a renderer
    fails.
  */
  $("#gameMount").innerHTML = "";


  if (active.id === "tictactoe") {
    renderTTT(state);
  }

  else if (active.id === "connect4") {
    renderConnect(state);
  }

  else if (active.id === "dots") {
    renderDots(state);
  }

  else if (active.id === "rps") {
    renderRPS(state);
  }

  else if (active.id === "wyr") {
    renderWYR(state);
  }

  else {
    $("#gameMount").innerHTML =
      "<p>Game unavailable.</p>";
  }


  /*
    Would You Rather has no winner,
    so it is deliberately excluded
    from competitive statistics.
  */
  if (
    state.winner &&
    active.id !== "wyr" &&
    !active.resultRecorded
  ) {
    recordResult(
      state.winner,
      active.id
    );
  }
}


function winnerText(state) {
  if (
    state.winner === "draw"
  ) {
    return "Draw!";
  }

  return `${playerName(state.winner)} wins!`;
}


async function pushState(state) {
  await update(
    roomRef("activeGame"),
    {
      state
    }
  );
}


/* --------------------------------------------------
   TIC TAC TOE
-------------------------------------------------- */

function win3(cells) {
  const lines = [
    [0,1,2],
    [3,4,5],
    [6,7,8],
    [0,3,6],
    [1,4,7],
    [2,5,8],
    [0,4,8],
    [2,4,6]
  ];

  for (const line of lines) {
    if (
      cells[line[0]] &&
      cells[line[0]] ===
        cells[line[1]] &&
      cells[line[1]] ===
        cells[line[2]]
    ) {
      return cells[line[0]];
    }
  }

  if (cells.every(Boolean)) {
    return "draw";
  }

  return "";
}


function renderTTT(state) {
  $("#gameMount").innerHTML = `
    <div class="board ttt">
      ${state.cells.map(
        (value, index) => `
          <button data-i="${index}">
            ${
              value === "A"
                ? "✕"
                : value === "B"
                ? "○"
                : ""
            }
          </button>
        `
      ).join("")}
    </div>
  `;

  $("#gameMount")
    .querySelectorAll("button")
    .forEach(button => {

      button.onclick =
        async () => {

          const index =
            +button.dataset.i;

          if (
            state.winner ||
            state.turn !== mySlot ||
            state.cells[index]
          ) {
            return;
          }

          const next =
            structuredClone(state);

          next.cells[index] =
            mySlot;

          next.winner =
            win3(next.cells);

          if (!next.winner) {
            next.turn =
              other();
          }

          await pushState(next);
        };
    });
}


/* --------------------------------------------------
   FOUR IN A ROW
-------------------------------------------------- */

function connectWinner(cells) {
  for (
    let row = 0;
    row < 6;
    row++
  ) {
    for (
      let col = 0;
      col < 7;
      col++
    ) {

      for (
        const [dr, dc]
        of [
          [0,1],
          [1,0],
          [1,1],
          [1,-1]
        ]
      ) {

        const player =
          cells[row * 7 + col];

        if (!player) continue;

        let good = true;

        for (
          let k = 1;
          k < 4;
          k++
        ) {
          const r =
            row + dr * k;

          const c =
            col + dc * k;

          if (
            r < 0 ||
            r >= 6 ||
            c < 0 ||
            c >= 7 ||
            cells[r * 7 + c] !==
              player
          ) {
            good = false;
          }
        }

        if (good) {
          return player;
        }
      }
    }
  }

  if (cells.every(Boolean)) {
    return "draw";
  }

  return "";
}


function renderConnect(state) {
  $("#gameMount").innerHTML = `
    <div class="board connect">
      ${state.cells.map(
        (value, index) => `
          <button
            class="${
              value === "A"
                ? "red"
                : value === "B"
                ? "yellow"
                : ""
            }"
            data-col="${index % 7}"
            aria-label="Column ${
              index % 7 + 1
            }"
          ></button>
        `
      ).join("")}
    </div>
  `;


  $("#gameMount")
    .querySelectorAll("button")
    .forEach(button => {

      button.onclick =
        async () => {

          if (
            state.winner ||
            state.turn !== mySlot
          ) {
            return;
          }

          const col =
            +button.dataset.col;

          let row = -1;

          for (
            let r = 5;
            r >= 0;
            r--
          ) {
            if (
              !state.cells[
                r * 7 + col
              ]
            ) {
              row = r;
              break;
            }
          }

          if (row < 0) return;

          const next =
            structuredClone(state);

          next.cells[
            row * 7 + col
          ] = mySlot;

          next.winner =
            connectWinner(
              next.cells
            );

          if (!next.winner) {
            next.turn =
              other();
          }

          await pushState(next);
        };
    });
}


/* --------------------------------------------------
   DOTS & BOXES
-------------------------------------------------- */

function renderDots(state) {
  let html = "";

  const columns = [];

  for (
    let i = 0;
    i < 11;
    i++
  ) {
    columns.push(
      i % 2 === 0
        ? "12px"
        : "1fr"
    );
  }


  for (
    let row = 0;
    row < 11;
    row++
  ) {
    for (
      let col = 0;
      col < 11;
      col++
    ) {

      if (
        row % 2 === 0 &&
        col % 2 === 0
      ) {
        html +=
          `<span class="dotcell"></span>`;
      }

      else if (
        row % 2 === 0 &&
        col % 2 === 1
      ) {
        const index =
          (row / 2) * 5 +
          (col - 1) / 2;

        html += `
          <button
            class="edge h ${
              state.h[index]
                ? "on"
                : ""
            }"
            data-t="h"
            data-i="${index}"
          ></button>
        `;
      }

      else if (
        row % 2 === 1 &&
        col % 2 === 0
      ) {
        const index =
          ((row - 1) / 2) * 6 +
          col / 2;

        html += `
          <button
            class="edge v ${
              state.v[index]
                ? "on"
                : ""
            }"
            data-t="v"
            data-i="${index}"
          ></button>
        `;
      }

      else {
        const index =
          ((row - 1) / 2) * 5 +
          (col - 1) / 2;

        html += `
          <span
            class="box ${
              state.boxes[index] || ""
            }"
          >
            ${
              state.boxes[index] || ""
            }
          </span>
        `;
      }
    }
  }


  $("#gameMount").innerHTML = `
    <div style="text-align:center">
      <b>
        ${playerName("A")}
        ${state.scores.A}
        ·
        ${state.scores.B}
        ${playerName("B")}
      </b>
    </div>

    <div
      class="board dots"
      style="
        grid-template-columns:
        ${columns.join(" ")};
        grid-template-rows:
        repeat(11,auto);
      "
    >
      ${html}
    </div>
  `;


  $("#gameMount")
    .querySelectorAll(".edge")
    .forEach(button => {

      button.onclick =
        () =>
          dotsMove(
            state,
            button.dataset.t,
            +button.dataset.i
          );
    });
}


async function dotsMove(
  state,
  type,
  index
) {
  if (
    state.winner ||
    state.turn !== mySlot ||
    state[type][index]
  ) {
    return;
  }


  const next =
    structuredClone(state);

  next[type][index] =
    mySlot;

  let claimed = 0;


  for (
    let boxRow = 0;
    boxRow < 5;
    boxRow++
  ) {
    for (
      let boxCol = 0;
      boxCol < 5;
      boxCol++
    ) {

      const boxIndex =
        boxRow * 5 +
        boxCol;

      if (
        next.boxes[boxIndex]
      ) {
        continue;
      }


      const top =
        boxRow * 5 +
        boxCol;

      const bottom =
        (boxRow + 1) * 5 +
        boxCol;

      const left =
        boxRow * 6 +
        boxCol;

      const right =
        boxRow * 6 +
        boxCol + 1;


      if (
        next.h[top] &&
        next.h[bottom] &&
        next.v[left] &&
        next.v[right]
      ) {
        next.boxes[boxIndex] =
          mySlot;

        next.scores[mySlot]++;

        claimed++;
      }
    }
  }


  /*
    Completing a box gives the
    same player another turn.
  */
  if (!claimed) {
    next.turn =
      other();
  }


  if (
    next.boxes.every(Boolean)
  ) {
    if (
      next.scores.A ===
      next.scores.B
    ) {
      next.winner =
        "draw";
    } else {
      next.winner =
        next.scores.A >
        next.scores.B
          ? "A"
          : "B";
    }
  }


  await pushState(next);
}


/* --------------------------------------------------
   ROCK PAPER SCISSORS
-------------------------------------------------- */

function rpsEmoji(choice) {
  if (choice === "rock") {
    return "✊";
  }

  if (choice === "paper") {
    return "✋";
  }

  if (choice === "scissors") {
    return "✌️";
  }

  return "❔";
}


function rpsRoundWinner(
  a,
  b
) {
  if (a === b) {
    return "";
  }

  if (
    (a === "rock" &&
      b === "scissors") ||

    (a === "paper" &&
      b === "rock") ||

    (a === "scissors" &&
      b === "paper")
  ) {
    return "A";
  }

  return "B";
}


function renderRPS(state) {
  const myPick =
    state.picks?.[mySlot] || "";

  const opponentPick =
    state.picks?.[other()] || "";

  const bothPicked =
    Boolean(
      state.picks?.A &&
      state.picks?.B
    );


  let statusText =
    "Choose secretly. Your opponent cannot see your choice.";

  if (
    myPick &&
    !opponentPick
  ) {
    statusText =
      "Choice locked. Waiting for your opponent…";
  }

  else if (
    !myPick &&
    opponentPick
  ) {
    statusText =
      "Your opponent has chosen. Make your pick.";
  }

  else if (bothPicked) {
    statusText =
      state.last ||
      "Choices revealed!";
  }


  let revealHTML = "";

  if (bothPicked) {
    revealHTML = `
      <div class="rps-reveal">

        <div class="rps-choice">
          <small>
            ${playerName("A")}
          </small>

          <div class="big">
            ${rpsEmoji(
              state.picks.A
            )}
          </div>
        </div>

        <b>VS</b>

        <div class="rps-choice">
          <small>
            ${playerName("B")}
          </small>

          <div class="big">
            ${rpsEmoji(
              state.picks.B
            )}
          </div>
        </div>

      </div>
    `;
  }


  $("#gameMount").innerHTML = `
    <div class="rpsresult">

      ${
        state.winner
          ? `${playerName(
              state.winner
            )} wins the match! 🎉`
          : `Round ${state.round}`
      }

      <small>
        ${playerName("A")}
        ${state.roundWins.A}
        –
        ${state.roundWins.B}
        ${playerName("B")}
      </small>

      <small>
        ${statusText}
      </small>

    </div>

    ${revealHTML}

    ${
      !bothPicked &&
      !state.winner
        ? `
          <div class="board rps">

            <button
              data-p="rock"
              class="${
                myPick === "rock"
                  ? "selected"
                  : ""
              }"
              ${
                myPick
                  ? "disabled"
                  : ""
              }
            >
              ✊
            </button>

            <button
              data-p="paper"
              class="${
                myPick === "paper"
                  ? "selected"
                  : ""
              }"
              ${
                myPick
                  ? "disabled"
                  : ""
              }
            >
              ✋
            </button>

            <button
              data-p="scissors"
              class="${
                myPick === "scissors"
                  ? "selected"
                  : ""
              }"
              ${
                myPick
                  ? "disabled"
                  : ""
              }
            >
              ✌️
            </button>

          </div>
        `
        : ""
    }

    ${
      bothPicked &&
      !state.winner
        ? `
          <div style="text-align:center">
            <button
              id="nextRpsRound"
              class="primary"
            >
              Next round
            </button>
          </div>
        `
        : ""
    }
  `;


  $("#gameMount")
    .querySelectorAll(
      "[data-p]"
    )
    .forEach(button => {

      button.onclick =
        () =>
          rpsPick(
            state,
            button.dataset.p
          );
    });


  $("#nextRpsRound")
    ?.addEventListener(
      "click",
      () =>
        nextRpsRound(state)
    );
}


async function rpsPick(
  state,
  pick
) {
  if (
    state.winner ||
    state.picks?.[mySlot]
  ) {
    return;
  }


  const next =
    structuredClone(state);

  next.picks ??= {
    A: "",
    B: ""
  };

  next.picks[mySlot] =
    pick;


  if (
    next.picks.A &&
    next.picks.B
  ) {
    const winner =
      rpsRoundWinner(
        next.picks.A,
        next.picks.B
      );


    if (winner) {
      next.roundWins[winner]++;

      next.last =
        `${playerName(winner)} won this round`;
    }

    else {
      next.last =
        "This round is a draw";
    }


    if (
      next.roundWins.A >= 3 ||
      next.roundWins.B >= 3
    ) {
      next.winner =
        next.roundWins.A >= 3
          ? "A"
          : "B";
    }

    next.reveal = true;
  }


  await pushState(next);
}


async function nextRpsRound(
  state
) {
  if (
    state.winner ||
    !state.picks?.A ||
    !state.picks?.B
  ) {
    return;
  }


  const next =
    structuredClone(state);

  next.round++;

  next.picks = {
    A: "",
    B: ""
  };

  next.last = "";
  next.reveal = false;

  await pushState(next);
}


/* --------------------------------------------------
   WOULD YOU RATHER
-------------------------------------------------- */

function renderWYR(state) {
  const question =
    questions[
      state.index %
      questions.length
    ];

  const myPick =
    state.picks?.[mySlot] || "";

  const opponentPick =
    state.picks?.[other()] || "";

  const bothPicked =
    Boolean(
      state.picks?.A &&
      state.picks?.B
    );


  let status =
    "Choose privately. Your answer stays hidden until both players choose.";

  if (
    myPick &&
    !opponentPick
  ) {
    status =
      "Answer locked. Waiting for the other player…";
  }

  else if (
    !myPick &&
    opponentPick
  ) {
    status =
      "The other player has answered. Make your choice.";
  }


  let reveal = "";

  if (bothPicked) {
    const answerA =
      state.picks.A === "1"
        ? question[0]
        : question[1];

    const answerB =
      state.picks.B === "1"
        ? question[0]
        : question[1];

    const matched =
      state.picks.A ===
      state.picks.B;


    reveal = `
      <div class="wyr-reveal">

        <div class="rpsresult">
          ${
            matched
              ? "Same choice! 🎉"
              : "Different choices 😄"
          }

          <small>
            ${state.matches}
            matches in
            ${state.rounds}
            answered questions
          </small>
        </div>


        <div class="wyr-player-answer">

          <b>
            ${playerName("A")}
          </b>

          <div>
            ${answerA}
          </div>

        </div>


        <div class="wyr-player-answer">

          <b>
            ${playerName("B")}
          </b>

          <div>
            ${answerB}
          </div>

        </div>

      </div>


      <button
        id="nextQuestion"
        class="primary"
      >
        Next question
      </button>
    `;
  }


  $("#gameMount").innerHTML = `
    <div class="wyrprompt">
      Would you rather…
    </div>

    <div class="wyr-status">
      ${status}
    </div>

    <div class="board wyr">

      ${
        !bothPicked
          ? `
            <button
              data-wyr="1"
              class="${
                myPick === "1"
                  ? "selected"
                  : ""
              }"
              ${
                myPick
                  ? "disabled"
                  : ""
              }
            >
              ${question[0]}
            </button>


            <button
              data-wyr="2"
              class="${
                myPick === "2"
                  ? "selected"
                  : ""
              }"
              ${
                myPick
                  ? "disabled"
                  : ""
              }
            >
              ${question[1]}
            </button>
          `
          : reveal
      }

    </div>
  `;


  $("#gameMount")
    .querySelectorAll(
      "[data-wyr]"
    )
    .forEach(button => {

      button.onclick =
        () =>
          wyrPick(
            state,
            button.dataset.wyr
          );
    });


  $("#nextQuestion")
    ?.addEventListener(
      "click",
      () =>
        nextWYRQuestion(state)
    );
}


async function wyrPick(
  state,
  pick
) {
  if (
    state.picks?.[mySlot]
  ) {
    return;
  }


  const next =
    structuredClone(state);

  next.picks ??= {
    A: "",
    B: ""
  };

  next.picks[mySlot] =
    pick;


  if (
    next.picks.A &&
    next.picks.B
  ) {
    next.rounds++;

    if (
      next.picks.A ===
      next.picks.B
    ) {
      next.matches++;
    }

    next.reveal = true;
  }


  await pushState(next);
}


async function nextWYRQuestion(
  state
) {
  if (
    !state.picks?.A ||
    !state.picks?.B
  ) {
    return;
  }


  const next =
    structuredClone(state);

  next.index++;

  next.picks = {
    A: "",
    B: ""
  };

  next.reveal = false;

  await pushState(next);
}


/* --------------------------------------------------
   STATS
-------------------------------------------------- */

async function recordResult(
  winner,
  game
) {
  if (
    room.activeGame
      ?.resultRecorded
  ) {
    return;
  }


  const stats =
    structuredClone(
      room.stats || {
        A: {
          wins: 0
        },
        B: {
          wins: 0
        },
        draws: 0,
        total: 0,
        byGame: {}
      }
    );


  stats.A ??= {
    wins: 0
  };

  stats.B ??= {
    wins: 0
  };

  stats.byGame ??= {};

  stats.total =
    (stats.total || 0) + 1;


  stats.byGame[game] ??= {
    A: 0,
    B: 0,
    draws: 0,
    total: 0
  };


  stats.byGame[game].total =
    (stats.byGame[game].total || 0) + 1;


  if (
    winner === "draw"
  ) {
    stats.draws =
      (stats.draws || 0) + 1;

    stats.byGame[game].draws =
      (stats.byGame[game].draws || 0) + 1;
  }

  else {
    stats[winner].wins =
      (stats[winner].wins || 0) + 1;

    stats.byGame[game][winner] =
      (stats.byGame[game][winner] || 0) + 1;
  }


  await update(
    roomRef(),
    {
      stats,
      "activeGame/resultRecorded":
        true
    }
  );
}


function showStats() {
  const stats =
    room?.stats || {};

  let html = `
    <div class="statrow">
      <b>Total matches</b>
      <span>
        ${stats.total || 0}
      </span>
    </div>

    <div class="statrow">
      <b>
        ${playerName("A")} wins
      </b>
      <span>
        ${stats.A?.wins || 0}
      </span>
    </div>

    <div class="statrow">
      <b>
        ${playerName("B")} wins
      </b>
      <span>
        ${stats.B?.wins || 0}
      </span>
    </div>

    <div class="statrow">
      <b>Draws</b>
      <span>
        ${stats.draws || 0}
      </span>
    </div>

    <h3>By game</h3>
  `;


  for (const game of catalog) {
    const gameStats =
      stats.byGame?.[game.id];

    if (!gameStats) {
      continue;
    }

    html += `
      <div class="statrow">

        <span>
          ${game.emoji}
          ${game.name}
        </span>

        <span>
          ${gameStats.A || 0}
          –
          ${gameStats.B || 0}

          ${
            gameStats.draws
              ? ` · ${gameStats.draws} draws`
              : ""
          }
        </span>

      </div>
    `;
  }


  $("#statsContent").innerHTML =
    html;

  $("#statsDialog").showModal();
}


/* --------------------------------------------------
   REMATCH / EXIT
-------------------------------------------------- */

async function rematch() {
  if (
    !room.activeGame ||
    typeof room.activeGame !==
      "object"
  ) {
    return;
  }


  const gameId =
    room.activeGame.id;

  const state =
    initialState(
      gameId,
      Math.random() < 0.5
        ? "A"
        : "B"
    );


  await update(
    roomRef("activeGame"),
    {
      state,
      status: "playing",
      resultRecorded: false,
      startedAt: Date.now()
    }
  );
}


async function backToLobby() {
  $("#gameMount").innerHTML = "";

  await update(
    roomRef(),
    {
      activeGame: ""
    }
  );

  show("lobby");
}


/* --------------------------------------------------
   EVENT LISTENERS
-------------------------------------------------- */

$("#createRoom").onclick =
  createRoom;

$("#joinRoom").onclick =
  joinStart;

$("#backLanding").onclick =
  () =>
    show("landing");


document
  .querySelectorAll(".slot")
  .forEach(button => {
    button.onclick =
      () =>
        claimSlot(
          button.dataset.slot
        );
  });


$("#gameTiles").onclick =
  event => {
    const button =
      event.target.closest(
        "[data-game]"
      );

    if (!button) return;

    openGameInfo(
      button.dataset.game
    );
  };


$("#closeGameInfo").onclick =
  closeGameInfo;


$("#challengePlayerBtn").onclick =
  async () => {
    if (!selectedGame) {
      return;
    }

    closeGameInfo();

    await challenge(
      selectedGame
    );
  };


document.addEventListener(
  "click",
  event => {
    const reactionButton =
      event.target.closest(
        "[data-reaction]"
      );

    if (
      reactionButton &&
      roomCode
    ) {
      react(
        reactionButton
          .dataset
          .reaction
      );
    }
  }
);


$("#shareBtn").onclick =
  shareRoom;

$("#backLobby").onclick =
  backToLobby;

$("#rematchBtn").onclick =
  rematch;


$("#statsBtn").onclick =
  () => {
    if (room) {
      showStats();
    } else {
      toast(
        "Join a room first"
      );
    }
  };


$("#closeStats").onclick =
  () =>
    $("#statsDialog").close();


$("#soundBtn").onclick =
  () => {
    sound = !sound;

    $("#soundBtn").textContent =
      sound
        ? "🔊"
        : "🔇";
  };


$("#homeBtn").onclick =
  () => {
    if (room) {
      show("lobby");
    } else {
      show("landing");
    }
  };


/* --------------------------------------------------
   START
-------------------------------------------------- */

boot().catch(error => {
  landingMessage(
    "Could not connect: " +
    error.message
  );
});
