import bonjour from 'bonjour-service';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

export function startPeerDiscovery(db: any, io: any) {
  const peerId = process.env.PEER_ID || uuidv4();
  const hostname = os.hostname();
  const PORT = parseInt(process.env.PORT || '3000');

  const bonjourInstance = new bonjour();

  // make the advertised service name more likely to be unique on local networks
  const serviceName = `${hostname}-${peerId.slice(0, 8)}`;

  try {
    bonjourInstance.publish({
      name: serviceName,
      type: 'cipherstream',
      port: PORT,
      txt: {
        peerId,
        hostname,
      },
    });

    console.log(`✅ Advertising: ${serviceName} (${peerId})`);
  } catch (err: any) {
    // don't crash the whole app if mDNS advertisement fails due to name collision
    console.warn('⚠️  Failed to publish bonjour service:', err && err.message ? err.message : err);
  }

  const browser = bonjourInstance.find({ type: 'cipherstream' });

  browser.on('up', (service: any) => {
    if (service.txt?.peerId === peerId) return;

    const ip = service.addresses?.[0];
    if (!ip) return;

    console.log(`✅ Peer found: ${service.name} (${ip})`);

    db.prepare(
      `INSERT OR REPLACE INTO peers (id, hostname, ipAddress, port, lastSeen)
         VALUES (?, ?, ?, ?, datetime('now'))`
    ).run(service.txt.peerId, service.name, ip, PORT);

    io.emit('peer-discovered', {
      id: service.txt.peerId,
      hostname: service.name,
      ipAddress: ip,
    });
  });

  browser.on('down', (service: any) => {
    console.log(`⚠️  Peer offline: ${service.name}`);
  });

  return { bonjourInstance, browser };
}