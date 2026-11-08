<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Files class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">重复文件查找</h1>
          <p class="text-sm text-muted-foreground mt-1">按内容哈希找出重复文件分组展示，清理重复照片与文档，全程本地不传云</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线重复文件查找工具：选择多个文件或整个文件夹后，在浏览器内按「字节大小 → 首尾 64KB 快哈希 → 全量 SHA-256」三级流水线比对，
        只对字节数相同的文件算哈希、大文件只读头尾，快速找出内容完全相同的重复文件并分组展示，标记「建议保留最新一份」，
        支持导出清理清单。哈希与比对全部在你的设备上完成，文件不会上传任何服务器。
      </p>
      <div class="mt-3 flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2.5">
        <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p class="text-xs text-primary leading-relaxed">所有文件只在浏览器内读取与计算哈希，内容不上传、不联网比对；照片、合同、私密文档可放心处理。</p>
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：文件选择与扫描 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4 flex items-center">
          <FolderOpen class="w-5 h-5 mr-2 text-primary" /> 选择文件或文件夹
        </h2>
        <div
          class="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
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
          <input
            ref="folderInput"
            type="file"
            multiple
            webkitdirectory
            class="hidden"
            @change="handleFileChange"
          />
          <Files v-if="entries.length === 0" class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <FileCheck v-else class="w-8 h-8 mx-auto mb-2 text-primary" />
          <p class="text-sm text-muted-foreground">点击选择多个文件，或拖入文件</p>
          <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Info class="w-3 h-3" /> 纯本地读取哈希，文件不上传
          </p>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-2">
          <button
            @click="triggerFileSelect"
            class="px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <Files class="w-3.5 h-3.5" /> 选择文件（可多选）
          </button>
          <button
            @click="triggerFolderSelect"
            class="px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <FolderOpen class="w-3.5 h-3.5" /> 选择整个文件夹
          </button>
        </div>
        <p class="text-[11px] text-muted-foreground mt-2 flex items-start gap-1">
          <Info class="w-3 h-3 mt-0.5 flex-shrink-0" />
          文件夹模式基于浏览器 webkitdirectory 属性，Chrome / Edge / Safari 与新版 Firefox 支持；个别浏览器不支持时会退化为普通文件选择，拖放仅支持文件。
        </p>

        <!-- 已选文件列表 -->
        <div v-if="entries.length > 0" class="mt-3">
          <div class="flex items-center justify-between mb-1.5">
            <p class="text-xs font-medium text-foreground">已选 {{ entries.length }} 个文件 · 共 {{ formatBytes(totalBytes) }}</p>
            <button @click="clearEntries" class="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Trash2 class="w-3 h-3" /> 清空
            </button>
          </div>
          <div class="border border-border rounded-lg max-h-52 overflow-y-auto divide-y divide-border">
            <div v-for="entry in displayEntries" :key="entry.id" class="flex items-center gap-2 px-3 py-1.5">
              <div class="flex-1 min-w-0">
                <p class="text-xs text-foreground truncate" :title="entry.path">{{ entry.path }}</p>
              </div>
              <span class="text-[10px] text-muted-foreground flex-shrink-0">{{ formatBytes(entry.size) }}</span>
              <button
                @click="removeEntry(entry.id)"
                class="text-muted-foreground hover:text-destructive flex-shrink-0"
                :aria-label="'移除 ' + entry.path"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
            <div v-if="entries.length > displayEntries.length" class="px-3 py-1.5 text-[11px] text-muted-foreground text-center">
              还有 {{ entries.length - displayEntries.length }} 个文件未列出（全部参与扫描）
            </div>
          </div>
        </div>

        <!-- 扫描选项 -->
        <label class="mt-3 flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
          <input type="checkbox" v-model="skipEmpty" class="accent-primary" />
          跳过 0 字节空文件（空文件按内容彼此相同，建议跳过）
        </label>

        <button
          @click="startScan"
          :disabled="entries.length === 0 || scanning"
          class="mt-3 w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          <Loader2 v-if="scanning" class="w-4 h-4 animate-spin" />
          <Search v-else class="w-4 h-4" />
          {{ scanning ? '正在扫描…' : `开始扫描（${entries.length} 个文件）` }}
        </button>

        <!-- 进度条 -->
        <div v-if="scanning" class="mt-3">
          <div class="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
            <span>{{ progressPhaseLabel }}</span>
            <span>已处理 {{ progress.done }}/{{ progress.total }} 个</span>
          </div>
          <div class="h-2 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full bg-primary rounded-full transition-all duration-200"
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>
        </div>

        <!-- 流水线说明 -->
        <div class="mt-4 bg-muted/40 border border-border rounded-lg p-3">
          <h3 class="text-xs font-semibold text-foreground mb-1.5 flex items-center">
            <Settings2 class="w-3.5 h-3.5 mr-1 text-primary" /> 三级比对流水线（省内存省时间）
          </h3>
          <ul class="text-[11px] text-muted-foreground space-y-1 leading-relaxed">
            <li>• 第一级：按字节大小分组——大小不同不可能重复，直接排除</li>
            <li>• 第二级：同大小组内只读首 64KB + 尾 64KB 算 SHA-256 快哈希，大文件不用整读</li>
            <li>• 第三级：快哈希仍相同的组才做全量 SHA-256 确认；超过 100MB 的文件跳过全量，按快哈希+大小标记「疑似重复（未全量校验）」</li>
            <li>• 组内按修改时间标记「建议保留最新一份」，可导出清理清单</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：扫描结果 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 扫描结果
          </h2>
          <button
            v-if="result && result.groups.length > 0"
            @click="exportReport"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition-colors"
          >
            <Download class="w-3.5 h-3.5" /> 导出清单 TXT
          </button>
        </div>

        <!-- 空状态 -->
        <div v-if="!result && !scanning" class="py-16 text-center text-muted-foreground">
          <ScanSearch class="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p class="text-sm">选择文件后点击「开始扫描」</p>
          <p class="text-xs mt-1">相同内容会分成一组，按内容哈希比对，文件名不同也能识别</p>
        </div>

        <!-- 统计卡 -->
        <div v-if="result" class="grid grid-cols-3 gap-2 mb-3">
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">扫描文件数</p>
            <p class="text-lg font-bold text-foreground">{{ result.scannedCount }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">重复组数</p>
            <p class="text-lg font-bold" :class="result.groups.length > 0 ? 'text-warning' : 'text-foreground'">{{ result.groups.length }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">可释放字节</p>
            <p class="text-lg font-bold text-foreground">{{ formatBytes(result.wastedTotal) }}</p>
          </div>
        </div>

        <!-- 附加说明 -->
        <div v-if="result && (result.skippedEmpty > 0 || result.readErrorCount > 0)" class="mb-3 flex flex-wrap gap-2">
          <span v-if="result.skippedEmpty > 0" class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-foreground text-[11px]">
            空文件已跳过 {{ result.skippedEmpty }} 个
          </span>
          <span v-if="result.readErrorCount > 0" class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-foreground text-[11px]">
            读取失败已跳过 {{ result.readErrorCount }} 个
          </span>
        </div>

        <!-- 未发现重复 -->
        <div v-if="result && result.groups.length === 0" class="py-10 text-center">
          <CheckCircle class="w-10 h-10 mx-auto mb-3 text-success" />
          <p class="text-sm font-medium text-foreground">未发现重复文件</p>
          <p class="text-xs text-muted-foreground mt-1">所有 {{ result.scannedCount }} 个文件的内容都互不相同</p>
        </div>

        <!-- 重复组列表 -->
        <div v-if="result && result.groups.length > 0" class="space-y-3 max-h-[560px] overflow-y-auto pr-1">
          <div v-for="(group, gi) in result.groups" :key="gi" class="border border-border rounded-lg overflow-hidden">
            <div class="bg-muted/50 px-3 py-2 flex items-center gap-2 flex-wrap">
              <span class="text-xs font-semibold text-foreground">组 {{ gi + 1 }}</span>
              <code class="text-[11px] font-mono text-primary bg-primary/10 rounded px-1.5 py-0.5">{{ group.hash8 }}</code>
              <span class="text-[11px] text-muted-foreground">{{ formatBytes(group.size) }} × {{ group.count }} 份</span>
              <span class="text-[11px] text-muted-foreground">浪费 {{ formatBytes(group.wasted) }}</span>
              <span
                class="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
                :class="group.verified ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'"
              >
                <ShieldCheck v-if="group.verified" class="w-3 h-3" />
                <TriangleAlert v-else class="w-3 h-3" />
                {{ group.verified ? '已全量校验' : '疑似重复（未全量校验）' }}
              </span>
            </div>
            <div class="divide-y divide-border">
              <div v-for="member in group.members" :key="member.id" class="px-3 py-2 flex items-start gap-2">
                <span
                  class="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
                  :class="member.keep ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'"
                >
                  <Star v-if="member.keep" class="w-3 h-3" />
                  {{ member.keep ? '建议保留' : '可删除' }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-foreground truncate" :title="member.name">{{ member.name }}</p>
                  <p class="text-[10px] text-muted-foreground truncate font-mono" :title="member.path">{{ member.path }}</p>
                  <p class="text-[10px] text-muted-foreground">修改于 {{ formatTime(member.lastModified) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 错误 -->
        <div v-if="error" class="mt-4 flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2.5">
          <TriangleAlert class="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p class="text-xs text-destructive leading-relaxed">{{ error }}</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于重复文件查找</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            相机连拍、微信重复保存、网盘多次同步、下载目录反复下载同一份安装包……重复文件是磁盘空间最常见的「隐形杀手」。
            本工具在浏览器内对所选文件执行三级流水线比对：先按字节大小分组（大小不同不可能重复，直接排除），
            再对同大小的文件只读首尾各 64KB 计算 SHA-256 快哈希，最后仅对快哈希相同的候选组做全量 SHA-256 确认。
            这样即使面对上千张照片，也只需读取很小一部分字节就能完成初筛，兼顾速度与内存占用。
          </p>

          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>清理照片库里连拍、多次导入产生的重复照片，释放手机 / 硬盘空间</li>
            <li>整理下载目录：同一安装包、同一份 PDF 反复下载的副本一次找清</li>
            <li>同步与备份核对：确认网盘 / 移动硬盘 / 本地三方副本是否真的内容一致</li>
            <li>项目目录去重：设计师找重复素材、开发找重复的资源文件</li>
          </ul>

          <h3 class="text-lg font-semibold text-foreground">为什么要三级流水线而不是直接全部算哈希？</h3>
          <p>
            对每个文件整读一遍再算哈希，在文件多、体积大的场景下既慢又占内存。三级流水线的核心思路是「先排除、再抽查、后确认」：
            字节数不同必然不重复；字节相同的才读首尾 64KB 抽查——首尾不同的文件不可能完全相同；
            只有首尾都相同的极少数候选组才值得做全量 SHA-256。超过 100MB 的大文件跳过全量步骤，
            以快哈希 + 字节数标记「疑似重复（未全量校验）」，工具会诚实标注而不是假装确认。
          </p>

          <h3 class="text-lg font-semibold text-foreground">「建议保留」是怎么选的？</h3>
          <p>
            每个重复组内会按文件的修改时间（lastModified）标记最新的一份为「建议保留」，其余标记「可删除」。
            这只是一个清理建议：复制副本的修改时间通常等于复制时间，往往比原件新，删除前请务必打开确认内容是你想留的那份，
            尤其是「疑似重复（未全量校验）」的大文件组。
          </p>

          <h3 class="text-lg font-semibold text-foreground">本地处理和在线工具有什么区别？</h3>
          <p>
            找重复文件意味着要读取你磁盘上所有被选中的文件内容——交给在线服务等于把私人照片、合同全部上传。
            本工具的哈希计算与比对全部发生在你的浏览器里，内容不出设备、断网也能用；代价是扫描速度取决于你自己电脑的性能。
          </p>

          <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
          <div class="space-y-4">
            <div>
              <h3 class="text-base font-semibold text-foreground">文件会被上传到服务器吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">不会。文件读取、SHA-256 哈希与比对全部在浏览器本地完成，内容不出你的设备，断网状态下也可以正常使用。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">超过 100MB 的大文件怎么处理？</h3>
              <p class="text-sm text-muted-foreground mt-1">为避免一次性读入爆内存，大文件只做首尾 64KB 快哈希比对；快哈希相同的会被分组并标注「疑似重复（未全量校验）」，删除前请自行打开确认。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">文件名不同、只改过名字的文件能识别吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">能。比对完全基于内容哈希，与文件名无关；重命名、换文件夹保存的副本只要内容一致就会被分到同一组。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">0 字节的空文件算重复吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">按内容看所有空文件都彼此相同，但清理价值几乎为零。默认跳过空文件（结果中会显示跳过数量），你也可以取消勾选让它们参与分组。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">文件夹模式支持哪些浏览器？</h3>
              <p class="text-sm text-muted-foreground mt-1">「选择整个文件夹」基于 webkitdirectory 属性，Chrome / Edge / Safari 与新版 Firefox 均支持；个别老浏览器不支持时会退化为普通文件选择。拖放仅支持文件，不支持整个文件夹。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'duplicate-file-finder'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Files, FolderOpen, FileCheck, Info, Search, Loader2, Settings2, CheckCircle,
  TriangleAlert, ChevronUp, ChevronDown, Download, Trash2, X, Star, ShieldCheck, ScanSearch
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '重复文件查找 - 在线按内容查找重复文件/重复照片工具',
  description: '在线重复文件查找工具，选择文件或文件夹本地比对内容哈希（SHA-256），三级流水线快速找出重复照片与文档并分组，标记建议保留最新一份，可导出清理清单，纯本地处理不上传服务器',
  keywords: '重复文件查找,重复照片清理,文件去重,查找相同文件,重复文件检测,磁盘清理,本地文件查重,内容查重',
  author: '有条工具',
  ogTitle: '重复文件查找 - 有条工具',
  ogDescription: '按内容哈希找出重复文件分组展示，清理重复照片与文档，三级流水线省内存，全程本地不传云',
  ogUrl: 'https://www.util.cn/tools/duplicate-file-finder',
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
          name: '重复文件查找',
          url: 'https://www.util.cn/tools/duplicate-file-finder',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['按内容 SHA-256 查重', '字节分组+首尾快哈希三级流水线', '文件夹整体扫描', '大文件疑似重复诚实标注', '建议保留最新一份', '导出清理清单', '纯本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '重复文件查找', item: 'https://www.util.cn/tools/duplicate-file-finder/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '文件会被上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。文件读取、SHA-256 哈希与比对全部在浏览器本地完成，内容不出你的设备，断网状态下也可以正常使用。' }
            },
            {
              '@type': 'Question',
              name: '超过 100MB 的大文件怎么处理？',
              acceptedAnswer: { '@type': 'Answer', text: '为避免一次性读入爆内存，大文件只做首尾 64KB 快哈希比对；快哈希相同的会被分组并标注「疑似重复（未全量校验）」，删除前请自行打开确认。' }
            },
            {
              '@type': 'Question',
              name: '文件名不同、只改过名字的文件能识别吗？',
              acceptedAnswer: { '@type': 'Answer', text: '能。比对完全基于内容哈希，与文件名无关；重命名、换文件夹保存的副本只要内容一致就会被分到同一组。' }
            },
            {
              '@type': 'Question',
              name: '0 字节的空文件算重复吗？',
              acceptedAnswer: { '@type': 'Answer', text: '按内容看所有空文件都彼此相同，但清理价值几乎为零。默认跳过空文件，也可以取消勾选让它们参与分组。' }
            },
            {
              '@type': 'Question',
              name: '文件夹模式支持哪些浏览器？',
              acceptedAnswer: { '@type': 'Answer', text: '「选择整个文件夹」基于 webkitdirectory 属性，Chrome / Edge / Safari 与新版 Firefox 均支持；个别老浏览器不支持时会退化为普通文件选择。' }
            }
          ]
        }
      ]
    })
  }]
})

