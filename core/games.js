export const catalog = [
  {
    id: "connect4",
    name: "Four in a Row",
    emoji: "🔴🟡",
    subtitle: "Connect four before your rival",
    rules: "Take turns dropping pieces into columns. The first player to connect four pieces horizontally, vertically, or diagonally wins."
  },

  {
    id: "tictactoe",
    name: "Tic-Tac-Toe",
    emoji: "❌⭕",
    subtitle: "Classic three-in-a-row",
    rules: "Take turns placing your symbol. The first player to make a row of three horizontally, vertically, or diagonally wins."
  },

  {
    id: "dots",
    name: "Dots & Boxes",
    emoji: "🔵",
    subtitle: "Claim the most boxes",
    rules: "Take turns drawing one line between neighbouring dots. Completing a box earns that box and gives you another turn. The player with the most boxes wins."
  },

  {
    id: "rps",
    name: "Rock Paper Scissors",
    emoji: "✊✋✌️",
    subtitle: "Secret simultaneous picks",
    rules: "Both players choose secretly. Rock beats scissors, scissors beats paper, and paper beats rock. The first player to win three rounds wins the match."
  },

  {
    id: "wyr",
    name: "Would You Rather?",
    emoji: "🎉",
    subtitle: "Compare your choices",
    rules: "Both players secretly choose between two options. Answers are revealed after both players choose. See how often your choices match."
  },

  {
    id: "property",
    name: "Property Empire",
    emoji: "🎲🏠",
    subtitle: "Buy, trade, build and become the last player standing",
    rules: "Travel around a 40-space property board. Buy properties, collect rent, complete colour groups, build houses and hotels, trade with your opponent and manage your money carefully. The last player who remains solvent wins."
  }
];


export function shuffledIndexes(length) {
  const values =
    Array.from(
      { length },
      (_, index) => index
    );

  for (
    let i = values.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );

    [
      values[i],
      values[j]
    ] = [
      values[j],
      values[i]
    ];
  }

  return values;
}


export function initialState(
  id,
  starter = "A",
  options = {}
) {

  if (id === "tictactoe") {
    return {
      turn: starter,
      cells: Array(9).fill(""),
      winner: null,
      draw: false,
      lastMove: null
    };
  }


  if (id === "connect4") {
    return {
      turn: starter,
      cells: Array(42).fill(""),
      winner: null,
      draw: false,
      lastMove: null
    };
  }


  if (id === "dots") {
    return {
      turn: starter,
      h: Array(30).fill(""),
      v: Array(30).fill(""),
      boxes: Array(25).fill(""),
      scores: {
        A: 0,
        B: 0
      },
      winner: null,
      lastEdge: null
    };
  }


  if (id === "rps") {
    return {
      round: 1,

      picks: {
        A: "",
        B: ""
      },

      roundWins: {
        A: 0,
        B: 0
      },

      winner: null,
      last: "",
      reveal: false
    };
  }


  if (id === "wyr") {
    return {
      position: 0,

      deck:
        options.deck ||
        [],

      picks: {
        A: "",
        B: ""
      },

      matches: 0,
      rounds: 0,
      winner: null,
      reveal: false
    };
  }


  /*
    PROPERTY EMPIRE

    For now this only creates the initial
    multiplayer state.

    The actual board, dice, properties,
    rent, cards, buildings and trading
    will be added in the next stages.
  */

  if (id === "property") {
    return {

      version: 1,

      phase: "setup",

      turn: starter,

      round: 1,

      winner: null,

      players: {

        A: {
          position: 0,
          cash: 1500,
          token: "",
          properties: [],
          jailTurns: 0,
          inJail: false,
          bankrupt: false
        },

        B: {
          position: 0,
          cash: 1500,
          token: "",
          properties: [],
          jailTurns: 0,
          inJail: false,
          bankrupt: false
        }

      },

      setup: {
        AReady: false,
        BReady: false
      },

      dice: {
        first: 0,
        second: 0,
        total: 0,
        doubles: false,
        rolling: false
      },

      doublesInRow: 0,

      ownership: {},

      buildings: {},

      mortgaged: {},

      pendingAction: null,

      lastAction: "",

      auction: null,

      trade: null,

      eventDeckA: [],

      eventDeckB: [],

      eventIndexA: 0,

      eventIndexB: 0,

      history: []
    };
  }


  return {};
}
