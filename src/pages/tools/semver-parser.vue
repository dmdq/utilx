<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Tag class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">SemVer版本解析比较器</h1>
          <p class="text-sm text-muted-foreground mt-1">解析、比较、排序语义化版本号，支持 ^ ~ 范围匹配判断</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        按 semver.org 规范解析版本号的 major / minor / patch / prerelease / build 各段，支持两个版本比较（正确处理先行版本排序规则）、批量排序、以及 ^1.2.3、~1.2.3、>=1.0.0 <2.0.0 等范围匹配判断。手写解析引擎，无第三方依赖，全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入区 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Terminal class="w-5 h-5 mr-2 text-primary" /> 输入
          </h2>

          <!-- 模式切换 -->
          <div class="grid grid-cols-4 gap-1.5 mb-4">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              @click="activeTab = tab.value"
              :class="activeTab === tab.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- 单版本解析 -->
          <div v-if="activeTab === 'parse'">
            <label class="block text-sm font-medium text-foreground mb-2">版本号</label>
            <input
              v-model="parseInput"
              type="text"
              placeholder="例如：1.2.3 或 2.0.0-rc.1+build.5"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              spellcheck="false"
            />
            <p class="text-xs text-muted-foreground mt-2">输入单个版本号，实时分解并校验是否符合 SemVer 规范</p>
          </div>

          <!-- 版本比较 -->
          <div v-else-if="activeTab === 'compare'">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">版本 A</label>
                <input
                  v-model="compareA"
                  type="text"
                  placeholder="1.0.0-alpha"
                  class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  spellcheck="false"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">版本 B</label>
                <input
                  v-model="compareB"
                  type="text"
                  placeholder="1.0.0-beta.11"
                  class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  spellcheck="false"
                />
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-3">比较遵循 SemVer 优先级规则，含先行版本的正确排序（1.0.0-alpha &lt; 1.0.0-alpha.1 &lt; 1.0.0-beta &lt; 1.0.0）</p>
          </div>

          <!-- 批量排序 -->
          <div v-else-if="activeTab === 'sort'">
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-foreground">版本列表（每行一个）</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="sortDirection = 'asc'"
                  :class="sortDirection === 'asc' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-2.5 py-1 rounded text-xs font-medium transition-all"
                >升序</button>
                <button
                  @click="sortDirection = 'desc'"
                  :class="sortDirection === 'desc' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-2.5 py-1 rounded text-xs font-medium transition-all"
                >降序</button>
              </div>
            </div>
            <textarea
              v-model="sortInput"
              class="w-full h-44 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="1.0.0&#10;2.1.3&#10;1.9.0-beta&#10;0.9.5"
              spellcheck="false"
            ></textarea>
          </div>

          <!-- 范围判断 -->
          <div v-else>
            <label class="block text-sm font-medium text-foreground mb-2">版本范围</label>
            <input
              v-model="rangeInput"
              type="text"
              placeholder="例如：^1.2.3、~1.2.3、>=1.0.0 <2.0.0、1.2.x"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-3"
              spellcheck="false"
            />
            <label class="block text-sm font-medium text-foreground mb-2">待判断的版本号</label>
            <input
              v-model="rangeVersionInput"
              type="text"
              placeholder="例如：1.5.0"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              spellcheck="false"
            />
            <p class="text-xs text-muted-foreground mt-3">多个比较器用空格分隔表示「与」，用 || 分隔表示「或」，语义与 npm 依赖范围一致</p>
          </div>
        </div>

        <!-- SemVer 规范速查卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> SemVer 规范速查卡
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">版本格式</span>：主版本.次版本.修订号[-先行版本][+构建元数据]，如 1.2.3-alpha.1+exp</li>
            <li>• <span class="text-foreground">主版本 MAJOR</span>：不兼容的 API 修改；<span class="text-foreground">次版本 MINOR</span>：向下兼容的功能新增；<span class="text-foreground">修订号 PATCH</span>：向下兼容的问题修复</li>
            <li>• <span class="text-foreground">先行版本排序</span>：1.0.0-alpha &lt; 1.0.0-alpha.1 &lt; 1.0.0-alpha.beta &lt; 1.0.0-beta &lt; 1.0.0-beta.2 &lt; 1.0.0-beta.11 &lt; 1.0.0-rc.1 &lt; 1.0.0</li>
            <li>• <span class="text-foreground">标识符比较</span>：纯数字按数值比较，字母按 ASCII 排序；数字标识符优先级低于字母标识符</li>
            <li>• <span class="text-foreground">字段越多优先级越高</span>（前面字段都相等时）；构建元数据（+ 后内容）不参与优先级比较</li>
            <li>• <span class="text-foreground">范围语法</span>：^1.2.3 → &gt;=1.2.3 &lt;2.0.0（0.x 时锁定次版本）；~1.2.3 → &gt;=1.2.3 &lt;1.3.0；空格分隔为「与」，|| 分隔为「或」</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：结果区 -->
      <div class="space-y-6">
        <!-- 解析结果 -->
        <div v-if="activeTab === 'parse'" class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <BarChart3 class="w-5 h-5 mr-2 text-primary" /> 解析结果
            </h2>
            <span v-if="parseResult" class="text-xs text-muted-foreground">符合 SemVer 2.0.0</span>
          </div>
          <div class="p-6">
            <div v-if="!parseInput.trim()" class="py-12 text-center">
              <Tag class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">输入版本号后，这里会显示分解结果</p>
            </div>
            <template v-else-if="parseResult">
              <div class="grid grid-cols-3 gap-3 mb-4">
                <div class="bg-muted/50 rounded-lg p-4 text-center">
                  <p class="text-2xl font-bold text-foreground">{{ parseResult.major }}</p>
                  <p class="text-xs text-muted-foreground mt-1">major 主版本</p>
                </div>
                <div class="bg-muted/50 rounded-lg p-4 text-center">
                  <p class="text-2xl font-bold text-foreground">{{ parseResult.minor }}</p>
                  <p class="text-xs text-muted-foreground mt-1">minor 次版本</p>
                </div>
                <div class="bg-muted/50 rounded-lg p-4 text-center">
                  <p class="text-2xl font-bold text-foreground">{{ parseResult.patch }}</p>
                  <p class="text-xs text-muted-foreground mt-1">patch 修订号</p>
                </div>
              </div>
              <div class="space-y-3">
                <div class="flex items-start gap-3">
                  <span class="text-xs font-medium text-muted-foreground w-20 flex-shrink-0 mt-1">prerelease</span>
                  <div class="flex flex-wrap gap-1.5">
                    <span v-if="parseResult.prerelease.length === 0" class="text-xs text-muted-foreground">（无，正式版本）</span>
                    <span
                      v-for="(p, idx) in parseResult.prerelease"
                      :key="idx"
                      class="px-2 py-0.5 rounded bg-muted text-foreground text-xs font-mono"
                    >{{ p }}</span>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-xs font-medium text-muted-foreground w-20 flex-shrink-0 mt-1">build</span>
                  <div class="flex flex-wrap gap-1.5">
                    <span v-if="!parseResult.build" class="text-xs text-muted-foreground">（无）</span>
                    <span v-else class="px-2 py-0.5 rounded bg-muted text-foreground text-xs font-mono">{{ parseResult.build }}</span>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-xs font-medium text-muted-foreground w-20 flex-shrink-0 mt-1">类型判定</span>
                  <span class="text-xs text-foreground">{{ versionKind(parseResult) }}</span>
                </div>
              </div>
            </template>
            <div v-else class="py-10 text-center">
              <XCircle class="w-10 h-10 mx-auto mb-3 text-destructive" />
              <p class="text-sm text-destructive font-medium mb-1">不符合 SemVer 规范</p>
              <p class="text-xs text-muted-foreground">{{ parseErrorText }}</p>
            </div>
          </div>
        </div>

        <!-- 比较结果 -->
        <div v-else-if="activeTab === 'compare'" class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <GitBranch class="w-5 h-5 mr-2 text-primary" /> 比较结果
            </h2>
          </div>
          <div class="p-6">
            <div v-if="!compareA.trim() && !compareB.trim()" class="py-12 text-center">
              <GitBranch class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">输入两个版本号后，这里会显示比较结论</p>
            </div>
            <div v-else-if="compareErrorA || compareErrorB" class="py-10 text-center">
              <XCircle class="w-10 h-10 mx-auto mb-3 text-destructive" />
              <p class="text-sm text-destructive font-medium mb-1">版本号格式有误</p>
              <p class="text-xs text-muted-foreground">{{ compareErrorA || compareErrorB }}</p>
            </div>
            <template v-else>
              <div class="flex items-center justify-center gap-4 py-4">
                <span class="font-mono text-sm text-foreground bg-muted/50 rounded px-2 py-1">{{ parsedA.raw }}</span>
                <span class="text-3xl font-bold" :class="compareResult.symbol === '=' ? 'text-muted-foreground' : 'text-primary'">{{ compareResult.symbol }}</span>
                <span class="font-mono text-sm text-foreground bg-muted/50 rounded px-2 py-1">{{ parsedB.raw }}</span>
              </div>
              <div class="space-y-3 mt-2">
                <div class="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle class="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{{ compareResult.sentence }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-foreground">
                  <ArrowRight class="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{{ compareResult.upgrade }}</span>
                </div>
                <p v-if="compareResult.note" class="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">{{ compareResult.note }}</p>
              </div>
            </template>
          </div>
        </div>

        <!-- 排序结果 -->
        <div v-else-if="activeTab === 'sort'" class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <List class="w-5 h-5 mr-2 text-primary" /> 排序结果
            </h2>
            <button
              @click="copySorted"
              :disabled="sortedResult.valid.length === 0"
              class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> 复制
            </button>
          </div>
          <div class="p-6">
            <div v-if="!sortInput.trim()" class="py-12 text-center">
              <List class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">粘贴版本列表后，这里会按语义化规则排序</p>
            </div>
            <template v-else>
              <p class="text-xs text-muted-foreground mb-3">共 {{ sortedResult.total }} 行，有效 {{ sortedResult.valid.length }} 条，无效 {{ sortedResult.invalid.length }} 条</p>
              <div v-if="sortedResult.valid.length" class="divide-y divide-border/50 rounded-lg border border-border overflow-hidden mb-4">
                <div v-for="(item, idx) in sortedResult.valid" :key="idx" class="flex items-center gap-3 px-4 py-2 bg-muted/30">
                  <span class="text-xs text-muted-foreground w-6">{{ idx + 1 }}</span>
                  <span class="font-mono text-sm text-foreground">{{ item.raw }}</span>
                </div>
              </div>
              <div v-if="sortedResult.invalid.length" class="flex items-start gap-2 bg-yellow-500/10 rounded-lg p-3">
                <AlertTriangle class="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div class="text-xs text-muted-foreground">
                  <p class="text-yellow-500 font-medium mb-1">以下 {{ sortedResult.invalid.length }} 行无法解析，已跳过：</p>
                  <p class="font-mono">{{ sortedResult.invalid.join('、') }}</p>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 范围判断结果 -->
        <div v-else class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 范围判断
            </h2>
          </div>
          <div class="p-6">
            <div v-if="!rangeInput.trim() || !rangeVersionInput.trim()" class="py-12 text-center">
              <CheckCircle class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">输入范围与版本号后，这里会显示匹配结论</p>
            </div>
            <div v-else-if="!rangeParsed" class="py-10 text-center">
              <XCircle class="w-10 h-10 mx-auto mb-3 text-destructive" />
              <p class="text-sm text-destructive font-medium mb-1">范围表达式无法解析</p>
              <p class="text-xs text-muted-foreground">{{ rangeError }}</p>
            </div>
            <div v-else-if="!rangeVersionParsed" class="py-10 text-center">
              <XCircle class="w-10 h-10 mx-auto mb-3 text-destructive" />
              <p class="text-sm text-destructive font-medium mb-1">版本号不符合 SemVer 规范</p>
              <p class="text-xs text-muted-foreground">请检查待判断的版本号格式</p>
            </div>
            <template v-else>
              <div class="flex items-center gap-3 py-3 mb-4">
                <CheckCircle v-if="rangeSatisfies" class="w-8 h-8 text-green-500" />
                <XCircle v-else class="w-8 h-8 text-destructive" />
                <div>
                  <p class="text-lg font-bold" :class="rangeSatisfies ? 'text-green-500' : 'text-destructive'">
                    {{ rangeSatisfies ? '满足范围' : '不满足范围' }}
                  </p>
                  <p class="text-xs text-muted-foreground font-mono">{{ rangeVersionInput.trim() }} {{ rangeSatisfies ? '∈' : '∉' }} {{ rangeInput.trim() }}</p>
                </div>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-xs font-medium text-foreground mb-2">范围展开说明</p>
                <div class="space-y-1.5">
                  <p v-for="(set, idx) in rangeExpanded" :key="idx" class="text-xs font-mono text-muted-foreground">
                    <span v-if="rangeExpanded.length > 1" class="text-primary mr-1">组 {{ idx + 1 }}：</span>{{ set }}
                  </p>
                </div>
                <p v-if="rangeVersionParsed.prerelease.length > 0" class="text-xs text-muted-foreground mt-2">
                  含先行版本的版本号只有在范围中显式指定了同 [major.minor.patch] 元组的先行版本比较器时才会匹配（npm 规则）。
                </p>
              </div>
            </template>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于SemVer版本解析比较器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            语义化版本（Semantic Versioning，简称 SemVer）是目前最流行的版本号规范，由主版本号（MAJOR）、次版本号（MINOR）和修订号（PATCH）三段数字组成，可附加先行版本标识（如 alpha、beta、rc.1）与构建元数据。npm、Maven、Cargo、Go Modules 等主流包管理器都基于 SemVer 进行依赖解析，理解它的优先级规则是排查「为什么没有装上最新版本」「为什么锁文件突然变了」这类问题的基础。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>发版前确认新版本号与旧版本的语义关系（修复应升 PATCH、加功能应升 MINOR、破坏性变更应升 MAJOR）</li>
            <li>排查依赖冲突：把 package.json 里的 ^ ~ 范围展开成精确区间，确认某个已安装版本是否真的满足约束</li>
            <li>整理发布清单：把散落在 issue 里的版本号批量排序，核对发布顺序</li>
            <li>校验先行版本命名是否规范（alpha.1、beta.2、rc 而不是随意字符串）</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么 1.0.0-alpha 比 1.0.0 小？</span>规范规定有先行版本标识的版本优先级低于正式版本，因为先行版本还在测试中。</li>
            <li><span class="text-foreground font-medium">构建元数据影响比较吗？</span>不影响。+build.1 与 +build.999 优先级相同，比较时会被忽略。</li>
            <li><span class="text-foreground font-medium">^0.2.3 为什么不展开到 &lt;1.0.0？</span>0.x 阶段 API 尚不稳定，npm 规定 ^0.2.3 只锁定到 &lt;0.3.0，^0.0.3 更是只允许 &lt;0.0.4。</li>
            <li><span class="text-foreground font-medium">数据会上传吗？</span>不会。解析、比较、排序全部在浏览器本地完成。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'semver-parser'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Tag, Terminal, GitBranch, List, BarChart3, Info, CheckCircle, XCircle,
  AlertTriangle, ArrowRight, Copy, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'SemVer版本解析比较器 - 语义化版本号解析/比较/排序工具',
  description: '在线语义化版本号工具：按semver.org规范解析major/minor/patch/prerelease/build，支持版本比较、批量排序、^与~范围匹配判断，纯本地计算',
  keywords: 'semver解析, 语义化版本, 版本比较, 版本排序, semver range, 依赖版本范围, 版本号规范',
  author: 'Util工具箱',
  ogTitle: 'SemVer版本解析比较器 - 有条工具',
  ogDescription: '解析、比较、排序语义化版本号，支持 ^ ~ 范围匹配判断',
  ogUrl: 'https://www.util.cn/tools/semver-parser',
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
          '@type': 'WebApplication',
          name: 'SemVer版本解析比较器',
          url: 'https://www.util.cn/tools/semver-parser',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['版本号解析校验', '版本优先级比较', '批量语义化排序', '^与~范围匹配判断']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'SemVer版本解析比较器', item: 'https://www.util.cn/tools/semver-parser/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么 1.0.0-alpha 小于 1.0.0？',
              acceptedAnswer: { '@type': 'Answer', text: 'SemVer 规范规定带先行版本标识的版本优先级低于同版本号的正式版本，因为先行版本仍处于测试阶段。' }
            },
            {
              '@type': 'Question',
              name: '^1.2.3 与 ~1.2.3 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '^1.2.3 表示 >=1.2.3 <2.0.0（允许次版本与修订号升级），~1.2.3 表示 >=1.2.3 <1.3.0（只允许修订号升级）。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'semver-parser')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const activeTab = ref('parse')
