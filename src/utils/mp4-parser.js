/**
 * ISO-BMFF（MP4 / MOV）容器解析器 —— 纯 JS、零依赖，浏览器与 Node 通用。
 *
 * 结构依据（以标准实际字节布局为准）：
 * - ISO/IEC 14496-12：box / FullBox 基础结构，mvhd / tkhd / mdhd / hdlr 布局，SampleEntry 布局
 * - ISO/IEC 14496-14：MP4 文件格式（ftyp/moov 具体约束）
 * - ISO/IEC 14496-15：avcC / hvcC 解码器配置记录
 * - QuickTime（QTFF）历史差异：meta 可能不是 FullBox、音频 sample entry 存在 v0/v1/v2 三代布局，按字节启发式兼容
 *
 * 原则：解析出错不抛异常，问题记入返回值的 errors 数组，尽量保留已解析出的部分。
 *
 * parseMp4(ArrayBuffer | Uint8Array) 返回：
 * {
 *   ok: Boolean,                 // 是否解析出了有效的 MP4/MOV 结构
 *   notContainer: Boolean,       // true = 根本不是 MP4/MOV 家族容器（如 WebM/MKV/AVI）
 *   fileType: 'mp4' | 'mov' | null,
 *   brands: { major, minorVersion, compatible: [String] } | null,   // ftyp
 *   timescale, durationSec, mvhdVersion,                            // mvhd（v0 32位 / v1 64位 均支持）
 *   fragmented: Boolean,         // 存在 moof/mfhd → 分片封装（fMP4）
 *   hasMehd: Boolean,
 *   estimatedBitrate,            // 文件大小×8÷时长（bps），无 btrt 时的兜底
 *   tracks: [{
 *     id, handler, handlerName, kind, language,
 *     codec, codecName, codecList,
 *     codecDetail: { type:'avc'|'hevc', profileIdc, profileName, levelText } | null,
 *     audioDetail: { objectTypeIndication, otiName, audioObjectType, aotName } | null,
 *     width, height, rotation, matrix,          // tkhd：16.16 定点宽高 + 旋转矩阵（90/180/270 可识别）
 *     mediaTimescale, mediaDuration, durationSec, // mdhd
 *     channels, sampleSize, sampleRate,          // stsd 音频 sample entry（含 QuickTime v2 布局）
 *     frameCount, maxSampleSize, avgSampleSize, fps, // stts/stsz 推算
 *     bitrate: { bufferSizeDB, maxBitrate, avgBitrate } | null, // btrt
 *     estimatedBitrate              // avgSampleSize×帧数×8÷时长（无 btrt 时兜底）
 *   }],
 *   metadata: { title, artist, album, ... },     // meta→ilst 常见标签（©nam/©ART/©alb…）
 *   boxes: [{ type, size, offset, headerSize, path, children }],  // 完整 box 树
 *   errors: [String]             // 解析警告（容错记录，不是 throw）
 * }
 */

// ==================== 常量表 ====================

// 递归遍历的容器 box（ISO/IEC 14496-12 §4.2 + 14496-14 + QTFF wave 扩展）
const CONTAINER_BOXES = new Set([
  'moov', 'trak', 'edts', 'mdia', 'minf', 'dinf', 'stbl', 'mvex',
  'moof', 'traf', 'mfra', 'udta', 'sinf', 'schi', 'wave', 'tref', 'iprp', 'ipco', 'strk'
])

// 视频 / 音频类 sample entry fourcc（决定 stsd 条目的内部布局）
const VIDEO_SAMPLE_ENTRIES = new Set([
  'avc1', 'avc2', 'avc3', 'avc4', 'hvc1', 'hev1', 'vvc1', 'vvi1', 'av01',
  'vp08', 'vp09', 'mp4v', 'dvhe', 'dva1', 'dvh1', 'dvav',
  'apch', 'apcn', 'apcs', 'apco', 'ap4h', 'ap4x',
  'jpeg', 'mjpa', 'mjpb', 'png'
])
const AUDIO_SAMPLE_ENTRIES = new Set([
  'mp4a', 'alac', 'ac-3', 'ec-3', 'samr', 'sawb', 'Opus', 'fLaC',
  'lpcm', 'sowt', 'twos', 'in24', 'in32', 'fl32', 'fl64', 'ulaw', 'alaw', '.mp3', 'mp3 '
])

