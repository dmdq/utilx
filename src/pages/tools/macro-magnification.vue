<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Camera class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">微距放大率计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按镜头焦距、最近对焦距离与延长筒量计算放大率、取景实物宽度、有效光圈与曝光补偿 EV 增量</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线微距放大率计算工具：输入镜头标称焦距、镜头手册口径的最近对焦距离 MFD（传感器平面到物体）与延长筒 / 皮腔延长量，
        即时给出放大率 m（含 1:1、1:2 比值表示）、全画幅 36mm 宽传感器下的取景实物宽度、
        有效光圈 f/N×(1+m) 与需要补偿的曝光 EV 增量。拍摄花草、昆虫、首饰、翻拍前先算清「能拍多大、会暗几档」，
        结果全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <div class="flex items-start gap-2 mb-6 p-3 rounded-lg bg-muted/60 border border-border text-xs leading-relaxed text-muted-foreground">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>计算口径：MFD 按镜头手册 = 传感器平面到物体的总距离；近似把传感器到镜头主平面的光程记为 f+e，则物距 u = MFD − f − e，放大率 m = (f+e)/(MFD−f−e)。实际镜头内对焦时主平面会移动，结果用于拍摄决策参考。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Camera class="w-5 h-5 mr-2 text-primary" /> 镜头参数
        </h2>

        <!-- 常见镜头预设 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">常见镜头预设</p>
          <div class="space-y-2">
            <button
              v-for="p in LENS_PRESETS"
              :key="p.id"
              type="button"
              @click="applyPreset(p)"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-left transition"
            >
              <Play class="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span class="text-xs text-foreground">{{ p.label }}</span>
            </button>
          </div>
        </div>

        <!-- 焦距 -->
        <div>
          <label for="macro-focal" class="block text-sm font-medium text-foreground mb-1.5">镜头标称焦距 f（mm）</label>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <button
              v-for="f in FOCAL_CHIPS"
              :key="f"
              type="button"
              @click="focalInput = f"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="focal === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >
              {{ f }}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <input id="macro-focal" v-model.number="focalInput" type="number" step="1" min="8" max="400" class="w-28 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <span class="text-xs text-muted-foreground">mm（8 ~ 400）</span>
          </div>
        </div>

        <!-- MFD -->
        <div>
          <label for="macro-mfd" class="block text-sm font-medium text-foreground mb-1.5">最近对焦距离 MFD（镜头手册口径：传感器到物体）</label>
          <div class="flex items-center gap-2">
            <input id="macro-mfd" v-model.number="mfdInput" type="number" step="1" min="10" class="flex-1 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <div class="flex rounded-lg border border-border overflow-hidden">
              <button type="button" @click="mfdUnit = 'mm'" class="px-3 py-1.5 text-xs font-medium" :class="mfdUnit === 'mm' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'">mm</button>
              <button type="button" @click="mfdUnit = 'cm'" class="px-3 py-1.5 text-xs font-medium" :class="mfdUnit === 'cm' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'">cm</button>
              <button type="button" @click="mfdUnit = 'm'" class="px-3 py-1.5 text-xs font-medium" :class="mfdUnit === 'm' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'">m</button>
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">如手册标 0.45m / 23cm，切到对应单位输入即可；本工具统一换算为 mm 计算。</p>
        </div>

        <!-- 延长量 -->
        <div>
          <label for="macro-ext" class="block text-sm font-medium text-foreground mb-1.5">延长筒 / 皮腔延长量 e（mm）</label>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <button
              v-for="e in EXT_CHIPS"
              :key="e"
              type="button"
              @click="extInput = e"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="ext === e ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >
              {{ e === 0 ? '无' : e }}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <input id="macro-ext" v-model.number="extInput" type="number" step="1" min="0" max="300" class="w-28 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <span class="text-xs text-muted-foreground">mm（默认 0，常见单节 10/12/16/25/36）</span>
          </div>
        </div>

        <!-- 镜身长度 -->
        <div>
          <label for="macro-body" class="block text-sm font-medium text-foreground mb-1.5">镜身长度（mm，用于工作距离估算）</label>
          <div class="flex items-center gap-2">
            <input id="macro-body" v-model.number="bodyInput" type="number" step="1" min="0" max="500" class="w-28 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <span class="text-xs text-muted-foreground">mm（默认 0；含遮光罩可加 50~80）</span>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">工作距离 = MFD − f − e − 镜身长度；打昆虫、拍首饰前用它确认净空够不够。</p>
        </div>

        <!-- 光圈 -->
        <div>
          <label for="macro-aperture" class="block text-sm font-medium text-foreground mb-1.5">当前光圈 f 档（用于有效光圈换算）</label>
          <select id="macro-aperture" v-model="apertureChoice" class="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option v-for="a in APERTURE_CHOICES" :key="a" :value="String(a)">f/{{ a }}</option>
            <option value="__custom">自定义…</option>
          </select>
          <div v-if="apertureChoice === '__custom'" class="flex items-center gap-2 mt-2">
            <input v-model.number="apertureCustom" type="number" step="0.1" min="0.7" max="64" class="w-28 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <span class="text-xs text-muted-foreground">f/（0.7 ~ 64）</span>
          </div>
        </div>

        <button type="button" @click="resetAll" class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition">
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认参数
        </button>

        <div v-if="validationIssues.length" class="space-y-1.5">
          <p v-for="issue in validationIssues" :key="issue" class="text-xs leading-relaxed p-2 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ issue }}</span>
          </p>
        </div>
      </div>

      <!-- 右：结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 结果卡 -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-card border border-primary/40 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">放大率</p>
            <p class="text-2xl lg:text-3xl font-bold text-primary font-mono">{{ magnificationText }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">比值 {{ ratioText }}</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">取景实物宽度</p>
            <p class="text-xl lg:text-2xl font-bold text-foreground font-mono break-all">{{ fieldWidthText }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">全幅 36mm 宽传感器口径</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">有效光圈</p>
            <p class="text-xl lg:text-2xl font-bold text-foreground font-mono break-all">{{ effectiveApertureText }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">标称 f/{{ aperture }} · {{ ext > 0 ? '含延长近似' : 'N×(1+m)' }}</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">曝光补偿</p>
            <p class="text-xl lg:text-2xl font-bold text-foreground font-mono">{{ evLossText }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">快门放慢 {{ shutterFactorText }} 倍</p>
          </div>
        </div>

        <!-- 明细卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 距离与光路明细
          </h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">物距近似 u = MFD − f − e</span>
              <span class="font-semibold text-foreground font-mono">{{ objectDistanceText }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">工作距离（物体到镜前端，近似）</span>
              <span class="font-semibold text-foreground font-mono">{{ workingDistanceText }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">取景实物高度（全幅 24mm 高口径）</span>
              <span class="font-semibold text-foreground font-mono">{{ fieldHeightText }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">进光损失倍数 (1+m)<sup>2</sup></span>
              <span class="font-semibold text-foreground font-mono">{{ lightFactorText }}</span>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            工作距离 = 物距近似 u 减去镜身机械长度（对焦距离 vs 工作距离的区别见下方说明）。
            提示：放大率 ≥ 0.1× 即进入微距范畴；1:1 表示传感器上成像尺寸与实物等大。
          </p>
        </div>

        <!-- 常见倍率注记表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Images class="w-5 h-5 mr-2 text-primary" /> 常见倍率注记与实景尺寸对照
          </h2>
          <p class="text-xs text-muted-foreground mb-3">以全画幅 36mm 宽传感器为例；有效光圈以标称 f/{{ aperture }} 为基准换算（无延长口径 N×(1+m)）。</p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th class="text-left px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">倍率</th>
                  <th class="text-center px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">放大率 m</th>
                  <th class="text-center px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">全幅取景宽度</th>
                  <th class="text-center px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">典型被摄体</th>
                  <th class="text-center px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">有效光圈</th>
                  <th class="text-center px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">EV 损失</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in magnificationTable" :key="row.ratio" :class="row.active ? 'bg-primary/10' : ''">
                  <td class="px-2 py-1.5 font-semibold" :class="row.active ? 'text-primary' : 'text-foreground'">{{ row.ratio }}</td>
                  <td class="px-2 py-1.5 text-center font-mono text-foreground">{{ row.m }}</td>
                  <td class="px-2 py-1.5 text-center font-mono text-foreground">{{ row.width }}</td>
                  <td class="px-2 py-1.5 text-center text-muted-foreground text-xs">{{ row.subject }}</td>
                  <td class="px-2 py-1.5 text-center font-mono text-foreground">{{ row.nEff }}</td>
                  <td class="px-2 py-1.5 text-center font-mono text-foreground">{{ row.ev }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>微距放大率是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          放大率（magnification）m 定义为「传感器上成像的大小 ÷ 实物实际大小」。m=0.5（即 1:2）表示物体的一半大小被记录在传感器上；
          m=1（即 1:1）表示成像与实物等大——36mm 宽的全画幅传感器在 1:1 时恰好拍满 36mm 宽的物体，比如一枚戒指或一只大型甲虫。
          m<1 时用 1:N 表示（1:3 即 m≈0.333，成片上物体是实物的三分之一）；m>1（如 2:1、5:1）属于超微距范围，通常需要延长筒、皮腔或反接环辅助。
          本工具按近似口径 m = (f+e)/(MFD−f−e) 计算：镜头手册的最近对焦距离 MFD 从传感器平面（∞ 符号刻线）量起，包含镜筒长度；
          把传感器到镜头主平面的光程近似为 f+e 后，物距 u = MFD−f−e，放大率 = 像距/物距。无延长时该口径退化为通用公式 m ≈ f/(MFD−f)。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么微距会变暗？——有效光圈与曝光补偿</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          微距放大时，同一束光要铺在更大的成像面积上，像面亮度按 (1+m)² 衰减，等效于光圈收小：有效光圈 N<sub>eff</sub> = N×(1+m)。
          比如 f/2.8 在 1:1 时实际进光只有 f/5.6 的水平，需要补偿 log₂((1+m)²) = +2EV——要么放慢两档快门，要么开大两档光圈，要么加两档 ISO。
          加延长筒后进光进一步下降，本工具按近似口径 N<sub>eff</sub> ≈ N×(1+m+e/f) 换算（近似值，未计入瞳放大率修正，实拍以直方图为准）。
          手持微距最常见的翻车原因就是只看机身里显示的 f/2.8，忘了有效光圈已经收窄，快门速度不够导致糊片。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">微距的景深为什么极浅？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          景深随放大率急剧收窄：高倍率下总景深近似正比于 N·c/m²（N 是光圈、c 是弥散圈、m 是放大率），m 翻倍景深大约只剩四分之一。
          1:1 时即使用 f/11，全画幅的清晰层也可能只有 2mm 上下，风一吹花一晃就出片外。
          所以微距实拍常用三个办法：尽量收小光圈（注意衍射上限）、提高 ISO 换更快快门、或者上脚架做焦点包围 —— 前后多张景深合成。
          具体的近点、远点和总景深数字，可以用站内的
          <NuxtLink to="/tools/depth-of-field-calculator" class="text-primary hover:underline">景深超焦距计算器</NuxtLink>
          按画幅与光圈精算，两个工具配合使用即可覆盖微距拍摄的全部参数决策。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">对焦距离 vs 工作距离：差在哪里？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          对焦距离（MFD）是镜头手册标注的「传感器平面到物体」的总距离，包含了整支镜筒的长度；
          工作距离（working distance）则是「镜筒最前端到物体」的净空，才是打昆虫、拍首饰时真正决定会不会顶到被摄体的数字。
          两者差距约等于镜身长度：一支 100mm 微距头在 1:1 时镜身加遮光罩可能占掉 15~20cm，MFD 标 0.31m，实际工作距离可能只剩 10cm 上下。
          本工具按 MFD − f − e 估算工作距离（未计镜身机械长度，取值偏乐观），拍摄活体昆虫请预留至少一支遮光罩深度的余量；
          嫌工作距离不够时，与其加延长筒（进一步吃掉净空），不如换更长焦距的微距镜头。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么我加了两节延长筒，取景器里还是不够大？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              延长筒带来的放大率增益约为 e/f：50mm 镜头加 25mm 筒约多 0.5×，但 100mm 镜头加同样的筒只多 0.25×。
              长焦镜头需要更大的延长量才能显著提升倍率；先在本工具里算出理论 m，再决定要不要继续加筒或改用皮腔。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">有效光圈会影响画质和背景虚化吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              衍射按有效光圈计算：标称 f/8 在 1:1 时的衍射相当于 f/16，所以微距不建议收到太小的标称光圈。
              但背景虚化仍按标称光圈与光学结构决定——这正是「微距景深极浅但焦外未必奶油」的原因。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">MFD 输 200mm、f 输 50，算出 0.333 和实拍不符怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              本口径是理想的薄透镜近似：实际镜头内对焦时主平面随对焦移动、不同镜头结构差异很大，同一标注 MFD 的实拍放大率可能略有出入。
              若镜头厂商公布了最大放大率（如 0.5×），可用它校准：以实拍标定为准，把本工具结果当数量级参考。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算会上传我的镜头参数吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不会。放大率、有效光圈与曝光补偿全部在你的浏览器内即时算出，无网络请求；参数仅保存在本机 localStorage 供下次访问恢复。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'macro-magnification'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Camera, Images, Ruler, Play, RefreshCw, TriangleAlert,
  ChevronUp, ChevronDown, Info
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '微距放大率计算器 - 有效光圈与曝光补偿换算',
  description: '免费在线微距放大率计算：输入焦距、最近对焦距离 MFD 与延长筒量，按薄透镜口径算放大率 1:1、全幅取景实物宽度、有效光圈 N×(1+m) 与曝光补偿 EV 增量，附 1:1/1:2 常见倍率注记表，纯浏览器本地计算不上传',
  keywords: '微距放大率计算,有效光圈,曝光补偿,延长筒放大率,近摄影计算,1:1微距',
  author: '有条工具',
  ogTitle: '微距放大率计算器 - 有效光圈与曝光补偿换算 | 有条工具',
  ogDescription: '输入焦距、MFD 与延长量，即时算出放大率、取景实物宽度、有效光圈与曝光补偿 EV。',
  ogUrl: 'https://www.util.cn/tools/macro-magnification',
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
          name: '微距放大率计算器',
          url: 'https://www.util.cn/tools/macro-magnification',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['放大率 m 与 1:1/1:2 比值换算', '延长筒/皮腔延长量计算', '全幅取景实物宽度对照', '有效光圈 N×(1+m) 与 EV 补偿', '常见倍率注记表', '常见镜头预设', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '微距放大率计算器', item: 'https://www.util.cn/tools/macro-magnification' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么微距会变暗？',
              acceptedAnswer: { '@type': 'Answer', text: '微距放大时像面亮度按 (1+m)² 衰减，等效光圈收窄：有效光圈 = N×(1+m)。f/2.8 在 1:1 时相当于 f/5.6 的进光，需补偿 +2EV；加延长筒后按近似口径 N×(1+m+e/f) 进一步收窄。' }
            },
            {
              '@type': 'Question',
              name: '微距的景深为什么极浅？',
              acceptedAnswer: { '@type': 'Answer', text: '总景深近似正比于 N·c/m²，放大率翻倍景深约剩四分之一；1:1 时即使用 f/11 清晰层也只有毫米级，建议收小光圈、焦点包围或景深合成。' }
            },
            {
              '@type': 'Question',
              name: '对焦距离和工作距离有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '对焦距离 MFD 从传感器平面量到物体，包含镜筒长度；工作距离是镜筒最前端到物体的净空，两者相差约一个镜身长度。打昆虫、拍首饰时真正受限的是工作距离。' }
            },
            {
              '@type': 'Question',
              name: '计算结果会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。放大率、有效光圈与曝光补偿全部在浏览器内即时算出，无网络请求；参数仅保存在本机 localStorage 供下次访问恢复。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯函数（可独立单测） ----------
// 口径说明：MFD 按镜头手册 = 传感器平面到物体的总距离。
// 近似口径：把传感器到镜头主平面的光程记为 f+e，则物距 u = MFD−f−e，
// 放大率 m = 像距/物距 = (f+e)/(MFD−f−e)；e=0 时退化为通用口径 m ≈ f/(MFD−f)。
// 有效光圈：无延长 N(1+m)；有延长 N(1+m+e/f)（近似口径，未计瞳放大率修正）。
// EV 增量 = log₂((N_eff/N)²) = 2·log₂(N_eff/N)。

function clampNum(v, lo, hi) {
  const n = Number(v)
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, n))
}

function fmtOf(v, d = 2) {
  return Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—'
}

// 放大率 m（近似口径）；MFD ≤ f+e 时无解返回 Infinity
function magnificationOf(fMm, mfdMm, extMm) {
  const denom = mfdMm - fMm - extMm
  if (!(denom > 0)) return Infinity
  return (fMm + extMm) / denom
}

// 有效光圈：无延长 N(1+m)（薄透镜精确口径）；有延长 N(1+m+e/f)（近似口径）
function effectiveApertureOf(N, m, fMm, extMm) {
  if (!(N > 0) || !Number.isFinite(m)) return NaN
  return extMm > 0 ? N * (1 + m + extMm / fMm) : N * (1 + m)
}

// EV 增量 = 2·log₂(N_eff/N)
function evLossOf(N, nEff) {
  if (!(N > 0) || !Number.isFinite(nEff) || nEff <= 0) return NaN
  return 2 * Math.log2(nEff / N)
}

// 全幅（宽 W mm）传感器在放大率 m 下能拍下的实物宽度；m 无效时为 Infinity
function fieldWidthMm(sensorWidthMm, m) {
  if (!Number.isFinite(m) || m <= 0) return Infinity
  return sensorWidthMm / m
}

// 倍率比值文本：m ≥ 1 → "2:1"；m < 1 → "1:3"
function ratioTextOf(m) {
  if (!Number.isFinite(m) || m <= 0) return '—'
  return m >= 1 ? `${fmtOf(m, 2)}:1` : `1:${fmtOf(1 / m, 2)}`
}

// 工作距离近似 = MFD − f − e − 镜身机械长度；无解为负
function workingDistanceOf(mfdMm, fMm, extMm, bodyMm) {
  return mfdMm - fMm - extMm - (bodyMm || 0)
}

// ---------- 常量 ----------
const FOCAL_CHIPS = [35, 50, 60, 90, 100, 105, 180]
const EXT_CHIPS = [0, 10, 12, 16, 20, 25, 36, 48]
const APERTURE_CHOICES = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16]
const LENS_PRESETS = [
  { id: 'p50macro', label: '50mm 微距 · MFD 200mm（约 0.33×）', f: 50, mfdMm: 200, e: 0 },
  { id: 'p60macro', label: '60mm 微距 · MFD 200mm（约 0.43×）', f: 60, mfdMm: 200, e: 0 },
  { id: 'p100macro', label: '100mm 微距 · MFD 310mm（约 0.48×）', f: 100, mfdMm: 310, e: 0 },
  { id: 'p50tube', label: '50mm 普通头 · MFD 450mm + 25mm 延长筒', f: 50, mfdMm: 450, e: 25 }
]
// 常见倍率注记（m、典型被摄体）；有效光圈与 EV 按当前光圈动态换算
const MAG_TABLE_ROWS = [
  { ratio: '1:5', m: 0.2, subject: '手表表盘、电路板' },
  { ratio: '1:3', m: 1 / 3, subject: '首饰、小型花朵' },
  { ratio: '1:2', m: 0.5, subject: '蝴蝶翅斑、硬币' },
  { ratio: '1:1', m: 1, subject: '戒指、大型甲虫' },
  { ratio: '2:1', m: 2, subject: '跳蛛眼部（超微距）' }
]

// ---------- 响应式参数 ----------
const TOOL_ID = 'macro-magnification'
const focalInput = ref(50)
const mfdInput = ref(200)
const mfdUnit = ref('mm')
const extInput = ref(0)
const bodyInput = ref(0)
const apertureChoice = ref('2.8')
const apertureCustom = ref(4)
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const focal = computed(() => clampNum(focalInput.value, 8, 400))
const mfdMm = computed(() => {
  const raw = Number(mfdInput.value)
  if (!Number.isFinite(raw) || raw <= 0) return NaN
  if (mfdUnit.value === 'mm') return raw
  if (mfdUnit.value === 'cm') return raw * 10
  return raw * 1000
})
const ext = computed(() => clampNum(extInput.value, 0, 300))
const body = computed(() => clampNum(bodyInput.value, 0, 500))
const aperture = computed(() => (apertureChoice.value === '__custom'
  ? clampNum(apertureCustom.value, 0.7, 64)
  : Number(apertureChoice.value)))

const validationIssues = computed(() => {
  const list = []
  const rawF = Number(focalInput.value)
  if (!Number.isFinite(rawF) || rawF < 8 || rawF > 400) list.push(`焦距超出 8 ~ 400mm 范围，已按 ${focal.value}mm 计算`)
  if (!Number.isFinite(mfdMm.value)) list.push('最近对焦距离无效，请输入正数')
  else if (mfdMm.value <= focal.value + ext.value) list.push(`MFD 必须大于 f+e = ${fmtOf(focal.value + ext.value, 0)}mm（本口径下才有物距），当前无解`)
  else if (magnification.value > 2) list.push('放大率超过 2:1，已超出多数微距镜头规格；请核对 MFD 与延长量口径（手册 MFD 含镜筒长度）')
  return list
})

// ---------- 计算结果 ----------
const magnification = computed(() => magnificationOf(focal.value, mfdMm.value, ext.value))
const nEff = computed(() => effectiveApertureOf(aperture.value, magnification.value, focal.value, ext.value))
const evLoss = computed(() => evLossOf(aperture.value, nEff.value))
const fieldW = computed(() => fieldWidthMm(36, magnification.value))
const fieldH = computed(() => fieldWidthMm(24, magnification.value))
const objectDist = computed(() => (hasSolution.value ? workingDistanceOf(mfdMm.value, focal.value, ext.value, 0) : NaN))
const workDist = computed(() => workingDistanceOf(mfdMm.value, focal.value, ext.value, body.value))

const hasSolution = computed(() => Number.isFinite(mfdMm.value) && mfdMm.value > focal.value + ext.value)

const magnificationText = computed(() => (hasSolution.value && Number.isFinite(magnification.value) ? `${fmtOf(magnification.value, 3)}×` : '—'))
const ratioText = computed(() => (hasSolution.value ? ratioTextOf(magnification.value) : '—'))
const fieldWidthText = computed(() => (hasSolution.value && Number.isFinite(fieldW.value) ? `${fmtOf(fieldW.value, 1)} mm` : '—'))
const fieldHeightText = computed(() => (hasSolution.value && Number.isFinite(fieldH.value) ? `${fmtOf(fieldH.value, 1)} mm` : '—'))
const effectiveApertureText = computed(() => (Number.isFinite(nEff.value) ? `f/${fmtOf(nEff.value, 2)}` : '—'))
const evLossText = computed(() => (Number.isFinite(evLoss.value) ? `+${fmtOf(evLoss.value, 2)} EV` : '—'))
const shutterFactorText = computed(() => (Number.isFinite(evLoss.value) ? fmtOf(Math.pow(2, evLoss.value), 2) : '—'))
const lightFactorText = computed(() => (hasSolution.value && Number.isFinite(magnification.value) ? fmtOf(Math.pow(1 + magnification.value, 2), 2) : '—'))
const objectDistanceText = computed(() => (hasSolution.value ? `${fmtOf(objectDist.value, 1)} mm` : '—'))
const workingDistanceText = computed(() => (hasSolution.value ? `${fmtOf(workDist.value, 1)} mm${body.value > 0 ? '' : '（未计镜身）'}` : '—'))

// 常见倍率注记表：有效光圈按无延长口径 N(1+m) 动态换算
const magnificationTable = computed(() => MAG_TABLE_ROWS.map((row) => {
  const m = row.m
  const ne = effectiveApertureOf(aperture.value, m, focal.value, 0)
  const ev = evLossOf(aperture.value, ne)
  const near = Math.abs(Math.log(magnification.value) - Math.log(m)) < 0.05
  return {
    ...row,
    width: `${fmtOf(fieldWidthMm(36, m), 0)} mm`,
    nEff: Number.isFinite(ne) ? `f/${fmtOf(ne, 2)}` : '—',
    ev: Number.isFinite(ev) ? `+${fmtOf(ev, 2)}` : '—',
    active: near
  }
}))

// ---------- 交互动作 ----------
function applyPreset(p) {
  focalInput.value = p.f
  mfdUnit.value = 'mm'
  mfdInput.value = p.mfdMm
  extInput.value = p.e
}

function resetAll() {
  focalInput.value = 50
  mfdUnit.value = 'mm'
  mfdInput.value = 200
  extInput.value = 0
  bodyInput.value = 0
  apertureChoice.value = '2.8'
  apertureCustom.value = 4
}

// ---------- 设置持久化（localStorage，键前缀用工具 id） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(`${TOOL_ID}-settings`)
    if (!saved) return
    const s = JSON.parse(saved)
    if (Number.isFinite(s.focal) && s.focal >= 8 && s.focal <= 400) focalInput.value = s.focal
    if (Number.isFinite(s.mfd) && s.mfd > 0) { mfdInput.value = s.mfd; mfdUnit.value = 'mm' }
    if (['mm', 'cm', 'm'].includes(s.mfdUnit) && Number.isFinite(s.mfdRaw)) {
      mfdUnit.value = s.mfdUnit
      mfdInput.value = s.mfdRaw
    }
    if (Number.isFinite(s.ext) && s.ext >= 0 && s.ext <= 300) extInput.value = s.ext
    if (Number.isFinite(s.body) && s.body >= 0 && s.body <= 500) bodyInput.value = s.body
    if (typeof s.apertureChoice === 'string' && (s.apertureChoice === '__custom' || APERTURE_CHOICES.map(String).includes(s.apertureChoice))) apertureChoice.value = s.apertureChoice
    if (Number.isFinite(s.apertureCustom)) apertureCustom.value = s.apertureCustom
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([focalInput, mfdInput, mfdUnit, extInput, bodyInput, apertureChoice, apertureCustom], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(`${TOOL_ID}-settings`, JSON.stringify({
      focal: focalInput.value,
      mfd: mfdMm.value,
      mfdRaw: mfdInput.value,
      mfdUnit: mfdUnit.value,
      ext: extInput.value,
      body: bodyInput.value,
      apertureChoice: apertureChoice.value,
      apertureCustom: apertureCustom.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})
</script>
