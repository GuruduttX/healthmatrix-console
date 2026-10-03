import mongoose from "mongoose";

/**
 * One MongoDB connection per server process. The database is shared with
 * `healthmatrix-app/server`, which owns most collections; see `src/models`.
 */

mongoose.set("strictQuery", true);

const cached = globalThis as typeof globalThis & { mongooseConnection?: Promise<typeof mongoose> };

export function connectDB() {
  // Next.js re-evaluates modules on hot reload; keep the one connection across reloads.
  cached.mongooseConnection ??= (() => {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.");

    return mongoose
      .connect(uri, {
        dbName: process.env.MONGODB_DB_NAME || "healthmatrix",
        serverSelectionTimeoutMS: 10_000,
        // Build indexes on boot in development; in production create them deliberately.
        autoIndex: process.env.NODE_ENV !== "production",
      })
      .catch((error: unknown) => {
        // Let the next request try again instead of reusing a failed promise.
        cached.mongooseConnection = undefined;
        throw error;
      });
  })();

  return cached.mongooseConnection;
}
