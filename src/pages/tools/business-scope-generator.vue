<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Briefcase class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">经营范围生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">按行业勾选规范表述条目，一键起草营业执照经营范围（一般项目 / 许可项目分段 + 官方尾注），注册前准备不踩坑</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线经营范围生成器：内置餐饮、零售、电商贸易、软件开发、广告传媒、物流运输、建筑施工等 12+ 行业模板库，
        条目均按市场监管总局《经营范围规范表述目录》常见公开整理稿编写，勾选后自动生成「一般项目：…（除依法须经批准的项目外，凭营业执照依法自主开展经营活动）
        许可项目：…（依法须经批准的项目，经相关部门批准后方可开展经营活动，具体经营项目以审批结果为准）」的标准两段式文本，
        支持自定义条目、关键词搜索、去重合并与一键复制 / 下载。全部在浏览器本地完成，不上传任何经营信息。
      </p>
    </div>

    <!-- 显著免责条 -->
    <div class="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
      <TriangleAlert class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-sm text-foreground leading-relaxed">
        经营范围最终表述以市场监管部门《经营范围规范表述查询系统》核定为准；涉及许可项目须先取得相关审批。本工具按公开的规范表述整理，仅供注册前起草参考，不构成法律意见。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：行业与条目选择 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Briefcase class="w-5 h-5 mr-2 text-primary" /> 行业与条目选择
        </h2>

        <!-- 搜索过滤 -->
        <div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索条目关键词，如「销售」「培训」「运输」"
            class="w-full px-3 py-2 rounded-lg border border-border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <!-- 行业多选 chips -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">行业模板（可多选，已选 {{ activeIndustries.length }} 个）</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in INDUSTRY_PRESETS"
              :key="preset.id"
              @click="toggleIndustry(preset.id)"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-medium transition"
              :class="activeIndustryIds.includes(preset.id)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'"
            >
              <CheckCircle v-if="activeIndustryIds.includes(preset.id)" class="w-3.5 h-3.5" />
              {{ preset.name }}
            </button>
          </div>
        </div>

        <!-- 已选行业的条目列表（一般 / 许可分列） -->
        <div v-if="visibleGroups.length" class="space-y-4">
          <div v-for="group in visibleGroups" :key="group.id" class="border border-border rounded-lg p-4 space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-foreground">{{ group.name }}</h3>
              <button
                @click="selectAllInGroup(group)"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border transition"
              >
                <Plus class="w-3.5 h-3.5" /> 全选本行业
              </button>
            </div>

            <div v-if="group.generalItems.length">
              <p class="text-xs font-medium text-green-600 dark:text-green-400 mb-1.5">一般项目</p>
              <label
                v-for="item in group.generalItems"
                :key="item.text"
                class="flex items-start gap-2 py-1 cursor-pointer group/item"
              >
                <input type="checkbox" :checked="!!checked[item.text]" @change="toggleItem(item)" class="w-4 h-4 mt-0.5 rounded border border-border accent-primary flex-shrink-0" />
                <span class="text-sm text-foreground leading-snug">{{ item.text }}</span>
              </label>
            </div>

            <div v-if="group.licensedItems.length">
              <p class="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1.5">许可项目</p>
              <label
                v-for="item in group.licensedItems"
                :key="item.text"
                class="flex items-start gap-2 py-1 cursor-pointer"
              >
                <input type="checkbox" :checked="!!checked[item.text]" @change="toggleItem(item)" class="w-4 h-4 mt-0.5 rounded border border-border accent-amber-500 flex-shrink-0" />
                <span class="text-sm text-foreground leading-snug">
                  {{ item.text }}
                  <span v-if="item.license" class="block text-xs text-amber-600 dark:text-amber-400 mt-0.5">{{ item.license }}</span>
                </span>
              </label>
            </div>

            <p v-if="!group.generalItems.length && !group.licensedItems.length" class="text-xs text-muted-foreground">
              没有匹配「{{ searchQuery }}」的条目
            </p>
          </div>
        </div>
        <p v-else class="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
          <span>点选上方行业标签后，这里会列出该行业的规范表述条目供勾选；也可以直接在下方的文本框写自定义条目。</span>
        </p>

        <!-- 自定义条目 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">自定义条目（每行一条，归入一般项目）</p>
          <textarea
            v-model="customText"
            rows="4"
            placeholder="例如：&#10;新能源汽车废旧动力蓄电池回收及梯次利用（不含危险废物经营）&#10;宠物食品及用品零售"
            class="w-full px-3 py-2 rounded-lg border border-border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
          ></textarea>
          <div v-if="customLineStates.length" class="mt-2 space-y-1">
            <p
              v-for="(line, idx) in customLineStates"
              :key="idx"
              class="text-xs flex items-start gap-1.5"
              :class="line.issue ? (line.issue.level === 'error' ? 'text-red-500' : 'text-amber-600 dark:text-amber-400') : 'text-muted-foreground'"
            >
              <TriangleAlert v-if="line.issue" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span class="break-all">{{ line.text || '（空行）' }}<template v-if="line.issue"> — {{ line.issue.message }}</template></span>
            </p>
          </div>
        </div>

        <!-- 上限提示 -->
        <p v-if="overLimitHint" class="text-xs text-red-500 bg-red-500/10 rounded-lg p-2.5 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ overLimitHint }}</span>
        </p>
      </div>

      <!-- 右：生成结果（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-lg font-semibold flex items-center">
              <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 生成的经营范围
            </h2>
            <div class="flex flex-wrap items-center gap-2">
              <button
                @click="copyScope"
                :disabled="!scopeText"
                class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground rounded-lg text-sm font-medium transition"
              >
                <Copy class="w-4 h-4" /> 复制全文
              </button>
              <button
                @click="downloadTxt"
                :disabled="!scopeText"
                class="inline-flex items-center gap-1.5 px-4 py-2 bg-muted hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed border border-border rounded-lg text-sm font-medium text-foreground transition"
              >
                下载 .txt
              </button>
              <button
                @click="resetAll"
                class="inline-flex items-center gap-1.5 px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
              >
                <RefreshCw class="w-4 h-4" /> 重置
              </button>
            </div>
          </div>

          <!-- 统计条 -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">一般项目</p>
              <p class="text-xl font-bold text-green-600 dark:text-green-400">{{ stats.general }} 条</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">许可项目</p>
              <p class="text-xl font-bold text-amber-600 dark:text-amber-400">{{ stats.licensed }} 条</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">其中自定义</p>
              <p class="text-xl font-bold text-foreground">{{ stats.custom }} 条</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">合计（上限 50）</p>
              <p class="text-xl font-bold text-primary">{{ stats.total }} 条</p>
            </div>
          </div>

          <!-- 执照风结果卡 -->
          <div v-if="scopeText" class="border-2 border-slate-300 dark:border-slate-600 rounded-lg p-5 sm:p-6 bg-background space-y-4">
            <div v-if="sel.general.length" class="space-y-2">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30">
                <CheckCircle class="w-3 h-3" /> 一般项目 · 领照即可经营
              </span>
              <p class="text-sm leading-7 text-foreground whitespace-pre-wrap break-all">
                一般项目：{{ sel.general.join('；') }}。{{ GENERAL_NOTE }}
              </p>
            </div>
            <div v-if="sel.licensed.length" class="space-y-2">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <TriangleAlert class="w-3 h-3" /> 许可项目 · 须先取得审批
              </span>
              <p class="text-sm leading-7 text-foreground whitespace-pre-wrap break-all">
                许可项目：{{ sel.licensed.join('；') }}。{{ LICENSED_NOTE }}
              </p>
              <ul class="space-y-1">
                <li v-for="item in sel.licensed" :key="item" class="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                  <TriangleAlert class="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>「{{ item }}」{{ LICENSE_LOOKUP[item] || '须在登记前取得对应许可审批' }}</span>
                </li>
              </ul>
            </div>
            <div class="pt-2 border-t border-border">
              <p class="text-[10px] text-muted-foreground leading-relaxed">
                以上文本按《经营范围规范表述目录》常见公开整理稿生成，申报前请在官方规范系统逐条核对；登记时可全选复制粘贴至全程电子化登记平台。
              </p>
            </div>
          </div>

          <!-- 空态 -->
          <div v-else class="rounded-xl border-2 border-dashed border-border bg-muted/30 p-10 text-center space-y-2">
            <Briefcase class="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p class="text-sm font-medium text-muted-foreground">还没有生成任何经营范围文本</p>
            <p class="text-xs text-muted-foreground/70">在左侧勾选行业条目或填写自定义条目，结果会实时出现在这里</p>
          </div>
        </div>

        <!-- 许可项目警示静态卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-base font-semibold flex items-center">
            <TriangleAlert class="w-5 h-5 mr-2 text-amber-500" /> 常见许可项目与对应审批（映射示例）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div v-for="row in LICENSE_GUIDE" :key="row.license" class="bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-xs leading-relaxed">
              <p class="font-medium text-foreground">{{ row.trigger }}</p>
              <p class="text-muted-foreground mt-0.5">→ {{ row.license }}</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            许可项目实行「先照后证」为主：营业执照可先登记经营范围，但实际经营前必须取得对应许可证；部分前置审批项目（如金融、危化品）须先行取得批准文件。未获审批即开展许可项目经营属无证经营，会被没收违法所得并处罚款。
          </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>经营范围生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          经营范围是营业执照上对企业经营方向的法定表述，如今全国已统一改用「规范表述条目」登记：申请人不再自由书写，
          而是从市场监管总局《经营范围规范表述目录》中勾选标准条目，系统自动归集为「一般项目」与「许可项目」两段，
          并各自附加固定尾注。本工具按该目录的常见公开整理稿内置 12+ 行业模板，勾选即生成可直接粘贴到登记平台的规范文本，
          帮助创业者在核名、注册前快速起草一份「该写的都写上、不该踩坑的不写」的经营范围。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">经营范围写多写少，到底有什么影响？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>不是越多越好：条目过多可能触发额外许可审批、行业监管或税率核定关注，投标、开票时也会被询问与实际业务无关的条目。</li>
          <li>也不能嫌少：没登记的品类不能开票经营，后期新增业务要办经营范围变更登记；电商、直播带货还常被平台要求经营范围覆盖对应品类。</li>
          <li>建议口径：主营业务放第一位（影响行业分类与名称核定），近 1-2 年确定或大概率会做的业务都写上，纯许可项目按实际需要再加。</li>
          <li>排序有讲究：第一项通常决定企业所属行业代码，影响发票品目、统计归类乃至部分税收优惠适用。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">一般项目和许可项目有什么区别？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一般项目领照即可自主经营，尾注固定为「除依法须经批准的项目外，凭营业执照依法自主开展经营活动」；
          许可项目涉及食品、运输、电信、教育培训等需要行业主管部门审批的领域，尾注为
          「依法须经批准的项目，经相关部门批准后方可开展经营活动，具体经营项目以审批结果为准」。
          两段各自独立成句，只在存在对应条目时输出——本工具生成的文本严格遵守这一格式。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">经营范围登记后还能变更吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          可以：增减经营项目只需向登记机关申请经营范围变更登记，换发新营业执照即可；涉及许可项目的，先取得（或注销）对应许可证再办理登记。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">官方规范表述去哪查？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          国家市场监督管理总局「经营范围规范表述查询系统」（可通过各地企业全程电子化登记平台、政务服务网经营范围规范表述模块进入，
          小程序端也有「经营范围规范表述查询」入口），支持按关键词检索条目、查看每条对应许可审批部门与后置批文，
          并可组合生成一整段经营范围文本复制到登记表单。本工具条目即为该目录的常见公开整理稿，正式申报前请以官方系统实时结果逐条核对。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">个体工商户和公司的经营范围写法有差别吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两者共用同一套规范表述目录，勾选条目一致；差别在于：个体户多数地区登记时不强制区分两段尾注、也不能经营部分仅允许企业经营的许可项目（如金融、
          道路运输的部分类别）；个体户字号不带「公司」字样、责任形式为个人（家庭）无限责任，公司在名称中须含「有限公司」并对登记经营范围承担有限责任。
          电商、餐饮等常见业务建议个体户起步时同样把品类条目写全。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">经营范围是不是写得越多越好？</h3>
            <p class="text-sm text-muted-foreground mt-1">不是。条目应与当前业务及近一两年的拓展计划匹配：无关的许可条目会平添审批负担，过多杂项还可能引起行业监管与开票口径疑问；但主业的上下游品类建议一次写全，免得频繁办变更登记。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">只勾选了一般项目，文本里会出现「许可项目」字样吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。生成器严格按登记格式输出：只有存在许可条目时才追加「许可项目：…（依法须经批准的项目…为准）」这一段，仅有一般项目时完整保留其尾注。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">生成的文本可以直接用于工商申报吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">可作为起草稿直接粘贴到各地全程电子化登记平台，但登记机关会按《经营范围规范表述查询系统》实时库核定，个别条目可能因地区目录版本差异被替换或要求补充审批信息，提交前请在官方系统逐条核对，涉及许可项目须先取得审批。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'business-scope-generator'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Briefcase, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Copy, Plus
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '经营范围生成器 - 公司注册营业执照经营范围规范表述起草工具',
  description: '免费在线经营范围生成器，按餐饮/零售/电商/软件开发/广告/物流/建筑等12+行业勾选规范表述条目，自动分列一般项目与许可项目并附加官方尾注，支持自定义条目、去重、复制与下载txt，注册前起草必备，纯浏览器本地运行不上传',
  keywords: '经营范围生成器,营业执照经营范围,公司注册经营范围,经营范围规范表述,一般项目许可项目',
  author: '有条工具',
  ogTitle: '经营范围生成器 - 公司注册营业执照经营范围规范表述起草工具 | 有条工具',
  ogDescription: '12+ 行业规范表述模板，勾选即生成「一般项目/许可项目」两段式经营范围文本，含官方尾注与许可审批提示。',
  ogUrl: 'https://www.util.cn/tools/business-scope-generator',
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
          name: '经营范围生成器',
          url: 'https://www.util.cn/tools/business-scope-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['12+ 行业规范表述模板', '一般/许可项目自动分列', '官方尾注逐字生成', '自定义条目实时校验', '跨行业去重合并', '复制全文与下载 txt', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '经营范围生成器', item: 'https://www.util.cn/tools/business-scope-generator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '经营范围是不是写得越多越好？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。条目应与当前业务及近一两年的拓展计划匹配：无关的许可条目会平添审批负担，过多杂项还可能引起行业监管与开票口径疑问；但主业的上下游品类建议一次写全，免得频繁办变更登记。' }
            },
            {
              '@type': 'Question',
              name: '只勾选一般项目，文本里会出现「许可项目」字样吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。生成器严格按登记格式输出：只有存在许可条目时才追加「许可项目：…（依法须经批准的项目，经相关部门批准后方可开展经营活动，具体经营项目以审批结果为准）」这一段。' }
            },
            {
              '@type': 'Question',
              name: '生成的文本可以直接用于工商申报吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可作为起草稿粘贴到各地全程电子化登记平台，但登记机关会按《经营范围规范表述查询系统》实时库核定，个别条目可能因地区目录版本差异被替换或要求补充审批信息，提交前请在官方系统逐条核对。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MAX_ITEMS = 50 // 经营范围条目上限
const GENERAL_NOTE = '（除依法须经批准的项目外，凭营业执照依法自主开展经营活动）'
const LICENSED_NOTE = '（依法须经批准的项目，经相关部门批准后方可开展经营活动，具体经营项目以审批结果为准）'

// 行业模板库：条目取自《经营范围规范表述目录》常见公开整理稿
// kind: 'general' 一般项目 | 'licensed' 许可项目（license 为审批提示）
const INDUSTRY_PRESETS = [
  {
    id: 'catering', name: '餐饮',
    items: [
      { text: '餐饮管理', kind: 'general' },
      { text: '外卖递送服务', kind: 'general' },
      { text: '食用农产品零售', kind: 'general' },
      { text: '厨具卫具及日用杂品零售', kind: 'general' },
      { text: '专业保洁、清洗、消毒服务', kind: 'general' },
      { text: '会议及展览服务', kind: 'general' },
      { text: '餐饮服务', kind: 'licensed', license: '需取得《食品经营许可证》后方可从事餐饮制作与销售' },
      { text: '酒类经营', kind: 'licensed', license: '需取得含酒类项目的《食品经营许可证》' },
      { text: '食品销售', kind: 'licensed', license: '需取得《食品经营许可证》（仅销售预包装食品的改为备案）' }
    ]
  },
  {
    id: 'retail', name: '零售',
    items: [
      { text: '日用百货销售', kind: 'general' },
      { text: '服装服饰零售', kind: 'general' },
      { text: '鞋帽零售', kind: 'general' },
      { text: '化妆品零售', kind: 'general' },
      { text: '五金产品零售', kind: 'general' },
      { text: '办公用品销售', kind: 'general' },
      { text: '体育用品及器材零售', kind: 'general' },
      { text: '玩具销售', kind: 'general' },
      { text: '出版物零售', kind: 'licensed', license: '需取得《出版物经营许可证》' },
      { text: '酒类经营', kind: 'licensed', license: '需取得含酒类项目的《食品经营许可证》' }
    ]
  },
  {
    id: 'ecommerce', name: '电商贸易',
    items: [
      { text: '互联网销售（除销售需要许可的商品）', kind: 'general' },
      { text: '国内贸易代理', kind: 'general' },
      { text: '进出口代理', kind: 'general' },
      { text: '供应链管理服务', kind: 'general' },
      { text: '采购代理服务', kind: 'general' },
      { text: '信息咨询服务（不含许可类信息咨询服务）', kind: 'general' },
      { text: '食品互联网销售', kind: 'licensed', license: '线上销售食品需取得《食品经营许可证》并办理网络经营备案' },
      { text: '增值电信业务', kind: 'licensed', license: '需取得《增值电信业务经营许可证》（ICP 等）' }
    ]
  },
  {
    id: 'software', name: '软件开发',
    items: [
      { text: '软件开发', kind: 'general' },
      { text: '技术服务、技术开发、技术咨询、技术交流、技术转让、技术推广', kind: 'general' },
      { text: '软件销售', kind: 'general' },
      { text: '信息系统集成服务', kind: 'general' },
      { text: '信息技术咨询服务', kind: 'general' },
      { text: '计算机软硬件及辅助设备零售', kind: 'general' },
      { text: '数据处理和存储支持服务', kind: 'general' },
      { text: '互联网信息服务', kind: 'licensed', license: '经营性互联网信息服务需取得《增值电信业务经营许可证》（ICP）' }
    ]
  },
  {
    id: 'it-service', name: '信息技术服务',
    items: [
      { text: '信息技术咨询服务', kind: 'general' },
      { text: '信息系统运行维护服务', kind: 'general' },
      { text: '计算机系统服务', kind: 'general' },
      { text: '网络与信息安全软件开发', kind: 'general' },
      { text: '人工智能应用软件开发', kind: 'general' },
      { text: '互联网数据服务', kind: 'general' },
      { text: '软件外包服务', kind: 'general' },
      { text: '在线数据处理与交易处理业务', kind: 'licensed', license: '属增值电信业务，需取得《增值电信业务经营许可证》' },
      { text: '互联网信息服务', kind: 'licensed', license: '经营性互联网信息服务需取得《增值电信业务经营许可证》（ICP）' }
    ]
  },
  {
    id: 'advertising', name: '广告传媒',
    items: [
      { text: '广告设计、代理', kind: 'general' },
      { text: '广告制作', kind: 'general' },
      { text: '广告发布（非广播电台、电视台、报刊出版单位）', kind: 'general' },
      { text: '平面设计', kind: 'general' },
      { text: '企业形象策划', kind: 'general' },
      { text: '市场营销策划', kind: 'general' },
      { text: '会议及展览服务', kind: 'general' },
      { text: '广播电视节目制作经营', kind: 'licensed', license: '需取得《广播电视节目制作经营许可证》' },
      { text: '互联网信息服务', kind: 'licensed', license: '经营性互联网信息服务需取得《增值电信业务经营许可证》（ICP）' }
    ]
  },
  {
    id: 'consulting', name: '咨询',
    items: [
      { text: '企业管理咨询', kind: 'general' },
      { text: '信息咨询服务（不含许可类信息咨询服务）', kind: 'general' },
      { text: '教育咨询服务（不含涉许可审批的教育培训活动）', kind: 'general' },
      { text: '法律咨询（不含依法须律师事务所执业许可的业务）', kind: 'general' },
      { text: '商务代理代办服务', kind: 'general' },
      { text: '市场调查（不含涉外调查）', kind: 'general' },
      { text: '财务咨询', kind: 'general' },
      { text: '代理记账', kind: 'licensed', license: '需取得财政部门核发的《代理记账许可证书》' }
    ]
  },
  {
    id: 'education', name: '教育培训（非学科）',
    items: [
      { text: '教育咨询服务（不含涉许可审批的教育培训活动）', kind: 'general' },
      { text: '组织文化艺术交流活动', kind: 'general' },
      { text: '体育竞赛组织', kind: 'general' },
      { text: '健身休闲活动', kind: 'general' },
      { text: '中小学生校外托管服务（不含餐饮、住宿、文化教育培训）', kind: 'general' },
      { text: '体验式拓展活动及策划', kind: 'general' },
      { text: '从事艺术类非学历技能培训业务', kind: 'licensed', license: '艺术类校外培训需经文旅部门审核取得办学许可' },
      { text: '从事体育类非学历技能培训业务', kind: 'licensed', license: '体育类校外培训需经体育部门审核取得相应许可' },
      { text: '职业技能培训', kind: 'licensed', license: '需取得人社部门《民办学校办学许可证》' }
    ]
  },
  {
    id: 'housekeeping', name: '家政服务',
    items: [
      { text: '家政服务', kind: 'general' },
      { text: '专业保洁、清洗、消毒服务', kind: 'general' },
      { text: '建筑物清洁服务', kind: 'general' },
      { text: '母婴生活护理（不含医疗服务）', kind: 'general' },
      { text: '养老服务', kind: 'general' },
      { text: '日用电器修理', kind: 'general' },
      { text: '搬家服务（不含运输类许可项目）', kind: 'general' },
      { text: '劳务派遣服务', kind: 'licensed', license: '需取得《劳务派遣经营许可证》' },
      { text: '职业中介活动', kind: 'licensed', license: '需取得《人力资源服务许可证》' }
    ]
  },
  {
    id: 'logistics', name: '物流运输',
    items: [
      { text: '国内货物运输代理', kind: 'general' },
      { text: '普通货物仓储服务（不含危险化学品等需许可审批的项目）', kind: 'general' },
      { text: '装卸搬运', kind: 'general' },
      { text: '包装服务', kind: 'general' },
      { text: '供应链管理服务', kind: 'general' },
      { text: '运输货物打包服务', kind: 'general' },
      { text: '道路货物运输（不含网络货运）', kind: 'licensed', license: '需取得《道路运输经营许可证》及车辆营运证' },
      { text: '快递服务', kind: 'licensed', license: '需取得《快递业务经营许可证》' },
      { text: '食品互联网销售', kind: 'licensed', license: '冷链配送食品需取得《食品经营许可证》' }
    ]
  },
  {
    id: 'construction', name: '建筑施工',
    items: [
      { text: '土石方工程施工', kind: 'general' },
      { text: '金属门窗工程施工', kind: 'general' },
      { text: '工程管理服务', kind: 'general' },
      { text: '建筑材料销售', kind: 'general' },
      { text: '机械设备租赁', kind: 'general' },
      { text: '专业设计服务', kind: 'general' },
      { text: '住宅室内装饰装修', kind: 'licensed', license: '需取得建筑装饰装修相关资质并按当地要求备案' },
      { text: '各类工程建设活动', kind: 'licensed', license: '需取得《建筑业企业资质证书》与《安全生产许可证》' }
    ]
  },
  {
    id: 'food-sales', name: '食品销售',
    items: [
      { text: '食用农产品零售', kind: 'general' },
      { text: '新鲜水果零售', kind: 'general' },
      { text: '新鲜蔬菜零售', kind: 'general' },
      { text: '鲜蛋零售', kind: 'general' },
      { text: '日用百货销售', kind: 'general' },
      { text: '厨具卫具及日用杂品零售', kind: 'general' },
      { text: '食品销售', kind: 'licensed', license: '需取得《食品经营许可证》（仅销售预包装食品的改为备案）' },
      { text: '食品互联网销售', kind: 'licensed', license: '线上销售食品需取得《食品经营许可证》并办理网络经营备案' },
      { text: '酒类经营', kind: 'licensed', license: '需取得含酒类项目的《食品经营许可证》' }
    ]
  }
]

// 许可警示卡映射：条目关键词 → 对应审批
const LICENSE_GUIDE = [
  { trigger: '食品销售 / 餐饮服务 / 酒类经营', license: '《食品经营许可证》（仅销售预包装食品改为备案）' },
  { trigger: '道路货物运输 / 快递服务', license: '《道路运输经营许可证》《快递业务经营许可证》' },
  { trigger: '互联网信息服务 / 增值电信业务', license: '《增值电信业务经营许可证》（ICP）' },
  { trigger: '各类工程建设活动', license: '《建筑业企业资质证书》+《安全生产许可证》' },
  { trigger: '出版物零售', license: '《出版物经营许可证》' },
  { trigger: '劳务派遣服务 / 职业中介活动', license: '《劳务派遣经营许可证》《人力资源服务许可证》' },
  { trigger: '职业技能培训 / 校外培训', license: '《民办学校办学许可证》及行业主管部门审核' },
  { trigger: '广播电视节目制作经营', license: '《广播电视节目制作经营许可证》' }
]

// 自定义条目单行校验：空 / 超 80 字 / 含分号 → 提示；合法返回 null
function validateCustomOf(line) {
  const t = String(line == null ? '' : line).trim()
  if (!t) return { level: 'warn', message: '空行将被忽略' }
  if (t.length > 80) return { level: 'error', message: `超出 80 字上限（当前 ${t.length} 字）` }
  if (/[;；]/.test(t)) return { level: 'error', message: '不能包含分号，条目分隔由生成器自动处理' }
  return null
}

// 拆分自定义文本为有效行（trim、去空行、剔除校验不通过的行）
function validCustomLinesOf(customText) {
  return String(customText == null ? '' : customText)
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && validateCustomOf(s) === null)
}

