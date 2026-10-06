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
  initialState,
  shuffledIndexes
} from "./core/games.js";

import {
  renderPropertyGame,
  propertyTurnText
} from "./core/property-game.js";


const $ = s => document.querySelector(s);

const screens = [
  "landing",
  "slotScreen",
  "lobby",
  "gameScreen"
];

const reactions = ["❤️", "😂", "😭", "😡", "👏"];

const STORAGE_ROOMS = "gameRoom.savedRooms.v1";
const STORAGE_THEME = "gameRoom.theme.v1";

const APP_VERSION = "1.5.0";
/* --------------------------------------------------
   WOULD YOU RATHER QUESTION BANK
-------------------------------------------------- */

const questions = [
  ["Explore space", "Explore the deepest parts of the ocean"],
  ["Always arrive 20 minutes early", "Always arrive 10 minutes late"],
  ["Be able to fly", "Be able to breathe underwater"],
  ["Visit the past", "Visit the future"],
  ["Know every language", "Play every musical instrument"],
  ["Live beside the ocean", "Live in the mountains"],
  ["Have a personal chef", "Have a personal driver"],
  ["Always have perfect Wi-Fi", "Always have a fully charged phone"],
  ["Read minds", "See ten minutes into the future"],
  ["Have unlimited travel", "Have unlimited restaurant meals"],

  ["Pause time for everyone except yourself", "Rewind your own life by ten minutes"],
  ["Remember everything you read", "Remember every conversation you have"],
  ["Never need sleep", "Never need to wait in a queue"],
  ["Have four-day weekends forever", "Have six-hour workdays forever"],
  ["Always find the perfect parking spot", "Never encounter traffic"],
  ["Own a beautiful house in one place", "Travel continuously with no permanent home"],
  ["Spend a year travelling the world", "Spend a year living in your dream city"],
  ["Take a spontaneous trip", "Plan the perfect trip months ahead"],
  ["Travel only by train", "Travel only by boat"],
  ["See the northern lights", "See a total solar eclipse"],

  ["Have breakfast food for every meal", "Never eat breakfast food again"],
  ["Give up desserts for a year", "Give up fried food for a year"],
  ["Only eat sweet food for a week", "Only eat savoury food for a week"],
  ["Cook every meal yourself", "Eat every meal at a restaurant"],
  ["Have unlimited coffee or tea", "Have unlimited desserts"],
  ["Never eat your favourite food again", "Only eat your favourite food once a month"],
  ["Try a completely unfamiliar dish", "Order your reliable favourite"],
  ["Eat dinner very early", "Eat dinner very late"],
  ["Give up fizzy drinks forever", "Give up fast food forever"],
  ["Have the world's best pizza", "Have the world's best burger"],

  ["Give up music for a year", "Give up films and series for a year"],
  ["Only watch new films", "Only rewatch favourites"],
  ["Attend every concert you want", "Attend every sporting event you want"],
  ["Meet your favourite musician", "Meet your favourite actor"],
  ["Listen to one song repeatedly for a day", "Have no music for a week"],
  ["Watch a film at home", "Watch it at the cinema"],
  ["Know the ending before every film", "Never be able to rewatch a film"],
  ["Have front-row concert seats", "Have backstage access after the show"],
  ["Lose access to streaming video", "Lose access to streaming music"],
  ["Be inside your favourite film world", "Be inside your favourite game world"],

  ["Always say exactly what you think", "Never be able to explain what you really think"],
  ["Be incredibly funny", "Be incredibly charming"],
  ["Have five very close friends", "Have fifty casual friends"],
  ["Host every gathering", "Never have to organise a gathering"],
  ["Spend a weekend completely alone", "Spend a weekend surrounded by friends"],
  ["Be famous but have little privacy", "Be unknown but completely free"],
  ["Always win arguments", "Never have another argument"],
  ["Receive the perfect gift", "Give someone the perfect gift"],
  ["Know what everyone thinks of you", "Never know what anyone thinks of you"],
  ["Be the best storyteller", "Be the best listener"],

  ["Live without social media", "Live without online shopping"],
  ["Use only voice calls for a week", "Use only text messages for a week"],
  ["Have a phone with unlimited battery", "Have a phone with unlimited storage"],
  ["Lose your phone for a week", "Lose internet access for a week"],
  ["Use an old phone forever", "Use an old computer forever"],
  ["Never receive spam calls", "Never receive spam email"],
  ["Have instant internet everywhere", "Have free electricity everywhere"],
  ["Give up your camera", "Give up your headphones"],
  ["Always type perfectly", "Always remember every password"],
  ["Have every app free", "Have every subscription free"],

  ["Be extremely lucky", "Be extremely talented"],
  ["Know exactly what career suits you", "Know exactly where you should live"],
  ["Have more money", "Have more free time"],
  ["Master one skill instantly", "Become good at ten skills gradually"],
  ["Work on something you love for less money", "Work an easy job for much more money"],
  ["Retire very early with a simple lifestyle", "Work longer with a luxurious lifestyle"],
  ["Have perfect focus", "Have endless creativity"],
  ["Always make the right decision", "Always recover quickly from a wrong decision"],
  ["Know your future career", "Keep it completely surprising"],
  ["Be excellent at public speaking", "Be excellent at writing"],

  ["Wake up naturally at sunrise", "Stay awake comfortably until sunrise"],
  ["Always have perfect weather on weekends", "Always have perfect weather while travelling"],
  ["Never feel too hot", "Never feel too cold"],
  ["Live where it rains often", "Live where it almost never rains"],
  ["Have a garden you maintain yourself", "Have a balcony requiring no maintenance"],
  ["Own many things you love", "Own very few things but travel more"],
  ["Have a huge bedroom", "Have a huge kitchen"],
  ["Live on the top floor", "Live on the ground floor with a garden"],
  ["Have an amazing view", "Have an amazing location"],
  ["Always live near family", "Always live near your closest friends"],

  ["Have a pet dog", "Have a pet cat"],
  ["Understand animals", "Speak every human language"],
  ["Spend a day with dolphins", "Spend a day with elephants"],
  ["See a rare animal in the wild", "Discover a new species"],
  ["Have a tiny friendly dragon", "Have a giant friendly bird"],
  ["Be able to talk to your pet", "Know exactly what your pet is feeling"],
  ["Live near a forest", "Live near a lake"],
  ["Go camping in the mountains", "Camp beside the sea"],
  ["Watch sunrise from a mountain", "Watch sunset from a beach"],
  ["Explore a rainforest", "Explore a desert"],

  ["Have one extra hour every day", "Have one extra day every month"],
  ["Repeat your favourite day once", "Skip your worst day once"],
  ["Freeze time for one hour", "Go back one hour"],
  ["Know what happens tomorrow", "Know what happens one year from now"],
  ["Relive one childhood day", "Preview one future day"],
  ["Never forget a happy memory", "Forget every embarrassing memory"],
  ["Be able to make any moment feel slower", "Make boring moments pass instantly"],
  ["Always know the exact time without a clock", "Always know exactly how long something will take"],
  ["Have a three-day weekend every week", "Have one entire month off every year"],
  ["Live a very long ordinary life", "Live a shorter extraordinary life"],

  ["Play a board game", "Play a video game"],
  ["Win through strategy", "Win through luck"],
  ["Always get the first move", "Always get one extra move at the end"],
  ["Be unbeatable at chess", "Be unbeatable at every card game"],
  ["Play one long competitive game", "Play ten quick games"],
  ["Know every game's rules instantly", "Become great at any game after playing once"],
  ["Play cooperatively", "Play competitively"],
  ["Lose a close exciting game", "Win an easy boring game"],
  ["Create a new game", "Master an existing game"],
  ["Always roll the number you want", "Always draw the card you want"],

  ["Receive a handwritten letter", "Receive a surprise package"],
  ["Plan a surprise for someone", "Be surprised yourself"],
  ["Have someone cook your favourite meal", "Cook their favourite meal for them"],
  ["Spend an evening talking", "Spend an evening doing an activity together"],
  ["Share every hobby", "Have completely different hobbies"],
  ["Take lots of photos together", "Rarely take photos but remember the moments"],
  ["Always choose the activity", "Always choose the food"],
  ["Celebrate small occasions", "Save celebrations for major occasions"],
  ["Go somewhere familiar together", "Discover somewhere completely new together"],
  ["Have an unforgettable adventure", "Have a perfectly relaxing day"],

  ["Be able to teleport anywhere", "Be able to stop time"],
  ["Have invisibility", "Have super speed"],
  ["Have super strength", "Have perfect memory"],
  ["Control the weather", "Communicate with animals"],
  ["Never get lost", "Never forget anything"],
  ["Know when someone is lying", "Be impossible to lie to"],
  ["Be able to instantly learn", "Be able to instantly teach"],
  ["Have a photographic memory", "Have perfect intuition"],
  ["Change your appearance at will", "Change your voice at will"],
  ["Travel through space instantly", "Travel through time once"],

  ["Have a library room", "Have a home cinema"],
  ["Have a swimming pool", "Have a rooftop terrace"],
  ["Have a beautiful kitchen", "Have a beautiful garden"],
  ["Have a home gym", "Have a gaming room"],
  ["Have a tiny home in a perfect location", "Have a mansion far from everything"],
  ["Have someone clean your home", "Have someone cook every meal"],
  ["Never wash dishes again", "Never do laundry again"],
  ["Always have fresh flowers at home", "Always have your favourite snacks at home"],
  ["Have perfect natural light", "Have perfect temperature all year"],
  ["Live somewhere peaceful", "Live somewhere exciting"],

  ["Learn something new every day", "Create something new every day"],
  ["Read one hundred books a year", "Watch one hundred great films a year"],
  ["Become fluent in a new language", "Become excellent at a new instrument"],
  ["Learn photography", "Learn painting"],
  ["Write a book", "Make a film"],
  ["Become an amazing cook", "Become an amazing dancer"],
  ["Learn extremely quickly", "Never forget what you learn"],
  ["Have endless motivation", "Have endless patience"],
  ["Be naturally organised", "Be naturally spontaneous"],
  ["Always finish what you start", "Always know which things are worth starting"],

  ["Find hidden treasure", "Discover a secret place"],
  ["Spend a night in a castle", "Spend a night under the stars"],
  ["Take a hot-air balloon ride", "Take a helicopter ride"],
  ["Explore an ancient city", "Explore a futuristic city"],
  ["Go on a road trip with no destination", "Take a perfectly planned luxury holiday"],
  ["Travel first class once", "Travel economy for free forever"],
  ["Have free hotels forever", "Have free flights forever"],
  ["Visit every country", "Know one country incredibly well"],
  ["Travel somewhere snowy", "Travel somewhere tropical"],
  ["See every famous landmark", "Find amazing places few tourists know"],

  ["Always have the perfect comeback", "Never be insulted"],
  ["Laugh at the wrong moment", "Forget someone's name immediately after meeting them"],
  ["Wear slightly overdressed clothes everywhere", "Wear slightly underdressed clothes everywhere"],
  ["Always have a song stuck in your head", "Always have an itch you cannot locate"],
  ["Only whisper for a day", "Only shout for an hour"],
  ["Have to dance whenever music plays", "Have to sing whenever you hear your favourite song"],
  ["Always sneeze twice", "Always hiccup once after laughing"],
  ["Have socks that are always slightly wet", "Have sleeves that are always slightly too long"],
  ["Accidentally send a message too early", "Accidentally leave someone on read"],
  ["Always forget why you entered a room", "Always forget where you put your phone"],

  ["Know the answer to any factual question", "Know the solution to any practical problem"],
  ["Be able to fix anything", "Be able to cook anything"],
  ["Have perfect handwriting", "Type incredibly fast"],
  ["Always wake up refreshed", "Fall asleep instantly"],
  ["Never feel bored", "Never feel stressed"],
  ["Have perfect balance", "Have perfect coordination"],
  ["Always remember names", "Always remember faces"],
  ["Have unlimited confidence", "Have unlimited patience"],
  ["Always know what to say", "Always know when to stay quiet"],
  ["Be great at starting conversations", "Be great at ending awkward conversations"]
];


