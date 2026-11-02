<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <IdCard class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">证件照换底色排版</h1>
          <p class="text-sm text-muted-foreground mt-1">一寸/二寸证件照自动换底色，按标准尺寸裁剪，300dpi 导出或六寸相纸排版打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传证件照后，工具自动从照片四角取样识别原背景色，用边缘泛洪算法只替换与照片边缘连通的相似色区域，
        一键换成白底、蓝底、红底、深蓝底或任意自定义颜色；随后按一寸、二寸、小一寸、大一寸、护照、签证等标准尺寸居中裁剪，
        支持缩放与上下偏移微调构图，可导出 300dpi 高清 PNG，或自动排满六寸相纸直接打印。全部像素运算在浏览器本地完成，照片不上传。
      </p>
    </div>

    <!-- 诚实说明条 -->
    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-6 flex items-start gap-3 no-print">
      <TriangleAlert class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <p class="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
        <strong>本工具适合纯色背景的照相馆照片</strong>；复杂发丝、户外背景的边缘会有瑕疵，重要证件照建议重拍。
        换底色效果请以页面预览为准，请勿用于对边缘质量要求苛刻的正式场合。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 tools-grid no-print">
      <!-- 左侧：上传与参数 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-6">
        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Upload class="w-5 h-5 mr-2 text-primary" /> 上传照片
          </h2>
          <label class="block cursor-pointer">
            <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onFileChange" />
            <div v-if="photoUrl" class="relative group rounded-lg overflow-hidden border border-border">
              <img :src="photoUrl" alt="原照片预览" class="w-full h-44 object-cover" />
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm">
                点击重新上传
              </div>
            </div>
            <div v-else class="rounded-lg border-2 border-dashed border-border h-36 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
              <Upload class="w-6 h-6" />
              <span class="text-xs">点击上传证件照（JPG / PNG）</span>
            </div>
          </label>
          <div class="flex gap-2 mt-3">
            <button
              type="button"
              @click="triggerReupload"
              class="flex-1 px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >
              <Upload class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重新上传
            </button>
            <button
              type="button"
              @click="resetAll"
              class="flex-1 px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >
              <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
            </button>
          </div>
        </div>

        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Crop class="w-5 h-5 mr-2 text-primary" /> 证件尺寸
          </h2>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="s in SIZES"
              :key="s.id"
              type="button"
              @click="selectedSizeId = s.id"
              class="px-3 py-2 rounded-lg border text-left transition"
              :class="selectedSizeId === s.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'"
            >
              <span class="block text-sm font-medium" :class="selectedSizeId === s.id ? 'text-primary' : 'text-foreground'">{{ s.name }}</span>
              <span class="block text-[10px] text-muted-foreground font-mono">{{ s.w }}×{{ s.h }}mm · {{ s.pxW }}×{{ s.pxH }}px</span>
            </button>
          </div>
        </div>

        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Droplet class="w-5 h-5 mr-2 text-primary" /> 目标底色
          </h2>
          <div class="flex items-center gap-2.5 flex-wrap mb-3">
            <button
              v-for="p in COLOR_PRESETS"
              :key="p.id"
              type="button"
              :title="p.name"
              @click="targetColor = p.hex"
              class="w-9 h-9 rounded-full border-2 transition"
              :class="targetColor.toUpperCase() === p.hex.toUpperCase() ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'"
              :style="{ backgroundColor: p.hex }"
            ></button>
            <input
              v-model="targetColor"
              type="color"
              title="自定义底色"
              class="h-9 w-12 cursor-pointer rounded border border-input bg-background p-1"
            />
          </div>
          <p class="text-xs text-muted-foreground mb-1.5">当前目标：<span class="text-foreground font-medium">{{ colorDisplayName }}</span><span class="font-mono ml-1">{{ targetColor.toUpperCase() }}</span></p>
          <p class="text-xs text-muted-foreground flex items-center gap-1.5">
            检测到的原底色（四角取样均值）：
            <i class="inline-block w-3.5 h-3.5 rounded-sm border border-border flex-shrink-0" :style="{ backgroundColor: detectedColor || 'transparent' }"></i>
            <span class="font-mono">{{ detectedColor || '—' }}</span>
          </p>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="text-sm font-medium text-foreground">相似色容差</label>
            <span class="text-xs text-muted-foreground font-mono">{{ tolerance }}</span>
          </div>
          <input v-model.number="tolerance" type="range" min="20" max="80" step="1" class="w-full" />
          <p class="text-xs text-muted-foreground mt-1.5">调大更容易把渐变、阴影背景替换干净，也更容易误伤颜色相近的浅色衣服；改动后约 0.2 秒自动重新处理。</p>
        </div>
      </div>

      <!-- 右侧：预览与导出（打印时仅保留排版页） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5 preview-panel">
        <div class="flex items-center justify-between flex-wrap gap-2 no-print">
          <h2 class="text-lg font-semibold flex items-center">
            <Crop class="w-5 h-5 mr-2 text-primary" /> 构图预览（最终导出效果）
          </h2>
          <span class="text-xs text-muted-foreground font-mono">{{ selectedSize.name }} · {{ selectedSize.pxW }}×{{ selectedSize.pxH }} px @300dpi</span>
        </div>

        <div class="flex justify-center no-print">
          <div class="relative rounded-lg border border-border overflow-hidden bg-muted/30" :style="previewBoxStyle">
            <canvas ref="previewCanvasRef" class="block w-full h-full"></canvas>
            <div v-if="status === 'idle'" class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none">
              <Upload class="w-8 h-8 text-muted-foreground/40" />
              <p class="text-sm text-muted-foreground">上传照片后自动换底色</p>
              <p class="text-xs text-muted-foreground/70">再按尺寸裁剪与微调构图</p>
            </div>
            <div v-else-if="status === 'working'" class="absolute inset-0 flex items-center justify-center bg-background/60 pointer-events-none">
              <p class="text-sm text-muted-foreground">正在换底色…</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-sm font-medium text-foreground">照片缩放</label>
              <span class="text-xs text-muted-foreground font-mono">{{ scalePercent }}%</span>
            </div>
            <input v-model.number="scalePercent" type="range" min="80" max="150" step="1" class="w-full" />
            <p class="text-xs text-muted-foreground mt-1">80% 缩小留边，150% 放大裁掉多余背景</p>
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-sm font-medium text-foreground">垂直偏移（人头上移 / 下移）</label>
              <span class="text-xs text-muted-foreground font-mono">{{ offsetYPercent > 0 ? '+' : '' }}{{ offsetYPercent }}</span>
            </div>
            <input v-model.number="offsetYPercent" type="range" min="-50" max="50" step="1" class="w-full" />
            <p class="text-xs text-muted-foreground mt-1 flex items-start gap-1">
              <Info class="w-3 h-3 flex-shrink-0 mt-0.5" /> 先放大（&gt;100%）才有上下移动空间
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3 no-print">
          <button
            type="button"
            @click="downloadPng"
            :disabled="!canExport"
            class="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Download class="w-4 h-4" /> 下载单张 PNG（300dpi）
          </button>
          <button
            type="button"
            @click="printSheet"
            :disabled="!canExport"
            class="flex items-center gap-2 px-5 py-2.5 bg-muted hover:bg-muted/80 border border-border text-foreground rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Printer class="w-4 h-4" /> 排版打印（六寸相纸）
          </button>
          <p v-if="status === 'error'" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-foreground flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" /> {{ errorMsg }}
          </p>
          <p v-else-if="status === 'ready'" class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-foreground flex items-start gap-1.5">
            <CheckCircle class="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" /> 换底色完成；发丝边缘如有杂色，可适当调大容差改善
          </p>
        </div>

        <!-- 六寸相纸排版预览（打印时仅保留此页） -->
        <div class="border-t border-border pt-4">
          <div class="flex items-center justify-between flex-wrap gap-2 mb-3 no-print">
            <h3 class="text-base font-semibold text-foreground flex items-center">
              <Printer class="w-4 h-4 mr-2 text-primary" /> 六寸相纸排版预览（152×102mm）
            </h3>
            <span class="text-xs text-muted-foreground">{{ layoutInfo }}</span>
          </div>
          <div class="overflow-auto sheet-scroll">
            <div class="six-sheet">
              <div
                v-for="(slot, i) in printSlots"
                :key="i"
                class="photo-slot"
                :style="{ left: slot.x + 'mm', top: slot.y + 'mm', width: slot.w + 'mm', height: slot.h + 'mm' }"
              >
                <img v-if="previewDataUrl" :src="previewDataUrl" alt="排版证件照" class="absolute inset-0 w-full h-full" />
                <span v-else class="absolute inset-0 flex items-center justify-center text-[10px] text-neutral-400">{{ i + 1 }}</span>
              </div>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3 no-print">
            排版参数：六寸相纸 152×102mm，边距 3mm，照片间距 2mm，自动居中排满；打印时请选择六寸相纸并把缩放设为 100%（实际大小），仅输出此页。
          </p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>证件照换底色排版是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          证件照换底色排版是一款在浏览器本地运行的证件照处理工具：自动检测照片原背景色，用「边缘泛洪」算法只替换与照片边缘连通的相似色区域，
          把照相馆纯色底照片换成白底、蓝底、红底、深蓝底或自定义颜色；再按一寸、二寸、小一寸、大一寸、护照、签证等标准尺寸居中裁剪，
          支持缩放与垂直偏移微调，可导出 300dpi 高清 PNG，也可自动排满六寸相纸直接打印裁切。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">一寸、二寸证件照尺寸对照表</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr class="bg-muted/50 text-foreground">
                <th class="px-3 py-2 text-left border-b border-border">规格</th>
                <th class="px-3 py-2 text-left border-b border-border">尺寸（毫米）</th>
                <th class="px-3 py-2 text-left border-b border-border">300dpi 像素（宽×高）</th>
                <th class="px-3 py-2 text-left border-b border-border">常见用途</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in SIZES" :key="s.id" class="text-muted-foreground">
                <td class="px-3 py-2 border-b border-border text-foreground font-medium">{{ s.name }}</td>
                <td class="px-3 py-2 border-b border-border font-mono">{{ s.w }} × {{ s.h }}</td>
                <td class="px-3 py-2 border-b border-border font-mono">{{ s.pxW }} × {{ s.pxH }}</td>
                <td class="px-3 py-2 border-b border-border">{{ s.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-muted-foreground mt-2">换算公式：像素 = 毫米 ÷ 25.4 × 300（四舍五入），例如一寸 25×35mm ≈ 295×413 像素；冲印与多数办证系统按 300dpi 校验像素数。</p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">换底色原理简述</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>四角取样：在照片四个角各取 8×8 像素求平均，得到原背景色的基准值，并显示在面板上供核对。</li>
          <li>边缘泛洪：从画面四边出发，把所有与基准色距离小于容差、且相互连通的像素标记为背景。因为只替换「连到边缘的背景」，人脸、衣服内部即使存在颜色接近的区域也不会被误替换。</li>
          <li>羽化过渡：背景与前景交界像素按颜色距离比例做半透明混合，减少生硬的白边与色晕。</li>
          <li>裁剪排版：换底后的图按目标证件比例居中裁剪，可缩放、可上下偏移，最终按 300dpi 像素输出。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么本地处理更安全</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          身份证、签证、考试报名照片属于敏感个人信息，上传到在线服务存在泄露与被滥用的风险。本工具的全部像素运算都在你的浏览器内存中完成，
          不发出任何网络请求，照片不经过服务器、不落盘保存，刷新或关闭页面后立即释放。涉及身份证回执等有合规要求的场景，请以办证机构认可的照相馆成片为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">哪些情况效果不好</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>复杂背景（户外、树木、花纹）：背景颜色不统一，取样基准失准，容易残留色块。</li>
          <li>蓬松发丝、毛绒衣领：发丝边缘本就是前景与背景的半透明混合区，自动替换只能按颜色近似填充，放大看会有杂色或锯齿。</li>
          <li>背景有明显阴影或渐变光照：可尝试调大「相似色容差」，但也更容易误伤浅色衣物。</li>
        </ul>
        <p class="text-sm text-muted-foreground mt-2 leading-relaxed">
          以上情况属于自动换底的固有局限，不是参数能完全解决的；身份证、护照、签证等重要证件照建议直接到照相馆重拍，部分办证场景也不受理换底色照片。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">打印用几寸相纸？怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          六寸相纸（152×102mm，又称 4R）是最常见、最便宜的冲印规格，本工具按边距 3mm、照片间距 2mm 自动居中排满：
          一寸可排 10 张、小一寸 12 张、二寸/大一寸/护照各 4 张、签证 2 张。家用打印机可用 A4 纸打印后按格裁切；
          送冲印店直接说明冲洗六寸即可。打印时务必把缩放设为 100%（实际大小），不要选「适应页面」，否则照片会小于标准尺寸。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">照片会上传到服务器吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有换底色、裁剪与排版都在浏览器本页内存中完成，不发送任何网络请求，照片不保存，刷新或关闭页面后立即释放。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么头发边缘有白边或杂色？</h3>
            <p class="text-sm text-muted-foreground mt-1">发丝边缘本身是前景与背景的半透明混合区，自动换底只能按颜色相似度近似填充。可尝试调大「相似色容差」，但复杂背景与蓬松发丝的效果仍然有限，重要证件照建议到照相馆重拍。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">打印时尺寸不对怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">在系统打印对话框中选择对应的相纸（如六寸 152×102mm），缩放设为 100% 实际大小，不要选择「适应页面」；浏览器默认可能按 96% 缩放，改回 100% 后即为标准尺寸。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">换底色会改变照片里的人像吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。算法只替换与原背景颜色相近、且与照片边缘连通的像素，人脸与衣物区域不在替换范围内；建议导出前放大预览，确认发丝与衣领边缘效果。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'id-photo-maker'" :category="'image'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  IdCard, Upload, Crop, Printer, Download, RefreshCw,
  CheckCircle, TriangleAlert, ChevronUp, ChevronDown, Info, Droplet
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '证件照换底色排版 - 一寸二寸证件照换背景颜色并排版打印',
  description: '免费在线证件照换底色工具，自动识别照片背景并替换为白底/蓝底/红底/深蓝底或自定义颜色，按一寸、二寸、小一寸、大一寸、护照、签证标准尺寸裁剪，300dpi 高清 PNG 导出，支持六寸相纸排版打印，纯浏览器本地处理不上传照片',
  keywords: '证件照换底色,证件照换背景颜色,一寸照片尺寸,二寸照片尺寸,证件照蓝底,证件照白底,证件照排版打印,六寸相纸排版,签证照片尺寸',
  author: '有条工具',
  ogTitle: '证件照换底色排版 - 一寸二寸证件照换背景打印 | 有条工具',
  ogDescription: '自动识别背景一键换底色，标准证件尺寸裁剪，300dpi 导出与六寸相纸排版，本地处理不上传。',
  ogUrl: 'https://www.util.cn/tools/id-photo-maker',
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
          name: '证件照换底色排版',
          url: 'https://www.util.cn/tools/id-photo-maker',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '自动四角取样识别原背景色',
            '边缘泛洪换底色，不误伤人脸衣物',
            '边缘羽化减少白边',
            '白/蓝/红/深蓝/自定义底色',
            '一寸/二寸/小一寸/大一寸/护照/签证标准尺寸',
            '缩放与垂直偏移微调构图',
            '300dpi 高清 PNG 导出',
            '六寸相纸自动排版打印',
            '本地处理不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图像处理', item: 'https://www.util.cn/image/' },
            { '@type': 'ListItem', position: 3, name: '证件照换底色排版', item: 'https://www.util.cn/tools/id-photo-maker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '照片会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有换底色、裁剪与排版都在浏览器本页内存中完成，不发送任何网络请求，照片不保存，刷新或关闭页面后立即释放。' }
            },
            {
              '@type': 'Question',
              name: '为什么头发边缘有白边或杂色？',
              acceptedAnswer: { '@type': 'Answer', text: '发丝边缘本身是前景与背景的半透明混合区，自动换底只能按颜色相似度近似填充。可尝试调大相似色容差，但复杂背景与蓬松发丝的效果仍然有限，重要证件照建议到照相馆重拍。' }
            },
            {
              '@type': 'Question',
              name: '打印时尺寸不对怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '在系统打印对话框中选择对应的相纸（如六寸 152×102mm），缩放设为 100% 实际大小，不要选择适应页面；浏览器默认可能按 96% 缩放，改回 100% 后即为标准尺寸。' }
            },
            {
              '@type': 'Question',
              name: '换底色会改变照片里的人像吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。算法只替换与原背景颜色相近、且与照片边缘连通的像素，人脸与衣物区域不在替换范围内；建议导出前放大预览，确认发丝与衣领边缘效果。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 毫米 → 300dpi 像素：px = mm ÷ 25.4 × 300，四舍五入
function mmToPx300(mm) {
  return Math.round((mm / 25.4) * 300)
}

// 十六进制颜色 → { r, g, b }，支持 #RGB 与 #RRGGBB，非法输入回退白色
function hexToRgb(hex) {
  let h = String(hex || '').replace('#', '').trim()
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return { r: 255, g: 255, b: 255 }
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

// { r, g, b } → #RRGGBB（大写）
function rgbToHex(rgb) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return ('#' + c(rgb.r) + c(rgb.g) + c(rgb.b)).toUpperCase()
}

// RGBA 像素数组中，第 p 个像素与基准色的欧氏距离平方（i4 = p * 4）
function distSqToBase(data, i4, baseColor) {
  const dr = data[i4] - baseColor.r
  const dg = data[i4 + 1] - baseColor.g
  const db = data[i4 + 2] - baseColor.b
  return dr * dr + dg * dg + db * db
}

// 四角各 8×8 区域取 RGB 均值，作为原底色基准
function avgCornerColor(data, w, h) {
  if (!w || !h) return { r: 255, g: 255, b: 255 }
  const region = Math.max(1, Math.min(8, w, h))
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  const x0s = [0, w - region]
  const y0s = [0, h - region]
  for (const y0 of y0s) {
    for (const x0 of x0s) {
      for (let y = y0; y < y0 + region; y++) {
        for (let x = x0; x < x0 + region; x++) {
          const i4 = (y * w + x) * 4
          r += data[i4]
          g += data[i4 + 1]
          b += data[i4 + 2]
          n++
        }
      }
    }
  }
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }
}

// 泛洪像素总数护栏：超过则直接返回空 mask，防止超大图卡死主线程
const MAX_FLOOD_PIXELS = 1 << 22 // 4,194,304

// 边缘泛洪掩码：从图像四边所有与基准色距离 < tolerance 的像素出发 BFS，
// 只标记「与边缘连通的相似色区域」（防止把人脸里接近底色的区域误伤）。
// 显式队列 + mask 兼作 visited（入队前置 1，每像素至多入队一次）。
// 返回 Uint8Array：1 = 属于可替换背景。
function floodFillMask(data, w, h, baseColor, tolerance) {
  const total = w * h
  const mask = new Uint8Array(total)
  if (total === 0 || total > MAX_FLOOD_PIXELS) return mask
  const tolSq = tolerance * tolerance
  const queue = new Int32Array(total)
  let head = 0
  let tail = 0

  const tryVisit = (p) => {
    if (mask[p]) return
    if (distSqToBase(data, p * 4, baseColor) < tolSq) {
      mask[p] = 1
      queue[tail++] = p
    }
  }

  for (let x = 0; x < w; x++) {
    tryVisit(x)
    tryVisit((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    tryVisit(y * w)
    tryVisit(y * w + w - 1)
  }

  while (head < tail) {
    const p = queue[head++]
    const x = p % w
    const y = (p - x) / w
    if (x > 0) tryVisit(p - 1)
    if (x < w - 1) tryVisit(p + 1)
    if (y > 0) tryVisit(p - w)
    if (y < h - 1) tryVisit(p + w)
  }
  return mask
}

// 边缘羽化：对 mask 内像素计算替换不透明度（0-255）。
// 内部像素 255（完全不透明）；边界像素（4 邻域存在非 mask 像素）按
// 与基准色的距离比例衰减：越接近基准色替换越实，越接近容差边界越透明（0-100% 混合）。
function featherBlend(data, w, h, mask, baseColor, tolerance) {
  const total = w * h
  const alpha = new Uint8Array(total)
  if (total === 0 || tolerance <= 0) return alpha
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x
      if (!mask[p]) continue
      const isBoundary =
        (x > 0 && !mask[p - 1]) ||
        (x < w - 1 && !mask[p + 1]) ||
        (y > 0 && !mask[p - w]) ||
        (y < h - 1 && !mask[p + w])
      if (!isBoundary) {
        alpha[p] = 255
        continue
      }
      const dist = Math.sqrt(distSqToBase(data, p * 4, baseColor))
      const ratio = Math.min(1, dist / tolerance)
      alpha[p] = Math.round((1 - ratio) * 255)
    }
  }
  return alpha
}

// 六寸相纸排版常量
const SIX_INCH_W_MM = 152
const SIX_INCH_H_MM = 102
const SHEET_MARGIN_MM = 3
const SHEET_GAP_MM = 2

// 六寸相纸可容纳的行列数：内区 = 相纸 - 2×边距；
// cols = floor((内区宽 + 间距) / (照片宽 + 间距))，行同理
function layoutSixInch(photoWmm, photoHmm) {
  const innerW = SIX_INCH_W_MM - SHEET_MARGIN_MM * 2
  const innerH = SIX_INCH_H_MM - SHEET_MARGIN_MM * 2
  const cols = Math.max(0, Math.floor((innerW + SHEET_GAP_MM) / (photoWmm + SHEET_GAP_MM)))
  const rows = Math.max(0, Math.floor((innerH + SHEET_GAP_MM) / (photoHmm + SHEET_GAP_MM)))
  return { cols, rows, count: cols * rows }
}

// 排版槽位坐标（mm，在相纸内整体居中），用于逐张绝对定位
function sixInchSlots(photoWmm, photoHmm) {
  const { cols, rows } = layoutSixInch(photoWmm, photoHmm)
  const usedW = cols * photoWmm + (cols - 1) * SHEET_GAP_MM
  const usedH = rows * photoHmm + (rows - 1) * SHEET_GAP_MM
  const startX = (SIX_INCH_W_MM - usedW) / 2
  const startY = (SIX_INCH_H_MM - usedH) / 2
  const slots = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      slots.push({
        x: startX + c * (photoWmm + SHEET_GAP_MM),
        y: startY + r * (photoHmm + SHEET_GAP_MM),
        w: photoWmm,
        h: photoHmm
      })
    }
  }
  return slots
}

