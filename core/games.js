export const catalog = [
  {
    id: "connect4",
    name: "Four in a Row",
    emoji: "🔴🟡",
    subtitle: "Connect four before your rival",
    rules:
      "Take turns dropping discs into the board. The first player to connect four discs horizontally, vertically, or diagonally wins."
  },

  {
    id: "tictactoe",
    name: "Tic-Tac-Toe",
    emoji: "❌⭕",
    subtitle: "Classic three-in-a-row",
    rules:
      "Take turns placing your symbol on the 3×3 board. The first player to make a row of three horizontally, vertically, or diagonally wins."
  },

  {
    id: "dots",
    name: "Dots & Boxes",
    emoji: "🔵",
    subtitle: "Claim the most boxes",
    rules:
      "Take turns drawing one line between adjacent dots. Complete the fourth side of a box to claim it and immediately take another turn. The player with the most boxes at the end wins."
  },

  {
    id: "rps",
    name: "Rock Paper Scissors",
    emoji: "✊✋✌️",
    subtitle: "Secret simultaneous picks",
    rules:
      "Both players secretly choose Rock, Paper, or Scissors. Choices are revealed after both players have picked. Rock beats Scissors, Scissors beats Paper, and Paper beats Rock. First to win 3 rounds wins the match."
  },

  {
    id: "wyr",
    name: "Would You Rather?",
    emoji: "🎉",
    subtitle: "Compare your choices",
    rules:
      "Both players receive the same Would You Rather question and choose privately. Your answers are revealed only after both players have chosen. Questions appear in a randomized order and do not repeat during the same session."
  }
];


/*
  Fisher-Yates shuffle.

  We store the shuffled question indexes in Firebase,
  rather than shuffling independently on each phone.

  That guarantees both players always see the exact
  same question in the exact same order.
*/
export function shuffledIndexes(length) {
  const indexes =
    Array.from(
      { length },
      (_, index) => index
    );

  for (
    let i = indexes.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [
      indexes[i],
      indexes[j]
    ] = [
      indexes[j],
      indexes[i]
    ];
  }

  return indexes;
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
      winner: "",
      draw: false,
      lastMove: -1
    };
  }


  if (id === "connect4") {
    return {
      turn: starter,
      cells: Array(42).fill(""),
      winner: "",
      draw: false,
      lastMove: -1
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

      winner: "",

      lastEdge: ""
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

      winner: "",

      last: "",

      reveal: false
    };
  }


  if (id === "wyr") {

    /*
      app.js will normally provide a shuffled deck.

      Keeping this fallback means the game still has
      valid state even if no deck is supplied.
    */
    const deck =
      Array.isArray(options.deck)
        ? options.deck
        : [];

    return {
      deck,

      position: 0,

      picks: {
        A: "",
        B: ""
      },

      matches: 0,

      rounds: 0,

      winner: "",

      reveal: false
    };
  }


  return {};
}
