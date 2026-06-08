// OCR provider interface per 06_BACKEND_GUIDE.md spec
export interface OcrProviderInput {
  storageKey: string;
  signedUrl: string;
}

export interface OcrProviderResult {
  detectedSerial: string | null;
  confidenceScore: number | null;
  boundingBox?: unknown;
  raw?: unknown;
}

export interface OcrProvider {
  extractContainerSerial(input: OcrProviderInput): Promise<OcrProviderResult>;
}
