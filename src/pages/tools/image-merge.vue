<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">图片合并工具 - 在线合并多张图片</h1>
      <p class="text-muted-foreground">专业的在线图片合并工具，支持水平、垂直、网格等多种布局方式，可自定义间距和背景颜色，轻松将多张图片合并成一张。适用于设计师、开发者和内容创作者。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      <!-- 左侧控制面板 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- 上传区域 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Upload class="h-5 w-5 mr-2 text-primary" />
            上传图片
          </h2>

          <div
            class="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
            @click="triggerFileInput"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onDrop"
          >
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept="image/*"
              @change="onFileSelect"
              multiple
            />

            <div v-if="!images.length" class="space-y-3">
              <Layers class="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p class="text-muted-foreground">点击或拖拽图片到这里</p>
                <p class="text-sm text-muted-foreground/70 mt-1">支持 JPG、PNG、WebP 等格式</p>
                <p class="text-sm text-primary mt-1">至少需要 2 张图片</p>
              </div>
            </div>

            <div v-else class="space-y-2">
              <CheckCircle class="h-12 w-12 text-green-500 mx-auto" />
              <p class="text-green-500 font-medium">{{ images.length }} 张图片已上传</p>
              <button
                @click.stop="clearImages"
                class="text-sm text-destructive hover:text-destructive/80"
              >
                清除所有
              </button>
            </div>
          </div>
        </div>

        <!-- 合并设置 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Settings class="h-5 w-5 mr-2 text-primary" />
            合并设置
          </h2>

          <div class="space-y-4">
            <!-- 布局方式 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">布局方式</label>
              <select
                v-model="layoutMode"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              >
                <option value="horizontal">水平排列</option>
                <option value="vertical">垂直排列</option>
                <option value="grid">网格布局</option>
                <option value="custom">自定义排列</option>
              </select>
            </div>

            <!-- 网格列数 -->
            <div v-if="layoutMode === 'grid'">
              <label class="block text-sm font-medium text-foreground mb-2">
                网格列数: {{ gridCols }}
              </label>
              <input
                v-model.number="gridCols"
                type="range"
                min="2"
                max="5"
                class="w-full"
              />
            </div>

            <!-- 图片间距 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                图片间距: {{ spacing }}px
              </label>
              <input
                v-model.number="spacing"
                type="range"
                min="0"
                max="50"
                class="w-full"
              />
            </div>

            <!-- 背景颜色 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">背景颜色</label>
              <div class="flex space-x-2">
                <input
                  v-model="backgroundColor"
                  type="color"
                  class="h-10 w-20 border border-border border-border rounded-md cursor-pointer bg-background"
                />
                <input
                  v-model="backgroundColor"
                  type="text"
                  class="flex-1 px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            <!-- 对齐方式 -->
            <div v-if="layoutMode === 'horizontal' || layoutMode === 'vertical'">
              <label class="block text-sm font-medium text-foreground mb-2">对齐方式</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="align in alignOptions"
                  :key="align.value"
                  @click="alignment = align.value"
                  :class="[
                    'px-3 py-2 text-sm rounded-md border transition-colors',
                    alignment === align.value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-muted border-border text-foreground hover:bg-muted/80'
                  ]"
                >
                  {{ align.label }}
                </button>
              </div>
            </div>

            <!-- 输出尺寸 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">输出尺寸</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input
                    v-model="sizeMode"
                    type="radio"
                    value="auto"
                    class="mr-2 rounded border border-border text-primary focus:ring-primary bg-background"
                  />
                  <span class="text-sm text-foreground">自动计算</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="sizeMode"
                    type="radio"
                    value="custom"
                    class="mr-2 rounded border border-border text-primary focus:ring-primary bg-background"
                  />
                  <span class="text-sm text-foreground">自定义尺寸</span>
                </label>
              </div>

              <div v-if="sizeMode === 'custom'" class="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs text-muted-foreground mb-1">宽度 (px)</label>
                  <input
                    v-model.number="outputWidth"
                    type="number"
                    min="100"
                    class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="宽度"
                  />
                </div>
                <div>
                  <label class="block text-xs text-muted-foreground mb-1">高度 (px)</label>
                  <input
                    v-model.number="outputHeight"
                    type="number"
                    min="100"
                    class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="高度"
                  />
                </div>
              </div>
            </div>

            <!-- 输出格式 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">输出格式</label>
              <select
                v-model="outputFormat"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            <!-- JPEG质量 -->
            <div v-if="outputFormat === 'jpeg'">
              <label class="block text-sm font-medium text-foreground mb-2">
                图片质量: {{ quality }}%
              </label>
              <input
                v-model="quality"
                type="range"
                min="10"
                max="100"
                step="5"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <button
            @click="mergeImages"
            :disabled="images.length < 2 || processing"
            class="w-full bg-primary text-primary-foreground py-3 px-4 rounded-md hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Loader2 v-if="processing" class="h-5 w-5 mr-2 animate-spin" />
            <Layers v-else class="h-5 w-5 mr-2" />
            {{ processing ? '处理中...' : '合并图片' }}
          </button>

          <button
            v-if="mergedImage"
            @click="downloadImage"
            class="w-full mt-3 bg-secondary text-secondary-foreground py-3 px-4 rounded-md hover:bg-secondary/90 transition-colors flex items-center justify-center"
          >
            <Download class="h-5 w-5 mr-2" />
            下载合并结果
          </button>
        </div>
      </div>

      <!-- 右侧预览区域 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 图片列表 -->
        <div v-if="images.length > 0" class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold flex items-center text-foreground">
              <Images class="h-5 w-5 mr-2 text-primary" />
              图片列表 ({{ images.length }})
            </h3>
            <div class="flex space-x-2">
              <button
                @click="reorderImages('up')"
                :disabled="selectedIndex === null || selectedIndex === 0"
                class="p-2 text-muted-foreground hover:bg-muted rounded-md disabled:opacity-50"
              >
                <ArrowUp class="h-4 w-4" />
              </button>
              <button
                @click="reorderImages('down')"
                :disabled="selectedIndex === null || selectedIndex === images.length - 1"
                class="p-2 text-muted-foreground hover:bg-muted rounded-md disabled:opacity-50"
              >
                <ArrowDown class="h-4 w-4" />
              </button>
              <button
                @click="removeImage"
                :disabled="selectedIndex === null"
                class="p-2 text-destructive hover:bg-destructive/10 rounded-md disabled:opacity-50"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div
              v-for="(image, index) in images"
              :key="index"
              class="relative group cursor-pointer"
              @click="selectImage(index)"
            >
              <div class="relative">
                <img
                  :src="image.preview"
                  :alt="image.file.name"
                  class="w-full h-32 object-cover rounded-lg border-2 transition-all"
                  :class="[
                    selectedIndex === index
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border group-hover:border-muted-foreground'
                  ]"
                />

                <!-- 序号 -->
                <div class="absolute top-2 left-2 bg-background/80 backdrop-blur text-foreground text-xs px-2 py-1 rounded">
                  {{ index + 1 }}
                </div>

                <!-- 删除按钮 -->
                <button
                  @click.stop="removeImageAt(index)"
                  class="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X class="h-3 w-3" />
                </button>
              </div>

              <!-- 图片信息 -->
              <div class="mt-2">
                <div class="text-xs text-muted-foreground truncate">{{ image.file.name }}</div>
                <div class="text-xs text-muted-foreground/70">{{ image.width }} × {{ image.height }}</div>
              </div>
            </div>
          </div>

          <!-- 批量操作 -->
          <div class="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <div class="text-sm text-muted-foreground">
              共 {{ images.length }} 张图片
              <span v-if="images.length < 2" class="text-destructive ml-2">
                至少需要 2 张图片才能合并
              </span>
            </div>
            <button
              @click="reverseOrder"
              class="text-sm text-primary hover:text-primary/80"
            >
              反转顺序
            </button>
          </div>
        </div>

        <!-- 预览区域 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Eye class="h-5 w-5 mr-2 text-primary" />
            预览效果
          </h3>

          <div class="bg-muted rounded-lg p-4 min-h-[400px] flex items-center justify-center">
            <div v-if="!mergedImage && images.length === 0" class="text-center text-muted-foreground">
              <Image class="h-12 w-12 mx-auto mb-3" />
              <p>上传图片后将显示预览</p>
            </div>

            <div v-else-if="!mergedImage && images.length > 0" class="text-center text-muted-foreground">
              <Layers class="h-12 w-12 mx-auto mb-3" />
              <p>点击"合并图片"生成预览</p>
            </div>

            <div v-else-if="mergedImage" class="w-full">
              <img
                :src="mergedImage"
                alt="合并预览"
                class="max-w-full h-auto mx-auto rounded-lg shadow-lg"
              />

              <!-- 合并信息 -->
              <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div class="bg-muted rounded p-2">
                  <div class="text-muted-foreground">宽度</div>
                  <div class="font-semibold text-foreground">{{ finalWidth }}px</div>
                </div>
                <div class="bg-muted rounded p-2">
                  <div class="text-muted-foreground">高度</div>
                  <div class="font-semibold text-foreground">{{ finalHeight }}px</div>
                </div>
                <div class="bg-muted rounded p-2">
                  <div class="text-muted-foreground">图片数</div>
                  <div class="font-semibold text-foreground">{{ images.length }}</div>
                </div>
                <div class="bg-muted rounded p-2">
                  <div class="text-muted-foreground">格式</div>
                  <div class="font-semibold text-foreground">{{ outputFormat.toUpperCase() }}</div>
                </div>
              </div>
            </div>
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
          什么是图片合并工具？
        </h2>
        <p class="text-muted-foreground mb-4">
          图片合并工具是一种在线服务，可以将多张图片按照指定的布局方式合并成一张图片。
          无论是水平排列、垂直堆叠还是网格布局，都可以通过简单的设置快速完成图片合并操作。
          这对于制作产品对比图、教程步骤图、社交媒体内容等场景非常有用。
        </p>
        <p class="text-muted-foreground mb-4">
          现代图片合并工具不仅支持基本的合并功能，还提供了丰富的自定义选项，
          如间距调整、背景颜色、对齐方式、输出尺寸和格式等，让用户可以根据需求精确控制合并效果。
        </p>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>多种布局方式</strong>: 支持水平、垂直、网格三种主流布局方式</li>
          <li><strong>灵活间距控制</strong>: 可自定义图片之间的间距，范围从0到50像素</li>
          <li><strong>背景颜色设置</strong>: 支持自定义背景颜色，可使用颜色选择器或十六进制值</li>
          <li><strong>对齐方式调整</strong>: 提供顶部/左侧、居中、底部/右侧等多种对齐选项</li>
          <li><strong>输出尺寸定制</strong>: 支持自动计算或自定义输出图片的尺寸</li>
          <li><strong>多种输出格式</strong>: 支持PNG、JPEG、WebP等主流图片格式</li>
          <li><strong>质量控制</strong>: 可调节JPEG图片的质量，平衡文件大小和图像质量</li>
          <li><strong>批量操作</strong>: 支持图片排序、反转、删除等批量管理功能</li>
        </ul>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          使用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>电商产品对比</strong>: 将多个产品的图片合并成一张对比图，方便用户查看</li>
          <li><strong>教程制作</strong>: 将操作步骤截图合并成一张流程图，便于读者理解</li>
          <li><strong>社交媒体内容</strong>: 制作信息丰富的社交媒体帖子，吸引更多关注</li>
          <li><strong>设计稿展示</strong>: 将多个设计方案合并展示，方便客户比较选择</li>
          <li><strong>报告插图</strong>: 在技术报告或商业文档中插入合并后的对比图表</li>
          <li><strong>广告素材</strong>: 制作包含多个产品或功能的广告横幅</li>
        </ul>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持哪些图片格式？</h3>
            <p class="text-muted-foreground mt-1">
              工具支持所有主流的图片格式，包括JPG、PNG、WebP、GIF等。
              上传的图片会在合并前自动转换为合适的格式，确保最终输出质量。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">合并后的图片分辨率如何？</h3>
            <p class="text-muted-foreground mt-1">
              合并后的图片分辨率取决于所选的布局方式和输出尺寸设置。
              工具会自动计算最优分辨率以保证图片质量和文件大小的平衡。
              用户也可以选择自定义输出尺寸来精确控制最终效果。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何提高合并效率？</h3>
            <p class="text-muted-foreground mt-1">
              为了提高合并效率，建议：
              1. 上传前尽量压缩图片文件大小；
              2. 合理选择布局方式和输出尺寸；
              3. 使用批量操作功能一次性处理多张图片；
              4. 选择合适的输出格式（WebP通常文件更小）。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">合并的图片会保存到服务器吗？</h3>
            <p class="text-muted-foreground mt-1">
              不会。所有的图片处理都在您的浏览器本地完成，图片数据不会上传到任何服务器。
              这确保了您的隐私安全，也加快了处理速度。
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
              :is="iconMap[relatedTool.icon] || Layers" 
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
import { useSeoMeta } from 'nuxt/app'
import { 
  Upload, Layers, Settings, Images, Eye, Image, Download,
  CheckCircle, ArrowUp, ArrowDown, Trash2, X, Loader2,
  HelpCircle, ChevronUp
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: '图片合并工具 - 在线合并多张图片',
  meta: [
    { name: 'description', content: '免费在线图片合并工具，支持水平、垂直、网格等多种布局方式，可自定义间距和背景颜色，轻松将多张图片合并成一张。' },
    { name: 'keywords', content: '图片合并,图片拼接,在线合并,水平合并,垂直合并,网格布局,批量合并' }
  ]
})

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'image-merge')
const category = categories.find(c => c.id === 'image')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 响应式数据
const fileInput = ref(null)
const images = ref([])
const selectedIndex = ref(null)
const mergedImage = ref('')
const processing = ref(false)
const finalWidth = ref(0)
const finalHeight = ref(0)

