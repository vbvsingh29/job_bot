const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SECRET = process.env.JWT_SECRET || 'fallback_secret_encryption_key_32_bytes_long';

// Derive a 32-byte key from the secret key using scrypt
const KEY = crypto.scryptSync(SECRET, 'salt_string', 32);

/**
 * Encrypt a plaintext string using AES-256-CBC
 * @param {string} text - The plaintext to encrypt
 * @returns {string} The encrypted representation format `iv:ciphertext`
 */
function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt a cipher string of format `iv:ciphertext`
 * @param {string} encryptedText - The encrypted string
 * @returns {string|null} The decrypted plaintext, or null if decryption fails
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    return null;
  }
}

module.exports = {
  encrypt,
  decrypt
};
