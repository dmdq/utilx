/**
 * 纯 JS GIF 解码器（无第三方依赖，浏览器 / Node 通用，SSR 安全——不触碰任何浏览器 API）
 *
 * parseGif(ArrayBuffer | Uint8Array) => {
 *   width, height,            // 逻辑屏幕尺寸（整帧画布尺寸）
 *   loopCount,                // 循环次数（NETSCAPE2.0 / ANIMEXTS1.0 扩展；0 = 无限循环，无扩展 = 1）
 *   frames: [{
 *     delayMs,                // 本帧延时（毫秒，GCE 延时单位为 1/100 秒 × 10）
 *     left, top, w, h,        // 本帧图像在画布上的绘制矩形
 *     interlaced,             // 本帧是否为交织存储（解码时已还原行序）
 *     disposal,               // 本帧的 disposal 方法（0/1/2/3）
 *     transparentIndex,       // 透明索引（无透明时为 -1）
 *     rgba                    // Uint8ClampedArray(width*height*4)：本帧绘制完成后的整帧画布合成结果
 *   }]
 * }
 *
 * 合成规则（与浏览器渲染行为一致）：
 * - 画布初始全透明，逐帧把图像矩形的不透明像素累积绘制上去（disposal 0/1 保留原样）；
 * - disposal 2（恢复背景色）：本帧展示后把矩形区域清回全透明；
 * - disposal 3（恢复上一帧）：本帧展示后把画布恢复为绘制本帧之前的状态。
 *
 * 支持特性：GIF87a/GIF89a、全局/局部色表、图形控制扩展（延时/透明索引/处置方法）、
 * LZW 变长码解压（清理码 / 结束码 / 码表按 2^codeSize 增长、12bit 上限、KwKwK）、
 * 交织行还原（4 遍扫描行序）、NETSCAPE 循环扩展。
 */

// ---------- LZW 解压（可独立测试） ----------

/**
 * GIF 变长码 LZW 解压
 * @param {number} minCodeSize LZW 最小码长（来自 Image Descriptor 后的字节，合法值 2-11）
 * @param {Uint8Array} data   已拼接好的 LZW 码流子块数据
 * @param {number} pixelCount 期望解出的像素数（w * h）
 * @returns {Uint8Array} 索引像素（长度 = 实际解出的像素数，<= pixelCount）
 */
export function lzwDecode(minCodeSize, data, pixelCount) {
  if (!Number.isInteger(minCodeSize) || minCodeSize < 2 || minCodeSize > 11) {
    throw new Error(`GIF LZW 最小码长非法：${minCodeSize}（应为 2-11）`)
  }
  const clearCode = 1 << minCodeSize
  const endCode = clearCode + 1

  // 码表：prefix 链 + suffix 像素。entry n 的字符串 = entry(prefix[n]) 的字符串 + suffix[n]
  const prefix = new Int32Array(4096)
  const suffix = new Uint8Array(4096)
  for (let i = 0; i < clearCode; i++) {
    prefix[i] = -1
    suffix[i] = i
  }
  // 字符串缓冲：单串最长 4096，KwKwK 情形多 1 个字符
  const strBuf = new Uint8Array(4097)

  const out = new Uint8Array(pixelCount)
  let outPos = 0

  let codeSize = minCodeSize + 1
  let nextCode = endCode + 1
  let prevCode = -1

  // LSB 优先位流读取
  let bitBuf = 0
  let bitCnt = 0
  let bytePos = 0

  // 把 code 对应的字符串按正序写入 strBuf[0..len)，返回长度；坏码返回 -1
  const materialize = (code) => {
    let len = 0
    let c = code
    while (c >= 0) {
      if (len >= strBuf.length) return -1
      strBuf[len++] = suffix[c]
      c = prefix[c]
    }
    for (let i = 0, j = len - 1; i < j; i++, j--) {
      const t = strBuf[i]
      strBuf[i] = strBuf[j]
      strBuf[j] = t
    }
    return len
  }

  while (outPos < pixelCount) {
    // 读一个 codeSize 位宽的码
    while (bitCnt < codeSize) {
      if (bytePos >= data.length) {
        // 码流提前耗尽：按截断处理，返回已解出的像素
        return out.subarray(0, outPos)
      }
      bitBuf |= data[bytePos++] << bitCnt
      bitCnt += 8
    }
    const code = bitBuf & ((1 << codeSize) - 1)
    bitBuf >>= codeSize
    bitCnt -= codeSize

    if (code === clearCode) {
      codeSize = minCodeSize + 1
      nextCode = endCode + 1
      prevCode = -1
      continue
    }
    if (code === endCode) break

    let len
    if (code < nextCode) {
      // 表内已有条目
      len = materialize(code)
      if (len < 0) throw new Error('GIF LZW 码表链损坏')
    } else if (code === nextCode && prevCode >= 0) {
      // KwKwK 特例：字符串 = 上一个字符串 + 其首字符
      len = materialize(prevCode)
      if (len < 0) throw new Error('GIF LZW 码表链损坏')
      strBuf[len] = strBuf[0]
      len++
    } else {
      throw new Error(`GIF LZW 数据损坏：码值 ${code} 超出当前码表（nextCode=${nextCode}）`)
    }

    // 输出像素（超长期截断）
    const n = Math.min(len, pixelCount - outPos)
    out.set(strBuf.subarray(0, n), outPos)
    outPos += n
    if (n < len) break

    // 新增码表条目：上一次字符串 + 本次字符串首字符
    if (prevCode >= 0 && nextCode < 4096) {
      prefix[nextCode] = prevCode
      suffix[nextCode] = strBuf[0]
      nextCode++
      // 码表增长：nextCode 达到 2^codeSize 时位宽 +1，12 位封顶
      if (nextCode === (1 << codeSize) && codeSize < 12) codeSize++
    }
    prevCode = code
  }
  return out.subarray(0, outPos)
}