// 合并设置
const layoutMode = ref('horizontal') // horizontal, vertical, grid, custom
const gridCols = ref(3)
const spacing = ref(10)
const backgroundColor = ref('#FFFFFF')
const alignment = ref('center') // top, center, bottom
const sizeMode = ref('auto') // auto, custom
const outputWidth = ref(1000)
const outputHeight = ref(800)
const outputFormat = ref('png')
const quality = ref(90)

// 图标映射
const iconMap = {
  Upload, Layers, Settings, Images, Eye, Image, Download,
  CheckCircle, ArrowUp, ArrowDown, Trash2, X, Loader2,
  HelpCircle, ChevronUp
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t => 
    t.category === 'image' && t.id !== 'image-merge'
  ).slice(0, 2)
  
  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'image-crop'),
    tools.find(t => t.id === 'image-resize'),
    tools.find(t => t.id === 'image-compress'),
    tools.find(t => t.id === 'image-watermark')
  ].filter(Boolean)
  
  return [...sameCategory, ...recommended].slice(0, 4)
})

// 对齐选项
const alignOptions = computed(() => {
  if (layoutMode.value === 'horizontal') {
    return [
      { label: '顶部', value: 'top' },
      { label: '居中', value: 'center' },
      { label: '底部', value: 'bottom' }
    ]
  } else {
    return [
      { label: '左侧', value: 'left' },
      { label: '居中', value: 'center' },
      { label: '右侧', value: 'right' }
    ]
  }
})