const tabs = [
  { value: 'parse', label: '解析' },
  { value: 'compare', label: '比较' },
  { value: 'sort', label: '排序' },
  { value: 'range', label: '范围判断' }
]

const parseInput = ref('')
const compareA = ref('')
const compareB = ref('')
const sortInput = ref('')
const sortDirection = ref('asc')
const rangeInput = ref('')
const rangeVersionInput = ref('')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- SemVer 手写解析（semver.org 规范正则） ----------
const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

const parseVersion = (str) => {
  const raw = String(str || '').trim()
  if (!raw) return null
  const m = SEMVER_RE.exec(raw)
  if (!m) return null
  return {
    raw,
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ? m[4].split('.') : [],
    build: m[5] || ''
  }
}

const versionKind = (v) => {
  const bits = []
  if (v.prerelease.length > 0) bits.push('先行版本')
  else bits.push('正式版本')
  if (v.major === 0) bits.push('0.x 阶段（API 尚不稳定）')
  else if (v.minor === 0 && v.patch === 0) bits.push('主版本首发')
  if (v.build) bits.push('携带构建元数据')
  return bits.join('，')
}

const parseErrorText = computed(() => {
  const s = parseInput.value.trim()
  if (!s) return ''
  if (/^\d+\.\d+\.\d+(\.\d+)+/.test(s)) return '版本号段数超过三段（SemVer 只允许 major.minor.patch 三段，多出的段应放入先行版本或构建元数据）'
  if (/\b0\d+/.test(s.split('-')[0].split('+')[0])) return '数字段含前导零（如 01.2.3），规范不允许'
  if ((s.match(/-/g) || []).length > 1 && !s.includes('+-')) return '先行版本标识中出现了多个连字符，请检查格式'
  return '请检查格式：应为 主版本.次版本.修订号[-先行版本][+构建]，各段不得有前导零，先行版本标识只能含数字、字母与连字符'
})

