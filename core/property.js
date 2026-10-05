/*
  PROPERTY EMPIRE
  Board configuration and economic data.

  Keeping this separate from app.js makes it easy
  to rebalance or reskin the game later.
*/

export const PROPERTY_TOKENS = [
  { id: "car", emoji: "🚗", name: "Car" },
  { id: "cat", emoji: "🐱", name: "Cat" },
  { id: "rocket", emoji: "🚀", name: "Rocket" },
  { id: "hat", emoji: "🎩", name: "Hat" },
  { id: "dog", emoji: "🐶", name: "Dog" },
  { id: "ship", emoji: "⛵", name: "Ship" }
];


/*
  Colour groups.

  CSS colours are deliberately stored here so the
  board renderer can use the same data everywhere.
*/

export const PROPERTY_GROUPS = {
  brown: {
    name: "Brown",
    color: "#8b5a2b"
  },

  lightblue: {
    name: "Light Blue",
    color: "#87ceeb"
  },

  pink: {
    name: "Pink",
    color: "#d96cac"
  },

  orange: {
    name: "Orange",
    color: "#f39c3d"
  },

  red: {
    name: "Red",
    color: "#e84c4f"
  },

  yellow: {
    name: "Yellow",
    color: "#f4d447"
  },

  green: {
    name: "Green",
    color: "#38a169"
  },

  darkblue: {
    name: "Dark Blue",
    color: "#3157a4"
  }
};


/*
  PROPERTY RENT FORMAT

  rent[0] = normal rent
  rent[1] = one house
  rent[2] = two houses
  rent[3] = three houses
  rent[4] = four houses
  rent[5] = hotel

  If a player owns an entire colour group and the
  property has no buildings, base rent will later
  be doubled by the game engine.
*/


