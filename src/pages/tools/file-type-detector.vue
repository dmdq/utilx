<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Binary class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">文件类型识别</h1>
          <p class="text-sm text-muted-foreground mt-1">通过文件头魔数识别真实格式，识破改后缀伪装，40+ 种签名纯本地检测</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线文件类型识别工具：多选或拖入文件后，读取文件头部的魔数（Magic Number）与 ZIP 容器目录特征判断真实格式，
        覆盖图片、音视频、压缩包、可执行文件、字体、文档等 40+ 种签名；把 .exe 改名成 .jpg 这类伪装会以红色警示行标出。
        大文件只读取头部与尾部各 64KB，检测全程在浏览器本地完成，文件不上传。
      </p>
      <div class="mt-3 flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2.5">
        <ShieldCheck class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p class="text-xs text-primary leading-relaxed">仅读取每个文件的头尾各 64KB 用于签名比对，文件内容不上传、不存储，安全文件也可放心检测。</p>
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：上传与统计 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Upload class="w-5 h-5 mr-2 text-primary" /> 选择文件
          </h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              multiple
              class="hidden"
              @change="handleFileChange"
            />
            <Binary v-if="results.length === 0" class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <FileCheck v-else class="w-8 h-8 mx-auto mb-2 text-primary" />
            <p class="text-sm text-muted-foreground">点击选择或拖入任意文件（可多选）</p>
            <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Info class="w-3 h-3" /> 不限格式，按文件头识别，与扩展名无关
            </p>
          </div>
          <p class="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            支持多选批量检测；超大文件只读取头尾各 64KB，不会整文件载入内存。
          </p>
          <button
            v-if="results.length"
            @click="clearAll"
            class="mt-3 w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <Trash2 class="w-3.5 h-3.5" /> 清空列表
          </button>
        </div>

        <!-- 统计 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 class="w-5 h-5 mr-2 text-primary" /> 检测统计
          </h2>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">文件总数</p>
              <p class="text-xl font-bold text-foreground">{{ results.length }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">伪装（后缀不符）</p>
              <p class="text-xl font-bold" :class="mismatchCount ? 'text-destructive' : 'text-foreground'">{{ mismatchCount }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">成功识别</p>
              <p class="text-xl font-bold text-foreground">{{ detectedCount }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">未识别</p>
              <p class="text-xl font-bold text-foreground">{{ results.length - detectedCount }}</p>
            </div>
          </div>
          <div v-if="mismatchCount" class="mt-3 flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
            <TriangleAlert class="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
            <p class="text-xs text-destructive leading-relaxed">检测到 {{ mismatchCount }} 个文件的扩展名与真实类型不符，请谨慎打开，详情见右侧列表红色警示行。</p>
          </div>
        </div>
      </div>

      <!-- 右侧：结果表格 -->
      <div class="bg-card border border-border rounded-lg">
        <div class="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <ScanSearch class="w-5 h-5 mr-2 text-primary" /> 检测结果
          </h2>
        </div>
        <div class="p-4">
          <!-- 空状态 -->
          <div v-if="results.length === 0" class="py-16 text-center">
            <ScanSearch class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">添加文件后，这里会显示每个文件的真实类型与签名</p>
          </div>

          <!-- 结果表格 -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-left text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">文件名</th>
                  <th class="py-2 pr-3 font-medium whitespace-nowrap">后缀</th>
                  <th class="py-2 pr-3 font-medium whitespace-nowrap">真实类型</th>
                  <th class="py-2 pr-3 font-medium whitespace-nowrap">命中签名</th>
                  <th class="py-2 font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in results"
                  :key="item.id"
                  class="border-b border-border align-top"
                  :class="rowClass(item)"
                >
                  <td class="py-2.5 pr-3 max-w-[180px]">
                    <p class="font-medium text-foreground truncate" :title="item.name">{{ item.name }}</p>
                    <p class="text-[10px] text-muted-foreground mt-0.5">{{ formatBytes(item.size) }}</p>
                  </td>
                  <td class="py-2.5 pr-3 whitespace-nowrap text-muted-foreground font-mono">
                    {{ item.userExt ? '.' + item.userExt : '—' }}
                  </td>
                  <td class="py-2.5 pr-3 whitespace-nowrap">
                    <span v-if="item.match" class="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium bg-primary/10 text-primary">
                      <CheckCircle class="w-3 h-3" /> {{ item.match.name }}
                    </span>
                    <span v-else class="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium bg-muted text-muted-foreground">
                      <HelpCircle class="w-3 h-3" /> 未识别
                    </span>
                  </td>
                  <td class="py-2.5 pr-3 whitespace-nowrap font-mono text-[11px]" :class="item.match ? 'text-foreground' : 'text-muted-foreground'">
                    {{ item.match ? item.match.sig : '—' }}
                  </td>
                  <td class="py-2.5 text-muted-foreground leading-relaxed">
                    <span v-if="item.status === 'mismatch'" class="text-destructive font-medium">
                      伪装警告：后缀 .{{ item.userExt }} 与真实类型 {{ item.match.ext }} 不符
                    </span>
                    <span v-else-if="item.match">{{ item.match.detail }}</span>
                    <span v-else-if="item.status === 'text'">未匹配到魔数，按扩展名推断为纯文本文件（文本文件本身没有文件头签名）</span>
                    <span v-else>无法识别文件类型（未知格式或文件过小）</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于文件类型识别</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            每种二进制格式在文件开头都有约定的「魔数」（Magic Number）——例如 PNG 固定以 89 50 4E 47 0D 0A 1A 0A 开头、PDF 以 %PDF- 开头、
            ZIP 以 PK 开头。扩展名只是文件名里的一段普通文字，改个名就变了；魔数写在文件内容里，改后缀动不了它。
            本工具内置 40+ 种签名（图片、音视频、压缩包、可执行文件、字体、Office/电子书容器等），逐字节比对文件头，
            ZIP 容器还会进一步扫描内部目录，把 .docx / .xlsx / .pptx / .apk / .epub / .jar 区分开。
          </p>

          <h3 class="text-lg font-semibold text-foreground">为什么改后缀骗不过文件头？</h3>
          <p>
            操作系统只靠扩展名决定「双击用什么程序打开」，它不会去读文件内容；因此把 virus.exe 改名成 photo.jpg，
            资源管理器会显示成图片图标，用户容易放松警惕。但文件真正的格式写在头部字节里：一张真 JPG 必然以 FF D8 FF 开头，
            一个改名的 EXE 头部仍是 4D 5A。杀毒软件、浏览器下载保护、防火墙网关做的正是同一件事——读文件头判断真实类型。
            收到「图片」却检测出可执行文件头（MZ / ELF）时，几乎可以肯定被伪装了，切勿打开。
          </p>

          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>下载或接收的文件打不开：先看真实类型，判断是后缀错了还是文件损坏</li>
            <li>安全检查：识别「图片 / 文档」伪装的可执行文件、脚本与压缩包</li>
            <li>无后缀文件、恢复出来的数据文件、聊天工具改名的文件判断真实格式</li>
            <li>确认压缩包内是 OOXML 文档（docx/xlsx/pptx）还是普通 zip</li>
          </ul>

          <h3 class="text-lg font-semibold text-foreground">检测的准确边界</h3>
          <p>
            魔数比对对常规文件非常可靠，但有三类边界情况：一是多格式复合文件（polyglot）可以同时满足两种签名；
            二是 MP4 家族依赖 ftyp box 的 brand 列表，冷门 brand 可能识别不出（会归为未识别而非误报）；
            三是纯文本文件（.txt / .csv / .json）本身没有文件头，只能嗅探 SVG / HTML / XML 标记，其余按扩展名推断并如实标注。
            检测不出时工具显示「未识别」，不会强行猜一个类型。
          </p>

          <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
          <div class="space-y-4">
            <div>
              <h3 class="text-base font-semibold text-foreground">为什么改了后缀还是被认出来了？</h3>
              <p class="text-sm text-muted-foreground mt-1">扩展名只是文件名的一部分，真正的格式标识写在文件头部字节（魔数）里。工具读取头部与签名表逐字节比对，与文件名无关，所以改后缀骗不过它。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">文件会上传吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">不会。只把每个文件的头尾各 64KB 读进浏览器内存做签名比对，检测在本地完成，内容不上传、不存储。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">能识别哪些格式？</h3>
              <p class="text-sm text-muted-foreground mt-1">40+ 种：PNG/JPEG/GIF/BMP/WebP/ICO/TIFF/HEIC/AVIF/PSD，MP4/MOV/M4A/MP3/AAC/WAV/FLAC/OGG/MKV，ZIP/7Z/RAR/GZIP/BZIP2/XZ/ZSTD/TAR，EXE/ELF/Mach-O/WASM，PDF/DOCX/XLSX/PPTX/APK/EPUB/JAR，SQLite/字体等。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">我的 .txt 显示未识别，是坏了吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">不是。纯文本文件没有文件头魔数，工具只对 SVG/HTML/XML 做标记嗅探，普通文本如实显示「按扩展名推断」，属于正常现象。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">红色警示行代表什么？</h3>
              <p class="text-sm text-muted-foreground mt-1">表示文件扩展名与其头部魔数指向的真实类型不一致，即「伪装文件」。例如后缀 .jpg 实际是 EXE。对来源不明的伪装文件请勿直接打开。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'file-type-detector'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Binary, Upload, FileCheck, Trash2, Info, ShieldCheck, BarChart3, ScanSearch,
  CheckCircle, HelpCircle, TriangleAlert, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '文件类型识别 - 文件头魔数检测真实格式工具',
  description: '在线文件类型识别工具，通过文件头魔数（magic number）检测文件真实格式，识破改后缀伪装的exe/脚本，支持PNG/JPEG/MP4/ZIP/DOCX/APK等40+种签名，批量检测纯本地不上传',
  keywords: '文件类型识别,魔数识别,magic number,文件真实格式,改后缀识别,文件头检测,文件伪装检测,后缀不符检测',
  author: '有条工具',
  ogTitle: '文件类型识别 - 有条工具',
  ogDescription: '文件头魔数识别真实格式，识破改后缀伪装，40+ 种签名纯本地检测，文件不上传',
  ogUrl: 'https://www.util.cn/tools/file-type-detector',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据（SoftwareApplication + BreadcrumbList + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '文件类型识别',
          url: 'https://www.util.cn/tools/file-type-detector',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['40+ 种文件头魔数签名比对', 'ZIP 容器细分 DOCX/XLSX/PPTX/APK/EPUB/JAR', 'SVG/HTML/XML 文本嗅探', '扩展名与真实类型不一致红色警示', '大文件仅读取头尾各 64KB', '纯本地检测不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '文件类型识别', item: 'https://www.util.cn/tools/file-type-detector/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么改了后缀还是被认出来了？',
              acceptedAnswer: { '@type': 'Answer', text: '扩展名只是文件名的一部分，真正的格式标识写在文件头部字节（魔数）里。工具读取头部与签名表逐字节比对，与文件名无关，所以改后缀骗不过它。' }
            },
            {
              '@type': 'Question',
              name: '文件会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。只把每个文件的头尾各 64KB 读进浏览器内存做签名比对，检测在本地完成，内容不上传、不存储。' }
            },
            {
              '@type': 'Question',
              name: '能识别哪些格式？',
              acceptedAnswer: { '@type': 'Answer', text: '40+ 种：PNG/JPEG/GIF/BMP/WebP/ICO/TIFF/HEIC/AVIF/PSD，MP4/MOV/M4A/MP3/AAC/WAV/FLAC/OGG/MKV，ZIP/7Z/RAR/GZIP/BZIP2/XZ/ZSTD/TAR，EXE/ELF/Mach-O/WASM，PDF/DOCX/XLSX/PPTX/APK/EPUB/JAR，SQLite/字体等。' }
            },
            {
              '@type': 'Question',
              name: '我的 .txt 显示未识别，是坏了吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。纯文本文件没有文件头魔数，工具只对 SVG/HTML/XML 做标记嗅探，普通文本如实显示「按扩展名推断」，属于正常现象。' }
            },
            {
              '@type': 'Question',
              name: '红色警示行代表什么？',
              acceptedAnswer: { '@type': 'Answer', text: '表示文件扩展名与其头部魔数指向的真实类型不一致，即「伪装文件」。例如后缀 .jpg 实际是 EXE。对来源不明的伪装文件请勿直接打开。' }
            }
          ]
        }
      ]
    })
  }]
})

