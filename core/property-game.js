import {
  PROPERTY_BOARD,
  PROPERTY_TOKENS,
  PROPERTY_GROUPS,
  getSpaceAt,
  getSpaceById,
  playerOwnsFullGroup,
  stationRent,
  utilityRent
} from "./property.js";


const START_MONEY = 200;
const JAIL_POSITION = 10;
const JAIL_FINE = 50;


/* ==================================================
   PUBLIC RENDERER
================================================== */

export function renderPropertyGame({
  state,
  mySlot,
  playerName,
  mount,
  pushState
}) {
  normaliseState(state);

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

  renderPropertyBoard({
    state,
    mySlot,
    playerName,
    mount,
    pushState
  });
}


/* ==================================================
   STATE SAFETY
================================================== */

function normaliseState(state) {
  state.players ??= {};

  for (const slot of ["A", "B"]) {
    state.players[slot] ??= {};

    const player =
      state.players[slot];

    player.position ??= 0;
    player.cash ??= 1500;
    player.token ??= "";
    player.properties ??= [];
    player.jailTurns ??= 0;
    player.inJail ??= false;
    player.bankrupt ??= false;
  }

  state.setup ??= {
    AReady: false,
    BReady: false
  };

  state.dice ??= {
    first: 0,
    second: 0,
    total: 0,
    doubles: false,
    rolling: false
  };

  state.ownership ??= {};
  state.buildings ??= {};
  state.mortgaged ??= {};
  state.pendingAction ??= null;
  state.lastAction ??= "";
  state.doublesInRow ??= 0;
  state.round ??= 1;
  state.winner ??= null;
  state.history ??= [];
}


/* ==================================================
   TOKEN SETUP
================================================== */

function renderTokenSetup({
  state,
  mySlot,
  playerName,
  mount,
  pushState
}) {
  const me =
    state.players[mySlot];

  const opponentSlot =
    other(mySlot);

  const opponent =
    state.players[opponentSlot];

  mount.innerHTML = `
    <div class="property-setup">

      <div class="property-setup-icon">
        🎲🏠
      </div>

      <h2>Choose your token</h2>

      <p>
        Pick the piece that will represent you
        around Property Empire.
      </p>

      <div class="property-token-grid">

        ${PROPERTY_TOKENS.map(token => {
          const mine =
            me.token === token.id;

          const taken =
            opponent.token === token.id;

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
              <span>${token.emoji}</span>

              <b>${token.name}</b>

              <small>
                ${
                  mine
                    ? "Selected"
                    : taken
                    ? `Taken by ${escapeHTML(
                        playerName(opponentSlot)
                      )}`
                    : "Tap to choose"
                }
              </small>
            </button>
          `;
        }).join("")}

      </div>

      <div class="property-ready-card">

        ${["A", "B"].map(slot => `
          <div>
            <span>
              ${
                state.setup[
                  slot + "Ready"
                ]
                  ? "✅"
                  : "⏳"
              }
            </span>

            <b>
              ${escapeHTML(
                playerName(slot)
              )}
            </b>

            <small>
              ${
                state.setup[
                  slot + "Ready"
                ]
                  ? "Ready"
                  : "Choosing token"
              }
            </small>
          </div>
        `).join("")}

      </div>

      <button
        id="propertyReady"
        class="primary property-ready-button"
        ${!me.token ? "disabled" : ""}
      >
        ${
          state.setup[
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
            state.setup[
              mySlot + "Ready"
            ]
          ) {
            return;
          }

          const tokenId =
            button.dataset.propertyToken;

          if (
            opponent.token ===
            tokenId
          ) {
            return;
          }

          const next =
            clone(state);

          next.players[
            mySlot
          ].token =
            tokenId;

          await pushState(next);
        };
    });

  mount
    .querySelector(
      "#propertyReady"
    )
    ?.addEventListener(
      "click",
      async () => {
        if (
          !me.token ||
          state.setup[
            mySlot + "Ready"
          ]
        ) {
          return;
        }

        const next =
          clone(state);

        next.setup[
          mySlot + "Ready"
        ] = true;

        if (
          next.setup.AReady &&
          next.setup.BReady
        ) {
          next.phase = "roll";

          next.lastAction =
            `${playerName(
              next.turn
            )} starts the game.`;
        }

        await pushState(next);
      }
    );
}


/* ==================================================
   MAIN BOARD
================================================== */