// 导出文件名：id-photo-一寸-白底.png
function buildPhotoFileName(sizeName, colorName) {
  return `id-photo-${sizeName}-${colorName}.png`
}

// ---------- 尺寸与颜色常量 ----------
const SIZES = [
  { id: 'one', name: '一寸', w: 25, h: 35, note: '社保、简历、考试报名' },
  { id: 'two', name: '二寸', w: 35, h: 49, note: '档案、部分出国材料' },
  { id: 'small-one', name: '小一寸', w: 22, h: 32, note: '驾驶证等小尺寸证件' },
  { id: 'big-one', name: '大一寸', w: 33, h: 48, note: '港澳通行证等' },
  { id: 'passport', name: '护照', w: 33, h: 48, note: '中国护照申请' },
  { id: 'visa', name: '签证', w: 51, h: 51, note: '美国签证（正方形）' }
].map((s) => ({ ...s, pxW: mmToPx300(s.w), pxH: mmToPx300(s.h) }))

const COLOR_PRESETS = [
  { id: 'white', name: '白底', hex: '#FFFFFF' },
  { id: 'blue', name: '蓝底', hex: '#438EDB' },
  { id: 'red', name: '红底', hex: '#D9001B' },
  { id: 'navy', name: '深蓝底', hex: '#1B4A7A' }
]