// ================== 纯匹配逻辑（SENTINEL: FILETYPE_PURE_BEGIN） ==================
// 说明：本区块不依赖 Vue 与任何浏览器 API，可被 node 脚本整段提取后独立单测。
// 签名逐条与 Wikipedia《List of file signatures》核对（2026-11 版）；
// 与常见口口相传版本的差异：PDF 含结尾 '-'（%PDF-）、TAR 是偏移 257 处的 ustar、
// BZIP2 第三字节是压缩级别数字、msf1 是 HEIF 序列 brand 而非 MP4。
// 注意：本工具只做「识别」不做「解析」，命中即返回，误报风险已通过更严格的签名控制。

// ASCII 字节串在 bytes[from, to) 内首次出现的位置（朴素匹配）
function findAsciiIn(bytes, str, from, to) {
  const end = Math.min(to == null ? bytes.length : to, bytes.length)
  const start = from == null ? 0 : from
  const n = str.length
  if (n === 0 || start >= end) return -1
  const first = str.charCodeAt(0)
  outer: for (let i = start; i <= end - n; i++) {
    if (bytes[i] !== first) continue
    for (let j = 1; j < n; j++) {
      if (bytes[i + j] !== str.charCodeAt(j)) continue outer
    }
    return i
  }
  return -1
}

