/**
 * Simple end-to-end encryption utility for chat messages
 * Note: This is a simplified implementation for demonstration purposes
 * Production applications should use established encryption libraries.
 */

// Generate a random encryption key
export const generateEncryptionKey = () => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };
  
  // AES-GCM encryption
  export const encryptMessage = async (message, key) => {
    try {
      // Convert the encryption key from hex to a Uint8Array
      const keyBytes = new Uint8Array(key.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      
      // Convert message to bytes
      const messageBytes = new TextEncoder().encode(message);
      
      // Create a crypto key from the raw bytes
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      
      // Generate a random initialization vector
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the message
      const encryptedBytes = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        cryptoKey,
        messageBytes
      );
      
      // Combine the IV and encrypted data and encode as base64
      const encryptedArray = new Uint8Array(iv.length + encryptedBytes.byteLength);
      encryptedArray.set(iv, 0);
      encryptedArray.set(new Uint8Array(encryptedBytes), iv.length);
      
      return btoa(String.fromCharCode.apply(null, encryptedArray));
    } catch (error) {
      console.error('Encryption failed:', error);
      return null;
    }
  };
  
  // AES-GCM decryption
  export const decryptMessage = async (encryptedMessage, key) => {
    try {
      // Convert the encrypted message from base64 to array
      const encryptedBytes = new Uint8Array(
        atob(encryptedMessage).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract the IV (first 12 bytes) and the encrypted data
      const iv = encryptedBytes.slice(0, 12);
      const data = encryptedBytes.slice(12);
      
      // Convert the key from hex to Uint8Array
      const keyBytes = new Uint8Array(key.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      
      // Import the key
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      // Decrypt the message
      const decryptedBytes = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        cryptoKey,
        data
      );
      
      // Convert the decrypted bytes to string
      return new TextDecoder().decode(decryptedBytes);
    } catch (error) {
    console.error("Decryption failed:", error);
    return "🔒 Encrypted message (cannot decode)";
  }
};
