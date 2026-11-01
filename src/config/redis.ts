import Redis from "ioredis";
import { REDIS_URL } from "../utils/env.js";

// enableOfflineQueue=false: saat Redis mati perintah langsung gagal (bisa dibalas 503)
// dan tidak menggantung di antrean.
const redis = new Redis(REDIS_URL, {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

// Tanpa handler "error", error koneksi akan menjatuhkan proses.
// Hanya message yang dicatat; REDIS_URL tidak pernah masuk log.
redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

// Menunggu koneksi Redis siap, untuk log status saat startup.
export const waitForRedis = (timeoutMs = 5000): Promise<string> =>
  new Promise((resolve, reject) => {
    if (redis.status === "ready") {
      return resolve("Redis connection successful");
    }

    const onReady = () => {
      clearTimeout(timer);
      resolve("Redis connection successful");
    };

    const timer = setTimeout(() => {
      redis.off("ready", onReady);
      reject(new Error("Redis connection timed out"));
    }, timeoutMs);

    redis.once("ready", onReady);
  });

export default redis;