// ---------- 优先级比较 ----------
const cmpNumeric = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

const cmpPrereleaseId = (a, b) => {
  const aNum = /^\d+$/.test(a)
  const bNum = /^\d+$/.test(b)
  if (aNum && bNum) return cmpNumeric(Number(a), Number(b))
  if (aNum) return -1  // 数字标识符优先级低于字母标识符
  if (bNum) return 1
  return a < b ? -1 : a > b ? 1 : 0
}

const compareVersions = (a, b) => {
  let c = cmpNumeric(a.major, b.major)
  if (c !== 0) return c
  c = cmpNumeric(a.minor, b.minor)
  if (c !== 0) return c
  c = cmpNumeric(a.patch, b.patch)
  if (c !== 0) return c
  const ap = a.prerelease
  const bp = b.prerelease
  if (ap.length === 0 && bp.length === 0) return 0
  if (ap.length === 0) return 1   // 无先行版本者优先级更高
  if (bp.length === 0) return -1
  const len = Math.max(ap.length, bp.length)
  for (let i = 0; i < len; i++) {
    if (i >= ap.length) return -1 // 标识符字段少者优先级更低
    if (i >= bp.length) return 1
    const d = cmpPrereleaseId(ap[i], bp[i])
    if (d !== 0) return d
  }
  return 0
}