const WORK_MAX_SIDE = 1600  // 工作分辨率上限（长边），平衡性能与画质
const REPROCESS_DELAY = 200 // 容差/底色改动后的防抖毫秒数

// ---------- 状态 ----------
const photoUrl = ref('')
const selectedSizeId = ref('one')
const targetColor = ref('#FFFFFF')
const detectedColor = ref('')
const tolerance = ref(45)
const scalePercent = ref(100)
const offsetYPercent = ref(0)
const status = ref('idle') // idle | working | ready | error
const errorMsg = ref('')
const previewDataUrl = ref('')
const seoContentVisible = ref(true)

const previewCanvasRef = ref(null)
const fileInputRef = ref(null)

// 非响应式工作对象（仅用户回调中创建/使用，SSR 安全）
let sourceImg = null      // 原始 HTMLImageElement
let workCanvas = null     // 工作分辨率原始像素画布
let workData = null       // 原始 ImageData 缓存（换底算法输入）
let swappedCanvas = null  // 换底后的画布（裁剪预览的输入）
let bgTimer = null

const selectedSize = computed(() => SIZES.find((s) => s.id === selectedSizeId.value) || SIZES[0])
const canExport = computed(() => status.value === 'ready')
const colorDisplayName = computed(() => {
  const hit = COLOR_PRESETS.find((p) => p.hex.toUpperCase() === targetColor.value.toUpperCase())
  return hit ? hit.name : '自定义'
})
const layoutInfo = computed(() => {
  const s = selectedSize.value
  const l = layoutSixInch(s.w, s.h)
  return `${s.name}（${s.w}×${s.h}mm）可排 ${l.cols} 列 × ${l.rows} 行，共 ${l.count} 张`
})
const printSlots = computed(() => sixInchSlots(selectedSize.value.w, selectedSize.value.h))
const previewBoxStyle = computed(() => {
  const s = selectedSize.value
  const height = 300
  return { height: height + 'px', width: Math.round((height * s.w) / s.h) + 'px' }
})

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 照片读取（仅内存，仅用户回调） ----------
const readFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('读取失败'))
    reader.readAsDataURL(file)
  })
}