export const PROPERTY_BOARD = [

  /* 0 */
  {
    id: "start",
    type: "start",
    name: "Launch Square",
    icon: "🚩",
    salary: 200
  },


  /* 1 */
  {
    id: "old_quarter",
    type: "property",
    name: "Old Quarter",
    group: "brown",
    price: 60,
    mortgage: 30,
    houseCost: 50,
    rent: [2,10,30,90,160,250]
  },


  /* 2 */
  {
    id: "community_1",
    type: "community",
    name: "Community Fund",
    icon: "🎁"
  },


  /* 3 */
  {
    id: "maple_lane",
    type: "property",
    name: "Maple Lane",
    group: "brown",
    price: 60,
    mortgage: 30,
    houseCost: 50,
    rent: [4,20,60,180,320,450]
  },


  /* 4 */
  {
    id: "city_tax",
    type: "tax",
    name: "City Tax",
    icon: "💸",
    amount: 200
  },


  /* 5 */
  {
    id: "central_station",
    type: "station",
    name: "Central Station",
    icon: "🚆",
    price: 200,
    mortgage: 100
  },


  /* 6 */
  {
    id: "harbour_road",
    type: "property",
    name: "Harbour Road",
    group: "lightblue",
    price: 100,
    mortgage: 50,
    houseCost: 50,
    rent: [6,30,90,270,400,550]
  },


  /* 7 */
  {
    id: "chance_1",
    type: "chance",
    name: "Fortune",
    icon: "❓"
  },


  /* 8 */
  {
    id: "skyline_avenue",
    type: "property",
    name: "Skyline Avenue",
    group: "lightblue",
    price: 100,
    mortgage: 50,
    houseCost: 50,
    rent: [6,30,90,270,400,550]
  },


  /* 9 */
  {
    id: "river_street",
    type: "property",
    name: "River Street",
    group: "lightblue",
    price: 120,
    mortgage: 60,
    houseCost: 50,
    rent: [8,40,100,300,450,600]
  },


  /* 10 */
  {
    id: "jail",
    type: "jail",
    name: "Detention",
    icon: "🔒"
  },


  /* 11 */
  {
    id: "orchid_way",
    type: "property",
    name: "Orchid Way",
    group: "pink",
    price: 140,
    mortgage: 70,
    houseCost: 100,
    rent: [10,50,150,450,625,750]
  },


  /* 12 */
  {
    id: "power_company",
    type: "utility",
    name: "Power Company",
    icon: "💡",
    price: 150,
    mortgage: 75
  },


  /* 13 */
  {
    id: "festival_street",
    type: "property",
    name: "Festival Street",
    group: "pink",
    price: 140,
    mortgage: 70,
    houseCost: 100,
    rent: [10,50,150,450,625,750]
  },


  /* 14 */
  {
    id: "rose_boulevard",
    type: "property",
    name: "Rose Boulevard",
    group: "pink",
    price: 160,
    mortgage: 80,
    houseCost: 100,
    rent: [12,60,180,500,700,900]
  },


  /* 15 */
  {
    id: "west_station",
    type: "station",
    name: "West Station",
    icon: "🚆",
    price: 200,
    mortgage: 100
  },


  /* 16 */
  {
    id: "sunset_drive",
    type: "property",
    name: "Sunset Drive",
    group: "orange",
    price: 180,
    mortgage: 90,
    houseCost: 100,
    rent: [14,70,200,550,750,950]
  },


  /* 17 */
  {
    id: "community_2",
    type: "community",
    name: "Community Fund",
    icon: "🎁"
  },


  /* 18 */
  {
    id: "market_street",
    type: "property",
    name: "Market Street",
    group: "orange",
    price: 180,
    mortgage: 90,
    houseCost: 100,
    rent: [14,70,200,550,750,950]
  },


  /* 19 */
  {
    id: "grand_avenue",
    type: "property",
    name: "Grand Avenue",
    group: "orange",
    price: 200,
    mortgage: 100,
    houseCost: 100,
    rent: [16,80,220,600,800,1000]
  },


  /* 20 */
  {
    id: "park",
    type: "rest",
    name: "City Park",
    icon: "🌳"
  },


  /* 21 */
  {
    id: "ruby_street",
    type: "property",
    name: "Ruby Street",
    group: "red",
    price: 220,
    mortgage: 110,
    houseCost: 150,
    rent: [18,90,250,700,875,1050]
  },


  /* 22 */
  {
    id: "chance_2",
    type: "chance",
    name: "Fortune",
    icon: "❓"
  },


  /* 23 */
  {
    id: "theatre_road",
    type: "property",
    name: "Theatre Road",
    group: "red",
    price: 220,
    mortgage: 110,
    houseCost: 150,
    rent: [18,90,250,700,875,1050]
  },


  /* 24 */
  {
    id: "royal_avenue",
    type: "property",
    name: "Royal Avenue",
    group: "red",
    price: 240,
    mortgage: 120,
    houseCost: 150,
    rent: [20,100,300,750,925,1100]
  },


  /* 25 */
  {
    id: "north_station",
    type: "station",
    name: "North Station",
    icon: "🚆",
    price: 200,
    mortgage: 100
  },


  /* 26 */
  {
    id: "golden_lane",
    type: "property",
    name: "Golden Lane",
    group: "yellow",
    price: 260,
    mortgage: 130,
    houseCost: 150,
    rent: [22,110,330,800,975,1150]
  },


  /* 27 */
  {
    id: "museum_avenue",
    type: "property",
    name: "Museum Avenue",
    group: "yellow",
    price: 260,
    mortgage: 130,
    houseCost: 150,
    rent: [22,110,330,800,975,1150]
  },


  /* 28 */
  {
    id: "water_company",
    type: "utility",
    name: "Water Company",
    icon: "💧",
    price: 150,
    mortgage: 75
  },


  /* 29 */
  {
    id: "sunshine_boulevard",
    type: "property",
    name: "Sunshine Boulevard",
    group: "yellow",
    price: 280,
    mortgage: 140,
    houseCost: 150,
    rent: [24,120,360,850,1025,1200]
  },


  /* 30 */
  {
    id: "go_to_jail",
    type: "gotojail",
    name: "Go to Detention",
    icon: "🚔"
  },


  /* 31 */
  {
    id: "garden_street",
    type: "property",
    name: "Garden Street",
    group: "green",
    price: 300,
    mortgage: 150,
    houseCost: 200,
    rent: [26,130,390,900,1100,1275]
  },


  /* 32 */
  {
    id: "emerald_avenue",
    type: "property",
    name: "Emerald Avenue",
    group: "green",
    price: 300,
    mortgage: 150,
    houseCost: 200,
    rent: [26,130,390,900,1100,1275]
  },


  /* 33 */
  {
    id: "community_3",
    type: "community",
    name: "Community Fund",
    icon: "🎁"
  },


  /* 34 */
  {
    id: "forest_boulevard",
    type: "property",
    name: "Forest Boulevard",
    group: "green",
    price: 320,
    mortgage: 160,
    houseCost: 200,
    rent: [28,150,450,1000,1200,1400]
  },


  /* 35 */
  {
    id: "east_station",
    type: "station",
    name: "East Station",
    icon: "🚆",
    price: 200,
    mortgage: 100
  },


  /* 36 */
  {
    id: "chance_3",
    type: "chance",
    name: "Fortune",
    icon: "❓"
  },


  /* 37 */
  {
    id: "sapphire_way",
    type: "property",
    name: "Sapphire Way",
    group: "darkblue",
    price: 350,
    mortgage: 175,
    houseCost: 200,
    rent: [35,175,500,1100,1300,1500]
  },


  /* 38 */
  {
    id: "luxury_tax",
    type: "tax",
    name: "Luxury Tax",
    icon: "💎",
    amount: 100
  },


  /* 39 */
  {
    id: "crown_avenue",
    type: "property",
    name: "Crown Avenue",
    group: "darkblue",
    price: 400,
    mortgage: 200,
    houseCost: 200,
    rent: [50,200,600,1400,1700,2000]
  }

];


