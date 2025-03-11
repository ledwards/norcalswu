import Image from "next/image";
import Link from "next/link";
import StoreCard from "./components/StoreCard";

const stores = {
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
      showdown: "TBD",
      registrationUrl: "https://www.gamescapesf.store/events",
    },
    social: {
      facebook: "https://www.facebook.com/GamescapeSF/",
      website: "https://www.gamescapesf.com/",
      discord: "https://discord.com/invite/YBVRpvtDqM",
      store: "https://www.gamescapesf.store/",
      instagram: "https://www.instagram.com/gamescapesf/",
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
      showdown: "TBD",
      registrationUrl: "https://thegameparloursf.square.site/shop/23",
    },
    social: {
      facebook: "https://www.facebook.com/thegameparloursf/",
      website: "https://www.thegameparlour.com/",
      discord: "https://discord.gg/5QvSX7sm",
      store: "https://order.toasttab.com/online/the-game-parlour-1342-irving-street",
      instagram: "https://www.instagram.com/thegameparloursf/",
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
      email: "gamesofbrentwoodinc2023@gmail.com"
    },
    events: {
      weeklyPlay: "Sundays 2:00pm",
      showdown: "TBD",
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
      showdown: "TBD",
    },
    social: {
      facebook: "https://www.facebook.com/GamesOfBerkeley/",
      website: "https://www.gamesofberkeley.com/",
      instagram: "https://www.instagram.com/gamesofberkeley/",
      store: "https://gamesofberkeley.com/products",
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
      showdown: "TBD",
    },
    social: {
      facebook: "https://www.facebook.com/gamesoffremont/",
      instagram: "https://www.instagram.com/gamesoffremont/",
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
      showdown: "TBD",
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
      showdown: "TBD",
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
      showdown: "TBD",
      registrationUrl: "https://www.88cardhouse.com/collections/tournament-sign-up/products/star-wars-unlimited-weekly-play"
    },
    social: {
      facebook: "https://www.facebook.com/88cardhouse/",
      instagram: "https://www.instagram.com/88cardhouse/",
      discord: "https://discord.gg/bEwP86uaUJ",
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
      showdown: "TBD",
    },
    social: {
      facebook: "https://www.facebook.com/thegamefortressofficial",
      website: "https://www.thegamefortress.store",
      instagram: "https://www.instagram.com/thegamefortressofficial",
      store: "https://www.thegamefortress.store/s/shop",
      discord: "https://discord.gg/vaJDyMFAtW",
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
      showdown: "TBD",
      registrationUrl: "https://animeimports.net/products/star-wars-unlimted-constructed-wednesdays-ticket-46?ticket=star-wars-unlimted-constructed-wednesdays-ticket-51",
    },
    social: {
      facebook: "https://www.facebook.com/AnimeImports.net",
      website: "https://www.animeimports.net/",
      instagram: "https://www.instagram.com/animeimports/",
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
      showdown: "TBD",
    },
    social: {
      facebook: "https://www.facebook.com/GameKastleFremont/",
      website: "https://www.gamekastle.com/stores/fremont",
      instagram: "https://www.instagram.com/gamekastlefremont/",
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
      showdown: "TBD",
      registrationUrl: "https://shop.illusivecomics.com/events/",
    },
    social: {
      facebook: "https://www.facebook.com/illusivecomics/",
      website: "https://www.illusivecomics.com/",
      instagram: "https://www.instagram.com/illusivecomics/",
      discord: "https://discord.com/invite/n4V9z3G",
      store: "https://shop.illusivecomics.com",
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
      showdown: "TBD",
    },
    social: {
      facebook: "https://www.facebook.com/GameKastleRedwoodCity/",
      website: "https://www.gamekastle.com/stores/redwoodcity",
      instagram: "https://www.instagram.com/gamekastleredwoodcity/",
      discord: "https://discord.gg/JuJP4JBSUa",
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
      showdown: "TBD",
      registrationUrl: "https://gamelandia.fun/products/star-wars-unlimited-draft",
    },
    social: {
      facebook: "https://www.facebook.com/gamelandia.fun",
      website: "https://www.gamelandia.fun/",
      instagram: "https://www.instagram.com/gamelandia.fun/",
    },
  },
};

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-8 flex flex-col items-center bg-white">
        <div className="w-full md:w-[50%] mb-6">
          <Image
            src="/Flag_of_California.png"
            alt="California State Flag"
            width={600}
            height={338}
            className="w-full h-auto"
            priority
          />
        </div>
        <h1 className="sr-only">
          NorCal Star Wars: Unlimited
        </h1>
        <p className="text-xl text-gray-900 mb-6 max-w-lg mx-auto leading-relaxed">
          <span className="md:hidden">Join our growing community of Star Wars: Unlimited players in Northern California</span>
          <span className="hidden md:inline">
            Join our growing community of<br />
            Star Wars: Unlimited players<br />
            in Northern California
          </span>
        </p>
        <Link
          href="https://discord.gg/RkbeFyrb"
          className="inline-block bg-[#463E3F] text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[#5865F2] transition-colors shadow-sm"
          target="_blank"
          rel="noopener noreferrer"
        >
          Join our Discord
        </Link>
      </section>

      {/* Calendar Section */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Upcoming Events</h2>
        <div className="aspect-[3/2] w-full mb-4">
          <iframe
            src="https://calendar.google.com/calendar/embed?src=047048eefea36248a07bfb5565ea9a9d6741d8a8ca0cf11f49a7e90dedd88a8e%40group.calendar.google.com&mode=AGENDA"
            style={{ border: 0 }}
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
          ></iframe>
        </div>
        <p className="text-sm text-gray-600 italic text-center">
          Interested in being an admin for this calendar? Contact @terronk on the NorCal SWU Discord
        </p>
      </section>

      {/* Community Section */}
      <section className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">New Players Welcome</h2>
          <p className="text-gray-700">
            Whether you're just starting out or a seasoned player, our community welcomes all skill levels.
            Join us for regular meetups, tournaments, and casual play sessions.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Find Local Players</h2>
          <p className="text-gray-700 mb-6">
            Connect with Star Wars: Unlimited players in the Northern California area.
            Share strategies, trade cards, and make new friends in the community.
          </p>
          <Link
            href="https://discord.gg/RkbeFyrb"
            className="inline-block bg-[#463E3F] text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[#5865F2] transition-colors shadow-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join the Community →
          </Link>
        </div>
      </section>

      {/* Game Stores Section */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-8 text-gray-900">Local Game Stores</h2>
        
        {/* San Francisco */}
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">San Francisco</h3>
          <div className="grid md:grid-cols-2 gap-8 auto-cols-min">
            <StoreCard {...stores.gamescape} />
            <StoreCard {...stores.gameParlour} />
          </div>
        </div>

        {/* East Bay */}
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">East Bay</h3>
          <p className="text-gray-800 text-sm mb-2">Berkeley, Oakland, Alameda, Walnut Creek, Concord, Dublin, Pleasanton</p>
          <div className="grid md:grid-cols-2 gap-8 auto-cols-min">
            <StoreCard {...stores.gamesOfBerkeley} />
            <StoreCard {...stores.gamesOfBrentwood} />
            <StoreCard {...stores.gamesOfFremont} />
            <StoreCard {...stores.gamesOfMartinez} />
            <StoreCard {...stores.gamesOfPittsburg} />
            <StoreCard {...stores.cardhouse88} />
            <StoreCard {...stores.gameKastleFremont} />
          </div>
        </div>

        {/* Peninsula */}
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">Peninsula</h3>
          <p className="text-gray-800 text-sm mb-2">San Mateo, Redwood City, Burlingame, San Carlos</p>
          <div className="grid md:grid-cols-2 gap-8 auto-cols-min">
            <StoreCard {...stores.animeImports} />
            <StoreCard {...stores.gameKastleRedwood} />
          </div>
        </div>

        {/* South Bay */}
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">South Bay</h3>
          <p className="text-gray-800 text-sm mb-2">San Jose, Santa Clara, Mountain View, Sunnyvale, Cupertino</p>
          <div className="grid md:grid-cols-2 gap-8 auto-cols-min">
            <StoreCard {...stores.illusiveComics} />
            <StoreCard {...stores.gamelandia} />
          </div>
        </div>

        {/* North Bay */}
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">North Bay</h3>
          <p className="text-gray-800 text-sm mb-2">San Rafael, Novato, Santa Rosa, Petaluma</p>
          <div className="grid md:grid-cols-2 gap-8 auto-cols-min">
            <StoreCard {...stores.gameFortress} />
          </div>
        </div>

        {/* Sacramento */}
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">Sacramento</h3>
          <p className="text-gray-800 text-sm mb-2">Sacramento, Davis, Folsom, Roseville</p>
        </div>

        {/* Contact Info */}
        <p className="text-sm text-gray-600 italic text-center">
          Missing or incorrect information? Contact @terronk on the NorCal SWU Discord
        </p>
      </section>
    </div>
  );
}
