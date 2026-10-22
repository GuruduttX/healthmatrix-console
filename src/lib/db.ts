import mongoose from "mongoose";

/**
 * One MongoDB connection per server process. The database is shared with
 * `healthmatrix-app/server`, which owns most collections; see `src/models`.
 */

mongoose.set("strictQuery", true);

const cached = globalThis as typeof globalThis & { mongooseConnection?: Promise<typeof mongoose> };

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose;

  // Share only an in-flight attempt. A resolved promise cannot tell us whether
  // the connection has since dropped. Mongoose handles reconnecting sockets.
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
      .finally(() => {
        cached.mongooseConnection = undefined;
      });
  })();

  return cached.mongooseConnection;
}