/*
  Useful lists for the game engine.
*/

export const PROPERTY_IDS =
  PROPERTY_BOARD
    .filter(
      space =>
        space.type === "property" ||
        space.type === "station" ||
        space.type === "utility"
    )
    .map(
      space => space.id
    );


export const STREET_IDS =
  PROPERTY_BOARD
    .filter(
      space =>
        space.type === "property"
    )
    .map(
      space => space.id
    );


export const STATION_IDS =
  PROPERTY_BOARD
    .filter(
      space =>
        space.type === "station"
    )
    .map(
      space => space.id
    );


export const UTILITY_IDS =
  PROPERTY_BOARD
    .filter(
      space =>
        space.type === "utility"
    )
    .map(
      space => space.id
    );


/*
  Helpers.
*/

export function getSpaceById(id) {
  return PROPERTY_BOARD.find(
    space =>
      space.id === id
  );
}


export function getSpaceAt(position) {
  return PROPERTY_BOARD[
    (
      position %
      PROPERTY_BOARD.length +
      PROPERTY_BOARD.length
    ) %
    PROPERTY_BOARD.length
  ];
}


export function getGroupProperties(group) {
  return PROPERTY_BOARD.filter(
    space =>
      space.type === "property" &&
      space.group === group
  );
}


export function playerOwnsFullGroup(
  state,
  player,
  group
) {
  const groupSpaces =
    getGroupProperties(group);

  return (
    groupSpaces.length > 0 &&
    groupSpaces.every(
      space =>
        state.ownership?.[
          space.id
        ] === player
    )
  );
}


/*
  Station rent follows the familiar escalating
  structure based on how many stations are owned.
*/

export function stationRent(count) {
  if (count <= 1) return 25;
  if (count === 2) return 50;
  if (count === 3) return 100;

  return 200;
}


/*
  Utility rent is based on the dice total.

  One utility  = 4 × dice
  Both utilities = 10 × dice
*/

export function utilityRent(
  count,
  diceTotal
) {
  return (
    count >= 2
      ? diceTotal * 10
      : diceTotal * 4
  );
}