// 常见 fourcc 中文对照
const CODEC_NAMES = {
  avc1: 'H.264/AVC', avc2: 'H.264/AVC', avc3: 'H.264/AVC', avc4: 'H.264/AVC',
  hvc1: 'H.265/HEVC', hev1: 'H.265/HEVC',
  vvc1: 'H.266/VVC', vvi1: 'H.266/VVC',
  av01: 'AV1', vp08: 'VP8', vp09: 'VP9',
  mp4v: 'MPEG-4 Visual（DivX/Xvid 常用）',
  mp4a: 'AAC（MPEG-4 音频）', alac: 'Apple Lossless（ALAC）',
  'ac-3': 'Dolby Digital（AC-3）', 'ec-3': 'Dolby Digital Plus（E-AC-3）',
  samr: 'AMR 窄带', sawb: 'AMR 宽带',
  Opus: 'Opus', fLaC: 'FLAC',
  lpcm: 'LPCM 线性 PCM', sowt: 'PCM（小端）', twos: 'PCM（大端）',
  in24: 'PCM 24bit', in32: 'PCM 32bit', fl32: 'PCM 浮点 32bit', fl64: 'PCM 浮点 64bit',
  ulaw: 'μ-law', alaw: 'A-law', '.mp3': 'MP3', 'mp3 ': 'MP3',
  apch: 'Apple ProRes 422 HQ', apcn: 'Apple ProRes 422', apcs: 'Apple ProRes 422 LT',
  apco: 'Apple ProRes 422 Proxy', ap4h: 'Apple ProRes 4444', ap4x: 'Apple ProRes 4444 XQ',
  jpeg: 'Motion JPEG', mjpa: 'Motion JPEG A', mjpb: 'Motion JPEG B', png: 'PNG 静帧',
  dvhe: 'Dolby Vision（HEVC）', dva1: 'Dolby Vision（AVC）', dvh1: 'Dolby Vision（HEVC）'
}

// hdlr handler type 中文对照
const HANDLER_NAMES = {
  vide: '视频', soun: '音频', hint: '流提示', meta: '元数据', text: '文本',
  tmcd: '时间码', clcp: '字幕', sbtl: '字幕', subp: '子画面', sdsm: '场景描述', odsm: '对象描述'
}

// avcC：AVCProfileIndication → 名称（ISO/IEC 14496-10 Annex A）
const AVC_PROFILES = {
  66: 'Baseline（基线）', 77: 'Main（主）', 88: 'Extended（扩展）',
  100: 'High（高级）', 110: 'High 10', 122: 'High 4:2:2', 244: 'High 4:4:4'
}
// hvcC：general_profile_idc → 名称（ISO/IEC 23008-2 Annex A）
const HEVC_PROFILES = { 1: 'Main', 2: 'Main 10', 3: 'Main Still Picture', 4: 'Range Extensions' }

// esds：objectTypeIndication 对照（ISO/IEC 14496-1）
const OTI_NAMES = {
  0x40: 'AAC', 0x66: 'AAC（MPEG-2）', 0x67: 'AAC（MPEG-2）', 0x68: 'AAC（MPEG-2）',
  0x69: 'MP3', 0x6B: 'MP3'
}
// AudioSpecificConfig：audioObjectType 对照
const AOT_NAMES = {
  1: 'AAC Main', 2: 'AAC-LC', 3: 'AAC-SSR', 4: 'AAC-LTP',
  5: 'SBR（HE-AAC）', 6: 'AAC Scalable', 29: 'PS（HE-AAC v2）'
}
// AudioSpecificConfig：samplingFrequencyIndex 对照
const AAC_FREQ = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350]

// iTunes metadata（meta→ilst）常用标签 → 结果字段
const ILST_KEYS = {
  '©nam': 'title', '©ART': 'artist', 'aART': 'albumArtist', '©alb': 'album',
  '©wrt': 'composer', '©day': 'date', '©gen': 'genre', '©too': 'encoder',
  '©cmt': 'comment', 'desc': 'description', '©lyr': 'lyrics', 'cprt': 'copyright'
}

// ==================== 小工具 ====================

function readType(data, off) {
  return String.fromCharCode(data[off], data[off + 1], data[off + 2], data[off + 3])
}

// box type 合法性：4 个可打印 ASCII 或 ©（0xA9，iTunes 标签首字节）
function isValidType(t) {
  return /^[\x20-\x7e\xa9]{4}$/.test(t)
}

function readU64(dv, off) {
  // 用 hi*2^32+lo 规避 BigInt，文件尺寸级别精度足够（< 2^53）
  return dv.getUint32(off) * 0x100000000 + dv.getUint32(off + 4)
}

function decodeUtf8(data, start, end) {
  try {
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(data.subarray(start, end))
    }
  } catch (e) { /* 落到逐字节回退 */ }
  let s = ''
  for (let p = start; p < end; p++) s += String.fromCharCode(data[p])
  return s
}

function readHandlerName(data, start, end) {
  let bytes = []
  for (let p = start; p < end && bytes.length < 64; p++) {
    const c = data[p]
    if (c === 0) break
    bytes.push(c)
  }
  if (!bytes.length) return ''
  try {
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(new Uint8Array(bytes))
    }
  } catch (e) { /* 落到逐字节回退 */ }
  return bytes.map((c) => String.fromCharCode(c)).join('')
}

