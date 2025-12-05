/**
 * Checks if an MP4 file is fast-start optimized by reading the first chunk
 * Fast-start means the moov atom comes before the mdat atom
 */

interface MP4Atom {
  type: string;
  size: number;
  offset: number;
}

function readAtoms(buffer: Uint8Array, maxBytes: number = 1024 * 1024): MP4Atom[] {
  const atoms: MP4Atom[] = [];
  let offset = 0;

  while (offset < buffer.length && offset < maxBytes) {
    // Need at least 8 bytes for atom header
    if (offset + 8 > buffer.length) break;

    // Read atom size (4 bytes, big-endian)
    const size = (buffer[offset] << 24) |
                 (buffer[offset + 1] << 16) |
                 (buffer[offset + 2] << 8) |
                 buffer[offset + 3];

    // Read atom type (4 bytes, ASCII)
    const type = String.fromCharCode(
      buffer[offset + 4],
      buffer[offset + 5],
      buffer[offset + 6],
      buffer[offset + 7]
    );

    atoms.push({ type, size, offset });

    // Move to next atom
    if (size === 0) break; // Size 0 means atom extends to end of file
    if (size === 1) {
      // Extended size - would need to read next 8 bytes
      // For our purposes, we can skip this
      break;
    }

    offset += size;
  }

  return atoms;
}

export function isFastStartMP4(firstChunk: Uint8Array): boolean {
  try {
    const atoms = readAtoms(firstChunk);

    // Look for moov and mdat atoms
    const moovIndex = atoms.findIndex(a => a.type === 'moov');
    const mdatIndex = atoms.findIndex(a => a.type === 'mdat');

    // Fast-start if moov comes before mdat
    if (moovIndex !== -1 && mdatIndex !== -1) {
      return moovIndex < mdatIndex;
    }

    // If we found moov but no mdat in first chunk, assume fast-start
    if (moovIndex !== -1) {
      return true;
    }

    // If we found mdat but no moov in first chunk, not fast-start
    if (mdatIndex !== -1) {
      return false;
    }

    // Couldn't determine - assume not fast-start to be safe
    return false;
  } catch (error) {
    console.error('Error parsing MP4 atoms:', error);
    return false;
  }
}

export function getMP4Info(firstChunk: Uint8Array): { isFastStart: boolean; atoms: string[] } {
  const atoms = readAtoms(firstChunk);
  const isFastStart = isFastStartMP4(firstChunk);

  return {
    isFastStart,
    atoms: atoms.map(a => `${a.type} (${a.size} bytes at ${a.offset})`),
  };
}