function renderPropertyBoard({
  state,
  mySlot,
  playerName,
  mount,
  pushState
}) {
  const me =
    state.players[mySlot];

  const opponentSlot =
    other(mySlot);

  const opponent =
    state.players[opponentSlot];

  mount.innerHTML = `
    <div class="property-game">

      ${renderPlayerBanks(
        state,
        mySlot,
        playerName
      )}

      <div class="property-board-wrap">

        <div class="property-board">

          ${PROPERTY_BOARD.map(
            (space, index) =>
              renderSpace(
                state,
                space,
                index,
                playerName
              )
          ).join("")}

          <div class="property-center">

            <div class="property-logo">
              <span>🏙️</span>

              <strong>
                PROPERTY
              </strong>

              <b>EMPIRE</b>
            </div>

            <div class="property-dice">
              ${diceFace(
                state.dice.first
              )}

              ${diceFace(
                state.dice.second
              )}
            </div>

            <div class="property-action-text">
              ${
                escapeHTML(
                  state.lastAction ||
                  "Build your empire."
                )
              }
            </div>

          </div>

        </div>

      </div>

      ${renderActionPanel(
        state,
        mySlot,
        playerName
      )}

      <div class="property-mini-status">
        <span>
          📍
          ${escapeHTML(
            getSpaceAt(
              me.position
            ).name
          )}
        </span>

        <span>
          ${
            state.turn === mySlot
              ? "🎯 Your turn"
              : `⏳ ${escapeHTML(
                  playerName(
                    state.turn
                  )
                )}'s turn`
          }
        </span>
      </div>

    </div>
  `;

  bindPropertyActions({
    state,
    mySlot,
    playerName,
    mount,
    pushState
  });
}


/* ==================================================
   PLAYER BANKS
================================================== */

function renderPlayerBanks(
  state,
  mySlot,
  playerName
) {
  return `
    <div class="property-banks">

      ${["A", "B"].map(slot => {
        const player =
          state.players[slot];

        const token =
          getToken(player.token);

        const owned =
          Object.values(
            state.ownership
          ).filter(
            owner =>
              owner === slot
          ).length;

        return `
          <div
            class="
              property-bank
              ${
                state.turn === slot &&
                !state.winner
                  ? "active"
                  : ""
              }
              ${
                slot === mySlot
                  ? "mine"
                  : ""
              }
            "
          >

            <span class="property-bank-token">
              ${token?.emoji || "🎮"}
            </span>

            <div class="property-bank-info">
              <b>
                ${escapeHTML(
                  playerName(slot)
                )}
              </b>

              <small>
                ${owned} properties
              </small>
            </div>

            <strong>
              $${money(
                player.cash
              )}
            </strong>

          </div>
        `;
      }).join("")}

    </div>
  `;
}


/* ==================================================
   BOARD SPACE
================================================== */

function renderSpace(
  state,
  space,
  index,
  playerName
) {
  const owner =
    state.ownership[
      space.id
    ];

  const tokens =
    ["A", "B"]
      .filter(
        slot =>
          state.players[
            slot
          ].position === index &&
          !state.players[
            slot
          ].bankrupt
      )
      .map(slot => {
        const token =
          getToken(
            state.players[
              slot
            ].token
          );

        return `
          <span
            class="property-board-token token-${slot}"
            title="${escapeHTML(
              playerName(slot)
            )}"
          >
            ${token?.emoji || "🎮"}
          </span>
        `;
      })
      .join("");

  const group =
    space.group
      ? PROPERTY_GROUPS[
          space.group
        ]
      : null;

  const buildings =
    state.buildings[
      space.id
    ] || 0;

  return `
    <div
      class="
        property-space
        property-space-${index}
        property-type-${space.type}
        ${
          owner
            ? `owned owned-${owner}`
            : ""
        }
      "
      data-space="${index}"
    >

      ${
        group
          ? `
            <div
              class="property-colour"
              style="
                background:
                ${group.color}
              "
            ></div>
          `
          : ""
      }

      <div class="property-space-inner">

        <span class="property-space-icon">
          ${
            space.icon ||
            iconForSpace(
              space
            )
          }
        </span>

        <b>
          ${escapeHTML(
            shortName(
              space.name
            )
          )}
        </b>

        ${
          space.price
            ? `
              <small>
                $${space.price}
              </small>
            `
            : ""
        }

        ${
          buildings
            ? `
              <div class="property-buildings">
                ${
                  buildings >= 5
                    ? "🏨"
                    : "🏠".repeat(
                        buildings
                      )
                }
              </div>
            `
            : ""
        }

        ${
          owner
            ? `
              <span
                class="
                  property-owner-dot
                  owner-${owner}
                "
              >
                ${owner}
              </span>
            `
            : ""
        }

        <div class="property-space-tokens">
          ${tokens}
        </div>

      </div>

    </div>
  `;
}


/* ==================================================
   ACTION PANEL
================================================== */

function renderActionPanel(
  state,
  mySlot,
  playerName
) {
  if (state.winner) {
    return `
      <div class="property-action-panel winner">

        <div class="property-action-icon">
          🏆
        </div>

        <h3>
          ${
            state.winner === mySlot
              ? "You built the winning empire!"
              : `${escapeHTML(
                  playerName(
                    state.winner
                  )
                )} wins!`
          }
        </h3>

      </div>
    `;
  }

  if (
    state.turn !== mySlot
  ) {
    return `
      <div class="property-action-panel">

        <div class="property-action-icon">
          ⏳
        </div>

        <h3>
          ${escapeHTML(
            playerName(
              state.turn
            )
          )}'s turn
        </h3>

        <p>
          Their move will appear automatically.
        </p>

      </div>
    `;
  }

  const me =
    state.players[mySlot];

  if (me.inJail) {
    return `
      <div class="property-action-panel">

        <div class="property-action-icon">
          🔒
        </div>

        <h3>You're in Detention</h3>

        <p>
          Roll doubles to escape or pay
          $${JAIL_FINE}.
        </p>

        <div class="property-action-buttons">

          <button
            id="propertyJailRoll"
            class="primary"
          >
            🎲 Roll for doubles
          </button>

          <button
            id="propertyPayJail"
            ${
              me.cash < JAIL_FINE
                ? "disabled"
                : ""
            }
          >
            💵 Pay $${JAIL_FINE}
          </button>

        </div>

      </div>
    `;
  }

  if (
    state.pendingAction?.type ===
      "buy" &&
    state.pendingAction.player ===
      mySlot
  ) {
    const space =
      getSpaceById(
        state.pendingAction.space
      );

    return `
      <div class="property-action-panel">

        <div class="property-action-icon">
          ${iconForSpace(space)}
        </div>

        <h3>
          ${escapeHTML(
            space.name
          )}
        </h3>

        <p>
          Buy this property for
          <b>$${space.price}</b>?
        </p>

        <div class="property-action-buttons">

          <button
            id="propertyBuy"
            class="primary"
            ${
              me.cash <
              space.price
                ? "disabled"
                : ""
            }
          >
            🏠 Buy $${space.price}
          </button>

          <button
            id="propertyDecline"
          >
            Pass
          </button>

        </div>

      </div>
    `;
  }

  if (
    state.phase === "end"
  ) {
    return `
      <div class="property-action-panel">

        <div class="property-action-icon">
          ✅
        </div>

        <h3>Move complete</h3>

        <button
          id="propertyEndTurn"
          class="primary property-main-button"
        >
          End turn →
        </button>

      </div>
    `;
  }

  return `
    <div class="property-action-panel">

      <div class="property-action-icon">
        🎲
      </div>

      <h3>Your turn</h3>

      <p>
        Roll the dice and build your empire.
      </p>

      <button
        id="propertyRoll"
        class="primary property-main-button"
      >
        🎲 Roll dice
      </button>

    </div>
  `;
}


/* ==================================================
   BUTTON EVENTS
================================================== */

function bindPropertyActions({
  state,
  mySlot,
  playerName,
  mount,
  pushState
}) {
  mount
    .querySelector(
      "#propertyRoll"
    )
    ?.addEventListener(
      "click",
      () =>
        rollTurn(
          state,
          mySlot,
          playerName,
          pushState
        )
    );

  mount
    .querySelector(
      "#propertyBuy"
    )
    ?.addEventListener(
      "click",
      () =>
        buyPendingProperty(
          state,
          mySlot,
          playerName,
          pushState
        )
    );

  mount
    .querySelector(
      "#propertyDecline"
    )
    ?.addEventListener(
      "click",
      async () => {
        if (
          state.turn !== mySlot
        ) {
          return;
        }

        const next =
          clone(state);

        next.pendingAction =
          null;

        next.phase =
          "end";

        next.lastAction =
          "Property was not purchased.";

        await pushState(next);
      }
    );

  mount
    .querySelector(
      "#propertyEndTurn"
    )
    ?.addEventListener(
      "click",
      () =>
        endTurn(
          state,
          mySlot,
          playerName,
          pushState
        )
    );

  mount
    .querySelector(
      "#propertyJailRoll"
    )
    ?.addEventListener(
      "click",
      () =>
        jailRoll(
          state,
          mySlot,
          playerName,
          pushState
        )
    );

  mount
    .querySelector(
      "#propertyPayJail"
    )
    ?.addEventListener(
      "click",
      () =>
        payJail(
          state,
          mySlot,
          playerName,
          pushState
        )
    );
}


/* ==================================================
   NORMAL DICE TURN
================================================== */

async function rollTurn(
  state,
  mySlot,
  playerName,
  pushState
) {
  if (
    state.turn !== mySlot ||
    state.winner ||
    state.phase !== "roll" ||
    state.players[
      mySlot
    ].inJail
  ) {
    return;
  }

  const next =
    clone(state);

  const first =
    randomDie();

  const second =
    randomDie();

  const total =
    first + second;

  const doubles =
    first === second;

  next.dice = {
    first,
    second,
    total,
    doubles,
    rolling: false
  };

  if (doubles) {
    next.doublesInRow =
      (next.doublesInRow || 0) +
      1;
  }

  else {
    next.doublesInRow = 0;
  }

  if (
    next.doublesInRow >= 3
  ) {
    sendToJail(
      next,
      mySlot
    );

    next.doublesInRow = 0;
    next.phase = "end";

    next.lastAction =
      `${playerName(
        mySlot
      )} rolled three doubles and was sent to Detention.`;

    await pushState(next);

    return;
  }

  movePlayer(
    next,
    mySlot,
    total,
    playerName
  );

  resolveLanding(
    next,
    mySlot,
    total,
    playerName
  );

  checkBankruptcyAndWinner(
    next,
    playerName
  );

  await pushState(next);
}


/* ==================================================
   MOVEMENT
================================================== */

function movePlayer(
  state,
  slot,
  amount,
  playerName
) {
  const player =
    state.players[slot];

  const oldPosition =
    player.position;

  const rawPosition =
    oldPosition + amount;

  if (
    rawPosition >=
    PROPERTY_BOARD.length
  ) {
    player.cash +=
      START_MONEY;

    state.lastAction =
      `${playerName(
        slot
      )} passed Launch Square and collected $${START_MONEY}. `;
  }

  player.position =
    rawPosition %
    PROPERTY_BOARD.length;
}


/* ==================================================
   LANDING RESOLUTION
================================================== */

function resolveLanding(
  state,
  slot,
  diceTotal,
  playerName
) {
  const player =
    state.players[slot];

  const space =
    getSpaceAt(
      player.position
    );

  const prefix =
    state.lastAction || "";

  if (
    space.type === "start"
  ) {
    state.lastAction =
      prefix +
      `${playerName(
        slot
      )} landed on Launch Square.`;

    state.phase = "end";

    return;
  }

  if (
    isOwnable(space)
  ) {
    resolveOwnable(
      state,
      slot,
      space,
      diceTotal,
      playerName
    );

    return;
  }

  if (
    space.type === "tax"
  ) {
    player.cash -=
      space.amount;

    state.lastAction =
      prefix +
      `${playerName(
        slot
      )} paid $${space.amount} ${space.name}.`;

    state.phase = "end";

    return;
  }

  if (
    space.type === "gotojail"
  ) {
    sendToJail(
      state,
      slot
    );

    state.lastAction =
      `${playerName(
        slot
      )} was sent to Detention.`;

    state.phase = "end";

    return;
  }

  if (
    space.type === "jail"
  ) {
    state.lastAction =
      prefix +
      `${playerName(
        slot
      )} is just visiting Detention.`;

    state.phase = "end";

    return;
  }

  if (
    space.type === "rest"
  ) {
    state.lastAction =
      prefix +
      `${playerName(
        slot
      )} is relaxing in City Park.`;

    state.phase = "end";

    return;
  }

  if (
    space.type === "chance"
  ) {
    drawEvent(
      state,
      slot,
      "chance",
      playerName
    );

    return;
  }

  if (
    space.type ===
      "community"
  ) {
    drawEvent(
      state,
      slot,
      "community",
      playerName
    );

    return;
  }

  state.phase = "end";
}


/* ==================================================
   PROPERTY / RENT
================================================== */

function resolveOwnable(
  state,
  slot,
  space,
  diceTotal,
  playerName
) {
  const owner =
    state.ownership[
      space.id
    ];

  if (!owner) {
    state.pendingAction = {
      type: "buy",
      player: slot,
      space: space.id
    };

    state.phase = "action";

    state.lastAction =
      `${playerName(
        slot
      )} landed on ${space.name}.`;

    return;
  }

  if (owner === slot) {
    state.lastAction =
      `${playerName(
        slot
      )} landed on their own ${space.name}.`;

    state.phase = "end";

    return;
  }

  if (
    state.mortgaged[
      space.id
    ]
  ) {
    state.lastAction =
      `${space.name} is mortgaged. No rent is due.`;

    state.phase = "end";

    return;
  }

  const rent =
    calculateRent(
      state,
      space,
      owner,
      diceTotal
    );

  transferMoney(
    state,
    slot,
    owner,
    rent
  );

  state.lastAction =
    `${playerName(
      slot
    )} paid $${rent} rent to ${playerName(
      owner
    )}.`;

  state.phase = "end";
}


function calculateRent(
  state,
  space,
  owner,
  diceTotal
) {
  if (
    space.type === "station"
  ) {
    const count =
      PROPERTY_BOARD.filter(
        item =>
          item.type ===
            "station" &&
          state.ownership[
            item.id
          ] === owner &&
          !state.mortgaged[
            item.id
          ]
      ).length;

    return stationRent(count);
  }

  if (
    space.type === "utility"
  ) {
    const count =
      PROPERTY_BOARD.filter(
        item =>
          item.type ===
            "utility" &&
          state.ownership[
            item.id
          ] === owner &&
          !state.mortgaged[
            item.id
          ]
      ).length;

    return utilityRent(
      count,
      diceTotal
    );
  }

  const buildings =
    state.buildings[
      space.id
    ] || 0;

  if (buildings > 0) {
    return space.rent[
      Math.min(
        buildings,
        5
      )
    ];
  }

  let rent =
    space.rent[0];

  if (
    playerOwnsFullGroup(
      state,
      owner,
      space.group
    )
  ) {
    rent *= 2;
  }

  return rent;
}


/* ==================================================
   BUYING
================================================== */

async function buyPendingProperty(
  state,
  mySlot,
  playerName,
  pushState
) {
  const pending =
    state.pendingAction;

  if (
    state.turn !== mySlot ||
    pending?.type !==
      "buy" ||
    pending.player !==
      mySlot
  ) {
    return;
  }

  const space =
    getSpaceById(
      pending.space
    );

  if (
    !space ||
    state.ownership[
      space.id
    ] ||
    state.players[
      mySlot
    ].cash <
      space.price
  ) {
    return;
  }

  const next =
    clone(state);

  next.players[
    mySlot
  ].cash -=
    space.price;

  next.ownership[
    space.id
  ] = mySlot;

  if (
    !next.players[
      mySlot
    ].properties.includes(
      space.id
    )
  ) {
    next.players[
      mySlot
    ].properties.push(
      space.id
    );
  }

  next.pendingAction =
    null;

  next.phase = "end";

  next.lastAction =
    `${playerName(
      mySlot
    )} bought ${space.name} for $${space.price}.`;

  await pushState(next);
}


/* ==================================================
   END TURN
================================================== */

async function endTurn(
  state,
  mySlot,
  playerName,
  pushState
) {
  if (
    state.turn !== mySlot ||
    state.winner ||
    state.phase !== "end"
  ) {
    return;
  }

  const next =
    clone(state);

  /*
    Doubles give another turn,
    unless the player is detained.
  */

  if (
    next.dice.doubles &&
    !next.players[
      mySlot
    ].inJail
  ) {
    next.phase = "roll";

    next.lastAction =
      `${playerName(
        mySlot
      )} rolled doubles and goes again.`;

    next.dice = emptyDice();

    await pushState(next);

    return;
  }

  next.turn =
    other(mySlot);

  next.phase = "roll";

  next.doublesInRow = 0;

  next.dice =
    emptyDice();

  if (
    next.turn === "A"
  ) {
    next.round =
      (next.round || 1) + 1;
  }

  next.lastAction =
    `${playerName(
      next.turn
    )}'s turn.`;

  await pushState(next);
}