const loadImageEl = (dataUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解码失败'))
    img.src = dataUrl
  })
}

// 建立工作分辨率画布并缓存原始像素，供容差/底色变化时反复重算
function buildWorkCanvas() {
  const longest = Math.max(sourceImg.naturalWidth, sourceImg.naturalHeight)
  const scale = Math.min(1, WORK_MAX_SIDE / longest)
  const w = Math.max(1, Math.round(sourceImg.naturalWidth * scale))
  const h = Math.max(1, Math.round(sourceImg.naturalHeight * scale))
  workCanvas = document.createElement('canvas')
  workCanvas.width = w
  workCanvas.height = h
  const ctx = workCanvas.getContext('2d')
  ctx.drawImage(sourceImg, 0, 0, w, h)
  workData = ctx.getImageData(0, 0, w, h)
  swappedCanvas = document.createElement('canvas')
  swappedCanvas.width = w
  swappedCanvas.height = h
}

const onFileChange = async (event) => {
  const input = event.target
  const file = input.files && input.files[0]
  input.value = ''
  if (!file) return
  if (!file.type || file.type.indexOf('image/') !== 0) {
    status.value = 'error'
    errorMsg.value = '请选择图片文件（JPG / PNG）'
    return
  }
  try {
    const dataUrl = await readFileAsDataUrl(file)
    const img = await loadImageEl(dataUrl)
    sourceImg = img
    photoUrl.value = dataUrl
    buildWorkCanvas()
    errorMsg.value = ''
    scheduleReprocess()
  } catch (e) {
    status.value = 'error'
    errorMsg.value = '图片读取或解码失败，请换一张照片试试'
  }
}

