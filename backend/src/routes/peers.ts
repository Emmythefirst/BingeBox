import express from 'express';
   import axios from 'axios';

   const router = express.Router();

   interface Peer {
  id: string;
  ip: string;
  port: number;
  lastSeen: string | Date;
}


   router.get('/peers', async (req, res) => {
     try {
       const db = req.app.locals.db;

        const allPeers = db.prepare('SELECT * FROM peers').all();

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentPeers = allPeers.filter((peer: Peer) => new Date(peer.lastSeen) > fiveMinutesAgo);

    res.json(recentPeers);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to fetch peers', details: message });
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