/* --------------------------------------------------
   APP STATE
-------------------------------------------------- */

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
    $("#" + screen)
      .classList
      .toggle(
        "hidden",
        screen !== id
      );
  });
};


const toast = text => {
  const element = $("#toast");

  element.textContent = text;
  element.classList.remove("hidden");

  clearTimeout(toast.timer);

  toast.timer =
    setTimeout(() => {
      element.classList.add("hidden");
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
    `rooms/${roomCode}${
      path
        ? "/" + path
        : ""
    }`
  );
}


function other(slot = mySlot) {
  return slot === "A"
    ? "B"
    : "A";
}


function playerName(slot) {
  return (
    room?.players?.[slot]?.name ||
    `Player ${slot}`
  );
}


function gameById(id) {
  return catalog.find(
    game => game.id === id
  );
}


/* --------------------------------------------------
   THEME
-------------------------------------------------- */

function loadTheme() {
  let theme =
    localStorage.getItem(
      STORAGE_THEME
    );

  if (
    theme !== "light" &&
    theme !== "dark"
  ) {
    theme =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
        ? "dark"
        : "light";
  }

  applyTheme(theme);
}


function applyTheme(theme) {
  document.documentElement
    .setAttribute(
      "data-theme",
      theme
    );

  localStorage.setItem(
    STORAGE_THEME,
    theme
  );

  $("#themeBtn").textContent =
    theme === "dark"
      ? "☀️"
      : "🌙";

  $("#themeBtn").title =
    theme === "dark"
      ? "Light mode"
      : "Dark mode";

  $("#themeBtn").setAttribute(
    "aria-label",
    theme === "dark"
      ? "Switch to light mode"
      : "Switch to dark mode"
  );
}


function toggleTheme() {
  const current =
    document.documentElement
      .getAttribute(
        "data-theme"
      );

  applyTheme(
    current === "dark"
      ? "light"
      : "dark"
  );
}


/* --------------------------------------------------
   SAVED ROOMS
-------------------------------------------------- */

function getSavedRooms() {
  try {
    const parsed =
      JSON.parse(
        localStorage.getItem(
          STORAGE_ROOMS
        ) || "[]"
      );

    return Array.isArray(parsed)
      ? parsed
      : [];
  }

  catch {
    return [];
  }
}


function setSavedRooms(rooms) {
  localStorage.setItem(
    STORAGE_ROOMS,
    JSON.stringify(rooms)
  );

  renderSavedRooms();
}


function rememberRoom() {
  if (!roomCode) return;

  const rooms =
    getSavedRooms();

  const entry = {
    code: roomCode,

    playerA:
      room?.players?.A?.name ||
      "",

    playerB:
      room?.players?.B?.name ||
      "",

    lastSlot:
      mySlot || "",

    updatedAt:
      Date.now()
  };


  const filtered =
    rooms.filter(
      item =>
        item.code !== roomCode
    );


  filtered.unshift(entry);

  setSavedRooms(
    filtered.slice(0, 20)
  );
}


function removeSavedRoom(code) {
  const rooms =
    getSavedRooms()
      .filter(
        item =>
          item.code !== code
      );

  setSavedRooms(rooms);
}


function renderSavedRooms() {
  const rooms =
    getSavedRooms();

  const section =
    $("#savedRoomsSection");

  const mount =
    $("#savedRooms");


  if (!rooms.length) {
    section.classList.add(
      "hidden"
    );

    mount.innerHTML = "";

    return;
  }


  section.classList.remove(
    "hidden"
  );


  mount.innerHTML =
    rooms.map(item => {

      const names =
        [
          item.playerA,
          item.playerB
        ]
          .filter(Boolean)
          .join(" · ");


      return `
        <div class="saved-room">

          <div class="saved-room-main">

            <button
              data-open-room="${item.code}"
            >

              <span class="saved-room-title">
                🎮 Room ${item.code}
              </span>

              <span class="saved-room-meta">
                ${
                  names ||
                  "Previously joined room"
                }
              </span>

              <span class="saved-room-meta saved-room-open">
                Open room →
              </span>

            </button>

          </div>


          <button
            class="saved-room-remove"
            data-remove-room="${item.code}"
            aria-label="Remove room ${item.code} from this device"
            title="Forget this room"
          >
            ✕
          </button>

        </div>
      `;
    }).join("");
}


async function openSavedRoom(code) {
  nickname =
    cleanName(
      $("#nickname").value
    );

  if (!nickname) {
    return landingMessage(
      "Enter your nickname first, then open the saved room."
    );
  }

  roomCode =
    code.toUpperCase();

  $("#roomCode").value =
    roomCode;

  await joinStart();
}


/* --------------------------------------------------
   STARTUP
-------------------------------------------------- */

async function boot() {
  loadTheme();

  renderTiles();
  renderReactions();
  renderSavedRooms();

  await login();


  const inviteCode =
    new URLSearchParams(
      location.search
    ).get("room");


  if (inviteCode) {
    $("#roomCode").value =
      inviteCode.toUpperCase();
  }


 if ("serviceWorker" in navigator) {

  try {

    const registration =
      await navigator.serviceWorker.register(
        "./sw.js",
        {
          updateViaCache: "none"
        }
      );


    /*
      Check for a newer sw.js
      every time Game Room starts.
    */

    registration
      .update()
      .catch(() => {});


    /*
      If an update is already
      waiting, activate it.
    */

    if (
      registration.waiting
    ) {
      registration.waiting
        .postMessage({
          type: "SKIP_WAITING"
        });
    }


    /*
      Detect an update downloaded
      while the app is open.
    */

    registration.addEventListener(
      "updatefound",
      () => {

        const worker =
          registration.installing;

        if (!worker) return;

        worker.addEventListener(
          "statechange",
          () => {

            if (
              worker.state ===
                "installed" &&
              navigator
                .serviceWorker
                .controller
            ) {

              worker.postMessage({
                type:
                  "SKIP_WAITING"
              });
            }
          }
        );
      }
    );


    /*
      Once the new service worker
      controls the page, reload once.
    */

    let reloading = false;

    navigator
      .serviceWorker
      .addEventListener(
        "controllerchange",
        () => {

          if (reloading) {
            return;
          }

          reloading = true;

          window.location.reload();
        }
      );

  }

  catch (error) {

    console.warn(
      "Service worker registration failed:",
      error
    );

  }
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
        <span class="emoji">
          ${game.emoji}
        </span>

        <b>
          ${game.name}
        </b>
      </button>
    `).join("");
}


function openGameInfo(gameId) {
  const game =
    gameById(gameId);

  if (!game) return;

  selectedGame =
    gameId;

  $("#gameInfoEmoji")
    .textContent =
      game.emoji;

  $("#gameInfoTitle")
    .textContent =
      game.name;

  $("#gameInfoDescription")
    .textContent =
      game.subtitle;

  $("#gameInfoRules")
    .textContent =
      game.rules;

  $("#gameInfoDialog")
    .showModal();
}


function closeGameInfo() {
  $("#gameInfoDialog")
    .close();
}


/* --------------------------------------------------
   REACTIONS
-------------------------------------------------- */

function renderReactions() {
  for (
    const id of [
      "lobbyReactions",
      "gameReactions"
    ]
  ) {
    $("#" + id).innerHTML =
      reactions.map(
        emoji => `
          <button
            class="reaction"
            data-reaction="${emoji}"
            aria-label="Send ${emoji}"
          >
            ${emoji}
          </button>
        `
      ).join("");
  }
}


async function react(emoji) {
  if (
    !roomCode ||
    !mySlot
  ) {
    return;
  }

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
   COLLISION-SAFE ROOM CODE
-------------------------------------------------- */

async function createUniqueRoomCode() {
  for (
    let attempt = 0;
    attempt < 12;
    attempt++
  ) {
    const candidate =
      makeCode();

    const snapshot =
      await get(
        ref(
          db,
          `rooms/${candidate}`
        )
      );

    if (!snapshot.exists()) {
      return candidate;
    }
  }

  throw new Error(
    "Could not generate a unique room code. Please try again."
  );
}


/* --------------------------------------------------
   ROOM CREATION / JOINING
-------------------------------------------------- */

async function createRoom() {
  nickname =
    cleanName(
      $("#nickname").value
    );

  if (!nickname) {
    return landingMessage(
      "Enter a nickname first."
    );
  }


  landingMessage(
    "Creating room…"
  );


  try {
    roomCode =
      await createUniqueRoomCode();

    mySlot = "A";


    const data = {
      createdAt:
        Date.now(),

      players: {
        A: {
          uid:
            auth.currentUser.uid,

          name:
            nickname,

          online:
            true,

          lastSeen:
            Date.now()
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

    room = data;

    rememberRoom();

    landingMessage("");

    await enterRoom();
  }

  catch (error) {
    landingMessage(
      "Could not create room: " +
      error.message
    );
  }
}


async function joinStart() {
  nickname =
    cleanName(
      $("#nickname").value
    );

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
    await get(
      roomRef()
    );


  if (!snapshot.exists()) {
    removeSavedRoom(
      roomCode
    );

    return landingMessage(
      "Room not found."
    );
  }


  room =
    snapshot.val();


  $("#slotAName")
    .textContent =
      room.players?.A?.name ||
      "Available";


  $("#slotBName")
    .textContent =
      room.players?.B?.name ||
      "Available";


  show("slotScreen");
}


async function claimSlot(slot) {
  const snapshot =
    await get(
      roomRef()
    );


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
    typeof existing ===
      "object" &&
    existing.uid !==
      auth.currentUser.uid &&
    existing.online
  ) {
    return toast(
      `Player ${slot} is currently occupied.`
    );
  }


  mySlot =
    slot;


  await set(
    roomRef(
      `players/${slot}`
    ),
    {
      uid:
        auth.currentUser.uid,

      name:
        nickname,

      online:
        true,

      lastSeen:
        Date.now()
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


  unsub =
    onValue(
      roomRef(),
      snapshot => {

        if (
          !snapshot.exists()
        ) {
          return;
        }

        room =
          snapshot.val();

        rememberRoom();

        renderRoom();
      }
    );


  show("lobby");
}


function landingMessage(text) {
  $("#landingMsg")
    .textContent =
      text;
}


/* --------------------------------------------------
   ROOM RENDERING
-------------------------------------------------- */

function renderRoom() {
  $("#roomLabel")
    .textContent =
      roomCode;


  $("#playerA")
    .textContent =
      room.players?.A?.name ||
      "Waiting…";


  $("#playerB")
    .textContent =
      room.players?.B?.name ||
      "Waiting…";


  $("#scoreA")
    .textContent =
      room.stats?.A?.wins || 0;


  $("#scoreB")
    .textContent =
      room.stats?.B?.wins || 0;


  renderChallenge();


  if (
    room.activeGame &&
    typeof room.activeGame ===
      "object" &&
    room.activeGame.status ===
      "playing"
  ) {
    show("gameScreen");

    renderGame();
  }

  else if (
    !$("#gameScreen")
      .classList
      .contains("hidden")
  ) {
    $("#gameMount")
      .innerHTML = "";

    hideTurnBanner();

    show("lobby");
  }


  const reaction =
    room.reaction;


  if (
    reaction &&
    typeof reaction ===
      "object" &&
    reaction.at >
      lastReaction &&
    reaction.from !==
      mySlot
  ) {
    lastReaction =
      reaction.at;

    toast(
      `${playerName(
        reaction.from
      )}: ${reaction.emoji}`
    );
  }
}


/* --------------------------------------------------
   CHALLENGE
-------------------------------------------------- */

function renderChallenge() {
  const challengeData =
    room.challenge;

  const banner =
    $("#challengeBanner");


  if (
    challengeData &&
    typeof challengeData ===
      "object" &&
    challengeData.to ===
      mySlot
  ) {
    const game =
      gameById(
        challengeData.game
      );


    banner.classList.remove(
      "hidden"
    );


    banner.innerHTML = `
      <b>
        ${playerName(
          challengeData.from
        )}
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
          challengeData
        );


    $("#declineCh").onclick =
      () =>
        update(
          roomRef(),
          {
            challenge: ""
          }
        );
  }

  else {
    banner.classList.add(
      "hidden"
    );

    banner.innerHTML = "";
  }
}


