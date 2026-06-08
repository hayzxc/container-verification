import crypto from "node:crypto";
import type { OcrProvider, OcrProviderInput, OcrProviderResult } from "./ocr-provider.js";

// Deterministic fake serial from storage key hash for reproducible results
function fakeSerialFromKey(key: string): string {
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  // 4 uppercase letters + 7 digits to match ISO 6346-like format
  const letters = hash
    .slice(0, 4)
    .split("")
    .map((char) => String.fromCharCode(65 + (parseInt(char, 16) % 26)))
    .join("");
  const digits = hash
    .slice(4, 11)
    .split("")
    .map((char) => String(parseInt(char, 16) % 10))
    .join("");
  return `${letters}${digits}`;
}

export class FakeOcrProvider implements OcrProvider {
  async extractContainerSerial(input: OcrProviderInput): Promise<OcrProviderResult> {
    // Simulate processing delay (200-800ms)
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 600));

    const detectedSerial = fakeSerialFromKey(input.storageKey);

    return {
      detectedSerial,
      confidenceScore: 0.92,
      boundingBox: {
        x: 120,
        y: 80,
        width: 320,
        height: 60
      },
      raw: {
        provider: "fake",
        note: "Deterministic fake result for development"
      }
    };
  }
}

export const fakeOcrProvider = new FakeOcrProvider();