/* ==================================================
   DETENTION
================================================== */

function sendToJail(
  state,
  slot
) {
  const player =
    state.players[slot];

  player.position =
    JAIL_POSITION;

  player.inJail = true;
  player.jailTurns = 0;
}


async function payJail(
  state,
  mySlot,
  playerName,
  pushState
) {
  const player =
    state.players[
      mySlot
    ];

  if (
    state.turn !== mySlot ||
    !player.inJail ||
    player.cash <
      JAIL_FINE
  ) {
    return;
  }

  const next =
    clone(state);

  next.players[
    mySlot
  ].cash -=
    JAIL_FINE;

  next.players[
    mySlot
  ].inJail =
    false;

  next.players[
    mySlot
  ].jailTurns =
    0;

  next.phase = "roll";

  next.lastAction =
    `${playerName(
      mySlot
    )} paid $${JAIL_FINE} and left Detention.`;

  await pushState(next);
}


async function jailRoll(
  state,
  mySlot,
  playerName,
  pushState
) {
  if (
    state.turn !== mySlot ||
    !state.players[
      mySlot
    ].inJail
  ) {
    return;
  }

  const next =
    clone(state);

  const first =
    randomDie();

  const second =
    randomDie();

  const total =
    first + second;

  next.dice = {
    first,
    second,
    total,
    doubles:
      first === second,
    rolling: false
  };

  const player =
    next.players[
      mySlot
    ];

  if (first === second) {
    player.inJail = false;
    player.jailTurns = 0;

    movePlayer(
      next,
      mySlot,
      total,
      playerName
    );

    next.lastAction =
      `${playerName(
        mySlot
      )} rolled doubles and escaped Detention. `;

    resolveLanding(
      next,
      mySlot,
      total,
      playerName
    );

    /*
      Escaping detention with doubles
      does not award another roll.
    */

    next.dice.doubles =
      false;
  }

  else {
    player.jailTurns =
      (player.jailTurns || 0) +
      1;

    if (
      player.jailTurns >= 3
    ) {
      const payment =
        Math.min(
          JAIL_FINE,
          player.cash
        );

      player.cash -=
        payment;

      player.inJail =
        false;

      player.jailTurns =
        0;

      movePlayer(
        next,
        mySlot,
        total,
        playerName
      );

      next.lastAction =
        `${playerName(
          mySlot
        )} served three turns, paid $${payment}, and left Detention. `;

      resolveLanding(
        next,
        mySlot,
        total,
        playerName
      );
    }

    else {
      next.phase = "end";

      next.lastAction =
        `${playerName(
          mySlot
        )} did not roll doubles and remains in Detention.`;
    }
  }

  checkBankruptcyAndWinner(
    next,
    playerName
  );

  await pushState(next);
}


