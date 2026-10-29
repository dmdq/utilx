<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <IdCard class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">名片生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">90×54mm 标准尺寸 · 3mm 出血 · 300dpi 印刷级导出 · 正反面实时预览</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线名片生成工具：按标准横版名片 90×54mm、四边各 3mm 出血、300dpi 建稿，填写姓名、职位、公司、电话、邮箱、地址等信息后，
        正反两面在右侧实时排版预览，支持 8 种主题色与自定义色、左对齐 / 居中两套排版、Logo 上传（正面左上角可选展示）、
        出血线与安全线标线预览，一键导出正面 / 背面 300dpi PNG 直接送印。全部绘制由浏览器 Canvas 本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：编辑面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <!-- 正面信息 -->
        <div class="space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <IdCard class="w-5 h-5 mr-2 text-primary" /> 正面信息
          </h2>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">姓名</label>
            <input v-model="form.name" type="text" maxlength="20" placeholder="张明"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">职位</label>
            <input v-model="form.title" type="text" maxlength="24" placeholder="产品经理"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">公司名</label>
            <input v-model="form.company" type="text" maxlength="30" placeholder="云帆科技有限公司"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs font-medium text-muted-foreground mb-1 block">手机</label>
              <input v-model="form.mobile" type="text" maxlength="24" placeholder="138 0000 0000"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label class="text-xs font-medium text-muted-foreground mb-1 block">电话（选填）</label>
              <input v-model="form.phone" type="text" maxlength="24" placeholder="021-8888 6666"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">邮箱</label>
            <input v-model="form.email" type="text" maxlength="40" placeholder="name@company.com"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">地址</label>
            <input v-model="form.address" type="text" maxlength="60" placeholder="上海市浦东新区博云路 2 号"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">网站（选填）</label>
            <input v-model="form.website" type="text" maxlength="40" placeholder="www.company.com"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>

        <!-- 背面信息 -->
        <div class="space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Palette class="w-5 h-5 mr-2 text-primary" /> 背面信息
          </h2>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs font-medium text-muted-foreground">背面公司名</label>
              <button
                @click="toggleBackLock"
                class="text-xs text-primary hover:underline"
              >{{ backLocked ? '解锁独立编辑' : '重新同步正面' }}</button>
            </div>
            <input v-if="!backLocked" v-model="form.backCompany" type="text" maxlength="30" placeholder="与正面相同"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <p v-else class="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-muted-foreground truncate">
              同步正面：{{ form.company || '（未填写）' }}
            </p>
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">Slogan（一句话）</label>
            <input v-model="form.slogan" type="text" maxlength="40" placeholder="让每一次连接更有价值"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">网址（选填）</label>
            <input v-model="form.backWebsite" type="text" maxlength="40" placeholder="www.company.com"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>

        <!-- 主题与排版 -->
        <div class="space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Palette class="w-5 h-5 mr-2 text-primary" /> 主题与排版
          </h2>
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-2">主题色</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="c in PRESET_COLORS"
                :key="c.value"
                @click="themeColor = c.value"
                :title="c.name"
                class="w-8 h-8 rounded-lg border-2 transition flex items-center justify-center"
                :class="themeColor.toLowerCase() === c.value ? 'border-foreground ring-2 ring-primary/30' : 'border-transparent hover:border-border'"
                :style="{ backgroundColor: c.value }"
              >
                <CheckCircle v-if="themeColor.toLowerCase() === c.value" class="w-4 h-4 text-white" />
              </button>
            </div>
            <div class="flex items-center gap-2 mt-2">
              <input v-model="themeColor" type="color"
                class="w-8 h-8 rounded cursor-pointer border border-border bg-background p-0.5" />
              <span class="text-xs text-muted-foreground font-mono">{{ themeColor }}</span>
              <span class="text-xs text-muted-foreground">自定义主题色</span>
            </div>
          </div>
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-2">排版预设（正面）</p>
            <div class="flex gap-2">
              <button
                v-for="p in LAYOUT_PRESETS"
                :key="p.id"
                @click="layoutPreset = p.id"
                class="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition"
                :class="layoutPreset === p.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'"
              >{{ p.name }}</button>
            </div>
          </div>
        </div>

        <!-- Logo 上传 -->
        <div class="space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <ImagePlus class="w-5 h-5 mr-2 text-primary" /> Logo 上传（选填）
          </h2>
          <label class="flex items-center gap-2 px-3 py-2.5 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/60 transition">
            <ImagePlus class="w-4 h-4 text-primary flex-shrink-0" />
            <span class="text-xs text-muted-foreground">{{ logoDataUrl ? '已上传，点击更换' : '上传 Logo 图片（PNG / JPG，≤1MB）' }}</span>
            <input type="file" accept="image/*" class="hidden" @change="handleLogoChange" />
          </label>
          <p v-if="logoError" class="text-xs text-red-500 flex items-center gap-1">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0" />{{ logoError }}
          </p>
          <div v-if="logoDataUrl" class="flex items-center justify-between">
            <img :src="logoDataUrl" alt="Logo 预览" class="h-8 rounded border border-border bg-white px-1" />
            <button @click="removeLogo" class="text-xs text-red-500 hover:underline">移除 Logo</button>
          </div>
          <label v-if="logoDataUrl" class="flex items-center justify-between cursor-pointer">
            <span class="text-xs text-foreground">正面左上角显示 Logo</span>
            <input type="checkbox" v-model="showFrontLogo" class="w-4 h-4" />
          </label>
        </div>

        <!-- 标线开关 -->
        <label class="flex items-center justify-between cursor-pointer bg-muted/40 border border-border rounded-lg px-3 py-2.5">
          <span class="text-xs text-foreground leading-snug">显示出血线 / 安全线<span class="text-muted-foreground">（仅预览，不进导出）</span></span>
          <input type="checkbox" v-model="showGuides" class="w-4 h-4 flex-shrink-0" />
        </label>

        <button
          @click="resetAll"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认示例数据
        </button>
      </div>

      <!-- 右：实时预览（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <IdCard class="w-5 h-5 mr-2 text-primary" /> 实时预览
          </h2>
          <span class="text-xs text-muted-foreground font-mono">{{ sizeInfoText }}</span>
        </div>

        <div v-if="showGuides" class="flex items-center gap-4 text-xs text-muted-foreground">
          <span class="flex items-center gap-1.5"><i class="w-4 border-t-2 border-dashed border-red-500 inline-block"></i>出血 / 裁切线</span>
          <span class="flex items-center gap-1.5"><i class="w-4 border-t-2 border-dashed border-green-500 inline-block"></i>安全区（成品边内缩 3mm）</span>
        </div>

        <!-- 正反面画布：内部按 300dpi 全分辨率绘制，屏幕上按宽度自适应缩放 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">正面</span>
            </div>
            <canvas
              ref="frontCanvasRef"
              :width="cardSize.width"
              :height="cardSize.height"
              class="w-full h-auto block rounded-lg border border-border bg-white shadow-sm"
            ></canvas>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">背面</span>
            </div>
            <canvas
              ref="backCanvasRef"
              :width="cardSize.width"
              :height="cardSize.height"
              class="w-full h-auto block rounded-lg border border-border bg-white shadow-sm"
            ></canvas>
          </div>
        </div>

        <!-- 完整性提示 -->
        <p
          v-if="missingFields.length"
          class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-amber-600 flex items-start gap-1.5"
        >
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>姓名和手机号建议填写（当前缺少：{{ missingFields.join('、') }}）。</span>
        </p>
        <p v-else class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
          <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>姓名与手机号已填写，名片信息完整。</span>
        </p>

        <!-- 导出 -->
        <div class="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            导出的 PNG 已包含四边各 3mm 出血（画布 {{ bleedMm }}×{{ bleedMm + cardHMm }}mm @300dpi）。
            送印时请提前告知印刷厂「成品 90×54mm、四边出血 3mm」的规格，印刷厂按出血线裁切后即为成品尺寸。
          </p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            @click="exportCard('front')"
            class="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            <Download class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 导出正面 PNG
          </button>
          <button
            @click="exportCard('back')"
            class="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            <Download class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 导出背面 PNG
          </button>
        </div>
        <p v-if="exportStatus" class="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle class="w-3.5 h-3.5 flex-shrink-0" />{{ exportStatus }}
        </p>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>名片生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          名片生成器是一款纯浏览器本地运行的在线名片设计工具。它按国内最常见的横版名片规格 90×54mm 建稿，四边各预留 3mm 出血，
          以 300dpi（印刷级分辨率）在 Canvas 上实时绘制正反两面：正面包含姓名、职位、公司名、手机、电话、邮箱、地址与网站，
          背面包含公司名、Slogan 与网址；支持 8 种预设主题色与自定义色、左对齐 / 居中两套排版预设、Logo 上传，
          并可叠加出血线（红虚线）与安全线（绿虚线）辅助排版。填写过程中输入防抖 200ms 自动重绘，一键导出 300dpi PNG 送印。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">标准名片尺寸与出血是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          国内标准横版名片成品尺寸为 90mm × 54mm。出血（Bleed）是为避免裁切误差留出的「裁切余量」：底色与图片要向外多延伸 3mm，
          印刷厂裁切时刀线落在成品线附近，即使有 1-2mm 偏差也不会切出白边。因此本工具的画布实际为 (90+6) × (54+6) = 96×60mm，
          画布上的红色虚线即裁切线（成品边界），绿色虚线是安全区——重要文字与 Logo 请都放在安全区内（成品边再内缩 3mm），
          防止裁切偏移时被切掉。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">300dpi 是怎么算的？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          dpi（dots per inch）指每英寸像素数，300dpi 是印刷品的通用分辨率标准。换算公式：像素 = 毫米 ÷ 25.4 × 300。
          名片 90mm → 1063px，54mm → 638px；加出血后 96mm → 1134px，60mm → 709px，即导出画布为 1134×709 像素。
          本工具的预览画布内部就是按这个全分辨率绘制的，屏幕上只是 CSS 缩小显示（内部分辨率远高于显示尺寸乘以设备像素比），
          所以预览清晰、导出即所得。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">名片设计的留白与字体建议</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>文字与 Logo 全部放进安全区（成品边内缩 3mm），距裁切线太近容易被切掉或视觉局促。</li>
          <li>姓名建议 12-18pt，职位、公司 8-11pt，联系方式不小于 6pt（约 25px @300dpi），太小难以阅读。</li>
          <li>深色底配白字、浅色底配深字；本工具按背景相对亮度自动切换文字颜色（亮度阈值 0.45），无需手动调。</li>
          <li>单面信息行数控制在 5 行以内，地址过长时工具会自动截断省号显示，正式送印前建议精简地址。</li>
          <li>中文字体优先选择黑体类（思源黑体、苹方、微软雅黑），小字号避免用宋体细体，印刷后易发虚。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">PNG 能直接送印吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          可以。绝大多数数码快印店与名片印刷厂都接受 300dpi 的 PNG / JPG 位稿收印，本工具导出的 PNG 已含 3mm 出血，
          下载时页面也会提示你向印刷厂说明出血规格。两点注意：一是 PNG 为 RGB 色彩，印刷用 CMYK 四色，深色与高饱和色会有轻微色差，
          对颜色要求高建议先打样；二是若印刷厂要求矢量源文件（AI / PDF / CDR），可把导出的 PNG 交给设计师作为排版底稿快速转制。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">名片数据会上传到服务器吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。正反面全部由浏览器 Canvas 本地绘制，Logo 通过 FileReader 在本地读取，不产生任何网络请求。为了下次打开免重填，仅姓名等文字字段与主题色会保存在你本机的 localStorage（不含 Logo 图片数据），清除浏览器站点数据即可删除。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么预览颜色和印刷成品有色差？</h3>
            <p class="text-sm text-muted-foreground mt-1">屏幕是 RGB 发光成像，印刷是 CMYK 油墨反光成像，色域不同必然存在差异，纸张的吸墨性也会影响最终成色。藏蓝、墨绿等深色通常印刷后更深沉，金棕等颜色偏差更明显；重要场合建议先打样确认。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">背面公司名怎么独立修改？</h3>
            <p class="text-sm text-muted-foreground mt-1">背面公司名默认与正面同步，点击「解锁独立编辑」后可单独填写，改正面不再影响背面；点击「重新同步正面」即可恢复跟随。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'business-card-generator'" :category="'design'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  IdCard, Palette, Download, RefreshCw,
  ChevronUp, ChevronDown, TriangleAlert, CheckCircle, Info, ImagePlus
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '名片生成器 - 在线名片设计制作工具，90×54mm 300dpi 含出血',
  description: '免费在线名片生成器：按 90×54mm 标准尺寸、四边 3mm 出血、300dpi 印刷级建稿，正反面实时排版预览，8 种主题色、左对齐/居中排版、Logo 上传与出血线安全线标线，一键导出 PNG 直接送印，纯浏览器本地渲染不上传数据。',
  keywords: '名片生成器,在线名片制作,名片设计,名片模板,免费名片,300dpi,名片出血,名片尺寸,名片PNG',
  author: '有条工具',
  ogTitle: '名片生成器 - 在线名片设计制作工具 | 有条工具',
  ogDescription: '90×54mm 标准尺寸、3mm 出血、300dpi 印刷级导出，正反面实时预览，本地渲染不上传。',
  ogUrl: 'https://www.util.cn/tools/business-card-generator',
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
          name: '名片生成器',
          url: 'https://www.util.cn/tools/business-card-generator',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['90×54mm 标准名片尺寸', '四边 3mm 出血', '300dpi 印刷级 PNG 导出', '正反面排版与实时预览', '8 种主题色与自定义色', '左对齐 / 居中排版预设', 'Logo 上传与出血线安全线预览', '本地渲染不上传数据']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '设计工具', item: 'https://www.util.cn/design/' },
            { '@type': 'ListItem', position: 3, name: '名片生成器', item: 'https://www.util.cn/tools/business-card-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '名片数据会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。正反面全部由浏览器 Canvas 本地绘制，Logo 通过 FileReader 在本地读取，不产生任何网络请求。仅文字字段与主题色保存在本机 localStorage（不含 Logo 图片数据），清除浏览器站点数据即可删除。' }
            },
            {
              '@type': 'Question',
              name: '为什么预览颜色和印刷成品有色差？',
              acceptedAnswer: { '@type': 'Answer', text: '屏幕是 RGB 发光成像，印刷是 CMYK 油墨反光成像，色域不同必然存在差异，纸张吸墨性也会影响成色。深色印刷后通常更深沉，对颜色要求高建议先打样。' }
            },
            {
              '@type': 'Question',
              name: '背面公司名怎么独立修改？',
              acceptedAnswer: { '@type': 'Answer', text: '背面公司名默认与正面同步，点击解锁独立编辑后可单独填写，改正面不再影响背面；点击重新同步正面即可恢复跟随。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const PRINT_DPI = 300 // 印刷标准分辨率
const CARD_W_MM = 90  // 名片成品宽（mm）
const CARD_H_MM = 54  // 名片成品高（mm）
const BLEED_MM = 3    // 四边出血（mm）
const SAFE_MM = 3     // 安全区相对成品边内缩（mm）
const LOGO_MAX_BYTES = 1024 * 1024 // Logo 上限 1MB

// 毫米 → 300dpi 像素（四舍五入取整）：px = mm ÷ 25.4 × 300
function mmToPx(mm) {
  return Math.round((mm / 25.4) * PRINT_DPI)
}

// 画布尺寸：withBleed=true 为含四边 3mm 出血的建稿画布（96×60mm），false 为成品尺寸（90×54mm）
function cardCanvasSize(withBleed) {
  const wMm = CARD_W_MM + (withBleed ? BLEED_MM * 2 : 0)
  const hMm = CARD_H_MM + (withBleed ? BLEED_MM * 2 : 0)
  return { width: mmToPx(wMm), height: mmToPx(hMm) }
}

// 安全区矩形：在给定画布内，从成品裁切边再内缩 SAFE_MM
function safeAreaRect(size) {
  const inset = mmToPx(BLEED_MM + SAFE_MM)
  return { x: inset, y: inset, width: size.width - inset * 2, height: size.height - inset * 2 }
}

// '#rgb' / '#rrggbb' → { r, g, b }（0-255），非法输入返回 null
function hexToRgb(hex) {
  if (typeof hex !== 'string') return null
  let h = hex.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  }
}

// 相对亮度：0.2126R + 0.7152G + 0.0722B（RGB 归一化到 0-1）
function relativeLuminance(rgb) {
  if (!rgb) return 0
  return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255
}

// 文字颜色自动对比：亮度 L > 0.45 → 深灰字，否则白字
function pickTextColor(hex) {
  return relativeLuminance(hexToRgb(hex)) > 0.45 ? '#111827' : '#ffffff'
}

// 预览下方黄条：姓名 / 手机号缺失检查
function missingHintFields(fields) {
  const out = []
  if (!String(fields.name || '').trim()) out.push('姓名')
  if (!String(fields.mobile || '').trim()) out.push('手机号')
  return out
}

// 导出文件名
function exportFilename(side) {
  return `business-card-${side === 'back' ? 'back' : 'front'}-300dpi.png`
}

// 8 个预设主题色（均为深色系，配白字）
const PRESET_COLORS = [
  { name: '藏蓝', value: '#1e3a5f' },
  { name: '墨绿', value: '#14532d' },
  { name: '酒红', value: '#7f1d1d' },
  { name: '深灰', value: '#374151' },
  { name: '金棕', value: '#a16207' },
  { name: '紫', value: '#5b21b6' },
  { name: '青', value: '#0e7490' },
  { name: '黑', value: '#111111' }
]
const DEFAULT_THEME_COLOR = '#1e3a5f'
const LAYOUT_PRESETS = [
  { id: 'left', name: '左对齐' },
  { id: 'center', name: '居中' }
]

// 默认示例数据（中性虚构信息）
function defaultFormData() {
  return {
    name: '张明',
    title: '产品经理',
    company: '云帆科技有限公司',
    mobile: '138 0000 0000',
    phone: '',
    email: 'zhangming@yunfan.example.com',
    address: '上海市浦东新区博云路 2 号 201 室',
    website: 'www.yunfan.example.com',
    slogan: '让每一次连接更有价值',
    backWebsite: 'www.yunfan.example.com',
    backCompany: ''
  }
}

const STORAGE_KEY = 'business-card-generator'

// ---------- 表单与视图状态 ----------
const form = reactive(defaultFormData())
const themeColor = ref(DEFAULT_THEME_COLOR)
const layoutPreset = ref('left') // 'left' | 'center'
const backLocked = ref(true)     // true：背面公司名同步正面
const showGuides = ref(false)    // 出血线 / 安全线（仅预览层）
const showFrontLogo = ref(true)  // 正面左上角 Logo 开关
const logoDataUrl = ref('')
const logoError = ref('')
const exportStatus = ref('')
const seoContentVisible = ref(true)

// 画布尺寸常量（1134×709 含出血；成品 1063×638，按 mmToPx 实际取整）
const cardSize = cardCanvasSize(true)
const trimSize = cardCanvasSize(false)
const safeRect = safeAreaRect(cardSize)
const bleedMm = CARD_W_MM + BLEED_MM * 2  // 建稿画布宽 mm（96）
const cardHMm = CARD_H_MM + BLEED_MM * 2  // 建稿画布高 mm（60）

const sizeInfoText = computed(() =>
  `含出血 ${cardSize.width}×${cardSize.height}px · 成品 ${trimSize.width}×${trimSize.height}px（90×54mm @300dpi）`
)

const missingFields = computed(() => missingHintFields({ name: form.name, mobile: form.mobile }))

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

function toggleBackLock() {
  if (backLocked.value) {
    form.backCompany = form.company
    backLocked.value = false
  } else {
    backLocked.value = true
  }
}

// ---------- Canvas 绘制（仅在 onMounted 之后 / 用户回调中调用，SSR 安全） ----------
const frontCanvasRef = ref(null)
const backCanvasRef = ref(null)
const logoImg = ref(null) // HTMLImageElement

// 画布内部固定按 300dpi 全分辨率（1134×709）绘制，屏幕上由 CSS 按宽度缩放显示：
// 内部像素数远大于「显示尺寸 × devicePixelRatio」（2~3 倍屏也只需约 800px），缩放后依然锐利，
// 同时导出无需重建画布即可直接得到印刷级分辨率。
const CANVAS_FONT = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif'

function setFont(ctx, px, bold = false) {
  ctx.font = `${bold ? '700' : '400'} ${px}px ${CANVAS_FONT}`
}

// 超宽文本截断加省略号（单行）
function fitText(ctx, text, maxW) {
  if (!text) return ''
  if (ctx.measureText(text).width <= maxW) return text
  let t = text
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1)
  return t + '…'
}