async function challenge(gameId) {
  if (
    !room.players?.A ||
    !room.players?.B ||
    typeof room.players.A !==
      "object" ||
    typeof room.players.B !==
      "object"
  ) {
    return toast(
      "Waiting for the other player."
    );
  }


  await update(
    roomRef(),
    {
      challenge: {
        from:
          mySlot,

        to:
          other(),

        game:
          gameId,

        at:
          Date.now()
      }
    }
  );


  toast(
    "Challenge sent!"
  );
}


function freshGameState(gameId) {
  const starter =
    Math.random() < 0.5
      ? "A"
      : "B";


  if (gameId === "wyr") {
    return initialState(
      gameId,
      starter,
      {
        deck:
          shuffledIndexes(
            questions.length
          )
      }
    );
  }


  return initialState(
    gameId,
    starter
  );
}


async function acceptChallenge(
  challengeData
) {
  const state =
    freshGameState(
      challengeData.game
    );


  $("#gameMount")
    .innerHTML = "";


  await update(
    roomRef(),
    {
      challenge: "",

      activeGame: {
        id:
          challengeData.game,

        status:
          "playing",

        state,

        startedAt:
          Date.now(),

        resultRecorded:
          false
      }
    }
  );
}


/* --------------------------------------------------
   SHARE
-------------------------------------------------- */

