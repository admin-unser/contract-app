import { createHash } from "crypto";

/** Compute SHA-256 hash of a PDF buffer */
export function computeDocumentHash(pdfBuffer: ArrayBuffer | Buffer): string {
  const hash = createHash("sha256");
  hash.update(new Uint8Array(pdfBuffer));
  return hash.digest("hex");
}

/** Compute chain hash: SHA-256(previousHash + signatureData + timestamp) */
export function computeChainHash(
  previousHash: string,
  signatureData: string,
  timestamp: string
): string {
  const hash = createHash("sha256");
  hash.update(previousHash + signatureData + timestamp);
  return hash.digest("hex");
}