// 文件处理
const triggerFileInput = () => {
  fileInput.value.click()
}

const onFileSelect = (event) => {
  handleFiles(event.target.files)
}

const onDragOver = (event) => {
  event.dataTransfer.dropEffect = 'copy'
}

const onDragLeave = () => {
  // 可以添加拖拽离开的视觉效果
}

const onDrop = (event) => {
  handleFiles(event.dataTransfer.files)
}

const handleFiles = async (files) => {
  const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))

  for (const file of imageFiles) {
    const preview = await createImagePreview(file)
    const img = await loadImage(preview)

    images.value.push({
      file,
      preview,
      width: img.naturalWidth,
      height: img.naturalHeight
    })
  }
}

const createImagePreview = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}

const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

const clearImages = () => {
  images.value = []
  selectedIndex.value = null
  mergedImage.value = ''
  finalWidth.value = 0
  finalHeight.value = 0
}

const selectImage = (index) => {
  selectedIndex.value = selectedIndex.value === index ? null : index
}

const removeImageAt = (index) => {
  images.value.splice(index, 1)
  if (selectedIndex.value === index) {
    selectedIndex.value = null
  } else if (selectedIndex.value > index) {
    selectedIndex.value--
  }
  mergedImage.value = ''
}

const removeImage = () => {
  if (selectedIndex.value !== null) {
    removeImageAt(selectedIndex.value)
  }
}