// ================== 纯流水线逻辑（SENTINEL: DUPFINDER_PURE_BEGIN） ==================
// 说明：本区块不依赖 Vue 与任何浏览器专属 API（crypto.subtle 在浏览器与 Node ≥19 均内置），
// 只通过 item.readSlice(start, end) → Promise<Uint8Array> 抽象文件读取，可被 node 脚本整段
// 提取后独立单测。所有函数只在用户操作回调（点击扫描）中执行，不参与 SSR。

// 阶段常量：快哈希只读首/尾 64KB；全量哈希只对 ≤100MB 的文件执行
const QUICK_HEAD_BYTES = 64 * 1024
const QUICK_TAIL_BYTES = 64 * 1024
const DEFAULT_FULL_HASH_LIMIT = 100 * 1024 * 1024

// SHA-256：把若干字节块拼成一个 Uint8Array 后单次 digest，返回十六进制串
async function sha256HexOfParts(parts) {
  const chunks = []
  let total = 0
  for (const p of (Array.isArray(parts) ? parts : [])) {
    const c = p instanceof Uint8Array ? p : new Uint8Array(0)
    chunks.push(c)
    total += c.length
  }
  const all = new Uint8Array(total)
  let off = 0
  for (const c of chunks) { all.set(c, off); off += c.length }
  const digest = await crypto.subtle.digest('SHA-256', all)
  const bytes = new Uint8Array(digest)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0')
  return hex
}

