# CleanCity Platform 🌍♻️

A community-driven waste management platform empowering citizens to report issues and track waste collection.

## Features
- **Interactive Map**: Visualize waste reports and recycling centers.
- **Report Issues**: Upload photos and pin locations for overflowing bins or illegal dumping.
- **Authentication**: Secure login/signup via Supabase.
- **Real-time Updates**: Track the status of your reports.

## Tech Stack
- Frontend: React + Vite + Tailwind CSS
- Maps: Leaflet + OpenStreetMap
- Backend: Supabase (Auth + Database)

## Deployment
1.  **Install**: `npm install`
2.  **Run**: `npm run dev`
3.  **Deploy**: Configured for Netlify (`netlify.toml` included).

## Environment Variables
Create a `.env` file with:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
