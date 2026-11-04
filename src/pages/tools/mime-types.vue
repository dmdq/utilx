<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">MIME类型查询工具 - 在线文件类型识别与查询</h1>
      <p class="text-muted-foreground">专业的MIME类型查询工具，支持按文件扩展名或MIME类型搜索，提供详细的文件类型信息、使用场景和代码示例。帮助开发者正确配置服务器和处理文件上传。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      <!-- 左侧搜索 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- 搜索区域 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Search class="h-5 w-5 mr-2 text-primary" />
            搜索 MIME 类型
          </h2>

          <div class="space-y-4">
            <!-- 搜索模式 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">搜索模式</label>
              <div class="flex space-x-4">
                <label class="flex items-center">
                  <input
                    v-model="searchMode"
                    type="radio"
                    value="extension"
                    class="mr-2 border border-border text-primary focus:ring-primary bg-background"
                  />
                  <span class="text-sm text-foreground">按扩展名</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="searchMode"
                    type="radio"
                    value="mime"
                    class="mr-2 border border-border text-primary focus:ring-primary bg-background"
                  />
                  <span class="text-sm text-foreground">按 MIME 类型</span>
                </label>
              </div>
            </div>

            <!-- 搜索输入 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                {{ searchMode === 'extension' ? '文件扩展名' : 'MIME 类型' }}
              </label>
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="searchMode === 'extension' ? '例如: pdf, jpg, json' : '例如: application/json'"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                @keyup.enter="search"
              />
            </div>

            <!-- 快速选择 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">快速选择</label>
              <select
                @change="quickSelect"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              >
                <option value="">选择常见类型...</option>
                <optgroup label="文档">
                  <option value="pdf">PDF</option>
                  <option value="doc">Word 文档</option>
                  <option value="xls">Excel 表格</option>
                  <option value="ppt">PowerPoint</option>
                </optgroup>
                <optgroup label="图片">
                  <option value="jpg">JPEG 图片</option>
                  <option value="png">PNG 图片</option>
                  <option value="gif">GIF 动图</option>
                  <option value="svg">SVG 矢量图</option>
                </optgroup>
                <optgroup label="音频">
                  <option value="mp3">MP3 音频</option>
                  <option value="wav">WAV 音频</option>
                  <option value="ogg">OGG 音频</option>
                </optgroup>
                <optgroup label="视频">
                  <option value="mp4">MP4 视频</option>
                  <option value="avi">AVI 视频</option>
                  <option value="mov">MOV 视频</option>
                </optgroup>
                <optgroup label="代码">
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="js">JavaScript</option>
                  <option value="json">JSON</option>
                </optgroup>
              </select>
            </div>

            <!-- 搜索按钮 -->
            <button
              @click="search"
              :disabled="!searchQuery"
              class="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Search class="h-5 w-5 mr-2" />
              搜索
            </button>
          </div>
        </div>

        <!-- 搜索结果统计 -->
        <div v-if="searchResults.length > 0" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <BarChart class="h-5 w-5 mr-2 text-primary" />
            搜索结果
          </h2>

          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ searchResults.length }}</div>
            <div class="text-sm text-muted-foreground">个匹配项</div>
          </div>
        </div>

        <!-- 热门 MIME 类型 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <TrendingUp class="h-5 w-5 mr-2 text-primary" />
            热门 MIME 类型
          </h2>

          <div class="space-y-2">
            <button
              v-for="type in popularMimeTypes"
              :key="type.extension"
              @click="selectPopularType(type)"
              class="w-full text-left px-3 py-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-foreground">.{{ type.extension }}</span>
                <span class="text-xs text-muted-foreground">{{ type.mime }}</span>
              </div>
              <div class="text-xs text-muted-foreground">{{ type.description }}</div>
            </button>
          </div>
        </div>

        <!-- MIME 类型分类 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Folder class="h-5 w-5 mr-2 text-primary" />
            按分类浏览
          </h2>

          <div class="space-y-2">
            <button
              v-for="category in mimeCategories"
              :key="category.name"
              @click="browseCategory(category)"
              class="w-full text-left px-3 py-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-foreground">{{ category.name }}</span>
                <span class="text-xs text-muted-foreground">{{ category.count }} 项</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧结果展示 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 搜索结果列表 -->
        <div v-if="searchResults.length > 0" class="bg-card border border-border rounded-lg">
          <div class="p-6 border-b border-border">
            <h3 class="text-lg font-semibold flex items-center text-foreground">
              <List class="h-5 w-5 mr-2 text-primary" />
              搜索结果
            </h3>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-border">
              <thead class="bg-muted">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">扩展名</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">MIME 类型</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">描述</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">分类</th>
                </tr>
              </thead>
              <tbody class="bg-card divide-y divide-border">
                <tr
                  v-for="item in searchResults"
                  :key="item.extension + item.mime"
                  class="hover:bg-muted cursor-pointer"
                  @click="showDetail(item)"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    .{{ item.extension }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                    {{ item.mime }}
                  </td>
                  <td class="px-6 py-4 text-sm text-muted-foreground">
                    {{ item.description }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <span class="px-2 py-1 text-xs rounded-full bg-muted">
                      {{ item.category }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 详细信息 -->
        <div v-if="selectedMime" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Info class="h-5 w-5 mr-2 text-primary" />
            详细信息
          </h3>

          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-muted rounded-lg">
                <div class="text-xs text-muted-foreground mb-1">文件扩展名</div>
                <div class="text-lg font-semibold text-foreground">.{{ selectedMime.extension }}</div>
              </div>
              <div class="p-4 bg-muted rounded-lg">
                <div class="text-xs text-muted-foreground mb-1">MIME 类型</div>
                <div class="text-lg font-mono text-foreground">{{ selectedMime.mime }}</div>
              </div>
            </div>

            <div class="p-4 bg-muted rounded-lg">
              <div class="text-xs text-muted-foreground mb-1">描述</div>
              <div class="text-sm text-foreground">{{ selectedMime.description }}</div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-muted rounded-lg">
                <div class="text-xs text-muted-foreground mb-1">分类</div>
                <div class="text-sm text-foreground">{{ selectedMime.category }}</div>
              </div>
              <div class="p-4 bg-muted rounded-lg">
                <div class="text-xs text-muted-foreground mb-1">常见扩展名</div>
                <div class="text-sm text-foreground">{{ selectedMime.commonExtensions?.join(', ') || selectedMime.extension }}</div>
              </div>
            </div>

            <!-- 代码示例 -->
            <div>
              <h4 class="text-sm font-medium text-foreground mb-2">代码示例</h4>
              <div class="space-y-3">
                <div>
                  <div class="text-xs text-muted-foreground mb-1">HTML</div>
                  <pre class="bg-muted p-2 rounded text-sm overflow-x-auto"><code class="text-foreground">&lt;input type="file" accept="{{ selectedMime.mime }}" /&gt;</code></pre>
                </div>
                <div>
                  <div class="text-xs text-muted-foreground mb-1">Apache 配置</div>
                  <pre class="bg-muted p-2 rounded text-sm overflow-x-auto"><code class="text-foreground">AddType {{ selectedMime.mime }} .{{ selectedMime.extension }}</code></pre>
                </div>
                <div>
                  <div class="text-xs text-muted-foreground mb-1">Nginx 配置</div>
                  <pre class="bg-muted p-2 rounded text-sm overflow-x-auto"><code class="text-foreground">types { {{ selectedMime.mime }} {{ selectedMime.extension }}; }</code></pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="searchQuery && searchResults.length === 0" class="bg-card border border-border rounded-lg p-12">
          <div class="text-center">
            <SearchX class="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p class="text-lg text-foreground mb-2">未找到匹配的 MIME 类型</p>
            <p class="text-muted-foreground">请尝试其他搜索关键词</p>
          </div>
        </div>

        <!-- 提示 -->
        <div v-if="!searchQuery" class="bg-card border border-border rounded-lg p-12">
          <div class="text-center">
            <Search class="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p class="text-lg text-foreground mb-2">搜索 MIME 类型</p>
            <p class="text-muted-foreground">输入文件扩展名或 MIME 类型进行查询</p>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
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
          什么是 MIME 类型？
        </h2>
        <p class="text-muted-foreground mb-4">
          MIME (Multipurpose Internet Mail Extensions) 类型是一种标准，用来表示文档、文件或字节流的性质和格式。
          它最初是为电子邮件设计的，但现在广泛应用于 Web 开发中，用于标识文件类型和内容格式。
        </p>
        <p class="text-muted-foreground mb-4">
          MIME 类型由类型和子类型两部分组成，用斜杠分隔，例如：application/json。
          正确设置 MIME 类型对于 Web 服务器、浏览器和应用程序正确处理文件至关重要。
        </p>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          MIME 类型结构
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>type</strong>：表示大类别，如 text、image、application</li>
          <li><strong>subtype</strong>：表示确切的数据格式，如 html、jpeg、json</li>
          <li><strong>parameter</strong>：可选参数，如 charset=UTF-8</li>
        </ul>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见 MIME 类型
        </h2>
        <div class="bg-muted p-4 rounded mb-6">
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li><strong>text/</strong> - 文本文件（text/html, text/css, text/javascript）</li>
            <li><strong>image/</strong> - 图像文件（image/jpeg, image/png, image/gif）</li>
            <li><strong>audio/</strong> - 音频文件（audio/mpeg, audio/wav）</li>
            <li><strong>video/</strong> - 视频文件（video/mp4, video/quicktime）</li>
            <li><strong>application/</strong> - 二进制文件（application/pdf, application/json）</li>
          </ul>
        </div>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>全面覆盖</strong>: 收录超过100种常见文件类型的 MIME 信息</li>
          <li><strong>双向搜索</strong>: 支持按文件扩展名或 MIME 类型两种方式查询</li>
          <li><strong>详细信息</strong>: 提供完整的 MIME 类型信息，包括描述、分类和常见扩展名</li>
          <li><strong>代码示例</strong>: 提供 HTML、Apache、Nginx 等环境下的配置示例</li>
          <li><strong>分类浏览</strong>: 按文档、图片、音频、视频等分类浏览 MIME 类型</li>
          <li><strong>热门推荐</strong>: 展示最常用的 MIME 类型，快速查找</li>
        </ul>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          使用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>Web 服务器配置</strong>: 正确配置文件类型映射，确保浏览器正确解析文件</li>
          <li><strong>HTTP 响应头</strong>: 设置 Content-Type 响应头，告知客户端文件类型</li>
          <li><strong>文件上传限制</strong>: 在 HTML 表单中使用 accept 属性限制可上传的文件类型</li>
          <li><strong>Email 附件</strong>: 标识邮件附件的类型，确保正确处理</li>
          <li><strong>API 开发</strong>: 在 RESTful API 中正确设置响应内容类型</li>
          <li><strong>前端开发</strong>: 根据文件类型进行不同的处理逻辑</li>
        </ul>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么需要设置正确的 MIME 类型？</h3>
            <p class="text-muted-foreground mt-1">
              正确设置 MIME 类型对于 Web 应用至关重要。如果服务器返回错误的 MIME 类型，
              浏览器可能无法正确解析文件，导致安全风险或功能异常。例如，JavaScript 文件被错误地标记为文本文件，
              浏览器就不会执行它，影响网站功能。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何在服务器中配置 MIME 类型？</h3>
            <p class="text-muted-foreground mt-1">
              不同的服务器有不同的配置方式。在 Apache 中可以通过 AddType 指令配置，
              在 Nginx 中可以通过 types 块配置。大多数现代服务器都有默认的 MIME 类型映射，
              但有时需要手动添加自定义类型。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">浏览器如何处理 MIME 类型？</h3>
            <p class="text-muted-foreground mt-1">
              浏览器根据服务器返回的 Content-Type 响应头来决定如何处理文件。
              如果没有设置 Content-Type，浏览器可能会尝试根据文件扩展名猜测类型，
              或者直接提示用户下载文件。对于安全性要求高的内容，浏览器还会进行 MIME 类型嗅探检查。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是 MIME 嗅探？</h3>
            <p class="text-muted-foreground mt-1">
              MIME 嗅探是浏览器在服务器未提供或提供了错误的 Content-Type 时，
              尝试通过检查文件内容来推断其真实类型的过程。虽然这提高了兼容性，
              但也带来了安全风险，因此现代浏览器通常会限制或禁用 MIME 嗅探。
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
              :is="iconMap[relatedTool.icon] || Search" 
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
import { ref, onMounted } from 'vue'
import { useSeoMeta } from 'nuxt/app'
import { 
  Search, BarChart, TrendingUp, Folder, List, Info, BookOpen,
  SearchX, HelpCircle, ChevronUp, FileType
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: 'MIME类型查询工具 - 在线文件类型识别与查询',
  meta: [
    { name: 'description', content: '免费在线MIME类型查询工具，支持按文件扩展名或MIME类型搜索，提供详细的文件类型信息、使用场景和代码示例。帮助开发者正确配置服务器和处理文件上传。' },
    { name: 'keywords', content: 'MIME类型,文件类型查询,文件扩展名,MIME搜索,Content-Type,文件格式,服务器配置' }
  ]
})

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'mime-types')
const category = categories.find(c => c.id === 'network')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 响应式数据
const searchMode = ref('extension')
const searchQuery = ref('')
const searchResults = ref([])
const selectedMime = ref(null)

// 图标映射
const iconMap = {
  Search, BarChart, TrendingUp, Folder, List, Info, BookOpen,
  SearchX, HelpCircle, ChevronUp, FileType
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t => 
    t.category === 'network' && t.id !== 'mime-types'
  ).slice(0, 2)
  
  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'user-agent-parser'),
    tools.find(t => t.id === 'http-client'),
    tools.find(t => t.id === 'dns-lookup'),
    tools.find(t => t.id === 'port-checker')
  ].filter(Boolean)
  
  return [...sameCategory, ...recommended].slice(0, 4)
})