// 纯函数 1：按字节数完全相同分组（size 不同不可能重复，直接排除）；
// 只返回成员数 ≥2 的组，其余单例组丢弃
function groupBySize(items) {
  const map = new Map()
  for (const it of (Array.isArray(items) ? items : [])) {
    if (!it) continue
    const size = Number(it.size) || 0
    if (!map.has(size)) map.set(size, [])
    map.get(size).push(it)
  }
  const groups = []
  for (const bucket of map.values()) {
    if (bucket.length >= 2) groups.push(bucket)
  }
  return groups
}

// 纯函数 2：浪费字节 = 每组 (份数 - 1) × 单份字节数 求和
function wastedBytes(groups) {
  let total = 0
  for (const g of (Array.isArray(groups) ? groups : [])) {
    if (!Array.isArray(g) || g.length < 2) continue
    const size = Number(g[0] && g[0].size) || 0
    total += (g.length - 1) * size
  }
  return total
}

// 纯函数 3：组内建议保留 lastModified 最新的一份；并列时保留先出现的（结果稳定）
function pickKeepLatest(members) {
  const list = Array.isArray(members) ? members : []
  if (!list.length) return null
  let best = list[0]
  for (let i = 1; i < list.length; i++) {
    const lm = Number(list[i] && list[i].lastModified) || 0
    const blm = Number(best && best.lastModified) || 0
    if (lm > blm) best = list[i]
  }
  return best
}

