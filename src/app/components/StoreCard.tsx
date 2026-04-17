import Link from "next/link";
import type { IconType } from "react-icons";
import {
  FaDiscord,
  FaEnvelope,
  FaFacebook,
  FaGlobe,
  FaInstagram,
  FaPhone,
  FaShoppingCart,
} from "react-icons/fa";
import type { StoreAddress, StoreEvents, StoreRecord, StoreSocial } from "../../lib/stores";

const SOCIAL_LINK_CONFIGS: Array<{
  className: string;
  icon: IconType;
  key: keyof StoreSocial;
  title: string;
}> = [
  {
    className: "text-2xl text-cyan-600 hover:text-cyan-800",
    icon: FaGlobe,
    key: "website",
    title: "Website",
  },
  {
    className: "text-2xl text-gray-600 hover:text-gray-800",
    icon: FaShoppingCart,
    key: "store",
    title: "Online Store",
  },
  {
    className: "text-2xl text-[#5865F2] hover:text-[#4752C4]",
    icon: FaDiscord,
    key: "discord",
    title: "Discord",
  },
  {
    className: "text-2xl text-blue-600 hover:text-blue-800",
    icon: FaFacebook,
    key: "facebook",
    title: "Facebook",
  },
  {
    className: "text-2xl text-pink-600 hover:text-pink-800",
    icon: FaInstagram,
    key: "instagram",
    title: "Instagram",
  },
];
const EVENT_DETAIL_CONFIGS: Array<{
  key: keyof Pick<StoreEvents, "showdown" | "weeklyPlay">;
  label: string;
}> = [
  { key: "weeklyPlay", label: "Weekly Play" },
  { key: "showdown", label: "Store Showdown" },
];

export default function StoreCard({ name, address, contact, events, social }: StoreRecord) {
  const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
  const mapEmbedUrl = buildMapEmbedUrl(name, address);
  const socialLinks = getSocialLinks(social);
  const eventDetails = getEventDetails(events);
  const hasContact = Boolean(contact.phone || contact.email);
  const hasSocialLinks = socialLinks.length > 0;
  const hasEvents = eventDetails.length > 0 || Boolean(events.registrationUrl);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-xl font-bold text-gray-900">{name}</h3>
      <div className="relative mb-4 aspect-video overflow-hidden rounded-lg">
        <iframe
          src={mapEmbedUrl}
          title={`Map of ${name}`}
          width="100%"
          height="100%"
          loading="lazy"
        ></iframe>
      </div>
      <div className="mb-4 space-y-2">
        <p className="font-semibold text-gray-900">Address:</p>
        <Link
          href={address.googleMapsUrl}
          className="flex items-center gap-2 text-gray-900 hover:text-blue-600"
          target="_blank"
          rel="noopener noreferrer"
        >
          {fullAddress}
        </Link>

        {hasContact && (
          <>
            <p className="mt-4 font-semibold text-gray-900">Contact:</p>
            {contact.phone && (
              <p className="flex items-center gap-2">
                <FaPhone className="text-lg text-green-600" />
                <Link
                  href={`tel:${contact.phone.replace(/\D/g, "")}`}
                  className="text-gray-900 hover:text-blue-600"
                >
                  {contact.phone}
                </Link>
              </p>
            )}
            {contact.email && (
              <p className="flex items-center gap-2">
                <FaEnvelope className="text-lg text-gray-900" />
                <Link
                  href={`mailto:${contact.email}`}
                  className="text-blue-600 hover:text-gray-900"
                >
                  {contact.email}
                </Link>
              </p>
            )}
          </>
        )}

        {hasSocialLinks && (
          <div className="mt-4 flex gap-4">
            {socialLinks.map(({ Icon, className, href, title }) => (
              <Link
                key={title}
                href={href}
                className={className}
                target="_blank"
                rel="noopener noreferrer"
                title={title}
              >
                <Icon />
              </Link>
            ))}
          </div>
        )}

        {hasEvents && (
          <>
            <p className="mt-4 font-semibold text-gray-900">Events:</p>
            <div className="space-y-2">
              {eventDetails.map(({ key, label, value }) => (
                <p key={key} className="text-gray-800">
                  <span className="font-medium">{label}: </span>
                  {value}
                </p>
              ))}
              {events.registrationUrl && (
                <Link
                  href={events.registrationUrl}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Registration →
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function buildMapEmbedUrl(name: string, address: StoreAddress) {
  const query = encodeURIComponent(
    `${name} ${address.street} ${address.city} ${address.state} ${address.zip}`,
  );

  return `https://www.google.com/maps?q=${query}&output=embed`;
}

function getSocialLinks(social: StoreSocial) {
  return SOCIAL_LINK_CONFIGS.flatMap((config) => {
    const href = social[config.key];
    return href
      ? [
          {
            Icon: config.icon,
            className: config.className,
            href,
            title: config.title,
          },
        ]
      : [];
  });
}

function getEventDetails(events: StoreEvents) {
  return EVENT_DETAIL_CONFIGS.flatMap((config) => {
    const value = events[config.key];
    return value
      ? [
          {
            key: config.key,
            label: config.label,
            value,
          },
        ]
      : [];
  });
}
