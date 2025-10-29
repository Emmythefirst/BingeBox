import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import { registerStreamRoutes } from './routes/stream';

dotenv.config();


const app = express();
const server = http.createServer(app);
const io = new IOServer(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json())


app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', registerStreamRoutes);
;

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('disconnect', () => console.log('socket disconnected', socket.id));
});

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
