export interface CryptoRandomSource {
  getRandomValues<T extends ArrayBufferView | null>(array: T): T;
}

export declare function secureRandomInteger(
  minimum?: number,
  maximum?: number,
  cryptoSource?: CryptoRandomSource,
): number;

export declare function secureIChingNumber(cryptoSource?: CryptoRandomSource): number;