async function shareRoom() {
  const url =
    `${location.origin}${location.pathname}?room=${roomCode}`;


  if (navigator.share) {
    await navigator.share({
      title:
        "Game Room",

      text:
        `Join my private Game Room — code ${roomCode}`,

      url
    }).catch(() => {});
  }

  else {
    prompt(
      "Copy this invite link:",
      url
    );
  }
}


/* --------------------------------------------------
   TURN FEEDBACK
-------------------------------------------------- */

function setTurnBanner(
  type,
  icon,
  title,
  text
) {
  const banner =
    $("#turnBanner");


  banner.classList.remove(
    "hidden",
    "yours",
    "waiting",
    "finished"
  );


  if (type) {
    banner.classList.add(
      type
    );
  }


  $("#turnBannerIcon")
    .textContent =
      icon;


  $("#turnBannerTitle")
    .textContent =
      title;


  $("#turnBannerText")
    .textContent =
      text;
}


function hideTurnBanner() {
  $("#turnBanner")
    .classList.add(
      "hidden"
    );


  $("#playerCardA")
    ?.classList
    .remove(
      "my-turn"
    );


  $("#playerCardB")
    ?.classList
    .remove(
      "my-turn"
    );
}


function renderTurnFeedback(
  gameId,
  state
) {
  $("#playerCardA")
    ?.classList
    .remove(
      "my-turn"
    );


  $("#playerCardB")
    ?.classList
    .remove(
      "my-turn"
    );


  if (state.winner) {
    setTurnBanner(
      "finished",
      "🏆",
      state.winner === "draw"
        ? "DRAW"
        : `${playerName(
            state.winner
          )} WINS`,
      "Match finished"
    );

    return;
  }


  /*
    PROPERTY EMPIRE:
    TOKEN SELECTION
  */
  if (
    gameId === "property" &&
    state.phase === "setup"
  ) {
    const ready =
      state.setup?.[
        mySlot + "Ready"
      ];


    if (ready) {
      setTurnBanner(
        "waiting",
        "⏳",
        "YOU'RE READY",
        "Waiting for the other player…"
      );
    }

    else {
      setTurnBanner(
        "yours",
        "🎲",
        "CHOOSE YOUR TOKEN",
        "Pick a token and get ready"
      );
    }

    return;
  }


  /*
    PROPERTY EMPIRE:
    NORMAL TURN
  */
  if (
    gameId === "property"
  ) {
    const turn =
      state.turn;


    if (turn) {
      $(
        `#playerCard${turn}`
      )
        ?.classList
        .add(
          "my-turn"
        );
    }


    if (turn === mySlot) {
      setTurnBanner(
        "yours",
        "🎲",
        "YOUR TURN",
        "Make your move"
      );
    }

    else {
      setTurnBanner(
        "waiting",
        "⏳",
        `${playerName(
          turn
        )}'S TURN`,
        "Waiting for their move…"
      );
    }

    return;
  }


  /*
    Traditional turn-based games.
  */
  if (
    gameId === "tictactoe" ||
    gameId === "connect4" ||
    gameId === "dots"
  ) {
    const turn =
      state.turn;


    if (turn) {
      $(
        `#playerCard${turn}`
      )
        ?.classList
        .add(
          "my-turn"
        );
    }


    if (turn === mySlot) {
      setTurnBanner(
        "yours",
        "🎯",
        "YOUR TURN",
        "Make your move"
      );
    }

    else {
      setTurnBanner(
        "waiting",
        "⏳",
        `${playerName(
          turn
        )}'S TURN`,
        "Waiting for their move…"
      );
    }

    return;
  }


  /*
    Secret simultaneous games.
  */
  if (
    gameId === "rps" ||
    gameId === "wyr"
  ) {
    const mine =
      state.picks?.[mySlot] ||
      "";

    const theirs =
      state.picks?.[other()] ||
      "";

    const both =
      Boolean(
        state.picks?.A &&
        state.picks?.B
      );


    if (both) {
      setTurnBanner(
        "finished",
        gameId === "rps"
          ? "⚡"
          : "🎉",
        "REVEALED",
        gameId === "rps"
          ? "See how the round went"
          : "Compare your answers"
      );

      return;
    }


    if (!mine) {
      setTurnBanner(
        "yours",
        "👆",
        "CHOOSE NOW",
        theirs
          ? "Your opponent has already chosen"
          : "Make your private choice"
      );
    }

    else {
      setTurnBanner(
        "waiting",
        "🔒",
        "CHOICE LOCKED",
        "Waiting for the other player…"
      );
    }

    return;
  }


  hideTurnBanner();
}