// ---------- 主解析 ----------

/**
 * 解析 GIF 二进制并按 disposal 规则合成每一帧
 * @param {ArrayBuffer|Uint8Array} buffer GIF 文件二进制
 */
export function parseGif(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let pos = 0

  // 读到文件末尾时返回 0（对子块循环而言等价于块结束，避免越界死循环）
  const readU8 = () => (pos < bytes.length ? bytes[pos++] : 0)
  const readU16 = () => {
    const v = bytes[pos] | (bytes[pos + 1] << 8)
    pos += 2
    return v
  }

  // 文件头：GIF87a / GIF89a
  let sig = ''
  for (let i = 0; i < 6; i++) sig += String.fromCharCode(bytes[i] || 0)
  if (!/^GIF8[79]a$/.test(sig)) {
    throw new Error('不是有效的 GIF 文件（缺少 GIF87a/GIF89a 文件头）')
  }
  pos = 6

  // 逻辑屏幕描述符
  const width = readU16()
  const height = readU16()
  const lsdPacked = readU8()
  readU8() // 背景色索引
  readU8() // 像素宽高比
  const gctEntries = (lsdPacked & 0x80) ? 2 << (lsdPacked & 0x07) : 0
  let globalColorTable = null
  if (gctEntries > 0) {
    globalColorTable = bytes.subarray(pos, pos + gctEntries * 3)
    pos += gctEntries * 3
  }

  // 整帧画布（初始全透明）
  const canvas = new Uint8ClampedArray(width * height * 4)
  const frames = []
  let loopCount = 1
  let pendingGce = null // { delayMs, disposal, transparentIndex, transparentFlag }

  // 交织行序：4 遍扫描（0 步长 8 → 4 步长 8 → 2 步长 4 → 1 步长 2）
  const interlaceRowOrder = (h) => {
    const rows = new Int32Array(h)
    let i = 0
    for (let y = 0; y < h; y += 8) rows[i++] = y
    for (let y = 4; y < h; y += 8) rows[i++] = y
    for (let y = 2; y < h; y += 4) rows[i++] = y
    for (let y = 1; y < h; y += 2) rows[i++] = y
    return rows
  }

  const fillRectTransparent = (left, top, w, h) => {
    const x0 = Math.max(0, left)
    const y0 = Math.max(0, top)
    const x1 = Math.min(width, left + w)
    const y1 = Math.min(height, top + h)
    for (let y = y0; y < y1; y++) {
      const start = (y * width + x0) * 4
      canvas.fill(0, start, start + (x1 - x0) * 4)
    }
  }

  while (pos < bytes.length) {
    const blockType = readU8()

    if (blockType === 0x3b) {
      // 文件结束符
      break
    }

    if (blockType === 0x21) {
      // 扩展块
      const label = readU8()
      if (label === 0xf9) {
        // 图形控制扩展 GCE
        const blockSize = readU8()
        const packed = readU8()
        const delayCs = readU16()
        const transparentIndex = readU8()
        pos += 1 // 块结束符 0x00（blockSize 恒为 4）
        if (blockSize !== 4) pos += Math.max(0, blockSize - 4)
        pendingGce = {
          delayMs: delayCs * 10,
          disposal: (packed >> 2) & 0x07,
          transparentIndex,
          transparentFlag: (packed & 0x01) === 1
        }
      } else if (label === 0xff) {
        // 应用扩展（读 NETSCAPE2.0 / ANIMEXTS1.0 循环次数）
        const blockSize = readU8()
        const appId = String.fromCharCode(...bytes.subarray(pos, pos + blockSize))
        pos += blockSize
        const subChunks = []
        let subSize
        while ((subSize = readU8()) !== 0) {
          if (pos + subSize > bytes.length) throw new Error('GIF 应用扩展数据不完整')
          subChunks.push(bytes.subarray(pos, pos + subSize))
          pos += subSize
        }
        if (/^(NETSCAPE2\.0|ANIMEXTS1\.0)$/.test(appId)) {
          for (const chunk of subChunks) {
            if (chunk.length >= 3 && chunk[0] === 0x01) {
              loopCount = chunk[1] | (chunk[2] << 8)
            }
          }
        }
      } else {
        // 注释（0xFE）、纯文本（0x01）等：跳过子块
        let subSize
        while ((subSize = readU8()) !== 0) {
          if (pos + subSize > bytes.length) throw new Error('GIF 扩展数据不完整')
          pos += subSize
        }
      }
      continue
    }

    if (blockType === 0x2c) {
      // 图像描述符
      const left = readU16()
      const top = readU16()
      const imgW = readU16()
      const imgH = readU16()
      const imgPacked = readU8()
      const lctEntries = (imgPacked & 0x80) ? 2 << (imgPacked & 0x07) : 0
      const interlaced = (imgPacked & 0x40) !== 0

      let colorTable = globalColorTable
      let ctEntries = gctEntries
      if (lctEntries > 0) {
        colorTable = bytes.subarray(pos, pos + lctEntries * 3)
        ctEntries = lctEntries
        pos += lctEntries * 3
      }
      if (!colorTable || ctEntries === 0) {
        throw new Error('GIF 图像帧缺少可用的颜色表')
      }

      const gce = pendingGce || { delayMs: 0, disposal: 0, transparentIndex: 0, transparentFlag: false }
      pendingGce = null

      const minCodeSize = readU8()
      const chunks = []
      let total = 0
      let subSize
      while ((subSize = readU8()) !== 0) {
        if (pos + subSize > bytes.length) throw new Error('GIF 图像数据不完整')
        chunks.push(bytes.subarray(pos, pos + subSize))
        pos += subSize
        total += subSize
      }
      const lzwData = new Uint8Array(total)
      let off = 0
      for (const chunk of chunks) {
        lzwData.set(chunk, off)
        off += chunk.length
      }

      const indices = lzwDecode(minCodeSize, lzwData, imgW * imgH)

      // disposal 3 需要在绘制前保存画布快照
      const snapshotBefore = gce.disposal === 3 ? canvas.slice() : null

      // 绘制帧到画布（透明索引像素跳过，保留画布已有内容）
      const rows = interlaced ? interlaceRowOrder(imgH) : null
      for (let row = 0; row < imgH; row++) {
        const cy = top + (rows ? rows[row] : row)
        if (cy < 0 || cy >= height) continue
        for (let col = 0; col < imgW; col++) {
          const idx = indices[row * imgW + col]
          if (gce.transparentFlag && idx === gce.transparentIndex) continue
          if (idx >= ctEntries) continue // 越界色表索引，跳过
          const cx = left + col
          if (cx < 0 || cx >= width) continue
          const pi = (cy * width + cx) * 4
          const ci = idx * 3
          canvas[pi] = colorTable[ci]
          canvas[pi + 1] = colorTable[ci + 1]
          canvas[pi + 2] = colorTable[ci + 2]
          canvas[pi + 3] = 255
        }
      }

      frames.push({
        delayMs: gce.delayMs,
        left,
        top,
        w: imgW,
        h: imgH,
        interlaced,
        disposal: gce.disposal,
        transparentIndex: gce.transparentFlag ? gce.transparentIndex : -1,
        rgba: canvas.slice()
      })

      // 为下一帧准备画布（disposal 语义作用于本帧展示之后）
      if (gce.disposal === 2) {
        fillRectTransparent(left, top, imgW, imgH)
      } else if (gce.disposal === 3 && snapshotBefore) {
        canvas.set(snapshotBefore)
      }
      continue
    }

    throw new Error(`GIF 结构无法识别（块标识 0x${blockType.toString(16)} @ ${pos - 1}），文件可能已损坏`)
  }

  if (frames.length === 0) {
    throw new Error('GIF 中没有找到任何图像帧')
  }

  return { width, height, loopCount, frames }
}