// 读取 bytes[offset, offset+len) 的 ASCII 表示（不可打印字符以 . 代替）
function readAscii(bytes, offset, len) {
  let s = ''
  const end = Math.min(offset + len, bytes.length)
  for (let i = offset; i < end; i++) {
    const b = bytes[i]
    s += b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.'
  }
  return s
}

function bytesToHex(bytes, n) {
  const parts = []
  const end = Math.min(n == null ? bytes.length : n, bytes.length)
  for (let i = 0; i < end; i++) {
    parts.push(bytes[i].toString(16).toUpperCase().padStart(2, '0'))
  }
  return parts.join(' ')
}

function startsWithAscii(bytes, str, offset) {
  const off = offset || 0
  if (bytes.length < off + str.length) return false
  for (let i = 0; i < str.length; i++) {
    if (bytes[off + i] !== str.charCodeAt(i)) return false
  }
  return true
}

function eqBytes(bytes, arr, offset) {
  const off = offset || 0
  if (bytes.length < off + arr.length) return false
  for (let i = 0; i < arr.length; i++) {
    if (bytes[off + i] !== arr[i]) return false
  }
  return true
}

function makeType(typeId, name, mime, ext, exts, sig, detail) {
  return { typeId, name, mime, ext, exts, sig, detail }
}

