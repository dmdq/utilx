<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3 flex items-center gap-2">
        <FileArchive :size="36" />
        文件合并拆分工具 - 在线文本文件分割合并
      </h1>
      <p class="text-muted-foreground">轻松处理大文件，支持按行数、大小拆分文本文件与多文件合并，适用于日志处理、数据分割、CSV处理等场景。纯本地计算，数据隐私安全。</p>
    </div>

    <!-- 标签页切换 -->
    <div class="flex justify-center mb-6">
      <div class="bg-card rounded-lg p-1 inline-flex border border-border">
        <button
          @click="activeTab = 'split'"
          :class="[
            'px-6 py-2 rounded-md transition flex items-center gap-2',
            activeTab === 'split'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          ]"
        >
          <Scissors :size="18" />
          文件拆分
        </button>
        <button
          @click="activeTab = 'merge'"
          :class="[
            'px-6 py-2 rounded-md transition flex items-center gap-2',
            activeTab === 'merge'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          ]"
        >
          <Merge :size="18" />
          文件合并
        </button>
      </div>
    </div>

    <!-- 文件拆分区域 -->
    <div v-if="activeTab === 'split'" class="space-y-6">
      <!-- 拆分设置 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Split :size="24" />
          拆分设置
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <!-- 拆分模式 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">拆分模式</label>
            <div class="flex gap-2">
              <button
                @click="splitMode = 'lines'"
                :class="[
                  'flex-1 px-4 py-2 rounded-md transition',
                  splitMode === 'lines'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                ]"
              >
                按行数
              </button>
              <button
                @click="splitMode = 'size'"
                :class="[
                  'flex-1 px-4 py-2 rounded-md transition',
                  splitMode === 'size'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                ]"
              >
                按大小
              </button>
            </div>
          </div>

          <!-- 拆分参数 -->
          <div v-if="splitMode === 'lines'">
            <label class="block text-sm font-medium text-foreground mb-2">
              每个文件行数
            </label>
            <input
              v-model.number="splitByLines"
              type="number"
              min="1"
              class="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              placeholder="输入行数"
            />
          </div>

          <div v-else>
            <label class="block text-sm font-medium text-foreground mb-2">
              每个文件大小
            </label>
            <div class="flex gap-2">
              <input
                v-model.number="splitBySize"
                type="number"
                min="1"
                class="flex-1 px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                placeholder="输入大小"
              />
              <select
                v-model="sizeUnit"
                class="px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              >
                <option value="MB">MB</option>
                <option value="KB">KB</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 文件信息 -->
        <div v-if="fileContent" class="bg-muted rounded-lg p-4 mb-4">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-primary">{{ fileInfo.totalLines.toLocaleString() }}</div>
              <div class="text-sm text-muted-foreground">总行数</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-primary">{{ fileInfo.sizeInMB }} MB</div>
              <div class="text-sm text-muted-foreground">文件大小</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-primary">{{ splitFileCount }}</div>
              <div class="text-sm text-muted-foreground">将拆分为</div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-2">
          <button
            @click="loadSample"
            class="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-md transition"
          >
            加载示例
          </button>
          <button
            v-if="fileContent"
            @click="clearContent"
            class="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md transition"
          >
            清空
          </button>
        </div>
      </div>

      <!-- 文件内容输入 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText :size="24" />
          文件内容
        </h2>
        <textarea
          v-model="fileContent"
          class="w-full h-64 px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background font-mono text-sm resize-none"
          placeholder="粘贴或输入要拆分的文本内容..."
        ></textarea>
      </div>

      <!-- 拆分按钮 -->
      <div class="flex justify-center">
        <button
          @click="splitFile"
          :disabled="!fileContent || processing"
          class="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Split :size="20" />
          {{ processing ? '处理中...' : '开始拆分' }}
        </button>
      </div>

      <!-- 拆分结果 -->
      <div v-if="resultFiles.length > 0" class="bg-card border border-border rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-foreground flex items-center gap-2">
            <Download :size="24" />
            拆分结果 ({{ resultFiles.length }} 个文件)
          </h2>
          <button
            @click="downloadAll"
            class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition flex items-center gap-2"
          >
            <Download :size="18" />
            下载全部
          </button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div
            v-for="(file, index) in resultFiles"
            :key="index"
            class="bg-muted rounded-lg p-3 hover:bg-muted/80 transition cursor-pointer"
            @click="downloadFile(file)"
          >
            <div class="flex items-center gap-2">
              <FileText :size="20" class="text-primary" />
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{{ file.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ (file.content.length / 1024).toFixed(2) }} KB
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件合并区域 -->
    <div v-else class="space-y-6">
      <!-- 合并设置 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Merge :size="24" />
          合并设置
        </h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">
            文件间分隔符
          </label>
          <div class="flex gap-2">
            <button
              v-for="(sep, label) in { '\n': '换行', '\n\n': '双换行', ' ': '空格', '': '无' }"
              :key="sep"
              @click="mergeSeparator = sep"
              :class="[
                'flex-1 px-4 py-2 rounded-md transition',
                mergeSeparator === sep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              ]"
            >
              {{ label }}
            </button>
          </div>
        </div>

        <!-- 添加文件 -->
        <div class="border-2 border-dashed border-border rounded-xl p-8 text-center">
          <input
            type="file"
            multiple
            @change="uploadFiles"
            accept=".txt,.csv,.json,.md,.xml,.html"
            class="hidden"
            id="fileInput"
          />
          <label
            for="fileInput"
            class="cursor-pointer flex flex-col items-center"
          >
            <Upload :size="48" class="text-muted-foreground mb-3" />
            <span class="text-lg font-medium text-foreground">点击选择文件</span>
            <span class="text-sm text-muted-foreground mt-1">支持 .txt, .csv, .json 等文本文件</span>
          </label>
        </div>
      </div>

      <!-- 待合并文件列表 -->
      <div v-if="filesToMerge.length > 0" class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">
          待合并文件 ({{ filesToMerge.length }})
        </h2>

        <div class="space-y-2">
          <div
            v-for="(file, index) in filesToMerge"
            :key="index"
            class="flex items-center justify-between bg-muted rounded-lg p-3"
          >
            <div class="flex items-center gap-3">
              <FileText :size="20" class="text-primary" />
              <div>
                <div class="font-medium text-sm">{{ file.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ file.content.split('\n').length }} 行
                </div>
              </div>
            </div>
            <button
              @click="removeMergeFile(index)"
              class="p-2 text-destructive hover:bg-destructive/10 rounded-md transition"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- 合并按钮 -->
        <div class="mt-4 flex justify-center">
          <button
            @click="mergeFiles"
            :disabled="filesToMerge.length === 0 || processing"
            class="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Merge :size="20" />
            {{ processing ? '合并中...' : '开始合并' }}
          </button>
        </div>
      </div>

      <!-- 合并结果 -->
      <div v-if="resultFiles.length > 0" class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Download :size="24" />
          合并结果
        </h2>

        <div
          v-for="(file, index) in resultFiles"
          :key="index"
          class="bg-muted rounded-lg p-4 hover:bg-muted/80 transition cursor-pointer"
          @click="downloadFile(file)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <FileText :size="24" class="text-primary" />
              <div>
                <div class="font-medium">{{ file.name }}</div>
                <div class="text-sm text-muted-foreground">
                  {{ file.content.split('\n').length.toLocaleString() }} 行 ·
                  {{ (file.content.length / 1024).toFixed(2) }} KB
                </div>
              </div>
            </div>
            <Download :size="20" class="text-primary" />
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg mt-8">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是文件合并拆分工具？
        </h2>
        <p class="text-muted-foreground mb-4">
          文件合并拆分工具是一款专业的文本文件处理工具，支持将大文件按行数或文件大小拆分为多个小文件，
          也可以将多个文件合并为一个文件。这对于日志处理、数据分割、CSV数据处理等场景非常有用。
          所有处理都在浏览器本地完成，确保数据隐私安全。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用文件拆分功能
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在"文件拆分"标签页中，选择拆分模式（按行数或按大小）</li>
          <li>输入拆分参数，如每个文件的行数或大小限制</li>
          <li>在"文件内容"区域粘贴或输入要拆分的文本内容</li>
          <li>点击"开始拆分"按钮，等待处理完成</li>
          <li>预览拆分结果，可以单独下载或点击"下载全部"批量下载</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用文件合并功能
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>切换到"文件合并"标签页</li>
          <li>选择文件间的分隔符（换行、双换行、空格或无）</li>
          <li>点击上传区域，选择要合并的多个文本文件</li>
          <li>查看待合并文件列表，确认无误后点击"开始合并"</li>
          <li>下载合并后的文件</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>按行数拆分</strong>: 将大文件按指定行数分割成多个小文件，适用于日志文件、CSV数据等</li>
          <li><strong>按大小拆分</strong>: 按文件大小（MB/KB）进行拆分，方便控制单个文件的大小</li>
          <li><strong>多文件合并</strong>: 支持批量合并多个文本文件，可自定义文件间分隔符</li>
          <li><strong>实时预览</strong>: 拆分前可预览文件信息和预计生成的文件数量</li>
          <li><strong>本地安全</strong>: 所有处理都在浏览器本地完成，数据不会上传到服务器，确保隐私安全</li>
          <li><strong>支持大文件</strong>: 支持处理大文件，无需担心性能问题</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          使用场景
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground mb-6">
          <div class="bg-muted p-4 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">日志处理</h4>
            <p class="text-sm">将大型日志文件拆分为小文件，方便分析和归档。支持按时间或大小分割日志。</p>
          </div>
          <div class="bg-muted p-4 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">数据分割</h4>
            <p class="text-sm">将CSV或JSON数据集按行数拆分，便于分布式处理或分批导入数据库。</p>
          </div>
          <div class="bg-muted p-4 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">文件合并</h4>
            <p class="text-sm">将多个日志文件或数据文件合并为一个文件，方便统一分析或处理。</p>
          </div>
          <div class="bg-muted p-4 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">文本处理</h4>
            <p class="text-sm">处理大批量文本数据，支持按行数或大小拆分，提高处理效率。</p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">文件拆分合并工具安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。我们的工具采用纯前端技术实现，所有处理都在您的浏览器本地完成，
              数据不会上传到任何服务器。您处理的文件内容完全保密，可以放心使用。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持哪些文件格式？</h3>
            <p class="text-muted-foreground mt-1">
              支持所有文本文件格式，包括 .txt、.csv、.json、.md、.xml、.html 等。
              工具按文本行处理，适用于任何基于文本的文件。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">可以处理多大的文件？</h3>
            <p class="text-muted-foreground mt-1">
              由于采用本地处理，理论上可以处理非常大的文件。实际限制取决于您的浏览器内存和系统性能。
              一般建议单个文件不超过 500MB，以获得最佳性能。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">按大小拆分时如何保证行完整性？</h3>
            <p class="text-muted-foreground mt-1">
              按大小拆分时，工具会智能地保持行完整性。即使某一行超出文件大小限制，
              也会完整地将该行放入一个文件中，避免数据截断。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  FileArchive, FileText, Download, Upload, Split, Merge, Scissors,
  HelpCircle, ChevronUp,
  FileJson, Code, Lock, Shield, Clock, Type, Wifi, Image,
  Database, Link, Hash, Timer, Regex, FileDiff, Globe, FolderOpen,
  GitBranch, Filter, FileSearch, Trash2, BarChart3
} from 'lucide-vue-next'
import { tools } from '~/data/tools.js'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: '文件合并拆分工具 - 在线文本文件分割合并 | Util工具箱',
  description: '免费在线文件合并与拆分工具，支持按行数、大小拆分文本文件，可合并多个文件，适用于日志处理、数据分割、CSV处理等场景。纯本地计算，数据安全隐私。',
  keywords: '文件合并,文件拆分,文本文件,日志拆分,数据分割,CSV拆分,大文件处理,文件分割,文本处理',
  author: 'Util工具箱',
  ogTitle: '文件合并拆分工具 - 免费在线文本文件分割合并',
  ogDescription: '专业的文件合并与拆分工具，支持按行数、大小拆分文本文件，可合并多个文件。纯前端处理，数据安全可靠，适用于日志处理、数据分割等场景。',
  ogImage: 'https://www.util.cn/images/tools/file-merge-split.png',
  ogUrl: 'https://www.util.cn/tools/file-merge-split',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '文件合并拆分工具 - 免费在线文本文件分割合并',
  twitterDescription: '专业的文件合并与拆分工具，支持按行数、大小拆分文本文件，可合并多个文件。纯前端处理，数据安全可靠。',
  twitterImage: 'https://www.util.cn/images/tools/file-merge-split.png'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: '文件合并拆分工具',
            description: '免费在线文件合并与拆分工具，支持按行数、大小拆分文本文件',
            url: 'https://www.util.cn/tools/file-merge-split',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '按行数拆分文件',
              '按文件大小拆分',
              '多文件批量合并',
              '自定义分隔符',
              '本地安全处理',
              '支持大文件处理'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '文件合并拆分',
                item: 'https://www.util.cn/tools/file-merge-split'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '文件拆分合并工具安全吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '绝对安全。我们的工具采用纯前端技术实现，所有处理都在您的浏览器本地完成，数据不会上传到任何服务器，确保隐私安全。'
                }
              },
              {
                '@type': 'Question',
                name: '支持哪些文件格式？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '支持所有文本文件格式，包括 .txt、.csv、.json、.md、.xml、.html 等。工具按文本行处理，适用于任何基于文本的文件。'
                }
              },
              {
                '@type': 'Question',
                name: '可以处理多大的文件？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '由于采用本地处理，理论上可以处理非常大的文件。实际限制取决于您的浏览器内存和系统性能。一般建议单个文件不超过 500MB，以获得最佳性能。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const router = useRouter()

// 定义当前工具
const tool = tools.find(t => t.id === 'file-merge-split')

// 状态管理
const activeTab = ref('split')
const splitMode = ref('lines')
const splitByLines = ref(1000)
const splitBySize = ref(1)
const sizeUnit = ref('MB')
const mergeSeparator = ref('\n')
const fileContent = ref('')
const filesToMerge = ref([])
const processing = ref(false)
const resultFiles = ref([])

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileArchive, FileText, Download, Upload, Split, Merge, Scissors,
  FileJson, Code, Lock, Shield, Clock, Type, Wifi, Image,
  Database, Link, Hash, Timer, Regex, FileDiff, Globe, FolderOpen,
  GitBranch, Filter, FileSearch, Trash2, BarChart3
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'others' && t.id !== 'file-merge-split'
  ).slice(0, 2)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'text-split-merge'),
    tools.find(t => t.id === 'duplicate-remover'),
    tools.find(t => t.id === 'csv-editor'),
    tools.find(t => t.id === 'json-to-csv')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 计算文件信息
