# Backend

Simple TypeScript Express + Socket.io starter.

Scripts

- `npm run dev` - start in development with `ts-node` and `nodemon`.
- `npm run build` - compile TypeScript to `dist/`.
- `npm start` - run the compiled `dist/index.js`.

Run locally

```powershell
cd backend
npm install
npm run dev
```

## Deploy on DAWN Black Box

1. SSH into your Black Box
2. Pull the Docker image:
```bash
   docker pull your-username/cipherstream:latest
```
3. Run the container:
```bash
   docker run -d \
     -p 3000:3000 \
     -v /media:/media \
     --name cipherstream \
     your-username/cipherstream:latest
```
4. Access at http://blackbox.local:3000
