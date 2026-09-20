import { QueueClient } from "@azure/storage-queue";
import {
  AZURE_STORAGE_CONNECTION_STRING,
  AZURE_EMAIL_ACTIVATION_QUEUE_NAME,
} from "../utils/env.js";

if (!AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error(
    "AZURE_STORAGE_CONNECTION_STRING is not defined in the environment variables.",
  );
}

if (!AZURE_EMAIL_ACTIVATION_QUEUE_NAME) {
  throw new Error(
    "AZURE_EMAIL_ACTIVATION_QUEUE_NAME is not defined in the environment variables.",
  );
}

const queueClient = new QueueClient(
  AZURE_STORAGE_CONNECTION_STRING,
  AZURE_EMAIL_ACTIVATION_QUEUE_NAME,
);

export async function ensureQueueReady(): Promise<void> {
  await queueClient.createIfNotExists();
}

export default queueClient;