const fileInfo = computed(() => {
  const lines = fileContent.value.split('\n')
  const totalLines = lines.length
  const totalSize = new Blob([fileContent.value]).size
  const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2)

  return {
    totalLines,
    totalSize,
    sizeInMB
  }
})

// 计算拆分后的文件数量
const splitFileCount = computed(() => {
  if (splitMode.value === 'lines') {
    return Math.ceil(fileInfo.value.totalLines / splitByLines.value)
  } else {
    const sizeInBytes = fileInfo.value.totalSize
    const splitSizeInBytes = splitBySize.value * (sizeUnit.value === 'MB' ? 1024 * 1024 : 1024)
    return Math.ceil(sizeInBytes / splitSizeInBytes)
  }
})

// 拆分文件
const splitFile = () => {
  if (!fileContent.value.trim()) {
    alert('请先输入文件内容')
    return
  }

  processing.value = true
  resultFiles.value = []

  const lines = fileContent.value.split('\n')
  const totalLines = lines.length

  try {
    if (splitMode.value === 'lines') {
      // 按行数拆分
      const chunkSize = splitByLines.value
      for (let i = 0; i < totalLines; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize).join('\n')
        resultFiles.value.push({
          name: `part_${Math.floor(i / chunkSize) + 1}.txt`,
          content: chunk
        })
      }
    } else {
      // 按大小拆分
      const targetSize = splitBySize.value * (sizeUnit.value === 'MB' ? 1024 * 1024 : 1024)
      let currentChunk = ''
      let currentSize = 0
      let chunkIndex = 0

      for (let i = 0; i < lines.length; i++) {
        const lineWithNewline = lines[i] + '\n'
        const lineSize = new Blob([lineWithNewline]).size

        if (currentSize + lineSize > targetSize && currentChunk) {
          resultFiles.value.push({
            name: `part_${chunkIndex + 1}.txt`,
            content: currentChunk
          })
          chunkIndex++
          currentChunk = lineWithNewline
          currentSize = lineSize
        } else {
          currentChunk += lineWithNewline
          currentSize += lineSize
        }
      }

      if (currentChunk) {
        resultFiles.value.push({
          name: `part_${chunkIndex + 1}.txt`,
          content: currentChunk
        })
      }
    }
  } catch (error) {
    alert('拆分失败: ' + error.message)
  }

  processing.value = false
}

