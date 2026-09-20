import dotenv from "dotenv";
import e from "express";

dotenv.config();

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || "production";
export const DATABASE_URL = process.env.DATABASE_URL || "";
export const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "";
export const ACS_CONNECTION_STRING = process.env.ACS_CONNECTION_STRING || "";
export const ACS_SENDER_ADDRESS = process.env.ACS_SENDER_ADDRESS || "";
// AZURE STORAGE
export const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING || "";
export const AZURE_STORAGE_ACCOUNT_NAME =
  process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
export const AZURE_STORAGE_ACCOUNT_KEY =
  process.env.AZURE_STORAGE_ACCOUNT_KEY || "";
// AZURE STORAGE QUEUE
export const AZURE_EMAIL_ACTIVATION_QUEUE_NAME =
  process.env.AZURE_EMAIL_ACTIVATION_QUEUE_NAME || "email-activation-queue";
// AZURE STORAGE BLOB
export const AZURE_BLOB_CONTAINER_NAME =
  process.env.AZURE_BLOB_CONTAINER_NAME || "";
// PAYMENT GATEWAY MIDTRANS
export const MIDTRANS_MERCHANT_ID = process.env.MIDTRANS_MERCHANT_ID || "";
export const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || "";
export const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
export const MIDTRANS_TRANSACTION_URL =
  process.env.MIDTRANS_TRANSACTION_URL || "";
