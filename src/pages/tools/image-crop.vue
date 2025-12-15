<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">图片裁剪工具 - 在线智能裁剪图片</h1>
      <p class="text-muted-foreground">专业的在线图片裁剪工具，支持自由裁剪、固定比例裁剪、圆形裁剪等多种模式，提供精确的尺寸控制和预览功能。适用于设计师、开发者和内容创作者。</p>
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
              <Image class="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p class="text-muted-foreground">点击或拖拽图片到这里</p>
                <p class="text-sm text-muted-foreground/70 mt-1">支持 JPG、PNG、WebP 等格式</p>
                <p class="text-sm text-primary mt-1">支持批量处理</p>
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

        <!-- 裁剪模式 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Settings class="h-5 w-5 mr-2 text-primary" />
            裁剪设置
          </h2>

          <div class="space-y-4">
            <!-- 裁剪模式 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">裁剪模式</label>
              <select
                v-model="cropMode"
                class="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              >
                <option value="free">自由裁剪</option>
                <option value="ratio">固定比例</option>
                <option value="circle">圆形裁剪</option>
              </select>
            </div>

            <!-- 宽高比 -->
            <div v-if="cropMode === 'ratio'">
              <label class="block text-sm font-medium text-foreground mb-2">宽高比</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="ratio in aspectRatios"
                  :key="ratio.value"
                  @click="aspectRatio = ratio.value"
                  :class="[
                    'px-3 py-2 text-sm rounded-md border transition-colors',
                    aspectRatio === ratio.value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-muted border-border text-foreground hover:bg-muted/80'
                  ]"
                >
                  {{ ratio.label }}
                </button>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs text-muted-foreground mb-1">宽度</label>
                  <input
                    v-model.number="customWidth"
                    type="number"
                    min="1"
                    class="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="宽度"
                  />
                </div>
                <div>
                  <label class="block text-xs text-muted-foreground mb-1">高度</label>
                  <input
                    v-model.number="customHeight"
                    type="number"
                    min="1"
                    class="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="高度"
                  />
                </div>
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
                    value="original"
                    class="mr-2 rounded border-border text-primary focus:ring-primary bg-background"
                  />
                  <span class="text-sm text-foreground">保持原始尺寸</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="sizeMode"
                    type="radio"
                    value="custom"
                    class="mr-2 rounded border-border text-primary focus:ring-primary bg-background"
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
                    min="1"
                    class="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="宽度"
                  />
                </div>
                <div>
                  <label class="block text-xs text-muted-foreground mb-1">高度 (px)</label>
                  <input
                    v-model.number="outputHeight"
                    type="number"
                    min="1"
                    class="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
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
                class="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
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
            @click="processAllImages"
            :disabled="!images.length || processing"
            class="w-full bg-primary text-primary-foreground py-3 px-4 rounded-md hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Loader2 v-if="processing" class="h-5 w-5 mr-2 animate-spin" />
            <Scissors v-else class="h-5 w-5 mr-2" />
            {{ processing ? '处理中...' : `裁剪所有图片 (${images.length})` }}
          </button>

          <button
            v-if="croppedImages.length > 0"
            @click="downloadAll"
            class="w-full mt-3 bg-secondary text-secondary-foreground py-3 px-4 rounded-md hover:bg-secondary/90 transition-colors flex items-center justify-center"
          >
            <Download class="h-5 w-5 mr-2" />
            下载所有图片 ({{ croppedImages.length }})
          </button>
        </div>
      </div>

      <!-- 右侧图片区域 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 当前编辑图片 -->
        <div v-if="currentImage" class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold flex items-center text-foreground">
              <Edit class="h-5 w-5 mr-2 text-primary" />
              编辑图片
            </h3>
            <div class="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>{{ currentImage.file.name }}</span>
              <span>•</span>
              <span>{{ currentImage.width }} × {{ currentImage.height }}</span>
            </div>
          </div>

          <!-- 图片裁剪区域 -->
          <div class="relative bg-muted rounded-lg overflow-hidden" style="min-height: 400px;">
            <canvas
              ref="canvas"
              class="max-w-full mx-auto cursor-crosshair"
              @mousedown="startCrop"
              @mousemove="updateCrop"
              @mouseup="endCrop"
              @mouseleave="endCrop"
            />

            <!-- 裁剪框 -->
            <div
              v-if="cropArea.active"
              class="absolute border-2 border-primary bg-primary/20 pointer-events-none"
              :style="{
                left: cropArea.x + 'px',
                top: cropArea.y + 'px',
                width: cropArea.width + 'px',
                height: cropArea.height + 'px'
              }"
            >
              <!-- 调整手柄 -->
              <div class="absolute -top-1 -left-1 w-3 h-3 bg-primary border border-background rounded-full"></div>
              <div class="absolute -top-1 -right-1 w-3 h-3 bg-primary border border-background rounded-full"></div>
              <div class="absolute -bottom-1 -left-1 w-3 h-3 bg-primary border border-background rounded-full"></div>
              <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border border-background rounded-full"></div>
            </div>
          </div>

          <!-- 快捷操作 -->
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              @click="resetCrop"
              class="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors text-sm flex items-center"
            >
              <RefreshCw class="h-4 w-4 mr-1" />
              重置
            </button>
            <button
              @click="cropCurrent"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm flex items-center"
            >
              <Scissors class="h-4 w-4 mr-1" />
              裁剪当前
            </button>
            <button
              @click="nextImage"
              :disabled="currentImageIndex >= images.length - 1"
              class="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors text-sm flex items-center disabled:opacity-50"
            >
              <ArrowRight class="h-4 w-4 mr-1" />
              下一张
            </button>
          </div>
        </div>

        <!-- 图片列表 -->
        <div v-if="images.length > 0" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Images class="h-5 w-5 mr-2 text-primary" />
            图片列表 ({{ images.length }})
          </h3>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div
              v-for="(image, index) in images"
              :key="index"
              class="relative group cursor-pointer"
              @click="selectImage(index)"
            >
              <img
                :src="image.preview"
                :alt="image.file.name"
                class="w-full h-24 object-cover rounded-lg border-2 transition-all"
                :class="[
                  index === currentImageIndex
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border group-hover:border-muted-foreground'
                ]"
              />

              <!-- 裁剪状态 -->
              <div
                v-if="image.cropped"
                class="absolute top-2 right-2 p-1 bg-green-500 rounded-full"
              >
                <Check class="h-3 w-3 text-white" />
              </div>

              <!-- 图片信息 -->
              <div class="mt-1 text-xs text-muted-foreground truncate">
                {{ image.file.name }}
              </div>
            </div>
          </div>
        </div>

        <!-- 处理结果 -->
        <div v-if="croppedImages.length > 0" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <CheckCircle class="h-5 w-5 mr-2 text-primary" />
            裁剪完成 ({{ croppedImages.length }})
          </h3>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div
              v-for="(result, index) in croppedImages"
              :key="index"
              class="relative group"
            >
              <img
                :src="result.preview"
                :alt="result.name"
                class="w-full h-24 object-cover rounded-lg border border-border"
              />

              <!-- 下载按钮 -->
              <button
                @click="downloadImage(result)"
                class="absolute inset-0 bg-background/80 backdrop-blur rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Download class="h-6 w-6 text-foreground" />
              </button>

              <!-- 文件信息 -->
              <div class="mt-1 text-xs text-muted-foreground">
                <div class="truncate">{{ result.name }}</div>
                <div>{{ result.width }} × {{ result.height }}</div>
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
          什么是图片裁剪工具？
        </h2>
        <p class="text-muted-foreground mb-4">
          图片裁剪工具是一种在线服务，可以帮助用户精确地裁剪图片的特定区域。
          无论是去除图片中的无关部分、调整图片比例，还是创建头像和缩略图，
          都可以通过专业的裁剪工具快速完成。这对于设计师、摄影师、内容创作者和普通用户都非常有用。
        </p>
        <p class="text-muted-foreground mb-4">
          现代图片裁剪工具不仅支持基本的矩形裁剪，还提供了多种高级功能，
          如固定比例裁剪、圆形裁剪、自由形状裁剪等。用户可以根据需求选择合适的裁剪模式，
          并精确控制输出尺寸和质量。
        </p>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>多种裁剪模式</strong>: 支持自由裁剪、固定比例裁剪、圆形裁剪三种主要模式</li>
          <li><strong>精确比例控制</strong>: 提供常见比例预设和自定义宽高比设置</li>
          <li><strong>批量处理</strong>: 支持一次上传多张图片并批量裁剪处理</li>
          <li><strong>输出格式多样</strong>: 支持PNG、JPEG、WebP等主流图片格式输出</li>
          <li><strong>质量调节</strong>: 可调节JPEG图片的质量参数，平衡文件大小和图像质量</li>
          <li><strong>尺寸定制</strong>: 支持保持原始尺寸或自定义输出尺寸</li>
          <li><strong>实时预览</strong>: 提供裁剪区域实时预览，确保精确选择</li>
          <li><strong>本地处理</strong>: 所有处理都在浏览器本地完成，确保隐私安全</li>
        </ul>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          使用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>社交媒体内容</strong>: 裁剪适合不同社交平台的图片尺寸，如头像、封面图等</li>
          <li><strong>电商产品图</strong>: 统一产品图片尺寸和比例，提升商品展示效果</li>
          <li><strong>设计素材准备</strong>: 为设计项目准备符合规格的图片素材</li>
          <li><strong>照片优化</strong>: 去除照片中的无关元素，突出主体内容</li>
          <li><strong>头像制作</strong>: 制作圆形或方形头像，适配各种应用场景</li>
          <li><strong>文档插图</strong>: 裁剪技术文档或报告中的插图，保持版面整洁</li>
        </ul>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">裁剪后的图片质量会有损失吗？</h3>
            <p class="text-muted-foreground mt-1">
              裁剪操作本身不会降低图片质量，因为它只是选择图片的一个区域。
              但如果选择了较小的输出尺寸，可能会因重新采样而导致质量下降。
              为了获得最佳效果，建议保持原始尺寸或选择较大的输出尺寸。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持哪些图片格式？</h3>
            <p class="text-muted-foreground mt-1">
              工具支持所有主流的图片格式，包括JPG、PNG、WebP、GIF等。
              上传的图片会在裁剪前自动解码，在输出时可以选择所需的格式。
              WebP格式通常能提供更好的压缩效果和质量。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何提高裁剪效率？</h3>
            <p class="text-muted-foreground mt-1">
              为了提高裁剪效率，建议：
              1. 使用固定比例裁剪模式，避免每次手动调整；
              2. 批量上传图片进行统一处理；
              3. 预先确定所需的输出尺寸和格式；
              4. 使用键盘快捷键进行操作（如果支持）。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">裁剪的图片会保存到服务器吗？</h3>
            <p class="text-muted-foreground mt-1">
              不会。所有的图片处理都在您的浏览器本地完成，图片数据不会上传到任何服务器。
              这确保了您的隐私安全，也加快了处理速度。裁剪完成后，您可以选择下载结果图片。
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
              :is="iconMap[relatedTool.icon] || Scissors" 
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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
// useSeoMeta 已自动可用，无需导入
import { 
  Upload, Image, CheckCircle, Settings, Scissors, Download, Edit, 
  RefreshCw, ArrowRight, Images, Check, Loader2, HelpCircle, ChevronUp
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'
// JSZip 将在需要时动态导入

// SEO配置
useSeoMeta({
  title: '图片裁剪工具 - 在线智能裁剪图片 | 有条工具',
  description: '免费在线图片裁剪工具，支持自由裁剪、固定比例裁剪、圆形裁剪等多种模式，提供精确的尺寸控制和批量处理功能。纯本地计算，数据隐私绝对安全。',
  keywords: '图片裁剪,在线裁剪,图片编辑,自由裁剪,固定比例,圆形裁剪,批量裁剪,图片处理',
  author: 'Util.cn',
  ogTitle: '图片裁剪工具 - 在线智能裁剪图片',
  ogDescription: '免费在线图片裁剪工具，支持自由裁剪、固定比例裁剪、圆形裁剪等多种模式，提供精确的尺寸控制和批量处理功能。',
  ogType: 'website',
  ogSiteName: '有条工具',
  twitterCard: 'summary',
  twitterTitle: '图片裁剪工具 - 在线智能裁剪图片',
  twitterDescription: '免费在线图片裁剪工具，支持自由裁剪、固定比例裁剪、圆形裁剪等多种模式，提供精确的尺寸控制和批量处理功能。'
})

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'image-crop')
const category = categories.find(c => c.id === 'image')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 响应式数据
const fileInput = ref(null)
const canvas = ref(null)
const images = ref([])
const currentImageIndex = ref(0)
const croppedImages = ref([])
const processing = ref(false)

