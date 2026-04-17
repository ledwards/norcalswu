export interface StoreAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  googleMapsUrl: string;
}

export interface StoreContact {
  phone: string;
  email?: string;
}

export interface StoreEvents {
  weeklyPlay?: string;
  showdown?: string;
  registrationUrl?: string;
}

export interface StoreSocial {
  facebook?: string;
  website?: string;
  discord?: string;
  store?: string;
  instagram?: string;
}

export interface TrackedPageSource {
  id: string;
  label: string;
  url: string;
  sourceType?: "store" | "melee" | "swu";
  keywords?: string[];
}

export interface StoreSyncConfig {
  trackedPages?: TrackedPageSource[];
  swuapiAliases?: string[];
}

export interface StoreRecord {
  name: string;
  address: StoreAddress;
  contact: StoreContact;
  events: StoreEvents;
  social: StoreSocial;
  sync?: StoreSyncConfig;
}

export type StoreMap = Record<string, StoreRecord>;

export interface StoreRegion {
  id: string;
  title: string;
  description?: string;
  storeIds: string[];
}

export const stores: StoreMap = {
  gamescape: {
    name: "Gamescape SF",
    address: {
      street: "333 Divisadero St",
      city: "San Francisco",
      state: "CA",
      zip: "94117",
      googleMapsUrl: "https://www.google.com/maps/place/Gamescape/@37.7729231,-122.4391581,17z",
    },
    contact: {
      phone: "(415) 621-4263",
      email: "info@gamescapesf.com",
    },
    events: {
      weeklyPlay: "Tuesdays 7:00pm",
      registrationUrl: "https://www.gamescapesf.store/events",
    },
    social: {
      facebook: "https://www.facebook.com/GamescapeSF/",
      website: "https://www.gamescapesf.com/",
      discord: "https://discord.com/invite/YBVRpvtDqM",
      store: "https://www.gamescapesf.store/",
      instagram: "https://www.instagram.com/gamescapesf/",
    },
    sync: {
      swuapiAliases: ["Gamescape"],
    },
  },
  gameParlour: {
    name: "The Game Parlour",
    address: {
      street: "1342 Irving St",
      city: "San Francisco",
      state: "CA",
      zip: "94122",
      googleMapsUrl: "https://www.google.com/maps/place/The+Game+Parlour/@37.7930731,-122.4725231,17z",
    },
    contact: {
      phone: "(415) 566-0170",
      email: "hello@thegameparlour.com",
    },
    events: {
      weeklyPlay: "Fridays 6:30pm",
      registrationUrl: "https://thegameparloursf.square.site/shop/23",
    },
    social: {
      facebook: "https://www.facebook.com/thegameparloursf/",
      website: "https://www.thegameparlour.com/",
      discord: "https://discord.gg/5QvSX7sm",
      store: "https://order.toasttab.com/online/the-game-parlour-1342-irving-street",
      instagram: "https://www.instagram.com/thegameparloursf/",
    },
    sync: {
      swuapiAliases: ["Game Parlour"],
    },
  },
  gamesOfBrentwood: {
    name: "Games of Brentwood",
    address: {
      street: "2430 Sand Creek Rd Suite D-3",
      city: "Brentwood",
      state: "CA",
      zip: "94513",
      googleMapsUrl: "https://www.google.com/maps/place/Games+of+Brentwood/@37.9417108,-121.7392959,813m",
    },
    contact: {
      phone: "(925) 679-4053",
      email: "gamesofbrentwoodinc2023@gmail.com",
    },
    events: {
      weeklyPlay: "Sundays 2:00pm",
    },
    social: {
      facebook: "https://www.facebook.com/GamesOfBrentwood/",
      discord: "https://discord.com/invite/hghP5yp3Ks",
      instagram: "https://www.instagram.com/gamesofbrentwood/",
    },
  },
  gamesOfBerkeley: {
    name: "Games of Berkeley",
    address: {
      street: "2510 Durant Ave",
      city: "Berkeley",
      state: "CA",
      zip: "94704",
      googleMapsUrl: "https://www.google.com/maps/place/Games+of+Berkeley/@37.8679439,-122.2577293,17z",
    },
    contact: {
      phone: "(510) 540-7822",
      email: "info@gamesofberkeley.com",
    },
    events: {
      weeklyPlay: "Wednesdays 6:00pm",
    },
    social: {
      facebook: "https://www.facebook.com/GamesOfBerkeley/",
      website: "https://www.gamesofberkeley.com/",
      instagram: "https://www.instagram.com/gamesofberkeley/",
      store: "https://gamesofberkeley.com/products",
    },
    sync: {
      trackedPages: [
        {
          id: "games-of-berkeley-event-info",
          label: "Games of Berkeley event info",
          url: "https://gamesofberkeley.com/products/calendar-and-event-info",
        },
      ],
    },
  },
  gamesOfFremont: {
    name: "Games of Fremont",
    address: {
      street: "39483 Fremont Blvd",
      city: "Fremont",
      state: "CA",
      zip: "94538",
      googleMapsUrl: "https://www.google.com/maps/place/Games+of+Fremont/@37.5384,-121.9784,17z",
    },
    contact: {
      phone: "(510) 505-0101",
      email: "gamesoffremont@gmail.com",
    },
    events: {
      weeklyPlay: "Thursdays 6:30pm",
    },
    social: {
      website: "https://www.gamesoffremont.com/",
      facebook: "https://www.facebook.com/gamesoffremont/",
      instagram: "https://www.instagram.com/gamesoffremont/",
    },
    sync: {
      trackedPages: [
        {
          id: "games-of-fremont-main",
          label: "Games of Fremont website",
          url: "https://www.gamesoffremont.com/",
        },
      ],
    },
  },
  gamesOfMartinez: {
    name: "Games of Martinez",
    address: {
      street: "1035 Arnold Dr",
      city: "Martinez",
      state: "CA",
      zip: "94553",
      googleMapsUrl: "https://www.google.com/maps/place/Games+of+Martinez/@37.9989,-122.1235,17z",
    },
    contact: {
      phone: "(925) 228-4477",
      email: "gamesofmartinez@gmail.com",
    },
    events: {
      weeklyPlay: "Saturdays 3:00pm",
    },
    social: {
      website: "https://gamesofmartinez.crystalcommerce.com",
      facebook: "https://www.facebook.com/gamesofmartinez/",
      instagram: "https://www.instagram.com/gamesofmartinez/",
      discord: "https://discord.com/invite/qXPRGMrsHx",
    },
  },
  gamesOfPittsburg: {
    name: "Games of Pittsburg",
    address: {
      street: "2155 Railroad Ave",
      city: "Pittsburg",
      state: "CA",
      zip: "94565",
      googleMapsUrl: "https://www.google.com/maps/place/Games+of+Pittsburg/@38.0175,-121.8863,17z",
    },
    contact: {
      phone: "(925) 439-2446",
      email: "TBD",
    },
    events: {
      weeklyPlay: "Tuesdays 7:00pm, Thursdays 7:00pm",
    },
    social: {
      website: "https://gamesofpittsburg.com",
      instagram: "https://www.instagram.com/games_of_pittsburg",
      discord: "https://discord.gg/5XhCXecc",
    },
  },
  cardhouse88: {
    name: "88 Cardhouse",
    address: {
      street: "5970 Mowry Ave Suite J",
      city: "Newark",
      state: "CA",
      zip: "94560",
      googleMapsUrl: "https://www.google.com/maps/place/88+Cardhouse/@37.5250721,-122.0064443,817m",
    },
    contact: {
      phone: "(510) 999-6188",
      email: "88cardhouse@gmail.com",
    },
    events: {
      weeklyPlay: "Saturdays 5:00pm (Constructed), Saturdays 7:00pm (Draft)",
    },
    social: {
      facebook: "https://www.facebook.com/88cardhouse/",
      website: "https://www.88cardhouse.com/",
      instagram: "https://www.instagram.com/88cardhouse/",
      discord: "https://discord.gg/bEwP86uaUJ",
    },
    sync: {
      trackedPages: [
        {
          id: "88-cardhouse-calendar",
          label: "88 Cardhouse calendar page",
          url: "https://www.88cardhouse.com/pages/88-calendar",
        },
        {
          id: "88-cardhouse-star-wars",
          label: "88 Cardhouse Star Wars collection",
          url: "https://www.88cardhouse.com/collections/star-wars",
        },
      ],
    },
  },
  gameFortress: {
    name: "The Game Fortress",
    address: {
      street: "1805 Novato Blvd",
      city: "Novato",
      state: "CA",
      zip: "94947",
      googleMapsUrl: "https://www.google.com/maps/place/Game+Fortress+Novato/@38.1079,-122.5786,17z",
    },
    contact: {
      phone: "(415) 895-1784",
      email: "info@gamefortressnovato.com",
    },
    events: {
      weeklyPlay: "Saturdays 5:00pm",
    },
    social: {
      facebook: "https://www.facebook.com/thegamefortressofficial",
      website: "https://www.thegamefortress.store",
      instagram: "https://www.instagram.com/thegamefortressofficial",
      store: "https://www.thegamefortress.store/s/shop",
      discord: "https://discord.gg/vaJDyMFAtW",
    },
    sync: {
      trackedPages: [
        {
          id: "game-fortress-events",
          label: "The Game Fortress events page",
          url: "https://www.thegamefortress.store/events",
        },
      ],
      swuapiAliases: ["Game Fortress"],
    },
  },
  animeImports: {
    name: "Anime Imports",
    address: {
      street: "116 Manor Dr",
      city: "Pacifica",
      state: "CA",
      zip: "94044",
      googleMapsUrl: "https://www.google.com/maps/place/Anime+Imports/@37.6384,-122.4921,17z",
    },
    contact: {
      phone: "(650) 488-7900",
      email: "questions@animeimports.net",
    },
    events: {
      weeklyPlay: "Wednesdays 7:00pm",
      registrationUrl: "https://animeimports.net/products/star-wars-unlimted-constructed-wednesdays-ticket-46?ticket=star-wars-unlimted-constructed-wednesdays-ticket-51",
    },
    social: {
      facebook: "https://www.facebook.com/AnimeImports.net",
      website: "https://www.animeimports.net/",
      instagram: "https://www.instagram.com/animeimports/",
    },
    sync: {
      trackedPages: [
        {
          id: "anime-imports-events",
          label: "Anime Imports events page",
          url: "https://www.animeimports.net/pages/events",
        },
      ],
    },
  },
  gameKastleFremont: {
    name: "Game Kastle Fremont",
    address: {
      street: "3911 Washington Blvd",
      city: "Fremont",
      state: "CA",
      zip: "94538",
      googleMapsUrl: "https://www.google.com/maps/place/Game+Kastle+Fremont/@37.5336,-121.9755,17z",
    },
    contact: {
      phone: "(510) 651-4263",
      email: "fremont@gamekastle.com",
    },
    events: {
      weeklyPlay: "Tuesdays 6:00pm (Open), Wednesdays 6:00pm (Constructed)",
    },
    social: {
      facebook: "https://www.facebook.com/GameKastleFremont/",
      website: "https://gamekastle.com/stores/fremont",
      instagram: "https://www.instagram.com/gamekastlefremont/",
      discord: "https://discord.gg/gamekastle",
    },
    sync: {
      trackedPages: [
        {
          id: "game-kastle-fremont-calendar",
          label: "Game Kastle Fremont event calendar",
          url: "https://gamekastle.com/pages/fremont-ca-event-calendar",
        },
      ],
      swuapiAliases: ["Game Kastle"],
    },
  },
  illusiveComics: {
    name: "Illusive Comics & Games",
    address: {
      street: "1270 Franklin Mall",
      city: "Santa Clara",
      state: "CA",
      zip: "95050",
      googleMapsUrl: "https://www.google.com/maps/place/Illusive+Comics+%26+Games/@37.3537,-121.9427,17z",
    },
    contact: {
      phone: "(408) 985-7481",
      email: "contact@illusivecomics.com",
    },
    events: {
      weeklyPlay: "Sundays 2:30pm",
      registrationUrl: "https://shop.illusivecomics.com/events/",
    },
    social: {
      facebook: "https://www.facebook.com/illusivecomics/",
      website: "https://www.illusivecomics.com/",
      instagram: "https://www.instagram.com/illusivecomics/",
      discord: "https://discord.com/invite/n4V9z3G",
      store: "https://shop.illusivecomics.com",
    },
    sync: {
      trackedPages: [
        {
          id: "illusive-star-wars-events",
          label: "Illusive Comics Star Wars event listings",
          url: "https://shop.illusivecomics.com/events/game/star-wars-unlimited/",
        },
      ],
    },
  },
  gameKastleRedwood: {
    name: "Game Kastle Redwood City",
    address: {
      street: "1991 Broadway",
      city: "Redwood City",
      state: "CA",
      zip: "94063",
      googleMapsUrl: "https://www.google.com/maps/place/Game+Kastle+Redwood+City/@37.4853,-122.2316,17z",
    },
    contact: {
      phone: "(650) 362-8743",
      email: "redwoodcity.ca@gamekastle.com",
    },
    events: {
      weeklyPlay: "Tuesdays 7:00pm (Draft on last Tuesday of each month, otherwise Constructed)",
    },
    social: {
      facebook: "https://www.facebook.com/GameKastleRedwoodCity/",
      website: "https://gamekastle.com/stores/redwoodcity",
      instagram: "https://www.instagram.com/gamekastleredwoodcity/",
      discord: "https://discord.gg/JuJP4JBSUa",
    },
    sync: {
      trackedPages: [
        {
          id: "game-kastle-redwood-calendar",
          label: "Game Kastle Redwood City event calendar",
          url: "https://gamekastle.com/pages/redwood-city-ca-event-calendar",
        },
      ],
      swuapiAliases: ["Game Kastle"],
    },
  },
  gamelandia: {
    name: "Gamelandia",
    address: {
      street: "290 California Ave, Suite A",
      city: "Palo Alto",
      state: "CA",
      zip: "94306",
      googleMapsUrl: "https://www.google.com/maps/place/Gamelandia/@37.427731,-122.1467093,819m",
    },
    contact: {
      phone: "(408) 290-9411",
      email: "info@gamelandia.fun",
    },
    events: {
      weeklyPlay: "Wednesdays 6:30pm",
    },
    social: {
      facebook: "https://www.facebook.com/gamelandia.fun",
      website: "https://www.gamelandia.fun/",
      instagram: "https://www.instagram.com/gamelandia.fun/",
    },
    sync: {
      trackedPages: [
        {
          id: "gamelandia-star-wars",
          label: "Gamelandia Star Wars Unlimited collection",
          url: "https://www.gamelandia.fun/collections/star-wars-unlimited",
        },
      ],
    },
  },
  fireAndIce: {
    name: "Fire & Ice Games (Rocklin)",
    address: {
      street: "6660 Lonetree Blvd",
      city: "Rocklin",
      state: "CA",
      zip: "95765",
      googleMapsUrl: "https://www.google.com/maps/place/Fire+%26+Ice+Games+Rocklin/@38.7975,-121.2859,17z/data=!3m1!4b1!4m6!3m5!1s0x809b1b4c8b8b8b8b:0x8b8b8b8b8b8b8b8b!8m2!3d38.7975!4d-121.2859!16s%2Fg%2F11b8b8b8b8",
    },
    contact: {
      phone: "(916) 771-2161",
    },
    events: {
      weeklyPlay: "Fridays 6:30pm",
    },
    social: {
      instagram: "https://www.instagram.com/fire.and.ice.games",
      facebook: "https://www.facebook.com/p/Fire-Ice-Games-LLC-100071624994565/",
    },
  },
  fireAndIceCitrusHeights: {
    name: "Fire & Ice Games (Citrus Heights)",
    address: {
      street: "6245 Sunrise Blvd A",
      city: "Citrus Heights",
      state: "CA",
      zip: "95610",
      googleMapsUrl: "https://www.google.com/maps/place/Fire+%26+Ice+Games+Citrus+Heights/@38.6784,-121.2728,17z/data=!3m1!4b1!4m6!3m5!1s0x809b1b4c8b8b8b8b:0x8b8b8b8b8b8b8b8b!8m2!3d38.6784!4d-121.2728!16s%2Fg%2F11b8b8b8b8",
    },
    contact: {
      phone: "(916) 910-9417",
    },
    events: {
      weeklyPlay: "Tuesdays 6:30pm",
    },
    social: {
      instagram: "https://www.instagram.com/fire.and.ice.games",
      facebook: "https://www.facebook.com/p/Fire-Ice-Games-LLC-100071624994565/",
    },
  },
  cardShopSac: {
    name: "Card Shop Sacramento X Gold Star Collectibles",
    address: {
      street: "2440 Fulton Ave Suite 9",
      city: "Sacramento",
      state: "CA",
      zip: "95825",
      googleMapsUrl: "https://www.google.com/maps/place/Card+Shop+Sacramento+X+Gold+Star+Collectibles/@38.5974,-121.4778,17z",
    },
    contact: {
      phone: "(916) 360-2394",
      email: "sales@goldstarcollectibles.com",
    },
    events: {
      weeklyPlay: "Thursdays 6:00pm",
    },
    social: {
      website: "https://www.goldstarcollectibles.com",
    },
  },
  hammerhead: {
    name: "Hammerhead Games",
    address: {
      street: "5800 Madison Ave Suite V & W",
      city: "Sacramento",
      state: "CA",
      zip: "95841",
      googleMapsUrl: "https://www.google.com/maps/place/Hammerhead+Games/@38.6619,-121.3766,17z",
    },
    contact: {
      phone: "(916) 279-4994",
      email: "HammerheadGames@Outlook.com",
    },
    events: {
      weeklyPlay: "Mondays 6:30pm",
    },
    social: {
      facebook: "https://www.facebook.com/HHGSAC",
      website: "https://www.hammerheadgames.net/",
      discord: "https://discord.com/invite/Y9qecUgkdF",
      instagram: "https://www.instagram.com/hammerhead_games/",
    },
  },
  gameKastleSac: {
    name: "Game Kastle Sacramento",
    address: {
      street: "5522 Garfield Ave",
      city: "Sacramento",
      state: "CA",
      zip: "95841",
      googleMapsUrl: "https://www.google.com/maps/place/Game+Kastle+Sacramento/@38.6486,-121.3464,17z",
    },
    contact: {
      phone: "(916) 331-8707",
      email: "sacramento@gamekastle.com",
    },
    events: {
      weeklyPlay: "Thursdays 6:30pm",
      registrationUrl: "https://gamekastle.com/stores/sacramento",
    },
    social: {
      facebook: "https://www.facebook.com/GameKastleSacramento/",
      website: "https://gamekastle.com/stores/sacramento",
      discord: "https://discord.gg/gamekastle",
    },
    sync: {
      trackedPages: [
        {
          id: "game-kastle-sac-calendar",
          label: "Game Kastle Sacramento event calendar",
          url: "https://gamekastle.com/pages/sacramento-ca-event-calendar",
        },
      ],
      swuapiAliases: ["Game Kastle"],
    },
  },
  greenPotion: {
    name: "Green Potion Games",
    address: {
      street: "1271 N Davis Rd",
      city: "Salinas",
      state: "CA",
      zip: "93907",
      googleMapsUrl: "https://www.google.com/maps/place/Green+Potion+Games/@36.7027,-121.6584,17z",
    },
    contact: {
      phone: "(831) 208-6809",
    },
    events: {
      weeklyPlay: "Thursdays 6:00pm",
    },
    social: {
      website: "https://linktr.ee/GreenPotionGames",
      discord: "https://discord.gg/greenpotion",
      facebook: "https://www.facebook.com/GreenPotionGames",
      instagram: "https://www.instagram.com/greenpotiongames",
    },
    sync: {
      trackedPages: [
        {
          id: "green-potion-linktree",
          label: "Green Potion Games link hub",
          url: "https://linktr.ee/GreenPotionGames",
        },
      ],
    },
  },
  a1Comics: {
    name: "A-1 Comics Roseville",
    address: {
      street: "818 Sunrise Ave.",
      city: "Roseville",
      state: "CA",
      zip: "95661",
      googleMapsUrl: "https://www.google.com/maps/place/A-1+Comics/data=!4m2!3m1!1s0x0:0x2e3c73b8fb4f7a05",
    },
    contact: {
      phone: "(916) 783-8005",
    },
    events: {
      weeklyPlay: "Sundays 1:00pm",
    },
    social: {
      website: "https://a-1comics.com",
      facebook: "https://www.facebook.com/a1comicsinc",
      instagram: "https://www.instagram.com/a1comics/",
    },
    sync: {
      trackedPages: [
        {
          id: "a1-comics-events",
          label: "A-1 Comics events page",
          url: "https://a-1comics.com/events/",
        },
      ],
      swuapiAliases: ["A-1 Comics"],
    },
  },
};