// 等比缩放把图片放进方框内居中
function drawImageContain(ctx, img, x, y, boxW, boxH) {
  if (!img || !img.width || !img.height) return
  const scale = Math.min(boxW / img.width, boxH / img.height)
  const w = img.width * scale
  const h = img.height * scale
  ctx.drawImage(img, x + (boxW - w) / 2, y + (boxH - h) / 2, w, h)
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// 联系方式小图标：canvas 简单几何符号（mobile/phone/mail/pin/globe）
function drawContactIcon(ctx, type, x, y, s, color) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = Math.max(2, s * 0.09)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (type === 'mobile') {
    roundedRectPath(ctx, x + s * 0.24, y, s * 0.52, s, s * 0.14)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x + s * 0.42, y + s * 0.84)
    ctx.lineTo(x + s * 0.58, y + s * 0.84)
    ctx.stroke()
  } else if (type === 'phone') {
    // 话筒：一段粗弧 + 两端圆点
    ctx.lineWidth = s * 0.2
    ctx.beginPath()
    ctx.arc(x + s * 0.5, y + s * 0.3, s * 0.32, Math.PI * 0.2, Math.PI * 0.8)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x + s * 0.2, y + s * 0.4, s * 0.11, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + s * 0.8, y + s * 0.4, s * 0.11, 0, Math.PI * 2)
    ctx.fill()
  } else if (type === 'mail') {
    roundedRectPath(ctx, x, y + s * 0.16, s, s * 0.68, s * 0.08)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x + s * 0.06, y + s * 0.24)
    ctx.lineTo(x + s * 0.5, y + s * 0.56)
    ctx.lineTo(x + s * 0.94, y + s * 0.24)
    ctx.stroke()
  } else if (type === 'pin') {
    ctx.beginPath()
    ctx.arc(x + s * 0.5, y + s * 0.36, s * 0.28, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x + s * 0.28, y + s * 0.52)
    ctx.lineTo(x + s * 0.72, y + s * 0.52)
    ctx.lineTo(x + s * 0.5, y + s)
    ctx.closePath()
    ctx.fill()
  } else if (type === 'globe') {
    ctx.beginPath()
    ctx.arc(x + s * 0.5, y + s * 0.5, s * 0.42, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x + s * 0.08, y + s * 0.5)
    ctx.lineTo(x + s * 0.92, y + s * 0.5)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.18, s * 0.42, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

// 联系方式行（按填写顺序，最多 5 行）
function buildContactRows() {
  const rows = []
  if (form.mobile.trim()) rows.push({ icon: 'mobile', text: form.mobile.trim() })
  if (form.phone.trim()) rows.push({ icon: 'phone', text: form.phone.trim() })
  if (form.email.trim()) rows.push({ icon: 'mail', text: form.email.trim() })
  if (form.address.trim()) rows.push({ icon: 'pin', text: form.address.trim() })
  if (form.website.trim()) rows.push({ icon: 'globe', text: form.website.trim() })
  return rows
}

// 正面：左对齐 = 白底 + 主题色左侧竖条；居中 = 主题色满底
function drawFront(ctx, size, safe) {
  const theme = themeColor.value
  const centered = layoutPreset.value === 'center'
  const rows = buildContactRows()
  const ROW_H = 40
  const ICON_S = 26
  const GAP = 14
  const hasLogo = !!(logoImg.value && showFrontLogo.value)
  const LOGO_BOX = 90

  if (centered) {
    ctx.fillStyle = theme
    ctx.fillRect(0, 0, size.width, size.height)
  } else {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size.width, size.height)
    ctx.fillStyle = theme
    ctx.fillRect(0, 0, mmToPx(6), size.height) // 左侧主题色竖条（出血到边）
  }

  // 文字颜色按实际文字背景自动对比
  const ink = centered ? pickTextColor(theme) : pickTextColor('#ffffff')
  const companyColor = centered ? ink : theme

  const contentX = Math.max(safe.x, (centered ? 0 : mmToPx(6)) + mmToPx(3))
  const contentW = safe.x + safe.width - contentX

  // 正面左上角 Logo（可选）
  let top = safe.y + (hasLogo ? LOGO_BOX + 14 : 16)
  if (hasLogo) drawImageContain(ctx, logoImg.value, contentX, safe.y, LOGO_BOX, LOGO_BOX)

  // 有 Logo 时字号轻微缩小，防止纵向溢出安全区
  const k = hasLogo ? 0.85 : 1
  const NAME_PX = Math.round(72 * k)
  const TITLE_PX = Math.round(36 * k)
  const COMPANY_PX = Math.round(40 * k)

  ctx.textBaseline = 'top'
  ctx.textAlign = centered ? 'center' : 'left'
  const tx = centered ? size.width / 2 : contentX

  if (form.name.trim()) {
    setFont(ctx, NAME_PX, true)
    ctx.fillStyle = ink
    ctx.fillText(form.name.trim(), tx, top)
    top += NAME_PX + 10
  }
  if (form.title.trim()) {
    setFont(ctx, TITLE_PX)
    ctx.globalAlpha = 0.85
    ctx.fillStyle = ink
    ctx.fillText(form.title.trim(), tx, top)
    ctx.globalAlpha = 1
    top += TITLE_PX + 8
  }
  if (form.company.trim()) {
    setFont(ctx, COMPANY_PX, true)
    ctx.fillStyle = companyColor
    ctx.fillText(fitText(ctx, form.company.trim(), contentW), tx, top)
    top += COMPANY_PX
  }

  // 联系方式贴安全区底部排布
  if (rows.length) {
    const contactsTop = safe.y + safe.height - rows.length * ROW_H - 6
    // 底部细线装饰
    ctx.globalAlpha = 0.45
    ctx.fillStyle = centered ? ink : theme
    const lineW = centered ? Math.round(contentW * 0.6) : contentW
    const lineX = centered ? Math.round((size.width - lineW) / 2) : contentX
    ctx.fillRect(lineX, contactsTop - 22, lineW, 3)
    ctx.globalAlpha = 1

    setFont(ctx, 30)
    ctx.fillStyle = ink
    ctx.textBaseline = 'middle'
    const maxTextW = contentW - ICON_S - GAP
    rows.forEach((row, i) => {
      const rowCy = contactsTop + i * ROW_H + ROW_H / 2
      const label = fitText(ctx, row.text, maxTextW)
      if (centered) {
        const textW = ctx.measureText(label).width
        const x0 = (size.width - (ICON_S + GAP + textW)) / 2
        drawContactIcon(ctx, row.icon, x0, rowCy - ICON_S / 2, ICON_S, ink)
        ctx.fillText(label, x0 + ICON_S + GAP + textW / 2, rowCy)
      } else {
        drawContactIcon(ctx, row.icon, contentX, rowCy - ICON_S / 2, ICON_S, ink)
        ctx.fillText(label, contentX + ICON_S + GAP, rowCy)
      }
    })
  }
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

// 背面：主题色满底，公司名 + Slogan + 网址，Logo 右上角
function drawBack(ctx, size, safe) {
  const theme = themeColor.value
  const ink = pickTextColor(theme)
  const hasLogo = !!logoImg.value
  const LOGO_BOX = 120

  ctx.fillStyle = theme
  ctx.fillRect(0, 0, size.width, size.height)
  if (hasLogo) drawImageContain(ctx, logoImg.value, safe.x + safe.width - LOGO_BOX, safe.y, LOGO_BOX, LOGO_BOX)

  const company = (backLocked.value ? form.company : (form.backCompany || form.company)).trim()
  const cx = size.width / 2
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  let y = safe.y + Math.round(safe.height * 0.24)
  if (company) {
    setFont(ctx, 64, true)
    ctx.fillStyle = ink
    ctx.fillText(fitText(ctx, company, safe.width - (hasLogo ? LOGO_BOX + 20 : 0)), cx, y)
    y += 64 + 26
  }
  if (form.slogan.trim()) {
    setFont(ctx, 38)
    ctx.globalAlpha = 0.92
    ctx.fillStyle = ink
    ctx.fillText(fitText(ctx, form.slogan.trim(), safe.width), cx, y)
    ctx.globalAlpha = 1
    y += 38
  }
  // 细线装饰
  ctx.globalAlpha = 0.5
  ctx.fillStyle = ink
  ctx.fillRect(cx - 120, y + 22, 240, 3)
  ctx.globalAlpha = 1

  if (form.backWebsite.trim()) {
    setFont(ctx, 30)
    ctx.globalAlpha = 0.85
    ctx.fillStyle = ink
    ctx.fillText(form.backWebsite.trim(), cx, safe.y + safe.height - 56)
    ctx.globalAlpha = 1
  }
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

// 出血线（红虚线，即裁切线）+ 安全线（绿虚线），仅预览层调用，导出时不绘制
function drawGuides(ctx, size, safe) {
  const b = mmToPx(BLEED_MM)
  ctx.save()
  ctx.setLineDash([14, 10])
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.95)'
  ctx.strokeRect(b, b, size.width - b * 2, size.height - b * 2)
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.95)'
  ctx.strokeRect(safe.x, safe.y, safe.width, safe.height)
  ctx.restore()
}

