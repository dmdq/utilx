<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Table class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Excel 公式生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">SUMIF / VLOOKUP / XLOOKUP 等十大高频函数，选模板填参数即出公式，逐参数人话讲解</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 Excel 公式生成器：把 SUMIF、SUMIFS、COUNTIF、COUNTIFS、VLOOKUP、XLOOKUP、INDEX+MATCH、IF 嵌套、TEXT、SUBTOTAL 十个最高频的函数做成参数化模板，
        选模板、填范围与条件，右侧实时生成可整段粘贴进表格的公式，并逐个参数解释「这一格是干嘛的」；每个模板还固定附送 1-2 条最容易踩的坑，
        范围格式填错会当场红字提示。全部拼接与校验在浏览器本地完成。
      </p>
      <p class="mt-3 flex items-start gap-2 text-sm text-foreground bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
        <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <span>不联网、不调用 AI——参数化模板拼公式，附带每个参数的人话解释，适合先看懂再粘进表格。</span>
      </p>
    </div>

    <!-- 全局假设说明（静态卡） -->
    <div class="bg-muted/40 border border-border rounded-lg px-4 py-3 mb-6 flex items-start gap-2 text-sm text-foreground">
      <Info class="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      <p>示例均假设：A 列=姓名，B 列=部门，C 列=销售额，A2:C100 为数据区。你的表结构不同时把范围替换成自己的即可。</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：模板选择与参数填空 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Info class="w-5 h-5 mr-2 text-primary" /> 选模板、填参数
        </h2>

        <div>
          <label for="tpl-select" class="block text-xs font-medium text-muted-foreground mb-1.5">公式模板（10 个）</label>
          <select
            id="tpl-select"
            :value="selectedId"
            @change="onSelectChange"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="t in TEMPLATES" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <p class="text-xs text-muted-foreground mt-1.5">{{ currentTemplate.summary }}</p>
          <p v-if="currentTemplate.note" class="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Info class="w-3.5 h-3.5 flex-shrink-0 text-primary" />{{ currentTemplate.note }}
          </p>
        </div>

        <!-- 静态参数 -->
        <div v-for="def in currentTemplate.params" :key="def.key" class="space-y-1">
          <label :for="'param-' + def.key" class="block text-sm font-medium text-foreground">{{ def.label }}</label>
          <p class="text-xs text-muted-foreground leading-relaxed">{{ def.explain }}</p>
          <select
            v-if="def.options"
            :id="'param-' + def.key"
            v-model="values[def.key]"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="opt in def.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <input
            v-else
            :id="'param-' + def.key"
            v-model="values[def.key]"
            type="text"
            :placeholder="def.ph"
            class="w-full px-3 py-2 bg-background border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2"
            :class="staticErrors[def.key] ? 'border-red-500/60 focus:ring-red-500/30' : 'border-border focus:ring-primary/40'"
          />
          <p v-if="staticErrors[def.key]" class="text-xs text-red-500">{{ staticErrors[def.key] }}</p>
          <p v-if="def.warn && values[def.key] === '1'" class="text-xs text-red-500 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{{ def.warn }}
          </p>
        </div>

        <!-- 动态条件组（SUMIFS / COUNTIFS / IF 嵌套） -->
        <template v-if="currentTemplate.groups">
          <div v-for="(g, gi) in groups" :key="gi" class="bg-muted/30 border border-border rounded-lg p-3 space-y-2.5">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-foreground">{{ currentTemplate.groups.name }} {{ gi + 1 }}</p>
              <button
                v-if="groups.length > currentTemplate.groups.min"
                type="button"
                @click="removeGroup(gi)"
                class="text-xs text-red-500 hover:text-red-600"
              >删除这组</button>
            </div>
            <div v-for="f in currentTemplate.groups.fields" :key="f.key" class="space-y-1">
              <label :for="'g' + gi + '-' + f.key" class="block text-xs font-medium text-foreground">{{ f.label }}</label>
              <p class="text-xs text-muted-foreground">{{ f.explain }}</p>
              <input
                :id="'g' + gi + '-' + f.key"
                v-model="g[f.key]"
                type="text"
                :placeholder="f.ph"
                class="w-full px-2.5 py-1.5 bg-background border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2"
                :class="groupErrors[gi][f.key] ? 'border-red-500/60 focus:ring-red-500/30' : 'border-border focus:ring-primary/40'"
              />
              <p v-if="groupErrors[gi][f.key]" class="text-xs text-red-500">{{ groupErrors[gi][f.key] }}</p>
            </div>
          </div>
          <button
            v-if="canAddGroup"
            type="button"
            @click="addGroup"
            class="w-full px-3 py-2 border border-dashed border-primary/40 text-primary rounded-lg text-sm hover:bg-primary/5 transition"
          >+ {{ currentTemplate.groups.addLabel }}</button>
        </template>

        <!-- TEXT 格式代码速查小表 -->
        <div v-if="selectedId === 'text-format'" class="border border-border rounded-lg overflow-hidden">
          <p class="text-xs font-medium text-foreground px-2.5 py-1.5 bg-muted/60">格式代码速查</p>
          <table class="w-full text-xs text-left">
            <thead>
              <tr class="bg-muted/30 text-muted-foreground">
                <th class="px-2.5 py-1.5 font-medium">代码</th>
                <th class="px-2.5 py-1.5 font-medium">示例</th>
                <th class="px-2.5 py-1.5 font-medium">说明</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border text-foreground">
              <tr><td class="px-2.5 py-1.5 font-mono">yyyy</td><td class="px-2.5 py-1.5 font-mono">2026</td><td class="px-2.5 py-1.5">4 位年份</td></tr>
              <tr><td class="px-2.5 py-1.5 font-mono">m / mm</td><td class="px-2.5 py-1.5 font-mono">11</td><td class="px-2.5 py-1.5">月，mm 固定两位</td></tr>
              <tr><td class="px-2.5 py-1.5 font-mono">d / dd</td><td class="px-2.5 py-1.5 font-mono">3</td><td class="px-2.5 py-1.5">日，dd 固定两位</td></tr>
              <tr><td class="px-2.5 py-1.5 font-mono">aaa / aaaa</td><td class="px-2.5 py-1.5 font-mono">周二 / 星期二</td><td class="px-2.5 py-1.5">中文星期</td></tr>
              <tr><td class="px-2.5 py-1.5 font-mono">h:mm</td><td class="px-2.5 py-1.5 font-mono">9:30</td><td class="px-2.5 py-1.5">24 小时制时间</td></tr>
            </tbody>
          </table>
        </div>

        <!-- 操作 -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            @click="loadSample"
            class="px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5"
          >
            <Play class="w-4 h-4" /> 载入示例
          </button>
          <button
            type="button"
            @click="resetParams"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw class="w-4 h-4" /> 重置
          </button>
        </div>
      </div>

      <!-- 右：结果（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 结果卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-lg font-semibold flex items-center">
              <Table class="w-5 h-5 mr-2 text-primary" /> 生成的公式
            </h2>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="copyResult('formula')"
                :disabled="!formulaResult.formula"
                class="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed rounded-lg text-sm transition flex items-center gap-1.5"
              >
                <CheckCircle v-if="copiedField === 'formula'" class="w-4 h-4" />
                <Copy v-else class="w-4 h-4" /> 复制公式
              </button>
              <button
                type="button"
                @click="copyResult('teaching')"
                :disabled="!formulaResult.formula"
                class="px-3 py-1.5 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed border border-border rounded-lg text-sm text-foreground transition flex items-center gap-1.5"
              >
                <CheckCircle v-if="copiedField === 'teaching'" class="w-4 h-4 text-green-500" />
                <Copy v-else class="w-4 h-4" /> 复制教学版
              </button>
            </div>
          </div>

          <pre v-if="formulaResult.formula" class="font-mono text-xl sm:text-2xl font-semibold text-primary bg-muted/50 border border-border rounded-lg px-4 py-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">{{ formulaResult.formula }}</pre>
          <div v-else class="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 space-y-1.5">
            <p class="text-sm font-medium text-red-600 flex items-center gap-1.5">
              <TriangleAlert class="w-4 h-4 flex-shrink-0" />参数还没填好：
            </p>
            <p v-for="(err, i) in formulaResult.errors" :key="i" class="text-xs text-red-500">{{ err }}</p>
          </div>

          <!-- 参数解释列表 -->
          <div v-if="formulaResult.steps.length">
            <h3 class="text-sm font-semibold text-foreground mb-2">每个参数是什么意思</h3>
            <ol class="space-y-2">
              <li v-for="(s, i) in formulaResult.steps" :key="i" class="bg-muted/40 border border-border rounded-lg px-3 py-2">
                <p class="text-sm text-foreground">
                  <span class="font-medium">{{ i + 1 }}. {{ s.param }}</span>
                  <span class="mx-1 text-muted-foreground">=</span>
                  <code class="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-xs break-all">{{ s.value }}</code>
                </p>
                <p class="text-xs text-muted-foreground mt-1 leading-relaxed">{{ s.explain }}</p>
              </li>
            </ol>
          </div>
        </div>

        <!-- 常见坑提示卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <TriangleAlert class="w-5 h-5 mr-2 text-amber-500" /> {{ currentTemplate.funcName }} 的常见坑
          </h2>
          <ul class="space-y-2">
            <li v-for="(pit, i) in currentTemplate.pits" :key="i" class="flex items-start gap-2 text-sm text-muted-foreground">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
              <span class="leading-relaxed">{{ pit }}</span>
            </li>
          </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>Excel 公式生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          Excel 公式生成器是一款把十大高频 Excel 函数做成参数化模板的在线工具。选择模板后按提示填入范围、条件等参数，右侧立即生成可直接整段粘贴进表格的公式，
          同时给出每个参数的人话解释与该函数最常见的踩坑提醒。支持 SUMIF 条件求和、SUMIFS 多条件求和、COUNTIF 条件计数、COUNTIFS 多条件计数、
          VLOOKUP 查找、XLOOKUP 查找、INDEX+MATCH 组合查找、IF 嵌套分档、TEXT 日期格式化与 SUBTOTAL 筛选统计；
          范围参数会按 A1 引用规则实时校验。所有拼接与校验都在浏览器本地完成，不联网、不调用 AI。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">VLOOKUP 怎么用？逐参数讲一遍</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          VLOOKUP 的结构是 <code class="font-mono bg-muted/60 px-1 rounded">=VLOOKUP(查找值, 查找范围, 返回列序号, 匹配方式)</code>，正好对应本工具左侧的四个参数框：
        </p>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>查找值：你要找谁，比如「张三」，文本会自动补上英文双引号。</li>
          <li>查找范围：在哪个矩形区域里找，查找值必须落在该区域的第一列。</li>
          <li>返回列序号：从查找范围的第一列数起要取第几列——范围写 B2:D100 时，C 列是第 2 列而不是第 3 列。</li>
          <li>匹配方式：0 是精确匹配（绝大多数场景都该写 0）；1 是模糊匹配，只有首列已升序时才可靠，选 1 时本工具会红字警告。</li>
        </ul>
        <p class="text-sm text-muted-foreground leading-relaxed mt-2">
          在本页左侧选择「VLOOKUP · 查找」模板，把四个框填好即可生成整条公式，例如 =VLOOKUP("张三",A2:C100,3,0)。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">SUMIF 和 SUMIFS 有什么区别？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          SUMIF 只支持一个条件，写法是 SUMIF(条件范围, 条件, 求和范围)，求和范围排在最后；
          SUMIFS 支持多个条件，写法是 SUMIFS(求和范围, 范围1, 条件1, 范围2, 条件2, …)，求和范围被提到了第一个参数。
          两者参数顺序正好相反，是最高频的记混出错点：把 SUMIFS 写成「条件在前」会直接报错。另外 SUMIFS 的多个条件之间是「并且」关系，
          所有条件都满足的行才会被统计；要「或」关系需要写两个 SUMIF 相加。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">XLOOKUP 和 VLOOKUP 怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          XLOOKUP 需要 Microsoft 365 / Excel 2021 及以上版本（WPS 部分版本支持），优点很实在：不用数返回列号、默认就是精确匹配、
          可以向左查、还能自带「找不到时显示什么」的默认值。VLOOKUP 兼容所有老版本 Excel 和 WPS。
          实际选择很简单：文件要在旧版 Excel 里打开就用 VLOOKUP；环境允许的话优先 XLOOKUP 或 INDEX+MATCH，长期维护的表更不容易被改错。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">公式里的 $ 绝对引用什么时候加？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          $ 的作用是「锁死」行或列：$A$2 锁行又锁列，A$2 只锁行，$A2 只锁列。判断标准只有一个——公式要往下或往右拖动填充时，
          不想让哪个引用跟着变，就给它加 $。例如 =SUMIF($B$2:$B$100,E1,$C$2:$C$100) 里，统计范围加 $ 保持不动，条件 E1 不加 $，
          下拉时自动变成 E2、E3，一条公式就能算多个部门。公式只写在一个单元格里、不拖动填充时，完全不需要 $。
          本工具生成的范围可以按这个规则自行补 $，不影响公式正确性。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">#N/A、#VALUE! 常见报错原因排查</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>#N/A：查找值在查找范围首列里不存在——先查多余空格、全角半角、数字被存成了文本；再确认查找范围确实把查找列包在第一列；最后检查匹配方式是不是误写成了 1 或被省略。</li>
          <li>#VALUE!：多条件场景各范围的行数不一致；返回列序号填了非正整数；TEXT 的格式代码漏了引号或写了不认识的代码。</li>
          <li>#NAME?：函数名拼错；老版本 Excel 用了 XLOOKUP；IF 的文字结果漏了英文双引号。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">SUMIF 和 SUMIFS 有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">SUMIF 只支持一个条件，写法是 SUMIF(条件范围,条件,求和范围)，求和范围在最后；SUMIFS 支持多个条件，写法是 SUMIFS(求和范围,范围1,条件1,范围2,条件2…)，求和范围提到第一个参数。两者参数顺序相反，是最容易记混出错的地方。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">VLOOKUP 返回 #N/A 是怎么回事？</h3>
            <p class="text-sm text-muted-foreground mt-1">最常见的原因：查找值在查找范围第一列不存在（多空格、全角半角不一致）；查找范围没把查找列包进去；返回列序号数错；或匹配方式误写成 1 / 省略导致模糊匹配。本工具默认生成精确匹配（0），范围格式填错时当场红字提示。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">XLOOKUP 和 VLOOKUP 应该用哪个？</h3>
            <p class="text-sm text-muted-foreground mt-1">XLOOKUP 需要 Microsoft 365 / Excel 2021 及以上版本，不用数列号、默认精确匹配、可向左查、自带找不到时的默认值；VLOOKUP 兼容所有老版本。文件要在旧版 Excel/WPS 打开就选 VLOOKUP，否则推荐 XLOOKUP 或 INDEX+MATCH。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'excel-formula-builder'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Table, Copy, CheckCircle, TriangleAlert, ChevronUp, ChevronDown, Info, RefreshCw, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'Excel 公式生成器 - SUMIF/VLOOKUP/XLOOKUP 等十大高频公式一键生成',
  description: '免费在线 Excel 公式生成器：SUMIF、SUMIFS、COUNTIF、COUNTIFS、VLOOKUP、XLOOKUP、INDEX+MATCH、IF 嵌套、TEXT 日期格式、SUBTOTAL 十大高频函数参数化模板，填参数出公式，附每个参数的人话解释与常见坑提示，纯本地运行不联网不调用 AI',
  keywords: 'Excel公式生成器,SUMIF函数,SUMIFS多条件求和,VLOOKUP怎么用,XLOOKUP,INDEX MATCH,IF嵌套,TEXT日期格式化,SUBTOTAL,Excel公式教学',
  author: '有条工具',
  ogTitle: 'Excel 公式生成器 - 十大高频公式一键生成 | 有条工具',
  ogDescription: 'SUMIF、VLOOKUP、XLOOKUP 等十大高频函数参数化模板，填参数出公式，逐参数人话讲解。',
  ogUrl: 'https://www.util.cn/tools/excel-formula-builder',
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
          name: 'Excel 公式生成器',
          url: 'https://www.util.cn/tools/excel-formula-builder',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['SUMIF/SUMIFS 条件求和模板', 'COUNTIF/COUNTIFS 条件计数模板', 'VLOOKUP/XLOOKUP/INDEX+MATCH 查找模板', 'IF 嵌套分档、TEXT 日期格式、SUBTOTAL 筛选统计模板', '范围格式校验与逐参数人话教学', '一键复制公式与教学文本，本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'Excel 公式生成器', item: 'https://www.util.cn/tools/excel-formula-builder/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'SUMIF 和 SUMIFS 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'SUMIF 只支持一个条件，写法是 SUMIF(条件范围,条件,求和范围)，求和范围在最后；SUMIFS 支持多个条件，写法是 SUMIFS(求和范围,范围1,条件1,范围2,条件2…)，求和范围提到第一个参数。两者参数顺序相反，是最容易记混出错的地方。' }
            },
            {
              '@type': 'Question',
              name: 'VLOOKUP 返回 #N/A 是怎么回事？',
              acceptedAnswer: { '@type': 'Answer', text: '最常见的原因：查找值在查找范围第一列不存在（多空格、全角半角不一致）；查找范围没把查找列包进去；返回列序号数错；或匹配方式误写成 1/省略导致模糊匹配。本工具默认生成精确匹配（0），范围格式填错时当场红字提示。' }
            },
            {
              '@type': 'Question',
              name: 'XLOOKUP 和 VLOOKUP 应该用哪个？',
              acceptedAnswer: { '@type': 'Answer', text: 'XLOOKUP 需要 Microsoft 365 / Excel 2021 及以上版本，不用数列号、默认精确匹配、可向左查、自带找不到时的默认值；VLOOKUP 兼容所有老版本。文件要在旧版 Excel/WPS 打开就选 VLOOKUP，否则推荐 XLOOKUP 或 INDEX+MATCH。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 单元格范围校验：A1 / A2:C100 / B:B / $C$2:$C$100 都合法
const CELL_RANGE_RE = /^\$?[A-Z]{1,3}\$?\d*(:\$?[A-Z]{1,3}\$?\d*)?$/
const FULL_COLUMN_RE = /^\$?[A-Z]{1,3}:\$?[A-Z]{1,3}$/

function validateRange(s) {
  const v = String(s ?? '').trim().toUpperCase()
  if (!v) return { ok: false, value: '', message: '还没填' }
  if (CELL_RANGE_RE.test(v) || FULL_COLUMN_RE.test(v)) return { ok: true, value: v, message: '' }
  return { ok: false, value: v, message: '格式不对，示例：A2:C100、B:B、$C$2:$C$100' }
}

// 条件里的英文双引号按 Excel 规则翻倍转义（" → ""）
function escapeCriteria(s) {
  return String(s ?? '').replace(/"/g, '""')
}

// 查找值字面量：纯数字不加引号，其余按文本加引号并转义内部双引号
function quoteLiteral(s) {
  const v = String(s ?? '').trim()
  if (/^-?\d+(\.\d+)?$/.test(v)) return v
  return `"${escapeCriteria(v)}"`
}

// 范围参数统一去空格并转大写（Excel 范围不区分大小写）
function normRange(s) {
  return String(s ?? '').trim().toUpperCase()
}

// 单个参数的错误信息，'' 表示通过
function fieldError(def, value) {
  const v = String(value ?? '').trim()
  if (!v) return def.required === false ? '' : `「${def.label}」还没填`
  if (def.type === 'range' || def.type === 'cell') {
    const r = validateRange(v)
    return r.ok ? '' : `「${def.label}」${r.message}`
  }
  if (def.type === 'number') {
    return (/^\d+$/.test(v) && Number(v) >= 1) ? '' : `「${def.label}」要填从 1 开始的正整数`
  }
  return ''
}

// select 参数显示为选项标签，其余显示原值
function displayValue(def, raw) {
  if (def.options) {
    const hit = def.options.find((o) => o.value === raw)
    return hit ? hit.label : raw
  }
  return raw
}

// 十大高频函数参数化模板
const TEMPLATES = [
  {
    id: 'sumif',
    name: 'SUMIF · 条件求和',
    funcName: 'SUMIF',
    summary: '按一个条件（如部门=销售部）对一列数字求和',
    note: '',
    params: [
      { key: 'range', label: '条件范围', type: 'range', ph: 'B2:B100', explain: '按哪一列来判断，比如按部门筛选就填部门那一列' },
      { key: 'criteria', label: '条件', type: 'criteria', ph: '销售部 或 >=50000', explain: '只统计等于这个值的行；「大于等于 5 万」这类数值条件直接写 >=50000' },
      { key: 'sumRange', label: '求和范围', type: 'range', ph: 'C2:C100', explain: '真正要加总的数字列，行数要和条件范围一一对齐' }
    ],
    build: (p) => `=SUMIF(${normRange(p.range)},"${escapeCriteria(p.criteria)}",${normRange(p.sumRange)})`,
    pits: [
      '条件是文本要带英文双引号；">=50000" 这类数值比较条件也要整体放进引号里。',
      '条件范围和求和范围的行数必须一致，错位后会从错误的单元格取数。'
    ],
    sample: { range: 'B2:B100', criteria: '销售部', sumRange: 'C2:C100' }
  },
  {
    id: 'sumifs',
    name: 'SUMIFS · 多条件求和',
    funcName: 'SUMIFS',
    summary: '多个条件同时满足（并且）才求和，求和范围在第一个参数',
    note: '',
    params: [
      { key: 'sumRange', label: '求和范围', type: 'range', ph: 'C2:C100', explain: '要加总的数字列，注意在 SUMIFS 里它排在第一个参数' }
    ],
    groups: {
      name: '条件组',
      min: 1,
      max: 6,
      initCount: 2,
      addLabel: '加一组条件',
      fields: [
        { key: 'range', label: '范围', type: 'range', ph: 'B2:B100', explain: '这一组条件看哪一列' },
        { key: 'criteria', label: '条件', type: 'criteria', ph: '销售部', explain: '这一组要满足的具体值；多组之间是「并且」关系' }
      ]
    },
    build: (p) => {
      const pairs = p.groups.map((g) => `${normRange(g.range)},"${escapeCriteria(g.criteria)}"`).join(',')
      return `=SUMIFS(${normRange(p.sumRange)},${pairs})`
    },
    pits: [
      'SUMIFS 的求和范围在第一个参数，SUMIF 的在最后——两者参数顺序相反，记混会直接报错。',
      '多个条件是「并且」关系，所有条件都满足的行才被统计；「或」关系要用两个 SUMIF 相加。'
    ],
    sample: { sumRange: 'C2:C100', groups: [ { range: 'B2:B100', criteria: '销售部' }, { range: 'A2:A100', criteria: '张*' } ] }
  },
  {
    id: 'countif',
    name: 'COUNTIF · 条件计数',
    funcName: 'COUNTIF',
    summary: '统计满足一个条件的行数',
    note: '',
    params: [
      { key: 'range', label: '条件范围', type: 'range', ph: 'B2:B100', explain: '按哪一列来判断' },
      { key: 'criteria', label: '条件', type: 'criteria', ph: '销售部 或 >=50000', explain: '统计等于这个值的行数；也支持 >=50000 这类比较条件' }
    ],
    build: (p) => `=COUNTIF(${normRange(p.range)},"${escapeCriteria(p.criteria)}")`,
    pits: [
      '条件支持通配符：* 代表任意多个字符，? 代表单个字符；要查星号或问号本身，前面加波浪号写成 ~*。',
      'COUNTIF 统计的是「个数」不是求和；统计非空单元格个数请用 COUNTA。'
    ],
    sample: { range: 'B2:B100', criteria: '销售部' }
  },
  {
    id: 'countifs',
    name: 'COUNTIFS · 多条件计数',
    funcName: 'COUNTIFS',
    summary: '多个条件同时满足（并且）才计 1 行',
    note: '',
    params: [],
    groups: {
      name: '条件组',
      min: 1,
      max: 6,
      initCount: 2,
      addLabel: '加一组条件',
      fields: [
        { key: 'range', label: '范围', type: 'range', ph: 'B2:B100', explain: '这一组条件看哪一列' },
        { key: 'criteria', label: '条件', type: 'criteria', ph: '销售部', explain: '这一组要满足的具体值；多组之间是「并且」关系' }
      ]
    },
    build: (p) => {
      const pairs = p.groups.map((g) => `${normRange(g.range)},"${escapeCriteria(g.criteria)}"`).join(',')
      return `=COUNTIFS(${pairs})`
    },
    pits: [
      '每组「范围,条件」成对出现，所有范围的行数必须相同，否则报 #VALUE!。',
      '多个条件是「并且」关系；要「或」关系（满足任一即可）请写两个 COUNTIF 相加。'
    ],
    sample: { groups: [ { range: 'B2:B100', criteria: '销售部' }, { range: 'A2:A100', criteria: '张*' } ] }
  },
  {
    id: 'vlookup',
    name: 'VLOOKUP · 查找',
    funcName: 'VLOOKUP',
    summary: '按查找值在区域首列找，返回同一行指定列的内容',
    note: '',
    params: [
      { key: 'lookupValue', label: '查找值', type: 'text', ph: '张三 或 1001', explain: '要找谁；文本会自动加英文双引号，纯数字不加' },
      { key: 'tableRange', label: '查找范围（含返回列）', type: 'range', ph: 'A2:C100', explain: '在哪个矩形区域找，查找值必须落在该区域的第一列' },
      { key: 'colIndex', label: '返回列序号', type: 'number', ph: '3', explain: '从查找范围的第一列数起要取第几列，不是从 A 列数起' },
      {
        key: 'matchType',
        label: '匹配方式',
        type: 'select',
        default: '0',
        warn: '模糊匹配会返回错误结果，除非你的首列已升序排列',
        options: [
          { value: '0', label: '0 · 精确匹配（推荐）' },
          { value: '1', label: '1 · 模糊匹配' }
        ],
        explain: '写 0 是精确匹配；1 是模糊匹配，仅当首列已升序时才可靠'
      }
    ],
    build: (p) => `=VLOOKUP(${quoteLiteral(p.lookupValue)},${normRange(p.tableRange)},${p.colIndex},${p.matchType})`,
    pits: [
      '最后一个参数绝大多数场景必须写 0（精确匹配），写成 1 或省略是模糊匹配，首列没升序时会返回张冠李戴的结果。',
      '返回列序号从查找范围的第一列数起：范围写 B2:D100 时，C 列是第 2 列而不是第 3 列。'
    ],
    sample: { lookupValue: '张三', tableRange: 'A2:C100', colIndex: '3', matchType: '0' }
  },
  {
    id: 'xlookup',
    name: 'XLOOKUP · 查找',
    funcName: 'XLOOKUP',
    summary: '新版查找函数：不用数列号、默认精确匹配、可向左查',
    note: '需要 Microsoft 365 / Excel 2021+',
    params: [
      { key: 'lookupValue', label: '查找值', type: 'text', ph: '张三', explain: '要找谁' },
      { key: 'lookupArray', label: '查找数组', type: 'range', ph: 'A2:A100', explain: '在这一列里找查找值' },
      { key: 'returnArray', label: '返回数组', type: 'range', ph: 'C2:C100', explain: '找到后从这一列取结果，行数要和查找数组一致' },
      { key: 'ifNotFound', label: '找不到时的默认值（选填）', type: 'text', required: false, ph: '未找到', explain: '找不到时显示什么；留空则返回 #N/A 错误' }
    ],
    build: (p) => {
      const base = `=XLOOKUP(${quoteLiteral(p.lookupValue)},${normRange(p.lookupArray)},${normRange(p.returnArray)}`
      const fb = String(p.ifNotFound ?? '').trim()
      return fb ? `${base},"${escapeCriteria(fb)}")` : `${base})`
    },
    pits: [
      '需要 Microsoft 365 / Excel 2021 及以上版本（WPS 部分版本支持），老版本会报 #NAME?。',
      '查找数组和返回数组的行数必须一致、方向相同（都纵向或都横向），否则结果错位。'
    ],
    sample: { lookupValue: '张三', lookupArray: 'A2:A100', returnArray: 'C2:C100', ifNotFound: '未找到' }
  },
  {
    id: 'index-match',
    name: 'INDEX+MATCH · 组合查找',
    funcName: 'INDEX+MATCH',
    summary: '查找列与返回列分开写，比 VLOOKUP 更灵活',
    note: '比 VLOOKUP 更灵活，可向左查',
    params: [
      { key: 'lookupValue', label: '查找值', type: 'text', ph: '张三', explain: '要找谁' },
      { key: 'lookupCol', label: '查找列', type: 'range', ph: 'A2:A100', explain: 'MATCH 在这一列里找查找值的位置' },
      { key: 'returnCol', label: '返回列', type: 'range', ph: 'C2:C100', explain: 'INDEX 从这一列取结果，允许在查找列左边' }
    ],
    build: (p) => `=INDEX(${normRange(p.returnCol)},MATCH(${quoteLiteral(p.lookupValue)},${normRange(p.lookupCol)},0))`,
    pits: [
      'MATCH 的第三参数必须写 0（精确匹配），省略或写 1 是模糊匹配。',
      '查找列与返回列的行数要一致；返回列可以在查找列左边，这是它相对 VLOOKUP 的最大优势。'
    ],
    sample: { lookupValue: '张三', lookupCol: 'A2:A100', returnCol: 'C2:C100' }
  },
  {
    id: 'if-tier',
    name: 'IF 嵌套 · 分档判断',
    funcName: 'IF',
    summary: '按数值分档返回不同文字，如优秀 / 合格 / 待改进',
    note: '',
    params: [
      { key: 'valueCell', label: '值单元格', type: 'cell', ph: 'C2', explain: '被判断的数字在哪个单元格' },
      { key: 'fallback', label: '兜底值', type: 'text', ph: '待改进', afterGroups: true, explain: '前面所有档位都不满足时显示的内容' }
    ],
    groups: {
      name: '档位',
      min: 2,
      max: 3,
      initCount: 2,
      addLabel: '加一档',
      fields: [
        { key: 'cond', label: '条件', type: 'expr', ph: 'C2>=100000', explain: '满足这个比较条件就返回同组的结果，不用加引号' },
        { key: 'result', label: '结果', type: 'text', ph: '优秀', explain: '条件命中时显示的内容，文本会自动加双引号' }
      ]
    },
    build: (p) => {
      let inner = quoteLiteral(p.fallback)
      const gs = p.groups
      for (let i = gs.length - 1; i >= 0; i--) {
        inner = `IF(${String(gs[i].cond).trim()},"${escapeCriteria(gs[i].result)}",${inner})`
      }
      return `=${inner}`
    },
    pits: [
      '档位条件要按从高到低排列：IF 从第一个条件开始判断，命中即停止，顺序错了高数值会被低档截胡。',
      '判断条件（C2>=100000）不加引号，文字结果要加英文双引号；漏引号会报 #NAME?。'
    ],
    sample: { valueCell: 'C2', groups: [ { cond: 'C2>=100000', result: '优秀' }, { cond: 'C2>=50000', result: '合格' } ], fallback: '待改进' }
  },
  {
    id: 'text-format',
    name: 'TEXT · 日期格式化',
    funcName: 'TEXT',
    summary: '把日期变成指定格式的文字，如 2026年11月3日',
    note: '',
    params: [
      { key: 'dateCell', label: '日期单元格', type: 'cell', ph: 'A2', explain: '要格式化的日期在哪个单元格' },
      {
        key: 'formatCode',
        label: '格式代码',
        type: 'select',
        default: 'yyyy年m月d日',
        options: [
          { value: 'yyyy-mm-dd', label: 'yyyy-mm-dd（2026-11-03）' },
          { value: 'yyyy年m月d日', label: 'yyyy年m月d日（2026年11月3日）' },
          { value: 'aaa', label: 'aaa（周二 · 中文短星期）' },
          { value: 'm月d日', label: 'm月d日（11月3日）' }
        ],
        explain: '日期显示成什么样子，代码含义见下方速查表'
      }
    ],
    build: (p) => `=TEXT(${normRange(p.dateCell)},"${p.formatCode}")`,
    pits: [
      'TEXT 的结果是文字，不再是真日期，不能直接拿去加减天数；要计算请保留原日期列。',
      '中文星期用 aaa（周二）或 aaaa（星期二）；ddd / dddd 是英文星期，别混用。'
    ],
    sample: { dateCell: 'A2', formatCode: 'yyyy年m月d日' }
  },
  {
    id: 'subtotal',
    name: 'SUBTOTAL · 筛选统计',
    funcName: 'SUBTOTAL',
    summary: '只统计筛选后可见的行，常配合筛选做动态合计',
    note: '配合筛选使用，只统计可见行',
    params: [
      {
        key: 'funcCode',
        label: '功能码',
        type: 'select',
        default: '9',
        options: [
          { value: '9', label: '9 · 求和' },
          { value: '1', label: '1 · 平均' },
          { value: '2', label: '2 · 计数' },
          { value: '109', label: '109 · 忽略隐藏求和' }
        ],
        explain: '对可见行做什么统计；9 只忽略筛选掉的行，109 连手动隐藏的行也忽略'
      },
      { key: 'range', label: '范围', type: 'range', ph: 'C2:C100', explain: '要统计的数据范围' }
    ],
    build: (p) => `=SUBTOTAL(${p.funcCode},${normRange(p.range)})`,
    pits: [
      '功能码 9 只忽略「筛选」隐藏的行，手动右键隐藏的行照样计入；连手动隐藏也要忽略就用 109。',
      'SUBTOTAL 会自动忽略区域里嵌套的 SUBTOTAL 结果，做合计行时不会重复统计小计。'
    ],
    sample: { funcCode: '9', range: 'C2:C100' }
  }
]

// 汇总当前模板所有参数错误
function collectErrors(tpl, params) {
  const errs = []
  for (const def of tpl.params) {
    const msg = fieldError(def, params[def.key])
    if (msg) errs.push(msg)
  }
  if (tpl.groups) {
    const gs = Array.isArray(params.groups) ? params.groups : []
    if (gs.length < tpl.groups.min) errs.push(`${tpl.groups.name}至少需要 ${tpl.groups.min} 组`)
    gs.forEach((g, i) => {
      tpl.groups.fields.forEach((f) => {
        const msg = fieldError(f, g[f.key])
        if (msg) errs.push(`${tpl.groups.name} ${i + 1}：${msg}`)
      })
    })
  }
  return errs
}

// 逐参数教学列表（静态参数 → 条件组 → afterGroups 标记的收尾参数）
function stepsOf(tpl, params) {
  const out = []
  const pushParam = (def) => {
    out.push({ param: def.label, value: displayValue(def, String(params[def.key] ?? '').trim()), explain: def.explain })
  }
  tpl.params.filter((d) => !d.afterGroups).forEach(pushParam)
  if (tpl.groups) {
    const gs = Array.isArray(params.groups) ? params.groups : []
    gs.forEach((g, i) => {
      tpl.groups.fields.forEach((f) => {
        out.push({ param: `${tpl.groups.name} ${i + 1} · ${f.label}`, value: displayValue(f, String(g[f.key] ?? '').trim()), explain: f.explain })
      })
    })
  }
  tpl.params.filter((d) => d.afterGroups).forEach(pushParam)
  return out
}

// 核心：拼公式 + 逐参数教学；参数不合法时返回 errors
function buildFormula(templateId, params) {
  const tpl = TEMPLATES.find((t) => t.id === templateId)
  if (!tpl) return { formula: '', steps: [], errors: ['未知的公式模板'] }
  const errors = collectErrors(tpl, params || {})
  if (errors.length) return { formula: '', steps: [], errors }
  return { formula: tpl.build(params), steps: stepsOf(tpl, params), errors: [] }
}

// 可复制的「公式 + 参数说明」文本版
function buildTeachingText(result) {
  if (!result || !result.formula) return '先把必填参数补全，再复制教学版。'
  const lines = ['【Excel 公式】', result.formula, '', '【每个参数是什么意思】']
  result.steps.forEach((s, i) => {
    lines.push(`${i + 1}. ${s.param}：${s.value} —— ${s.explain}`)
  })
  lines.push('')
  lines.push('示例假设：A 列=姓名，B 列=部门，C 列=销售额，A2:C100 为数据区；范围与你不同时替换成自己的即可。')
  return lines.join('\n')
}

// ---------- 页面状态与交互 ----------
const seoContentVisible = ref(true)
const selectedId = ref(TEMPLATES[0].id)
const values = ref({})
const groups = ref([])
const copiedField = ref('')
let copiedTimer = null

// 模板初始值：select 用默认项，其余留空
function initialValuesFor(tpl) {
  const vals = {}
  tpl.params.forEach((def) => { vals[def.key] = def.options ? (def.default ?? '') : '' })
  return vals
}

// 条件组初始数组（每组字段全部留空）
function initialGroupsFor(tpl) {
  if (!tpl.groups) return []
  return Array.from({ length: tpl.groups.initCount }, () => {
    const o = {}
    tpl.groups.fields.forEach((f) => { o[f.key] = '' })
    return o
  })
}

function applyTemplate(tpl) {
  values.value = initialValuesFor(tpl)
  groups.value = initialGroupsFor(tpl)
}

applyTemplate(TEMPLATES[0])

const currentTemplate = computed(() => TEMPLATES.find((t) => t.id === selectedId.value) || TEMPLATES[0])
const currentParams = computed(() => {
  const p = {}
  currentTemplate.value.params.forEach((def) => { p[def.key] = values.value[def.key] })
  if (currentTemplate.value.groups) {
    p.groups = groups.value.map((g) => {
      const o = {}
      currentTemplate.value.groups.fields.forEach((f) => { o[f.key] = g[f.key] })
      return o
    })
  }
  return p
})
const formulaResult = computed(() => buildFormula(selectedId.value, currentParams.value))
const staticErrors = computed(() => {
  const errs = {}
  currentTemplate.value.params.forEach((def) => {
    const msg = fieldError(def, values.value[def.key])
    if (msg) errs[def.key] = msg
  })
  return errs
})
const groupErrors = computed(() => {
  const cfg = currentTemplate.value.groups
  if (!cfg) return []
  return groups.value.map((g) => {
    const o = {}
    cfg.fields.forEach((f) => {
      const msg = fieldError(f, g[f.key])
      if (msg) o[f.key] = msg
    })
    return o
  })
})
const canAddGroup = computed(() => {
  const cfg = currentTemplate.value.groups
  return !!cfg && groups.value.length < cfg.max
})

function onSelectChange(e) {
  selectTemplate(e.target.value)
}

function selectTemplate(id) {
  const tpl = TEMPLATES.find((t) => t.id === id)
  if (!tpl) return
  selectedId.value = tpl.id
  applyTemplate(tpl)
}

// 载入当前模板的完整示例参数
function loadSample() {
  const tpl = currentTemplate.value
  const s = tpl.sample || {}
  const vals = initialValuesFor(tpl)
  tpl.params.forEach((def) => {
    if (typeof s[def.key] === 'string') vals[def.key] = s[def.key]
  })
  values.value = vals
  groups.value = tpl.groups && Array.isArray(s.groups)
    ? s.groups.map((g) => {
        const o = {}
        tpl.groups.fields.forEach((f) => { o[f.key] = typeof g[f.key] === 'string' ? g[f.key] : '' })
        return o
      })
    : initialGroupsFor(tpl)
}

// 清空当前模板全部参数
function resetParams() {
  applyTemplate(currentTemplate.value)
}

function addGroup() {
  const cfg = currentTemplate.value.groups
  if (!cfg || groups.value.length >= cfg.max) return
  const o = {}
  cfg.fields.forEach((f) => { o[f.key] = '' })
  groups.value = [...groups.value, o]
}

function removeGroup(i) {
  const cfg = currentTemplate.value.groups
  if (!cfg || groups.value.length <= cfg.min) return
  groups.value = groups.value.filter((_, idx) => idx !== i)
}

// 复制到剪贴板（回调中执行，SSR 安全），完成后 alert 提示
function copyResult(kind) {
  const text = kind === 'formula' ? formulaResult.value.formula : buildTeachingText(formulaResult.value)
  if (!text) {
    alert('还没有可复制的公式，先把左侧必填参数补全。')
    return
  }
  const finish = (ok) => {
    if (ok) {
      copiedField.value = kind
      alert(kind === 'formula' ? '公式已复制到剪贴板' : '教学版已复制到剪贴板')
      if (copiedTimer) clearTimeout(copiedTimer)
      copiedTimer = setTimeout(() => { copiedField.value = '' }, 1600)
    } else {
      alert('复制失败，请手动选中公式文本复制。')
    }
  }
  const fallbackCopy = () => {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      finish(ok)
    } catch (e) {
      finish(false)
    }
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => finish(true)).catch(fallbackCopy)
  } else {
    fallbackCopy()
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 本地记忆（localStorage，全部 try/catch 包裹） ----------
const STORAGE_KEY = 'util-excel-formula-builder-v1'

function saveLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: selectedId.value, values: values.value, groups: groups.value }))
  } catch (e) { /* 本地存储不可用时忽略 */ }
}

function restoreLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    const tpl = TEMPLATES.find((t) => t.id === saved.id)
    if (!tpl || !saved.values || typeof saved.values !== 'object') return
    selectedId.value = tpl.id
    applyTemplate(tpl)
    tpl.params.forEach((def) => {
      if (typeof saved.values[def.key] === 'string') values.value[def.key] = saved.values[def.key]
    })
    if (tpl.groups && Array.isArray(saved.groups)) {
      const restored = saved.groups
        .filter((g) => g && typeof g === 'object')
        .slice(0, tpl.groups.max)
        .map((g) => {
          const o = {}
          tpl.groups.fields.forEach((f) => { o[f.key] = typeof g[f.key] === 'string' ? g[f.key] : '' })
          return o
        })
      while (restored.length < tpl.groups.min) {
        const o = {}
        tpl.groups.fields.forEach((f) => { o[f.key] = '' })
        restored.push(o)
      }
      groups.value = restored
    }
  } catch (e) { /* 忽略本地缓存读取失败 */ }
}

watch([selectedId, values, groups], saveLocal, { deep: true })

onMounted(() => {
  addRecentTool('excel-formula-builder')
  restoreLocal()
})

onBeforeUnmount(() => {
  if (copiedTimer) {
    clearTimeout(copiedTimer)
    copiedTimer = null
  }
})
</script>
