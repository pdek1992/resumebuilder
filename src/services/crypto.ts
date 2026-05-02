import CryptoJS from 'crypto-js';

const SECRET_SALT = 'RESUME_BUILDER_SUPER_SECRET_SALT_2026';

export const generateTransactionHash = (): string => {
  const timestamp = Date.now().toString();
  const uuid = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${uuid}`;
};

export const generatePassword = (mobileNo: string, transactionHash: string): string => {
  const dataToHash = `${mobileNo}:${transactionHash}`;
  const hash = CryptoJS.HmacSHA256(dataToHash, SECRET_SALT);
  // Get a consistent 8-digit number from the hash
  const num = Math.abs(hash.words[0] % 100000000);
  return num.toString().padStart(8, '0');
};

export const verifyPassword = (mobileNo: string, transactionHash: string, inputPassword: string): boolean => {
  const parts = transactionHash.split('-');
  if (parts.length !== 2) return false;
  
  const timestampStr = parts[0];
  const timestamp = parseInt(timestampStr, 10);
  
  // 5 minutes expiry
  if (Date.now() - timestamp > 5 * 60 * 1000) {
    return false; // Expired
  }

  // Check if already used (1-time only)
  let usedHashes: string[] = [];
  try {
    usedHashes = JSON.parse(localStorage.getItem('used_txn_hashes') || '[]');
  } catch(e) {}
  
  if (usedHashes.includes(transactionHash)) {
     return false; // Already used
  }

  const expectedPassword = generatePassword(mobileNo, transactionHash);
  const isValid = expectedPassword === inputPassword.toUpperCase();
  
  if (isValid) {
    // Mark as used
    usedHashes.push(transactionHash);
    localStorage.setItem('used_txn_hashes', JSON.stringify(usedHashes));
  }
  
  return isValid;
};

export const encryptPDF = (pdfDataUri: string, password: string): string => {
  const encrypted = CryptoJS.AES.encrypt(pdfDataUri, password).toString();
  return encrypted;
};

export const decryptPDF = (encryptedData: string, password: string): string | null => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, password);
    const originalText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!originalText) return null;
    return originalText;
  } catch (e) {
    return null;
  }
};