// 纯函数 4：快哈希键 = 字节数 + 首 64KB 哈希 + 尾 64KB 哈希（同键 ⇒ 同大小且首尾一致）
function combineKey(size, headHash, tailHash) {
  return `${Number(size) || 0}:${String(headHash || '')}:${String(tailHash || '')}`
}

// 单文件快哈希：只读首 64KB + 尾 64KB，两次独立 digest
async function quickHashItem(item) {
  const size = Number(item.size) || 0
  const head = await item.readSlice(0, Math.min(QUICK_HEAD_BYTES, size))
  const tailStart = Math.max(0, size - QUICK_TAIL_BYTES)
  const tail = await item.readSlice(tailStart, size)
  const headHash = await sha256HexOfParts([head])
  const tailHash = await sha256HexOfParts([tail])
  return { headHash, tailHash }
}

// 全量哈希：一次读入全部字节后 digest（仅 ≤ fullHashLimit 的文件走这里）
async function fullHashItem(item) {
  const bytes = await item.readSlice(0, Number(item.size) || 0)
  return sha256HexOfParts([bytes])
}

// 组结果装配：hash8 / 单份大小 / 份数 / 浪费字节 / 校验状态 / 组内保留标记
function buildGroup(members, verified) {
  const list = Array.isArray(members) ? members : []
  const keep = pickKeepLatest(list)
  const size = Number(list[0] && list[0].size) || 0
  const digestHex = verified
    ? String((list[0] && list[0].fullHash) || '')
    : String((list[0] && list[0].headHash) || '')
  return {
    hash8: digestHex.slice(0, 8) || '--------',
    size,
    count: list.length,
    wasted: Math.max(0, list.length - 1) * size,
    verified: !!verified,
    empty: size === 0,
    members: list.map(m => ({
      id: m.id,
      name: m.name,
      path: m.path,
      size: m.size,
      lastModified: m.lastModified,
      keep: m === keep
    }))
  }
}

