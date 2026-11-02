<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Frame class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">海报生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">促销 / 招聘 / 课程三大场景模板 · 6 套主题配色 · 竖版 / 方版 · 二维码 · 高清 PNG 下载</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线海报制作工具：内置促销大促、企业招聘、公开课报名三套场景默认文案，主标题、副标题、三行亮点、时间地点与行动语一键填充、随时修改；
        右侧实时合成海报长图——6 套主题配色、竖版 3:4 / 方版 1:1 两种版式、色块头部条 / 上下双线框 / 斜切角三种装饰风格，
        可上传背景图自动叠加半透明遮罩保证文字可读，还可粘贴链接或文本在本地生成二维码贴在海报右下角；
        一键导出高清 PNG 长图，直接发朋友圈 / 微信群或小幅打印。全部由浏览器 Canvas 本地合成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：场景文案与视觉设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <!-- 场景与文案 -->
        <div class="space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 场景与文案
          </h2>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">场景模板（切换自动填充默认文案）</label>
            <select
              v-model="scene"
              @change="applyScenePreset"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option v-for="p in SCENE_PRESETS" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">主标题（大字）</label>
            <input v-model="form.title" type="text" maxlength="30" placeholder="周年庆大促"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">副标题</label>
            <input v-model="form.subtitle" type="text" maxlength="40" placeholder="全场 5 折起 · 一年仅一次"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div v-for="hf in highlightFields" :key="hf.key">
            <label class="text-xs font-medium text-muted-foreground mb-1 block">{{ hf.label }}（≤{{ HIGHLIGHT_MAX_LEN }} 字，自动加 • 前缀）</label>
            <input v-model="form[hf.key]" type="text" :maxlength="HIGHLIGHT_MAX_LEN" :placeholder="hf.placeholder"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">时间</label>
            <input v-model="form.time" type="text" maxlength="30" placeholder="11 月 8 日 - 11 月 11 日"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">地点</label>
            <input v-model="form.place" type="text" maxlength="40" placeholder="幸福广场 1 号店 · 全楼层"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">行动语（海报底部号召语）</label>
            <input v-model="form.cta" type="text" maxlength="16" placeholder="扫码咨询 / 扫码报名"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">联系方式（选填）</label>
            <input v-model="form.contact" type="text" maxlength="40" placeholder="电话 138 0000 0000"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>

        <!-- 视觉设置 -->
        <div class="space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Palette class="w-5 h-5 mr-2 text-primary" /> 视觉设置
          </h2>
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-2">模板配色</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="t in THEME_PRESETS"
                :key="t.id"
                @click="themeId = t.id"
                :title="t.name"
                class="w-9 h-9 rounded-lg border-2 flex items-center justify-center transition"
                :class="themeId === t.id ? 'border-foreground ring-2 ring-primary/30' : 'border-border hover:border-muted-foreground'"
                :style="{ backgroundColor: t.bg }"
              >
                <CheckCircle v-if="themeId === t.id" class="w-4 h-4" :style="{ color: t.accent }" />
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">当前：{{ currentTheme.name }}（底色 {{ currentTheme.bg }} · 强调 {{ currentTheme.accent }}）</p>
          </div>
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-2">版式</p>
            <div class="flex gap-2">
              <button
                v-for="l in LAYOUTS"
                :key="l.id"
                @click="layout = l.id"
                class="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition"
                :class="layout === l.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'"
              >{{ l.name }}</button>
            </div>
          </div>
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-2">装饰风格</p>
            <div class="flex gap-2">
              <button
                v-for="d in DECOR_STYLES"
                :key="d.id"
                @click="decorId = d.id"
                class="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition"
                :class="decorId === d.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'"
              >{{ d.name }}</button>
            </div>
          </div>
        </div>

        <!-- 背景图（选填） -->
        <div class="space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <ImagePlus class="w-5 h-5 mr-2 text-primary" /> 背景图（选填）
          </h2>
          <label class="flex items-center gap-2 px-3 py-2.5 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/60 transition">
            <ImagePlus class="w-4 h-4 text-primary flex-shrink-0" />
            <span class="text-xs text-muted-foreground">{{ bgDataUrl ? '已上传，点击更换' : '上传背景图（JPG / PNG，≤2MB）' }}</span>
            <input type="file" accept="image/*" class="hidden" @change="handleBgChange" />
          </label>
          <p v-if="bgError" class="text-xs text-red-500 flex items-center gap-1">
            <Info class="w-3.5 h-3.5 flex-shrink-0" />{{ bgError }}
          </p>
          <div v-if="bgDataUrl" class="flex items-center justify-between">
            <img :src="bgDataUrl" alt="背景图预览" class="h-10 rounded border border-border" />
            <button @click="clearBackground" class="text-xs text-red-500 hover:underline">清空背景图</button>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">上传后会自动叠加 55% 半透明底色遮罩，保证海报文字清晰可读；背景图仅本地使用，不会被保存。</p>
        </div>

        <!-- 二维码（选填） -->
        <div class="space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Frame class="w-5 h-5 mr-2 text-primary" /> 二维码（选填）
          </h2>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">粘贴链接 / 文本，生成后贴在海报右下角</label>
            <input v-model="qrText" type="text" maxlength="300" placeholder="https://example.com 或任意文本"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              @keyup.enter="generateQr" />
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="generateQr"
              class="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium transition"
            >生成二维码</button>
            <button
              v-if="qrDataUrl"
              @click="clearQr"
              class="px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition"
            >清除</button>
          </div>
          <p v-if="qrStatus" class="text-xs flex items-start gap-1" :class="qrOk ? 'text-green-600' : 'text-red-500'">
            <CheckCircle v-if="qrOk" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <Info v-else class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{{ qrStatus }}
          </p>
          <div v-if="qrDataUrl" class="flex items-center gap-3">
            <img :src="qrDataUrl" alt="二维码预览" class="w-12 h-12 rounded border border-border bg-white p-0.5" />
            <p class="text-xs text-muted-foreground leading-relaxed">二维码将贴在海报右下角（白底内边距）；二维码图片不保存，恢复页面后需重新生成。</p>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="applyScenePreset"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 按场景重置文案
          </button>
          <button
            @click="resetAll"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置全部
          </button>
        </div>
      </div>

      <!-- 右：实时预览（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Frame class="w-5 h-5 mr-2 text-primary" /> 实时预览
          </h2>
          <span class="text-xs text-muted-foreground font-mono">{{ sizeInfoText }}</span>
        </div>

        <div class="flex justify-center">
          <canvas
            ref="previewCanvasRef"
            class="max-w-full max-h-[72vh] w-auto h-auto block rounded-lg border border-border shadow-sm"
          ></canvas>
        </div>

        <!-- 完整性提示：主标题为空时黄条提醒 -->
        <p
          v-if="missingFields.length"
          class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-amber-600 flex items-start gap-1.5"
        >
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ missingFields.join('、') }}尚未填写：没有主标题的海报很难传达活动信息，请填写后再导出。</span>
        </p>
        <p v-else class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
          <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>主标题已填写，海报信息完整，可以导出。</span>
        </p>

        <!-- 导出 -->
        <button
          @click="exportPng"
          class="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
        >
          <Download class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 下载 PNG 海报长图
        </button>
        <p v-if="exportStatus" class="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle class="w-3.5 h-3.5 flex-shrink-0" />{{ exportStatus }}
        </p>

        <!-- 使用提示（诚实定位） -->
        <div class="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            导出的 PNG 长图可直接发微信 / 朋友圈，也能用 A4 纸小幅打印张贴（约 150dpi）；大幅易拉宝印刷请用专业设计软件重制。
            海报文字以系统字体渲染、不嵌入字体文件，商用投放请先确认字体授权（详见下方说明）。
          </p>
        </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>海报生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          海报生成器是一款纯浏览器本地运行的海报图片制作工具。内置促销大促、企业招聘、公开课报名三套场景默认文案，
          主标题、副标题、三行亮点、时间、地点、行动语与联系方式一键填充、随时修改；右侧由 Canvas 按 1350×1800 / 1350×1350 逻辑尺寸实时合成海报——
          6 套主题配色、竖版 3:4 与方版 1:1 两种版式、色块头部条 / 上下双线框 / 斜切角三种装饰风格；可上传背景图自动叠加 55% 半透明遮罩保证文字可读，
          也可粘贴链接或文本在浏览器本地生成二维码并贴在海报右下角。一键导出高清 PNG 长图，直接发朋友圈 / 微信群或小幅打印。
          全程无网络请求，数据不出浏览器。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">海报尺寸怎么选？（朋友圈 / 打印 / 易拉宝）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          按用途分三个口径。屏显传播：微信朋友圈 / 群聊用竖版 3:4（本工具 1350×1800，导出 1701×2268）最合适，信息流里占比大、压缩后依然清晰；
          方版 1:1 适合小红书、Instagram 等方形卡片流。普通打印：A4 纸 300dpi 印刷需要 2480×3508px，本工具导出约 150dpi，
          适合门贴、传单等近距离观看的小幅打印，大幅喷绘会发虚。易拉宝 / 展架：80cm×200cm 的易拉宝至少需要 2362×5906px（150dpi），
          本工具分辨率不够，请用专业设计软件另做。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">海报配色怎么不土？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一控数量：一张海报主色、强调色加中性色不超过三种，其余交给留白；二保对比：正文与底色的对比度建议不低于 4.5:1
          （深底配浅字、浅底配深字，本工具的遮罩就是为底图上保对比服务的）；三做减法：大面积留白比堆渐变、阴影、描边更显高级，
          标题只在一处强调就够。本工具 6 套配色都按「一底色 + 一字色 + 一强调色」设计，直接选不容易出错。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">二维码放海报哪个位置？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          右下角是阅读的视线终点，扫码转化最好。尺寸上，打印场景二维码不小于 2.5cm×2.5cm、屏显不小于 120px，
          四周留白至少留出码身一半的宽度，避免被花纹或文字干扰识别；旁边配一句行动语（如「扫码咨询」「扫码报名」），
          明确告诉读者扫码能得到什么。本工具生成后自动贴在右下角，并垫白底加内边距，深色海报上也能保证扫码成功率。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">海报图片能商用吗？字体版权注意什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          工具本身免费，导出的图片归你使用，但商用前注意两点素材合规。一是字体：本页海报文字使用系统自带字体渲染、不嵌入任何字体文件，
          而对外投放的商业物料（广告、印刷品）对字体授权要求更严，建议导出后在专业软件中替换为已购买商用授权的字体再投放；
          二是图片：上传的背景图请确保你拥有版权或已获得商用授权，工具无法替你确认素材版权。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">海报数据会上传吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不会。海报全部由你浏览器里的 Canvas 在本地合成，背景图通过 FileReader 在本地读取，二维码由站内内置的 qrcode 库在浏览器本地生成，
          整个流程不产生任何网络请求。为了下次打开免重填，仅文字字段与配色、版式、装饰风格等设置保存在本机 localStorage
          （不包含上传的背景图与二维码图片），清除浏览器站点数据即可彻底删除。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">海报尺寸怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1">朋友圈 / 微信群用竖版 3:4（1350×1800），方形信息流用 1:1（1350×1350）；A4 小幅打印本工具导出够用（约 150dpi），A4 印刷级 300dpi 需 2480×3508px，易拉宝至少 2362×5906px，请用专业设计软件制作。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">二维码放在海报哪个位置好？</h3>
            <p class="text-sm text-muted-foreground mt-1">右下角（视线终点）转化最好；打印不小于 2.5cm、屏显不小于 120px，四周留白至少半个码身，旁边配「扫码咨询 / 报名」类行动语。本工具自动贴右下角并垫白底内边距。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">海报图片能商用吗？要注意字体版权吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">工具免费、导出图片归你使用。本页文字用系统字体渲染、不嵌入字体文件；对外商业投放请自行确认字体授权范围，必要时导出后替换为已授权字体，背景图也需自备版权。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">海报数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。海报由浏览器 Canvas 本地合成，背景图 FileReader 本地读取，二维码由内置 qrcode 库本地生成，全程无网络请求；仅文字字段与视觉设置存本机 localStorage（不含背景图与二维码图片）。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'poster-generator'" :category="'design'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Frame, Download, RefreshCw,
  ChevronUp, ChevronDown, Info, ImagePlus, CheckCircle, Palette
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '海报生成器 - 在线促销/招聘/课程海报制作工具',
  description: '免费在线海报制作工具：促销大促、企业招聘、公开课报名三套场景文案模板，6 套主题配色、竖版/方版版式、三种装饰风格，背景图上传自动加遮罩，链接一键生成二维码贴右下角，Canvas 本地合成高清 PNG 下载，纯浏览器本地运行不上传数据。',
  keywords: '海报制作,促销海报生成,招聘海报模板,课程海报,免费海报工具',
  author: '有条工具',
  ogTitle: '海报生成器 - 在线促销/招聘/课程海报制作工具 | 有条工具',
  ogDescription: '三大场景模板 + 6 套配色 + 二维码，实时合成海报长图 PNG 下载，本地运行不上传。',
  ogUrl: 'https://www.util.cn/tools/poster-generator',
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
          name: '海报生成器',
          url: 'https://www.util.cn/tools/poster-generator',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['促销/招聘/课程三套场景文案模板', '6 套主题配色（底色/字色/强调色）', '竖版 3:4 / 方版 1:1 两种版式', '色块头部条/上下双线框/斜切角三种装饰', '背景图上传与 55% 半透明遮罩', '链接/文本生成二维码贴右下角', 'Canvas 本地合成高清 PNG 下载', '本地运行不上传数据']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '设计工具', item: 'https://www.util.cn/design/' },
            { '@type': 'ListItem', position: 3, name: '海报生成器', item: 'https://www.util.cn/tools/poster-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '海报尺寸怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '朋友圈/微信群用竖版 3:4（1350×1800），方形信息流用 1:1（1350×1350）；A4 小幅打印导出图够用（约150dpi），印刷级 300dpi 需 2480×3508px，80×200cm 易拉宝至少 2362×5906px，请用专业设计软件制作。' }
            },
            {
              '@type': 'Question',
              name: '二维码放在海报哪个位置好？',
              acceptedAnswer: { '@type': 'Answer', text: '右下角是视线终点、扫码转化最好；打印不小于 2.5cm、屏显不小于 120px，四周留白至少半个码身，旁边配「扫码咨询/报名」类行动语。本工具自动贴右下角并垫白底内边距。' }
            },
            {
              '@type': 'Question',
              name: '海报图片能商用吗？要注意字体版权吗？',
              acceptedAnswer: { '@type': 'Answer', text: '工具免费、导出图片归你使用。本页文字用系统字体渲染、不嵌入字体文件；对外商业投放请自行确认字体授权范围，必要时导出后替换为已授权字体，背景图也需自备版权。' }
            },
            {
              '@type': 'Question',
              name: '海报数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。海报由浏览器 Canvas 本地合成，背景图 FileReader 本地读取，二维码由内置 qrcode 库本地生成，全程无网络请求；仅文字字段与视觉设置存本机 localStorage（不含背景图与二维码图片）。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const BG_MAX_BYTES = 2 * 1024 * 1024  // 背景图上限 2MB
const POSTER_OVERLAY_ALPHA = 0.55     // 有底图时统一叠加的遮罩不透明度口径
const HIGHLIGHT_MAX_LEN = 20          // 亮点行最大字数
const EXPORT_SCALE = 1.26             // 导出放大倍数：1350×1800 → 1701×2268
const CANVAS_W = 1350                 // 画布逻辑宽
const PORTRAIT_H = 1800               // 竖版逻辑高（3:4）
const SQUARE_H = 1350                 // 方版逻辑高（1:1）

// 版式：竖版 3:4 / 方版 1:1
const LAYOUTS = [
  { id: 'portrait', name: '竖版 3:4' },
  { id: 'square', name: '方版 1:1' }
]

// 装饰风格：色块头部条 / 上下双线框 / 斜切角
const DECOR_STYLES = [
  { id: 'band', name: '色块头部条' },
  { id: 'frame', name: '上下双线框' },
  { id: 'notch', name: '斜切角' }
]

// 6 套模板配色：bg 底色 / fg 文字色 / accent 强调色（按「一底一字一强调」设计）
const THEME_PRESETS = [
  { id: 'orange', name: '活力橙红', bg: '#fff3ea', fg: '#4a1c0a', accent: '#ea580c' },
  { id: 'navy', name: '商务深蓝', bg: '#10234a', fg: '#eef3ff', accent: '#4f83f1' },
  { id: 'green', name: '清新绿', bg: '#edf6ec', fg: '#1c3d24', accent: '#3d9a50' },
  { id: 'yellow', name: '暖黄黑', bg: '#ffd84d', fg: '#18181b', accent: '#18181b' },
  { id: 'violet', name: '紫罗兰', bg: '#f2edfa', fg: '#3a1c5e', accent: '#8b5cf6' },
  { id: 'mono', name: '极简黑白', bg: '#fafafa', fg: '#141414', accent: '#52525b' }
]

// 3 套场景默认文案（切换场景 / 重置文案时整组填充，填充后可再手改）
const SCENE_PRESETS = [
  {
    id: 'promo', name: '促销活动', fileTag: '促销',
    title: '周年庆大促',
    subtitle: '全场 5 折起 · 一年仅此一次',
    highlights: ['全场商品 5 折起', '满 300 减 80 上不封顶', '进店即赠精美好礼'],
    time: '11 月 8 日 - 11 月 11 日',
    place: '幸福广场 1 号店 · 全楼层',
    cta: '扫码进群抢券',
    contact: '电话 138 0000 0000'
  },
  {
    id: 'hiring', name: '企业招聘', fileTag: '招聘',
    title: '我们招人啦',
    subtitle: '寻找有趣的你 · 一起做点了不起的事',
    highlights: ['前端 / 后端 / 设计师 多岗', '六险一金 · 弹性办公', '15 薪起步 · 一年两调薪'],
    time: '即日起至 12 月 31 日',
    place: '幸福市高新区幸福大厦 18 层',
    cta: '扫码投递简历',
    contact: '张老师 139 0000 0000'
  },
  {
    id: 'course', name: '课程报名', fileTag: '课程',
    title: '公开课报名',
    subtitle: '从零入门 AI 绘画 · 零基础可学',
    highlights: ['一线讲师直播带练', '3 天实战营 · 送模板', '前 100 名报名免费'],
    time: '11 月 15 日（周六）14:00',
    place: '线上直播 · 报名后进群看课',
    cta: '扫码免费占座',
    contact: '李老师 137 0000 0000'
  }
]

// 画布逻辑尺寸：竖版 1350×1800 / 方版 1350×1350，未知值回退竖版
function canvasSizeOf(layoutId) {
  return layoutId === 'square'
    ? { width: CANVAS_W, height: SQUARE_H }
    : { width: CANVAS_W, height: PORTRAIT_H }
}

// 导出尺寸：逻辑尺寸 × EXPORT_SCALE 取整（1701×2268 / 1701×1701）
function exportSizeOf(layoutId) {
  const { width, height } = canvasSizeOf(layoutId)
  return { width: Math.round(width * EXPORT_SCALE), height: Math.round(height * EXPORT_SCALE) }
}

// 导出文件名：poster-促销-1701x2268.png
function exportFilename(fileTag, width, height) {
  return `poster-${String(fileTag || '海报')}-${Math.round(width)}x${Math.round(height)}.png`
}

// 遮罩透明度口径：上传了背景图固定 0.55，无底图 0
function overlayAlphaOf(hasImage) {
  return hasImage ? POSTER_OVERLAY_ALPHA : 0
}

// '#rrggbb' → 'rgba(r, g, b, a)'，非法输入返回 null
function hexToRgba(hex, alpha) {
  if (typeof hex !== 'string') return null
  const h = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${alpha})`
}

// 背景图大小校验：返回错误文案，合法返回 ''
function bgSizeErrorOf(size) {
  if (!Number.isFinite(size) || size <= 0) return '无法读取图片大小，请更换文件重试'
  if (size > BG_MAX_BYTES) return `背景图超过 2MB（当前 ${(size / 1024 / 1024).toFixed(2)}MB），请压缩后再上传`
  return ''
}

// 亮点行清洗：去首尾空白、滤空行（绘制时再统一加 • 前缀圆点）
function normalizeHighlights(lines) {
  const arr = Array.isArray(lines) ? lines : [lines]
  return arr.map((t) => String(t || '').trim()).filter(Boolean)
}

// 预览下方黄条：主标题缺失检查
function missingHintFields(f) {
  const out = []
  if (!String((f && f.title) || '').trim()) out.push('主标题')
  return out
}

// 单字符宽度估算（一个汉字 = 1 单位）：全角 1，空格 0.35，半角字母数字符号 0.55
function charUnits(ch) {
  const code = ch.codePointAt(0)
  if (code === undefined) return 0
  return code > 0xff ? 1 : (ch === ' ' ? 0.35 : 0.55)
}

// token 宽度合计
function tokenWidth(tok) {
  let w = 0
  for (const ch of tok) w += charUnits(ch)
  return w
}

// 切成不可拆的 token：连续英文字母 / 数字为一个词（换行时整体挪行不切断），其余逐字符
function tokenizeForWrap(text) {
  const tokens = []
  let word = ''
  for (const ch of String(text || '')) {
    if (/[0-9A-Za-z]/.test(ch)) {
      word += ch
    } else {
      if (word) {
        tokens.push(word)
        word = ''
      }
      tokens.push(ch)
    }
  }
  if (word) tokens.push(word)
  return tokens
}

// ctx-less 自动换行：maxCharsPerLine 为每行可容纳的「汉字数」，返回行数组；英文整词不断行
function wrapTextByWidth(text, maxCharsPerLine) {
  const limit = Math.max(1, Number(maxCharsPerLine) || 1)
  const tokens = tokenizeForWrap(String(text || '').replace(/\s+/g, ' ').trim())
  const lines = []
  let cur = ''
  let curW = 0
  const pushCur = () => {
    const t = cur.replace(/\s+$/, '')
    if (t) lines.push(t)
  }
  for (const tok of tokens) {
    if (tok === ' ') {
      // 行首空格与行尾放不下的空格直接丢弃
      if (curW === 0 || curW + 0.35 > limit) continue
      cur += ' '
      curW += 0.35
      continue
    }
    const w = tokenWidth(tok)
    if (w > limit) {
      // 单个词超过整行宽度：整行硬断，最后一段留作当前行
      pushCur()
      cur = ''
      curW = 0
      let piece = ''
      let pw = 0
      for (const ch of tok) {
        const cw = charUnits(ch)
        if (pw + cw > limit) {
          lines.push(piece)
          piece = ch
          pw = cw
        } else {
          piece += ch
          pw += cw
        }
      }
      cur = piece
      curW = pw
    } else if (curW > 0 && curW + w > limit) {
      pushCur()
      cur = tok
      curW = w
    } else {
      cur += tok
      curW += w
    }
  }
  pushCur()
  return lines
}

// 背景图 cover 铺满矩形：等比放大到完全覆盖盒子后居中（可为负偏移表示裁切）
function coverRect(imgW, imgH, boxW, boxH) {
  if (!imgW || !imgH) return { x: 0, y: 0, w: boxW, h: boxH }
  const scale = Math.max(boxW / imgW, boxH / imgH)
  const w = imgW * scale
  const h = imgH * scale
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h }
}

// ---------- 表单与视图状态 ----------
const STORAGE_KEY = 'poster-generator'

// 默认表单：促销场景示例文案
function defaultFormData() {
  const p = SCENE_PRESETS[0]
  return {
    title: p.title,
    subtitle: p.subtitle,
    h1: p.highlights[0],
    h2: p.highlights[1],
    h3: p.highlights[2],
    time: p.time,
    place: p.place,
    cta: p.cta,
    contact: p.contact
  }
}

const highlightFields = [
  { key: 'h1', label: '亮点一', placeholder: '全场商品 5 折起' },
  { key: 'h2', label: '亮点二', placeholder: '满 300 减 80 上不封顶' },
  { key: 'h3', label: '亮点三', placeholder: '进店即赠精美好礼' }
]

const form = reactive(defaultFormData())
const scene = ref(SCENE_PRESETS[0].id)
const themeId = ref(THEME_PRESETS[0].id)
const layout = ref('portrait')      // 'portrait' | 'square'
const decorId = ref('band')         // 'band' | 'frame' | 'notch'
const bgDataUrl = ref('')           // 仅用于缩略图展示，不进 localStorage
const bgImg = ref(null)             // HTMLImageElement，仅在客户端回调中赋值
const bgError = ref('')
const qrText = ref('')              // 二维码内容（文字字段，可保存）
const qrDataUrl = ref('')           // 生成的二维码 dataURL（不保存）
const qrImg = ref(null)             // HTMLImageElement，仅在客户端回调中赋值
const qrStatus = ref('')
const qrOk = ref(true)
const exportStatus = ref('')
const seoContentVisible = ref(true)

const currentTheme = computed(() => THEME_PRESETS.find((t) => t.id === themeId.value) || THEME_PRESETS[0])
const currentScene = computed(() => SCENE_PRESETS.find((p) => p.id === scene.value) || SCENE_PRESETS[0])
const canvasSize = computed(() => canvasSizeOf(layout.value))
const exportSize = computed(() => exportSizeOf(layout.value))
const sizeInfoText = computed(() => {
  const { width, height } = canvasSize.value
  const ratio = layout.value === 'square' ? '方版 1:1' : '竖版 3:4'
  return `${width}×${height}px · ${ratio} · 导出 ${exportSize.value.width}×${exportSize.value.height}`
})
const missingFields = computed(() => missingHintFields(form))

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- Canvas 绘制（仅在 onMounted 之后 / 用户回调中调用，SSR 安全） ----------
const previewCanvasRef = ref(null)
const SERIF_FONT = '"Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", "Source Han Serif SC", serif'

// 装饰一：色块头部条（accent 实心头条 + fg 细压线）
function drawBandHeader(ctx, W, s, theme) {
  const h = Math.round(150 * s)
  const strip = Math.max(4, Math.round(10 * s))
  ctx.save()
  ctx.fillStyle = theme.accent
  ctx.fillRect(0, 0, W, h)
  ctx.fillStyle = theme.fg
  ctx.fillRect(0, h, W, strip)
  ctx.restore()
}

// 装饰二：上下双线框（顶部 / 底部各一粗一细两条 accent 横线）
function drawTopBottomFrame(ctx, W, H, s, theme) {
  const m = Math.round(76 * s)
  const inner = Math.round(18 * s)
  ctx.save()
  ctx.strokeStyle = theme.accent
  ctx.lineCap = 'butt'
  ctx.lineWidth = Math.max(4, Math.round(6 * s))
  ctx.beginPath()
  ctx.moveTo(m, m)
  ctx.lineTo(W - m, m)
  ctx.moveTo(m, H - m)
  ctx.lineTo(W - m, H - m)
  ctx.stroke()
  ctx.lineWidth = Math.max(2, Math.round(2.5 * s))
  ctx.beginPath()
  ctx.moveTo(m, m + inner)
  ctx.lineTo(W - m, m + inner)
  ctx.moveTo(m, H - m - inner)
  ctx.lineTo(W - m, H - m - inner)
  ctx.stroke()
  ctx.restore()
}

// 装饰三：斜切角（擦除四角成 45° 斜边，accent 细线勾斜边）
function drawNotchCorners(ctx, W, H, s, theme) {
  const c = Math.round(120 * s)
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.moveTo(0, 0); ctx.lineTo(c, 0); ctx.lineTo(0, c); ctx.closePath(); ctx.fill()
  ctx.beginPath()
  ctx.moveTo(W, 0); ctx.lineTo(W - c, 0); ctx.lineTo(W, c); ctx.closePath(); ctx.fill()
  ctx.beginPath()
  ctx.moveTo(0, H); ctx.lineTo(0, H - c); ctx.lineTo(c, H); ctx.closePath(); ctx.fill()
  ctx.beginPath()
  ctx.moveTo(W, H); ctx.lineTo(W - c, H); ctx.lineTo(W, H - c); ctx.closePath(); ctx.fill()
  ctx.restore()
  ctx.save()
  ctx.strokeStyle = theme.accent
  ctx.lineWidth = Math.max(3, Math.round(5 * s))
  ctx.beginPath()
  ctx.moveTo(c, 0); ctx.lineTo(0, c)
  ctx.moveTo(W - c, 0); ctx.lineTo(W, c)
  ctx.moveTo(0, H - c); ctx.lineTo(c, H)
  ctx.moveTo(W, H - c); ctx.lineTo(W - c, H)
  ctx.stroke()
  ctx.restore()
}

// 简单时钟符号（时间行图标）
function drawClockIcon(ctx, cx, cy, r, color) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(2, r * 0.22)
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx, cy - r * 0.55)
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + r * 0.42, cy + r * 0.2)
  ctx.stroke()
  ctx.restore()
}

// 简单定位符号（地点行图标）
function drawPinIcon(ctx, cx, cy, r, color, holeColor) {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy - r * 0.32, r * 0.78, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.55, cy - r * 0.08)
  ctx.lineTo(cx + r * 0.55, cy - r * 0.08)
  ctx.lineTo(cx, cy + r * 0.9)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = holeColor
  ctx.beginPath()
  ctx.arc(cx, cy - r * 0.32, r * 0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// 圆角矩形路径（二维码白底）
function drawRoundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

// 海报整体绘制：底色 / 底图+遮罩 → 装饰风格 → 标题→副标题→亮点→分隔线→时间/地点 → 底部行动语+联系方式 → 右下角二维码
function drawPosterContent(ctx, W, H, state) {
  const { theme, form: f, decor, bgImg: img, qrImg: qr, sizeScale: s } = state
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = theme.bg
  ctx.fillRect(0, 0, W, H)
  if (img) {
    const r = coverRect(img.naturalWidth || img.width, img.naturalHeight || img.height, W, H)
    ctx.drawImage(img, r.x, r.y, r.w, r.h)
    ctx.fillStyle = hexToRgba(theme.bg, overlayAlphaOf(true))
    ctx.fillRect(0, 0, W, H)
  }

  if (decor === 'frame') drawTopBottomFrame(ctx, W, H, s, theme)
  else if (decor === 'notch') drawNotchCorners(ctx, W, H, s, theme)
  else drawBandHeader(ctx, W, s, theme)

  const maxW = W - 220 // 文字安全宽（左右各留 110）
  const cx = W / 2
  const titleSize = Math.round(132 * s)
  const subSize = Math.round(46 * s)
  const hlSize = Math.round(46 * s)
  const metaSize = Math.round(40 * s)
  const ctaSize = Math.round(58 * s)
  const contactSize = Math.round(32 * s)

  const title = String(f.title || '').trim()
  const subtitle = String(f.subtitle || '').trim()
  const highlights = normalizeHighlights([f.h1, f.h2, f.h3])
  const time = String(f.time || '').trim()
  const place = String(f.place || '').trim()
  const cta = String(f.cta || '').trim()
  const contact = String(f.contact || '').trim()

  // 内容行序列：先统一算行高，再整体在安全区内垂直居中
  const rows = []
  if (title) rows.push({ text: title, size: titleSize, bold: true, color: theme.fg, alpha: 1, lineGap: 1.2, gapAfter: Math.round(30 * s) })
  if (subtitle) rows.push({ text: subtitle, size: subSize, bold: false, color: theme.fg, alpha: 0.85, lineGap: 1.45, gapAfter: Math.round(64 * s) })
  highlights.forEach((hl, i) => {
    rows.push({
      text: hl, size: hlSize, bold: false, color: theme.fg, alpha: 0.95, lineGap: 1.5,
      gapAfter: i === highlights.length - 1 ? Math.round(56 * s) : 0, bullet: true
    })
  })
  if (time || place) rows.push({ divider: true, height: Math.round(44 * s), gapAfter: Math.round(40 * s) })
  if (time) rows.push({ text: time, size: metaSize, bold: false, color: theme.fg, alpha: 0.92, lineGap: 1.5, gapAfter: Math.round(14 * s), icon: 'clock' })
  if (place) rows.push({ text: place, size: metaSize, bold: false, color: theme.fg, alpha: 0.92, lineGap: 1.5, gapAfter: 0, icon: 'pin' })

  let totalH = 0
  for (const r of rows) {
    if (r.divider) {
      totalH += r.height + r.gapAfter
      continue
    }
    r.lines = wrapTextByWidth(r.text, Math.floor(maxW / r.size))
    totalH += r.lines.length * r.size * r.lineGap + r.gapAfter
  }

  const topSafe = decor === 'band' ? Math.round(230 * s) : Math.round(150 * s)
  const footerH = Math.round((qr ? 360 : 300) * s) // 底部预留：行动语 + 联系方式 + 边距（有二维码时更大）
  const y = totalH > H - topSafe - footerH
    ? topSafe
    : topSafe + Math.round((H - topSafe - footerH - totalH) / 2)
  let cursorY = y

  ctx.textBaseline = 'top'
  for (const r of rows) {
    if (r.divider) {
      const dw = Math.round(140 * s)
      ctx.save()
      ctx.fillStyle = theme.accent
      ctx.fillRect(cx - dw / 2, cursorY + r.height / 2, dw, Math.max(3, Math.round(4 * s)))
      ctx.restore()
      cursorY += r.height + r.gapAfter
      continue
    }
    ctx.font = `${r.bold ? '700' : '400'} ${r.size}px ${SERIF_FONT}`
    ctx.fillStyle = r.color
    ctx.globalAlpha = r.alpha
    for (const line of r.lines) {
      if (r.bullet || r.icon) {
        // 带前缀符号的行：整体（符号 + 文字）居中
        const tw = ctx.measureText(line).width
        const startX = cx - tw / 2
        if (r.bullet) {
          const dotR = Math.max(4, r.size * 0.17)
          ctx.save()
          ctx.fillStyle = theme.accent
          ctx.globalAlpha = 1
          ctx.beginPath()
          ctx.arc(startX - r.size * 0.55, cursorY + r.size * 0.52, dotR, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
          ctx.fillStyle = r.color
          ctx.globalAlpha = r.alpha
        } else if (r.icon === 'clock') {
          drawClockIcon(ctx, startX - r.size * 0.5 - r.size * 0.42, cursorY + r.size * 0.52, r.size * 0.42, theme.fg)
        } else {
          drawPinIcon(ctx, startX - r.size * 0.5 - r.size * 0.42, cursorY + r.size * 0.52, r.size * 0.42, theme.accent, theme.bg)
        }
        ctx.textAlign = 'left'
        ctx.fillText(line, startX, cursorY)
      } else {
        ctx.textAlign = 'center'
        ctx.fillText(line, cx, cursorY)
      }
      cursorY += r.size * r.lineGap
    }
    ctx.globalAlpha = 1
    cursorY += r.gapAfter
  }
  ctx.textAlign = 'left'

  // 底部：行动语 + 联系方式（有二维码时靠左避让，无二维码居中）
  const footerBottom = H - Math.round(96 * s)
  const ctaY = footerBottom - contactSize - Math.round(18 * s) - ctaSize
  if (cta) {
    ctx.font = `700 ${ctaSize}px ${SERIF_FONT}`
    ctx.fillStyle = theme.accent
    if (qr) {
      ctx.fillText(cta, Math.round(110 * s), ctaY)
    } else {
      ctx.textAlign = 'center'
      ctx.fillText(cta, cx, ctaY)
      ctx.textAlign = 'left'
    }
  }
  if (contact) {
    ctx.font = `400 ${contactSize}px ${SERIF_FONT}`
    ctx.fillStyle = theme.fg
    ctx.globalAlpha = 0.75
    if (qr) {
      ctx.fillText(contact, Math.round(110 * s), footerBottom - contactSize)
    } else {
      ctx.textAlign = 'center'
      ctx.fillText(contact, cx, footerBottom - contactSize)
      ctx.textAlign = 'left'
    }
    ctx.globalAlpha = 1
  }

  // 二维码：白底内边距，贴右下角
  if (qr) {
    const box = Math.round(252 * s)
    const pad = Math.round(14 * s)
    const qx = W - box - Math.round(96 * s)
    const qy = H - box - Math.round(96 * s)
    ctx.save()
    ctx.fillStyle = '#ffffff'
    drawRoundRectPath(ctx, qx, qy, box, box, Math.round(14 * s))
    ctx.fill()
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)'
    ctx.lineWidth = Math.max(1, Math.round(2 * s))
    ctx.stroke()
    ctx.drawImage(qr, qx + pad, qy + pad, box - pad * 2, box - pad * 2)
    ctx.restore()
  }

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

function buildDrawState() {
  return {
    theme: currentTheme.value,
    form,
    decor: decorId.value,
    bgImg: bgImg.value,
    qrImg: qrImg.value,
    sizeScale: layout.value === 'square' ? 0.88 : 1
  }
}

// 预览渲染：画布物理像素 = 逻辑尺寸 × dpr（上限 2，兼顾清晰度与内存）
function renderPreview() {
  const canvas = previewCanvasRef.value
  if (!canvas) return
  const { width: W, height: H } = canvasSize.value
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const pw = Math.round(W * dpr)
  const ph = Math.round(H * dpr)
  if (canvas.width !== pw) canvas.width = pw
  if (canvas.height !== ph) canvas.height = ph
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawPosterContent(ctx, W, H, buildDrawState())
}

// ---------- 输入防抖 200ms 重绘 + 本地持久化（仅文字字段与视觉设置，不存背景图 / 二维码图） ----------
let redrawTimer = null

function scheduleRedraw() {
  if (redrawTimer) clearTimeout(redrawTimer)
  redrawTimer = setTimeout(() => {
    redrawTimer = null
    renderPreview()
    saveState()
  }, 200)
}

watch([form, themeId, layout, decorId, qrText], scheduleRedraw, { deep: true })

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      form: { ...form },
      themeId: themeId.value,
      layout: layout.value,
      decorId: decorId.value,
      qrText: qrText.value
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
    if (THEME_PRESETS.some((t) => t.id === saved.themeId)) themeId.value = saved.themeId
    if (saved.layout === 'portrait' || saved.layout === 'square') layout.value = saved.layout
    if (DECOR_STYLES.some((d) => d.id === saved.decorId)) decorId.value = saved.decorId
    if (typeof saved.qrText === 'string') qrText.value = saved.qrText
  } catch (e) { /* 数据损坏时忽略，使用默认值 */ }
}

// ---------- 背景图上传（FileReader 仅在用户回调中执行，不持久化） ----------
function handleBgChange(e) {
  const input = e.target
  const file = input && input.files && input.files[0]
  if (!file) return
  const err = bgSizeErrorOf(file.size)
  if (err) {
    bgError.value = err
    input.value = ''
    return
  }
  bgError.value = ''
  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = String(reader.result || '')
    const img = new Image()
    img.onload = () => {
      bgDataUrl.value = dataUrl
      bgImg.value = img
      renderPreview()
    }
    img.onerror = () => {
      bgError.value = '图片解析失败，请更换 JPG / PNG 格式文件'
      bgDataUrl.value = ''
      bgImg.value = null
      renderPreview()
    }
    img.src = dataUrl
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function clearBackground() {
  bgDataUrl.value = ''
  bgImg.value = null
  bgError.value = ''
  renderPreview()
}

// ---------- 二维码（动态 import 站内已安装的 qrcode，仅在用户回调中执行） ----------
async function generateQr() {
  const text = qrText.value.trim()
  if (!text) {
    qrDataUrl.value = ''
    qrImg.value = null
    qrOk.value = false
    qrStatus.value = '请先粘贴二维码内容（链接或文本）'
    renderPreview()
    return
  }
  try {
    const QRCode = await import('qrcode')
    const url = await QRCode.toDataURL(text, {
      width: 220,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    })
    const img = new Image()
    img.onload = () => {
      qrImg.value = img
      qrDataUrl.value = url
      qrOk.value = true
      qrStatus.value = '二维码已生成，贴在海报右下角'
      renderPreview()
    }
    img.onerror = () => {
      qrOk.value = false
      qrStatus.value = '二维码图片加载失败，请重试'
    }
    img.src = url
  } catch (e) {
    qrDataUrl.value = ''
    qrImg.value = null
    qrOk.value = false
    qrStatus.value = '二维码生成失败，请检查内容后重试'
    renderPreview()
  }
}

function clearQr() {
  qrText.value = ''
  qrDataUrl.value = ''
  qrImg.value = null
  qrStatus.value = ''
  renderPreview()
}

// ---------- 场景与操作 ----------
// 切换场景 / 按场景重置：整组填充该场景默认文案，填充后可继续手改
function applyScenePreset() {
  const p = currentScene.value
  Object.assign(form, {
    title: p.title,
    subtitle: p.subtitle,
    h1: p.highlights[0],
    h2: p.highlights[1],
    h3: p.highlights[2],
    time: p.time,
    place: p.place,
    cta: p.cta,
    contact: p.contact
  })
}

// 重置全部：当前场景文案 + 默认视觉 + 清空背景图与二维码
function resetAll() {
  applyScenePreset()
  themeId.value = THEME_PRESETS[0].id
  layout.value = 'portrait'
  decorId.value = DECOR_STYLES[0].id
  bgDataUrl.value = ''
  bgImg.value = null
  bgError.value = ''
  qrText.value = ''
  qrDataUrl.value = ''
  qrImg.value = null
  qrStatus.value = ''
  exportStatus.value = ''
  renderPreview()
}

// ---------- 导出 PNG（toBlob 判空兜底 toDataURL） ----------
async function exportPng() {
  const { width: W, height: H } = canvasSize.value
  const ex = exportSize.value
  const temp = document.createElement('canvas')
  temp.width = ex.width
  temp.height = ex.height
  const ctx = temp.getContext('2d')
  if (!ctx) return
  const scale = ex.width / W
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  drawPosterContent(ctx, W, H, buildDrawState())

  const filename = exportFilename(currentScene.value.fileTag, ex.width, ex.height)
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
  exportStatus.value = `已导出 ${filename}（${ex.width}×${ex.height}px 高清图，可直接发送 / 小幅打印）`
}

// ---------- 生命周期（canvas 绘制仅在挂载后进行，SSR 安全） ----------
onMounted(() => {
  loadState()
  renderPreview()
  window.addEventListener('resize', renderPreview)
  addRecentTool('poster-generator')
})

onBeforeUnmount(() => {
  if (redrawTimer) {
    clearTimeout(redrawTimer)
    redrawTimer = null
  }
  window.removeEventListener('resize', renderPreview)
})
</script>