function triggerReupload() {
  if (fileInputRef.value) fileInputRef.value.click()
}

// ---------- 换底色处理（Canvas 像素级，仅用户回调触发） ----------
function scheduleReprocess() {
  if (!workData) return
  status.value = 'working'
  if (bgTimer) clearTimeout(bgTimer)
  bgTimer = setTimeout(() => {
    bgTimer = null
    reprocessBg()
  }, REPROCESS_DELAY)
}

function reprocessBg() {
  if (!workData || !swappedCanvas) return
  const { data, width: w, height: h } = workData
  // 1. 四角取样确定原底色
  const base = avgCornerColor(data, w, h)
  detectedColor.value = rgbToHex(base)
  // 2. 边缘泛洪，只标记与边缘连通的相似色区域
  const mask = floodFillMask(data, w, h, base, tolerance.value)
  // 3. 边界羽化
  const alpha = featherBlend(data, w, h, mask, base, tolerance.value)
  // 4. 按目标色合成
  const target = hexToRgb(targetColor.value)
  const sctx = swappedCanvas.getContext('2d')
  const out = sctx.createImageData(w, h)
  const od = out.data
  const total = w * h
  for (let p = 0, i4 = 0; p < total; p++, i4 += 4) {
    const a = mask[p] ? alpha[p] / 255 : 0
    od[i4] = target.r * a + data[i4] * (1 - a)
    od[i4 + 1] = target.g * a + data[i4 + 1] * (1 - a)
    od[i4 + 2] = target.b * a + data[i4 + 2] * (1 - a)
    od[i4 + 3] = 255
  }
  sctx.putImageData(out, 0, 0)
  status.value = 'ready'
  renderPreview()
}

