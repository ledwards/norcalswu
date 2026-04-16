# NorCal Star Wars: Unlimited Community Website

This is the official website for the Northern California Star Wars: Unlimited community. The site helps new and existing players find information about local events, connect with other players, and join our Discord community.

## Features

- Community Discord link
- Embedded Google Calendar agenda for local events
- Server-side Google Calendar sync route for tracked event sources
- SEO optimized for new player discovery
- Mobile-responsive design

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Configuration

Before deploying, make sure to:

1. Update the Discord invite links in [src/app/page.tsx](/Users/lee/Repos/ledwards/norcalswu/src/app/page.tsx)
2. Update the Google Calendar embed URL in [src/app/page.tsx](/Users/lee/Repos/ledwards/norcalswu/src/app/page.tsx)
3. Set the site URL with `NEXT_PUBLIC_SITE_URL`

### Calendar Sync Setup

The app now includes a protected sync route at `/api/admin/calendar-sync` and an hourly Vercel cron in [vercel.json](/Users/lee/Repos/ledwards/norcalswu/vercel.json).

Set these environment variables to enable Google Calendar updates:

- `GOOGLE_CALENDAR_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `SWUAPI_KEY`

You can use `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` instead of `GOOGLE_SERVICE_ACCOUNT_JSON` if you prefer splitting the credentials.
You can also set `SWUAPI_BASE_URL` if you want to point calendar sync at a self-hosted `swuapi` instance instead of `https://api.swuapi.com`.

Protect the sync route with one of:

- `CRON_SECRET`
- `CALENDAR_SYNC_SECRET`

Tracked store data lives in [src/lib/stores.ts](/Users/lee/Repos/ledwards/norcalswu/src/lib/stores.ts).

The sync job currently pulls from:

- weekly play schedules already listed in the app
- authenticated `swuapi` tournament data for matched tracked stores
- tracked registration/store pages attached to each store
- any extra public Melee or StarWarsUnlimited pages added to `trackedExternalSources`

To test the sync without writing to Google Calendar, call:

```bash
curl "http://localhost:3000/api/admin/calendar-sync?dryRun=1&secret=YOUR_SECRET"
```

## Deployment

This site is designed to be deployed on Vercel. To deploy:

1. Push your changes to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically build and deploy your site

## Built With

- [Next.js](https://nextjs.org/) - The React framework
- [Tailwind CSS](https://tailwindcss.com/) - For styling
- [TypeScript](https://www.typescriptlang.org/) - For type safety

## Contributing

If you'd like to contribute to the website, please:

1. Fork the repository
2. Create a feature branch
3. Submit a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
