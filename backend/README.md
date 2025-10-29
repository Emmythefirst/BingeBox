# BingeBox Backend

BingeBox Backend is built with **Node.js + Express + Socket.io** and uses **better-sqlite3** for local database storage.

## Features
- TypeScript + Express + Socket.io
- Local SQLite database for movies & watch parties
- Docker-ready for cross-platform builds
- Configurable via `.env`

## Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend in development mode using `ts-node` and `nodemon` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled backend (`dist/server.js`) |

## Run Locally
```powershell
cd backend
npm install
npm run dev


## Deploy on DAWN Black Box

1. SSH into your Black Box
2. Pull the Docker image:
```bash
   docker pull your-username/BingeBox:latest
```
3. Run the container:
```bash
   docker run -d \
     -p 3000:3000 \
     -v /media:/media \
     --name BingeBox \
     your-username/BingeBox:latest
```
4. Access at http://blackbox.local:3000
