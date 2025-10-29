import express from 'express';

const router = express.Router();

// Get watch party by ID
router.get('/:partyId', async (req, res) => {
  try {
    const { partyId } = req.params;
    const db = req.app.locals.db;

    const party = db.prepare('SELECT * FROM watch_parties WHERE id = ?').get(partyId);
    
    if (!party) {
      return res.status(404).json({ error: 'Watch party not found' });
    }

    res.json({
      partyId: party.id,
      movieId: party.movieId,
      hostPeerId: party.hostPeerId,
      startTime: party.startTime,
      viewers: JSON.parse(party.viewers || '[]')
    });
  } catch (error) {
    console.error('Failed to fetch watch party:', error);
    res.status(500).json({ error: 'Failed to fetch watch party' });
  }
});

// Get all active watch parties
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const parties = db.prepare(`
      SELECT * FROM watch_parties 
      WHERE startTime > datetime('now', '-1 hour')
      ORDER BY startTime DESC
    `).all();

    res.json(parties);
  } catch (error) {
    console.error('Failed to fetch watch parties:', error);
    res.status(500).json({ error: 'Failed to fetch watch parties' });
  }
});

export default router;