// ---------- 静态魔数表（无偏移、无通配的精确前缀签名） ----------
// 格式：[魔数字节, typeId, 名称, 主扩展名, MIME, 可接受扩展名列表, 说明]
const STATIC_MAGICS = [
  [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'png', 'PNG 图片', 'png', 'image/png', ['png'], 'PNG 文件头'],
  [[0xff, 0xd8, 0xff], 'jpeg', 'JPEG 图片', 'jpg', 'image/jpeg', ['jpg', 'jpeg', 'jpe', 'jfif'], 'JPEG/JFIF/Exif 文件头 (FF D8 FF)'],
  ['GIF87a', 'gif', 'GIF 图片', 'gif', 'image/gif', ['gif'], 'GIF 87a 版本头'],
  ['GIF89a', 'gif', 'GIF 图片', 'gif', 'image/gif', ['gif'], 'GIF 89a 版本头'],
  ['BM', 'bmp', 'BMP 位图', 'bmp', 'image/bmp', ['bmp', 'dib'], 'BMP/DIB 文件头 (BM，第 3 字节起为文件长度)'],
  [[0x00, 0x00, 0x01, 0x00], 'ico', 'ICO 图标', 'ico', 'image/x-icon', ['ico'], 'ICO 图标文件头'],
  [[0x00, 0x00, 0x02, 0x00], 'cur', 'CUR 光标', 'cur', 'image/x-icon', ['cur'], 'CUR 光标文件头'],
  [[0x49, 0x49, 0x2a, 0x00], 'tiff', 'TIFF 图片', 'tif', 'image/tiff', ['tif', 'tiff'], 'TIFF 小端 (II)'],
  [[0x4d, 0x4d, 0x00, 0x2a], 'tiff', 'TIFF 图片', 'tif', 'image/tiff', ['tif', 'tiff'], 'TIFF 大端 (MM)'],
  [[0x49, 0x49, 0x2b, 0x00], 'tiff', 'TIFF 图片', 'tif', 'image/tiff', ['tif', 'tiff'], 'BigTIFF 小端 (II+)'],
  [[0x4d, 0x4d, 0x00, 0x2b], 'tiff', 'TIFF 图片', 'tif', 'image/tiff', ['tif', 'tiff'], 'BigTIFF 大端 (MM+)'],
  ['8BPS', 'psd', 'PSD 源文件', 'psd', 'image/vnd.adobe.photoshop', ['psd'], 'Photoshop 文件头 (8BPS)'],
  ['%PDF-', 'pdf', 'PDF 文档', 'pdf', 'application/pdf', ['pdf'], 'PDF 文件头 (%PDF-)'],
  ['fLaC', 'flac', 'FLAC 音频', 'flac', 'audio/flac', ['flac'], 'FLAC 流标志 (fLaC)'],
  ['OggS', 'ogg', 'OGG 容器', 'ogg', 'audio/ogg', ['ogg', 'oga', 'ogv', 'opus'], 'Ogg 封装页头 (OggS)'],
  [[0x1a, 0x45, 0xdf, 0xa3], 'matroska', 'MKV/WebM 容器', 'mkv', 'video/x-matroska', ['mkv', 'webm', 'mka', 'mks'], 'Matroska/EBML 文件头'],
  [[0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c], '7z', '7Z 压缩包', '7z', 'application/x-7z-compressed', ['7z'], '7-Zip 文件头'],
  ['Rar!\x1a\x07\x00', 'rar', 'RAR 压缩包', 'rar', 'application/x-rar-compressed', ['rar'], 'RAR 4.x 文件头'],
  ['Rar!\x1a\x07\x01\x00', 'rar', 'RAR 压缩包', 'rar', 'application/x-rar-compressed', ['rar'], 'RAR 5.x 文件头'],
  [[0x1f, 0x8b], 'gzip', 'GZIP 压缩', 'gz', 'application/gzip', ['gz', 'gzip', 'tgz'], 'GZIP 文件头 (1F 8B)'],
  ['\xfd\x37zXZ\x00', 'xz', 'XZ 压缩', 'xz', 'application/x-xz', ['xz', 'txz'], 'XZ/LZMA2 文件头 (FD 37 7A 58 5A 00)'],
  [[0x28, 0xb5, 0x2f, 0xfd], 'zstd', 'ZSTD 压缩', 'zst', 'application/zstd', ['zst', 'zstd'], 'Zstandard 帧魔数'],
  ['MZ', 'exe', 'EXE 可执行文件', 'exe', 'application/vnd.microsoft.portable-executable', ['exe', 'dll', 'sys', 'scr', 'cpl', 'ocx', 'efi'], 'DOS MZ 头（PE/NE 可执行文件）'],
  [[0x7f, 0x45, 0x4c, 0x46], 'elf', 'ELF 可执行文件', 'elf', 'application/x-elf', ['elf', 'so', 'o', 'axf', 'ko'], 'ELF 文件头（Linux/Unix 可执行）'],
  ['SQLite format 3\x00', 'sqlite', 'SQLite 数据库', 'sqlite', 'application/vnd.sqlite3', ['sqlite', 'sqlite3', 'db'], 'SQLite 3 数据库文件头'],
  [[0x00, 0x61, 0x73, 0x6d], 'wasm', 'WebAssembly', 'wasm', 'application/wasm', ['wasm'], 'WASM 二进制模块头'],
  [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], 'ole', 'OLE2 复合文档', 'doc', 'application/x-ole-storage', ['doc', 'xls', 'ppt', 'msi', 'msg'], 'OLE2 复合文档（老版 Office/MSI）'],
  [[0x00, 0x01, 0x00, 0x00], 'ttf', 'TTF 字体', 'ttf', 'font/ttf', ['ttf', 'tte', 'dfont'], 'TrueType 字体头'],
  ['OTTO', 'otf', 'OTF 字体', 'otf', 'font/otf', ['otf'], 'OpenType (CFF) 字体头'],
  ['wOFF', 'woff', 'WOFF 字体', 'woff', 'font/woff', ['woff'], 'WOFF 1.0 字体头'],
  ['wOF2', 'woff2', 'WOFF2 字体', 'woff2', 'font/woff2', ['woff2'], 'WOFF 2.0 字体头'],
  ['%!PS', 'ps', 'PostScript', 'ps', 'application/postscript', ['ps', 'eps'], 'PostScript 文件头 (%!PS)']
]