/* ==================================================
   EVENT CARDS
================================================== */

const CHANCE_CARDS = [
  {
    text:
      "Your investment pays off. Collect $100.",
    money: 100
  },
  {
    text:
      "Speeding fine. Pay $50.",
    money: -50
  },
  {
    text:
      "Advance to Launch Square. Collect $200.",
    move: 0,
    collect: 200
  },
  {
    text:
      "Business bonus. Collect $150.",
    money: 150
  },
  {
    text:
      "Unexpected repairs. Pay $75.",
    money: -75
  },
  {
    text:
      "Go directly to Detention.",
    jail: true
  },
  {
    text:
      "Move forward three spaces.",
    relative: 3
  },
  {
    text:
      "Travel refund. Collect $50.",
    money: 50
  }
];


const COMMUNITY_CARDS = [
  {
    text:
      "Bank error in your favour. Collect $200.",
    money: 200
  },
  {
    text:
      "Medical bill. Pay $50.",
    money: -50
  },
  {
    text:
      "Community award. Collect $100.",
    money: 100
  },
  {
    text:
      "School fees. Pay $100.",
    money: -100
  },
  {
    text:
      "Holiday fund matures. Collect $100.",
    money: 100
  },
  {
    text:
      "Insurance refund. Collect $25.",
    money: 25
  },
  {
    text:
      "Go directly to Detention.",
    jail: true
  },
  {
    text:
      "Consulting fee. Collect $50.",
    money: 50
  }
];


