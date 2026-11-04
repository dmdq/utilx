<template>
  <div class="max-w-8xl mx-auto pb-10">
    <!-- Hero -->
    <section class="relative mt-2 mb-6 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-indigo-500/10 via-card/50 to-fuchsia-500/5 px-5 py-8 sm:px-8 md:mb-10 lg:px-10 lg:py-10">
      <div class="pointer-events-none absolute inset-0 opacity-40" :style="heroGridStyle"></div>
      <div class="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl"></div>

      <div class="relative">
        <div class="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles class="h-3.5 w-3.5" />
          AI 工具导航 · 2026 年 10 月更新
        </div>

        <h1 class="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">
          <span class="sr-only">AI 工具导航：</span>
          发现好用的
          <span class="bg-gradient-to-r from-indigo-500 via-sky-500 to-fuchsia-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-sky-400 dark:to-fuchsia-400">AI 产品</span>
        </h1>
        <p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          收录国内外 {{ aiTools.length }} 款 AI 工具，覆盖 {{ aiCategories.length }} 个分类。用搜索、筛选和分类快速定位，不再在收藏夹里翻链接。
        </p>

        <div class="mt-6 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
          <div class="rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 backdrop-blur-sm">
            <div class="text-xl font-bold tabular-nums">{{ aiTools.length }}</div>
            <div class="text-[11px] text-muted-foreground">收录产品</div>
          </div>
          <div class="rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 backdrop-blur-sm">
            <div class="text-xl font-bold tabular-nums">{{ aiCategories.length }}</div>
            <div class="text-[11px] text-muted-foreground">内容分类</div>
          </div>
          <div class="rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 backdrop-blur-sm">
            <div class="text-xl font-bold tabular-nums">{{ freeCount }}</div>
            <div class="text-[11px] text-muted-foreground">可免费使用</div>
          </div>
          <div class="rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 backdrop-blur-sm">
            <div class="text-xl font-bold tabular-nums">{{ cnCount }}<span class="mx-0.5 text-sm font-normal text-muted-foreground">/</span>{{ aiTools.length - cnCount }}</div>
            <div class="text-[11px] text-muted-foreground">国内 / 海外</div>
          </div>
        </div>

        <div class="mt-5 flex flex-wrap items-center gap-2">
          <span class="text-xs text-muted-foreground">快速查找</span>
          <button
            v-for="term in quickSearches"
            :key="term"
            class="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            @click="applyQuickSearch(term)"
          >
            {{ term }}
          </button>
        </div>
      </div>
    </section>

    <!-- 粘性控制台：搜索 + 地区/价格筛选 + 分类导航 -->
    <div data-ai-toolbar class="z-20 -mx-1 mb-8 border-b border-border/60 bg-background/90 px-1 py-3 backdrop-blur-xl md:-mx-2 md:-mt-8 md:sticky md:top-[-2rem] md:px-2 md:pt-8">
      <div class="flex flex-col gap-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <div class="relative w-full sm:w-72 lg:w-80">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              v-model="query"
              type="text"
              aria-label="搜索 AI 产品"
              placeholder="搜索产品、厂商或场景…"
              class="h-9 w-full rounded-lg border border-border/60 bg-muted/40 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
            >
            <button
              v-if="query"
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="清空搜索"
              @click="query = ''"
            >
              <X class="h-3.5 w-3.5" />
            </button>
          </div>

          <div class="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5 text-xs" role="group" aria-label="按地区筛选">
            <button
              v-for="opt in regionOptions"
              :key="opt.value"
              class="rounded-md px-2.5 py-1.5 transition-colors"
              :class="region === opt.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
              :aria-pressed="region === opt.value"
              @click="region = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>

          <div class="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5 text-xs" role="group" aria-label="按价格筛选">
            <button
              v-for="opt in pricingOptions"
              :key="opt.value"
              class="rounded-md px-2.5 py-1.5 transition-colors"
              :class="pricing === opt.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
              :aria-pressed="pricing === opt.value"
              @click="pricing = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>

          <button
            class="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors"
            :class="featuredOnly ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'"
            :aria-pressed="featuredOnly"
            @click="featuredOnly = !featuredOnly"
          >
            <Star class="h-3.5 w-3.5" :class="{ 'fill-current': featuredOnly }" />
            精选
          </button>

          <button
            v-if="hasFilters"
            class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            @click="resetFilters"
          >
            <RotateCcw class="h-3.5 w-3.5" />
            重置
          </button>

          <span class="ml-auto hidden text-xs text-muted-foreground sm:inline">
            <strong class="font-semibold text-foreground">{{ filteredTools.length }}</strong> / {{ aiTools.length }} 款
          </span>
        </div>

        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 md:flex-wrap md:overflow-visible">
          <button
            class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors"
            :class="activeCategory === 'all' ? 'border-primary/50 bg-primary/15 text-primary' : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground'"
            :aria-pressed="activeCategory === 'all'"
            @click="selectCategory('all')"
          >
            <LayoutGrid class="h-3.5 w-3.5" />
            全部
            <span class="opacity-60">{{ baseFilteredTools.length }}</span>
          </button>
          <button
            v-for="cat in aiCategories"
            :key="cat.id"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors"
            :class="activeCategory === cat.id ? '' : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground'"
            :style="activeCategory === cat.id ? categoryChipStyle(cat) : {}"
            :aria-pressed="activeCategory === cat.id"
            @click="selectCategory(cat.id)"
          >
            <component :is="categoryIcon(cat.icon)" class="h-3.5 w-3.5" />
            {{ cat.name }}
            <span class="opacity-60">{{ categoryCounts[cat.id] }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑精选 -->
    <section v-if="showFeatured" class="mb-10">
      <div class="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 class="flex items-center gap-2 text-xl font-bold">
            <Star class="h-5 w-5 fill-current text-amber-400" />
            编辑精选
          </h2>
          <p class="mt-1 text-xs text-muted-foreground">从全部收录中挑出的代表作，覆盖不同使用场景</p>
        </div>
        <button class="text-xs text-muted-foreground transition-colors hover:text-primary" @click="featuredOnly = true">
          只看精选
        </button>
      </div>

      <div class="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4">
        <a
          v-for="tool in featuredTools"
          :key="tool.id"
          :href="tool.url"
          target="_blank"
          rel="noopener noreferrer"
          class="group relative flex h-full min-w-[82%] snap-start flex-col overflow-hidden rounded-xl border border-border/60 bg-card/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 sm:min-w-0"
        >
          <div class="absolute inset-x-0 top-0 h-px" :style="{ background: `linear-gradient(90deg, transparent, ${toolColor(tool)}, transparent)` }"></div>
          <div class="flex items-start justify-between gap-2">
            <span class="flex h-11 w-11 items-center justify-center rounded-lg border text-base font-bold" :style="toolTileStyle(tool)">
              {{ monogram(tool.name) }}
            </span>
            <span class="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
              <Star class="h-2.5 w-2.5 fill-current" />
              精选
            </span>
          </div>
          <h3 class="mt-3 flex items-center gap-1 text-sm font-semibold transition-colors group-hover:text-primary">
            {{ tool.name }}
            <ArrowUpRight class="h-3.5 w-3.5 -translate-x-0.5 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
          </h3>
          <p class="mt-0.5 truncate text-[11px] text-muted-foreground">{{ tool.company }} · {{ categoryName(tool.category) }}</p>
          <p class="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{{ tool.description }}</p>
          <div class="mt-auto flex flex-wrap items-center gap-1 pt-3">
            <span :class="pricingBadgeClass(tool.pricing)">{{ pricingLabels[tool.pricing] }}</span>
            <span :class="originBadgeClass(tool.origin)">{{ originLabels[tool.origin] }}</span>
            <span v-for="tag in tool.tags.slice(0, 2)" :key="tag" class="rounded bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"># {{ tag }}</span>
          </div>
        </a>
      </div>
    </section>

    <!-- 分类目录 -->
    <section id="ai-directory" class="scroll-mt-32">
      <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="flex items-center gap-2 text-xl font-bold">
            <LayoutGrid class="h-5 w-5 text-primary" />
            {{ activeCategory === 'all' ? (hasFilters ? '筛选结果' : '全部收录') : categoryName(activeCategory) }}
          </h2>
          <p class="mt-1 text-xs text-muted-foreground">
            <template v-if="hasFilters">当前筛选出 {{ filteredTools.length }} 款产品</template>
            <template v-else>按分类浏览，每个分类默认展示 6 款，可展开查看全部</template>
          </p>
        </div>
        <button
          v-if="showGlobalToggle"
          class="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          @click="toggleAllExpanded"
        >
          {{ anyCollapsed ? '展开全部分类' : '收起全部分类' }}
          <ChevronDown v-if="anyCollapsed" class="h-3.5 w-3.5" />
          <ChevronUp v-else class="h-3.5 w-3.5" />
        </button>
      </div>

      <div v-if="groupedCategories.length" class="space-y-9">
        <section
          v-for="group in groupedCategories"
          :id="`ai-cat-${group.id}`"
          :key="group.id"
          class="scroll-mt-36"
        >
          <div class="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border" :style="categoryTileStyle(group)">
                <component :is="categoryIcon(group.icon)" class="h-4 w-4" />
              </span>
              <div>
                <h3 class="text-base font-semibold sm:text-lg">
                  {{ group.name }}
                  <span class="ml-1 text-xs font-normal text-muted-foreground">{{ group.tools.length }} 款</span>
                </h3>
                <p class="text-[11px] text-muted-foreground sm:text-xs">{{ group.description }}</p>
              </div>
            </div>
            <button
              v-if="group.canToggle"
              class="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
              @click="toggleCategory(group.id)"
            >
              {{ group.expanded ? '收起' : `展开全部 ${group.tools.length} 款` }}
              <ChevronUp v-if="group.expanded" class="h-3.5 w-3.5" />
              <ChevronDown v-else class="h-3.5 w-3.5" />
            </button>
          </div>

          <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            <a
              v-for="tool in group.visibleTools"
              :key="tool.id"
              :href="tool.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex h-full flex-col rounded-xl border border-border/60 bg-card/40 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5"
            >
              <div class="flex items-start gap-3">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm font-bold" :style="toolTileStyle(tool)">
                  {{ monogram(tool.name) }}
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <h4 class="truncate text-sm font-semibold transition-colors group-hover:text-primary">{{ tool.name }}</h4>
                    <span v-if="tool.hot" class="shrink-0 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-red-600 dark:text-red-400">HOT</span>
                    <ArrowUpRight class="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100" />
                  </div>
                  <p class="mt-0.5 truncate text-[11px] text-muted-foreground">{{ tool.company }}</p>
                </div>
              </div>

              <p class="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{{ tool.description }}</p>

              <div class="mt-auto flex flex-wrap items-center gap-1 pt-2.5">
                <span :class="pricingBadgeClass(tool.pricing)">{{ pricingLabels[tool.pricing] }}</span>
                <span :class="originBadgeClass(tool.origin)">{{ originLabels[tool.origin] }}</span>
                <span v-for="tag in tool.tags.slice(0, 2)" :key="tag" class="rounded bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"># {{ tag }}</span>
              </div>
            </a>
          </div>
        </section>
      </div>

      <!-- 无结果 -->
      <div v-else class="rounded-xl border border-dashed border-border/70 py-16 text-center">
        <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
          <SearchX class="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 class="text-base font-semibold">没有找到匹配的 AI 产品</h3>
        <p class="mt-1 text-sm text-muted-foreground">换个关键词，或清除筛选条件再试试</p>
        <button
          class="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
          @click="resetFilters"
        >
          <RotateCcw class="h-3.5 w-3.5" />
          清除全部筛选
        </button>
      </div>
    </section>

    <!-- SEO 长尾内容 -->
    <section class="mt-14 rounded-xl border border-border/60 bg-card/40 p-5 sm:p-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold">关于这份 AI 导航</h2>
          <p class="mt-1 text-xs text-muted-foreground">收录标准、挑选建议与常见问题</p>
        </div>
        <button
          class="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          :aria-label="seoOpen ? '收起说明' : '展开说明'"
          @click="seoOpen = !seoOpen"
        >
          <ChevronUp v-if="seoOpen" class="h-5 w-5" />
          <ChevronDown v-else class="h-5 w-5" />
        </button>
      </div>

      <div v-show="seoOpen" class="mt-5 space-y-6 text-sm leading-7 text-muted-foreground">
        <p>
          这份导航按使用场景把 AI 产品分为 {{ aiCategories.length }} 类，收录 {{ aiTools.length }} 款国内外工具。分类内按推荐度排序，标注了免费与否、国内或海外，并提供标签帮助快速判断用途。所有链接直达官方产品页，不经过跳转中转。
        </p>

        <div>
          <h3 class="mb-2 text-base font-semibold text-foreground">收录标准</h3>
          <ul class="list-disc space-y-1.5 pl-5">
            <li>产品可直接访问，有明确的网页或客户端形态，而非仅一篇介绍。</li>
            <li>优先收录仍在持续更新、提供免费额度或可试用版本的服务。</li>
            <li>定价与地区信息为人工整理，官方调整后可能滞后，以产品页面为准。</li>
            <li>同一公司的不同产品会分别收录，例如 ChatGPT 与 OpenAI API。</li>
          </ul>
        </div>

        <div>
          <h3 class="mb-2 text-base font-semibold text-foreground">怎么挑到合适的那一款</h3>
          <ul class="list-disc space-y-1.5 pl-5">
            <li><strong class="text-foreground">先定任务再看产品。</strong>写代码优先看 AI 编程分类，做图看 AI 绘画，剪视频看 AI 视频，不要从模型名气出发。</li>
            <li><strong class="text-foreground">用免费额度做真实任务。</strong>拿自己的一段素材或代码试一轮，比看十个评测更有效。</li>
            <li><strong class="text-foreground">关注数据与协作要求。</strong>涉及公司代码或客户资料时，优先选择支持私有部署、本地运行或企业合规的方案。</li>
            <li><strong class="text-foreground">组合使用而不是寻找全能。</strong>例如开发者常用 Cursor 写代码、Claude Code 处理终端任务；内容团队常用即梦出图、可灵出视频、剪映完成后期。</li>
          </ul>
        </div>

        <div>
          <h3 class="mb-2 text-base font-semibold text-foreground">常见问题</h3>
          <div class="space-y-4">
            <div>
              <h4 class="font-medium text-foreground">免费 AI 工具够用吗？</h4>
              <p class="mt-1">日常问答、翻译、简单修图和短文案，免费额度通常够用。高频使用、长文档、商用授权或团队协作时，再考虑付费版本。</p>
            </div>
            <div>
              <h4 class="font-medium text-foreground">国内产品和海外产品怎么选？</h4>
              <p class="mt-1">国内产品访问稳定、中文与本地生态适配更好；海外产品在多模态、开发者工具和模型选择上更丰富。按网络条件、数据合规与语言需求决定。</p>
            </div>
            <div>
              <h4 class="font-medium text-foreground">为什么同一个产品标注了不同价格？</h4>
              <p class="mt-1">这里标注的是产品的典型使用方式：免费指可完整使用或开源，免费增值指有免费额度但高级功能付费，付费指以订阅为主、仅提供有限试用。</p>
            </div>
            <div>
              <h4 class="font-medium text-foreground">发现链接失效或想推荐产品怎么办？</h4>
              <p class="mt-1">可以通过页面下方的反馈入口告诉我们。推荐时附上产品名称、官网地址和一句话说明，会更快被收录。</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 底部引导 -->
    <div class="mt-8 grid gap-3 md:grid-cols-2">
      <NuxtLink
        to="/feedback/"
        class="group flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/40 p-5 transition-colors hover:border-primary/40 hover:bg-card/70"
      >
        <div>
          <h3 class="text-sm font-semibold transition-colors group-hover:text-primary">推荐产品或纠正链接</h3>
          <p class="mt-1 text-xs text-muted-foreground">发现失效链接、想补充新的 AI 产品，欢迎告诉我们。</p>
        </div>
        <ArrowRight class="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </NuxtLink>
      <NuxtLink
        to="/all/"
        class="group flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/40 p-5 transition-colors hover:border-primary/40 hover:bg-card/70"
      >
        <div>
          <h3 class="text-sm font-semibold transition-colors group-hover:text-primary">需要本地工具箱？</h3>
          <p class="mt-1 text-xs text-muted-foreground">JSON、PDF、图片与开发工具，纯本地计算，数据不上传。</p>
        </div>
        <ArrowRight class="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </NuxtLink>
    </div>

    <p class="mt-8 text-center text-xs text-muted-foreground">
      本页收录的 AI 产品仅供参考，使用前请阅读各平台的服务条款与隐私政策。
    </p>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  Search, X, Sparkles, Star, ArrowUpRight, ArrowRight, RotateCcw,
  LayoutGrid, SearchX, ChevronDown, ChevronUp,
  MessageSquare, Code2, Image as ImageIcon, Clapperboard, Music, PenLine,
  Telescope, Briefcase, Bot, Cpu, Palette, Languages, GraduationCap, BarChart3
} from 'lucide-vue-next'
import {
  aiTools, aiCategories, companyColors, pricingLabels, originLabels, quickSearches
} from '~/data/ai-tools'