// 三级流水线：字节分组 → 组内快哈希 → 候选组全量哈希（超限以快哈希标记疑似）
// items: [{ id, name, path, size, lastModified, readSlice(start, end) → Promise<Uint8Array> }]
// options: { skipEmpty（默认 true）, fullHashLimit（默认 100MB，测试可覆盖） }
// onProgress: ({ phase: 'size'|'quick'|'full', done, total }) => void
async function findDuplicateGroups(items, options, onProgress) {
  const opts = options || {}
  const skipEmpty = opts.skipEmpty !== false
  const fullHashLimit = Number.isFinite(opts.fullHashLimit) ? opts.fullHashLimit : DEFAULT_FULL_HASH_LIMIT
  const notify = (phase, done, total) => {
    if (typeof onProgress === 'function') onProgress({ phase, done, total })
  }

  // 阶段 0：过滤空文件
  const eligible = []
  let skippedEmpty = 0
  for (const it of (Array.isArray(items) ? items : [])) {
    if (!it) continue
    if ((Number(it.size) || 0) === 0 && skipEmpty) { skippedEmpty++; continue }
    eligible.push(it)
  }
  notify('size', eligible.length, eligible.length)

  const readErrors = []
  // 阶段 1：按字节数分组
  const sizeGroups = groupBySize(eligible)
  const quickTotal = sizeGroups.reduce((n, g) => n + g.length, 0)

  // 阶段 2：组内快哈希
  let quickDone = 0
  const candidateGroups = []
  for (const g of sizeGroups) {
    const byKey = new Map()
    for (const it of g) {
      let q
      try {
        q = await quickHashItem(it)
      } catch (e) {
        readErrors.push(it)
        quickDone++
        notify('quick', quickDone, quickTotal)
        continue
      }
      it.headHash = q.headHash
      it.tailHash = q.tailHash
      const key = combineKey(it.size, q.headHash, q.tailHash)
      if (!byKey.has(key)) byKey.set(key, [])
      byKey.get(key).push(it)
      quickDone++
      notify('quick', quickDone, quickTotal)
      if (quickDone % 64 === 0) await new Promise(r => setTimeout(r, 0))
    }
    for (const bucket of byKey.values()) {
      if (bucket.length >= 2) candidateGroups.push(bucket)
    }
  }

  // 阶段 3：候选组全量校验；超过上限的组以快哈希+字节数标记疑似重复（诚实标注，不假装确认）
  const fullGroups = []
  const suspectGroups = []
  for (const g of candidateGroups) {
    if ((Number(g[0] && g[0].size) || 0) <= fullHashLimit) fullGroups.push(g)
    else suspectGroups.push(g)
  }
  const fullTotal = fullGroups.reduce((n, g) => n + g.length, 0)
  let fullDone = 0
  const found = []
  for (const g of fullGroups) {
    const byHash = new Map()
    for (const it of g) {
      let fullHash = ''
      try {
        fullHash = await fullHashItem(it)
      } catch (e) {
        readErrors.push(it)
        fullDone++
        notify('full', fullDone, fullTotal)
        continue
      }
      it.fullHash = fullHash
      if (!byHash.has(fullHash)) byHash.set(fullHash, [])
      byHash.get(fullHash).push(it)
      fullDone++
      notify('full', fullDone, fullTotal)
      if (fullDone % 8 === 0) await new Promise(r => setTimeout(r, 0))
    }
    for (const bucket of byHash.values()) {
      if (bucket.length >= 2) found.push({ members: bucket, verified: true })
    }
  }
  for (const g of suspectGroups) found.push({ members: g, verified: false })

  // 浪费字节多的组排前面
  found.sort((a, b) => {
    const wa = (a.members.length - 1) * (Number(a.members[0].size) || 0)
    const wb = (b.members.length - 1) * (Number(b.members[0].size) || 0)
    return wb - wa
  })
  const groups = found.map(g => buildGroup(g.members, g.verified))
  return {
    scannedCount: eligible.length,
    skippedEmpty,
    readErrorCount: readErrors.length,
    groups,
    duplicateCount: groups.reduce((n, g) => n + g.count, 0),
    wastedTotal: wastedBytes(groups.map(g => g.members))
  }
}

