<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Scissors class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">纸张开数计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">正度 / 大度全开到 64 开每档尺寸、面积与可裁张数，几何对切与书刊开本两种口径一次讲清</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线纸张开数计算器：印刷设计最常问的「全开纸多大？对开、四开、16 开是多少毫米」这一页算清。
        正度全张 787×1092mm、大度全张 889×1194mm 两套体系一键切换，从全开到 64 开每档给出
        几何对切尺寸（依次对折的毛尺寸）、面积与全开可裁张数，并列出光边后行业常用开纸尺寸；
        内置 GB/T 788-1999 图书和杂志开本幅面尺寸表（A4=210×297、A5=148×210、B5=169×239 等书刊口径），
        特别说明「书刊 16 开惯用 185×260 / 大度 16 开 210×285」与几何对切值并不相同的原因。
        还可输入任意成品尺寸，自动推荐最接近、利用率最高的开数，并按简单排格估算一张全开纸能裁多少张。
        全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Scissors class="w-5 h-5 mr-2 text-primary" /> 查询参数
        </h2>

        <!-- 纸张体系 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">纸张体系（全开尺寸）</p>
          <div class="grid grid-cols-2 gap-2" role="group" aria-label="纸张体系">
            <button
              v-for="s in SYSTEMS"
              :key="s.id"
              type="button"
              class="px-3 py-2 rounded-lg border text-sm font-medium transition text-left"
              :class="system === s.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="system = s.id"
            >
              {{ s.label }}
              <span class="block text-[11px] font-mono mt-0.5" :class="system === s.id ? 'text-primary-foreground/80' : 'text-muted-foreground'">{{ s.size }}mm</span>
            </button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">正度为国内书刊常用全张纸；大度（也称 A 幅）比正度大，海报、画册常用，同开数尺寸更大。</p>
        </div>

        <!-- 开数预览 -->
        <div>
          <label for="pc-open" class="block text-sm font-medium text-foreground mb-1.5">开数</label>
          <select id="pc-open" v-model.number="openKind" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option v-for="g in geoRows" :key="g.k" :value="g.k">{{ g.name }}</option>
          </select>
          <div class="mt-3 flex items-start gap-4">
            <!-- 纸张预览小图（比例示意，中性色卡） -->
            <div class="flex-shrink-0">
              <div class="border border-border bg-muted/40 p-1.5 rounded" :style="{ width: previewBox.w + 'px', height: previewBox.h + 'px' }">
                <div
                  class="border border-primary/50 bg-primary/10 rounded-sm relative"
                  :style="{ width: previewInner.w + 'px', height: previewInner.h + 'px' }"
                >
                  <span class="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-primary">{{ activeGeo.name }}</span>
                </div>
              </div>
              <p class="text-[10px] text-muted-foreground mt-1 text-center">占全开 1/{{ openKind }}</p>
            </div>
            <div class="text-xs text-muted-foreground leading-relaxed space-y-1">
              <p>几何对切（毛尺寸）：<span class="font-mono text-foreground font-semibold">{{ fmt(activeGeo.w) }} × {{ fmt(activeGeo.h) }} mm</span></p>
              <p>面积：<span class="font-mono text-foreground">{{ fmtArea(activeGeo.area) }}</span>（全开的 1/{{ openKind }}）</p>
              <p>全开可裁张数：<span class="font-mono text-foreground font-semibold">{{ openKind }} 张</span>（理论对切，未计光边损耗）</p>
              <p v-if="activeCut">光边后行业常用开纸：<span class="font-mono text-foreground">{{ activeCut[0] }} × {{ activeCut[1] }} mm</span></p>
            </div>
          </div>
        </div>

        <!-- 成品尺寸推荐 -->
        <div class="border-t border-border pt-4">
          <p class="text-sm font-medium text-foreground mb-1.5">按成品尺寸推荐开数</p>
          <div class="flex flex-wrap items-center gap-2">
            <input
              v-model.number="finW"
              type="number"
              min="1"
              step="1"
              aria-label="成品宽度 mm"
              class="w-28 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <span class="text-sm text-muted-foreground">×</span>
            <input
              v-model.number="finH"
              type="number"
              min="1"
              step="1"
              aria-label="成品高度 mm"
              class="w-28 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <span class="text-xs text-muted-foreground">mm（横竖均可，自动判向）</span>
          </div>
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="p in PRESET_SIZES"
              :key="p.label"
              type="button"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="finW === p.w && finH === p.h ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="applyPreset(p)"
            >{{ p.label }}</button>
          </div>
        </div>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-4">
        <!-- 推荐结果卡 -->
        <div class="bg-card border border-primary/40 rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Search class="w-5 h-5 mr-2 text-primary" /> 最接近开数推荐
          </h2>
          <div v-if="recommend" class="space-y-3">
            <div class="bg-muted/50 rounded-xl p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              <div>
                <p class="text-xs text-muted-foreground mb-1">推荐开数（{{ systemLabel }}）</p>
                <p class="text-4xl font-bold text-primary leading-tight">{{ recommend.name }}</p>
              </div>
              <div class="text-sm text-muted-foreground space-y-1">
                <p>开纸尺寸：<span class="font-mono text-foreground">{{ recommend.piece[0] }} × {{ recommend.piece[1] }} mm</span></p>
                <p>排向：<span class="font-mono text-foreground">{{ recommend.orient }}</span></p>
                <p>纸面利用率：<span class="font-mono text-foreground font-semibold text-foreground">{{ recommend.utilText }}</span></p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>按光边后行业常用开纸口径判定；成品 {{ fmt(finW) }} × {{ fmt(finH) }} mm 是能装进的最小一档开纸。若成品带出血，请先按本站出血参考把制作尺寸加好再回填。</span>
            </p>
            <div class="p-3 rounded-lg bg-muted/40 border border-border text-xs text-foreground leading-relaxed flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>简单排格估算（几何毛尺寸 {{ activeGeo.name }}口径不计光边）：一张{{ systemLabel }}全开 {{ systemSize[0] }} × {{ systemSize[1] }} mm 可裁该成品约
                <span class="font-mono font-semibold">{{ recommend.grid }}</span> 张；实际需扣除光边 3~5mm、印刷咬口与出血，通常按估算值的 85%~95% 备料。</span>
            </div>
            <button
              type="button"
              class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
              @click="copyRecommend"
            >
              <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制推荐结果文本
            </button>
          </div>
          <div v-else-if="inputInvalid" class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <TriangleAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">成品尺寸无效</p>
              <p class="text-xs text-muted-foreground mt-1">宽、高请填大于 0 的数值（mm），且不超过全开尺寸。</p>
            </div>
          </div>
          <p v-else class="p-8 text-center text-sm text-muted-foreground">填入成品尺寸即可推荐最接近的开数</p>
        </div>

        <!-- 全档对照表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Table class="w-5 h-5 mr-2 text-primary" /> {{ systemLabel }}全开 → 64 开对照表
          </h2>
          <p class="text-xs text-muted-foreground mb-3 leading-relaxed">「几何对切」为依次对折、不裁毛边的理论值；「行业开纸」为光边后印厂常用尺寸，各印厂光边量不同、数值略有出入，下单以合作印厂为准。</p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">开数</th>
                  <th class="py-2 pr-3 font-medium">几何对切（毛尺寸 mm）</th>
                  <th class="py-2 pr-3 font-medium">面积</th>
                  <th class="py-2 pr-3 font-medium">全开可裁张数</th>
                  <th class="py-2 font-medium">行业开纸（光边后）</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="g in geoRows"
                  :key="g.k"
                  class="border-b border-border/60"
                  :class="openKind === g.k ? 'bg-primary/5' : ''"
                >
                  <td class="py-2 pr-3 font-medium text-foreground cursor-pointer" @click="openKind = g.k">{{ g.name }}</td>
                  <td class="py-2 pr-3 font-mono text-foreground">{{ fmt(g.w) }} × {{ fmt(g.h) }}</td>
                  <td class="py-2 pr-3 font-mono text-muted-foreground">{{ fmtArea(g.area) }}</td>
                  <td class="py-2 pr-3 font-mono text-muted-foreground">{{ g.k }} 张</td>
                  <td class="py-2 font-mono text-muted-foreground">{{ cutText(g.k) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- GB/T 788 书刊开本卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <BookOpen class="w-5 h-5 mr-2 text-primary" /> GB/T 788-1999 书刊开本幅面
          </h2>
          <p class="text-xs text-muted-foreground mb-3 leading-relaxed">图书和杂志开本以 A、B 系列标记（A/B 后数字 = 全张纸对折长边裁切次数），下表为标准公称成品尺寸（允差 ±1mm）。注意：书刊 16 开惯用 185×260、大度 16 开惯用 210×285 是印刷行业常用开纸口径，与本表 A 系列数值并不相同。</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div v-for="f in GBT788" :key="f.code" class="bg-muted/50 rounded-xl p-4">
              <p class="text-sm font-bold text-foreground">{{ f.code }} <span class="text-xs font-normal text-muted-foreground">（{{ f.open }}）</span></p>
              <p class="font-mono text-xs text-primary mt-1">{{ f.size[0] }} × {{ f.size[1] }} mm</p>
              <p class="text-[10px] text-muted-foreground mt-1">未裁切单张 {{ f.sheet }}</p>
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">来源：GB/T 788-1999《图书和杂志开本及其幅面尺寸》表 1（A 系列 890×1240M / 900×1280M，B 系列 1000M×1400）。书刊开本涉及装订裁切，设计封面与内文时请以现行标准原文和出版社版式要求为准。</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-6" open>
      <summary class="text-base font-semibold text-foreground cursor-pointer select-none mb-4">开数口径、公式、光边损耗与常见问题</summary>

      <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>纸张开数计算器是什么？</h2>
      <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
        开数描述一张全开纸能切成多少张同样大的纸：全开对折一次是 2 开（对开），再折是 4 开，依此类推。
        本工具同时给出两套体系（正度 787×1092mm、大度 889×1194mm 全开）下从全开到 64 开的每档尺寸与面积，
        并区分两种最容易混淆的口径：<strong class="text-foreground">①几何对切</strong>——把全开纸依次对折得到的毛尺寸（如正度四开 546×393.5mm）；
        <strong class="text-foreground">②书刊/行业惯用开本</strong>——扣除光边与装订余量后的常用值（如书刊 16 开惯用 185×260mm、大度 16 开 210×285mm、GB/T 788 的 A4=210×297mm）。
        做印品报尺寸前，先确认对方问的是哪种口径。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">几何开切与直线开切有什么区别？</h3>
      <p class="text-sm text-muted-foreground leading-relaxed">
        <strong class="text-foreground">几何开切法</strong>：每次都沿长边对折（依次对折），全开→对开→四开→八开……每折一次开数翻倍、面积减半，纸面利用率理论 100%，
        本页对照表的「几何对切」列即按此计算。但连续对折到 16 开以后纸张太厚、折缝处易起皱，实际印刷很少一路对折到底。
        <strong class="text-foreground">直线开切法</strong>：用一组平行刀口把全开纸一次切成若干等份（如切成 12 等份的 12 开），开数不受 2 的幂次限制（可出 3 开、6 开、12 开、20 开等），
        灵活但会剩余不可用的纸边（俗称"纸头"），利用率低于几何开切。书刊正文多用几何开切体系，包装与异形开本常用直线开切。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么实际开纸尺寸比几何对切小？——光边 3~5mm 损耗</h3>
      <p class="text-sm text-muted-foreground leading-relaxed">
        全张纸出厂时四边毛糙、尺寸有公差，切纸机分切前要先「光边」（裁掉纸毛与破损边），通常每边裁去 3~5mm；
        另外印刷机的咬口（约 8~12mm 不印区域）与成品修边也要占纸。以正度对开为例：1092÷2=546 是几何值，
        光边后行业常用开纸为 780×540 左右；正度书刊 16 开成品 185×260，还要在开纸 195×271 基础上再扣除装订边的铣背、
        索线与修边余量。所以同一「16 开」在不同场合会报出 195×271（开纸）、185×260（书刊成品）、210×285（大度）、
        210×297（GB/T 788 的 A4）几组数字，都是对的，口径不同而已。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">计算公式</h3>
      <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
        <li>全开面积 = 全开宽 × 全开高：正度 787×1092 = 859,404mm² ≈ 0.86㎡；大度 889×1194 = 1,061,466mm² ≈ 1.06㎡。</li>
        <li>几何对切第 n 档：每次把当前较长的一边除以 2，面积 = 全开面积 ÷ 2ⁿ（对开 530,733mm²、四开 265,366.5mm²，依次减半）。</li>
        <li>全开可裁张数（几何口径）= 该档开数本身：对开 2 张、四开 4 张、64 开 64 张；计入光边与咬口后实际略少。</li>
        <li>简单排格估算：张数 = max(⌊全开宽÷成品宽⌋×⌊全开高÷成品高⌋, ⌊全开宽÷成品高⌋×⌊全开高÷成品宽⌋)。</li>
        <li>推荐开数：取光边后行业开纸表中能容纳成品的最小一档（利用率最高），横竖两个方向自动判别。</li>
      </ul>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">出出血与印前提醒</h3>
      <p class="text-sm text-muted-foreground leading-relaxed">
        确定开数与开纸尺寸后，成品稿四边还要各加 3mm 出血（大幅喷绘类更多），重要文字距成品边至少 3~5mm 防止裁到。
        需要按印品类型逐项算出血与安全区，可用本站的印刷出血参考生成器：
        <NuxtLink to="/tools/print-bleed-guide/" class="text-primary font-medium hover:underline">/tools/print-bleed-guide/</NuxtLink>。
      </p>

      <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-base font-semibold text-foreground">正度对开、四开、八开到底多大？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            几何对切口径：对开 787×546mm、四开 546×393.5mm、八开 393.5×273mm、16 开 273×196.75mm。
            光边后行业常用开纸：对开约 780×540、四开约 543×390、八开约 390×271、16 开约 271×195。
            报尺寸时先说清口径，避免与对方理解差十几毫米。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">为什么书刊 16 开是 185×260，不是 273×196.75？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            273×196.75 是全开纸依次对折 4 次的几何毛尺寸；书刊成品还要光边、留印刷咬口、装订（铣背/锁线）与成品修边，
            国内书刊 16 开惯用成品 185×260mm。GB/T 788-1999 里对应的 A/B 系列口径又是另一套：A4=210×297（890×1240M 原纸，大 16 开）、
            B5=169×239（1000M×1400 原纸）。以现行标准原文与出版社版式要求为准。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">大度 16 开和 A4 是一回事吗？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            不是。大度 16 开开纸约 210×285mm（889×1194 全开的四分之一再光边），比 A4（210×297）矮 12mm；
            画册、期刊常说的"大 16 开"多指 210×285 这个开纸口径。GB/T 788 的 A4 公称成品 210×297 则来自 890×1240M 原纸。
            用 A4 版式排"大 16 开"刊物时注意底部会短一截。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">一张全开纸能裁多少张名片？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            名片成品 90×54mm：正度全开按简单排格可裁约 168 张（8×20 与 14×12 两种排法取多者），
            大度全开约 208 张（9×22 与 16×13 取多者）。计入光边、出血与修边后按 85%~95% 备料；
            印厂拼版常按固定拼数（如正度 8 开拼 16 张名片）报价。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">数据以什么为准？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            几何对切与面积由公式精确计算；行业开纸常用值与 GB/T 788 开本表为公开资料整理（两源交叉核对），
            各印厂光边量不同、数值略有出入，正式下单以合作印厂与现行标准原文为准。本页全部计算在浏览器本地完成，不上传数据。
          </p>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'paper-cut-size-calculator'" :category="'design'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Scissors, Search, Info, CheckCircle, TriangleAlert, Copy, Table, BookOpen
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '纸张开数计算器 - 正度/大度全开到64开尺寸对照与开本推荐 | 有条工具',
  description: '免费在线纸张开数计算器：正度 787×1092、大度 889×1194 全开到 64 开每档几何对切尺寸、面积与可裁张数，光边后行业开纸常用值，GB/T 788 书刊开本 A4/B5 幅面表，输入成品尺寸自动推荐最接近开数与全开排格张数，印刷设计常用，纯浏览器本地计算',
  keywords: '纸张开数计算器,正度纸尺寸,大度纸尺寸,16开尺寸是多少,对开尺寸,全开纸尺寸,开本对照表',
  author: '有条工具',
  ogTitle: '纸张开数计算器 - 正度/大度全开到64开尺寸对照 | 有条工具',
  ogDescription: '正度/大度全开到 64 开几何对切与行业开纸双口径对照，输入成品尺寸自动推荐最接近开数。',
  ogUrl: 'https://www.util.cn/tools/paper-cut-size-calculator',
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
          name: '纸张开数计算器',
          url: 'https://www.util.cn/tools/paper-cut-size-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '正度 787×1092 / 大度 889×1194 两套体系切换',
            '全开到 64 开每档几何对切尺寸与面积',
            '全开可裁张数与光边后行业开纸常用值',
            'GB/T 788-1999 书刊开本 A/B 系列幅面表',
            '输入成品尺寸推荐最接近开数与利用率',
            '简单排格估算一张全开可裁张数',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '设计工具', item: 'https://www.util.cn/design/' },
            { '@type': 'ListItem', position: 3, name: '纸张开数计算器', item: 'https://www.util.cn/tools/paper-cut-size-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '正度对开、四开、八开到底多大？',
              acceptedAnswer: { '@type': 'Answer', text: '几何对切口径：对开 787×546mm、四开 546×393.5mm、八开 393.5×273mm、16开 273×196.75mm；光边后行业常用开纸：对开约 780×540、四开约 543×390、八开约 390×271、16开约 271×195。报尺寸时先说清口径。' }
            },
            {
              '@type': 'Question',
              name: '为什么书刊 16 开是 185×260，不是 273×196.75？',
              acceptedAnswer: { '@type': 'Answer', text: '273×196.75 是全开纸依次对折 4 次的几何毛尺寸；书刊成品还要光边、留咬口、装订与修边，国内书刊 16 开惯用成品 185×260mm。GB/T 788-1999 的 A4=210×297、B5=169×239 又是另一套原纸口径。' }
            },
            {
              '@type': 'Question',
              name: '大度 16 开和 A4 是一回事吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。大度 16 开开纸约 210×285mm（889×1194 的四分之一再光边），比 A4（210×297）矮 12mm；GB/T 788 的 A4 来自 890×1240M 原纸。用 A4 版式排大 16 开刊物时注意高度差。' }
            },
            {
              '@type': 'Question',
              name: '一张全开纸能裁多少张名片？',
              acceptedAnswer: { '@type': 'Answer', text: '名片成品 90×54mm：正度全开简单排格约 168 张（8×20 与 14×12 取多者），大度全开约 208 张（9×22 与 16×13 取多者）；计入光边、出血与修边后按 85%~95% 备料。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 单位：mm。两套体系：正度全开 787×1092，大度全开 889×1194。
// 几何对切：每折一次把当前较长边除以 2；面积 = 全开面积 ÷ 2ⁿ。
// 行业开纸常用值为光边后公开资料整理（两源交叉），各印厂略有出入。
/* TESTABLE-START */
const FULL_SHEETS = {
  zhengdu: { label: '正度', w: 787, h: 1092 },
  dadu: { label: '大度', w: 889, h: 1194 }
}

const K_NAMES = { 1: '全开', 2: '对开', 4: '四开', 8: '八开', 16: '16开', 32: '32开', 64: '64开' }

// 光边后行业常用开纸（横向长边在前，两源交叉的常用口径）
const CUT_SHEET = {
  zhengdu: { 2: [780, 540], 4: [543, 390], 8: [390, 271], 16: [271, 195], 32: [195, 135], 64: [135, 97] },
  dadu: { 2: [880, 590], 4: [590, 440], 8: [440, 295], 16: [285, 210], 32: [210, 142], 64: [142, 105] }
}

// GB/T 788-1999 图书和杂志开本及其幅面尺寸（表 1 公称成品尺寸，允差 ±1mm）
const GBT788 = [
  { code: 'A4', size: [210, 297], open: '16 开', sheet: '890×1240M / 900×1280M' },
  { code: 'A5', size: [148, 210], open: '32 开', sheet: '890M×1240 / 900M×1280' },
  { code: 'A6', size: [105, 144], open: '64 开', sheet: '890×1240M / 900×1280M' },
  { code: 'B5', size: [169, 239], open: '32 开', sheet: '1000M×1400' },
  { code: 'B6', size: [119, 165], open: '64 开', sheet: '1000×1400M' },
  { code: 'B7', size: [82, 115], open: '128 开', sheet: '1000M×1400' }
]

// 全开面积（mm²）；非法体系返回 null
function fullArea(sys) {
  const s = FULL_SHEETS[sys]
  if (!s) return null
  return s.w * s.h
}

// 几何对切系列：从全开起，每折一次把较长边减半；steps 为折叠次数（6 → 64 开）
function geometricSeries(w, h, steps) {
  const W = Number(w), H = Number(h)
  const N = Number(steps)
  if (!Number.isFinite(W) || !Number.isFinite(H) || W <= 0 || H <= 0) return null
  const n = Math.min(Math.max(Math.floor(N) || 0, 0), 10)
  const out = []
  let cw = W, ch = H
  for (let i = 0; i <= n; i++) {
    if (i > 0) {
      if (cw >= ch) cw = cw / 2
      else ch = ch / 2
    }
    const k = Math.pow(2, i)
    const long = Math.max(cw, ch), short = Math.min(cw, ch)
    out.push({ k, name: K_NAMES[k] || `${k}开`, w: long, h: short, area: long * short })
  }
  return out
}

// 简单排格估算：全开纸横竖两种排法取张数多者
function gridCount(sheetW, sheetH, w, h) {
  const a = [Number(sheetW), Number(sheetH)], b = [Number(w), Number(h)]
  if (a.some((v) => !Number.isFinite(v) || v <= 0) || b.some((v) => !Number.isFinite(v) || v <= 0)) return null
  if (b[0] > a[0] || b[1] > a[1]) return 0
  const n1 = Math.floor(a[0] / b[0]) * Math.floor(a[1] / b[1])
  const n2 = Math.floor(a[0] / b[1]) * Math.floor(a[1] / b[0])
  return Math.max(n1, n2)
}

// 推荐最接近开数：从 64 开向全开找第一个能容纳成品的光边后开纸档（利用率最高）
// 返回 { k, name, piece, orient, util }；装不下返回 null；非法输入返回 { invalid: true }
function recommendCut(sys, w, h) {
  const s = FULL_SHEETS[sys]
  const W = Number(w), H = Number(h)
  if (!s || !Number.isFinite(W) || !Number.isFinite(H) || W <= 0 || H <= 0) return { invalid: true }
  const table = CUT_SHEET[sys]
  const ks = [64, 32, 16, 8, 4, 2]
  for (const k of ks) {
    const p = table[k]
    if (W <= p[0] && H <= p[1]) return pack(sys, k, p, `${p[0]}×${p[1]} 竖排`, W, H)
    if (W <= p[1] && H <= p[0]) return pack(sys, k, p, `${p[1]}×${p[0]} 横排`, W, H)
  }
  return null
}
function pack(sys, k, p, orient, w, h) {
  const s = FULL_SHEETS[sys]
  return {
    k,
    name: K_NAMES[k],
    piece: p,
    orient,
    util: (w * h) / (p[0] * p[1]),
    grid: gridCount(s.w, s.h, w, h)
  }
}

// 通用格式化
function roundTo(v, digits) {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  const p = Math.pow(10, digits)
  return Math.round(n * p) / p
}
/* TESTABLE-END */

function fmt(v) {
  const r = roundTo(v, 2)
  return r === null ? '—' : String(r)
}
function fmtArea(v) {
  const r = roundTo(v, 0)
  return r === null ? '—' : `${r} mm²`
}

// ---------- 静态数据 ----------
const SYSTEMS = [
  { id: 'zhengdu', label: '正度', size: '787×1092' },
  { id: 'dadu', label: '大度', size: '889×1194' }
]

const PRESET_SIZES = [
  { label: '名片 90×54', w: 90, h: 54 },
  { label: 'A4 210×297', w: 210, h: 297 },
  { label: '大16开 210×285', w: 210, h: 285 },
  { label: '书刊16开 185×260', w: 185, h: 260 },
  { label: '8开海报 285×420', w: 285, h: 420 }
]

// ---------- 响应式参数 ----------
const system = ref('zhengdu')
const openKind = ref(4)
const finW = ref(210)
const finH = ref(297)

const systemMeta = computed(() => FULL_SHEETS[system.value] || FULL_SHEETS.zhengdu)
const systemLabel = computed(() => systemMeta.value.label)
const systemSize = computed(() => [systemMeta.value.w, systemMeta.value.h])
const geoRows = computed(() => geometricSeries(systemMeta.value.w, systemMeta.value.h, 6) || [])
const activeGeo = computed(() => geoRows.value.find((g) => g.k === openKind.value) || geoRows.value[0] || { k: 1, name: '全开', w: 0, h: 0, area: 0 })
const activeCut = computed(() => CUT_SHEET[system.value][activeGeo.value.k] || null)
const cutText = (k) => {
  const p = CUT_SHEET[system.value][k]
  return p ? `${p[0]} × ${p[1]}` : '—'
}

const inputInvalid = computed(() => {
  const w = Number(finW.value), h = Number(finH.value)
  return !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0
})

const recommend = computed(() => {
  if (inputInvalid.value) return null
  const r = recommendCut(system.value, finW.value, finH.value)
  if (!r || r.invalid) return null
  return { ...r, utilText: `${(r.util * 100).toFixed(1)}%` }
})

// 预览小图：全开外框 + 开数内块，按最长边等比缩到 140px
const previewBox = computed(() => {
  const [fw, fh] = systemSize.value
  const scale = 140 / Math.max(fw, fh)
  return { w: Math.max(28, Math.round(fw * scale)), h: Math.max(28, Math.round(fh * scale)) }
})
const previewInner = computed(() => {
  const [fw, fh] = systemSize.value
  const scale = 140 / Math.max(fw, fh)
  const long = Math.max(activeGeo.value.w, activeGeo.value.h)
  const short = Math.min(activeGeo.value.w, activeGeo.value.h)
  const w = activeGeo.value.w >= activeGeo.value.h ? long * scale : short * scale
  const h = activeGeo.value.w >= activeGeo.value.h ? short * scale : long * scale
  return { w: Math.max(10, Math.round(w)), h: Math.max(10, Math.round(h)) }
})

// ---------- 交互动作 ----------
function applyPreset(p) {
  finW.value = p.w
  finH.value = p.h
}

function recommendText() {
  if (!recommend.value) return ''
  const r = recommend.value
  return `纸张开数推荐（${systemLabel.value} 全开 ${systemSize.value[0]}×${systemSize.value[1]}mm）\n成品：${fmt(finW.value)}×${fmt(finH.value)}mm\n推荐开数：${r.name}（开纸 ${r.piece[0]}×${r.piece[1]}mm，${r.orient}）\n纸面利用率：${r.utilText}\n全开简单排格约 ${r.grid} 张（未计光边/咬口/出血）\n几何对切毛尺寸：${fmt(activeGeo.value.w)}×${fmt(activeGeo.value.h)}mm`
}

async function copyRecommend() {
  const text = recommendText()
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
  } catch {
    alert('复制失败，请手动选择文本复制')
  }
}

onMounted(() => {
  addRecentTool('paper-cut-size-calculator')
})
</script>