const route = useRoute()

const categoryIcons = {
  MessageSquare,
  Code2,
  Image: ImageIcon,
  Clapperboard,
  Music,
  PenLine,
  Telescope,
  Briefcase,
  Bot,
  Cpu,
  Palette,
  Languages,
  GraduationCap,
  BarChart3
}

const categoryMap = Object.fromEntries(aiCategories.map(c => [c.id, c]))

const regionOptions = [
  { value: 'all', label: '全部地区' },
  { value: 'cn', label: '国内' },
  { value: 'global', label: '海外' }
]
const pricingOptions = [
  { value: 'all', label: '全部价格' },
  { value: 'free', label: '免费' },
  { value: 'freemium', label: '免费增值' },
  { value: 'paid', label: '付费' }
]

const query = ref('')
const activeCategory = ref('all')
const region = ref('all')
const pricing = ref('all')
const featuredOnly = ref(false)
const expandedCats = ref({})
const seoOpen = ref(true)

const DEFAULT_VISIBLE = 6

const freeCount = computed(() => aiTools.filter(t => t.pricing !== 'paid').length)
const cnCount = computed(() => aiTools.filter(t => t.origin === 'cn').length)

const hasFilters = computed(() =>
  Boolean(query.value.trim()) || activeCategory.value !== 'all' || region.value !== 'all' || pricing.value !== 'all' || featuredOnly.value
)
const isFiltering = computed(() =>
  Boolean(query.value.trim()) || region.value !== 'all' || pricing.value !== 'all' || featuredOnly.value
)