function drawEvent(
  state,
  slot,
  type,
  playerName
) {
  const deck =
    type === "chance"
      ? CHANCE_CARDS
      : COMMUNITY_CARDS;

  const card =
    deck[
      Math.floor(
        Math.random() *
        deck.length
      )
    ];

  const player =
    state.players[slot];

  if (card.money) {
    player.cash +=
      card.money;
  }

  if (card.jail) {
    sendToJail(
      state,
      slot
    );
  }

  if (
    Number.isInteger(
      card.move
    )
  ) {
    player.position =
      card.move;

    if (card.collect) {
      player.cash +=
        card.collect;
    }
  }

  if (card.relative) {
    const old =
      player.position;

    player.position =
      (
        player.position +
        card.relative +
        PROPERTY_BOARD.length
      ) %
      PROPERTY_BOARD.length;

    if (
      card.relative > 0 &&
      player.position < old
    ) {
      player.cash +=
        START_MONEY;
    }
  }

  state.lastAction =
    `${playerName(
      slot
    )} drew a ${
      type === "chance"
        ? "Fortune"
        : "Community Fund"
    } card: ${card.text}`;

  state.phase = "end";
}


/* ==================================================
   BANKRUPTCY / WINNER
================================================== */

function checkBankruptcyAndWinner(
  state,
  playerName
) {
  for (
    const slot of ["A", "B"]
  ) {
    const player =
      state.players[slot];

    if (
      player.cash >= 0 ||
      player.bankrupt
    ) {
      continue;
    }

    player.bankrupt = true;

    for (
      const [
        propertyId,
        owner
      ] of Object.entries(
        state.ownership
      )
    ) {
      if (owner === slot) {
        delete state.ownership[
          propertyId
        ];

        delete state.buildings[
          propertyId
        ];

        delete state.mortgaged[
          propertyId
        ];
      }
    }

    player.properties = [];

    const winner =
      other(slot);

    state.winner =
      winner;

    state.phase =
      "finished";

    state.lastAction =
      `${playerName(
        slot
      )} went bankrupt. ${playerName(
        winner
      )} wins Property Empire!`;

    return;
  }
}


