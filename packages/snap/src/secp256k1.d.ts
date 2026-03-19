declare module 'secp256k1' {
  /**
   * Convert public key between compressed/uncompressed formats.
   */
  export function publicKeyConvert(
    publicKey: Uint8Array | Buffer,
    compressed?: boolean,
  ): Uint8Array;
}

