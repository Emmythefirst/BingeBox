# Backend environment setup

This project expects a `backend/.env` file with runtime configuration and secrets. Do NOT commit your `.env` file — it is ignored by Git.

Steps for contributors:

1. Copy the example file and fill in your values:

   cp .env.example .env

2. Obtain your own TMDB API key at https://www.themoviedb.org/settings/api and add it to `.env`:

   TMDB_API_KEY=your_api_key_here

3. Set any other values you need (port, media path, peer id). Example values are in `.env.example`.

4. Run the backend:

   npm install
   npm run dev

If you accidentally committed a secret, rotate it immediately and notify the team.