// tkhd 3×3 矩阵（16.16 定点，行主序 [a,b,u, c,d,v, x,y,w]）→ 旋转角度；非直角变换返回 null
function detectRotation(matrix) {
  const a = Math.round(matrix[0] / 65536)
  const b = Math.round(matrix[1] / 65536)
  const c = Math.round(matrix[3] / 65536)
  const d = Math.round(matrix[4] / 65536)
  if (a === 1 && b === 0 && c === 0 && d === 1) return 0
  if (a === 0 && b === 1 && c === -1 && d === 0) return 90
  if (a === -1 && b === 0 && c === 0 && d === -1) return 180
  if (a === 0 && b === -1 && c === 1 && d === 0) return 270
  return null
}

function newTrack() {
  return {
    id: null, handler: null, handlerName: '', kind: null, language: null,
    codec: null, codecName: null, codecList: [],
    codecDetail: null, audioDetail: null,
    width: null, height: null,            // tkhd 显示尺寸（16.16 定点 → 整数）
    codedWidth: null, codedHeight: null,  // stsd VisualSampleEntry 编码尺寸
    rotation: null, matrix: null,
    mediaTimescale: null, mediaDuration: null, durationSec: null,
    channels: null, sampleSize: null, sampleRate: null,
    frameCount: null, maxSampleSize: null, avgSampleSize: null, avgDelta: null, fps: null,
    bitrate: null, estimatedBitrate: null
  }
}

// ==================== box 树遍历 ====================

/**
 * 遍历 [start, end) 区间内的顶层 box 序列。
 * 返回 true 表示恰好消费到 end 且无结构错误（meta 的 FullBox/普通容器启发式依赖这个返回值）。
 */
function walkBoxes(dv, data, start, end, path, depth, out, errors, ctx) {
  let clean = true
  if (depth > 16) {
    errors.push((path || '顶层') + ': box 嵌套超过 16 层，停止递归')
    return false
  }
  let off = start
  let resyncs = 0
  while (off + 8 <= end) {
    const sizeRaw = dv.getUint32(off)
    const type = readType(data, off + 4)
    const nodePath = path ? path + '.' + type : type
    if (!isValidType(type)) {
      errors.push((path || '顶层') + ' 偏移 ' + off + ' 处出现非法 box 类型，停止该层解析')
      clean = false
      break
    }
    let size = sizeRaw
    let headerSize = 8
    if (size === 1) {
      // 64 位 largesize（ISO/IEC 14496-12 §4.2.2）
      if (off + 16 > end) {
        errors.push(nodePath + ': largesize 字段不完整（文件被截断）')
        clean = false
        break
      }
      size = readU64(dv, off + 8)
      headerSize = 16
    } else if (size === 0) {
      // size=0：box 延伸到数据末尾
      size = end - off
    }
    if (size < 8) {
      // 容错：跳过这个坏 box（8 字节）尝试重新同步，连续过多则放弃
      errors.push(nodePath + ': box 大小 ' + size + ' 字节非法（< 8），已跳过并尝试继续')
      clean = false
      resyncs += 1
      if (resyncs > 32) {
        errors.push((path || '顶层') + ': 连续坏 box 过多，停止该层解析')
        break
      }
      off += 8
      continue
    }
    if (off + size > end) {
      errors.push(nodePath + ': box 声明大小 ' + size + ' 字节超出数据末尾（文件可能被截断）')
      clean = false
      break
    }

    const node = { type, size, offset: off, headerSize, path: nodePath, children: null }
    out.push(node)

    // trak：建立轨上下文（tkhd/mdhd/hdlr/stsd 等都写入 curTrack）
    const isTrak = type === 'trak' && !ctx.curTrack && depth <= 3
    if (isTrak) {
      ctx.curTrack = newTrack()
      ctx.tracks.push(ctx.curTrack)
    }

    if (type === 'stsd') {
      // FullBox：4 字节 version/flags + 4 字节 entry_count，其后是 sample entry 列表
      node.children = []
      parseStsd(dv, data, off + headerSize, off + size, node, ctx, errors, nodePath)
    } else if (type === 'meta') {
      node.children = []
      parseMeta(dv, data, off + headerSize, off + size, node, ctx, errors, depth, nodePath)
    } else if (type === 'ilst') {
      node.children = []
      parseIlst(dv, data, off + headerSize, off + size, node, ctx, nodePath)
    } else {
      extractBoxFields(dv, data, type, off + headerSize, off + size, ctx)
      if (CONTAINER_BOXES.has(type)) {
        node.children = []
        walkBoxes(dv, data, off + headerSize, off + size, nodePath, depth + 1, node.children, errors, ctx)
      }
    }

    if (isTrak) ctx.curTrack = null
    off += size
  }
  if (off < end) {
    errors.push((path || '顶层') + ' 末尾剩余 ' + (end - off) + ' 字节不足以构成完整 box，已忽略')
    clean = false
  }
  return clean
}

