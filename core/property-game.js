import {
  PROPERTY_BOARD,
  PROPERTY_TOKENS,
  PROPERTY_GROUPS,
  getSpaceAt
} from "./property.js";


/*
  PROPERTY EMPIRE UI MODULE

  This module will eventually contain:
  - board rendering
  - token selection
  - dice
  - movement
  - property purchasing
  - rent
  - auctions
  - houses / hotels
  - mortgages
  - trading
  - detention
  - event cards
  - bankruptcy
*/


export function renderPropertyGame({
  state,
  mySlot,
  playerName,
  mount,
  pushState
}) {

  if (!state) {
    mount.innerHTML =
      "<p>Property Empire could not load.</p>";

    return;
  }


  /*
    SETUP PHASE

    Both players choose a token before
    the board becomes active.
  */

  if (state.phase === "setup") {
    renderTokenSetup({
      state,
      mySlot,
      playerName,
      mount,
      pushState
    });

    return;
  }


  /*
    BOARD PHASE

    The full board renderer will replace
    this temporary screen in the next step.
  */

  renderBoardPreview({
    state,
    mySlot,
    playerName,
    mount
  });
}


/* --------------------------------------------------
   TOKEN SELECTION
-------------------------------------------------- */

function renderTokenSetup({
  state,
  mySlot,
  playerName,
  mount,
  pushState
}) {

  const me =
    state.players[mySlot];

  const otherSlot =
    mySlot === "A"
      ? "B"
      : "A";

  const opponent =
    state.players[otherSlot];


  const opponentToken =
    opponent?.token || "";


  mount.innerHTML = `
    <div class="property-setup">

      <div class="property-setup-icon">
        🎲🏠
      </div>

      <h2>
        Choose your token
      </h2>

      <p>
        Pick the piece that will represent
        you around the board.
      </p>


      <div class="property-token-grid">

        ${PROPERTY_TOKENS.map(token => {

          const mine =
            me.token === token.id;

          const taken =
            opponentToken === token.id;


          return `
            <button
              class="
                property-token
                ${mine ? "selected" : ""}
                ${taken ? "taken" : ""}
              "
              data-property-token="${token.id}"
              ${taken ? "disabled" : ""}
            >

              <span>
                ${token.emoji}
              </span>

              <b>
                ${token.name}
              </b>

              ${
                mine
                  ? "<small>Selected</small>"
                  : taken
                  ? `<small>Taken by ${playerName(otherSlot)}</small>`
                  : "<small>Tap to choose</small>"
              }

            </button>
          `;
        }).join("")}

      </div>


      <div class="property-ready-card">

        <div>
          <span>
            ${
              state.setup?.AReady
                ? "✅"
                : "⏳"
            }
          </span>

          <b>
            ${playerName("A")}
          </b>

          <small>
            ${
              state.setup?.AReady
                ? "Ready"
                : "Choosing token"
            }
          </small>
        </div>


        <div>
          <span>
            ${
              state.setup?.BReady
                ? "✅"
                : "⏳"
            }
          </span>

          <b>
            ${playerName("B")}
          </b>

          <small>
            ${
              state.setup?.BReady
                ? "Ready"
                : "Choosing token"
            }
          </small>
        </div>

      </div>


      <button
        id="propertyReady"
        class="primary property-ready-button"
        ${!me.token ? "disabled" : ""}
      >
        ${
          state.setup?.[
            mySlot + "Ready"
          ]
            ? "Waiting for other player…"
            : "I'm Ready"
        }
      </button>

    </div>
  `;


  mount
    .querySelectorAll(
      "[data-property-token]"
    )
    .forEach(button => {

      button.onclick =
        async () => {

          if (
            state.setup?.[
              mySlot + "Ready"
            ]
          ) {
            return;
          }


          const tokenId =
            button.dataset
              .propertyToken;


          if (
            tokenId ===
            opponentToken
          ) {
            return;
          }


          const next =
            structuredClone(
              state
            );


          next.players[
            mySlot
          ].token =
            tokenId;


          await pushState(
            next
          );
        };
    });


  const readyButton =
    mount.querySelector(
      "#propertyReady"
    );


  if (readyButton) {
    readyButton.onclick =
      async () => {

        if (!me.token) {
          return;
        }


        if (
          state.setup?.[
            mySlot + "Ready"
          ]
        ) {
          return;
        }


        const next =
          structuredClone(
            state
          );


        next.setup[
          mySlot + "Ready"
        ] = true;


        /*
          When both players are ready,
          the actual board begins.
        */

        if (
          next.setup.AReady &&
          next.setup.BReady
        ) {
          next.phase =
            "roll";

          next.lastAction =
            `${playerName(
              next.turn
            )} begins the game.`;
        }


        await pushState(
          next
        );
      };
  }
}


