<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Stamp class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">印章生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">圆形章 / 椭圆章 / 方形姓名章 · 弧形环绕文字 · 做旧盖印质感 · 透明底 PNG 本地导出</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线印章生成工具：支持圆形章（公章式双环线 + 弧形环绕单位名 + 可选中央五角星 + 横排章号）、椭圆章（合同 / 财务章式双圈弧形文字）与方形个人姓名章（单字 / 双字，可选回字纹边框）三种章型。
        印章直径、字体系数、印泥颜色、边缘做旧质感均可调，512×512 Canvas 实时绘制，一键导出透明底 PNG 或复制到剪贴板。全部绘制在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 合规提示卡（显著位置） -->
    <div class="mb-6 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
      <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <p class="text-sm font-semibold text-red-600 dark:text-red-400">合规提示：仅供学习、排版预览与个人姓名章使用</p>
        <p class="text-xs text-red-600/80 dark:text-red-400/80 mt-1 leading-relaxed">
          本工具生成的印章图片仅供学习、排版预览与个人姓名章使用；伪造公司、机关印章违法（《中华人民共和国刑法》第 280 条），请勿用于冒用或任何违法违规用途，请勿将生成的图片用于代替真实印章签署任何文件。
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：参数控件区 -->
      <div class="space-y-6">
        <!-- 章型与文字 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Stamp class="w-5 h-5 mr-2 text-primary" /> 章型与文字
          </h2>

          <!-- 章型选择 -->
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-2 block">章型</label>
            <div class="flex gap-2">
              <button
                v-for="t in SEAL_TYPES"
                :key="t.id"
                @click="sealType = t.id"
                class="flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition"
                :class="sealType === t.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'"
              >{{ t.name }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">{{ currentTypeHint }}</p>
          </div>

          <!-- 名称 / 姓名 -->
          <div>
            <label for="sealName" class="text-xs font-medium text-muted-foreground mb-1 block">{{ nameInputLabel }}</label>
            <input
              id="sealName"
              v-model="sealName"
              type="text"
              maxlength="16"
              :placeholder="nameInputPlaceholder"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p v-if="sealType === 'square'" class="text-xs text-muted-foreground mt-1">姓名章最多取前两个汉字，单字居中、双字上下排列。</p>
          </div>

          <!-- 中央五角星（仅圆形章） -->
          <label v-if="sealType === 'circle'" class="flex items-center justify-between cursor-pointer bg-muted/40 border border-border rounded-lg px-3 py-2.5">
            <span class="text-xs text-foreground leading-snug">中央五角星（公章式）</span>
            <input v-model="showStar" type="checkbox" class="w-4 h-4 flex-shrink-0" />
          </label>

          <!-- 章号（圆形 / 椭圆） -->
          <div v-if="sealType !== 'square'" class="space-y-2">
            <label class="flex items-center justify-between cursor-pointer bg-muted/40 border border-border rounded-lg px-3 py-2.5">
              <span class="text-xs text-foreground leading-snug">显示章号（横排数字编码）</span>
              <input v-model="showCode" type="checkbox" class="w-4 h-4 flex-shrink-0" />
            </label>
            <div v-if="showCode">
              <input
                v-model="sealCode"
                type="text"
                maxlength="16"
                placeholder="1234567890123"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p class="text-xs text-muted-foreground mt-1">常见为 13 位数字编码，仅作排版演示占位，请勿填写真实备案编码。</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1">
            <button
              @click="loadSample"
              class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >
              <Sparkles class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 载入示例
            </button>
            <button
              @click="resetAll"
              class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >
              <RotateCcw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认
            </button>
          </div>
        </div>

        <!-- 样式与质感 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Palette class="w-5 h-5 mr-2 text-primary" /> 样式与质感
          </h2>

          <!-- 尺寸 -->
          <div>
            <label for="sealSize" class="text-xs font-medium text-muted-foreground mb-1 block">{{ sizeInputLabel }}：{{ sealSize }} px</label>
            <input
              id="sealSize"
              v-model.number="sealSize"
              type="range"
              min="320"
              max="470"
              step="2"
              class="w-full"
            />
            <p class="text-xs text-muted-foreground mt-1">画布固定 512×512，此参数控制印章在画布中的占幅。</p>
          </div>

          <!-- 字体系数 -->
          <div>
            <label for="fontScale" class="text-xs font-medium text-muted-foreground mb-1 block">字体系数：×{{ fontScale.toFixed(2) }}</label>
            <input
              id="fontScale"
              v-model.number="fontScale"
              type="range"
              min="0.7"
              max="1.3"
              step="0.05"
              class="w-full"
            />
            <p class="text-xs text-muted-foreground mt-1">实际字体依系统可用宋体渲染（宋体 / 华文宋体 / 思源宋体），不同设备观感略有差异。</p>
          </div>

          <!-- 印泥颜色 -->
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-2">印泥颜色</p>
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-for="c in COLOR_PRESETS"
                :key="c.hex"
                @click="inkColor = c.hex"
                :title="c.name"
                class="w-9 h-9 rounded-lg border-2 flex items-center justify-center transition"
                :class="inkColor === c.hex ? 'border-foreground ring-2 ring-primary/30' : 'border-border hover:border-muted-foreground'"
                :style="{ backgroundColor: c.hex }"
              >
                <CheckCircle v-if="inkColor === c.hex" class="w-4 h-4 text-white drop-shadow" />
              </button>
              <input
                v-model="inkColor"
                type="color"
                aria-label="自定义印泥颜色"
                class="w-9 h-9 p-1 rounded-lg border border-border bg-background cursor-pointer"
              />
              <span class="text-xs text-muted-foreground font-mono uppercase">{{ inkColor }}</span>
            </div>
          </div>

          <!-- 边缘做旧 -->
          <div class="space-y-2">
            <label class="flex items-center justify-between cursor-pointer bg-muted/40 border border-border rounded-lg px-3 py-2.5">
              <span class="text-xs text-foreground leading-snug">边缘做旧（随机噪点缺口，模拟盖印质感）</span>
              <input v-model="aging" type="checkbox" class="w-4 h-4 flex-shrink-0" />
            </label>
            <button
              v-if="aging"
              @click="agingSalt++"
              class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition"
            >
              <RefreshCw class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 换一批做旧纹理
            </button>
          </div>
        </div>
      </div>

      <!-- 右：实时预览与导出 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Stamp class="w-5 h-5 mr-2 text-primary" /> 实时预览
          </h2>
          <span class="text-xs text-muted-foreground font-mono">512 × 512 px · 透明底</span>
        </div>

        <div class="flex justify-center">
          <div class="checker-bg inline-block rounded-lg border border-border p-2">
            <canvas
              ref="previewCanvasRef"
              width="512"
              height="512"
              class="block max-w-full h-auto"
              aria-label="印章预览画布"
            ></canvas>
          </div>
        </div>
        <p class="text-xs text-muted-foreground text-center">预览棋盘格代表透明区域，导出的 PNG 同样为透明底，可直接叠加在文档或图片上。</p>

        <!-- 导出与复制 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            @click="exportPng"
            class="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            <Download class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 下载透明底 PNG
          </button>
          <button
            @click="copyPng"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制到剪贴板
          </button>
        </div>
        <p v-if="exportStatus" class="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle class="w-3.5 h-3.5 flex-shrink-0" />{{ exportStatus }}
        </p>
        <p v-if="copyStatus" class="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle class="w-3.5 h-3.5 flex-shrink-0" />{{ copyStatus }}
        </p>

        <!-- 使用提示 -->
        <div class="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            导出按 2 倍尺寸（1024×1024）输出高清透明底 PNG，可直接插入 Word / PPT 作排版预览，或用于个人姓名章印模效果预览。
            复制到剪贴板后可在支持图片粘贴的编辑器中直接粘贴。再次提醒：仅供学习、排版预览与个人姓名章使用，请勿用于伪造印章。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>印章生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          印章生成器是一款纯浏览器本地运行的印章图片制作工具（seal maker online / stamp generator）。内置圆形章、椭圆章、方形个人姓名章三种章型：
          圆形章为公章式版式——外圈双环线、弧形环绕单位名、可选中央五角星与横排章号；椭圆章为合同 / 财务章式——椭圆双圈与顶部弧形文字；
          方形章为传统单字 / 双字姓名章，可选回字纹边框。印章直径、字体系数、印泥颜色、边缘做旧质感均可实时调整，
          由 512×512 Canvas 本地绘制，一键导出 2 倍高清透明底 PNG 或复制到剪贴板。全程无网络请求，数据不出浏览器。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">三种章型分别适合什么场景？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          圆形章：版式最接近常见的公章样式（双环线 + 弧形单位名 + 五角星 + 章号），适合排版演示、教学课件、设计稿占位等场景；
          椭圆章：横向椭圆双圈，常见于合同章、财务章的版式样式，弧形文字沿椭圆顶部从左到右等弧长分布；
          方形章：单字或双字竖排姓名章，可加回字纹边框，适合个人姓名章印模预览、手账装饰、签名设计参考等个人用途。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">如何使用本工具生成印章图片？</h3>
        <ol class="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-6">
          <li>选择章型：圆形章 / 椭圆章 / 方形个人章；</li>
          <li>填写单位名称或姓名（方形姓名章自动取前两个汉字）；</li>
          <li>按需开启五角星、章号、回字纹边框等选项；</li>
          <li>调整直径、字体系数、印泥颜色与边缘做旧质感，预览实时更新；</li>
          <li>点击「下载透明底 PNG」或「复制到剪贴板」取用图片。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">字体与显示效果说明</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本工具不内置任何印章专用字体，文字按宋体族（Songti SC / STSong / SimSun / 思源宋体等）渲染，实际字体依系统可用宋体渲染，不同设备观感略有差异。
          真实公章多使用专用篆体字库并由公安机关备案制作，本工具生成效果仅为排版示意，与真实印章存在明显差别。
          「字体系数」可在 0.7–1.3 之间缩放文字大小；「边缘做旧」通过种子随机噪点与轮廓缺口模拟盖印时的印泥不匀，点击「换一批做旧纹理」可更换随机纹理。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">合规使用说明（重要）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本工具生成的印章图片仅供学习、排版预览与个人姓名章使用。根据《中华人民共和国刑法》第 280 条，伪造公司、企业、事业单位、人民团体印章的，处三年以下有期徒刑、拘役、管制或者剥夺政治权利，并处罚金；
          伪造国家机关印章的从重处罚。请勿利用本工具伪造公司 / 机关印章，请勿将生成图片用于冒用、签署文件或其他违法违规用途。章号输入框仅作排版演示占位，请勿填写任何真实备案编码。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">生成的印章能用来盖合同、盖章办事吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不能。生成图片仅供学习、排版预览与个人姓名章使用，不具备任何法律效力；伪造公司 / 机关印章违法（《刑法》第 280 条），请勿用于冒用或代替真实印章。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">导出的 PNG 是透明底吗？怎么用？</h3>
            <p class="text-sm text-muted-foreground mt-1">是。画布本身透明，导出 PNG 按约 2 倍尺寸（1024×1024）输出，可直接插入 Word / PPT 叠加在文档页面上作排版预览；预览区的棋盘格即代表透明区域。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">填写的内容和上传的图片会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。印章全部由浏览器 Canvas 在本地绘制，导出与复制也在本地完成，整个过程不产生任何网络请求。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么我的印章字体和别人看到的不一样？</h3>
            <p class="text-sm text-muted-foreground mt-1">文字使用系统可用的宋体族渲染（宋体 / 华文宋体 / SimSun / 思源宋体等），实际字体依系统可用宋体渲染；缺少中文宋体的设备会回退到系统默认衬线字体，观感会有差异。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'seal-maker-online'" :category="'design'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Stamp, AlertTriangle, Download, Copy, Sparkles, RotateCcw,
  ChevronUp, ChevronDown, Info, CheckCircle, Palette, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '印章生成器 - 在线圆形公章/椭圆章/个人姓名章制作工具 | 有条工具',
  description: '免费在线印章生成器：圆形章（双环线+弧形单位名+五角星+章号）、椭圆章（合同/财务章式）、方形个人姓名章（可选回字纹边框）三种章型，直径/字体系数/印泥颜色/边缘做旧可调，512×512 Canvas 本地绘制，透明底 PNG 下载与剪贴板复制，仅供学习与排版预览使用。',
  keywords: '印章生成器,电子印章在线制作,圆形公章生成,椭圆章生成器,个人姓名章,seal maker online,stamp generator',
  author: '有条工具',
  ogTitle: '印章生成器 - 在线圆形公章/椭圆章/个人姓名章制作工具 | 有条工具',
  ogDescription: '圆形章/椭圆章/方形姓名章三种章型，弧形环绕文字与做旧质感，透明底 PNG 本地导出，仅供学习与排版预览。',
  ogUrl: 'https://www.util.cn/tools/seal-maker-online',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '印章生成器 - 在线印章图片制作工具',
  twitterDescription: '圆形章/椭圆章/方形姓名章三种章型，透明底 PNG 本地导出，仅供学习与排版预览。'
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
          name: '印章生成器',
          url: 'https://www.util.cn/tools/seal-maker-online',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '圆形章/椭圆章/方形姓名章三种章型',
            '弧形环绕文字与可选中央五角星',
            '横排章号与回字纹边框',
            '直径/字体系数/印泥颜色可调',
            '边缘做旧盖印质感（可换随机纹理）',
            '透明底高清 PNG 下载与剪贴板复制',
            '纯本地 Canvas 绘制不上传数据'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '设计工具', item: 'https://www.util.cn/design/' },
            { '@type': 'ListItem', position: 3, name: '印章生成器', item: 'https://www.util.cn/tools/seal-maker-online/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '生成的印章能用来盖合同、盖章办事吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。生成图片仅供学习、排版预览与个人姓名章使用，不具备任何法律效力；伪造公司/机关印章违法（《刑法》第 280 条），请勿用于冒用或代替真实印章。' }
            },
            {
              '@type': 'Question',
              name: '导出的 PNG 是透明底吗？怎么用？',
              acceptedAnswer: { '@type': 'Answer', text: '是。画布本身透明，导出 PNG 按约 2 倍尺寸（1024×1024）输出，可直接插入 Word / PPT 叠加在文档页面上作排版预览；预览区的棋盘格即代表透明区域。' }
            },
            {
              '@type': 'Question',
              name: '填写的内容会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。印章全部由浏览器 Canvas 在本地绘制，导出与复制也在本地完成，整个过程不产生任何网络请求。' }
            },
            {
              '@type': 'Question',
              name: '为什么我的印章字体和别人看到的不一样？',
              acceptedAnswer: { '@type': 'Answer', text: '文字使用系统可用的宋体族渲染，实际字体依系统可用宋体渲染；缺少中文宋体的设备会回退到系统默认衬线字体，观感会有差异。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（Canvas 无关，可独立单测） ----------
const CANVAS_SIZE = 512
const STAR_INNER_RATIO = Math.sin(Math.PI / 10) / Math.sin(3 * Math.PI / 10) // ≈0.382，标准五角星内外圆比
const SERIF_FONT = '"Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", "Source Han Serif SC", "FangSong", "STFangsong", serif'

// 确定性伪随机（mulberry32）：同一种子序列完全一致，做旧纹理可复现
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// FNV-1a 字符串哈希：由文字/章型派生做旧种子
function hashString(str) {
  const s = String(str || '')
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// 圆弧文字逐字坐标：字符按等角距分布在 centerAngle 两侧（对称、等差），
// x/y 为相对圆心坐标；rotate = angle + π/2 使字头朝圆外（顶部弧线从左到右正读）
function circularArcText(text, radius, opts = {}) {
  const centerAngle = typeof opts.centerAngle === 'number' ? opts.centerAngle : -Math.PI / 2
  const stepAngle = typeof opts.stepAngle === 'number' && opts.stepAngle > 0 ? opts.stepAngle : 0.24
  const chars = Array.from(String(text || '').trim())
  const n = chars.length
  if (!n || !(radius > 0)) return []
  const start = centerAngle - ((n - 1) * stepAngle) / 2
  return chars.map((char, i) => {
    const angle = start + i * stepAngle
    return {
      char,
      angle,
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      rotate: angle + Math.PI / 2
    }
  })
}

// 圆弧文字字号自适应：受最大弧跨度 maxSpan 与字号上限 cap 约束，字距 ≈ 字宽（widthFactor × 字号）
function arcFontSize(text, radius, base, opts = {}) {
  const widthFactor = opts.widthFactor || 1.14
  const maxSpan = opts.maxSpan || 3.6
  const cap = typeof opts.cap === 'number' ? opts.cap : Infinity
  const n = Array.from(String(text || '').trim()).length
  if (!n) return Math.min(base, cap)
  const stepBySize = (base * widthFactor) / radius
  const step = Math.min(stepBySize, maxSpan / n)
  return Math.min((step * radius) / widthFactor, cap)
}

// 椭圆参数方程点：t 弧度 → 相对中心坐标（a 横半轴、b 纵半轴；canvas y 向下，t=3π/2 为正上方）
function ellipsePoint(a, b, t) {
  return { x: a * Math.cos(t), y: b * Math.sin(t) }
}

// 椭圆顶部弧长累计表：t 从 π（最左）经 3π/2（顶部）到 2π（最右），samples 段折线近似
function ellipseArcTable(a, b, samples) {
  const N = samples || 720
  const cum = new Array(N + 1)
  cum[0] = 0
  let prev = ellipsePoint(a, b, Math.PI)
  for (let i = 1; i <= N; i++) {
    const t = Math.PI + (Math.PI * i) / N
    const p = ellipsePoint(a, b, t)
    cum[i] = cum[i - 1] + Math.hypot(p.x - prev.x, p.y - prev.y)
    prev = p
  }
  return cum
}

// 弧长 s → 参数 t：在累计表上二分定位 + 段内线性插值
function tAtArcLength(cum, s) {
  const N = cum.length - 1
  const total = cum[N]
  const sc = Math.min(Math.max(s, 0), total)
  let lo = 0
  let hi = N
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (cum[mid] <= sc) lo = mid
    else hi = mid
  }
  const seg = cum[hi] - cum[lo] || 1
  const frac = (sc - cum[lo]) / seg
  return Math.PI + (Math.PI * (lo + frac)) / N
}

// 椭圆顶部弧形文字：沿顶部从左到右等弧长分布；字符旋转角取切线方向
// （d/dt = (-a·sin t, b·cos t)，顶部中点切线水平向右 → 字正立，两端字头自然朝外倾斜）
function ellipticalArcText(text, a, b, opts = {}) {
  const spanRatio = typeof opts.spanRatio === 'number' ? Math.min(Math.max(opts.spanRatio, 0.1), 1) : 0.72
  const chars = Array.from(String(text || '').trim())
  const n = chars.length
  if (!n || !(a > 0) || !(b > 0)) return []
  const cum = ellipseArcTable(a, b, opts.samples || 720)
  const total = cum[cum.length - 1]
  const span = total * spanRatio
  const start = (total - span) / 2
  return chars.map((char, i) => {
    const s = n === 1 ? start + span / 2 : start + (span * i) / (n - 1)
    const t = tAtArcLength(cum, s)
    const p = ellipsePoint(a, b, t)
    const rotate = Math.atan2(b * Math.cos(t), -a * Math.sin(t))
    return { char, t, x: p.x, y: p.y, rotate }
  })
}

// 椭圆章字号自适应：字号同时受「字外缘不越过外圈内侧」（纵向）与「顶部弧长容量」（横向）约束，迭代收敛
function fitEllipseFontSize(a, b, n, base, opts = {}) {
  const ringClear = opts.ringClear || 9
  const spanRatio = opts.spanRatio || 0.72
  const widthFactor = opts.widthFactor || 1.15
  let fs = Math.max(6, base)
  if (!n) return fs
  for (let i = 0; i < 8; i++) {
    const ta = a - ringClear - fs / 2
    const tb = b - ringClear - fs / 2
    if (ta <= 0 || tb <= 0) return 6
    const cum = ellipseArcTable(ta, tb, 360)
    const span = cum[cum.length - 1] * spanRatio
    const need = n * fs * widthFactor
    if (need <= span) break
    const next = fs * Math.max(0.78, span / need)
    fs = next
    if (Math.abs(next - fs) < 0.1) break
  }
  return Math.max(6, fs)
}

// 五角星顶点：外接圆 outerR / 内切圆 innerR，rotation 起始角（-π/2 = 顶角朝上），返回 10 个相对中心坐标
function starPoints(outerR, innerR, rotation) {
  const rot = typeof rotation === 'number' ? rotation : -Math.PI / 2
  const pts = []
  for (let i = 0; i < 5; i++) {
    const oa = rot + (i * 2 * Math.PI) / 5
    const ia = oa + Math.PI / 5
    pts.push({ x: outerR * Math.cos(oa), y: outerR * Math.sin(oa) })
    pts.push({ x: innerR * Math.cos(ia), y: innerR * Math.sin(ia) })
  }
  return pts
}

// 按最大宽度收缩字号：measure(text, size) 返回该字号下文本宽度（measure 可 mock，纯函数可测）
function fitFontSize(text, maxWidth, baseSize, measure) {
  const t = String(text || '')
  if (!t || typeof measure !== 'function') return baseSize
  let size = baseSize
  let guard = 0
  while (size > 6 && measure(t, size) > maxWidth && guard < 64) {
    size = size * 0.92
    guard++
  }
  return size
}

// 正方形周长均匀随机采样（做旧轮廓缺口用）：返回相对中心的点，max(|x|,|y|) === half
function squarePerimeterPoint(rnd, half) {
  const p = rnd() * 8 * half
  if (p < 2 * half) return { x: -half + p, y: -half }
  if (p < 4 * half) return { x: half, y: -half + (p - 2 * half) }
  if (p < 6 * half) return { x: half - (p - 4 * half), y: half }
  return { x: -half, y: half - (p - 6 * half) }
}

// 回字纹单边瓦片中心偏移：在长度 len 内放整数个 tile 方块（块间距恰好 gap 起步），整体居中
function meanderSideOffsets(len, tile, gap) {
  if (!(len > 0) || !(tile > 0)) return []
  const count = Math.max(1, Math.floor((len - tile) / (tile + gap)) + 1)
  if (count === 1) return [len / 2]
  const total = count * tile + (count - 1) * gap
  const start = (len - total) / 2
  const out = []
  for (let i = 0; i < count; i++) out.push(start + tile / 2 + i * (tile + gap))
  return out
}

// PNG dataURL 生成与校验（导出与 mock 自测共用）
function canvasToPngDataUrl(canvas) {
  return canvas.toDataURL('image/png')
}
function isPngDataUrl(s) {
  return typeof s === 'string' && s.indexOf('data:image/png') === 0
}

// 导出文件名
const SEAL_TYPE_TAGS = { circle: '圆形章', ellipse: '椭圆章', square: '姓名章' }
function exportFilename(type) {
  return `seal-${SEAL_TYPE_TAGS[type] || '印章'}.png`
}
// ---------- 纯逻辑结束（以下依赖 Canvas / 组件状态） ----------

// ---------- 常量与状态 ----------
const SEAL_TYPES = [
  { id: 'circle', name: '圆形章', hint: '公章式：外圈双环线 + 弧形环绕单位名 + 可选中央五角星 + 横排章号。' },
  { id: 'ellipse', name: '椭圆章', hint: '合同 / 财务章式：椭圆双圈，单位名沿椭圆顶部弧形分布，底部横排章号。' },
  { id: 'square', name: '方形个人章', hint: '姓名章式：单字 / 双字竖排，可选回字纹边框，适合个人姓名章印模预览。' }
]

const COLOR_PRESETS = [
  { hex: '#d40000', name: '印泥红' },
  { hex: '#b01111', name: '深印红' },
  { hex: '#1e3a8a', name: '印蓝' },
  { hex: '#1c1917', name: '印黑' }
]

const SAMPLES = {
  circle: { name: '某某科技有限公司', code: '1234567890123' },
  ellipse: { name: '某某有限公司', code: '4403010000001' },
  square: { name: '张三' }
}

const STORAGE_DEFAULTS = {
  sealType: 'circle',
  name: '某某科技有限公司',
  code: '1234567890123'
}

const sealType = ref(STORAGE_DEFAULTS.sealType)
const sealName = ref(STORAGE_DEFAULTS.name)
const sealCode = ref(STORAGE_DEFAULTS.code)
const showStar = ref(true)
const showCode = ref(true)
const showMeander = ref(true)
const sealSize = ref(430)
const fontScale = ref(1)
const inkColor = ref('#d40000')
const aging = ref(true)
const agingSalt = ref(0)
const exportStatus = ref('')
const copyStatus = ref('')
const seoContentVisible = ref(true)

const previewCanvasRef = ref(null)

const currentTypeHint = computed(() => {
  const t = SEAL_TYPES.find((x) => x.id === sealType.value)
  return t ? t.hint : ''
})
const nameInputLabel = computed(() => (sealType.value === 'square' ? '姓名（取前两个字）' : '单位名称（弧形环绕）'))
const nameInputPlaceholder = computed(() => (sealType.value === 'square' ? '张三' : '某某科技有限公司'))
const sizeInputLabel = computed(() => (sealType.value === 'circle' ? '印章直径' : sealType.value === 'ellipse' ? '横向长轴' : '印面边长'))

// 做旧种子：由章型 / 文字 / 颜色派生，可由「换一批纹理」加盐重掷（确定性可复现）
const agingSeed = computed(() => {
  const base = hashString(`${sealType.value}|${sealName.value}|${inkColor.value}`)
  return (base + agingSalt.value * 0x9e3779b9) >>> 0
})

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

function buildDrawState() {
  return {
    sealType: sealType.value,
    name: sealName.value,
    code: sealCode.value,
    showStar: showStar.value,
    showCode: showCode.value,
    showMeander: showMeander.value,
    size: sealSize.value,
    fontScale: fontScale.value,
    color: inkColor.value,
    aging: aging.value,
    seed: agingSeed.value
  }
}

// ---------- Canvas 绘制（仅在 onMounted 之后 / 用户回调中调用，SSR 安全） ----------
const HEX_RE = /^#[0-9a-fA-F]{6}$/

function safeInk(color) {
  return HEX_RE.test(String(color || '')) ? color : '#d40000'
}

function circleStroke(ctx, cx, cy, r) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
}

function ellipseStroke(ctx, cx, cy, a, b) {
  ctx.beginPath()
  ctx.ellipse(cx, cy, a, b, 0, 0, Math.PI * 2)
  ctx.stroke()
}

// 弧形文字统一落笔：平移到字位 → 旋转 → 居中绘制
function drawArcGlyphs(ctx, cx, cy, glyphs, font) {
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const g of glyphs) {
    ctx.save()
    ctx.translate(cx + g.x, cy + g.y)
    ctx.rotate(g.rotate)
    ctx.fillText(g.char, 0, 0)
    ctx.restore()
  }
}

