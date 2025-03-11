import Link from "next/link";
import { FaFacebook, FaGlobe, FaDiscord, FaPhone, FaEnvelope } from "react-icons/fa";

interface StoreCardProps {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    googleMapsUrl: string;
  };
  contact: {
    phone: string;
    email: string;
  };
  events: {
    weeklyPlay: string;
    showdown: string;
    registrationUrl: string;
  };
  social: {
    facebook: string;
    website: string;
    discord: string;
  };
}

export default function StoreCard({
  name,
  address,
  contact,
  events,
  social,
}: StoreCardProps) {
  const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
  const mapQuery = `${name}+${address.street}+${address.city}+${address.state}+${address.zip}`;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4 text-gray-900">{name}</h3>
      <div className="aspect-video mb-4 relative overflow-hidden rounded-lg">
        <iframe
          src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
          width="100%"
          height="100%"
        ></iframe>
      </div>
      <div className="space-y-2 mb-4">
        <p className="font-semibold text-gray-900">Address:</p>
        <Link
          href={address.googleMapsUrl}
          className="text-gray-900 hover:text-blue-600 flex items-center gap-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          {fullAddress}
        </Link>
        <p className="font-semibold mt-4 text-gray-900">Contact:</p>
        <p className="flex items-center gap-2">
          <FaPhone className="text-lg text-green-600" />
          <Link
            href={`tel:${contact.phone.replace(/\D/g, '')}`}
            className="text-gray-900 hover:text-blue-600"
          >
            {contact.phone}
          </Link>
        </p>
        <p className="flex items-center gap-2">
          <FaEnvelope className="text-lg text-gray-900" />
          <Link
            href={`mailto:${contact.email}`}
            className="text-blue-600 hover:text-gray-900"
          >
            {contact.email}
          </Link>
        </p>
        <p className="font-semibold mt-4 text-gray-900">Events:</p>
        <div className="space-y-2">
          <p className="text-gray-800">{events.weeklyPlay}</p>
          <p className="text-gray-800">{events.showdown}</p>
          <Link
            href={events.registrationUrl}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Registration →
          </Link>
        </div>
        <div className="flex gap-4 mt-6">
          <Link
            href={social.facebook}
            className="text-blue-600 hover:text-blue-800 text-2xl"
            target="_blank"
            rel="noopener noreferrer"
            title="Facebook"
          >
            <FaFacebook />
          </Link>
          <Link
            href={social.website}
            className="text-cyan-600 hover:text-cyan-800 text-2xl"
            target="_blank"
            rel="noopener noreferrer"
            title="Website"
          >
            <FaGlobe />
          </Link>
          <Link
            href={social.discord}
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
  );
} 