const normalize = (value) => String(value || '').toLowerCase()

const searchIndex = (tool) => {
  const cat = categoryMap[tool.category]
  return normalize([
    tool.name,
    tool.company,
    tool.description,
    cat?.name,
    cat?.description,
    pricingLabels[tool.pricing],
    originLabels[tool.origin],
    ...(tool.tags || [])
  ].join(' '))
}

// 搜索 + 地区 + 价格（不含分类），用于计算各分类下的命中数
const baseFilteredTools = computed(() => {
  const terms = normalize(query.value).trim().split(/\s+/).filter(Boolean)

  return aiTools.filter(tool => {
    if (region.value !== 'all' && tool.origin !== region.value) return false
    if (pricing.value !== 'all' && tool.pricing !== pricing.value) return false
    if (featuredOnly.value && !tool.featured) return false
    if (!terms.length) return true

    const haystack = searchIndex(tool)
    const compact = haystack.replace(/\s+/g, '')
    return terms.every(term => haystack.includes(term) || compact.includes(term.replace(/\s+/g, '')))
  })
})

const filteredTools = computed(() => {
  if (activeCategory.value === 'all') return baseFilteredTools.value
  return baseFilteredTools.value.filter(tool => tool.category === activeCategory.value)
})

const categoryCounts = computed(() => {
  const counts = {}
  for (const cat of aiCategories) counts[cat.id] = 0
  for (const tool of baseFilteredTools.value) counts[tool.category] = (counts[tool.category] || 0) + 1
  return counts
})

