<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">MIME类型查询器</h1>
      <p class="text-gray-600 dark:text-gray-400">查询文件扩展名对应的MIME类型，支持反向查询</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium mb-1">搜索MIME类型或扩展名</label>
          <input
            v-model="searchQuery"
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            placeholder="输入扩展名 (如 .jpg) 或 MIME类型 (如 image/jpeg)..."
            @input="search"
          >
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">按类别筛选</label>
          <select v-model="selectedCategory" @change="filterByCategory" class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm">
            <option value="">全部类别</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">
        {{ searchQuery ? '搜索结果' : '常用MIME类型' }}
        <span v-if="filteredTypes.length > 0" class="ml-2 text-sm font-normal text-gray-500">({{ filteredTypes.length }})</span>
      </h2>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-3 text-left text-sm font-medium">扩展名</th>
              <th class="px-4 py-3 text-left text-sm font-medium">MIME类型</th>
              <th class="px-4 py-3 text-left text-sm font-medium">类别</th>
              <th class="px-4 py-3 text-left text-sm font-medium">说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="type in filteredTypes.slice(0, 50)" :key="type.extension" class="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-4 py-3">
                <code class="text-blue-600">{{ type.extension }}</code>
              </td>
              <td class="px-4 py-3">
                <code class="text-green-600">{{ type.mime }}</code>
              </td>
              <td class="px-4 py-3 text-sm">{{ type.category }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ type.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredTypes.length === 0" class="text-center py-8 text-gray-400">
        未找到匹配的MIME类型
      </div>
    </div>

    <!-- 类别快速选择 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">按类别浏览</h2>
      <div class="grid md:grid-cols-4 lg:grid-cols-6 gap-3">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="selectedCategory = cat; filterByCategory()"
          :class="['px-4 py-2 text-sm rounded', selectedCategory === cat ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700']"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- 常用MIME类型参考 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">常用MIME类型速查</h2>
      <div class="grid md:grid-cols-3 gap-6 text-sm">
        <div>
          <h3 class="font-medium mb-2 text-blue-600">图片</h3>
          <div class="space-y-1">
            <div class="flex justify-between"><code>.jpg</code><span>image/jpeg</span></div>
            <div class="flex justify-between"><code>.png</code><span>image/png</span></div>
            <div class="flex justify-between"><code>.gif</code><span>image/gif</span></div>
            <div class="flex justify-between"><code>.svg</code><span>image/svg+xml</span></div>
            <div class="flex justify-between"><code>.webp</code><span>image/webp</span></div>
          </div>
        </div>
        <div>
          <h3 class="font-medium mb-2 text-green-600">视频</h3>
          <div class="space-y-1">
            <div class="flex justify-between"><code>.mp4</code><span>video/mp4</span></div>
            <div class="flex justify-between"><code>.webm</code><span>video/webm</span></div>
            <div class="flex justify-between"><code>.avi</code><span>video/x-msvideo</span></div>
            <div class="flex justify-between"><code>.mov</code><span>video/quicktime</span></div>
          </div>
        </div>
        <div>
          <h3 class="font-medium mb-2 text-orange-600">文档</h3>
          <div class="space-y-1">
            <div class="flex justify-between"><code>.pdf</code><span>application/pdf</span></div>
            <div class="flex justify-between"><code>.doc</code><span>application/msword</span></div>
            <div class="flex justify-between"><code>.xls</code><span>application/vnd.ms-excel</span></div>
            <div class="flex justify-between"><code>.txt</code><span>text/plain</span></div>
          </div>
        </div>
        <div>
          <h3 class="font-medium mb-2 text-purple-600">音频</h3>
          <div class="space-y-1">
            <div class="flex justify-between"><code>.mp3</code><span>audio/mpeg</span></div>
            <div class="flex justify-between"><code>.wav</code><span>audio/wav</span></div>
            <div class="flex justify-between"><code>.ogg</code><span>audio/ogg</span></div>
            <div class="flex justify-between"><code>.m4a</code><span>audio/mp4</span></div>
          </div>
        </div>
        <div>
          <h3 class="font-medium mb-2 text-red-600">数据</h3>
          <div class="space-y-1">
            <div class="flex justify-between"><code>.json</code><span>application/json</span></div>
            <div class="flex justify-between"><code>.xml</code><span>application/xml</span></div>
            <div class="flex justify-between"><code>.yaml</code><span>application/x-yaml</span></div>
            <div class="flex justify-between"><code>.csv</code><span>text/csv</span></div>
          </div>
        </div>
        <div>
          <h3 class="font-medium mb-2 text-gray-600">字体</h3>
          <div class="space-y-1">
            <div class="flex justify-between"><code>.ttf</code><span>font/ttf</span></div>
            <div class="flex justify-between"><code>.otf</code><span>font/otf</span></div>
            <div class="flex justify-between"><code>.woff</code><span>font/woff</span></div>
            <div class="flex justify-between"><code>.woff2</code><span>font/woff2</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'MIME类型查询器 - 文件扩展名MIME类型对照',
  meta: [{ name: 'description', content: '在线MIME类型查询工具，查询文件扩展名对应的MIME类型，支持反向查询和类别筛选。' }],
  keywords: ['MIME类型', '文件类型', 'Content-Type', 'MIME查询', '扩展名']
})