// 圆形章：双环线 + 弧形单位名 + 可选五角星 + 横排章号
function drawCircleSeal(ctx, cx, cy, s, ink) {
  const R = s.size / 2
  // 外圈双环线：粗外环 + 细内环
  ctx.strokeStyle = ink
  ctx.lineWidth = Math.max(5, R * 0.032)
  circleStroke(ctx, cx, cy, R - ctx.lineWidth / 2)
  ctx.lineWidth = Math.max(1.5, R * 0.011)
  circleStroke(ctx, cx, cy, R * 0.925)

  // 弧形环绕单位名（字外缘收在细内环之内）
  const textR = R * 0.785
  const base = R * 0.2 * s.fontScale
  const fontSize = arcFontSize(s.name, textR, base, { cap: R * 0.245 })
  const step = (fontSize * 1.14) / textR
  const glyphs = circularArcText(s.name, textR, { stepAngle: step })
  ctx.fillStyle = ink
  drawArcGlyphs(ctx, cx, cy, glyphs, `700 ${fontSize}px ${SERIF_FONT}`)

  // 中央五角星（可选）
  if (s.showStar) {
    const outerR = R * 0.26
    const star = starPoints(outerR, outerR * STAR_INNER_RATIO)
    ctx.beginPath()
    star.forEach((p, i) => (i ? ctx.lineTo(cx + p.x, cy + p.y) : ctx.moveTo(cx + p.x, cy + p.y)))
    ctx.closePath()
    ctx.fill()
  }

  // 章号横排
  if (s.showCode) {
    const code = String(s.code || '').trim()
    if (code) {
      const maxW = 2 * R * 0.7
      const size = fitFontSize(code, maxW, R * 0.115, (t, fs) => {
        ctx.font = `600 ${fs}px ${SERIF_FONT}`
        return ctx.measureText(t).width
      })
      ctx.fillStyle = ink
      ctx.font = `600 ${size}px ${SERIF_FONT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(code, cx, cy + R * 0.55)
    }
  }
}

// 椭圆章：椭圆双圈（内圈随字号自适应内收）+ 顶部弧形文字 + 底部横排章号
function drawEllipseSeal(ctx, cx, cy, s, ink) {
  const a = s.size / 2
  const b = s.size * 0.3
  const n = Array.from(String(s.name || '').trim()).length
  const ringW = Math.max(5, b * 0.058)
  const base = b * 0.34 * s.fontScale
  const fontSize = n ? fitEllipseFontSize(a, b, n, base) : Math.min(base, b * 0.34)
  const ringClear = 9
  const ta = a - ringClear - fontSize / 2
  const tb = b - ringClear - fontSize / 2
  const ia = ta - fontSize * 0.62
  const ib = tb - fontSize * 0.62

  ctx.strokeStyle = ink
  ctx.lineWidth = ringW
  ellipseStroke(ctx, cx, cy, a - ringW / 2, b - ringW / 2)
  ctx.lineWidth = Math.max(1.4, b * 0.016)
  ellipseStroke(ctx, cx, cy, ia, ib)

  // 顶部弧形文字（等弧长分布）
  const glyphs = ellipticalArcText(s.name, ta, tb, { spanRatio: 0.72 })
  ctx.fillStyle = ink
  drawArcGlyphs(ctx, cx, cy, glyphs, `700 ${fontSize}px ${SERIF_FONT}`)

  // 章号横排（底部，宽度收在椭圆内）
  if (s.showCode) {
    const code = String(s.code || '').trim()
    if (code) {
      const chordHalf = ib * Math.sqrt(Math.max(0, 1 - 0.55 * 0.55))
      const maxW = 2 * chordHalf * 0.92
      const size = fitFontSize(code, maxW, Math.min(b * 0.19 * s.fontScale, b * 0.2), (t, fs) => {
        ctx.font = `600 ${fs}px ${SERIF_FONT}`
        return ctx.measureText(t).width
      })
      ctx.fillStyle = ink
      ctx.font = `600 ${size}px ${SERIF_FONT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(code, cx, cy + b * 0.52)
    }
  }
}

// 方形个人章：外粗框 + 内细框 + 可选回字纹 + 单/双字竖排
function drawSquareSeal(ctx, cx, cy, s, ink) {
  const S = s.size
  const half = S / 2
  const x0 = cx - half
  const y0 = cy - half

  ctx.strokeStyle = ink
  // 外粗框
  const w1 = Math.max(6, S * 0.02)
  ctx.lineWidth = w1
  const inset1 = w1 / 2 + 2
  ctx.strokeRect(x0 + inset1, y0 + inset1, S - 2 * inset1, S - 2 * inset1)
  // 内细框
  const w2 = Math.max(1.6, S * 0.006)
  const inset2 = S * 0.055
  ctx.lineWidth = w2
  ctx.strokeRect(x0 + inset2, y0 + inset2, S - 2 * inset2, S - 2 * inset2)

  // 回字纹（可选）：沿内外框之间的带子均匀布小回格
  if (s.showMeander) {
    const bandC = S * 0.09
    const tile = S * 0.052
    const gap = S * 0.02
    const span = S - 2 * bandC
    const offs = meanderSideOffsets(span, tile, gap)
    ctx.lineWidth = Math.max(1.4, S * 0.0045)
    const drawTile = (tx, ty) => {
      ctx.strokeRect(tx - tile / 2, ty - tile / 2, tile, tile)
      const inner = tile * 0.45
      ctx.strokeRect(tx - inner / 2, ty - inner / 2, inner, inner)
    }
    for (const o of offs) {
      const px = x0 + bandC + o
      drawTile(px, y0 + bandC)
      drawTile(px, y0 + S - bandC)
      const py = y0 + bandC + o
      drawTile(x0 + bandC, py)
      drawTile(x0 + S - bandC, py)
    }
  }

  // 单字居中 / 双字竖排（最多取前两个汉字）
  const chars = Array.from(String(s.name || '').trim()).slice(0, 2)
  if (!chars.length) return
  ctx.fillStyle = ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (chars.length === 1) {
    const fontSize = Math.min(S * 0.5 * s.fontScale, S * 0.62)
    ctx.font = `700 ${fontSize}px ${SERIF_FONT}`
    ctx.fillText(chars[0], cx, cy + fontSize * 0.03)
  } else {
    const fontSize = Math.min(S * 0.3 * s.fontScale, S * 0.39)
    ctx.font = `700 ${fontSize}px ${SERIF_FONT}`
    ctx.fillText(chars[0], cx, cy - fontSize * 0.56)
    ctx.fillText(chars[1], cx, cy + fontSize * 0.56)
  }
}

// 做旧随机采样：轮廓缺口点 / 内部散点（按章型取形状）
function outlinePointOf(state, rnd) {
  const R = state.size / 2
  if (state.sealType === 'circle') {
    const t = rnd() * Math.PI * 2
    const r = R - 4
    return { x: r * Math.cos(t), y: r * Math.sin(t) }
  }
  if (state.sealType === 'ellipse') {
    const t = rnd() * Math.PI * 2
    return { x: (R - 4) * Math.cos(t), y: (state.size * 0.3 - 4) * Math.sin(t) }
  }
  return squarePerimeterPoint(rnd, R - 6)
}

function interiorPointOf(state, rnd) {
  const R = state.size / 2
  const t = rnd() * Math.PI * 2
  const k = Math.sqrt(rnd())
  if (state.sealType === 'circle') {
    const r = (R - R * 0.12) * k
    return { x: r * Math.cos(t), y: r * Math.sin(t) }
  }
  if (state.sealType === 'ellipse') {
    return { x: (R - 14) * k * Math.cos(t), y: (state.size * 0.3 - 12) * k * Math.sin(t) }
  }
  const h = R - 26
  return { x: (rnd() * 2 - 1) * h, y: (rnd() * 2 - 1) * h }
}

// 边缘做旧：destination-out 擦除轮廓缺口 + 内部散点 + 短划痕（种子确定，可复现）
function applyAging(ctx, state) {
  const rnd = mulberry32(state.seed)
  const cx = CANVAS_SIZE / 2
  const cy = CANVAS_SIZE / 2
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = '#000'
  ctx.strokeStyle = '#000'
  // 轮廓缺口：集中在外框 / 外环上，模拟盖印时边缘印泥脱落
  for (let i = 0; i < 46; i++) {
    const p = outlinePointOf(state, rnd)
    ctx.globalAlpha = 0.45 + rnd() * 0.5
    ctx.beginPath()
    ctx.arc(cx + p.x, cy + p.y, 1 + rnd() * 4.2, 0, Math.PI * 2)
    ctx.fill()
  }
  // 内部散点：印泥不匀的细小透点
  for (let i = 0; i < 110; i++) {
    const p = interiorPointOf(state, rnd)
    ctx.globalAlpha = 0.12 + rnd() * 0.4
    ctx.beginPath()
    ctx.arc(cx + p.x, cy + p.y, 0.5 + rnd() * 1.7, 0, Math.PI * 2)
    ctx.fill()
  }
  // 短划痕：轻微擦痕
  for (let i = 0; i < 10; i++) {
    const p = interiorPointOf(state, rnd)
    const ang = rnd() * Math.PI * 2
    const len = 6 + rnd() * 18
    ctx.globalAlpha = 0.12 + rnd() * 0.3
    ctx.lineWidth = 0.8 + rnd() * 1.4
    ctx.beginPath()
    ctx.moveTo(cx + p.x, cy + p.y)
    ctx.lineTo(cx + p.x + Math.cos(ang) * len, cy + p.y + Math.sin(ang) * len)
    ctx.stroke()
  }
  ctx.restore()
}

// 印章总绘制入口：先按章型绘制，再按需叠加做旧
function drawSeal(ctx, state) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  const cx = CANVAS_SIZE / 2
  const cy = CANVAS_SIZE / 2
  const ink = safeInk(state.color)
  if (state.sealType === 'circle') drawCircleSeal(ctx, cx, cy, state, ink)
  else if (state.sealType === 'ellipse') drawEllipseSeal(ctx, cx, cy, state, ink)
  else drawSquareSeal(ctx, cx, cy, state, ink)
  if (state.aging) applyAging(ctx, state)
}