// 汇总选中条目：groups 为已勾选条目组列表，customText 为自定义文本原文
// 按 Set 口径对 text 去重（先行业条目后自定义条目），总量截断至 limit
function selectedItemsOf(groups, customText, limit = MAX_ITEMS) {
  const generalSet = new Set()
  const licensedSet = new Set()
  const list = Array.isArray(groups) ? groups : []
  for (const g of list) {
    const items = Array.isArray(g && g.items) ? g.items : []
    for (const it of items) {
      const text = String((it && it.text) || '').trim()
      if (!text) continue
      if (it.kind === 'licensed') licensedSet.add(text)
      else generalSet.add(text)
    }
  }
  for (const line of validCustomLinesOf(customText)) generalSet.add(line)
  let general = [...generalSet]
  let licensed = [...licensedSet]
  const cap = Number.isFinite(limit) ? limit : MAX_ITEMS
  if (general.length + licensed.length > cap) {
    general = general.slice(0, cap)
    licensed = licensed.slice(0, Math.max(0, cap - general.length))
  }
  return { general, licensed }
}

// 生成登记格式全文：两段各自存在才输出（含尾注），条目中文分号分隔
function buildScopeOf(sel) {
  const parts = []
  if (sel.general.length) parts.push(`一般项目：${sel.general.join('；')}。${GENERAL_NOTE}`)
  if (sel.licensed.length) parts.push(`许可项目：${sel.licensed.join('；')}。${LICENSED_NOTE}`)
  return parts.join('')
}