function drawCardContent(ctx, size, side, opts) {
  const safe = safeAreaRect(size)
  ctx.clearRect(0, 0, size.width, size.height)
  if (side === 'back') drawBack(ctx, size, safe)
  else drawFront(ctx, size, safe)
  if (opts && opts.guides) drawGuides(ctx, size, safe)
}

function drawCard(canvas, side) {
  if (!canvas) return
  if (canvas.width !== cardSize.width) canvas.width = cardSize.width
  if (canvas.height !== cardSize.height) canvas.height = cardSize.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  drawCardContent(ctx, cardSize, side, { guides: showGuides.value })
}

function drawAll() {
  drawCard(frontCanvasRef.value, 'front')
  drawCard(backCanvasRef.value, 'back')
}

// ---------- 输入防抖 200ms 重绘 + 本地持久化（仅文字字段与主题色，不存 Logo） ----------
let redrawTimer = null

function scheduleRedraw() {
  if (redrawTimer) clearTimeout(redrawTimer)
  redrawTimer = setTimeout(() => {
    redrawTimer = null
    drawAll()
    saveState()
  }, 200)
}

watch([form, themeColor, layoutPreset, backLocked, showGuides, showFrontLogo], scheduleRedraw, { deep: true })

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      form: { ...form },
      themeColor: themeColor.value,
      layoutPreset: layoutPreset.value,
      backLocked: backLocked.value,
      showGuides: showGuides.value,
      showFrontLogo: showFrontLogo.value
    }))
  } catch (e) { /* localStorage 不可用时静默降级 */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (!saved || typeof saved !== 'object') return
    if (saved.form && typeof saved.form === 'object') {
      for (const key of Object.keys(defaultFormData())) {
        if (typeof saved.form[key] === 'string') form[key] = saved.form[key]
      }
    }
    if (typeof saved.themeColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(saved.themeColor)) themeColor.value = saved.themeColor
    if (saved.layoutPreset === 'left' || saved.layoutPreset === 'center') layoutPreset.value = saved.layoutPreset
    if (typeof saved.backLocked === 'boolean') backLocked.value = saved.backLocked
    if (typeof saved.showGuides === 'boolean') showGuides.value = saved.showGuides
    if (typeof saved.showFrontLogo === 'boolean') showFrontLogo.value = saved.showFrontLogo
  } catch (e) { /* 数据损坏时忽略，使用默认值 */ }
}