export const storeRegions: StoreRegion[] = [
  {
    id: "san-francisco",
    title: "San Francisco",
    storeIds: ["gamescape", "gameParlour"],
  },
  {
    id: "east-bay",
    title: "East Bay",
    description: "Your friendly local gaming stores supporting Star Wars: Unlimited in Berkeley, Oakland, Alameda, Walnut Creek, Concord, Dublin, and Pleasanton.",
    storeIds: [
      "gamesOfBerkeley",
      "gamesOfBrentwood",
      "gamesOfFremont",
      "gamesOfMartinez",
      "gamesOfPittsburg",
      "cardhouse88",
      "gameKastleFremont",
    ],
  },
  {
    id: "peninsula",
    title: "Peninsula",
    description: "Your friendly local gaming stores supporting Star Wars: Unlimited in San Mateo, Redwood City, Burlingame, and San Carlos.",
    storeIds: ["animeImports", "gameKastleRedwood"],
  },
  {
    id: "south-bay",
    title: "South Bay",
    description: "Your friendly local gaming stores supporting Star Wars: Unlimited in San Jose, Santa Clara, Mountain View, Sunnyvale, and Cupertino.",
    storeIds: ["illusiveComics", "gamelandia"],
  },
  {
    id: "north-bay",
    title: "North Bay",
    description: "Your friendly local gaming stores supporting Star Wars: Unlimited in San Rafael, Novato, Santa Rosa, and Petaluma.",
    storeIds: ["gameFortress"],
  },
  {
    id: "sacramento",
    title: "Sacramento",
    description: "Your friendly local gaming stores supporting Star Wars: Unlimited in Sacramento, Davis, Folsom, Roseville, Rocklin, and Citrus Heights.",
    storeIds: [
      "a1Comics",
      "fireAndIce",
      "fireAndIceCitrusHeights",
      "cardShopSac",
      "hammerhead",
      "gameKastleSac",
    ],
  },
  {
    id: "central-coast",
    title: "Central Coast",
    description: "Your friendly local gaming stores supporting Star Wars: Unlimited in Monterey, Santa Cruz, and Salinas.",
    storeIds: ["greenPotion"],
  },
];

export const trackedExternalSources: TrackedPageSource[] = [];