// 解析 tab
const parseResult = computed(() => parseVersion(parseInput.value))

// 比较 tab
const parsedA = computed(() => parseVersion(compareA.value))
const parsedB = computed(() => parseVersion(compareB.value))
const compareErrorA = computed(() => {
  if (!compareA.value.trim()) return '请输入版本 A'
  return parsedA.value ? '' : '版本 A 不符合 SemVer 规范'
})
const compareErrorB = computed(() => {
  if (!compareB.value.trim()) return '请输入版本 B'
  return parsedB.value ? '' : '版本 B 不符合 SemVer 规范'
})

const compareResult = computed(() => {
  if (!parsedA.value || !parsedB.value) return { symbol: '?', sentence: '', upgrade: '', note: '' }
  const c = compareVersions(parsedA.value, parsedB.value)
  const symbol = c > 0 ? '>' : c < 0 ? '<' : '='
  const hi = c > 0 ? parsedA.value : c < 0 ? parsedB.value : null
  const lo = c > 0 ? parsedB.value : c < 0 ? parsedA.value : null
  const sentence = c === 0
    ? '两个版本优先级相同（构建元数据差异不影响比较结果）'
    : `${hi.raw} ${symbol} ${lo.raw}，${hi.raw} 的优先级更高`
  const upgrade = c === 0
    ? '无需升级，两者在语义上等价'
    : `可从 ${lo.raw} 升级到 ${hi.raw}${hi.prerelease.length > 0 ? '（目标为先行版本，建议先在测试环境验证）' : ''}`
  let note = ''
  if (parsedA.value.prerelease.length > 0 && parsedB.value.prerelease.length > 0) {
    note = '两个版本都带先行版本标识：按标识符逐段比较——纯数字段按数值比较（alpha.2 > alpha.1），字母段按 ASCII 比较（beta > alpha），数字段优先级低于字母段，段数多者优先级更高。'
  } else if (parsedA.value.prerelease.length > 0 || parsedB.value.prerelease.length > 0) {
    note = '其中一方为先行版本：规范规定 1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-beta < 1.0.0，正式发布后优先级立即反超所有先行版本。'
  }
  return { symbol, sentence, upgrade, note }
})