const reorderImages = (direction) => {
  if (selectedIndex.value === null) return

  const index = selectedIndex.value
  const newIndex = direction === 'up' ? index - 1 : index + 1

  if (newIndex >= 0 && newIndex < images.value.length) {
    const temp = images.value[index]
    images.value[index] = images.value[newIndex]
    images.value[newIndex] = temp
    selectedIndex.value = newIndex
    mergedImage.value = ''
  }
}

const reverseOrder = () => {
  images.value.reverse()
  selectedIndex.value = null
  mergedImage.value = ''
}

// 合并图片
const mergeImages = async () => {
  if (images.value.length < 2) return

  processing.value = true

  try {
    // 加载所有图片
    const loadedImages = await Promise.all(
      images.value.map(async (img) => {
        const image = await loadImage(img.preview)
        return {
          image,
          width: image.naturalWidth,
          height: image.naturalHeight
        }
      })
    )

    // 计算画布尺寸
    const { canvasWidth, canvasHeight, positions } = calculateLayout(loadedImages)

    // 创建画布
    const canvas = document.createElement('canvas')
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    const ctx = canvas.getContext('2d')

    // 填充背景色
    ctx.fillStyle = backgroundColor.value
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // 绘制图片
    loadedImages.forEach((item, index) => {
      const pos = positions[index]
      ctx.drawImage(item.image, pos.x, pos.y, pos.width, pos.height)
    })

    // 调整输出尺寸
    if (sizeMode.value === 'custom') {
      const resizedCanvas = document.createElement('canvas')
      resizedCanvas.width = outputWidth.value
      resizedCanvas.height = outputHeight.value
      const resizedCtx = resizedCanvas.getContext('2d')
      resizedCtx.drawImage(canvas, 0, 0, outputWidth.value, outputHeight.value)
      canvas.width = outputWidth.value
      canvas.height = outputHeight.value
      resizedCtx.drawImage(canvas, 0, 0)
    }

    finalWidth.value = canvas.width
    finalHeight.value = canvas.height

    // 转换为指定格式
    mergedImage.value = canvas.toDataURL(
      `image/${outputFormat.value}`,
      outputFormat.value === 'jpeg' ? quality.value / 100 : undefined
    )
  } finally {
    processing.value = false
  }
}

