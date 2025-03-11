import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-8 flex flex-col items-center bg-white">
        <div className="w-full md:w-[50%] mb-6">
          <Image
            src="/Flag_of_california.png"
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
    </div>
  );
}