// 排序 tab
const sortedResult = computed(() => {
  const lines = sortInput.value.split('\n').map(l => l.trim()).filter(Boolean)
  const valid = []
  const invalid = []
  lines.forEach(line => {
    const v = parseVersion(line)
    if (v) valid.push(v)
    else invalid.push(line)
  })
  valid.sort((a, b) => {
    const c = compareVersions(a, b)
    return sortDirection.value === 'asc' ? c : -c
  })
  return { total: lines.length, valid, invalid }
})

const sortedText = computed(() => sortedResult.value.valid.map(v => v.raw).join('\n'))

const copySorted = async () => {
  if (!sortedText.value) return
  try {
    await navigator.clipboard.writeText(sortedText.value)
    alert('已复制')
  } catch (err) {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = sortedText.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制')
  }
}

// ---------- 范围判断（^ ~ 与基础比较器组合） ----------
const makeVersion = (major, minor, patch, prerelease = []) => ({
  raw: `${major}.${minor}.${patch}${prerelease.length ? '-' + prerelease.join('.') : ''}`,
  major, minor, patch, prerelease, build: ''
})

const parsePartial = (str) => {
  // 解析可能含 x/X/* 的部分版本：1 / 1.2 / 1.2.x / 1.x / *
  const clean = String(str || '').trim()
  if (!clean) return { major: null, minor: null, patch: null, prerelease: [] }
  const parts = clean.split('.')
  const isX = (s) => s === 'x' || s === 'X' || s === '*'
  if (parts.length > 3) return null
  const read = (s) => {
    if (s === undefined) return null
    if (isX(s)) return null
    if (!/^\d+$/.test(s)) return null
    return Number(s)
  }
  const major = read(parts[0])
  if (parts[0] !== undefined && !isX(parts[0]) && major === null) return null
  let minor = null
  let patch = null
  let prerelease = []
  if (parts.length >= 2) {
    minor = read(parts[1])
    if (!isX(parts[1]) && minor === null) return null
  }
  if (parts.length >= 3) {
    if (isX(parts[2])) {
      patch = null
    } else {
      // 末段允许带先行版本
      const seg = parts[2].split('-')
      if (!/^\d+$/.test(seg[0])) return null
      patch = Number(seg[0])
      if (seg.length > 1) {
        prerelease = seg.slice(1).join('-').split('.').filter(Boolean)
      }
    }
  }
  return { major, minor, patch, prerelease }
}