const calculateLayout = (loadedImages) => {
  let canvasWidth = 0
  let canvasHeight = 0
  const positions = []

  if (layoutMode.value === 'horizontal') {
    // 水平排列
    const maxHeight = Math.max(...loadedImages.map(item => item.height))
    canvasHeight = maxHeight + spacing.value * 2

    loadedImages.forEach((item, index) => {
      const scale = maxHeight / item.height
      const width = item.width * scale
      const height = maxHeight

      positions.push({
        x: canvasWidth + (index > 0 ? spacing.value : spacing.value),
        y: getAlignedY(canvasHeight, height) + spacing.value,
        width,
        height
      })

      canvasWidth += width + (index > 0 ? spacing.value : 0)
    })

    canvasWidth += spacing.value
  } else if (layoutMode.value === 'vertical') {
    // 垂直排列
    const maxWidth = Math.max(...loadedImages.map(item => item.width))
    canvasWidth = maxWidth + spacing.value * 2

    loadedImages.forEach((item, index) => {
      const scale = maxWidth / item.width
      const width = maxWidth
      const height = item.height * scale

      positions.push({
        x: getAlignedX(canvasWidth, width) + spacing.value,
        y: canvasHeight + (index > 0 ? spacing.value : spacing.value),
        width,
        height
      })

      canvasHeight += height + (index > 0 ? spacing.value : 0)
    })

    canvasHeight += spacing.value
  } else if (layoutMode.value === 'grid') {
    // 网格布局
    const cols = Math.min(gridCols.value, loadedImages.length)
    const rows = Math.ceil(loadedImages.length / cols)

    // 计算每个单元格的尺寸（使用最大尺寸）
    const cellWidth = Math.max(...loadedImages.map(item => item.width))
    const cellHeight = Math.max(...loadedImages.map(item => item.height))

    canvasWidth = cols * cellWidth + (cols + 1) * spacing.value
    canvasHeight = rows * cellHeight + (rows + 1) * spacing.value

    loadedImages.forEach((item, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)

      const x = spacing.value + col * (cellWidth + spacing.value)
      const y = spacing.value + row * (cellHeight + spacing.value)

      // 居中对齐
      const posX = x + (cellWidth - item.width) / 2
      const posY = y + (cellHeight - item.height) / 2

      positions.push({
        x: posX,
        y: posY,
        width: item.width,
        height: item.height
      })
    })
  }

  return { canvasWidth, canvasHeight, positions }
}

const getAlignedY = (containerHeight, itemHeight) => {
  if (alignment.value === 'top') return 0
  if (alignment.value === 'bottom') return containerHeight - itemHeight
  return (containerHeight - itemHeight) / 2
}

const getAlignedX = (containerWidth, itemWidth) => {
  if (alignment.value === 'left') return 0
  if (alignment.value === 'right') return containerWidth - itemWidth
  return (containerWidth - itemWidth) / 2
}

// 下载功能
const downloadImage = () => {
  if (!mergedImage.value) return

  const link = document.createElement('a')
  link.download = `merged_image_${Date.now()}.${outputFormat.value}`
  link.href = mergedImage.value
  link.click()
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