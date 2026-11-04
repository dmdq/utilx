<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-10">
      <nav class="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        <NuxtLink to="/" class="hover:text-primary transition-colors">首页</NuxtLink>
        <ChevronRight class="w-3.5 h-3.5" />
        <span class="text-foreground">按职业找工具</span>
      </nav>
      <h1 class="text-display text-foreground mb-3">按职业找工具</h1>
      <p class="text-muted-foreground leading-relaxed max-w-3xl">
        {{ personas.length }} 张职业工具卡，按《职业分类大典》骨架整理：每张卡列出该职业的核心任务与对应工具，任务都是一句"要完成的活"，工具全部在浏览器本地运行。不找分类名，直接找你手头的活。
      </p>
    </div>

    <!-- 分组画像卡 -->
    <section
      v-for="group in grouped"
      :key="group.name"
      class="mb-12"
    >
      <div class="flex items-baseline gap-3 border-b border-border/70 pb-2 mb-1">
        <h2 class="text-h2 text-foreground">{{ group.name }}</h2>
        <span class="font-mono text-xs text-muted-foreground/60">{{ group.items.length }} 个画像</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
        <NuxtLink
          v-for="p in group.items"
          :key="p.id"
          :to="`/professions/${p.id}/`"
          class="group border-b border-border/40 py-3.5 hover:bg-muted/25 transition-colors px-2 -mx-2"
        >
          <div class="flex items-baseline gap-2.5">
            <component :is="resolveToolIcon(p.icon, 'dev')" class="w-4 h-4 shrink-0 self-center text-muted-foreground/60 group-hover:text-primary transition-colors" />
            <span class="font-medium text-foreground group-hover:text-primary transition-colors">{{ p.name }}</span>
            <span class="font-mono text-[11px] tabular-nums text-muted-foreground/60 ml-auto shrink-0">{{ p.tasks.length }} 任务 · {{ toolCount(p) }} 工具</span>
          </div>
          <p class="text-xs text-muted-foreground mt-1 pl-[26px] truncate">{{ p.scene }}</p>
        </NuxtLink>
      </div>
    </section>

    <!-- SEO 说明 -->
    <section class="border-t border-border/60 pt-8 pb-4">
      <h2 class="text-h2 text-foreground mb-4">为什么要按职业找工具</h2>
      <div class="prose-sm text-muted-foreground leading-relaxed max-w-3xl space-y-3">
        <p>传统工具站的分类是「按功能」：计算器、格式化、图片处理。但真正干活的人是「按任务」找工具的——电工要算的是电压降和载流量，机修师傅要查的是公差配合和轴承型号，HR 要算的是离职补偿和年假天数。分类名对得上菜单，对不上手头的活。</p>
        <p>这里的 {{ personas.length }} 张职业工具卡共覆盖 {{ totalTasks }} 条核心任务、{{ totalToolRefs }} 个工具直链，全部从真实工作流反向整理：先写"要完成的活"，再挂能干活的工具。同一个小工具会出现在多个职业里（比如时间戳转换，程序员和运维都要用），这是正常的。</p>
        <p>如果一张卡里有任务还没有合适工具，它会留在审计清单里驱动我们继续开发。想按场景而不是职业找，去 <NuxtLink to="/collections/" class="text-primary hover:underline">场景专题</NuxtLink>；想按功能浏览全部 {{ toolTotal }} 款，去 <NuxtLink to="/all/" class="text-primary hover:underline">全部工具</NuxtLink>。</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ChevronRight } from 'lucide-vue-next'
import { personas } from '~/data/personas'
import { tools } from '~/data/tools'
import { resolveToolIcon } from '~/utils/toolIcons'

const toolTotal = tools.length

const toolCount = (p) => {
  const set = new Set()
  p.tasks.forEach(t => (t.tools || []).forEach(id => set.add(id)))
  return set.size
}

const totalTasks = personas.reduce((s, p) => s + p.tasks.length, 0)
const totalToolRefs = personas.reduce((s, p) => s + p.tasks.reduce((x, t) => x + (t.tools || []).length, 0), 0)

const groupOrder = []
const grouped = []
personas.forEach(p => {
  let g = grouped.find(x => x.name === p.group)
  if (!g) { g = { name: p.group, items: [] }; grouped.push(g) }
  g.items.push(p)
})

useSeoMeta({
  title: '按职业找工具 - 29 张职业工具卡，任务对应工具',
  description: `${personas.length} 张职业工具卡覆盖 ${totalTasks} 条核心任务：电工、机修、农户、法律、实验室、程序员、设计师……每条任务挂能干活的工具直链，全部浏览器本地运行，免注册免上传。`,
  keywords: '按职业找工具,职业工具箱,电工工具,机修工具,法律工具,实验室工具,开发者工具,职业工具卡',
  ogTitle: '按职业找工具 - 有条工具',
  ogDescription: `按《职业分类大典》整理的 ${personas.length} 张职业工具卡，任务对工具，打开即用。`,
  ogUrl: 'https://www.util.cn/professions',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: '按职业找工具',
          description: `按职业整理的工具导航，${personas.length} 张职业工具卡覆盖 ${totalTasks} 条核心任务`,
          url: 'https://www.util.cn/professions'
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '按职业找工具', item: 'https://www.util.cn/professions' }
          ]
        }
      ]
    })
  }]
})
</script>
