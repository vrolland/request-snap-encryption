declare module 'secp256k1' {
  /**
   * Convert public key between compressed/uncompressed formats.
   *
   * The `secp256k1` npm package returns a `Uint8Array` for this conversion.
   */
  export function publicKeyConvert(
    publicKey: Uint8Array | Buffer,
    compressed?: boolean,
  ): Uint8Array;
}

