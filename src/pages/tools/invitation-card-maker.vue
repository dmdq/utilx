<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sparkles class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">电子请柬生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">婚礼 / 满月酒 / 乔迁宴 / 升学宴四大场景 · 6 套主题配色 · 竖版 / 方版 · 高清 PNG 下载与文本版复制</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线电子请柬制作工具：内置婚礼、满月酒、乔迁宴、升学宴四套场景默认文案，标题、主人公、日期时间、地点与邀约语一键填充、随时修改；
        右侧实时合成请柬图片——6 套主题配色、竖版 3:4 / 方版 1:1 两种版式、内外双线装饰线框，还可上传背景图并自动叠加半透明遮罩保证文字可读；
        一键下载高清 PNG 长图直接发送，另附文本版请柬可复制到微信 / 短信。全部由浏览器 Canvas 本地合成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：文案与视觉设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <!-- 场景与文案 -->
        <div class="space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 场景与文案
          </h2>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">模板场景（切换自动填充默认文案）</label>
            <select
              v-model="scene"
              @change="applyScenePreset"
              class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option v-for="p in SCENE_PRESETS" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">标题</label>
            <input v-model="form.title" type="text" maxlength="16" placeholder="婚礼请柬"
              class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">主人公</label>
            <input v-model="form.host" type="text" maxlength="30" placeholder="张三 &amp; 李四 / 张三家小公子"
              class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs font-medium text-muted-foreground mb-1 block">日期</label>
              <input v-model="form.date" type="date"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label class="text-xs font-medium text-muted-foreground mb-1 block">时间（几点）</label>
              <input v-model="form.time" type="text" maxlength="16" placeholder="11:58"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">地点名称</label>
            <input v-model="form.venue" type="text" maxlength="30" placeholder="幸福国际大酒店 · 宴会厅"
              class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">详细地址</label>
            <input v-model="form.address" type="text" maxlength="50" placeholder="幸福市幸福路 88 号 3 层"
              class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">邀约语（一句自定义）</label>
            <input v-model="form.inviteText" type="text" maxlength="40" placeholder="恭候您的光临"
              class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">联系电话（选填）</label>
            <input v-model="form.phone" type="tel" maxlength="20" placeholder="138 0000 0000"
              class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
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
            <p class="text-xs text-muted-foreground mt-1.5">当前：{{ currentTheme.name }}（底色 {{ currentTheme.bg }} · 线框 {{ currentTheme.accent }}）</p>
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
          <label class="flex items-center justify-between cursor-pointer bg-muted/40 border border-border rounded-lg px-3 py-2.5">
            <span class="text-xs text-foreground leading-snug">装饰双线线框</span>
            <input type="checkbox" v-model="showBorder" class="w-4 h-4 flex-shrink-0" />
          </label>
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
          <p class="text-xs text-muted-foreground leading-relaxed">上传后会自动叠加 55% 半透明底色遮罩，保证请柬文字清晰可读；背景图仅本地使用，不会被保存。</p>
        </div>

        <!-- 快捷操作 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="loadSample"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <Sparkles class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 载入示例
          </button>
          <button
            @click="applyScenePreset"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 按场景重置文案
          </button>
        </div>
      </div>

      <!-- 右：实时预览（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Sparkles class="w-5 h-5 mr-2 text-primary" /> 实时预览
          </h2>
          <span class="text-xs text-muted-foreground font-mono">{{ sizeInfoText }}</span>
        </div>

        <div class="flex justify-center">
          <canvas
            ref="previewCanvasRef"
            class="max-w-full max-h-[72vh] w-auto h-auto block rounded-lg border border-border shadow-sm"
          ></canvas>
        </div>

        <!-- 完整性提示 -->
        <p
          v-if="missingFields.length"
          class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-amber-600 flex items-start gap-1.5"
        >
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ missingFields.join('、') }}尚未填写：预览中对应行会自动留空，正式发送前建议补全。</span>
        </p>
        <p v-else class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
          <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>主人公与日期已填写，请柬信息完整。</span>
        </p>

        <!-- 导出与复制 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            @click="exportPng"
            class="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            <Download class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 下载 PNG 请柬长图
          </button>
          <button
            @click="copyTextInvite"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制文本版请柬
          </button>
        </div>
        <p v-if="exportStatus" class="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle class="w-3.5 h-3.5 flex-shrink-0" />{{ exportStatus }}
        </p>
        <p v-if="copyStatus" class="text-xs flex items-center gap-1" :class="copyOk ? 'text-green-600' : 'text-red-500'">
          <CheckCircle v-if="copyOk" class="w-3.5 h-3.5 flex-shrink-0" />
          <Info v-else class="w-3.5 h-3.5 flex-shrink-0" />{{ copyStatus }}
        </p>

        <!-- 文本版请柬 -->
        <div class="space-y-2">
          <p class="text-xs font-medium text-muted-foreground">文本版请柬（适合微信 / 短信直接粘贴发送，选填字段为空整行省略）</p>
          <textarea
            :value="textInvite"
            readonly
            rows="8"
            class="w-full px-3 py-2.5 bg-muted/40 border border-border border-border rounded-lg text-sm text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40"
          ></textarea>
        </div>

        <!-- 微信使用提示（诚实定位） -->
        <div class="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            图片版请柬：PNG 下载后直接发到微信聊天，或保存到手机发朋友圈均可。链接式 H5 请柬需要企业微信 / 公众号等平台开发能力与托管支持，本工具不涉及；
            文本版请柬即复制即发、不怕链接失效，通用性最强。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>电子请柬生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          电子请柬生成器是一款纯浏览器本地运行的请柬图片制作工具。内置婚礼、满月酒、乔迁宴、升学宴四套场景默认文案，标题、主人公、日期时间、地点、邀约语一键填充、随时修改；
          提供 6 套主题配色、竖版 3:4 与方版 1:1 两种版式、内外双线装饰线框，还可上传背景图并自动叠加 55% 半透明遮罩保证文字可读。
          预览由 Canvas 按 900×1200 / 900×900 逻辑尺寸实时合成，文字全部居中排版、按宽度自动换行；一键导出 2 倍高清 PNG 长图，
          另附一份适合微信 / 短信直接发送的文本版请柬。全程无网络请求，数据不出浏览器。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">电子请柬怎么做：图片式与 H5 式的区别？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          电子请柬常见两种形态。图片式请柬是一张排版好的长图（如本工具导出的 PNG）：微信聊天、微信群、朋友圈都能直接发送，
          不需要任何平台审核、开发能力或托管服务，也不怕链接失效，长辈打开最省事。H5 式请柬是带翻页动画、背景音乐、报名回执的网页链接，
          需要依托企业微信、公众号或第三方平台的开发与托管能力，还可能遇到域名备案、链接被封等问题。
          本工具定位「图片式 + 文本版」：生成即所得、即存即发，通用性最强；如需 H5 交互能力，可把导出的图片交给公众号 / 企微开发团队作为素材。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">请柬上的时间怎么写？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          四点建议：一、公历农历并写并注明星期，如「公历 2026 年 5 月 20 日（周三）」，方便长辈核对日子——本工具日期栏填公历后自动补星期，农历可写在地点或邀约语里。
          二、整点写法取口彩：民间习惯避开整点，常用 10:58、11:58、17:58、18:08 等「要我发」「一路发」的谐音时间。
          三、区分「恭候」与「开席」：如「11:18 恭候、11:58 开席」，让宾客知道什么时候到场、什么时候开席。
          四、本工具时间栏是自由文本，以上格式都可以直接填写。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">婚礼请柬发给谁、什么时间发？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          发送对象：直系亲属与至交好友务必逐个单独发送并附一句问候；同事、同学按关系亲疏取舍；对领导与长辈，电话或当面邀请后再补一份请柬更显郑重。
          发送时间：常规口径是提前 1-2 周发出电子请柬；外地宾客建议提前一个月口头预告，方便对方安排行程与订票；婚礼前 2-3 天再逐一确认到场人数，便于酒店订桌。
          满月酒、乔迁宴、升学宴可参照执行：提前一周左右发出，宾客体面、自己也从容。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">文本版请柬怎么用？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          点击「复制文本版请柬」会得到一段多行纯文本：包含标题、主人公、日期时间、地点、地址、邀约语与电话，选填字段为空时整行自动省略。
          它可以直接粘贴到微信聊天、短信或邮件里发送，也可以先粘贴到备忘录里改好称呼（如「王叔叔您好」）再发；
          比起群发同一张图片，加上一句针对性称呼会显得更有诚意。图片版适合发朋友圈与家族群，文本版适合一对一发送，两者配合使用效果最好。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">请柬数据会上传吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不会。请柬图片全部由你浏览器里的 Canvas 在本地合成，背景图通过 FileReader 在本地读取，整个流程不产生任何网络请求。
          为了下次打开免重填，仅文字字段与配色、版式等设置会保存在本机 localStorage（不包含上传的背景图），清除浏览器站点数据即可彻底删除。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">电子请柬的数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。请柬图片全部由浏览器 Canvas 本地合成，背景图通过 FileReader 本地读取，全程无网络请求；仅文字字段与视觉设置保存在本机 localStorage（不含上传的背景图），清除站点数据即可删除。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么不做链接式 H5 请柬？</h3>
            <p class="text-sm text-muted-foreground mt-1">链接式 H5 请柬需要企业微信 / 公众号等平台开发能力、服务器托管与域名备案支持；本工具定位纯本地图片与文本生成，导出的 PNG 与文本版可直接在微信 / 短信发送，不依赖任何平台、不怕链接失效。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">请柬上的时间怎么写比较好？</h3>
            <p class="text-sm text-muted-foreground mt-1">建议公历与农历并写并注明星期；整点前取 10:58、11:58、17:58 等带口彩的时间，并区分恭候时间与开席时间（如「11:18 恭候、11:58 开席」）。本工具时间栏为自由文本，可按此格式填写。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'invitation-card-maker'" :category="'design'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Sparkles, Download, Copy, RefreshCw,
  ChevronUp, ChevronDown, Info, ImagePlus, CheckCircle, Palette
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '电子请柬生成器 - 在线婚礼/满月酒/乔迁/升学宴请柬制作工具',
  description: '免费在线电子请柬生成器：婚礼、满月酒、乔迁宴、升学宴四套场景文案模板，6 套主题配色、竖版/方版版式、装饰线框与背景图上传，Canvas 本地合成高清 PNG 下载，附微信/短信可直接发送的文本版请柬，纯浏览器本地运行不上传数据。',
  keywords: '电子请柬,请柬制作,婚礼邀请函,满月酒邀请,乔迁请柬',
  author: '有条工具',
  ogTitle: '电子请柬生成器 - 在线婚礼/满月酒/乔迁/升学宴请柬制作工具 | 有条工具',
  ogDescription: '四大场景模板 + 6 套主题配色，实时合成请柬长图 PNG 下载，附文本版一键复制，本地运行不上传。',
  ogUrl: 'https://www.util.cn/tools/invitation-card-maker',
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
          name: '电子请柬生成器',
          url: 'https://www.util.cn/tools/invitation-card-maker',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['婚礼/满月酒/乔迁宴/升学宴四套场景文案', '6 套主题配色与装饰双线线框', '竖版 3:4 / 方版 1:1 版式', '背景图上传与半透明遮罩', 'Canvas 本地合成高清 PNG 下载', '文本版请柬一键复制', '本地运行不上传数据']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '设计工具', item: 'https://www.util.cn/design/' },
            { '@type': 'ListItem', position: 3, name: '电子请柬生成器', item: 'https://www.util.cn/tools/invitation-card-maker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '电子请柬的数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。请柬图片全部由浏览器 Canvas 本地合成，背景图通过 FileReader 本地读取，全程无网络请求；仅文字字段与视觉设置保存在本机 localStorage（不含上传的背景图），清除站点数据即可删除。' }
            },
            {
              '@type': 'Question',
              name: '为什么不做链接式 H5 请柬？',
              acceptedAnswer: { '@type': 'Answer', text: '链接式 H5 请柬需要企业微信/公众号等平台开发能力、服务器托管与域名备案支持；本工具定位纯本地图片与文本生成，导出的 PNG 与文本版可直接在微信/短信发送，不依赖任何平台、不怕链接失效。' }
            },
            {
              '@type': 'Question',
              name: '请柬上的时间怎么写比较好？',
              acceptedAnswer: { '@type': 'Answer', text: '建议公历与农历并写并注明星期；整点前取 10:58、11:58、17:58 等带口彩的时间，并区分恭候时间与开席时间（如 11:18 恭候、11:58 开席）。本工具时间栏为自由文本，可按此格式填写。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const BG_MAX_BYTES = 2 * 1024 * 1024 // 背景图上限 2MB
const INVITE_OVERLAY_ALPHA = 0.55    // 有底图时统一叠加的遮罩不透明度口径

// 6 套模板配色：bg 底色 / fg 文字色 / accent 线框强调色
const THEME_PRESETS = [
  { id: 'coral', name: '珊瑚粉金', bg: '#fdf1ec', fg: '#7a4438', accent: '#e2907a' },
  { id: 'navy', name: '藏蓝金', bg: '#20294a', fg: '#f4eddc', accent: '#d4b46a' },
  { id: 'green', name: '墨绿米白', bg: '#f3efe3', fg: '#2e4b3c', accent: '#8a9a6b' },
  { id: 'wine', name: '酒红暗金', bg: '#3e1420', fg: '#f5e8d8', accent: '#c9963f' },
  { id: 'morandi', name: '莫兰迪紫', bg: '#ece7ee', fg: '#4a4152', accent: '#9a8aa5' },
  { id: 'teal', name: '清新青', bg: '#eaf4f2', fg: '#21514c', accent: '#4f9a8f' }
]

// 4 套场景默认文案（切换场景 / 重置文案时整组填充，填充后可再手改）
const SCENE_PRESETS = [
  {
    id: 'wedding', name: '婚礼', fileTag: '婚礼',
    title: '婚礼请柬', host: '张伟 & 林晓',
    date: '2026-05-20', time: '11:58',
    venue: '幸福国际大酒店 · 宴会厅', address: '幸福市幸福路 88 号 3 层',
    inviteText: '敬备喜宴 恭候光临', phone: '138 0000 0000'
  },
  {
    id: 'fullmoon', name: '满月酒', fileTag: '满月',
    title: '满月喜帖', host: '张伟家小公子',
    date: '2026-06-06', time: '17:58',
    venue: '聚福楼酒楼 · 龙凤厅', address: '幸福市平安大道 66 号',
    inviteText: '小宝贝满月之喜 恭候您携家人前来庆贺', phone: '139 0000 0000'
  },
  {
    id: 'housewarming', name: '乔迁宴', fileTag: '乔迁',
    title: '乔迁喜帖', host: '张伟 李梅 全家',
    date: '2026-08-08', time: '18:08',
    venue: '幸福花园小区 6 栋', address: '幸福市幸福路 88 号（新居）',
    inviteText: '新居落成之喜 恭候您前来暖房庆贺', phone: '136 0000 0000'
  },
  {
    id: 'graduation', name: '升学宴', fileTag: '升学宴',
    title: '升学谢师宴', host: '张小伟',
    date: '2026-07-18', time: '12:08',
    venue: '状元楼大酒店 · 二楼宴会厅', address: '幸福市学府街 18 号',
    inviteText: '金榜题名之喜 恭候您拨冗莅临', phone: '137 0000 0000'
  }
]

// 遮罩透明度口径：上传了背景图固定 0.55，无底图 0
function overlayAlphaOf(hasImage) {
  return hasImage ? INVITE_OVERLAY_ALPHA : 0
}

// '#rrggbb' → 'rgba(r, g, b, a)'，非法输入返回 null
function hexToRgba(hex, alpha) {
  if (typeof hex !== 'string') return null
  const h = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${alpha})`
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

// ctx-less 自动换行：maxCharsPerLine 为每行可容纳的「汉字数」，返回行数组
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

// '2026-05-20' → '2026年5月20日（周三）'；空值 / 非法 / 不存在日期返回 ''
function formatDateCn(dateStr) {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(dateStr || '').trim())
  if (!m) return ''
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const dt = new Date(y, mo - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return ''
  const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${y}年${mo}月${d}日（${weeks[dt.getDay()]}）`
}

// 文本版请柬：适合微信 / 短信直接发送的多行纯文本，选填字段为空整行省略
function buildTextInvite(f) {
  const val = (k) => String((f && f[k]) || '').trim()
  const lines = []
  if (val('title')) lines.push(`【${val('title')}】`)
  if (val('host')) lines.push(val('host'))
  const dateText = formatDateCn(val('date')) || val('date')
  const timeText = val('time')
  if (dateText || timeText) {
    lines.push(`谨定于 ${[dateText, timeText].filter(Boolean).join(' ')}`)
  }
  if (val('venue')) lines.push(`地点：${val('venue')}`)
  if (val('address')) lines.push(`地址：${val('address')}`)
  if (val('inviteText')) lines.push(val('inviteText'))
  if (val('phone')) lines.push(`垂询电话：${val('phone')}`)
  return lines.join('\n')
}

// 预览下方黄条：主人公 / 日期缺失检查
function missingHintFields(fields) {
  const out = []
  if (!String((fields && fields.host) || '').trim()) out.push('主人公')
  if (!String((fields && fields.date) || '').trim()) out.push('日期')
  return out
}

// 导出文件名：invitation-婚礼.png（按场景命名）
function exportFilename(fileTag) {
  return `invitation-${String(fileTag || '请柬')}.png`
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
const LAYOUTS = [
  { id: 'portrait', name: '竖版 3:4' },
  { id: 'square', name: '方版 1:1' }
]
const CANVAS_W = 900   // 画布逻辑宽
const PORTRAIT_H = 1200 // 竖版逻辑高（3:4）
const SQUARE_H = 900    // 方版逻辑高（1:1）
const EXPORT_SCALE = 2  // 导出按 2 倍尺寸输出高清图
const STORAGE_KEY = 'invitation-card-maker'

// 默认表单：婚礼场景示例文案
function defaultFormData() {
  const p = SCENE_PRESETS[0]
  return {
    title: p.title,
    host: p.host,
    date: p.date,
    time: p.time,
    venue: p.venue,
    address: p.address,
    inviteText: p.inviteText,
    phone: p.phone
  }
}

const form = reactive(defaultFormData())
const scene = ref(SCENE_PRESETS[0].id)
const themeId = ref(THEME_PRESETS[0].id)
const layout = ref('portrait')      // 'portrait' | 'square'
const showBorder = ref(true)        // 装饰双线线框
const bgDataUrl = ref('')           // 仅用于缩略图展示，不进 localStorage
const bgImg = ref(null)             // HTMLImageElement，仅在客户端回调中赋值
const bgError = ref('')
const exportStatus = ref('')
const copyStatus = ref('')
const copyOk = ref(true)
const seoContentVisible = ref(true)

const currentTheme = computed(() => THEME_PRESETS.find((t) => t.id === themeId.value) || THEME_PRESETS[0])
const currentScene = computed(() => SCENE_PRESETS.find((p) => p.id === scene.value) || SCENE_PRESETS[0])
const canvasSize = computed(() => ({ width: CANVAS_W, height: layout.value === 'square' ? SQUARE_H : PORTRAIT_H }))
const sizeInfoText = computed(() => {
  const { width, height } = canvasSize.value
  const ratio = layout.value === 'square' ? '方版 1:1' : '竖版 3:4'
  return `${width}×${height}px · ${ratio} · 导出 ${width * EXPORT_SCALE}×${height * EXPORT_SCALE}`
})
const missingFields = computed(() => missingHintFields(form))
const textInvite = computed(() => buildTextInvite(form))

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- Canvas 绘制（仅在 onMounted 之后 / 用户回调中调用，SSR 安全） ----------
const previewCanvasRef = ref(null)
const SERIF_FONT = '"Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", "Source Han Serif SC", serif'

// 内外双线装饰边框（accent 色）
function drawDoubleBorder(ctx, W, H, color) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.strokeRect(30, 30, W - 60, H - 60)
  ctx.lineWidth = 1
  ctx.strokeRect(44, 44, W - 88, H - 88)
  ctx.restore()
}

// 请柬整体绘制：底色 / 底图+遮罩 → 双线框 → 居中文本块（标题→主人公→谨定于→日期时间→地点→邀约语）→ 底部电话小字
function drawInvitationContent(ctx, W, H, state) {
  const { theme, form: f, showBorder: withBorder, bgImg: img, sizeScale } = state
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = theme.bg
  ctx.fillRect(0, 0, W, H)
  if (img) {
    const r = coverRect(img.naturalWidth || img.width, img.naturalHeight || img.height, W, H)
    ctx.drawImage(img, r.x, r.y, r.w, r.h)
    ctx.fillStyle = hexToRgba(theme.bg, overlayAlphaOf(true))
    ctx.fillRect(0, 0, W, H)
  }
  if (withBorder) drawDoubleBorder(ctx, W, H, theme.accent)

  const maxW = W - 240 // 文字安全宽（左右各留 120）
  const cx = W / 2

  // 文本块：{ lines, size, bold, color, alpha, lineGap, gapAfter }
  const blocks = []
  const pushBlock = (text, size, bold, color, alpha, lineGap, gapAfter) => {
    const t = String(text || '').trim()
    if (!t) return
    blocks.push({ lines: wrapTextByWidth(t, Math.floor(maxW / size)), size, bold, color, alpha, lineGap, gapAfter })
  }
  pushBlock(f.title, Math.round(58 * sizeScale), true, theme.fg, 1, 1.32, 34 * sizeScale)
  pushBlock(f.host, Math.round(92 * sizeScale), true, theme.fg, 1, 1.28, 30 * sizeScale)
  pushBlock('谨 定 于', Math.round(32 * sizeScale), false, theme.fg, 0.78, 1.3, 26 * sizeScale)
  pushBlock(formatDateCn(f.date), Math.round(56 * sizeScale), true, theme.fg, 1, 1.3, 12 * sizeScale)
  pushBlock(f.time, Math.round(40 * sizeScale), false, theme.accent, 1, 1.3, 26 * sizeScale)
  pushBlock(f.venue, Math.round(42 * sizeScale), true, theme.fg, 1, 1.35, 10 * sizeScale)
  pushBlock(f.address, Math.round(30 * sizeScale), false, theme.fg, 0.78, 1.45, 26 * sizeScale)
  pushBlock(f.inviteText, Math.round(36 * sizeScale), false, theme.fg, 0.9, 1.4, 0)

  // 总高自适应：整体在框内垂直居中（内容过高时从最小顶距开始顺排）
  let totalH = 0
  for (const b of blocks) totalH += b.lines.length * b.size * b.lineGap + b.gapAfter
  let y = Math.max(150, (H - totalH) / 2 - 20)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (const b of blocks) {
    ctx.font = `${b.bold ? '700' : '400'} ${b.size}px ${SERIF_FONT}`
    ctx.fillStyle = b.color
    ctx.globalAlpha = b.alpha
    for (const line of b.lines) {
      ctx.fillText(line, cx, y)
      y += b.size * b.lineGap
    }
    ctx.globalAlpha = 1
    y += b.gapAfter
  }

  // 底部电话小字
  const phone = String(f.phone || '').trim()
  if (phone) {
    ctx.font = `400 ${Math.round(26 * sizeScale)}px ${SERIF_FONT}`
    ctx.fillStyle = theme.fg
    ctx.globalAlpha = 0.72
    ctx.fillText(`垂询电话 ${phone}`, cx, H - 96)
    ctx.globalAlpha = 1
  }
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

function buildDrawState() {
  return {
    theme: currentTheme.value,
    form,
    showBorder: showBorder.value,
    bgImg: bgImg.value,
    sizeScale: layout.value === 'square' ? 0.85 : 1
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
  drawInvitationContent(ctx, W, H, buildDrawState())
}

// ---------- 输入防抖 200ms 重绘 + 本地持久化（仅文字字段与视觉设置，不存背景图） ----------
let redrawTimer = null

function scheduleRedraw() {
  if (redrawTimer) clearTimeout(redrawTimer)
  redrawTimer = setTimeout(() => {
    redrawTimer = null
    renderPreview()
    saveState()
  }, 200)
}

watch([form, themeId, layout, showBorder], scheduleRedraw, { deep: true })

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sceneId: scene.value,
      form: { ...form },
      themeId: themeId.value,
      layout: layout.value,
      showBorder: showBorder.value
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
    if (SCENE_PRESETS.some((p) => p.id === saved.sceneId)) scene.value = saved.sceneId
    if (THEME_PRESETS.some((t) => t.id === saved.themeId)) themeId.value = saved.themeId
    if (saved.layout === 'portrait' || saved.layout === 'square') layout.value = saved.layout
    if (typeof saved.showBorder === 'boolean') showBorder.value = saved.showBorder
  } catch (e) { /* 数据损坏时忽略，使用默认值 */ }
}

// ---------- 背景图上传（FileReader 仅在用户回调中执行，不持久化） ----------
function handleBgChange(e) {
  const input = e.target
  const file = input && input.files && input.files[0]
  if (!file) return
  if (file.size > BG_MAX_BYTES) {
    bgError.value = `背景图超过 2MB（当前 ${(file.size / 1024 / 1024).toFixed(2)}MB），请压缩后再上传`
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

// ---------- 场景与操作 ----------
// 切换场景 / 按场景重置：整组填充该场景默认文案，填充后可继续手改
function applyScenePreset() {
  const p = currentScene.value
  Object.assign(form, {
    title: p.title,
    host: p.host,
    date: p.date,
    time: p.time,
    venue: p.venue,
    address: p.address,
    inviteText: p.inviteText,
    phone: p.phone
  })
}

// 载入示例（婚礼套）：婚礼文案 + 默认视觉，清空背景图
function loadSample() {
  scene.value = 'wedding'
  applyScenePreset()
  themeId.value = THEME_PRESETS[0].id
  layout.value = 'portrait'
  showBorder.value = true
  bgDataUrl.value = ''
  bgImg.value = null
  bgError.value = ''
  exportStatus.value = ''
  copyStatus.value = ''
  renderPreview()
}

// ---------- 导出 PNG（toBlob 判空兜底 toDataURL） ----------
async function exportPng() {
  const { width: W, height: H } = canvasSize.value
  const temp = document.createElement('canvas')
  temp.width = W * EXPORT_SCALE
  temp.height = H * EXPORT_SCALE
  const ctx = temp.getContext('2d')
  if (!ctx) return
  ctx.setTransform(EXPORT_SCALE, 0, 0, EXPORT_SCALE, 0, 0)
  drawInvitationContent(ctx, W, H, buildDrawState())

  const filename = exportFilename(currentScene.value.fileTag)
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
  exportStatus.value = `已导出 ${filename}（${W * EXPORT_SCALE}×${H * EXPORT_SCALE}px 高清图，可直接发送 / 保存）`
}

// ---------- 文本版复制（clipboard 优先，execCommand 兜底） ----------
async function copyTextInvite() {
  const text = textInvite.value
  if (!text) {
    copyOk.value = false
    copyStatus.value = '请柬内容为空，请先填写文案再复制'
    return
  }
  let ok = false
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      ok = true
    }
  } catch (e) {
    ok = false
  }
  if (!ok) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      ok = document.execCommand('copy')
      ta.remove()
    } catch (e) {
      ok = false
    }
  }
  copyOk.value = ok
  copyStatus.value = ok
    ? '已复制文本版请柬，可直接粘贴到微信 / 短信发送'
    : '复制失败，请在下方文本框手动全选复制'
  if (ok) {
    setTimeout(() => { copyStatus.value = '' }, 2500)
  }
}

// ---------- 生命周期（canvas 绘制仅在挂载后进行，SSR 安全） ----------
onMounted(() => {
  loadState()
  renderPreview()
  window.addEventListener('resize', renderPreview)
  addRecentTool('invitation-card-maker')
})

onBeforeUnmount(() => {
  if (redrawTimer) {
    clearTimeout(redrawTimer)
    redrawTimer = null
  }
  window.removeEventListener('resize', renderPreview)
})
</script>
