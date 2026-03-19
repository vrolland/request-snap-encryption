import { publicKeyConvert } from 'secp256k1';
import { Ecies, decrypt, encrypt } from '@toruslabs/eccrypto';
import { Buffer } from 'buffer';

/**
 * Function to manage Elliptic-curve cryptography
 */
export {
  ecDecrypt,
  ecEncrypt,
};



/**
 * Function to encrypt data with a public key
 *
 * @param publicKey the public key to encrypt with
 * @param data the data to encrypt
 *
 * @returns the encrypted data
 */
async function ecEncrypt(publicKey: string, data: string): Promise<string> {
  try {
    // encrypts the data with the publicKey, returns the encrypted data with encryption parameters (such as IV..)
    const compressed = compressPublicKey(publicKey);
    const encrypted = await encrypt(Buffer.from(compressed), Buffer.from(data));

    // Transforms the object with the encrypted data into a smaller string-representation.
    return Buffer.concat([
      encrypted.iv,
      publicKeyConvert(encrypted.ephemPublicKey),
      encrypted.mac,
      encrypted.ciphertext,
    ]).toString('hex');
  } catch (e: any) {
    if (
      e.message === 'public key length is invalid' ||
      e.message === 'Expected public key to be an Uint8Array with length [33, 65]'
    ) {
      throw new Error('The public key must be a string representing 64 bytes');
    }
    throw e;
  }
}

/**
 * Function to decrypt data with a public key
 *
 * @param privateKey the private key to decrypt with
 * @param data the data to decrypt
 *
 * @returns the decrypted data
 */
async function ecDecrypt(privateKey: string, data: string): Promise<string> {
  try {
    const buf = await decrypt(Buffer.from(privateKey.replace(/^0x/, ''), 'hex'), eciesSplit(data));
    return buf.toString();
  } catch (e: any) {
    if (
      e.message === 'Bad private key' ||
      e.message === 'Expected private key to be an Uint8Array with length 32'
    ) {
      throw new Error('The private key must be a string representing 32 bytes');
    }
    if (
      e.message === 'public key length is invalid' ||
      e.message === 'Expected public key to be an Uint8Array with length [33, 65]' ||
      e.message === 'Bad MAC' ||
      e.message === 'bad MAC after trying padded' ||
      e.message === 'the public key could not be parsed or is invalid' ||
      e.message === 'Public Key could not be parsed'
    ) {
      throw new Error('The encrypted data is not well formatted');
    }
    throw e;
  }
}

/**
 * Converts a public key to its compressed form.
 */
function compressPublicKey(publicKey: string): Uint8Array {
  publicKey = publicKey.replace(/^0x/, '');
  // if there are more bytes than the key itself, it means there is already a prefix
  if (publicKey.length % 32 === 0) {
    publicKey = `04${publicKey}`;
  }
  return publicKeyConvert(Buffer.from(publicKey, 'hex'));
}

/**
 * Split an encrypted string to ECIES params
 * inspired from https://github.com/pubkey/eth-crypto/blob/master/src/ecDecrypt-with-private-key.js
 */
const eciesSplit = (str: string): Ecies => {
  const buf = Buffer.from(str, 'hex');

  const ephemPublicKeyStr = buf.toString('hex', 16, 49);

  return {
    iv: Buffer.from(buf.toString('hex', 0, 16), 'hex'),
    mac: Buffer.from(buf.toString('hex', 49, 81), 'hex'),
    ciphertext: Buffer.from(buf.toString('hex', 81, buf.length), 'hex'),
    ephemPublicKey: Buffer.from(
      publicKeyConvert(new Uint8Array(Buffer.from(ephemPublicKeyStr, 'hex')), false),
    ),
  };
};
