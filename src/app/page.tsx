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
            src="https://calendar.google.com/calendar/embed?src=047048eefea36248a07bfb5565ea9a9d6741d8a8ca0cf11f49a7e90dedd88a8e%40group.calendar.google.com"
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
            <StoreCard {...stores.gamesOfBrentwood} />
          </div>
          <p className="text-gray-800 italic mt-8">More stores coming soon...</p>
        </div>

        {/* Peninsula */}
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">Peninsula</h3>
          <p className="text-gray-800 text-sm mb-2">San Mateo, Redwood City, Burlingame, San Carlos</p>
          <p className="text-gray-800 italic">Stores coming soon...</p>
        </div>

        {/* South Bay */}
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">South Bay</h3>
          <p className="text-gray-800 text-sm mb-2">San Jose, Santa Clara, Mountain View, Sunnyvale, Cupertino</p>
          <p className="text-gray-800 italic">Stores coming soon...</p>
        </div>

        {/* North Bay */}
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">North Bay</h3>
          <p className="text-gray-800 text-sm mb-2">San Rafael, Novato, Santa Rosa, Petaluma</p>
          <p className="text-gray-800 italic">Stores coming soon...</p>
        </div>

        {/* Sacramento */}
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">Sacramento</h3>
          <p className="text-gray-800 text-sm mb-2">Sacramento, Davis, Folsom, Roseville</p>
          <p className="text-gray-800 italic">Stores coming soon...</p>
        </div>

        {/* Contact Info */}
        <p className="text-sm text-gray-600 italic text-center">
          Missing or incorrect information? Contact @terronk on the NorCal SWU Discord
        </p>
      </section>
    </div>
  );
}