// meta：ISO BMFF 里是 FullBox（先跳 4 字节 version/flags），QuickTime 里是普通容器 —— 两种都试，取能整段解析的那一种
function parseMeta(dv, data, start, end, node, ctx, errors, depth, path) {
  const attempt = (s) => {
    const kids = []
    const errs = []
    const ok = s + 8 <= end ? walkBoxes(dv, data, s, end, path, depth + 1, kids, errs, ctx) : false
    return { ok, kids, errs }
  }
  const full = attempt(start + 4)
  if (full.ok && full.kids.length) {
    node.children.push(...full.kids)
    return
  }
  const plain = attempt(start)
  if (plain.ok && plain.kids.length) {
    node.children.push(...plain.kids)
    return
  }
  // 两种都不完美：保留子节点更多的一侧及其错误信息
  const pick = full.kids.length >= plain.kids.length ? full : plain
  node.children.push(...pick.kids)
  errors.push(...pick.errs)
}

// ilst：iTunes 元数据容器。子 box 的 type 就是标签名（©nam/©ART…），其内是 data box
function parseIlst(dv, data, start, end, node, ctx, path) {
  let off = start
  while (off + 8 <= end) {
    const size = dv.getUint32(off)
    const tag = readType(data, off + 4)
    if (!isValidType(tag) || size < 8 || off + size > end) break
    const tagNode = { type: tag, size, offset: off, headerSize: 8, path: path + '.' + tag, children: [] }
    node.children.push(tagNode)
    let doff = off + 8
    const dend = off + size
    while (doff + 8 <= dend) {
      const dsize = dv.getUint32(doff)
      const dtype = readType(data, doff + 4)
      if (!isValidType(dtype) || dsize < 8 || doff + dsize > dend) break
      tagNode.children.push({ type: dtype, size: dsize, offset: doff, headerSize: 8, path: tagNode.path + '.' + dtype, children: null })
      if (dtype === 'data') {
        const value = readIlstDataValue(data, doff + 8, doff + dsize)
        const key = ILST_KEYS[tag]
        if (value != null && key) ctx.metadata[key] = value
      }
      doff += dsize
    }
    off += size
  }
}

// data box：type indicator 为 32 位大端整数（1=UTF-8 文本、13=JPEG、14=PNG、21=有符号整数、0=二进制）+ locale u32 + 值
function readIlstDataValue(data, start, end) {
  if (end - start < 8) return null
  const typeCode = (data[start] << 24) | (data[start + 1] << 16) | (data[start + 2] << 8) | data[start + 3]
  const vs = start + 8
  if (typeCode === 1) {
    const s = decodeUtf8(data, vs, end)
    return s.length ? s : null
  }
  if (typeCode === 21) {
    const n = end - vs
    if (n === 1) return data[vs] - (data[vs] & 0x80 ? 0x100 : 0)
    if (n === 2) return (data[vs] << 8) | data[vs + 1]
    if (n === 4) return (data[vs] << 24) | (data[vs + 1] << 16) | (data[vs + 2] << 8) | data[vs + 3]
    return null
  }
  if (typeCode === 13 || typeCode === 14) return '[图片数据 ' + (end - vs) + ' 字节]'
  if (end - vs > 0) return '[二进制 ' + (end - vs) + ' 字节]'
  return null
}

// stsd：FullBox（version/flags + entry_count）+ 若干 sample entry
function parseStsd(dv, data, start, end, node, ctx, errors, path) {
  if (end - start < 8) {
    errors.push(path + ': stsd 长度不足 8 字节，跳过')
    return
  }
  const entryCount = dv.getUint32(start + 4)
  let off = start + 8
  for (let i = 0; i < entryCount; i++) {
    if (off + 8 > end) {
      errors.push(path + ': sample entry 不完整（声明 ' + entryCount + ' 个，实际只放得下 ' + i + ' 个）')
      break
    }
    const size = dv.getUint32(off)
    const format = readType(data, off + 4)
    if (size < 8 || off + size > end || !isValidType(format)) {
      errors.push(path + ': 第 ' + (i + 1) + ' 个 sample entry 无效（format=' + format + '，size=' + size + '），停止解析 stsd')
      break
    }
    const entryNode = { type: format, size, offset: off, headerSize: 8, path: path + '.' + format, children: [] }
    node.children.push(entryNode)
    parseSampleEntry(dv, data, off, off + size, format, entryNode, ctx, entryNode.path)
    off += size
  }
}