// 统计：一般 N / 许可 M / 自定义 K / 合计
function countOf(sel, customText) {
  return {
    general: sel.general.length,
    licensed: sel.licensed.length,
    custom: validCustomLinesOf(customText).length,
    total: sel.general.length + sel.licensed.length
  }
}

// 文本条目 → 许可审批提示 映射（供结果卡逐条展示）
const LICENSE_LOOKUP = Object.freeze(
  Object.fromEntries(
    INDUSTRY_PRESETS.flatMap((p) => p.items).filter((i) => i.license).map((i) => [i.text, i.license])
  )
)

// ---------- 交互状态 ----------
const seoContentVisible = ref(true)
const searchQuery = ref('')
const activeIndustryIds = ref([])
const checked = ref({}) // 条目 text → true（跨行业以文本为键，天然对齐去重口径）
const customText = ref('')

const activeIndustries = computed(() =>
  INDUSTRY_PRESETS.filter((p) => activeIndustryIds.value.includes(p.id))
)

const visibleGroups = computed(() => {
  const q = searchQuery.value.trim()
  return activeIndustries.value.map((p) => ({
    id: p.id,
    name: p.name,
    generalItems: p.items.filter((i) => i.kind === 'general' && (!q || i.text.includes(q))),
    licensedItems: p.items.filter((i) => i.kind === 'licensed' && (!q || i.text.includes(q))),
    allItems: p.items.filter((i) => !q || i.text.includes(q))
  }))
})