const featuredTools = computed(() => aiTools.filter(tool => tool.featured).slice(0, 8))

const showFeatured = computed(() =>
  !query.value.trim() && activeCategory.value === 'all' && region.value === 'all' && pricing.value === 'all' && !featuredOnly.value
)

const groupedCategories = computed(() => {
  const cats = activeCategory.value === 'all'
    ? aiCategories
    : aiCategories.filter(cat => cat.id === activeCategory.value)

  return cats
    .map(cat => {
      const tools = filteredTools.value.filter(tool => tool.category === cat.id)
      const expanded = isFiltering.value || activeCategory.value === cat.id || Boolean(expandedCats.value[cat.id])
      const visibleTools = expanded ? tools : tools.slice(0, DEFAULT_VISIBLE)
      return {
        ...cat,
        tools,
        visibleTools,
        expanded,
        canToggle: !isFiltering.value && activeCategory.value === 'all' && tools.length > DEFAULT_VISIBLE
      }
    })
    .filter(group => group.tools.length > 0)
})

const showGlobalToggle = computed(() =>
  activeCategory.value === 'all' && !isFiltering.value && groupedCategories.value.some(group => group.tools.length > DEFAULT_VISIBLE)
)

const anyCollapsed = computed(() =>
  groupedCategories.value.some(group => group.tools.length > DEFAULT_VISIBLE && !expandedCats.value[group.id])
)