/* --------------------------------------------------
   ACTIVE GAME
-------------------------------------------------- */

function renderGame() {
  const active =
    room.activeGame;


  if (
    !active ||
    typeof active !==
      "object"
  ) {
    return;
  }


  const game =
    gameById(
      active.id
    );


  const state =
    active.state || {};


  if (!game) {
    $("#gameMount")
      .innerHTML =
        "<p>Game unavailable.</p>";

    hideTurnBanner();

    return;
  }


  $("#gameTitle")
    .textContent =
      game.name;


  if (
    active.id === "property"
  ) {
    $("#turnLabel")
      .textContent =
        propertyTurnText(
          state,
          mySlot,
          playerName
        );
  }

  else if (state.winner) {
    $("#turnLabel")
      .textContent =
        winnerText(state);
  }

  else if (
    active.id === "rps"
  ) {
    $("#turnLabel")
      .textContent =
        "First to 3 rounds";
  }

  else if (
    active.id === "wyr"
  ) {
    $("#turnLabel")
      .textContent =
        "Compare your choices";
  }

  else if (state.turn) {
    $("#turnLabel")
      .textContent =
        `${playerName(
          state.turn
        )}'s turn`;
  }

  else {
    $("#turnLabel")
      .textContent = "";
  }


  renderTurnFeedback(
    active.id,
    state
  );


  $("#gameMount")
    .innerHTML = "";


  if (
    active.id ===
      "tictactoe"
  ) {
    renderTTT(state);
  }

  else if (
    active.id ===
      "connect4"
  ) {
    renderConnect(state);
  }

  else if (
    active.id ===
      "dots"
  ) {
    renderDots(state);
  }

  else if (
    active.id ===
      "rps"
  ) {
    renderRPS(state);
  }

  else if (
    active.id ===
      "wyr"
  ) {
    renderWYR(state);
  }

  else if (
    active.id ===
      "property"
  ) {
    renderPropertyGame({
      state,
      mySlot,
      playerName,
      mount:
        $("#gameMount"),
      pushState
    });
  }

  else {
    $("#gameMount")
      .innerHTML =
        "<p>Game unavailable.</p>";
  }


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

  return `${playerName(
    state.winner
  )} wins!`;
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


  for (
    const line of lines
  ) {
    if (
      cells[line[0]] &&
      cells[line[0]] ===
        cells[line[1]] &&
      cells[line[1]] ===
        cells[line[2]]
    ) {
      return cells[
        line[0]
      ];
    }
  }


  if (
    cells.every(Boolean)
  ) {
    return "draw";
  }


  return "";
}