// sample entry：size(4)+format(4)+reserved(6)+data_reference_index(2) 之后按视频/音频布局分叉
function parseSampleEntry(dv, data, start, end, format, node, ctx, path) {
  const track = ctx.curTrack
  const isVideo = VIDEO_SAMPLE_ENTRIES.has(format)
  const isAudio = AUDIO_SAMPLE_ENTRIES.has(format)
  if (track) {
    track.codecList.push(format)
    if (!track.codec) track.codec = format
    if (isVideo) {
      track.kind = 'video'
      // VisualSampleEntry：width u16 @+32、height u16 @+34（编码尺寸，与 tkhd 的显示尺寸分开记）
      if (end - start >= 36) {
        track.codedWidth = dv.getUint16(start + 32)
        track.codedHeight = dv.getUint16(start + 34)
      }
    } else if (isAudio) {
      track.kind = 'audio'
      if (end - start >= 36) {
        // AudioSampleEntry：reserved u32[2]（QT 里首 2 字节是 version）@+16..24、
        // channelcount u16 @+24、samplesize u16 @+26、samplerate u32(16.16) @+32
        const qtVersion = dv.getUint16(start + 16)
        if (qtVersion === 2 && end - start >= 64) {
          // QuickTime SoundDescriptionV2：采样率是 double，声道数是 u32
          track.channels = dv.getUint32(start + 36)
          track.sampleRate = Math.round(dv.getFloat64(start + 28))
        } else {
          track.channels = dv.getUint16(start + 24)
          track.sampleSize = dv.getUint16(start + 26)
          track.sampleRate = dv.getUint32(start + 32) >> 16 // 16.16 定点取整数部分
        }
      }
    }
  }

  // 条目内的子 box（avcC/hvcC/esds/btrt/dOps/wave…）：
  // ISO 视频条目子 box 固定在 +86；音频条目 ISO 在 +36，QuickTime v0/v1/v2 布局各不相同。
  // 先按已知偏移试，全部失败再做一次有界线性扫描（要求子链恰好消费到条目末尾）。
  const known = isVideo ? [86] : isAudio ? [36, 52, 72, 64] : []
  const scanLimit = Math.min(start + 128, end - 8)
  const candidates = known.filter((c) => start + c + 8 <= end)
  for (let p = start + 16; p <= scanLimit; p++) {
    if (!candidates.includes(p - start)) candidates.push(p - start)
  }
  for (const c of candidates) {
    const abs = start + c
    const kids = []
    if (tryChildChain(dv, data, abs, end, kids, ctx, path)) {
      node.children.push(...kids)
      return
    }
  }
}

// 从 start 起连续解析 box 直到 end；每个 box 均合法且恰好耗尽区间返回 true（同时填充 out 与提取信息）
function tryChildChain(dv, data, start, end, out, ctx, path) {
  let off = start
  while (off + 8 <= end) {
    const size = dv.getUint32(off)
    const type = readType(data, off + 4)
    if (!isValidType(type) || size < 8 || off + size > end) return false
    const child = { type, size, offset: off, headerSize: 8, path: path + '.' + type, children: null }
    out.push(child)
    if (CONTAINER_BOXES.has(type)) {
      // 如 QuickTime 的 wave 容器（内含 esds）
      child.children = []
      const scratch = []
      walkBoxes(dv, data, off + 8, off + size, child.path, 4, child.children, scratch, ctx)
    } else {
      extractBoxFields(dv, data, type, off + 8, off + size, ctx)
    }
    off += size
  }
  return off === end
}

// ==================== 各 box 信息提取（payload 边界 = 去掉 8/16 字节头后） ====================

