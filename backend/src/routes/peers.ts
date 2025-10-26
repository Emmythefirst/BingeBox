import express from 'express';
   import axios from 'axios';

   const router = express.Router();

   router.get('/peers', async (req, res) => {
     try {
       const db = req.app.locals.db;
       const peers = db.prepare(
         'SELECT * FROM peers WHERE lastSeen > datetime("now", "-5 minutes")'
       ).all();
       res.json(peers);
     } catch (error) {
       res.status(500).json({ error: 'Failed to fetch peers' });
     }
   });

   router.get('/peers/:peerId/movies', async (req, res) => {
     try {
       const { peerId } = req.params;
       const db = req.app.locals.db;

       const peer = db.prepare('SELECT * FROM peers WHERE id = ?').get(peerId);
       if (!peer) return res.status(404).json({ error: 'Peer not found' });

       const remoteUrl = `http://${peer.ipAddress}:${peer.port}/api/movies`;
       const response = await axios.get(remoteUrl, { timeout: 5000 });

       res.json(response.data);
     } catch (error) {
       res.status(500).json({ error: 'Failed to fetch peer movies' });
     }
   });

   export default router;
