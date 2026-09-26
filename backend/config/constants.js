// ─── Shared application-wide constants ────────────────────────────────────────
// Single source of truth for JWT_SECRET to avoid duplication across modules.
import dotenv from 'dotenv';
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforabraventure2026';
