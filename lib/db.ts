import mongoose from "mongoose";

/**
 * Connessione MongoDB ottimizzata per ambienti Serverless (Vercel).
 *
 * In serverless ogni invocazione può ricreare il modulo: la connessione viene
 * memorizzata in una cache globale per essere riutilizzata tra le invocazioni
 * a caldo, evitando di esaurire il pool di connessioni di Atlas.
 */

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};
global.mongooseCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI non definita. Copia .env.example in .env.local e configura la connessione."
    );
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}