// 裁剪设置
const cropMode = ref('free') // free, ratio, circle
const aspectRatio = ref('4:3')
const aspectRatios = [
  { label: '1:1', value: '1:1' },
  { label: '4:3', value: '4:3' },
  { label: '16:9', value: '16:9' },
  { label: '3:2', value: '3:2' },
  { label: '自由', value: 'free' }
]
const customWidth = ref(16)
const customHeight = ref(9)
const sizeMode = ref('original') // original, custom
const outputWidth = ref(800)
const outputHeight = ref(600)
const outputFormat = ref('png')
const quality = ref(90)

// 裁剪区域
const cropArea = ref({
  active: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  startX: 0,
  startY: 0
})

// 图标映射
const iconMap = {
  Upload, Image, CheckCircle, Settings, Scissors, Download, Edit, 
  RefreshCw, ArrowRight, Images, Check, Loader2, HelpCircle, ChevronUp
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t => 
    t.category === 'image' && t.id !== 'image-crop'
  ).slice(0, 2)
  
  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'image-merge'),
    tools.find(t => t.id === 'image-resize'),
    tools.find(t => t.id === 'image-compress'),
    tools.find(t => t.id === 'image-watermark')
  ].filter(Boolean)
  
  return [...sameCategory, ...recommended].slice(0, 4)
})