function renderTTT(state) {
  $("#gameMount")
    .innerHTML = `
      <div class="board ttt">

        ${state.cells.map(
          (value,index) => `
            <button
              data-i="${index}"
              class="${
                state.lastMove ===
                  index
                  ? "last-move"
                  : ""
              }"
            >
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
    .querySelectorAll(
      "button"
    )
    .forEach(button => {

      button.onclick =
        async () => {

          const index =
            +button.dataset.i;


          if (
            state.winner ||
            state.turn !==
              mySlot ||
            state.cells[index]
          ) {
            return;
          }


          const next =
            structuredClone(
              state
            );


          next.cells[index] =
            mySlot;


          next.lastMove =
            index;


          next.winner =
            win3(
              next.cells
            );


          if (!next.winner) {
            next.turn =
              other();
          }


          await pushState(
            next
          );
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
        const [dr,dc]
        of [
          [0,1],
          [1,0],
          [1,1],
          [1,-1]
        ]
      ) {
        const player =
          cells[
            row * 7 +
            col
          ];


        if (!player) {
          continue;
        }


        let good =
          true;


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
            cells[
              r * 7 + c
            ] !== player
          ) {
            good =
              false;
          }
        }


        if (good) {
          return player;
        }
      }
    }
  }


  if (
    cells.every(Boolean)
  ) {
    return "draw";
  }


  return "";
}