// ---------- ZIP 家族（PK 头 + 内容特征细分） ----------
// 容器族：后缀与真实类型互认（.zip 命中 docx 不算伪装，反之亦然）
const ZIP_FAMILY_IDS = ['zip', 'docx', 'xlsx', 'pptx', 'apk', 'epub', 'jar']

// 细分标记：按优先级排列（APK 必须先于 JAR——APK 签名目录也含 META-INF）
const ZIP_MARKERS = [
  ['AndroidManifest.xml', 'apk', 'APK 安卓安装包', 'apk', 'application/vnd.android.package-archive', 'ZIP 容器，内含 AndroidManifest.xml'],
  ['application/epub+zip', 'epub', 'EPUB 电子书', 'epub', 'application/epub+zip', 'ZIP 容器，mimetype 内容为 application/epub+zip'],
  ['word/', 'docx', 'Word 文档', 'docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'ZIP 容器，内含 word/ 目录（OOXML Word）'],
  ['xl/', 'xlsx', 'Excel 表格', 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'ZIP 容器，内含 xl/ 目录（OOXML Excel）'],
  ['ppt/', 'pptx', 'PowerPoint 演示', 'pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'ZIP 容器，内含 ppt/ 目录（OOXML PowerPoint）'],
  ['META-INF/MANIFEST.MF', 'jar', 'JAR 归档', 'jar', 'application/java-archive', 'ZIP 容器，内含 META-INF/MANIFEST.MF（Java 归档）']
]

// 在「头部 64KB + 尾部 64KB」两窗口内搜索标记（中央目录位于文件尾部）
function matchZipFamily(head, tail) {
  if (head.length < 4 || head[0] !== 0x50 || head[1] !== 0x4b) return null
  const b2 = head[2]
  const b3 = head[3]
  if (b2 === 0x05 && b3 === 0x06) {
    return makeType('zip', 'ZIP 归档（空）', 'application/zip', 'zip', ['zip'], '50 4B 05 06', 'ZIP 结束记录，空归档')
  }
  if (b2 === 0x07 && b3 === 0x08) {
    return makeType('zip', 'ZIP 分卷归档', 'application/zip', 'zip', ['zip'], '50 4B 07 08', 'ZIP 跨盘/分卷标记')
  }
  if (!(b2 === 0x03 && b3 === 0x04)) {
    return makeType('zip', 'ZIP 归档', 'application/zip', 'zip', ['zip'], bytesToHex(head, 4), 'ZIP 本地头（变体 50 4B ' + bytesToHex(head.subarray(2, 4), 2).toLowerCase() + '）')
  }
  const headEnd = Math.min(head.length, 65536)
  const tailStart = tail.length > 65536 ? tail.length - 65536 : 0
  for (let i = 0; i < ZIP_MARKERS.length; i++) {
    const mk = ZIP_MARKERS[i]
    const hitHead = findAsciiIn(head, mk[0], 0, headEnd) !== -1
    const hitTail = findAsciiIn(tail, mk[0], tailStart, tail.length) !== -1
    if (hitHead || hitTail) {
      // mk: [标记串, typeId, 名称, 主扩展名, MIME, 说明]
      return makeType(mk[1], mk[2], mk[4], mk[3], [mk[3]], '50 4B 03 04 + ' + mk[0], mk[5])
    }
  }
  return makeType('zip', 'ZIP 压缩包', 'application/zip', 'zip', ['zip'], '50 4B 03 04', 'ZIP 本地文件头（未扫到已知容器特征，按通用 ZIP 报告）')
}

// ---------- RIFF 容器（RIFF????XXXX：WEBP/WAVE/AVI ） ----------
function matchRiff(head) {
  if (head.length < 12 || !startsWithAscii(head, 'RIFF')) return null
  const form = readAscii(head, 8, 4)
  if (form === 'WEBP') return makeType('webp', 'WebP 图片', 'image/webp', 'webp', ['webp'], 'RIFF????WEBP', 'RIFF 容器，格式 WEBP')
  if (form === 'WAVE') return makeType('wav', 'WAV 音频', 'audio/wav', 'wav', ['wav'], 'RIFF????WAVE', 'RIFF 容器，格式 WAVE')
  if (form === 'AVI ') return makeType('avi', 'AVI 视频', 'video/x-msvideo', 'avi', ['avi'], 'RIFF????AVI ', 'RIFF 容器，格式 AVI')
  return null
}

// ---------- ISO-BMFF（ftyp box：HEIC/AVIF/MP4/MOV/M4A） ----------
// brand → 类型：brand 字段固定 4 字节（不足以空格补齐），区分大小写
const FTYP_HEIC = ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heim', 'heis', 'hevm', 'hevs']
const FTYP_AVIF = ['avif', 'avis']
const FTYP_MP4 = ['isom', 'iso2', 'iso3', 'iso4', 'iso5', 'iso6', 'mp41', 'mp42', 'dash', 'avc1', 'MSNV', 'ndas', 'mmp4', 'face', 'f4v ', 'm4v ', 'isml', 'bbef']
const FTYP_MOV = ['qt  ']
const FTYP_M4A = ['M4A ', 'M4B ', 'M4P ']

function matchIsoBmff(head) {
  if (head.length < 12 || !startsWithAscii(head, 'ftyp', 4)) return null
  const brand = readAscii(head, 8, 4)
  const sig = 'ftyp' + brand.trim() + ' (brand)'
  if (FTYP_HEIC.indexOf(brand) !== -1) {
    return makeType('heic', 'HEIC/HEIF 图片', 'image/heic', 'heic', ['heic', 'heif'], sig, 'ISO-BMFF 容器，HEIF 品牌 ' + brand.trim())
  }
  if (FTYP_AVIF.indexOf(brand) !== -1) {
    return makeType('avif', 'AVIF 图片', 'image/avif', 'avif', ['avif'], sig, 'ISO-BMFF 容器，AV1 图像品牌 ' + brand.trim())
  }
  if (FTYP_MP4.indexOf(brand) !== -1) {
    return makeType('mp4', 'MP4 视频', 'video/mp4', 'mp4', ['mp4', 'm4v'], sig, 'ISO-BMFF 容器，MPEG-4 品牌 ' + brand.trim())
  }
  if (FTYP_MOV.indexOf(brand) !== -1) {
    return makeType('mov', 'MOV 视频', 'video/quicktime', 'mov', ['mov', 'qt'], sig, 'ISO-BMFF 容器，QuickTime 品牌 qt')
  }
  if (FTYP_M4A.indexOf(brand) !== -1) {
    return makeType('m4a', 'M4A 音频', 'audio/x-m4a', 'm4a', ['m4a', 'm4b', 'm4p'], sig, 'ISO-BMFF 容器，iTunes 音频品牌 ' + brand.trim())
  }
  return null // 冷门 brand（3gp 等）如实报未识别，不强行归类
}

// ---------- Mach-O / Java Class（CA FE BA BE 两族共用，按版本字段启发式区分） ----------
function matchMachO(head) {
  if (head.length < 4) return null
  if (eqBytes(head, [0xfe, 0xed, 0xfa, 0xce])) return makeType('macho', 'Mach-O 可执行文件', 'application/x-mach-binary', 'dylib', ['dylib', 'o'], 'FE ED FA CE', 'Mach-O 32 位（大端）')
  if (eqBytes(head, [0xfe, 0xed, 0xfa, 0xcf])) return makeType('macho', 'Mach-O 可执行文件', 'application/x-mach-binary', 'dylib', ['dylib', 'o'], 'FE ED FA CF', 'Mach-O 64 位（大端）')
  if (eqBytes(head, [0xce, 0xfa, 0xed, 0xfe])) return makeType('macho', 'Mach-O 可执行文件', 'application/x-mach-binary', 'dylib', ['dylib', 'o'], 'CE FA ED FE', 'Mach-O 32 位（小端）')
  if (eqBytes(head, [0xcf, 0xfa, 0xed, 0xfe])) return makeType('macho', 'Mach-O 可执行文件', 'application/x-mach-binary', 'dylib', ['dylib', 'o'], 'CF FA ED FE', 'Mach-O 64 位（小端）')
  if (eqBytes(head, [0xca, 0xfe, 0xba, 0xbe]) && head.length >= 8) {
    // 同一魔数既是 Java Class 也是 Mach-O Universal（Wikipedia 两者并列）：
    // Java class 第 4-7 字节为 minor(通常 0) + major(45 起)；Mach-O fat 为架构数（很小）。
    const major = head[6] * 256 + head[7]
    const minor = head[4] * 256 + head[5]
    if (minor === 0 && major >= 45 && major <= 99) {
      return makeType('class', 'Java Class 文件', 'application/java-vm', 'class', ['class'], 'CA FE BA BE', 'Java 类文件（major version ' + major + '）')
    }
    return makeType('macho', 'Mach-O 通用二进制', 'application/x-mach-binary', 'dylib', ['dylib'], 'CA FE BA BE', 'Mach-O Fat Binary（多架构）')
  }
  return null
}

// ---------- MPEG 音频帧同步（MP3 / AAC ADTS） ----------
function matchMpegAudio(head) {
  if (head.length < 2) return null
  if (startsWithAscii(head, 'ID3')) {
    return makeType('mp3', 'MP3 音频', 'audio/mpeg', 'mp3', ['mp3'], '49 44 33 (ID3)', 'ID3v2 标签头')
  }
  const b0 = head[0]
  const b1 = head[1]
  if (b0 !== 0xff || (b1 & 0xe0) !== 0xe0) return null
  // 11 位帧同步 FF Ex；layer 位 (b1>>1)&3 为 0 时是 AAC ADTS（FF F1/FF F9）而非 MPEG 层
  if (((b1 >> 1) & 0x03) === 0) {
    return makeType('aac', 'AAC 音频', 'audio/aac', 'aac', ['aac', 'm4b'], 'FF ' + b1.toString(16).toUpperCase().padStart(2, '0'), 'ADTS 帧同步（AAC 裸流）')
  }
  return makeType('mp3', 'MP3 音频', 'audio/mpeg', 'mp3', ['mp3'], 'FF ' + b1.toString(16).toUpperCase().padStart(2, '0'), 'MPEG 音频帧同步 (FF Ex)')
}

// ---------- TAR（偏移 257 处 ustar，POSIX/GNU 两种变体） ----------
function matchTar(head) {
  if (head.length < 262) return null
  if (startsWithAscii(head, 'ustar', 257)) {
    return makeType('tar', 'TAR 归档', 'application/x-tar', 'tar', ['tar'], '75 73 74 61 72 @257 (ustar)', 'ustar 魔数位于偏移 257')
  }
  return null
}

// ---------- 静态表匹配（含 BZIP2 的级别数字校验） ----------
function matchStaticMagics(head) {
  for (let i = 0; i < STATIC_MAGICS.length; i++) {
    const e = STATIC_MAGICS[i]
    const magic = e[0]
    if (typeof magic === 'string') {
      if (!startsWithAscii(head, magic)) continue
    } else if (!eqBytes(head, magic)) {
      continue
    }
    const sig = typeof magic === 'string' ? asciiToHex(magic) : bytesToHexFrom(magic)
    return makeType(e[1], e[2], e[3], e[4], e[5], sig, e[6])
  }
  return null
}

// BZIP2 单独静态项（放在 STATIC_MAGICS 之外逐条声明会打断表结构，这里独立校验）
function matchBzip2(head) {
  if (startsWithAscii(head, 'BZh') && head.length >= 4 && head[3] >= 0x31 && head[3] <= 0x39) {
    return makeType('bzip2', 'BZIP2 压缩', 'application/x-bzip2', 'bz2', ['bz2'], '42 5A 68 (BZh+级别)', 'BZIP2 文件头，压缩级别 ' + String.fromCharCode(head[3]))
  }
  return null
}

function asciiToHex(str) {
  const parts = []
  for (let i = 0; i < str.length; i++) {
    parts.push(str.charCodeAt(i).toString(16).toUpperCase().padStart(2, '0'))
  }
  return parts.join(' ')
}

function bytesToHexFrom(arr) {
  const parts = []
  for (let i = 0; i < arr.length; i++) {
    parts.push(arr[i].toString(16).toUpperCase().padStart(2, '0'))
  }
  return parts.join(' ')
}

// ---------- 文本嗅探（SVG / HTML / XML） ----------
// 条件：首 1KB 无 NUL、合法 UTF-8、去 BOM 与空白后以 '<' 开头
function sniffTextType(head) {
  const n = Math.min(head.length, 1024)
  if (!n) return null
  for (let i = 0; i < n; i++) {
    if (head[i] === 0) return null
  }
  let text = ''
  try {
    if (typeof TextDecoder === 'undefined') return null
    text = new TextDecoder('utf-8', { fatal: true }).decode(head.subarray(0, n))
  } catch (e) {
    return null
  }
  const t = text.replace(/^\uFEFF/, '').replace(/^\s+/, '').toLowerCase()
  if (t.charAt(0) !== '<') return null
  if (t.indexOf('<!doctype html') !== -1 || t.indexOf('<html') !== -1) {
    return makeType('html', 'HTML 文档', 'text/html', 'html', ['html', 'htm', 'xhtml'], '3C 21 44 4F 43... (<html/<!DOCTYPE html)', '文本嗅探：HTML 标记')
  }
  if (t.indexOf('<svg') !== -1) {
    return makeType('svg', 'SVG 矢量图', 'image/svg+xml', 'svg', ['svg'], '3C 73 76 67 (<svg)', '文本嗅探：SVG 根元素')
  }
  if (t.indexOf('<?xml') === 0) {
    return makeType('xml', 'XML 文档', 'application/xml', 'xml', ['xml'], '3C 3F 78 6D 6C (<?xml)', '文本嗅探：XML 声明')
  }
  return null
}

// ---------- 主入口 ----------
// matchFileType(bytes[, tailBytes]) → { typeId, name, mime, ext, exts, sig, detail } | null
// bytes：文件头部（≥64KB）；tailBytes：文件尾部 64KB（ZIP 中央目录搜索用，小文件可省略）
function matchFileType(bytes, tailBytes) {
  const head = bytes instanceof Uint8Array ? bytes : null
  if (!head || head.length === 0) return null
  const tail = tailBytes instanceof Uint8Array ? tailBytes : head
  const result = matchZipFamily(head, tail)
    || matchBzip2(head)
    || matchStaticMagics(head)
    || matchRiff(head)
    || matchIsoBmff(head)
    || matchMachO(head)
    || matchMpegAudio(head)
    || matchTar(head)
    || sniffTextType(head)
  return result || null
}

// ---------- 扩展名一致性检查 ----------
// 返回 { userExt, status }：status ∈ match | mismatch | no-ext | unverified
const TEXT_LIKE_EXTS = ['txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'log', 'ini', 'cfg', 'conf', 'yaml', 'yml', 'toml', 'js', 'ts', 'css', 'scss', 'py', 'rb', 'go', 'rs', 'php', 'sh', 'bat', 'ps1', 'sql', 'c', 'h', 'cpp', 'hpp', 'java', 'kt', 'swift', 'vue', 'jsx', 'tsx']

function extOf(fileName) {
  const name = String(fileName || '')
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return ''
  return name.slice(dot + 1).toLowerCase()
}

function extMatchesType(fileName, match) {
  const userExt = extOf(fileName)
  if (!match) {
    // 未识别：常见文本扩展名按「文本推断」归为中性，其余记为 unverified
    return { userExt, status: userExt && TEXT_LIKE_EXTS.indexOf(userExt) !== -1 ? 'text' : 'unverified' }
  }
  if (!userExt) return { userExt, status: 'no-ext' }
  const exts = ((match.exts && match.exts.length ? match.exts : [match.ext]) || []).map((e) => String(e).toLowerCase())
  if (exts.indexOf(userExt) !== -1) return { userExt, status: 'match' }
  // ZIP 容器族互认：.zip 命中 docx / apk 等只算容器匹配，不算伪装
  if (ZIP_FAMILY_IDS.indexOf(userExt) !== -1 && ZIP_FAMILY_IDS.indexOf(match.typeId) !== -1) {
    return { userExt, status: 'match' }
  }
  return { userExt, status: 'mismatch' }
}
// ================== 纯匹配逻辑（SENTINEL: FILETYPE_PURE_END） ====================

// ---------- 状态 ----------
const fileInput = ref(null)
const isDragging = ref(false)
const results = ref([]) // { id, name, size, userExt, match|null, status }
let fileSeq = 0

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 派生数据 ----------
const mismatchCount = computed(() => results.value.filter((r) => r.status === 'mismatch').length)
const detectedCount = computed(() => results.value.filter((r) => r.match).length)

const formatBytes = (n) => {
  if (!n || n <= 0) return '0 B'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(2) + ' MB'
}

const rowClass = (item) => {
  if (item.status === 'mismatch') return 'bg-destructive/5'
  return ''
}

// ---------- 文件读取与检测 ----------
const detectOne = async (file) => {
  // 大文件只读取头尾各 64KB：头部覆盖全部固定魔数 / ftyp / ustar@257，尾部覆盖 ZIP 中央目录
  const WINDOW = 64 * 1024
  const headBuf = await file.slice(0, WINDOW).arrayBuffer()
  const head = new Uint8Array(headBuf)
  let tail = head
  if (file.size > WINDOW * 2) {
    const tailBuf = await file.slice(file.size - WINDOW).arrayBuffer()
    tail = new Uint8Array(tailBuf)
  } else if (file.size > WINDOW) {
    const tailBuf = await file.slice(WINDOW).arrayBuffer() // 头尾有重叠，覆盖全文件
    tail = new Uint8Array(tailBuf)
  }
  const match = matchFileType(head, tail)
  const check = extMatchesType(file.name, match)
  return {
    id: ++fileSeq,
    name: file.name,
    size: file.size,
    userExt: check.userExt,
    match,
    status: check.status
  }
}

const addFiles = async (fileList) => {
  const list = Array.from(fileList || [])
  for (const file of list) {
    try {
      results.value.push(await detectOne(file))
    } catch (e) {
      // 单个文件读取失败不影响其他文件，记为未识别
      results.value.push({
        id: ++fileSeq,
        name: file.name,
        size: file.size || 0,
        userExt: extOf(file.name),
        match: null,
        status: 'unverified'
      })
    }
  }
}

const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const handleFileChange = (e) => {
  addFiles(e.target.files)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer && e.dataTransfer.files
  addFiles(files)
}

const clearAll = () => {
  results.value = []
}

onMounted(() => {
  addRecentTool('file-type-detector')
})
</script>