/* ==================================================
   MONEY
================================================== */

function transferMoney(
  state,
  from,
  to,
  amount
) {
  state.players[
    from
  ].cash -= amount;

  state.players[
    to
  ].cash += amount;
}


/* ==================================================
   PUBLIC TURN HELPERS
================================================== */

export function propertyTurnText(
  state,
  mySlot,
  playerName
) {
  if (!state) {
    return "";
  }

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
    state.turn === mySlot
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


/* ==================================================
   SMALL HELPERS
================================================== */

function other(slot) {
  return slot === "A"
    ? "B"
    : "A";
}


function clone(value) {
  return structuredClone(
    value
  );
}


function randomDie() {
  return (
    Math.floor(
      Math.random() * 6
    ) + 1
  );
}


function emptyDice() {
  return {
    first: 0,
    second: 0,
    total: 0,
    doubles: false,
    rolling: false
  };
}


function isOwnable(space) {
  return (
    space.type ===
      "property" ||
    space.type ===
      "station" ||
    space.type ===
      "utility"
  );
}


function getToken(id) {
  return PROPERTY_TOKENS.find(
    token =>
      token.id === id
  );
}


function money(value) {
  return Math.max(
    0,
    Number(value) || 0
  ).toLocaleString();
}


function iconForSpace(space) {
  if (!space) {
    return "🏠";
  }

  if (
    space.type ===
      "property"
  ) {
    return "🏠";
  }

  if (
    space.type ===
      "station"
  ) {
    return "🚆";
  }

  if (
    space.type ===
      "utility"
  ) {
    return space.icon ||
      "💡";
  }

  return space.icon ||
    "📍";
}


function shortName(name) {
  return name
    .replace(
      " Boulevard",
      " Blvd"
    )
    .replace(
      " Avenue",
      " Ave"
    )
    .replace(
      " Street",
      " St"
    );
}


function diceFace(value) {
  const faces = [
    "–",
    "⚀",
    "⚁",
    "⚂",
    "⚃",
    "⚄",
    "⚅"
  ];

  return `
    <span>
      ${faces[value] || "–"}
    </span>
  `;
}


function escapeHTML(value) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}