// ---------- 构图裁剪预览（300dpi 输出画布，预览/导出/打印共用） ----------
function renderPreview() {
  const canvas = previewCanvasRef.value
  if (!canvas || !swappedCanvas) return
  const size = selectedSize.value
  const pw = mmToPx300(size.w)
  const ph = mmToPx300(size.h)
  canvas.width = pw
  canvas.height = ph
  const ctx = canvas.getContext('2d')
  const target = hexToRgb(targetColor.value)
  ctx.fillStyle = 'rgb(' + target.r + ',' + target.g + ',' + target.b + ')'
  ctx.fillRect(0, 0, pw, ph)

  const iw = swappedCanvas.width
  const ih = swappedCanvas.height
  const cover = Math.max(pw / iw, ph / ih)
  const drawScale = cover * (scalePercent.value / 100)
  const dw = iw * drawScale
  const dh = ih * drawScale
  const avail = Math.max(0, dh - ph)
  const shift = (offsetYPercent.value / 100) * avail
  const dx = (pw - dw) / 2
  const dy = (ph - dh) / 2 + shift
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(swappedCanvas, dx, dy, dw, dh)

  previewDataUrl.value = canvas.toDataURL('image/png')
}

// ---------- 导出与打印 ----------
function downloadPng() {
  const canvas = previewCanvasRef.value
  if (!canvas || !canExport.value) return
  const link = document.createElement('a')
  link.download = buildPhotoFileName(selectedSize.value.name, colorDisplayName.value)
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function printSheet() {
  if (!canExport.value) return
  window.print()
}

function resetAll() {
  if (bgTimer) {
    clearTimeout(bgTimer)
    bgTimer = null
  }
  sourceImg = null
  workCanvas = null
  workData = null
  swappedCanvas = null
  photoUrl.value = ''
  selectedSizeId.value = 'one'
  targetColor.value = '#FFFFFF'
  detectedColor.value = ''
  tolerance.value = 45
  scalePercent.value = 100
  offsetYPercent.value = 0
  previewDataUrl.value = ''
  errorMsg.value = ''
  status.value = 'idle'
}

// 容差/底色变化 → 防抖重处理；缩放/偏移/尺寸变化 → 立即重绘预览
watch([tolerance, targetColor], () => { scheduleReprocess() })
watch([scalePercent, offsetYPercent, selectedSizeId], () => { renderPreview() })

onMounted(() => {
  addRecentTool('id-photo-maker')
})

onBeforeUnmount(() => {
  if (bgTimer) {
    clearTimeout(bgTimer)
    bgTimer = null
  }
})
</script>

<style scoped>
.six-sheet {
  position: relative;
  width: 152mm;
  height: 102mm;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-radius: 2px;
  overflow: hidden;
  flex-shrink: 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.photo-slot {
  position: absolute;
  border: 1px dashed rgba(0, 0, 0, 0.2);
  overflow: hidden;
  background: #f5f5f4;
}

@media print {
  @page {
    size: 152mm 102mm;
    margin: 0;
  }

  .no-print {
    display: none !important;
  }

  .tools-grid {
    display: block !important;
  }

  .preview-panel {
    border: none !important;
    padding: 0 !important;
    background: transparent !important;
  }

  .sheet-scroll {
    overflow: visible !important;
  }

  .six-sheet {
    height: 101.5mm;
    box-shadow: none;
    border-radius: 0;
  }

  .photo-slot {
    border-color: transparent;
    background: transparent;
  }
}
</style>