function extractBoxFields(dv, data, type, start, end, ctx) {
  const len = end - start
  switch (type) {
    case 'ftyp':
    case 'styp': {
      // major_brand(4) + minor_version(4) + compatible_brands(4×n)
      if (len < 8) break
      const major = readType(data, start)
      if (!isValidType(major)) break
      const compatible = []
      for (let p = start + 8; p + 4 <= end; p += 4) {
        const b = readType(data, p)
        if (isValidType(b) && !compatible.includes(b)) compatible.push(b)
      }
      if (!ctx.brands) {
        ctx.brands = { major, minorVersion: dv.getUint32(start + 4), compatible }
      }
      break
    }
    case 'mvhd': {
      // FullBox（4 字节 version/flags 之后）。
      // v0：creation(4) modification(4) timescale(4) duration(4) → timescale@+12、duration@+16
      // v1：creation(8) modification(8) timescale(4) duration(8) → timescale@+20、duration@+24
      if (len < 8) break
      const version = data[start]
      if (version === 1) {
        if (len < 32) break
        ctx.movieTimescale = dv.getUint32(start + 20)
        ctx.movieDuration = readU64(dv, start + 24)
        ctx.mvhdVersion = 1
      } else {
        if (len < 20) break
        ctx.movieTimescale = dv.getUint32(start + 12)
        ctx.movieDuration = dv.getUint32(start + 16)
        ctx.mvhdVersion = 0
      }
      break
    }
    case 'mehd': {
      // MovieExtendsHeaderBox（分片封装的总时长提示）：v0 u32 / v1 u64
      if (len < 8) break
      const version = data[start]
      if (version === 1) {
        if (len < 12) break
        ctx.mehdDuration = readU64(dv, start + 4)
      } else {
        ctx.mehdDuration = dv.getUint32(start + 4)
      }
      break
    }
    case 'moof':
    case 'mfhd':
      // 存在 movie fragment → 分片封装（fMP4）
      ctx.hasMoof = true
      break
    case 'tkhd': {
      // FullBox。v0：creation(4) modification(4) track_ID(4) reserved(4) duration(4)
      //          v1：creation(8) modification(8) track_ID(4) reserved(4) duration(8)
      // 之后：reserved(8) layer(2) alternate_group(2) volume(2) reserved(2) matrix(36) width(16.16) height(16.16)
      const t = ctx.curTrack
      if (!t || len < 8) break
      const version = data[start]
      const need = version === 1 ? 96 : 84
      if (len < need) break
      let p = start + 4 + (version === 1 ? 16 : 8)
      t.id = dv.getUint32(p)
      p += 4
      p += 4 // reserved
      p += version === 1 ? 8 : 4 // duration
      p += 8 // reserved[2]
      p += 2 + 2 + 2 + 2 // layer / alternate_group / volume / reserved
      const matrix = []
      for (let i = 0; i < 9; i++) {
        matrix.push(dv.getInt32(p))
        p += 4
      }
      t.matrix = matrix
      t.rotation = detectRotation(matrix)
      t.width = Math.round((dv.getUint32(p) / 65536) * 100) / 100     // 16.16 定点
      t.height = Math.round((dv.getUint32(p + 4) / 65536) * 100) / 100
      break
    }
    case 'mdhd': {
      // FullBox（4 字节 version/flags 之后）。
      // v0：creation(4) modification(4) timescale(4) duration(4) language(2) pre_defined(2)
      //     → timescale@+12、duration@+16、language@+20
      // v1：creation(8) modification(8) timescale(4) duration(8) language(2) pre_defined(2)
      //     → timescale@+20、duration@+24、language@+32
      const t = ctx.curTrack
      if (!t || len < 8) break
      const version = data[start]
      let p
      if (version === 1) {
        if (len < 36) break
        t.mediaTimescale = dv.getUint32(start + 20)
        t.mediaDuration = readU64(dv, start + 24)
        p = start + 32
      } else {
        if (len < 24) break
        t.mediaTimescale = dv.getUint32(start + 12)
        t.mediaDuration = dv.getUint32(start + 16)
        p = start + 20
      }
      // language：3×5bit 打包的 ISO-639-2/T 小写码
      const langV = dv.getUint16(p)
      t.language = String.fromCharCode(
        ((langV >> 10) & 0x1f) + 0x60,
        ((langV >> 5) & 0x1f) + 0x60,
        (langV & 0x1f) + 0x60
      )
      break
    }
    case 'hdlr': {
      // FullBox：pre_defined(4) handler_type(4) reserved(12) name（UTF-8 以 \0 结尾）
      const t = ctx.curTrack
      if (!t || len < 12) break
      t.handler = readType(data, start + 8)
      if (len > 20) t.handlerName = readHandlerName(data, start + 20, end)
      break
    }
    case 'stts': {
      // FullBox：entry_count(4) + (sample_count u32, sample_delta u32)×n —— 样本数与时长推算
      const t = ctx.curTrack
      if (!t || len < 8) break
      const count = dv.getUint32(start + 4)
      let p = start + 8
      let samples = 0
      let weighted = 0
      for (let i = 0; i < count && p + 8 <= end; i++) {
        const c = dv.getUint32(p)
        const d = dv.getUint32(p + 4)
        samples += c
        weighted += c * d
        p += 8
      }
      t.frameCount = samples
      t.avgDelta = samples > 0 ? weighted / samples : null
      break
    }
    case 'stsz':
    case 'stz2': {
      // stsz FullBox：sample_size(4) sample_count(4)；sample_size=0 时后跟每样本 u32 大小表
      const t = ctx.curTrack
      if (!t || len < 12) break
      const fixed = dv.getUint32(start + 4)
      const count = dv.getUint32(start + 8)
      if (!t.frameCount) t.frameCount = count
      if (fixed > 0) {
        t.maxSampleSize = fixed
        t.avgSampleSize = fixed
      } else {
        let p = start + 12
        let mx = 0
        let sum = 0
        const n = Math.min(count, (end - p) >> 2)
        for (let i = 0; i < n; i++) {
          const s = dv.getUint32(p + i * 4)
          if (s > mx) mx = s
          sum += s
        }
        if (n > 0) {
          t.maxSampleSize = mx
          t.avgSampleSize = Math.round(sum / n)
        }
      }
      break
    }
    case 'btrt': {
      // 码率 box（ISO/IEC 14496-15 §5.4.2，普通 box）：bufferSizeDB(4) maxBitrate(4) avgBitrate(4)
      const t = ctx.curTrack
      if (!t || len < 12) break
      if (!t.bitrate) {
        t.bitrate = {
          bufferSizeDB: dv.getUint32(start),
          maxBitrate: dv.getUint32(start + 4),
          avgBitrate: dv.getUint32(start + 8)
        }
      }
      break
    }
    case 'avcC': {
      // AVCDecoderConfigurationRecord：configurationVersion(1) AVCProfileIndication(1)
      // profile_compatibility(1) AVCLevelIndication(1) …
      const t = ctx.curTrack
      if (!t || len < 4) break
      const profileIdc = data[start + 1]
      const levelIdc = data[start + 3]
      t.codecDetail = {
        type: 'avc',
        profileIdc,
        profileName: AVC_PROFILES[profileIdc] || ('profile ' + profileIdc),
        levelIdc,
        levelText: (levelIdc / 10).toFixed(1)
      }
      break
    }
    case 'hvcC': {
      // HEVCDecoderConfigurationRecord：configurationVersion(1) profile_space/tier/profile_idc(1)
      // compat_flags(4) constraint_flags(6) general_level_idc(1)
      const t = ctx.curTrack
      if (!t || len < 13) break
      const profileIdc = data[start + 1] & 0x1f
      const levelIdc = data[start + 12]
      t.codecDetail = {
        type: 'hevc',
        profileIdc,
        profileName: HEVC_PROFILES[profileIdc] || ('profile ' + profileIdc),
        levelIdc,
        levelText: (levelIdc / 30).toFixed(1)
      }
      break
    }
    case 'dOps': {
      // OpusSampleEntry 扩展：Version(1) OutputChannelCount(1) PreSkip(2) InputSampleRate(4)…
      const t = ctx.curTrack
      if (!t || len < 8) break
      t.channels = data[start + 1]
      t.sampleRate = dv.getUint32(start + 4)
      break
    }
    case 'esds':
      parseEsds(dv, data, start, end, ctx)
      break
    default:
      break
  }
}