// 预览渲染：画布固定 512×512（预览与导出比例一致）
function renderPreview() {
  const canvas = previewCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  drawSeal(ctx, buildDrawState())
}

// ---------- 输入防抖重绘 ----------
let redrawTimer = null
function scheduleRedraw() {
  if (redrawTimer) clearTimeout(redrawTimer)
  redrawTimer = setTimeout(() => {
    redrawTimer = null
    renderPreview()
  }, 120)
}

watch(
  [sealType, sealName, sealCode, showStar, showCode, showMeander, sealSize, fontScale, inkColor, aging, agingSeed],
  scheduleRedraw
)

// ---------- 示例与重置 ----------
function loadSample() {
  const s = SAMPLES[sealType.value] || SAMPLES.circle
  sealName.value = s.name
  if (sealType.value !== 'square') {
    sealCode.value = s.code
    showCode.value = true
  }
  showStar.value = sealType.value === 'circle'
  showMeander.value = true
  inkColor.value = '#d40000'
  aging.value = true
  sealSize.value = 430
  fontScale.value = 1
  exportStatus.value = ''
  copyStatus.value = ''
  renderPreview()
}

function resetAll() {
  sealType.value = STORAGE_DEFAULTS.sealType
  sealName.value = STORAGE_DEFAULTS.name
  sealCode.value = STORAGE_DEFAULTS.code
  showStar.value = true
  showCode.value = true
  showMeander.value = true
  sealSize.value = 430
  fontScale.value = 1
  inkColor.value = '#d40000'
  aging.value = true
  agingSalt.value = 0
  exportStatus.value = ''
  copyStatus.value = ''
  renderPreview()
}