// 导出清理清单（txt）：组 + 成员路径列表
function buildDuplicateReport(result, meta) {
  const r = result || {}
  const groups = Array.isArray(r.groups) ? r.groups : []
  const m = meta || {}
  const lines = []
  lines.push('重复文件查找报告')
  lines.push('由有条工具（util.cn）在本地生成，文件内容未上传任何服务器')
  if (m.scannedAt) lines.push('生成时间：' + m.scannedAt)
  lines.push('')
  lines.push('扫描文件数：' + (Number(r.scannedCount) || 0))
  lines.push('重复组数：' + groups.length)
  lines.push('可释放字节：' + (Number(r.wastedTotal) || 0).toLocaleString('en-US'))
  if (r.skippedEmpty) lines.push('跳过空文件：' + r.skippedEmpty + ' 个')
  if (r.readErrorCount) lines.push('读取失败跳过：' + r.readErrorCount + ' 个')
  lines.push('')
  groups.forEach((g, gi) => {
    lines.push('【组 ' + (gi + 1) + '】哈希 ' + g.hash8 + ' · ' + g.count + ' 份 · 每份 '
      + (Number(g.size) || 0).toLocaleString('en-US') + ' 字节 · 浪费 '
      + (Number(g.wasted) || 0).toLocaleString('en-US') + ' 字节 · '
      + (g.verified ? '已全量校验' : '疑似重复（未全量校验）'))
    for (const mem of (g.members || [])) {
      lines.push('  [' + (mem.keep ? '建议保留' : '可删除') + '] ' + (mem.path || mem.name)
        + '（修改于 ' + new Date(Number(mem.lastModified) || 0).toLocaleString('zh-CN') + '）')
    }
    lines.push('')
  })
  if (!groups.length) lines.push('未发现重复文件。')
  return lines.join('\n')
}
// ================== 纯流水线逻辑（SENTINEL: DUPFINDER_PURE_END） ====================