const selGroups = computed(() =>
  activeIndustries.value.map((p) => ({
    items: p.items.filter((i) => !!checked.value[i.text])
  }))
)

const sel = computed(() => selectedItemsOf(selGroups.value, customText.value))
const scopeText = computed(() => buildScopeOf(sel.value))
const stats = computed(() => countOf(sel.value, customText.value))

const customLineStates = computed(() =>
  String(customText.value).split('\n').map((raw) => {
    const text = raw.trim()
    return { text, issue: text ? validateCustomOf(text) : null }
  }).filter((l) => l.text !== '')
)

const totalSelectedCount = computed(() => {
  const groups = activeIndustries.value.map((p) => ({
    items: p.items.filter((i) => !!checked.value[i.text])
  }))
  return groups.reduce((s, g) => s + g.items.length, 0) + validCustomLinesOf(customText.value).length
})

const overLimitHint = computed(() => {
  if (totalSelectedCount.value <= MAX_ITEMS) return ''
  return `已选条目超过上限 ${MAX_ITEMS} 条，生成文本仅纳入前 ${MAX_ITEMS} 条，请取消部分勾选或删除自定义行。`
})

function toggleIndustry(id) {
  const idx = activeIndustryIds.value.indexOf(id)
  if (idx > -1) activeIndustryIds.value = activeIndustryIds.value.filter((x) => x !== id)
  else activeIndustryIds.value = [...activeIndustryIds.value, id]
}