// ---------- 导出透明底 PNG（toDataURL → a[download]，2 倍尺寸高清输出） ----------
const EXPORT_SCALE = 2

function exportPng() {
  const temp = document.createElement('canvas')
  temp.width = CANVAS_SIZE * EXPORT_SCALE
  temp.height = CANVAS_SIZE * EXPORT_SCALE
  const ctx = temp.getContext('2d')
  if (!ctx) {
    alert('当前浏览器不支持 Canvas 导出，请更换浏览器后重试')
    return
  }
  ctx.setTransform(EXPORT_SCALE, 0, 0, EXPORT_SCALE, 0, 0)
  drawSeal(ctx, buildDrawState())

  const dataUrl = canvasToPngDataUrl(temp)
  if (!isPngDataUrl(dataUrl)) {
    alert('导出失败，请重试或更换浏览器')
    return
  }
  const filename = exportFilename(sealType.value)
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  exportStatus.value = `已导出 ${filename}（${CANVAS_SIZE * EXPORT_SCALE}×${CANVAS_SIZE * EXPORT_SCALE}px 透明底 PNG）`
}

// ---------- 复制到剪贴板（ClipboardItem，失败回退 alert 提示） ----------
async function copyPng() {
  const temp = document.createElement('canvas')
  temp.width = CANVAS_SIZE
  temp.height = CANVAS_SIZE
  const ctx = temp.getContext('2d')
  if (!ctx) {
    alert('当前浏览器不支持剪贴板复制，请使用「下载透明底 PNG」')
    return
  }
  drawSeal(ctx, buildDrawState())
  let ok = false
  try {
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined' && typeof temp.toBlob === 'function') {
      const blob = await new Promise((resolve) => {
        try {
          temp.toBlob((b) => resolve(b), 'image/png')
        } catch (e) {
          resolve(null)
        }
      })
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        ok = true
      }
    }
  } catch (e) {
    ok = false
  }
  if (ok) {
    copyStatus.value = '已复制到剪贴板，可在支持图片粘贴的编辑器中直接粘贴'
    setTimeout(() => { copyStatus.value = '' }, 2500)
  } else {
    alert('复制失败：当前浏览器或环境不支持图片剪贴板，请使用「下载透明底 PNG」')
  }
}

// ---------- 生命周期（canvas 绘制仅在挂载后进行，SSR 安全） ----------
onMounted(() => {
  renderPreview()
  addRecentTool('seal-maker-online')
})

onBeforeUnmount(() => {
  if (redrawTimer) {
    clearTimeout(redrawTimer)
    redrawTimer = null
  }
})
</script>

<style scoped>
/* 透明棋盘格底：conic-gradient 四象限灰格，深浅色主题下均可见；canvas 本身保持透明导出 */
.checker-bg {
  background-image: conic-gradient(
    rgba(128, 128, 128, 0.22) 0 25%,
    transparent 0 50%,
    rgba(128, 128, 128, 0.22) 0 75%,
    transparent 0
  );
  background-size: 20px 20px;
}
</style>