function renderConnect(state) {
  $("#gameMount")
    .innerHTML = `
      <div class="board connect">

        ${state.cells.map(
          (value,index) => `
            <button
              class="
                ${
                  value === "A"
                    ? "red"
                    : value === "B"
                    ? "yellow"
                    : ""
                }
                ${
                  state.lastMove ===
                    index
                    ? "last-move"
                    : ""
                }
              "
              data-col="${
                index % 7
              }"
              aria-label="Column ${
                index % 7 + 1
              }"
            ></button>
          `
        ).join("")}

      </div>
    `;


  $("#gameMount")
    .querySelectorAll(
      "button"
    )
    .forEach(button => {

      button.onclick =
        async () => {

          if (
            state.winner ||
            state.turn !==
              mySlot
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


          if (row < 0) {
            return;
          }


          const next =
            structuredClone(
              state
            );


          const index =
            row * 7 +
            col;


          next.cells[index] =
            mySlot;


          next.lastMove =
            index;


          next.winner =
            connectWinner(
              next.cells
            );


          if (!next.winner) {
            next.turn =
              other();
          }


          await pushState(
            next
          );
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

        const key =
          `h-${index}`;


        html += `
          <button
            class="
              edge h
              ${
                state.h[index]
                  ? "on"
                  : ""
              }
              ${
                state.lastEdge ===
                  key
                  ? "last-edge"
                  : ""
              }
            "
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

        const key =
          `v-${index}`;


        html += `
          <button
            class="
              edge v
              ${
                state.v[index]
                  ? "on"
                  : ""
              }
              ${
                state.lastEdge ===
                  key
                  ? "last-edge"
                  : ""
              }
            "
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
              state.boxes[index] ||
              ""
            }"
          >
            ${
              state.boxes[index] ||
              ""
            }
          </span>
        `;
      }
    }
  }


  $("#gameMount")
    .innerHTML = `
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
    .querySelectorAll(
      ".edge"
    )
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
    structuredClone(
      state
    );


  next[type][index] =
    mySlot;


  next.lastEdge =
    `${type}-${index}`;


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
        next.boxes[
          boxIndex
        ]
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
        next.boxes[
          boxIndex
        ] = mySlot;

        next.scores[
          mySlot
        ]++;

        claimed++;
      }
    }
  }


  if (!claimed) {
    next.turn =
      other();
  }


  if (
    next.boxes.every(
      Boolean
    )
  ) {
    if (
      next.scores.A ===
      next.scores.B
    ) {
      next.winner =
        "draw";
    }

    else {
      next.winner =
        next.scores.A >
        next.scores.B
          ? "A"
          : "B";
    }
  }


  await pushState(
    next
  );
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

  if (
    choice === "scissors"
  ) {
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
    (
      a === "rock" &&
      b === "scissors"
    ) ||
    (
      a === "paper" &&
      b === "rock"
    ) ||
    (
      a === "scissors" &&
      b === "paper"
    )
  ) {
    return "A";
  }


  return "B";
}


