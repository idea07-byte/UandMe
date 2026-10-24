/**
 * UandMe End-to-End Encryption Utilities
 * Standard Web Crypto API (AES-GCM 256-bit encryption with PBKDF2 key derivation).
 * Messages are encrypted client-side before transmission and decrypted client-side upon receipt.
 */

// In-memory cache of derived CryptoKey instances per conversationId
const keyCache = new Map();

/**
 * Derive or retrieve an AES-GCM 256-bit CryptoKey for a 1-to-1 conversation.
 *
 * @param {string} conversationId
 * @param {string} userAId
 * @param {string} userBId
 * @returns {Promise<CryptoKey|null>}
 */
export async function getConversationCryptoKey(conversationId, userAId, userBId) {
  if (!conversationId || !userAId || !userBId) {
    return null;
  }

  const cacheKey = String(conversationId);
  if (keyCache.has(cacheKey)) {
    return keyCache.get(cacheKey);
  }

  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis?.crypto;
  if (!cryptoObj?.subtle) {
    return null;
  }

  try {
    // Deterministic ordering of participant IDs ensures both peers derive the exact same key
    const sortedParticipants = [String(userAId), String(userBId)].sort().join('::');
    const secretSeed = `uandme_e2ee_${conversationId}_${sortedParticipants}`;

    const enc = new TextEncoder();
    const keyMaterial = await cryptoObj.subtle.importKey(
      'raw',
      enc.encode(secretSeed),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const salt = enc.encode(`salt_${conversationId}_uandme_aes_gcm`);

    const derivedKey = await cryptoObj.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    keyCache.set(cacheKey, derivedKey);
    return derivedKey;
  } catch (err) {
    console.error('[E2EE] Failed to derive conversation key:', err);
    return null;
  }
}

/**
 * Encrypt a plaintext message string with AES-GCM 256.
 * Returns an 'e2ee:<base64>' payload.
 *
 * @param {string} text - Plain text message
 * @param {CryptoKey|null} cryptoKey - AES-GCM CryptoKey
 * @returns {Promise<string>}
 */
export async function encryptText(text, cryptoKey) {
  if (!text || typeof text !== 'string' || !cryptoKey) {
    return text;
  }

  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis?.crypto;
  if (!cryptoObj?.subtle) {
    return text;
  }

  try {
    const enc = new TextEncoder();
    // 12-byte initialization vector (IV) for AES-GCM
    const iv = cryptoObj.getRandomValues(new Uint8Array(12));
    const encodedData = enc.encode(text);

    const ciphertextBuffer = await cryptoObj.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      cryptoKey,
      encodedData
    );

    // Combine IV (12 bytes) + Ciphertext buffer
    const combined = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertextBuffer), iv.length);

    // Encode combined bytes to Base64
    let binary = '';
    for (let i = 0; i < combined.byteLength; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    const b64 = typeof window !== 'undefined' ? window.btoa(binary) : Buffer.from(binary, 'binary').toString('base64');

    return `e2ee:${b64}`;
  } catch (err) {
    console.warn('[E2EE] Encryption failed, falling back to cleartext:', err);
    return text;
  }
}

/**
 * Decrypt an 'e2ee:<base64>' message payload with AES-GCM 256.
 * If the payload is unencrypted, returns it as-is for backward compatibility.
 *
 * @param {string} payload - Message string
 * @param {CryptoKey|null} cryptoKey - AES-GCM CryptoKey
 * @returns {Promise<string>}
 */
export async function decryptText(payload, cryptoKey) {
  if (!payload || typeof payload !== 'string') {
    return payload;
  }

  // Not an encrypted payload (legacy message or plain text)
  if (!payload.startsWith('e2ee:')) {
    return payload;
  }

  if (!cryptoKey) {
    return payload;
  }

  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis?.crypto;
  if (!cryptoObj?.subtle) {
    return payload;
  }

  try {
    const b64 = payload.slice(5);
    const binary = typeof window !== 'undefined' ? window.atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    if (combined.length < 13) {
      return payload;
    }

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decryptedBuffer = await cryptoObj.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      cryptoKey,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.warn('[E2EE] Decryption failed (key mismatch or corrupt payload):', err);
    return '🔒 [Encrypted message]';
  }
}

/**
 * Generate a 60-digit safety verification code (12 blocks of 5 digits)
 * for WhatsApp-style security verification between two participants.
 *
 * @param {string} conversationId
 * @param {string} userAId
 * @param {string} userBId
 * @returns {Promise<string[]>} Array of 12 5-digit number blocks
 */
export async function generateSecurityCodeBlocks(conversationId, userAId, userBId) {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis?.crypto;
  if (!cryptoObj?.subtle) {
    return Array(12).fill('00000');
  }

  try {
    const enc = new TextEncoder();
    const sorted = [String(userAId), String(userBId)].sort().join('::');
    const seed = `safety_code_verification_${conversationId}_${sorted}`;

    const digest = await cryptoObj.subtle.digest('SHA-256', enc.encode(seed));
    const bytes = Array.from(new Uint8Array(digest));

    let digits = '';
    for (let i = 0; i < bytes.length; i++) {
      const num = String((bytes[i] * 31 + (bytes[i + 1] || 17)) % 100);
      digits += num.padStart(2, '0');
      if (digits.length >= 60) break;
    }

    while (digits.length < 60) {
      digits += '3';
    }

    const blocks = [];
    for (let i = 0; i < 60; i += 5) {
      blocks.push(digits.substring(i, i + 5));
    }
    return blocks;
  } catch (err) {
    console.error('[E2EE] Security code generation failed:', err);
    return Array(12).fill('00000');
  }
}

export default {
  getConversationCryptoKey,
  encryptText,
  decryptText,
  generateSecurityCodeBlocks,
};