// MIME 类型数据库
const mimeDatabase = [
  // 文档类型
  { extension: 'pdf', mime: 'application/pdf', description: 'PDF 文档', category: '文档', commonExtensions: ['pdf'] },
  { extension: 'doc', mime: 'application/msword', description: 'Microsoft Word 文档', category: '文档', commonExtensions: ['doc', 'dot'] },
  { extension: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', description: 'Microsoft Word 文档', category: '文档', commonExtensions: ['docx'] },
  { extension: 'xls', mime: 'application/vnd.ms-excel', description: 'Microsoft Excel 表格', category: '文档', commonExtensions: ['xls', 'xlt', 'xlm'] },
  { extension: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', description: 'Microsoft Excel 表格', category: '文档', commonExtensions: ['xlsx'] },
  { extension: 'ppt', mime: 'application/vnd.ms-powerpoint', description: 'Microsoft PowerPoint 演示文稿', category: '文档', commonExtensions: ['ppt', 'pps', 'pot'] },
  { extension: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', description: 'Microsoft PowerPoint 演示文稿', category: '文档', commonExtensions: ['pptx'] },
  { extension: 'txt', mime: 'text/plain', description: '纯文本文件', category: '文档', commonExtensions: ['txt', 'text', 'conf', 'def', 'list', 'log', 'in'] },
  { extension: 'rtf', mime: 'application/rtf', description: '富文本格式', category: '文档', commonExtensions: ['rtf'] },
  { extension: 'odt', mime: 'application/vnd.oasis.opendocument.text', description: 'OpenDocument 文本文档', category: '文档', commonExtensions: ['odt'] },
  { extension: 'ods', mime: 'application/vnd.oasis.opendocument.spreadsheet', description: 'OpenDocument 电子表格', category: '文档', commonExtensions: ['ods'] },
  { extension: 'odp', mime: 'application/vnd.oasis.opendocument.presentation', description: 'OpenDocument 演示文稿', category: '文档', commonExtensions: ['odp'] },

  // 图片类型
  { extension: 'jpg', mime: 'image/jpeg', description: 'JPEG 图片', category: '图片', commonExtensions: ['jpg', 'jpeg', 'jpe'] },
  { extension: 'png', mime: 'image/png', description: 'PNG 图片', category: '图片', commonExtensions: ['png'] },
  { extension: 'gif', mime: 'image/gif', description: 'GIF 图片', category: '图片', commonExtensions: ['gif'] },
  { extension: 'webp', mime: 'image/webp', description: 'WebP 图片', category: '图片', commonExtensions: ['webp'] },
  { extension: 'svg', mime: 'image/svg+xml', description: 'SVG 矢量图', category: '图片', commonExtensions: ['svg', 'svgz'] },
  { extension: 'ico', mime: 'image/x-icon', description: '图标文件', category: '图片', commonExtensions: ['ico'] },
  { extension: 'bmp', mime: 'image/bmp', description: '位图文件', category: '图片', commonExtensions: ['bmp', 'dib'] },
  { extension: 'tiff', mime: 'image/tiff', description: 'TIFF 图片', category: '图片', commonExtensions: ['tiff', 'tif'] },
  { extension: 'psd', mime: 'image/vnd.adobe.photoshop', description: 'Photoshop 文档', category: '图片', commonExtensions: ['psd'] },

  // 音频类型
  { extension: 'mp3', mime: 'audio/mpeg', description: 'MP3 音频', category: '音频', commonExtensions: ['mp3'] },
  { extension: 'wav', mime: 'audio/wav', description: 'WAV 音频', category: '音频', commonExtensions: ['wav'] },
  { extension: 'ogg', mime: 'audio/ogg', description: 'OGG 音频', category: '音频', commonExtensions: ['ogg', 'oga'] },
  { extension: 'aac', mime: 'audio/aac', description: 'AAC 音频', category: '音频', commonExtensions: ['aac'] },
  { extension: 'flac', mime: 'audio/flac', description: 'FLAC 音频', category: '音频', commonExtensions: ['flac'] },
  { extension: 'm4a', mime: 'audio/mp4', description: 'M4A 音频', category: '音频', commonExtensions: ['m4a'] },
  { extension: 'wma', mime: 'audio/x-ms-wma', description: 'Windows Media Audio', category: '音频', commonExtensions: ['wma'] },
  { extension: 'midi', mime: 'audio/midi', description: 'MIDI 音频', category: '音频', commonExtensions: ['midi', 'mid'] },

  // 视频类型
  { extension: 'mp4', mime: 'video/mp4', description: 'MP4 视频', category: '视频', commonExtensions: ['mp4', 'mp4v', 'mpg4'] },
  { extension: 'avi', mime: 'video/x-msvideo', description: 'AVI 视频', category: '视频', commonExtensions: ['avi'] },
  { extension: 'mov', mime: 'video/quicktime', description: 'QuickTime 视频', category: '视频', commonExtensions: ['mov', 'qt'] },
  { extension: 'wmv', mime: 'video/x-ms-wmv', description: 'Windows Media Video', category: '视频', commonExtensions: ['wmv'] },
  { extension: 'flv', mime: 'video/x-flv', description: 'Flash 视频', category: '视频', commonExtensions: ['flv'] },
  { extension: 'webm', mime: 'video/webm', description: 'WebM 视频', category: '视频', commonExtensions: ['webm'] },
  { extension: 'mkv', mime: 'video/x-matroska', description: 'Matroska 视频', category: '视频', commonExtensions: ['mkv', 'mk3d', 'mks'] },
  { extension: '3gp', mime: 'video/3gpp', description: '3GP 视频', category: '视频', commonExtensions: ['3gp'] },
  { extension: 'mpeg', mime: 'video/mpeg', description: 'MPEG 视频', category: '视频', commonExtensions: ['mpeg', 'mpg', 'mpe'] },

  // Web 类型
  { extension: 'html', mime: 'text/html', description: 'HTML 文档', category: 'Web', commonExtensions: ['html', 'htm'] },
  { extension: 'css', mime: 'text/css', description: 'CSS 样式表', category: 'Web', commonExtensions: ['css'] },
  { extension: 'js', mime: 'application/javascript', description: 'JavaScript 文件', category: 'Web', commonExtensions: ['js', 'mjs'] },
  { extension: 'json', mime: 'application/json', description: 'JSON 数据', category: 'Web', commonExtensions: ['json', 'map'] },
  { extension: 'xml', mime: 'application/xml', description: 'XML 文档', category: 'Web', commonExtensions: ['xml', 'xsl', 'xsd', 'xslt'] },
  { extension: 'rss', mime: 'application/rss+xml', description: 'RSS 订阅源', category: 'Web', commonExtensions: ['rss'] },
  { extension: 'atom', mime: 'application/atom+xml', description: 'Atom 订阅源', category: 'Web', commonExtensions: ['atom'] },
  { extension: 'woff', mime: 'font/woff', description: 'WOFF 字体', category: 'Web', commonExtensions: ['woff'] },
  { extension: 'woff2', mime: 'font/woff2', description: 'WOFF2 字体', category: 'Web', commonExtensions: ['woff2'] },
  { extension: 'ttf', mime: 'font/ttf', description: 'TrueType 字体', category: 'Web', commonExtensions: ['ttf', 'ttc'] },
  { extension: 'eot', mime: 'application/vnd.ms-fontobject', description: 'Embedded OpenType 字体', category: 'Web', commonExtensions: ['eot'] },
  { extension: 'zip', mime: 'application/zip', description: 'ZIP 压缩文件', category: 'Web', commonExtensions: ['zip'] },
  { extension: 'rar', mime: 'application/x-rar-compressed', description: 'RAR 压缩文件', category: 'Web', commonExtensions: ['rar'] },
  { extension: 'tar', mime: 'application/x-tar', description: 'TAR 压缩文件', category: 'Web', commonExtensions: ['tar'] },
  { extension: 'gz', mime: 'application/gzip', description: 'GZIP 压缩文件', category: 'Web', commonExtensions: ['gz', 'gzip'] },
  { extension: '7z', mime: 'application/x-7z-compressed', description: '7-Zip 压缩文件', category: 'Web', commonExtensions: ['7z'] },

  // 应用程序
  { extension: 'exe', mime: 'application/x-msdownload', description: 'Windows 可执行文件', category: '应用程序', commonExtensions: ['exe', 'dll', 'msi'] },
  { extension: 'dmg', mime: 'application/x-apple-diskimage', description: 'Apple 磁盘映像', category: '应用程序', commonExtensions: ['dmg'] },
  { extension: 'pkg', mime: 'application/x-newton-compatible-pkg', description: 'Apple 安装包', category: '应用程序', commonExtensions: ['pkg'] },
  { extension: 'deb', mime: 'application/x-debian-package', description: 'Debian 软件包', category: '应用程序', commonExtensions: ['deb', 'udeb'] },
  { extension: 'rpm', mime: 'application/x-rpm', description: 'RPM 软件包', category: '应用程序', commonExtensions: ['rpm'] },
  { extension: 'apk', mime: 'application/vnd.android.package-archive', description: 'Android 应用包', category: '应用程序', commonExtensions: ['apk'] },
  { extension: 'ipa', mime: 'application/x-itunes-ipa', description: 'iOS 应用包', category: '应用程序', commonExtensions: ['ipa'] },

  // 其他
  { extension: 'csv', mime: 'text/csv', description: 'CSV 文件', category: '其他', commonExtensions: ['csv'] },
  { extension: 'ics', mime: 'text/calendar', description: '日历文件', category: '其他', commonExtensions: ['ics', 'icz'] },
  { extension: 'torrent', mime: 'application/x-bittorrent', description: 'BitTorrent 文件', category: '其他', commonExtensions: ['torrent'] },
  { extension: 'sql', mime: 'application/sql', description: 'SQL 文件', category: '其他', commonExtensions: ['sql'] }
]

// 热门 MIME 类型
const popularMimeTypes = [
  { extension: 'pdf', mime: 'application/pdf', description: 'PDF 文档' },
  { extension: 'jpg', mime: 'image/jpeg', description: 'JPEG 图片' },
  { extension: 'png', mime: 'image/png', description: 'PNG 图片' },
  { extension: 'mp4', mime: 'video/mp4', description: 'MP4 视频' },
  { extension: 'mp3', mime: 'audio/mpeg', description: 'MP3 音频' },
  { extension: 'zip', mime: 'application/zip', description: 'ZIP 压缩包' },
  { extension: 'json', mime: 'application/json', description: 'JSON 数据' },
  { extension: 'html', mime: 'text/html', description: 'HTML 文档' }
]

// MIME 类型分类
const mimeCategories = [
  { name: '文档', count: 13 },
  { name: '图片', count: 9 },
  { name: '音频', count: 8 },
  { name: '视频', count: 9 },
  { name: 'Web', count: 13 },
  { name: '应用程序', count: 7 },
  { name: '其他', count: 4 }
]

// 方法
const search = () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  const query = searchQuery.value.toLowerCase().trim()

  if (searchMode.value === 'extension') {
    // 移除点号（如果有）
    const ext = query.startsWith('.') ? query.slice(1) : query
    searchResults.value = mimeDatabase.filter(item =>
      item.extension.toLowerCase().includes(ext) ||
      item.commonExtensions?.some(e => e.toLowerCase().includes(ext))
    )
  } else {
    searchResults.value = mimeDatabase.filter(item =>
      item.mime.toLowerCase().includes(query)
    )
  }
}

const quickSelect = (event) => {
  const value = event.target.value
  if (!value) return

  searchMode.value = 'extension'
  searchQuery.value = value
  search()
  event.target.value = ''
}

const selectPopularType = (type) => {
  searchMode.value = 'extension'
  searchQuery.value = type.extension
  search()
  showDetail(type)
}

const browseCategory = (category) => {
  searchResults.value = mimeDatabase.filter(item => item.category === category.name)
}

const showDetail = (item) => {
  selectedMime.value = item
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 生命周期
onMounted(() => {
  // 初始加载可以显示一些默认的 MIME 类型
  searchResults.value = popularMimeTypes
})
</script>