interface MimeType {
  extension: string
  mime: string
  category: string
  description: string
}

const searchQuery = ref('')
const selectedCategory = ref('')

const mimeTypes: MimeType[] = [
  // 图片
  { extension: '.jpg', mime: 'image/jpeg', category: '图片', description: 'JPEG图片' },
  { extension: '.jpeg', mime: 'image/jpeg', category: '图片', description: 'JPEG图片' },
  { extension: '.png', mime: 'image/png', category: '图片', description: 'PNG图片' },
  { extension: '.gif', mime: 'image/gif', category: '图片', description: 'GIF图片' },
  { extension: '.svg', mime: 'image/svg+xml', category: '图片', description: 'SVG矢量图' },
  { extension: '.webp', mime: 'image/webp', category: '图片', description: 'WebP图片' },
  { extension: '.ico', mime: 'image/x-icon', category: '图片', description: '图标文件' },
  { extension: '.bmp', mime: 'image/bmp', category: '图片', description: '位图' },
  // 视频
  { extension: '.mp4', mime: 'video/mp4', category: '视频', description: 'MP4视频' },
  { extension: '.webm', mime: 'video/webm', category: '视频', description: 'WebM视频' },
  { extension: '.avi', mime: 'video/x-msvideo', category: '视频', description: 'AVI视频' },
  { extension: '.mov', mime: 'video/quicktime', category: '视频', description: 'QuickTime视频' },
  { extension: '.wmv', mime: 'video/x-ms-wmv', category: '视频', description: 'Windows Media' },
  { extension: '.flv', mime: 'video/x-flv', category: '视频', description: 'Flash视频' },
  // 音频
  { extension: '.mp3', mime: 'audio/mpeg', category: '音频', description: 'MP3音频' },
  { extension: '.wav', mime: 'audio/wav', category: '音频', description: 'WAV音频' },
  { extension: '.ogg', mime: 'audio/ogg', category: '音频', description: 'OGG音频' },
  { extension: '.m4a', mime: 'audio/mp4', category: '音频', description: 'M4A音频' },
  { extension: '.flac', mime: 'audio/flac', category: '音频', description: 'FLAC无损音频' },
  // 文档
  { extension: '.pdf', mime: 'application/pdf', category: '文档', description: 'PDF文档' },
  { extension: '.doc', mime: 'application/msword', category: '文档', description: 'Word文档' },
  { extension: '.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: '文档', description: 'Word文档' },
  { extension: '.xls', mime: 'application/vnd.ms-excel', category: '文档', description: 'Excel表格' },
  { extension: '.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: '文档', description: 'Excel表格' },
  { extension: '.ppt', mime: 'application/vnd.ms-powerpoint', category: '文档', description: 'PowerPoint演示' },
  { extension: '.txt', mime: 'text/plain', category: '文档', description: '纯文本' },
  // 数据
  { extension: '.json', mime: 'application/json', category: '数据', description: 'JSON数据' },
  { extension: '.xml', mime: 'application/xml', category: '数据', description: 'XML数据' },
  { extension: '.yaml', mime: 'application/x-yaml', category: '数据', description: 'YAML配置' },
  { extension: '.yml', mime: 'application/x-yaml', category: '数据', description: 'YAML配置' },
  { extension: '.csv', mime: 'text/csv', category: '数据', description: 'CSV数据' },
  { extension: '.sql', mime: 'application/x-sql', category: '数据', description: 'SQL脚本' },
  // 压缩
  { extension: '.zip', mime: 'application/zip', category: '压缩', description: 'ZIP压缩' },
  { extension: '.rar', mime: 'application/x-rar', category: '压缩', description: 'RAR压缩' },
  { extension: '.7z', mime: 'application/x-7z', category: '压缩', description: '7Z压缩' },
  { extension: '.tar', mime: 'application/x-tar', category: '压缩', description: 'TAR归档' },
  { extension: '.gz', mime: 'application/gzip', category: '压缩', description: 'GZIP压缩' },
  // 字体
  { extension: '.ttf', mime: 'font/ttf', category: '字体', description: 'TrueType字体' },
  { extension: '.otf', mime: 'font/otf', category: '字体', description: 'OpenType字体' },
  { extension: '.woff', mime: 'font/woff', category: '字体', description: 'Web OpenFont' },
  { extension: '.woff2', mime: 'font/woff2', category: '字体', description: 'Web OpenFont 2' },
  { extension: '.eot', mime: 'application/vnd.ms-fontobject', category: '字体', description: 'Embedded OpenType' }
]

const categories = [...new Set(mimeTypes.map(t => t.category))]

const filteredTypes = computed(() => {
  let results = mimeTypes

  // 类别筛选
  if (selectedCategory.value) {
    results = results.filter(t => t.category === selectedCategory.value)
  }

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    results = results.filter(t =>
      t.extension.toLowerCase().includes(query) ||
      t.mime.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    )
  }

  return results
})

function search() {
  // 触发computed重新计算
}

function filterByCategory() {
  // 触发computed重新计算
}
</script>
