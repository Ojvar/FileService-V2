/* eslint-disable @typescript-eslint/naming-convention */
export class CertKey {
  kid: string;
  kty: string;
  alg: string;
  use: string;
  n: string;
  e: string;
  x5c: string[];
  x5t: string;
  'x5t#S256': string;
}
export type CertKeys = CertKey[];

export class CertResponseDTO {
  keys: CertKeys;
  [key: string]: unknown;
}