function renderRPS(state) {
  state.picks ??= {
    A: "",
    B: ""
  };

  state.roundWins ??= {
    A: 0,
    B: 0
  };


  const myPick =
    state.picks[
      mySlot
    ] || "";


  const opponentPick =
    state.picks[
      other()
    ] || "";


  const bothPicked =
    Boolean(
      state.picks.A &&
      state.picks.B
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

  else if (
    bothPicked
  ) {
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


  $("#gameMount")
    .innerHTML = `
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
                  myPick ===
                    "rock"
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
                  myPick ===
                    "paper"
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
                  myPick ===
                    "scissors"
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
        nextRpsRound(
          state
        )
    );
}


async function rpsPick(
  state,
  pick
) {
  if (
    state.winner ||
    state.picks?.[
      mySlot
    ]
  ) {
    return;
  }


  const next =
    structuredClone(
      state
    );


  next.picks ??= {
    A: "",
    B: ""
  };


  next.roundWins ??= {
    A: 0,
    B: 0
  };


  next.picks[
    mySlot
  ] = pick;


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
      next.roundWins[
        winner
      ]++;


      next.last =
        `${playerName(
          winner
        )} won this round`;
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


    next.reveal =
      true;
  }


  await pushState(
    next
  );
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
    structuredClone(
      state
    );


  next.round++;


  next.picks = {
    A: "",
    B: ""
  };


  next.last = "";
  next.reveal = false;


  await pushState(
    next
  );
}


/* --------------------------------------------------
   WOULD YOU RATHER
-------------------------------------------------- */

function currentWYRQuestion(
  state
) {
  if (
    !Array.isArray(
      state.deck
    ) ||
    !state.deck.length
  ) {
    state.deck =
      shuffledIndexes(
        questions.length
      );

    state.position =
      state.position ??
      state.index ??
      0;
  }


  const position =
    state.position || 0;


  const questionIndex =
    state.deck[
      position %
      state.deck.length
    ];


  return (
    questions[
      questionIndex
    ] ||
    questions[0]
  );
}


function renderWYR(state) {
  state.picks ??= {
    A: "",
    B: ""
  };


  const question =
    currentWYRQuestion(
      state
    );


  const myPick =
    state.picks[
      mySlot
    ] || "";


  const opponentPick =
    state.picks[
      other()
    ] || "";


  const bothPicked =
    Boolean(
      state.picks.A &&
      state.picks.B
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
            ${state.matches || 0}
            matches in
            ${state.rounds || 0}
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


  $("#gameMount")
    .innerHTML = `
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
        nextWYRQuestion(
          state
        )
    );
}


async function wyrPick(
  state,
  pick
) {
  if (
    state.picks?.[
      mySlot
    ]
  ) {
    return;
  }


  const next =
    structuredClone(
      state
    );


  next.picks ??= {
    A: "",
    B: ""
  };


  next.picks[
    mySlot
  ] = pick;


  if (
    next.picks.A &&
    next.picks.B
  ) {
    next.rounds =
      (next.rounds || 0) + 1;


    if (
      next.picks.A ===
      next.picks.B
    ) {
      next.matches =
        (next.matches || 0) + 1;
    }


    next.reveal =
      true;
  }


  await pushState(
    next
  );
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
    structuredClone(
      state
    );


  const nextPosition =
    (next.position || 0) + 1;


  if (
    nextPosition >=
    next.deck.length
  ) {
    next.deck =
      shuffledIndexes(
        questions.length
      );

    next.position =
      0;
  }

  else {
    next.position =
      nextPosition;
  }


  next.picks = {
    A: "",
    B: ""
  };


  next.reveal =
    false;


  await pushState(
    next
  );
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


  stats.byGame[
    game
  ] ??= {
    A: 0,
    B: 0,
    draws: 0,
    total: 0
  };


  stats.byGame[
    game
  ].total =
    (
      stats.byGame[
        game
      ].total || 0
    ) + 1;


  if (
    winner === "draw"
  ) {
    stats.draws =
      (stats.draws || 0) + 1;


    stats.byGame[
      game
    ].draws =
      (
        stats.byGame[
          game
        ].draws || 0
      ) + 1;
  }

  else {
    stats[
      winner
    ].wins =
      (
        stats[
          winner
        ].wins || 0
      ) + 1;


    stats.byGame[
      game
    ][winner] =
      (
        stats.byGame[
          game
        ][winner] || 0
      ) + 1;
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


  for (
    const game of catalog
  ) {
    const gameStats =
      stats.byGame?.[
        game.id
      ];


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


  $("#statsContent")
    .innerHTML =
      html;


  $("#statsDialog")
    .showModal();
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
    freshGameState(
      gameId
    );


  await update(
    roomRef(
      "activeGame"
    ),
    {
      state,

      status:
        "playing",

      resultRecorded:
        false,

      startedAt:
        Date.now()
    }
  );
}


async function backToLobby() {
  $("#gameMount")
    .innerHTML = "";


  hideTurnBanner();


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
  .querySelectorAll(
    ".slot"
  )
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


    if (!button) {
      return;
    }


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


$("#savedRooms").onclick =
  event => {

    const removeButton =
      event.target.closest(
        "[data-remove-room]"
      );


    if (removeButton) {
      removeSavedRoom(
        removeButton.dataset
          .removeRoom
      );

      return;
    }


    const openButton =
      event.target.closest(
        "[data-open-room]"
      );


    if (openButton) {
      openSavedRoom(
        openButton.dataset
          .openRoom
      );
    }
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
    }

    else {
      toast(
        "Join a room first"
      );
    }
  };


$("#closeStats").onclick =
  () =>
    $("#statsDialog")
      .close();


$("#themeBtn").onclick =
  toggleTheme;


$("#soundBtn").onclick =
  () => {

    sound =
      !sound;


    $("#soundBtn")
      .textContent =
        sound
          ? "🔊"
          : "🔇";
  };


$("#homeBtn").onclick =
  () => {

    if (room) {
      show("lobby");
    }

    else {
      show("landing");

      renderSavedRooms();
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