// 计算属性
const currentImage = computed(() => {
  return images.value[currentImageIndex.value] || null
})

const aspectRatioValue = computed(() => {
  if (aspectRatio.value === 'free') return null
  if (aspectRatio.value === 'custom') {
    return customWidth.value / customHeight.value
  }
  const [w, h] = aspectRatio.value.split(':').map(Number)
  return w / h
})

// 监听比例变化
watch(aspectRatio, (newRatio) => {
  if (newRatio !== 'custom') return
  const [w, h] = newRatio.split(':').map(Number)
  customWidth.value = w
  customHeight.value = h
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
      height: img.naturalHeight,
      originalWidth: img.naturalWidth,
      originalHeight: img.naturalHeight,
      cropped: false
    })
  }

  // 如果是第一张图片，设置为当前编辑图片
  if (images.value.length === 1) {
    currentImageIndex.value = 0
    await nextTick()
    displayCurrentImage()
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
  croppedImages.value = []
  currentImageIndex.value = 0
  cropArea.value.active = false
}

const selectImage = (index) => {
  currentImageIndex.value = index
  nextTick(() => {
    displayCurrentImage()
  })
}

const nextImage = () => {
  if (currentImageIndex.value < images.value.length - 1) {
    selectImage(currentImageIndex.value + 1)
  }
}

