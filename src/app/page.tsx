import Image from "next/image";
import Link from "next/link";
import { FaFacebook, FaGlobe, FaDiscord, FaPhone, FaEnvelope } from "react-icons/fa";

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
          Join our growing community of<br className="hidden md:block" />
          Star Wars: Unlimited players<br className="hidden md:block" />
          in Northern California
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
        <div className="aspect-[3/2] w-full">
          <iframe
            src="https://calendar.google.com/calendar/embed?src=047048eefea36248a07bfb5565ea9a9d6741d8a8ca0cf11f49a7e90dedd88a8e%40group.calendar.google.com"
            style={{ border: 0 }}
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
          ></iframe>
        </div>
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
          <div className="grid md:grid-cols-2 gap-8">
            {/* Gamescape */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Gamescape</h3>
              <div className="aspect-video mb-4 relative overflow-hidden rounded-lg">
                <iframe
                  src="https://www.google.com/maps?q=Gamescape+333+Divisadero+St+San+Francisco+CA+94117&output=embed"
                  width="100%"
                  height="100%"
                ></iframe>
              </div>
              <div className="space-y-2 mb-4">
                <p className="font-semibold text-gray-900">Address:</p>
                <Link
                  href="https://www.google.com/maps/place/Gamescape/@37.7729231,-122.4391581,17z"
                  className="text-gray-900 hover:text-blue-600 flex items-center gap-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  333 Divisadero St, San Francisco, CA 94117
                </Link>
                <p className="font-semibold mt-4 text-gray-900">Contact:</p>
                <p className="flex items-center gap-2">
                  <FaPhone className="text-lg text-green-600" />
                  <Link
                    href="tel:4156214263"
                    className="text-gray-900 hover:text-blue-600"
                  >
                    (415) 621-4263
                  </Link>
                </p>
                <p className="flex items-center gap-2">
                  <FaEnvelope className="text-lg text-gray-900" />
                  <Link
                    href="mailto:info@gamescapesf.com"
                    className="text-blue-600 hover:text-gray-900"
                  >
                    info@gamescapesf.com
                  </Link>
                </p>
                <p className="font-semibold mt-4 text-gray-900">Events:</p>
                <div className="space-y-2">
                  <p className="text-gray-800">Weekly Play: Tuesdays 7:00pm</p>
                  <p className="text-gray-800">Store Showdown: TBD</p>
                  <Link
                    href="https://www.gamescapesf.com/events"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Registration →
                  </Link>
                </div>
                <div className="flex gap-4 mt-6">
                  <Link
                    href="https://www.facebook.com/GamescapeSF/"
                    className="text-blue-600 hover:text-blue-800 text-2xl"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Facebook"
                  >
                    <FaFacebook />
                  </Link>
                  <Link
                    href="https://www.gamescapesf.com/"
                    className="text-cyan-600 hover:text-cyan-800 text-2xl"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Website"
                  >
                    <FaGlobe />
                  </Link>
                  <Link
                    href="https://discord.gg/RkbeFyrb"
                    className="text-[#5865F2] hover:text-[#4752C4] text-2xl"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Discord"
                  >
                    <FaDiscord />
                  </Link>
                </div>
              </div>
            </div>

            {/* Game Parlour */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900">The Game Parlour</h3>
              <div className="aspect-video mb-4 relative overflow-hidden rounded-lg">
                <iframe
                  src="https://www.google.com/maps?q=The+Game+Parlour+1342+Irving+St+San+Francisco+CA+94122&output=embed"
                  width="100%"
                  height="100%"
                ></iframe>
              </div>
              <div className="space-y-2 mb-4">
                <p className="font-semibold text-gray-900">Address:</p>
                <Link
                  href="https://www.google.com/maps/place/The+Game+Parlour/@37.7930731,-122.4725231,17z"
                  className="text-gray-900 hover:text-blue-600 flex items-center gap-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  1342 Irving St, San Francisco, CA 94122
                </Link>
                <p className="font-semibold mt-4 text-gray-900">Contact:</p>
                <p className="flex items-center gap-2">
                  <FaPhone className="text-lg text-green-600" />
                  <Link
                    href="tel:4155660170"
                    className="text-gray-900 hover:text-blue-600"
                  >
                    (415) 566-0170
                  </Link>
                </p>
                <p className="flex items-center gap-2">
                  <FaEnvelope className="text-lg text-gray-900" />
                  <Link
                    href="mailto:info@gameparlour.com"
                    className="text-blue-600 hover:text-gray-900"
                  >
                    info@gameparlour.com
                  </Link>
                </p>
                <p className="font-semibold mt-4 text-gray-900">Events:</p>
                <div className="space-y-2">
                  <p className="text-gray-800">Weekly Play: Fridays 6:30pm</p>
                  <p className="text-gray-800">Store Showdown: TBD</p>
                  <Link
                    href="https://www.gameparlour.com/events"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Registration →
                  </Link>
                </div>
                <div className="flex gap-4 mt-6">
                  <Link
                    href="https://www.facebook.com/GameParlour/"
                    className="text-blue-600 hover:text-blue-800 text-2xl"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Facebook"
                  >
                    <FaFacebook />
                  </Link>
                  <Link
                    href="https://www.gameparlour.com/"
                    className="text-cyan-600 hover:text-cyan-800 text-2xl"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Website"
                  >
                    <FaGlobe />
                  </Link>
                  <Link
                    href="https://discord.gg/RkbeFyrb"
                    className="text-[#5865F2] hover:text-[#4752C4] text-2xl"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Discord"
                  >
                    <FaDiscord />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* East Bay */}
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">East Bay</h3>
          <p className="text-gray-800 text-sm mb-2">Berkeley, Oakland, Alameda, Walnut Creek, Concord, Dublin, Pleasanton</p>
          <p className="text-gray-800 italic">Stores coming soon...</p>
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
      </section>
    </div>
  );
}