// esds（FullBox）→ ES_Descriptor(0x03) → DecoderConfigDescriptor(0x04) → DecSpecificInfo(0x05)
function parseEsds(dv, data, start, end, ctx) {
  const t = ctx.curTrack
  if (!t) return
  let p = start + 4 // 跳过 version/flags
  const es = readDescriptor(data, p, end)
  if (!es || es.tag !== 0x03) return
  p = es.contentStart
  if (p + 3 > end) return
  p += 2 // ES_ID
  const flags = data[p]
  p += 1
  if (flags & 0x80) p += 2 // streamDependenceFlag → dependsOn_ES_ID
  if (flags & 0x40) p += 2 // URL_Flag → URLlength+URLstring（尽力跳过，越界由后续边界检查兜底）
  if (flags & 0x20) p += 2 // OCRstreamFlag → OCR_ES_ID
  const dcd = readDescriptor(data, p, end)
  if (!dcd || dcd.tag !== 0x04) return
  p = dcd.contentStart
  if (p + 13 > end) return
  const oti = data[p]
  // objectTypeIndication(1) streamType(1) bufferSizeDB(3) maxBitrate(4) avgBitrate(4)
  const avgBitrate = dv.getUint32(p + 9)
  const audioDetail = { objectTypeIndication: oti, otiName: OTI_NAMES[oti] || null, audioObjectType: null, aotName: null }
  if (avgBitrate > 0 && !t.bitrate) {
    t.bitrate = {
      bufferSizeDB: (data[p + 2] << 16) | (data[p + 3] << 8) | data[p + 4],
      maxBitrate: dv.getUint32(p + 5),
      avgBitrate
    }
  }
  const dsi = readDescriptor(data, p + 13, end)
  if (dsi && dsi.tag === 0x05 && (oti === 0x40 || oti === 0x66 || oti === 0x67 || oti === 0x68)) {
    // AudioSpecificConfig：AOT(5bit) 频率索引(4bit) 声道(4bit)
    const q = dsi.contentStart
    if (q + 2 <= end) {
      const b0 = data[q]
      const b1 = data[q + 1]
      const aot = b0 >> 3
      const freqIdx = ((b0 & 0x07) << 1) | (b1 >> 7)
      const ch = (b1 >> 3) & 0x0f
      audioDetail.audioObjectType = aot
      audioDetail.aotName = AOT_NAMES[aot] || ('AOT ' + aot)
      if (t.kind !== 'audio') t.kind = 'audio'
      if (freqIdx !== 0x0f && AAC_FREQ[freqIdx]) t.sampleRate = AAC_FREQ[freqIdx]
      if (ch > 0 && ch < 8) t.channels = ch
    }
  }
  t.audioDetail = audioDetail
}

// 描述符头：tag(1) + 变长 length（1~4 字节，高位为续位）
function readDescriptor(data, off, end) {
  if (off + 2 > end) return null
  const tag = data[off]
  let len = 0
  let p = off + 1
  for (let i = 0; i < 4; i++) {
    if (p >= end) return null
    const b = data[p]
    p += 1
    len = (len << 7) | (b & 0x7f)
    if (!(b & 0x80)) break
  }
  return { tag, length: len, contentStart: p, next: p + len }
}

