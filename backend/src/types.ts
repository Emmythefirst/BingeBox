export interface Movie {
     id: string;
     filename: string;
     title: string;
     tmdbId: number;
     poster: string;
     description: string;
     duration: number;
     trailer: string;
     dateAdded: string;
   }

   export interface Peer {
     id: string;
     hostname: string;
     ipAddress: string;
     port: number;
     lastSeen: string;
     reputation: number;
   }

   export interface WatchParty {
     id: string;
     hostPeerId: string;
     movieId: string;
     startTime: string;
     endTime?: string;
     viewers: string[];
   }

  export interface OfflineCache {
    movieId: string;
    data: string;
    cachedAt?: string;
}