function toggleItem(item) {
  const text = item.text
  if (checked.value[text]) {
    const next = { ...checked.value }
    delete next[text]
    checked.value = next
    return
  }
  if (totalSelectedCount.value >= MAX_ITEMS) return // 达上限：禁止继续勾选，红字提示已展示
  checked.value = { ...checked.value, [text]: true }
}

function selectAllInGroup(group) {
  if (group.allItems.length === 0) return
  const additions = group.allItems.filter((i) => !checked.value[i.text])
  if (additions.length === 0) return
  const next = { ...checked.value }
  for (const it of additions) {
    if (totalSelectedCount.value + Object.keys(next).filter((k) => !checked.value[k]).length >= MAX_ITEMS) break
    next[it.text] = true
  }
  checked.value = next
}

function resetAll() {
  activeIndustryIds.value = []
  checked.value = {}
  customText.value = ''
  searchQuery.value = ''
}

// ---------- 复制 / 下载（仅回调内使用浏览器 API，SSR 安全） ----------
function copyScope() {
  const text = scopeText.value
  if (!text) return
  try {
    navigator.clipboard.writeText(text).then(
      () => alert('经营范围全文已复制到剪贴板，可直接粘贴至登记平台。'),
      () => fallbackCopy(text)
    )
  } catch (e) {
    fallbackCopy(text)
  }
}

function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert('经营范围全文已复制到剪贴板，可直接粘贴至登记平台。')
  } catch (e2) {
    alert('复制失败，请在结果框中手动全选复制。')
  }
}

function downloadTxt() {
  const text = scopeText.value
  if (!text) return
  try {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '经营范围.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    alert('下载失败，当前浏览器不支持本地导出，请改用复制全文。')
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('business-scope-generator')
})
</script>