// ==================== 入口 ====================

export function parseMp4(buffer) {
  const data = buffer instanceof ArrayBuffer
    ? new Uint8Array(buffer)
    : ArrayBuffer.isView(buffer)
      ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      : buffer

  const result = {
    ok: false,
    notContainer: false,
    fileType: null,
    brands: null,
    timescale: null,
    durationSec: null,
    mvhdVersion: null,
    fragmented: false,
    hasMehd: false,
    estimatedBitrate: null,
    tracks: [],
    metadata: {},
    boxes: [],
    errors: []
  }

  // EBML 魔数 → WebM / MKV，诚实报告不是 MP4 家族
  if (data.length >= 4 && data[0] === 0x1a && data[1] === 0x45 && data[2] === 0xdf && data[3] === 0xa3) {
    result.notContainer = true
    result.errors.push('不是 MP4/MOV 容器：文件以 EBML 魔数（1A 45 DF A3）开头，通常是 WebM 或 MKV 格式')
    return result
  }
  if (data.length < 12) {
    result.errors.push('文件不足 12 字节，不可能是 MP4/MOV 文件')
    return result
  }

  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const ctx = {
    curTrack: null,
    tracks: result.tracks,
    metadata: result.metadata,
    brands: null,
    movieTimescale: null,
    movieDuration: null,
    mehdDuration: null,
    hasMoof: false,
    mvhdVersion: null
  }
  walkBoxes(dv, data, 0, data.byteLength, '', 0, result.boxes, result.errors, ctx)

  result.brands = ctx.brands
  result.timescale = ctx.movieTimescale
  result.mvhdVersion = ctx.mvhdVersion
  result.fragmented = ctx.hasMoof
  result.hasMehd = ctx.mehdDuration != null && ctx.mehdDuration > 0

  // 容器判定：MP4 家族必须有 ftyp/styp；QuickTime 经典 mov 可直接以 moov 开头
  const hasFtyp = result.boxes.some((b) => b.type === 'ftyp' || b.type === 'styp')
  const firstType = result.boxes.length ? result.boxes[0].type : null
  if (!hasFtyp && firstType !== 'moov') {
    result.notContainer = true
    result.errors.push('不是 MP4/MOV 容器：未找到 ftyp 文件类型头（首个 box 为 ' + (firstType || '空') + '），该文件可能是 WebM/MKV/AVI 等其他格式')
    return result
  }
  const majorTrim = ctx.brands && typeof ctx.brands.major === 'string' ? ctx.brands.major.trim() : ''
  result.fileType = majorTrim === 'qt' ? 'mov' : hasFtyp ? 'mp4' : 'mov'

  // 时长：mvhd 优先；分片封装 mvhd 常为 0，回退 mehd
  let duration = null
  if (ctx.movieTimescale > 0 && ctx.movieDuration > 0) {
    duration = ctx.movieDuration / ctx.movieTimescale
  } else if (ctx.mehdDuration > 0 && ctx.movieTimescale > 0) {
    duration = ctx.mehdDuration / ctx.movieTimescale
  }
  if (duration != null && isFinite(duration) && duration > 0) {
    result.durationSec = Math.round(duration * 1000) / 1000
  }
  if (result.durationSec > 0) {
    result.estimatedBitrate = Math.round((data.byteLength * 8) / result.durationSec)
  }

  // 轨道收尾：类型、编码名、帧率、轨码率兜底
  for (const t of result.tracks) {
    if (t.mediaTimescale > 0 && t.mediaDuration > 0) {
      t.durationSec = Math.round((t.mediaDuration / t.mediaTimescale) * 1000) / 1000
    }
    if (t.handler === 'vide' || (!t.handler && VIDEO_SAMPLE_ENTRIES.has(t.codec))) t.kind = 'video'
    else if (t.handler === 'soun' || (!t.handler && AUDIO_SAMPLE_ENTRIES.has(t.codec))) t.kind = 'audio'
    else if (t.handler) t.kind = t.handler
    if (t.codec) t.codecName = CODEC_NAMES[t.codec] || t.codec
    if (t.kind === 'video') {
      if (t.avgDelta && t.mediaTimescale) {
        t.fps = Math.round((t.mediaTimescale / t.avgDelta) * 100) / 100
      } else if (t.durationSec > 0 && t.frameCount > 0) {
        t.fps = Math.round((t.frameCount / t.durationSec) * 100) / 100
      }
    }
    if (t.estimatedBitrate == null && t.avgSampleSize > 0 && t.frameCount > 0 && t.durationSec > 0) {
      t.estimatedBitrate = Math.round((t.avgSampleSize * t.frameCount * 8) / t.durationSec)
    }
  }

  result.ok = result.boxes.length > 0
  return result
}