const caretUpper = (p) => {
  if (p.major === null) return makeVersion(0, 0, 0)
  if (p.major > 0) return makeVersion(p.major + 1, 0, 0)
  if (p.minor === null) return makeVersion(1, 0, 0)
  if (p.minor > 0) return makeVersion(0, p.minor + 1, 0)
  if (p.patch === null) return makeVersion(0, p.minor + 1, 0)
  return makeVersion(0, 0, p.patch + 1)
}

const toComparators = (token) => {
  token = token.trim()
  if (!token) return []
  if (token === '*' || token === 'x' || token === 'X') return [{ op: '>=', ver: makeVersion(0, 0, 0) }]
  if (token.startsWith('^')) {
    const p = parsePartial(token.slice(1))
    if (!p) return null
    return [
      { op: '>=', ver: makeVersion(p.major ?? 0, p.minor ?? 0, p.patch ?? 0, p.prerelease) },
      { op: '<', ver: caretUpper(p) }
    ]
  }
  if (token.startsWith('~')) {
    const p = parsePartial(token.slice(1))
    if (!p) return null
    const base = makeVersion(p.major ?? 0, p.minor ?? 0, p.patch ?? 0, p.prerelease)
    let upper
    if (p.major === null) upper = makeVersion(0, 0, 0)
    else if (p.minor === null) upper = makeVersion(p.major + 1, 0, 0)
    else upper = makeVersion(p.major, p.minor + 1, 0)
    return [{ op: '>=', ver: base }, { op: '<', ver: upper }]
  }
  const m = /^(>=|<=|>|<|=)?\s*(.+)$/.exec(token)
  if (!m) return null
  const op = m[1] || '='
  const p = parsePartial(m[2])
  if (!p) return null
  if (p.major === null) return [{ op: '>=', ver: makeVersion(0, 0, 0) }]
  if (p.minor === null) {
    if (op === '=') return [{ op: '>=', ver: makeVersion(p.major, 0, 0) }, { op: '<', ver: makeVersion(p.major + 1, 0, 0) }]
    return [{ op, ver: makeVersion(p.major, 0, 0) }]
  }
  if (p.patch === null) {
    if (op === '=') return [{ op: '>=', ver: makeVersion(p.major, p.minor, 0) }, { op: '<', ver: makeVersion(p.major, p.minor + 1, 0) }]
    return [{ op, ver: makeVersion(p.major, p.minor, 0) }]
  }
  return [{ op, ver: makeVersion(p.major, p.minor, p.patch, p.prerelease) }]
}