// ---------- 状态 ----------
const fileInput = ref(null)
const folderInput = ref(null)
const isDragging = ref(false)
const entries = ref([])
const skipEmpty = ref(true)
const scanning = ref(false)
const progress = ref({ phase: 'size', done: 0, total: 0 })
const result = ref(null)
const error = ref('')

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

let entrySeq = 0

// ---------- 派生数据 ----------
const totalBytes = computed(() => entries.value.reduce((n, e) => n + e.size, 0))
const displayEntries = computed(() => entries.value.slice(0, 200))
const progressPercent = computed(() => {
  const p = progress.value
  return p.total > 0 ? Math.min(100, Math.round((p.done / p.total) * 100)) : 0
})
const progressPhaseLabel = computed(() => {
  switch (progress.value.phase) {
    case 'size': return '第一级：按字节大小分组'
    case 'quick': return '第二级：首尾 64KB 快哈希'
    case 'full': return '第三级：全量 SHA-256 校验'
    default: return '处理中…'
  }
})

const formatBytes = (n) => {
  if (!n || n <= 0) return '0 B'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB'
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

const formatTime = (lm) => {
  const t = Number(lm) || 0
  if (!t) return '未知'
  return new Date(t).toLocaleString('zh-CN', { hour12: false })
}

// ---------- 文件选择 ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }
const triggerFolderSelect = () => { folderInput.value && folderInput.value.click() }

const addFiles = (fileList) => {
  const list = Array.from(fileList || [])
  const seen = new Set(entries.value.map(e => e.path + '\u0000' + e.size))
  let added = 0
  for (const f of list) {
    const path = f.webkitRelativePath || f.name
    const dedupKey = path + '\u0000' + f.size
    if (seen.has(dedupKey)) continue
    seen.add(dedupKey)
    entries.value.push({
      id: ++entrySeq,
      name: f.name,
      path,
      size: f.size,
      lastModified: f.lastModified,
      file: f
    })
    added++
  }
  if (added > 0) error.value = ''
}

const handleFileChange = (e) => {
  const files = e.target.files
  if (files && files.length > 0) addFiles(files)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer && e.dataTransfer.files
  if (files && files.length > 0) addFiles(files)
}

const removeEntry = (id) => {
  entries.value = entries.value.filter(e => e.id !== id)
}

const clearEntries = () => {
  entries.value = []
  result.value = null
  error.value = ''
}

// ---------- 扫描 ----------
const startScan = async () => {
  if (entries.value.length === 0 || scanning.value) return
  scanning.value = true
  error.value = ''
  result.value = null
  progress.value = { phase: 'size', done: 0, total: entries.value.length }
  try {
    // readSlice 用 File.slice 按需读取，不整读大文件（用户回调内执行）
    const workItems = entries.value.map(e => ({
      id: e.id,
      name: e.name,
      path: e.path,
      size: e.size,
      lastModified: e.lastModified,
      readSlice: async (start, end) => {
        const blob = e.file.slice(start, Math.min(end, e.size))
        const buf = await blob.arrayBuffer()
        return new Uint8Array(buf)
      }
    }))
    result.value = await findDuplicateGroups(workItems, { skipEmpty: skipEmpty.value }, (p) => {
      progress.value = p
    })
  } catch (e) {
    error.value = '扫描失败：' + (e && e.message ? e.message : '未知错误')
  } finally {
    scanning.value = false
  }
}

// ---------- 导出 ----------
const exportReport = () => {
  if (!result.value) return
  const text = buildDuplicateReport(result.value, { scannedAt: new Date().toLocaleString('zh-CN', { hour12: false }) })
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '重复文件清单.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

onMounted(() => {
  addRecentTool('duplicate-file-finder')
})
</script>
