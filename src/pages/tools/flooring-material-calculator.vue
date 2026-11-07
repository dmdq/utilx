<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <LayoutGrid class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">地板用量计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">房间面积 × 损耗率 → 理论片数、含损耗片数与整箱包数，强化复合 / 实木规格对照</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线地板用量计算器：铺木地板前算清「到底买几包」。支持多房间累加（可加行）、
        强化复合 1215×195 / 1285×195 与实木 910×122 等常见规格预设及自定义单片长宽，
        按正铺 5% / 斜铺 7% / 人字拼 10% ~ 15% 的通行损耗率口径，输出总面积、理论片数、含损耗片数（向上取整）、
        整箱包数、实际到货面积与余料提示（剩几片可用于小空间），并附铺贴方向提示卡。全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <LayoutGrid class="w-5 h-5 mr-2 text-primary" /> 房间与地板参数
        </h2>

        <!-- 房间列表 -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-sm font-medium text-foreground">房间尺寸（长 × 宽，米）</label>
            <button
              type="button"
              @click="addRoom"
              class="px-2.5 py-1 rounded-md border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary transition"
            >
              <Plus class="w-3.5 h-3.5 inline mr-0.5 -mt-0.5" /> 加一行
            </button>
          </div>
          <div class="space-y-2">
            <div v-for="(room, index) in rooms" :key="index" class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground w-10 flex-shrink-0">房间{{ index + 1 }}</span>
              <input
                v-model.number="room.l"
                type="number"
                min="0.1"
                step="0.1"
                aria-label="房间长度"
                class="flex-1 min-w-0 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span class="text-muted-foreground text-sm">×</span>
              <input
                v-model.number="room.w"
                type="number"
                min="0.1"
                step="0.1"
                aria-label="房间宽度"
                class="flex-1 min-w-0 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span class="text-xs text-muted-foreground w-12 text-right font-mono flex-shrink-0">{{ roomArea(room) }} ㎡</span>
              <button
                v-if="rooms.length > 1"
                type="button"
                @click="removeRoom(index)"
                class="p-1.5 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                aria-label="删除该房间"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- 地板规格 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">地板规格（单片，mm）</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="p in PLANK_PRESETS"
              :key="p.id"
              type="button"
              @click="applyPlank(p)"
              class="px-3 py-1.5 rounded-md text-xs font-medium border transition"
              :class="plankChoice === p.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >{{ p.label }}</button>
          </div>
          <div v-if="isCustomPlank" class="flex items-center gap-2 mt-2">
            <input v-model.number="customPlankL" type="number" min="100" step="1" aria-label="自定义单片长度" class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <span class="text-muted-foreground text-sm">×</span>
            <input v-model.number="customPlankW" type="number" min="50" step="1" aria-label="自定义单片宽度" class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <span class="text-xs text-muted-foreground">mm</span>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">当前单片面积 <span class="font-mono text-foreground">{{ plankAreaText }} ㎡</span>；同面积下大片地板视觉延伸感更强，但损耗略高。</p>
        </div>

        <!-- 损耗率 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">铺贴方式与损耗率</label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              v-for="w in WASTE_PRESETS"
              :key="w.id"
              type="button"
              @click="wasteChoice = w.id"
              class="px-2 py-2 rounded-lg text-xs font-medium border transition text-left"
              :class="wasteChoice === w.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >
              {{ w.label }}
              <span class="block text-[10px] opacity-80 mt-0.5">{{ w.pct }}%</span>
            </button>
          </div>
          <div v-if="isCustomWaste" class="flex items-center gap-2 mt-2">
            <input v-model.number="customWaste" type="number" min="0" max="30" step="0.5" aria-label="自定义损耗率" class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <span class="text-xs text-muted-foreground">% 损耗率（0 ~ 30）</span>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">{{ activeWasteTip }}</p>
        </div>

        <!-- 每箱片数 -->
        <div>
          <label for="fl-perbox" class="block text-sm font-medium text-foreground mb-1.5">每箱片数</label>
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="n in [6, 8, 10, 12]"
              :key="'box-' + n"
              type="button"
              @click="perBox = n"
              class="px-3 py-1.5 rounded-md text-xs font-medium border transition"
              :class="perBox === n ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >{{ n }} 片/箱</button>
            <input id="fl-perbox" v-model.number="perBox" type="number" min="1" step="1" class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">强化复合常见 8 片/箱（也有 6~10），实木地板多按平方米计价；地板必须整箱购买。</p>
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
      <div class="space-y-6">
        <!-- 结果主卡 -->
        <div class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Package class="w-5 h-5 mr-2 text-primary" /> 购买建议
          </h2>
          <div v-if="result" class="space-y-3">
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span class="text-4xl lg:text-5xl font-bold text-primary font-mono">{{ result.boxes }}</span>
              <span class="text-lg text-foreground">箱</span>
              <span class="text-muted-foreground">=</span>
              <span class="text-2xl font-bold text-foreground font-mono">{{ result.pieces }}</span>
              <span class="text-sm text-muted-foreground">片（含损耗 {{ result.withWaste }} 片）</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">总面积</p>
                <p class="text-xl font-bold text-foreground font-mono">{{ result.areaText }} ㎡</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">理论片数</p>
                <p class="text-xl font-bold text-foreground font-mono">{{ result.theoryText }}</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">含损耗（{{ wastePct }}%）</p>
                <p class="text-xl font-bold text-foreground font-mono">{{ result.withWaste }} 片</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">实际到货面积</p>
                <p class="text-xl font-bold text-foreground font-mono">{{ result.realAreaText }} ㎡</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">整箱片数</p>
                <p class="text-xl font-bold text-foreground font-mono">{{ result.pieces }} 片</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">预计余料</p>
                <p class="text-xl font-bold text-foreground font-mono">{{ result.leftover }} 片</p>
              </div>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ leftoverTip }}</span>
            </p>
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              口径：理论片数 = 总面积 ÷ 单片面积；含损耗片数 = ceil(理论 × (1 + 损耗率))；包数 = ceil(含损耗片数 ÷ 每箱片数)。
              斜铺 / 人字拼等异形切割的通行损耗率区间请按现场格局上浮，页面注明「以通行经验/标准原文为准」。
            </p>
          </div>
          <p v-else class="p-8 text-center text-sm text-muted-foreground">填入房间尺寸后自动计算</p>
        </div>

        <!-- 铺贴方向提示卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Compass class="w-5 h-5 mr-2 text-primary" /> 铺贴方向提示
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">长边顺光铺</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">有窗户的房间，地板长边平行于光线进入方向（顺光），接缝阴影最不明显，视觉更平整。</p>
            </div>
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">长边顺进门方向</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">走廊、玄关等无主采光面时，长边沿进门视线方向铺，空间显得更长、动线更顺。</p>
            </div>
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">长边沿长墙</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">矩形房间按长边沿较长一面墙铺设，整板利用率最高、切割与损耗最少。</p>
            </div>
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">斜铺 / 人字拼注意</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">45° 斜铺与人字拼需要大量斜切，损耗率按 7% ~ 15% 预留，且对地面找平与安装工费要求更高。</p>
            </div>
          </div>
        </div>

        <!-- 内链 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-2">
          <p class="text-sm font-medium text-foreground">装修排期一起算窗帘？</p>
          <p class="text-xs text-muted-foreground leading-relaxed">软装阶段常同步定窗帘，用窗帘用料计算器按褶皱倍数与门幅算米数。</p>
          <NuxtLink
            to="/tools/curtain-fabric-calculator/"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/40 bg-primary/10 text-sm font-medium text-primary hover:bg-primary/20 transition"
          >
            <Blinds class="w-4 h-4" /> 用窗帘用料计算器算米数 →
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- SEO 折叠区 -->
    <details class="bg-card border border-border rounded-lg mb-12 group">
      <summary class="flex items-center justify-between cursor-pointer select-none px-6 py-4">
        <span class="text-lg font-semibold text-foreground"><span class="text-primary mr-2">#</span>地板用量与损耗率怎么算？</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div class="px-6 pb-6 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">计算公式</h3>
          <div class="bg-muted/50 rounded-xl p-4 text-sm text-foreground leading-relaxed space-y-2">
            <p><strong>总面积</strong> = Σ（各房间长 × 宽）。</p>
            <p><strong>单片面积</strong> = 单片长(mm) × 单片宽(mm) ÷ 1,000,000（㎡）。</p>
            <p><strong>理论片数</strong> = 总面积 ÷ 单片面积；<strong>含损耗片数</strong> = ceil(理论片数 × (1 + 损耗率))。</p>
            <p><strong>包数</strong> = ceil(含损耗片数 ÷ 每箱片数)；<strong>实际面积</strong> = 包数 × 每箱片数 × 单片面积。</p>
            <p><strong>余料</strong> = 包数 × 每箱片数 − 含损耗片数。</p>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">损耗率为什么必须留？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            地板按片铺设，房间边角、门洞、柱子处都要切割，切剩的部分往往用不上；错误切割、运输磕碰也要留退路。
            通行口径：正铺（对齐铺）约 <strong>5%</strong>；45° 斜铺因整排斜切约 <strong>7%</strong> 起步；
            人字拼 / 鱼骨拼因两端斜切且对缝要求高，按 <strong>10% ~ 15%</strong> 预留（施工方保守口径甚至到 20%）。
            房间格局不规则、大片地板、多转角时还要再上浮。宁可多留一片，也不要铺到最后差一片被迫补货——不同批次色差可能明显。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">木地板和瓷砖辅料有什么差异？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            木地板是「干铺悬浮 / 龙骨」体系：防潮垫（强化复合每包配套或按面积买）、踢脚线按周长米数、门口收边条按个，
            无水泥砂浆；实木地板还涉及龙骨料与地板钉。瓷砖则是湿贴体系，除砖本身还要按面积估算水泥砂浆 / 瓷砖胶与十字卡、填缝剂，
            且瓷砖同样有 5% ~ 10% 的切割损耗。两者损耗逻辑类似，但辅料清单完全不同，买材料时别按同一张清单套。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-semibold text-foreground">5×4 米的房间要买多少地板？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
                20㎡ ÷（1.215 × 0.195 = 0.236925㎡/片）≈ 84.4 片，正铺加 5% 损耗 = 88.6 → 89 片；按 8 片/箱要 12 箱共 96 片，铺完约剩 7 片可留作日后维修备料。
              </p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">余料有什么用？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
                整箱购买必然有剩，剩下的完整片可用于阳台小地台、飘窗台面、宠物垫、抽屉垫或日后局部换板；建议与发票一起保留，注明批次色号。
              </p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">实木地板怎么算？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
                实木常见 910×122mm 规格，单片约 0.111 ㎡，本页同样适用；但实木多按平方米计价、按箱或按片发货，购买前与商家确认包装规格与退整箱政策。
              </p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">计算数据会上传吗？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">不会。房间、规格与损耗率全部在浏览器内即时计算，无网络请求，不保存不上传。</p>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">口径与来源</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            损耗率正铺 5% / 斜铺 7% / 人字拼 10~15% 为国内装修行业通行经验口径（各施工方保守口径更高，海外通行甚至按直铺 10% 预留），
            页面注明「以通行经验/标准原文为准」；实际用量请结合房间格局、地板规格与安装方报价确定。
          </p>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'flooring-material-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { LayoutGrid, Plus, Trash2, Package, Compass, RefreshCw, TriangleAlert, CheckCircle, ChevronDown, Blinds } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '地板用量计算器 - 面积×损耗率算包数片数 | 有条工具',
  description: '免费在线地板用量计算器：多房间累加面积，按强化复合1215×195/1285×195、实木910×122等规格与正铺5%/斜铺7%/人字拼10-15%损耗率，算理论片数、含损耗片数、整箱包数与余料提示，附铺贴方向建议，纯浏览器本地计算不上传',
  keywords: '地板用量计算器,地板需要多少包,地板损耗率多少,木地板面积计算,地板包数换算,1215x195',
  author: '有条工具',
  ogTitle: '地板用量计算器 - 面积×损耗率算包数片数 | 有条工具',
  ogDescription: '多房间面积×损耗率，一键算地板理论片数、整箱包数与余料，附铺贴方向提示。',
  ogUrl: 'https://www.util.cn/tools/flooring-material-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '地板用量计算器',
          url: 'https://www.util.cn/tools/flooring-material-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '多房间面积累加（可增删行）',
            '强化复合 1215×195 / 1285×195、实木 910×122 预设与自定义规格',
            '正铺 5% / 斜铺 7% / 人字拼 10~15% 损耗率预设与自定义',
            '理论片数、含损耗片数（向上取整）与整箱包数',
            '实际到货面积与余料提示',
            '铺贴方向提示卡（顺光 / 顺进门 / 长墙）',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '地板用量计算器', item: 'https://www.util.cn/tools/flooring-material-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '5×4 米的房间要买多少地板？',
              acceptedAnswer: { '@type': 'Answer', text: '20㎡ ÷（1.215 × 0.195 = 0.236925㎡/片）≈ 84.4 片，正铺加 5% 损耗取整为 89 片；按 8 片/箱需 12 箱共 96 片，铺完约剩 7 片。' }
            },
            {
              '@type': 'Question',
              name: '地板损耗率一般留多少？',
              acceptedAnswer: { '@type': 'Answer', text: '通行口径：正铺约 5%，45° 斜铺约 7%，人字拼/鱼骨拼 10%~15%；格局不规则、大片地板或多转角时需上浮。' }
            },
            {
              '@type': 'Question',
              name: '地板长边应该朝哪个方向铺？',
              acceptedAnswer: { '@type': 'Answer', text: '优先长边顺光（平行于窗户光线）或顺进门视线方向，无采光参照时沿房间较长墙面，整板利用率最高、损耗最小。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 总面积 = Σ(长×宽)；单片面积 = 长mm×宽mm/1e6；
// 理论片数 = 面积/单片面积；含损耗片数 = ceil(理论×(1+损耗率))；
// 包数 = ceil(含损耗片数/每箱片数)；余料 = 包数×每箱片数 − 含损耗片数。
function flooringOf(rooms, plankLmm, plankWmm, wastePct, perBox) {
  const valid = rooms.filter((r) => Number(r.l) > 0 && Number(r.w) > 0)
  const totalArea = valid.reduce((s, r) => s + Number(r.l) * Number(r.w), 0)
  const L = Number(plankLmm)
  const W = Number(plankWmm)
  const box = Math.round(Number(perBox))
  if (totalArea <= 0 || !Number.isFinite(L) || !Number.isFinite(W) || L <= 0 || W <= 0) return null
  const plankArea = (L * W) / 1e6
  const theory = totalArea / plankArea
  const rate = Number.isFinite(Number(wastePct)) && Number(wastePct) >= 0 ? Number(wastePct) / 100 : 0
  const withWaste = Math.ceil(theory * (1 + rate))
  if (!Number.isFinite(box) || box < 1) {
    return { totalArea, plankArea, theory, withWaste, boxes: null, pieces: null, leftover: null, realArea: withWaste * plankArea }
  }
  const boxes = Math.ceil(withWaste / box)
  const pieces = boxes * box
  return { totalArea, plankArea, theory, withWaste, boxes, pieces, leftover: pieces - withWaste, realArea: pieces * plankArea }
}

const roomArea = (r) => (Number(r.l) > 0 && Number(r.w) > 0 ? +((Number(r.l) * Number(r.w)).toFixed(2)) : 0)
const fmtArea = (v) => (Number.isFinite(v) ? +(v.toFixed(2)) : '—')
const fmtTheory = (v) => (Number.isFinite(v) ? +(v.toFixed(1)) : '—')

// ---------- 静态数据 ----------
const PLANK_PRESETS = [
  { id: 'p1215', label: '强化复合 1215×195', l: 1215, w: 195 },
  { id: 'p1285', label: '强化复合 1285×195', l: 1285, w: 195 },
  { id: 'p910', label: '实木 910×122', l: 910, w: 122 },
  { id: 'custom', label: '自定义…', custom: true }
]

const WASTE_PRESETS = [
  { id: 'straight', label: '正铺', pct: 5, tip: '正铺（对齐铺）损耗约 5%：切割集中在前排与边角，是整板利用率最高的常规铺法。' },
  { id: 'diagonal', label: '斜铺 45°', pct: 7, tip: '45° 斜铺整排都要斜切，通行按 7% 起步预留；空间显大但工费与损耗都更高。' },
  { id: 'herringbone', label: '人字拼', pct: 12.5, tip: '人字拼 / 鱼骨拼两端斜切、对缝要求高，通行按 10% ~ 15% 预留（本页取中值 12.5%，可自定义）。' },
  { id: 'custom', label: '自定义', pct: null, tip: '格局不规则、大片地板或多转角时，在通行口径基础上自行上浮。' }
]

// ---------- 响应式参数 ----------
const rooms = ref([
  { l: 5, w: 4 }
])
const plankChoice = ref('p1215')
const customPlankL = ref(1200)
const customPlankW = ref(150)
const wasteChoice = ref('straight')
const customWaste = ref(8)
const perBox = ref(8)

const isCustomPlank = computed(() => plankChoice.value === 'custom')
const isCustomWaste = computed(() => wasteChoice.value === 'custom')
const activeWaste = computed(() => WASTE_PRESETS.find((w) => w.id === wasteChoice.value) || WASTE_PRESETS[0])
const activeWasteTip = computed(() => (isCustomWaste.value ? '自定义损耗率：请结合现场格局与安装方建议填写。' : activeWaste.value.tip))
const wastePct = computed(() => (isCustomWaste.value ? Math.max(0, Number(customWaste.value) || 0) : activeWaste.value.pct))
const plankLmm = computed(() => (isCustomPlank.value ? Number(customPlankL.value) : (PLANK_PRESETS.find((p) => p.id === plankChoice.value) || PLANK_PRESETS[0]).l))
const plankWmm = computed(() => (isCustomPlank.value ? Number(customPlankW.value) : (PLANK_PRESETS.find((p) => p.id === plankChoice.value) || PLANK_PRESETS[0]).w))
const plankAreaText = computed(() => (plankLmm.value > 0 && plankWmm.value > 0 ? ((plankLmm.value * plankWmm.value) / 1e6).toFixed(4) : '—'))

const validationIssues = computed(() => {
  const list = []
  if (!rooms.value.some((r) => Number(r.l) > 0 && Number(r.w) > 0)) list.push('至少需要一个房间且长宽均大于 0')
  if (!(plankLmm.value > 0 && plankWmm.value > 0)) list.push('地板单片长宽需为大于 0 的数值（mm）')
  if (isCustomWaste.value && (Number(customWaste.value) < 0 || Number(customWaste.value) > 30)) list.push('自定义损耗率建议在 0 ~ 30% 之间')
  if (!(Number(perBox.value) >= 1)) list.push('每箱片数需为不小于 1 的整数')
  return list
})

// ---------- 计算结果 ----------
const result = computed(() => {
  const r = flooringOf(rooms.value, plankLmm.value, plankWmm.value, wastePct.value, perBox.value)
  if (!r) return null
  return {
    boxes: r.boxes,
    pieces: r.pieces,
    withWaste: r.withWaste,
    theoryText: fmtTheory(r.theory),
    areaText: fmtArea(r.totalArea),
    realAreaText: fmtArea(r.realArea),
    leftover: r.leftover === null ? '—' : r.leftover,
    hasBox: r.boxes !== null
  }
})

const leftoverTip = computed(() => {
  if (!result.value || !result.value.hasBox) return '填写每箱片数后给出整箱购买与余料建议。'
  const n = result.value.leftover
  if (n > 0) return `按整箱购买共 ${result.value.pieces} 片，铺完预计剩 ${n} 片完整地板——可留作日后维修备料，或用于飘窗台、小地台等小空间。`
  if (n === 0) return '含损耗片数恰好凑满整箱，无余料；如日后需局部换板，建议与商家确认能否加购 1~2 片同批次。'
  return '请检查每箱片数输入。'
})

// ---------- 交互动作 ----------
function addRoom() {
  rooms.value.push({ l: 3, w: 3 })
}
function removeRoom(index) {
  rooms.value.splice(index, 1)
}
function applyPlank(p) {
  plankChoice.value = p.id
  if (p.custom) {
    customPlankL.value = Number(customPlankL.value) > 0 ? customPlankL.value : 1200
    customPlankW.value = Number(customPlankW.value) > 0 ? customPlankW.value : 150
  }
}
function resetAll() {
  rooms.value = [{ l: 5, w: 4 }]
  plankChoice.value = 'p1215'
  customPlankL.value = 1200
  customPlankW.value = 150
  wasteChoice.value = 'straight'
  customWaste.value = 8
  perBox.value = 8
}

onMounted(() => {
  addRecentTool('flooring-material-calculator')
})
</script>