const parseRange = (rangeStr) => {
  const groups = rangeStr.split('||').map(g => g.trim()).filter(Boolean)
  const result = []
  for (const g of groups) {
    const comps = []
    for (const token of g.split(/\s+/).filter(Boolean)) {
      const list = toComparators(token)
      if (list === null || (list.length === 0 && token !== '')) return null
      comps.push(...list)
    }
    if (comps.length === 0) return null
    result.push(comps)
  }
  return result.length ? result : null
}

const satisfiesComparator = (v, comp) => {
  const c = compareVersions(v, comp.ver)
  switch (comp.op) {
    case '>=': return c >= 0
    case '>': return c > 0
    case '<=': return c <= 0
    case '<': return c < 0
    default: return c === 0
  }
}

const satisfiesRange = (v, sets) => {
  return sets.some(comps => {
    if (!comps.every(c => satisfiesComparator(v, c))) return false
    if (v.prerelease.length > 0) {
      // npm 规则：带先行版本的版本号只有在范围显式指定同元组先行版本时才匹配
      const ok = comps.some(c =>
        c.ver.prerelease.length > 0 &&
        c.ver.major === v.major && c.ver.minor === v.minor && c.ver.patch === v.patch
      )
      if (!ok) return false
    }
    return true
  })
}

const rangeVersionParsed = computed(() => parseVersion(rangeVersionInput.value))

const rangeParsed = computed(() => {
  if (!rangeInput.value.trim()) return null
  return parseRange(rangeInput.value)
})

const rangeError = computed(() => '支持的写法：^1.2.3、~1.2.3、>=1.0.0、<2.0.0、=1.2.3、1.2.x、1.x、*，比较器之间用空格（与）或 ||（或）分隔')

const rangeSatisfies = computed(() => {
  if (!rangeParsed.value || !rangeVersionParsed.value) return false
  return satisfiesRange(rangeVersionParsed.value, rangeParsed.value)
})

const rangeExpanded = computed(() => {
  if (!rangeParsed.value) return []
  return rangeParsed.value.map(comps =>
    comps.map(c => `${c.op} ${c.ver.raw}`).join(' 且 ')
  )
})
</script>