// ---------- Logo 上传（FileReader 仅在用户回调中执行） ----------
function handleLogoChange(e) {
  const input = e.target
  const file = input && input.files && input.files[0]
  if (!file) return
  if (file.size > LOGO_MAX_BYTES) {
    logoError.value = `Logo 图片超过 1MB（当前 ${(file.size / 1024 / 1024).toFixed(2)}MB），请压缩后再上传`
    input.value = ''
    return
  }
  logoError.value = ''
  const reader = new FileReader()
  reader.onload = () => {
    logoDataUrl.value = String(reader.result || '')
    const img = new Image()
    img.onload = () => {
      logoImg.value = img
      drawAll()
    }
    img.onerror = () => {
      logoError.value = '图片解析失败，请更换 PNG / JPG 格式文件'
      logoDataUrl.value = ''
      logoImg.value = null
      drawAll()
    }
    img.src = logoDataUrl.value
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function removeLogo() {
  logoDataUrl.value = ''
  logoImg.value = null
  logoError.value = ''
  drawAll()
}

// ---------- 导出 PNG（toBlob 判空兜底 toDataURL） ----------
async function exportCard(side) {
  const temp = document.createElement('canvas')
  temp.width = cardSize.width
  temp.height = cardSize.height
  const ctx = temp.getContext('2d')
  if (!ctx) return
  drawCardContent(ctx, cardSize, side, { guides: false }) // 导出不含标线

  const filename = exportFilename(side)
  let href = ''
  if (typeof temp.toBlob === 'function') {
    const blob = await new Promise((resolve) => {
      try {
        temp.toBlob((b) => resolve(b), 'image/png')
      } catch (e) {
        resolve(null)
      }
    })
    if (blob) href = URL.createObjectURL(blob)
  }
  if (!href) href = temp.toDataURL('image/png') // toBlob 不可用 / 返回空时兜底

  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  if (href.startsWith('blob:')) {
    const blobUrl = href
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000)
  }
  exportStatus.value = `已导出 ${filename}（${cardSize.width}×${cardSize.height}px，含 3mm 出血）`
}

// ---------- 重置 ----------
function resetAll() {
  Object.assign(form, defaultFormData())
  themeColor.value = DEFAULT_THEME_COLOR
  layoutPreset.value = 'left'
  backLocked.value = true
  showGuides.value = false
  showFrontLogo.value = true
  logoDataUrl.value = ''
  logoImg.value = null
  logoError.value = ''
  exportStatus.value = ''
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) { /* 忽略 */ }
  drawAll()
}

// ---------- 生命周期（canvas 绘制仅在挂载后进行，SSR 安全） ----------
onMounted(() => {
  loadState()
  drawAll()
  addRecentTool('business-card-generator')
})

onBeforeUnmount(() => {
  if (redrawTimer) {
    clearTimeout(redrawTimer)
    redrawTimer = null
  }
})
</script>
