/**
 * Mu-law (u-law) compressor and decompressor algorithms.
 * Standard G.711 codec implementation for telephony-compatible 8-bit audio.
 */

const BIAS = 0x84;
const CLIP = 32635;

const encodeTable = [
  0,0,1,1,2,2,2,2,3,3,3,3,3,3,3,3,
  4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,
  5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
  5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
  6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
  6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
  6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
  6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
  7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
  7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
  7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
  7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
  7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
  7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
  7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
  7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7
];

/**
 * Encodes a single 16-bit linear PCM sample into an 8-bit mu-law byte.
 */
export function linearPCMToMuLaw(sample: number): number {
  let sign = 0;
  let exponent = 0;
  let mantissa = 0;
  let muLawByte = 0;

  if (sample < 0) {
    sample = -sample;
    sign = 0x80;
  }

  if (sample > CLIP) {
    sample = CLIP;
  }

  sample += BIAS;

  if (sample > 16383) {
    exponent = 7;
  } else if (sample > 8191) {
    exponent = 6;
  } else if (sample > 4095) {
    exponent = 5;
  } else if (sample > 2047) {
    exponent = 4;
  } else if (sample > 1023) {
    exponent = 3;
  } else if (sample > 511) {
    exponent = 2;
  } else if (sample > 255) {
    exponent = 1;
  } else {
    exponent = 0;
  }

  mantissa = (sample >> (exponent + 3)) & 0x0f;
  muLawByte = ~(sign | (exponent << 4) | mantissa);

  return muLawByte & 0xff;
}

/**
 * Decodes a single 8-bit mu-law byte into a 16-bit linear PCM sample.
 */
export function muLawToLinearPCM(muLawByte: number): number {
  muLawByte = ~muLawByte;
  const sign = muLawByte & 0x80;
  const exponent = (muLawByte >> 4) & 0x07;
  let mantissa = muLawByte & 0x0f;

  let sample = (mantissa << 3) + BIAS;
  sample <<= exponent;
  sample -= BIAS;

  return sign ? -sample : sample;
}

/**
 * Helper to encode a Float32Array (Web Audio buffer) into a Uint8Array of mu-law bytes.
 * Downsamples/Clips Float32 values (-1.0 to 1.0) to standard Int16 range.
 */
export function encodeFloat32ToMuLaw(float32Array: Float32Array): Uint8Array {
  const length = float32Array.length;
  const muLawArray = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    // Map float [-1.0, 1.0] to short [-32768, 32767]
    let s = float32Array[i] * 32768;
    if (s > 32767) s = 32767;
    if (s < -32768) s = -32768;
    muLawArray[i] = linearPCMToMuLaw(s);
  }

  return muLawArray;
}

/**
 * Helper to decode a Uint8Array of mu-law bytes into a Float32Array for Web Audio playback.
 */
export function decodeMuLawToFloat32(muLawArray: Uint8Array): Float32Array {
  const length = muLawArray.length;
  const float32Array = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const pcm16 = muLawToLinearPCM(muLawArray[i]);
    // Map short [-32768, 32767] to float [-1.0, 1.0]
    float32Array[i] = pcm16 / 32768;
  }

  return float32Array;
}