// 图片显示和裁剪
const displayCurrentImage = async () => {
  if (!currentImage.value || !canvas.value) return

  const ctx = canvas.value.getContext('2d')
  const img = await loadImage(currentImage.value.preview)

  // 计算显示尺寸（保持宽高比）
  const maxWidth = canvas.value.parentElement.clientWidth
  const maxHeight = 600
  const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)

  canvas.value.width = img.width * scale
  canvas.value.height = img.height * scale

  ctx.drawImage(img, 0, 0, canvas.value.width, canvas.value.height)
}

const startCrop = (event) => {
  if (!canvas.value) return

  const rect = canvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  cropArea.value = {
    active: true,
    startX: x,
    startY: y,
    x: x,
    y: y,
    width: 0,
    height: 0
  }
}

const updateCrop = (event) => {
  if (!cropArea.value.active || !canvas.value) return

  const rect = canvas.value.getBoundingClientRect()
  const currentX = event.clientX - rect.left
  const currentY = event.clientY - rect.top

  let width = currentX - cropArea.value.startX
  let height = currentY - cropArea.value.startY

  // 应用宽高比限制
  if (cropMode.value === 'ratio' && aspectRatioValue.value) {
    height = width / aspectRatioValue.value
  }

  // 处理反向拖拽
  if (width < 0) {
    cropArea.value.x = currentX
    cropArea.value.width = Math.abs(width)
  } else {
    cropArea.value.x = cropArea.value.startX
    cropArea.value.width = width
  }

  if (height < 0) {
    cropArea.value.y = currentY
    cropArea.value.height = Math.abs(height)
  } else {
    cropArea.value.y = cropArea.value.startY
    cropArea.value.height = height
  }
}

