export const MAX_VIDEO_BYTES = 200 * 1024 * 1024
export const MIN_VIDEO_SECONDS = 3
export const MAX_VIDEO_SECONDS = 10

export function detectVideoFormat(bytes: Uint8Array): "mp4" | "webm" {
  const isMp4 =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(4, 8)) === "ftyp"
  const isWebm =
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3

  if (isMp4) return "mp4"
  if (isWebm) return "webm"
  throw new Error("The source is not a usable MP4 or WebM video")
}

function atomType(view: DataView, offset: number) {
  return String.fromCharCode(
    view.getUint8(offset + 4),
    view.getUint8(offset + 5),
    view.getUint8(offset + 6),
    view.getUint8(offset + 7)
  )
}

function atomSize(view: DataView, offset: number) {
  const size32 = view.getUint32(offset)
  if (size32 === 1) {
    if (offset + 16 > view.byteLength) return null
    const size64 = view.getBigUint64(offset + 8)
    if (size64 > BigInt(Number.MAX_SAFE_INTEGER)) return null
    return { headerSize: 16, size: Number(size64) }
  }
  return { headerSize: 8, size: size32 }
}

export async function readMp4Duration(blob: Blob) {
  let offset = 0
  while (offset + 8 <= blob.size) {
    const headerBuffer = await blob.slice(offset, offset + 16).arrayBuffer()
    const header = new DataView(headerBuffer)
    const parsed = atomSize(header, 0)
    if (!parsed) break
    const size = parsed.size === 0 ? blob.size - offset : parsed.size
    if (size < parsed.headerSize || offset + size > blob.size) break

    if (atomType(header, 0) === "moov") {
      if (size > 32 * 1024 * 1024) {
        throw new Error("The video contains unusually large metadata")
      }
      const moovBuffer = await blob
        .slice(offset + parsed.headerSize, offset + size)
        .arrayBuffer()
      const moov = new DataView(moovBuffer)
      let childOffset = 0
      while (childOffset + 8 <= moov.byteLength) {
        const child = atomSize(moov, childOffset)
        if (!child) break
        const childSize =
          child.size === 0 ? moov.byteLength - childOffset : child.size
        if (
          childSize < child.headerSize ||
          childOffset + childSize > moov.byteLength
        ) {
          break
        }
        if (atomType(moov, childOffset) === "mvhd") {
          const contentOffset = childOffset + child.headerSize
          const version = moov.getUint8(contentOffset)
          const timescaleOffset = contentOffset + (version === 1 ? 20 : 12)
          const durationOffset = contentOffset + (version === 1 ? 24 : 16)
          const timescale = moov.getUint32(timescaleOffset)
          const duration =
            version === 1
              ? Number(moov.getBigUint64(durationOffset))
              : moov.getUint32(durationOffset)
          if (!timescale || !Number.isFinite(duration)) break
          return duration / timescale
        }
        childOffset += childSize
      }
    }
    offset += size
  }
  throw new Error("Could not determine the video duration")
}