// 合并文件
const mergeFiles = () => {
  if (filesToMerge.value.length === 0) {
    alert('请先添加要合并的文件')
    return
  }

  processing.value = true

  try {
    const merged = filesToMerge.value
      .map(file => file.content)
      .join(mergeSeparator.value)

    resultFiles.value = [{
      name: 'merged.txt',
      content: merged
    }]
  } catch (error) {
    alert('合并失败: ' + error.message)
  }

  processing.value = false
}

// 下载单个文件
const downloadFile = (file) => {
  const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  URL.revokeObjectURL(url)
}

// 下载所有文件
const downloadAll = () => {
  resultFiles.value.forEach(file => downloadFile(file))
}

// 上传文件
const uploadFiles = (event) => {
  const uploadedFiles = event.target.files

  Array.from(uploadedFiles).forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      filesToMerge.value.push({
        name: file.name,
        content: e.target.result
      })
    }
    reader.readAsText(file)
  })

  // 重置input
  event.target.value = ''
}

// 移除待合并文件
const removeMergeFile = (index) => {
  filesToMerge.value.splice(index, 1)
}

// 清空内容
const clearContent = () => {
  if (confirm('确定要清空内容吗？')) {
    fileContent.value = ''
    resultFiles.value = []
    filesToMerge.value = []
  }
}

// 加载示例
const loadSample = () => {
  const sampleLines = []
  for (let i = 1; i <= 5000; i++) {
    sampleLines.push(`这是第 ${i} 行数据 - ${new Date().toISOString()}`)
  }
  fileContent.value = sampleLines.join('\n')
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}
</script>