const endCrop = () => {
  cropArea.value.active = false
}

const resetCrop = () => {
  cropArea.value = {
    active: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    startX: 0,
    startY: 0
  }
  displayCurrentImage()
}

const cropCurrent = async () => {
  if (!currentImage.value || !canvas.value || !cropArea.value.width) return

  const sourceImg = await loadImage(currentImage.value.preview)
  const scale = sourceImg.width / canvas.value.width

  // 计算实际裁剪区域
  const actualCrop = {
    x: cropArea.value.x * scale,
    y: cropArea.value.y * scale,
    width: cropArea.value.width * scale,
    height: cropArea.value.height * scale
  }

  // 创建临时canvas进行裁剪
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')

  // 设置输出尺寸
  let outputW, outputH
  if (sizeMode.value === 'custom') {
    outputW = outputWidth.value
    outputH = outputHeight.value
  } else {
    outputW = actualCrop.width
    outputH = actualCrop.height
  }

  tempCanvas.width = outputW
  tempCanvas.height = outputH

  if (cropMode.value === 'circle') {
    // 圆形裁剪
    const size = Math.min(outputW, outputH)
    tempCanvas.width = size
    tempCanvas.height = size

    tempCtx.beginPath()
    tempCtx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI)
    tempCtx.closePath()
    tempCtx.clip()

    tempCtx.drawImage(
      sourceImg,
      actualCrop.x, actualCrop.y, actualCrop.width, actualCrop.height,
      0, 0, size, size
    )
  } else {
    // 矩形裁剪
    tempCtx.drawImage(
      sourceImg,
      actualCrop.x, actualCrop.y, actualCrop.width, actualCrop.height,
      0, 0, outputW, outputH
    )
  }

  // 转换为指定格式
  const outputDataUrl = tempCanvas.toDataURL(
    `image/${outputFormat.value}`,
    outputFormat.value === 'jpeg' ? quality.value / 100 : undefined
  )

  // 保存结果
  const result = {
    name: `cropped_${currentImage.value.file.name.split('.')[0]}.${outputFormat.value}`,
    preview: outputDataUrl,
    data: outputDataUrl,
    width: tempCanvas.width,
    height: tempCanvas.height,
    originalIndex: currentImageIndex.value
  }

  croppedImages.value.push(result)
  images.value[currentImageIndex.value].cropped = true

  // 自动下一张
  if (currentImageIndex.value < images.value.length - 1) {
    nextImage()
  }
}

// 批量处理
const processAllImages = async () => {
  processing.value = true

  try {
    for (let i = 0; i < images.value.length; i++) {
      if (images.value[i].cropped) continue

      currentImageIndex.value = i
      await nextTick()
      await displayCurrentImage()

      // 模拟用户选择裁剪区域（这里使用默认区域）
      cropArea.value = {
        active: true,
        x: 10,
        y: 10,
        width: canvas.value.width - 20,
        height: canvas.value.height - 20
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      await cropCurrent()
    }
  } finally {
    processing.value = false
  }
}

// 下载功能
const downloadImage = (result) => {
  const link = document.createElement('a')
  link.download = result.name
  link.href = result.data
  link.click()
}

const downloadAll = async () => {
  if (croppedImages.value.length === 1) {
    downloadImage(croppedImages.value[0])
    return
  }

  // 动态导入 JSZip
  const JSZip = await import('jszip')
  const zip = new JSZip.default()

  croppedImages.value.forEach((result) => {
    const base64Data = result.data.split(',')[1]
    zip.file(result.name, base64Data, { base64: true })
  })

  const content = await zip.generateAsync({ type: 'blob' })
  const link = document.createElement('a')
  link.download = `cropped_images_${Date.now()}.zip`
  link.href = URL.createObjectURL(content)
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

// 生命周期
onMounted(() => {
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    if (currentImage.value) {
      displayCurrentImage()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', displayCurrentImage)
})
</script>