const heroGridStyle = {
  backgroundImage:
    'linear-gradient(to right, rgba(148,163,184,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.10) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
  maskImage: 'radial-gradient(ellipse at top, black, transparent 72%)',
  WebkitMaskImage: 'radial-gradient(ellipse at top, black, transparent 72%)'
}

const categoryIcon = (iconName) => categoryIcons[iconName] || LayoutGrid
const categoryName = (id) => categoryMap[id]?.name || id

const hexToRgba = (hex, alpha) => {
  const raw = String(hex || '#818CF8').replace('#', '')
  const full = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw
  const num = Number.parseInt(full, 16)
  if (Number.isNaN(num)) return `rgba(129, 140, 248, ${alpha})`
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`
}

const toolColor = (tool) => companyColors[tool.company] || categoryMap[tool.category]?.color || '#818CF8'

const toolTileStyle = (tool) => {
  const color = toolColor(tool)
  return {
    backgroundColor: hexToRgba(color, 0.12),
    borderColor: hexToRgba(color, 0.3),
    color
  }
}

const categoryChipStyle = (cat) => ({
  backgroundColor: hexToRgba(cat.color, 0.14),
  borderColor: hexToRgba(cat.color, 0.45),
  color: cat.color
})

const categoryTileStyle = (cat) => ({
  backgroundColor: hexToRgba(cat.color, 0.12),
  borderColor: hexToRgba(cat.color, 0.3),
  color: cat.color
})

const pricingBadgeClass = (value) => {
  const base = 'rounded border px-1.5 py-0.5 text-[10px] leading-none '
  if (value === 'free') return base + 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/20 dark:text-emerald-400'
  if (value === 'freemium') return base + 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:border-sky-500/20 dark:text-sky-400'
  return base + 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-500/20 dark:text-amber-400'
}

const originBadgeClass = (value) => {
  const base = 'rounded border px-1.5 py-0.5 text-[10px] leading-none '
  if (value === 'cn') return base + 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-500/20 dark:text-rose-300'
  return base + 'border-slate-500/30 bg-slate-500/10 text-slate-600 dark:border-slate-500/20 dark:text-slate-300'
}

const monogram = (name) => {
  const cleaned = String(name || '').replace(/^[^\p{L}\p{N}]+/u, '').trim()
  return cleaned ? Array.from(cleaned)[0].toUpperCase() : '?'
}

const scrollToDirectory = () => {
  if (typeof document === 'undefined') return
  const container = document.getElementById('scrollContainer')
  const directory = document.getElementById('ai-directory')
  if (!container || !directory) return

  const containerRect = container.getBoundingClientRect()
  const toolbarRect = document.querySelector('[data-ai-toolbar]')?.getBoundingClientRect()
  const top = directory.getBoundingClientRect().top
    - containerRect.top
    + container.scrollTop
    - (toolbarRect ? Math.max(0, toolbarRect.bottom - containerRect.top) + 12 : 12)

  container.scrollTo({ top: Math.max(0, top), behavior: 'instant' })
}

const scrollToDirectoryAfterRender = () => {
  nextTick(() => {
    setTimeout(scrollToDirectory, 30)
  })
}

const selectCategory = (id) => {
  activeCategory.value = activeCategory.value === id ? 'all' : id
  if (activeCategory.value !== 'all') scrollToDirectoryAfterRender()
}

const toggleCategory = (id) => {
  expandedCats.value = { ...expandedCats.value, [id]: !expandedCats.value[id] }
}

const toggleAllExpanded = () => {
  if (anyCollapsed.value) {
    const next = { ...expandedCats.value }
    groupedCategories.value.forEach(group => {
      if (group.tools.length > DEFAULT_VISIBLE) next[group.id] = true
    })
    expandedCats.value = next
  } else {
    expandedCats.value = {}
  }
}

const resetFilters = () => {
  query.value = ''
  region.value = 'all'
  pricing.value = 'all'
  featuredOnly.value = false
  activeCategory.value = 'all'
  expandedCats.value = {}
}

const applyQuickSearch = (term) => {
  query.value = term
  activeCategory.value = 'all'
  scrollToDirectoryAfterRender()
}

onMounted(() => {
  const q = route.query.q
  if (typeof q === 'string' && q.trim()) query.value = q.trim()

  const c = route.query.category
  if (typeof c === 'string' && categoryMap[c]) activeCategory.value = c
})

const featuredFaq = [
  {
    question: '免费 AI 工具够用吗？',
    answer: '日常问答、翻译、简单修图和短文案，免费额度通常够用。高频使用、长文档、商用授权或团队协作时，再考虑付费版本。'
  },
  {
    question: '国内产品和海外产品怎么选？',
    answer: '国内产品访问稳定、中文与本地生态适配更好；海外产品在多模态、开发者工具和模型选择上更丰富。按网络条件、数据合规与语言需求决定。'
  },
  {
    question: '为什么同一个产品标注了不同价格？',
    answer: '免费指可完整使用或开源，免费增值指有免费额度但高级功能付费，付费指以订阅为主、仅提供有限试用。'
  },
  {
    question: '发现链接失效或想推荐产品怎么办？',
    answer: '可以通过页面下方的反馈入口告诉我们。推荐时附上产品名称、官网地址和一句话说明，会更快被收录。'
  }
]

useSeoMeta({
  title: `AI 工具导航 - ${aiTools.length} 款国内外 AI 产品精选合集 | 有条工具`,
  description: `2026 年 AI 工具导航，收录 ${aiTools.length} 款国内外 AI 产品，覆盖对话助手、AI 编程、AI 绘画、视频生成、Agent、模型 API 等 ${aiCategories.length} 个分类。支持搜索、按地区与价格筛选，快速找到好用的 AI 工具。`,
  keywords: 'AI 工具导航, AI 导航, AI 工具合集, ChatGPT, Claude, DeepSeek, AI 编程, AI 绘画, AI 视频, AI Agent',
  author: '有条工具',
  ogTitle: `AI 工具导航 - ${aiTools.length} 款国内外 AI 产品精选合集`,
  ogDescription: `按分类、地区与价格筛选 ${aiTools.length} 款国内外 AI 工具，覆盖对话、编程、绘画、视频、Agent 与模型 API。`,
  ogType: 'website',
  ogUrl: 'https://www.util.cn/ai/',
  ogImage: 'https://www.util.cn/logo/logo-256.png',
  twitterCard: 'summary_large_image',
  twitterTitle: `AI 工具导航 - ${aiTools.length} 款 AI 产品精选`,
  twitterDescription: `搜索与筛选 ${aiTools.length} 款国内外 AI 工具，快速找到适合你的产品。`
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://www.util.cn/ai/' }
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            name: 'AI 工具导航',
            description: `收录 ${aiTools.length} 款国内外 AI 产品，覆盖对话、编程、绘画、视频、音频、Agent 与模型 API 等 ${aiCategories.length} 个分类。`,
            url: 'https://www.util.cn/ai/',
            inLanguage: 'zh-CN',
            isPartOf: {
              '@type': 'WebSite',
              name: '有条工具',
              url: 'https://www.util.cn/'
            },
            about: aiCategories.map(cat => ({ '@type': 'Thing', name: cat.name }))
          },
          {
            '@type': 'ItemList',
            name: 'AI 工具编辑精选',
            numberOfItems: featuredTools.value.length,
            itemListElement: featuredTools.value.map((tool, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: tool.name,
              url: tool.url,
              description: tool.description
            }))
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
              { '@type': 'ListItem', position: 2, name: 'AI 导航', item: 'https://www.util.cn/ai/' }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: featuredFaq.map(item => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer }
            }))
          }
        ]
      })
    }
  ]
})
</script>