/* --------------------------------------------------
   TEMPORARY BOARD PREVIEW

   This deliberately does NOT implement gameplay yet.
   Its purpose is to confirm that both devices can
   enter the Property Empire match safely before we
   introduce the large board renderer.
-------------------------------------------------- */

function renderBoardPreview({
  state,
  mySlot,
  playerName,
  mount
}) {

  const me =
    state.players[
      mySlot
    ];


  const otherSlot =
    mySlot === "A"
      ? "B"
      : "A";


  const opponent =
    state.players[
      otherSlot
    ];


  const myToken =
    PROPERTY_TOKENS.find(
      token =>
        token.id ===
        me.token
    );


  const opponentToken =
    PROPERTY_TOKENS.find(
      token =>
        token.id ===
        opponent.token
    );


  mount.innerHTML = `
    <div class="property-preview">

      <div class="property-preview-title">

        <span>
          🎲
        </span>

        <div>
          <h2>
            Property Empire
          </h2>

          <p>
            Board ready
          </p>
        </div>

      </div>


      <div class="property-bank-preview">

        <div>

          <span class="property-big-token">
            ${myToken?.emoji || "🎮"}
          </span>

          <b>
            ${playerName(mySlot)}
          </b>

          <small>
            Cash
          </small>

          <strong>
            $${me.cash}
          </strong>

        </div>


        <div>

          <span class="property-big-token">
            ${opponentToken?.emoji || "🎮"}
          </span>

          <b>
            ${playerName(otherSlot)}
          </b>

          <small>
            Cash
          </small>

          <strong>
            $${opponent.cash}
          </strong>

        </div>

      </div>


      <div class="property-coming">

        <span>
          🏗️
        </span>

        <h3>
          The board is being prepared
        </h3>

        <p>
          Both players are connected and
          your token choices have been saved.
        </p>

        <p>
          The complete 40-space board,
          animated dice and movement come
          in the next stage.
        </p>

      </div>


      <div class="property-debug">

        <small>
          Current turn
        </small>

        <b>
          ${playerName(
            state.turn
          )}
        </b>

        <small>
          ${
            getSpaceAt(
              me.position
            ).name
          }
        </small>

      </div>

    </div>
  `;
}


/* --------------------------------------------------
   FUTURE HELPERS

   Exporting these now means app.js won't need
   knowledge of the internal Property Empire data.
-------------------------------------------------- */

export function propertyTurnText(
  state,
  mySlot,
  playerName
) {

  if (
    state.phase === "setup"
  ) {
    return "Choose your tokens";
  }


  if (state.winner) {
    return state.winner ===
      mySlot
      ? "You won!"
      : `${playerName(
          state.winner
        )} won`;
  }


  if (
    state.turn ===
      mySlot
  ) {
    return "Your turn";
  }


  return `${playerName(
    state.turn
  )}'s turn`;
}


export function propertyIsMyTurn(
  state,
  mySlot
) {
  return (
    state.phase !== "setup" &&
    !state.winner &&
    state.turn === mySlot
  );
}
