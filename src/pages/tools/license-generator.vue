<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Scale class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">开源协议生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">选对开源协议，一键生成 LICENSE 文件与徽章</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        按场景选择开源协议，填写版权信息生成 LICENSE 文件全文，附 README 徽章代码与主流协议对比表。宽松协议提供官方全文，Copyleft 类协议附官方原文链接（法律文本以官方版本为准）。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：选择与信息 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <List class="w-5 h-5 mr-2 text-primary" /> 选择协议
          </h2>
          <div class="space-y-2">
            <button
              v-for="l in licenses"
              :key="l.key"
              @click="selected = l.key"
              class="w-full text-left rounded-lg border p-3 transition-all"
              :class="selected === l.key ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40 hover:bg-muted/30'"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-foreground">{{ l.name }}</span>
                <span
                  class="text-[10px] px-1.5 py-0.5 rounded"
                  :class="l.copyleft ? 'bg-purple-500/10 text-purple-500' : 'bg-green-500/10 text-green-500'"
                >{{ l.copyleft ? 'Copyleft' : '宽松' }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-1">{{ l.tagline }}</p>
            </button>
          </div>
        </div>

        <!-- 版权信息 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <PenTool class="w-5 h-5 mr-2 text-primary" /> 版权信息
          </h2>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">年份</label>
            <input v-model="year" type="text"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">版权人 / 组织</label>
            <input v-model="holder" type="text" placeholder="你的名字或组织名"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">项目名（徽章用）</label>
            <input v-model="project" type="text" placeholder="my-project"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
      </div>

      <!-- 右侧：输出 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- LICENSE 全文 -->
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <FileText class="w-5 h-5 mr-2 text-primary" /> LICENSE 文件
            </h2>
            <div class="flex items-center gap-2">
              <button @click="copyLicense" :disabled="!licenseText"
                class="bg-muted hover:bg-muted/80 disabled:opacity-50 text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5">
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
              <button @click="downloadLicense" :disabled="!licenseText"
                class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5">
                <Download class="w-3.5 h-3.5" /> 下载 LICENSE
              </button>
            </div>
          </div>
          <div class="p-6">
            <pre v-if="licenseText" class="text-xs font-mono text-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-4 max-h-96 overflow-y-auto">{{ licenseText }}</pre>
            <div v-else class="py-10 text-center">
              <ExternalLink class="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">{{ current.fullText ? '' : '该协议为法律文本，请从官方渠道获取全文' }}</p>
              <a
                v-if="current.officialUrl"
                :href="current.officialUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-block mt-3 text-sm text-primary hover:underline"
              >查看 {{ current.name }} 官方全文 →</a>
            </div>
          </div>
        </div>

        <!-- 徽章 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <Code class="w-4 h-4 mr-2 text-primary" /> README 徽章
          </h3>
          <div class="bg-muted/50 rounded-lg p-3 text-xs font-mono text-foreground break-all">{{ badgeMarkdown }}</div>
          <button @click="copyBadge" class="mt-3 bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5">
            <Copy class="w-3 h-3" /> 复制 Markdown
          </button>
        </div>
      </div>
    </div>

    <!-- 协议对比表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center">
        <GitCompare class="w-5 h-5 mr-2 text-primary" /> 主流协议对比
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-muted-foreground border-b border-border">
              <th class="py-2.5 pr-4 font-medium">协议</th>
              <th class="py-2.5 pr-4 font-medium">可商用</th>
              <th class="py-2.5 pr-4 font-medium">须开源修改</th>
              <th class="py-2.5 pr-4 font-medium">专利授权</th>
              <th class="py-2.5 pr-4 font-medium">可作闭源二进制分发</th>
              <th class="py-2.5 font-medium">典型使用</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border/50">
            <tr v-for="row in compareTable" :key="row.name">
              <td class="py-2.5 pr-4 font-medium text-foreground whitespace-nowrap">{{ row.name }}</td>
              <td class="py-2.5 pr-4"><CheckCircle class="w-4 h-4" :class="row.commercial ? 'text-green-500' : 'text-destructive'" /></td>
              <td class="py-2.5 pr-4"><CheckCircle class="w-4 h-4" :class="row.shareChanges ? 'text-purple-500' : 'text-muted-foreground/30'" /></td>
              <td class="py-2.5 pr-4"><CheckCircle class="w-4 h-4" :class="row.patent ? 'text-green-500' : 'text-muted-foreground/30'" /></td>
              <td class="py-2.5 pr-4"><CheckCircle class="w-4 h-4" :class="row.closedBin ? 'text-green-500' : 'text-destructive'" /></td>
              <td class="py-2.5 text-muted-foreground">{{ row.usage }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button @click="toggleSeoContent" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="展开或收起说明">
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>如何为项目选择开源协议</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>开源协议决定别人能对你的代码做什么：能否商用、能否闭源、修改后是否必须开源。选择的核心问题是——你希望 derivatives（衍生作品）也保持开源吗？不想管就选 MIT/BSD 等宽松协议；想强制生态回馈就选 GPL/AGPL。</p>
          <h3 class="text-lg font-semibold text-foreground">快速决策路径</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>希望最大传播、随便用，只求免责：MIT（最流行）或 BSD-3（加禁用背书条款）</li>
            <li>担心专利诉讼：Apache-2.0（明确专利授权，企业友好）</li>
            <li>库项目希望改动必须回馈但允许链接：LGPL-3.0 或 MPL-2.0（文件级 Copyleft）</li>
            <li>应用/软件本体坚持开源传承：GPL-3.0；对抗 SaaS 化闭源：AGPL-3.0</li>
            <li>国产化合规场景：MulanPSL-2（木兰协议，中文法律文本）</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">没有 LICENSE 的仓库能随便用吗？</span>不能。默认保留所有权利，任何使用都有法律风险——这也是每个开源项目都应该带 LICENSE 的原因。</li>
            <li><span class="text-foreground font-medium">本工具生成的文本可靠吗？</span>宽松短协议（MIT/BSD/0BSD/Unlicense/WTFPL）提供官方全文；其余协议法律文本较长，请通过官方链接获取原文，避免转抄错误。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'license-generator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Scale, List, PenTool, FileText, Copy, Download, Code, GitCompare,
  CheckCircle, ExternalLink, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

useSeoMeta({
  title: '开源协议生成器 - LICENSE文件生成与协议选择指南',
  description: '在线开源协议生成器，支持MIT/BSD/Apache/GPL等主流协议选择，生成LICENSE文件全文与README徽章，附协议对比表帮助选型',
  keywords: '开源协议, license生成, mit协议, apache协议, gpl协议, 开源协议选择, license文件',
  author: 'Util工具箱',
  ogTitle: '开源协议生成器 - 有条工具',
  ogDescription: '选对开源协议，一键生成LICENSE文件与徽章',
  ogUrl: 'https://www.util.cn/tools/license-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebApplication', name: '开源协议生成器', url: 'https://www.util.cn/tools/license-generator', applicationCategory: 'DeveloperApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }, featureList: ['LICENSE文件生成', 'README徽章', '协议对比表'] },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
          { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
          { '@type': 'ListItem', position: 3, name: '开源协议生成器', item: 'https://www.util.cn/tools/license-generator/' }
        ] }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'license-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 协议数据 ----------
const licenses = [
  { key: 'mit', name: 'MIT', tagline: '最简单流行，几乎随便用', copyleft: false, fullText: true },
  { key: 'bsd3', name: 'BSD-3-Clause', tagline: 'MIT 基础上禁止用作者名义推广', copyleft: false, fullText: true },
  { key: 'bsd2', name: 'BSD-2-Clause', tagline: 'BSD-3 的精简版', copyleft: false, fullText: true },
  { key: 'apache2', name: 'Apache-2.0', tagline: '含明确专利授权，企业首选', copyleft: false, fullText: false, officialUrl: 'https://www.apache.org/licenses/LICENSE-2.0.txt' },
  { key: 'mpl2', name: 'MPL-2.0', tagline: '文件级 Copyleft，库项目折中之选', copyleft: true, fullText: false, officialUrl: 'https://www.mozilla.org/media/MPL/2.0/index.txt' },
  { key: 'gpl3', name: 'GPL-3.0', tagline: '强 Copyleft，衍生作品必须同协议开源', copyleft: true, fullText: false, officialUrl: 'https://www.gnu.org/licenses/gpl-3.0.txt' },
  { key: 'agpl3', name: 'AGPL-3.0', tagline: 'GPL + 网络服务也须开源，反 SaaS 化', copyleft: true, fullText: false, officialUrl: 'https://www.gnu.org/licenses/agpl-3.0.txt' },
  { key: 'mulan2', name: 'MulanPSL-2', tagline: '木兰协议，中文法律文本，类似 Apache-2.0', copyleft: false, fullText: false, officialUrl: 'https://license.coscl.org.cn/MulanPSL2/' },
  { key: 'zero', name: '0BSD', tagline: '比 MIT 更彻底的公有领域授权', copyleft: false, fullText: true },
  { key: 'unlicense', name: 'Unlicense', tagline: '放弃所有版权权利', copyleft: false, fullText: true },
  { key: 'wtfpl', name: 'WTFPL', tagline: '想怎么用就怎么用', copyleft: false, fullText: true }
]

const compareTable = [
  { name: 'MIT', commercial: true, shareChanges: false, patent: false, closedBin: true, usage: 'React、Vue、Vue Router' },
  { name: 'BSD-3', commercial: true, shareChanges: false, patent: false, closedBin: true, usage: 'Nginx、FreeBSD' },
  { name: 'Apache-2.0', commercial: true, shareChanges: false, patent: true, closedBin: true, usage: 'Kubernetes、TensorFlow' },
  { name: 'MPL-2.0', commercial: true, shareChanges: true, patent: true, closedBin: true, usage: 'Firefox 组件' },
  { name: 'LGPL-3.0', commercial: true, shareChanges: true, patent: true, closedBin: true, usage: '动态链接的库' },
  { name: 'GPL-3.0', commercial: true, shareChanges: true, patent: true, closedBin: false, usage: 'Linux (GPL-2.0)、Git' },
  { name: 'AGPL-3.0', commercial: true, shareChanges: true, patent: true, closedBin: false, usage: 'MongoDB (旧版)、MinIO' },
  { name: 'MulanPSL-2', commercial: true, shareChanges: false, patent: true, closedBin: true, usage: 'openEuler 生态、OpenHarmony 组件' }
]

const selected = ref('mit')
const year = ref(String(new Date().getFullYear()))
const holder = ref('')
const project = ref('')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const current = computed(() => licenses.find(l => l.key === selected.value) || licenses[0])
const copyrightLine = computed(() => `Copyright (c) ${year.value || 'YEAR'} ${holder.value || 'YOUR NAME'}`)

// 宽松协议官方全文（短协议原文）
const LICENSE_TEXTS = {
  mit: () => `${copyrightLine.value}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
  bsd3: () => `${copyrightLine.value}

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
  bsd2: () => `${copyrightLine.value}

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
  zero: () => `Zero-Clause BSD (0BSD)

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.`,
  unlicense: () => `This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <https://unlicense.org>`,
  wtfpl: () => `            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                    Version 2, December 2004

 Copyright (C) 2004 Sam Hocevar <sam@hocevar.net>

 Everyone is permitted to copy and distribute verbatim or modified
 copies of this license document, and changing it is allowed as long
 as the name is changed.

            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

  0. You just DO WHAT THE FUCK YOU WANT TO.`
}

const licenseText = computed(() => {
  if (!current.value.fullText) return ''
  return LICENSE_TEXTS[current.value.key]?.() || ''
})

const badgeMarkdown = computed(() => {
  const p = project.value || 'project'
  const badge = current.value.name.replace(/-/g, '')
  return `[![License: ${current.value.name}](https://img.shields.io/badge/License-${encodeURIComponent(current.value.name)}-blue.svg)](${current.value.officialUrl || 'https://opensource.org/licenses'})\n# ${p}`
})

const copyLicense = async () => {
  if (!licenseText.value) return
  try {
    await navigator.clipboard.writeText(licenseText.value)
    alert('LICENSE 全文已复制')
  } catch (err) {
    const ta = document.createElement('textarea')
    ta.value = licenseText.value
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert('LICENSE 全文已复制')
  }
}

const copyBadge = async () => {
  try {
    await navigator.clipboard.writeText(badgeMarkdown.value)
    alert('徽章代码已复制')
  } catch (err) {
    const ta = document.createElement('textarea')
    ta.value = badgeMarkdown.value
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert('徽章代码已复制')
  }
}

const downloadLicense = () => {
  if (!licenseText.value) return
  const blob = new Blob([licenseText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'LICENSE'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
