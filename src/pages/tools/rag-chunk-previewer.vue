<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Layers class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">RAG 分块预览器</h1>
          <p class="text-sm text-muted-foreground mt-1">固定长度 / 递归 / Markdown 三种切分策略实时预览，chunk size 与 overlap 调参，token 估算与 JSONL 导出</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 RAG 分块预览工具：搭 RAG 知识库前，先把「文档 → 分块（chunk）」策略调对再上线。粘贴文档后选择 fixed / recursive / markdown 切分策略，
        实时查看每一块的字符数、token 估算、所在行号范围与相邻块重叠情况，并一键导出 JSONL 直接用于向量化入库。全部分析在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 说明条 -->
    <div class="flex items-start gap-2 mb-6 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20 text-xs leading-relaxed text-muted-foreground">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>
        纯本地分析：文档只在你浏览器内存中处理，不会上传服务器。token 数为启发式估算（与站内 Token 成本计算器同口径：CJK 字符约 1 字 ≈ 1 token，非 CJK 约 4 字符 ≈ 1 token），仅供调参参考，不同模型分词器结果会有差异。
      </span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左列：参数面板 + 操作 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Braces class="w-5 h-5 mr-2 text-primary" /> 分块参数
          </h2>

          <!-- 切分策略 -->
          <div class="space-y-1.5">
            <label for="chunk-strategy" class="text-sm font-medium text-foreground">切分策略</label>
            <select
              id="chunk-strategy"
              v-model="strategy"
              class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg text-sm text-foreground"
            >
              <option value="recursive">递归切分 recursive（推荐）</option>
              <option value="fixed">固定长度 fixed（硬切）</option>
              <option value="markdown">Markdown 标题 markdown</option>
            </select>
          </div>

          <!-- Markdown 标题层级 -->
          <div v-if="strategy === 'markdown'" class="space-y-1.5">
            <label for="chunk-max-level" class="text-sm font-medium text-foreground">标题切分层级</label>
            <select
              id="chunk-max-level"
              v-model.number="maxLevel"
              class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg text-sm text-foreground"
            >
              <option :value="1">仅按 H1 切大段</option>
              <option :value="2">按 H1-H2 切大段</option>
              <option :value="3">按 H1-H3 切大段</option>
            </select>
          </div>

          <!-- chunk size -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label for="chunk-size" class="text-sm font-medium text-foreground">chunk size（字符）</label>
              <input
                id="chunk-size"
                v-model.number="chunkSize"
                type="number"
                min="100"
                max="2000"
                step="10"
                class="w-24 px-2 py-1 bg-muted border border-border border-border rounded-md text-sm text-right font-mono text-foreground"
                @change="clampChunkSize"
              >
            </div>
            <input v-model.number="chunkSize" type="range" min="100" max="2000" step="10" class="w-full" @change="clampChunkSize">
            <p class="text-xs text-muted-foreground">范围 100-2000，默认 500。社区常用口径为 256-512 token，中文约对应 250-500 字。</p>
          </div>

          <!-- overlap -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label for="chunk-overlap" class="text-sm font-medium text-foreground">overlap（重叠字符）</label>
              <input
                id="chunk-overlap"
                v-model.number="overlap"
                type="number"
                min="0"
                :max="overlapLimit"
                step="5"
                class="w-24 px-2 py-1 bg-muted border border-border border-border rounded-md text-sm text-right font-mono text-foreground"
                @change="clampOverlap"
              >
            </div>
            <input v-model.number="overlap" type="range" min="0" :max="overlapLimit" step="5" class="w-full" @change="clampOverlap">
            <p class="text-xs flex items-start gap-1.5" :class="overlapExceeded ? 'text-red-500' : 'text-muted-foreground'">
              <TriangleAlert v-if="overlapExceeded" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ overlapExceeded ? `overlap 不能超过 chunk size 的一半（${overlapLimit}），已按 ${overlapLimit} 计算` : `默认 50，上限 chunk size 的一半（${overlapLimit}），建议取块长的 10%-20%。` }}</span>
            </p>
          </div>

          <!-- 策略说明 -->
          <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground">{{ strategyHint }}</p>
        </div>

        <!-- 操作 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <RefreshCw class="w-5 h-5 mr-2 text-primary" /> 操作
          </h2>
          <button
            @click="rechunkNow"
            class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重新分块
          </button>
          <button
            @click="exportJsonl"
            class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <Download class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 导出 JSONL
          </button>
          <p
            v-if="actionMessage"
            class="text-xs leading-relaxed p-2.5 rounded flex items-start gap-1.5"
            :class="actionMessage.type === 'ok' ? 'bg-green-500/10 text-green-600' : actionMessage.type === 'warn' ? 'bg-red-500/10 text-red-600' : 'bg-muted/60 text-muted-foreground'"
          >
            <CheckCircle v-if="actionMessage.type === 'ok'" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <TriangleAlert v-else-if="actionMessage.type === 'warn'" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <Info v-else class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ actionMessage.text }}</span>
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">参数变更会自动重算（防抖 300ms）；JSONL 每行为 {"index","text","tokens"}，可直接用于 Embedding 批量入库。</p>
        </div>
      </div>

      <!-- 右列：输入 + 统计 + 块列表 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 输入区 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <h2 class="text-lg font-semibold flex items-center">
              <FileText class="w-5 h-5 mr-2 text-primary" /> 输入文档
            </h2>
            <p class="text-xs text-muted-foreground font-mono">
              {{ inputChars.toLocaleString() }} 字符 · ≈{{ inputTokens.toLocaleString() }} tokens
            </p>
          </div>
          <textarea
            v-model="inputText"
            rows="14"
            spellcheck="false"
            placeholder="粘贴需要分块的文档（支持 Markdown / 纯文本 / 中英文混合），或点击下方「载入示例文档」快速体验……"
            class="w-full px-3 py-2.5 bg-muted/40 border border-border border-border rounded-lg text-sm font-mono leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
          ></textarea>
          <p
            v-if="inputTruncated"
            class="text-xs leading-relaxed p-2.5 rounded bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 flex items-start gap-1.5"
          >
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>输入超过 200KB，已截断前 200KB 参与分析，超出部分不计入分块。</span>
          </p>
          <div class="flex flex-wrap gap-3">
            <button
              @click="loadSample"
              class="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition"
            >
              <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 载入示例文档
            </button>
            <button
              @click="clearInput"
              class="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >
              清空输入
            </button>
          </div>
        </div>

        <!-- 分块结果 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <h2 class="text-lg font-semibold flex items-center">
              <Layers class="w-5 h-5 mr-2 text-primary" /> 分块结果
            </h2>
            <p class="text-xs text-muted-foreground">当前策略：{{ strategyLabels[debouncedParams.strategy] }} · 块内高亮 = 与上一块的重叠部分</p>
          </div>

          <!-- 统计条 6 卡 -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div class="bg-muted/40 border border-border rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">总块数</p>
              <p class="text-xl font-bold text-primary">{{ analysis.chunks.length }}</p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">总 tokens</p>
              <p class="text-xl font-bold text-foreground">{{ analysis.totalTokens.toLocaleString() }}</p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">平均块长</p>
              <p class="text-xl font-bold text-foreground">{{ analysis.avgChars }}<span class="text-xs font-normal text-muted-foreground ml-0.5">字符</span></p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">最大块</p>
              <p class="text-xl font-bold text-foreground">{{ analysis.maxChars }}<span class="text-xs font-normal text-muted-foreground ml-0.5">字符</span></p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">最小块</p>
              <p class="text-xl font-bold text-foreground">{{ analysis.minChars }}<span class="text-xs font-normal text-muted-foreground ml-0.5">字符</span></p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">平均重叠</p>
              <p class="text-xl font-bold text-foreground">{{ analysis.avgOverlap }}<span class="text-xs font-normal text-muted-foreground ml-0.5">字符</span></p>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="!analysis.chunks.length" class="py-10 text-center">
            <Layers class="w-10 h-10 text-primary/30 mx-auto mb-2" />
            <p class="text-sm text-muted-foreground">暂无分块结果：在上方输入文档（或载入示例文档），选择策略后自动分块</p>
          </div>

          <!-- 块卡片列表 -->
          <div v-else class="space-y-3">
            <div
              v-for="chunk in displayChunks"
              :key="chunk.index"
              class="border border-border rounded-lg p-3 space-y-2 bg-muted/20"
            >
              <p class="text-xs text-muted-foreground font-mono flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span class="text-primary font-semibold">#{{ chunk.index + 1 }}</span>
                <span aria-hidden="true">·</span>
                <span>{{ chunk.startLine === chunk.endLine ? `L${chunk.startLine}` : `L${chunk.startLine}-L${chunk.endLine}` }}</span>
                <span aria-hidden="true">·</span>
                <span>{{ chunk.chars }} 字符</span>
                <span aria-hidden="true">·</span>
                <span>≈{{ chunk.tokens }} tokens</span>
                <span aria-hidden="true">·</span>
                <span :class="chunk.overlapChars > 0 ? 'text-sky-600 dark:text-sky-400' : ''">重叠 {{ chunk.overlapChars }} 字符</span>
              </p>
              <pre class="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground bg-background border border-border/60 rounded p-3 max-h-56 overflow-y-auto m-0"><span v-if="chunk.overlapChars > 0" class="bg-sky-500/20 text-sky-700 dark:text-sky-300 rounded-sm">{{ chunk.text.slice(0, chunk.overlapChars) }}</span>{{ chunk.overlapChars > 0 ? chunk.text.slice(chunk.overlapChars) : chunk.text }}</pre>
            </div>
            <p v-if="analysis.chunks.length > maxDisplayChunks" class="text-xs text-muted-foreground text-center py-2 border-t border-border">
              仅显示前 {{ maxDisplayChunks }} 块，其余 {{ analysis.chunks.length - maxDisplayChunks }} 块已计入上方统计，导出 JSONL 包含全部分块。
            </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>RAG 分块预览器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          RAG 分块预览器是一款面向 RAG（检索增强生成）知识库建设者的在线调参工具。把文档粘贴进来，选择固定长度（fixed）、递归（recursive）或 Markdown 标题（markdown）三种切分策略，
          实时看到每个 chunk 的字符数、token 估算、在原文中的行号范围，以及相邻块之间的重叠内容（浅蓝高亮）；调整 chunk size 与 overlap 后结果自动重算，
          调好后一键导出 JSONL，直接交给 Embedding 模型向量化入库。所有计算都在浏览器本地完成，适合在批量入库前快速验证分块边界是否合理。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">RAG 里的 chunk 是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          chunk（块）是 RAG 知识库检索的最小单位：长文档不会整篇送入向量数据库，而是先被切成若干段文本，每段单独计算 Embedding 向量。
          用户提问时，系统把问题也向量化，召回与问题最相似的 Top-K 个 chunk，拼进 Prompt 交给大模型生成回答。chunk 切得太碎，单块信息量不足、语义不完整；
          切得太大，关键信息被稀释、检索命中率下降还会浪费 token。分块质量直接决定 RAG 检索质量的上限。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">chunk size 和 overlap 怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          社区的主流共识口径：chunk size 取 256-512 token，overlap 取 chunk size 的 10%-20%。中文按「1 字 ≈ 1 token」估算，256-512 token 大约对应 250-500 个汉字。
          事实型问答（FAQ、手册）可偏向较小块（256 token 左右）提高命中精度；长上下文推理、技术文档可偏向较大块（512 token）保留更多语境。
          overlap 保证跨块边界的句子不会完全丢失语义，过小容易切断上下文，过大则大量重复内容浪费存储与 token，一般 10%-20% 是性价比最高的区间。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">三种切分策略怎么选？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>固定长度（fixed）：按 chunk size 硬切，实现最简单、块长完全可控，适合格式统一的纯文本、日志等；缺点是常把句子从中间切断。</li>
          <li>递归（recursive）：按「段落 → 句子 → 空格 → 字符」分隔符优先级逐级降级，尽量在语义边界收尾，是 LangChain 等框架的默认策略，中英文文档的首选。</li>
          <li>Markdown（markdown）：先按标题层级把文档切成大段（天然语义边界），超长段内再递归切分，最适合带标题结构的 Markdown 文档、Wiki、技术手册。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">固定长度切分 vs 语义切分</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          固定长度切分只看字符数，优点是可预期、向量长度分布均匀，缺点是无视语义，可能把一句话、一个论点切成两半。语义切分（本页的 recursive / markdown 属于简化版）
          依据换行、句号、标题等自然边界下刀，块更接近完整语义单元，检索命中率通常更高，代价是块长不均、实现稍复杂。实践中的折中做法：用语义边界切分，
          同时保留 chunk size 上限与 overlap 兜底——这正是递归策略的工作方式。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">本工具的数据会上传吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不会。分块、token 估算、JSONL 导出全部在你的浏览器内存中完成，不发送任何网络请求，刷新页面后数据即清空，可以放心粘贴内部文档调试分块策略。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">RAG 分块预览器是做什么用的？</h3>
            <p class="text-sm text-muted-foreground mt-1">在把文档批量向量化入库前，用它预览「文档 → chunk」的实际切分效果：检查块是否在句子中间被切断、行号范围是否合理、重叠是否覆盖边界语义，调好参数再导出 JSONL 入库，避免上百万文档分完块才发现质量不行。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">chunk size 和 overlap 推荐设多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">社区共识口径：chunk size 取 256-512 token，overlap 取块长的 10%-20%。本页按「中文 1 字 ≈ 1 token、英文约 4 字符 ≈ 1 token」估算，中文场景可先把 chunk size 设在 300-500 字、overlap 设 50 字附近，再用评测集微调。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">三种切分策略该选哪一个？</h3>
            <p class="text-sm text-muted-foreground mt-1">Markdown 文档选 markdown（按标题切大段）；普通中英文文档选 recursive（按段落、句子边界聚合，LangChain 默认思路）；格式统一的纯文本或想严格控制块长时选 fixed。拿不准就三种都跑一遍，对比块边界与 token 分布。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">粘贴的文档会被上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有分块与统计都在浏览器本地内存中计算，无任何网络请求；导出的 JSONL 也只是本地文件下载，刷新页面后输入内容自动清空。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'rag-chunk-previewer'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Layers, Braces, FileText, Download, RefreshCw,
  ChevronUp, ChevronDown, TriangleAlert, CheckCircle, Info, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'RAG 分块预览器 - 在线文档 chunk 分块/Token 估算/JSONL 导出工具',
  description: '免费在线 RAG 分块预览工具：固定长度、递归、Markdown 标题三种切分策略实时预览 chunk 边界，chunk size 与 overlap 调参，CJK 友好 token 估算，块行号与重叠可视化，一键导出 JSONL 用于向量化入库，纯浏览器本地运行不上传数据。',
  keywords: 'RAG分块,chunk预览,文本分块工具,chunk size,overlap设置,递归切分,markdown分块,token估算,RAG知识库,JSONL导出,LangChain分块',
  author: '有条工具',
  ogTitle: 'RAG 分块预览器 - 在线文档 chunk 分块/Token 估算工具 | 有条工具',
  ogDescription: '三种切分策略实时预览 chunk 边界，chunk size 与 overlap 调参，导出 JSONL 直接入库。',
  ogUrl: 'https://www.util.cn/tools/rag-chunk-previewer',
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
          name: 'RAG 分块预览器',
          url: 'https://www.util.cn/tools/rag-chunk-previewer',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['固定长度/递归/Markdown 三种切分策略', 'chunk size 与 overlap 实时调参', 'CJK 友好 token 启发式估算', '块行号范围与重叠高亮可视化', '导出 JSONL 用于向量化入库', '纯本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'RAG 分块预览器', item: 'https://www.util.cn/tools/rag-chunk-previewer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'RAG 分块预览器是做什么用的？',
              acceptedAnswer: { '@type': 'Answer', text: '在把文档批量向量化入库前，预览「文档到 chunk」的实际切分效果：检查块是否在句子中间被切断、行号范围是否合理、重叠是否覆盖边界语义，调好参数再导出 JSONL 入库。' }
            },
            {
              '@type': 'Question',
              name: 'chunk size 和 overlap 推荐设多少？',
              acceptedAnswer: { '@type': 'Answer', text: '社区共识口径：chunk size 取 256-512 token，overlap 取块长的 10%-20%。中文按 1 字约 1 token 估算，可先把 chunk size 设在 300-500 字、overlap 设 50 字附近，再用评测集微调。' }
            },
            {
              '@type': 'Question',
              name: '三种切分策略该选哪一个？',
              acceptedAnswer: { '@type': 'Answer', text: 'Markdown 文档选 markdown（按标题切大段）；普通中英文文档选 recursive（按段落、句子边界聚合）；格式统一的纯文本或需严格控制块长时选 fixed。拿不准可三种都跑一遍对比。' }
            },
            {
              '@type': 'Question',
              name: '粘贴的文档会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有分块与统计都在浏览器本地内存中计算，无任何网络请求；导出的 JSONL 也只是本地文件下载，刷新页面后输入内容自动清空。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 常量与示例文档 ----------
const MAX_INPUT_BYTES = 200 * 1024 // 输入超过 200KB 截断
const MAX_DISPLAY_CHUNKS = 200     // 最多渲染前 200 块
const CHUNK_SIZE_MIN = 100
const CHUNK_SIZE_MAX = 2000
const DEBOUNCE_MS = 300

const SAMPLE_DOC = `# RAG 知识库建设指南（示例文档）

这是一份用于测试分块效果的中英混合 Markdown 示例文档，包含标题、段落、列表与代码块。你可以切换上方策略，观察块边界的变化。

## 什么是 RAG

RAG（Retrieval-Augmented Generation，检索增强生成）是一种把外部知识库与大语言模型结合的技术方案：先从知识库中检索与问题最相关的文本片段（chunk），再把这些片段作为上下文交给模型生成回答，从而缓解幻觉与知识过时问题。

### 核心流程

- 文档解析：把 PDF、Word、网页等原始文档转换为纯文本或 Markdown
- 文本分块：按固定长度或语义边界把长文切成适合检索的 chunk
- 向量化：使用 Embedding 模型把每个 chunk 编码为向量并存入向量数据库
- 检索召回：用户提问时把问题同样向量化，召回最相似的 Top-K 个 chunk
- 生成回答：把召回内容与问题拼装成 Prompt，交给 LLM 生成最终答案

## 分块策略详解

固定长度分块（fixed）实现最简单：按 chunkSize 硬切并配合 overlap 保证上下文连续，适合格式统一的纯文本；缺点是可能把一句话从中间切断，影响检索质量。

递归分块（recursive）按照分隔符优先级（段落、句子、空格）逐级降级切分，在块长与语义完整性之间取得平衡，是 LangChain 等框架的默认策略，适合大多数中英文文档。

### Token 与成本估算

- 中文场景建议 chunkSize 取 256-512 token
- overlap 建议取 chunkSize 的 10%-20%
- 向量库检索精度与 chunk 粒度强相关，需要用评测集验证

下面是一段示例配置：

\`\`\`json
{
  "chunk_size": 500,
  "chunk_overlap": 50,
  "separators": ["\\n\\n", "\\n", "。"]
}
\`\`\`

### 常见误区

1. chunk 越大越好：过大的块会稀释关键信息，降低检索命中率。
2. 完全不需要 overlap：没有重叠时，跨块边界的语义会丢失。
3. 所有文档共用一套参数：合同、FAQ、长文应分别调参。

## 评估与调优

上线前建议构建评测集（question + expected chunk），用 Recall@K 与 HitRate 量化分块质量，再迭代调整 chunkSize、overlap 与切分策略。A good practice is to evaluate chunking offline before indexing millions of documents.

You can also mix English paragraphs with 中文段落 in the same document, then compare token estimation across strategies. Try switching to markdown mode to see how headings become natural chunk boundaries.`

// ---------- 纯逻辑（可独立单测） ----------
const DEFAULT_SEPARATORS = ['\n\n', '\n', '。', '．', '.', '！', '？', ' ', '']
const MAX_SPLIT_GUARD = 20000 // 所有切分循环的最大迭代保护，防死循环

// token 启发式估算：CJK 字符 1 字 ≈ 1 token，其余字符约 4 字符 ≈ 1 token
function estimateTokens(text) {
  if (!text) return 0
  let cjk = 0
  let other = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if ((code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf)) cjk++
    else other++
  }
  return cjk + Math.ceil(other / 4)
}

// 超长输入截断：只保留前 200KB 参与分析
function truncateText(text, limit = MAX_INPUT_BYTES) {
  if (!text || text.length <= limit) return text || ''
  return text.slice(0, limit)
}

// 固定长度切分：按 size 硬切，步长 = size - overlap，相邻块共享 overlap 字符
function splitFixed(text, size, overlap = 0) {
  if (!text) return []
  const safeSize = Math.max(1, Math.floor(size) || 1)
  const safeOverlap = Math.min(Math.max(0, Math.floor(overlap) || 0), safeSize - 1) // overlap ≥ size 时收紧，保证步长 ≥ 1 不死循环
  const step = safeSize - safeOverlap
  const chunks = []
  let start = 0
  let guard = 0
  while (start < text.length && guard < MAX_SPLIT_GUARD) {
    guard++
    const end = Math.min(start + safeSize, text.length)
    if (end > start) chunks.push(text.slice(start, end))
    if (end >= text.length) break
    start += step
  }
  return chunks
}

// 递归切分核心：用第 sepIndex 级分隔符切片并聚合成尽量接近 size 的块；
// 单切片仍超长则降级下一级分隔符在块内再切；没有可用分隔符时按字符硬切
function recursiveSplitAt(text, size, overlap, separators, sepIndex, state) {
  if (!text) return []
  if (text.length <= size) return [text]
  if (state.calls++ > MAX_SPLIT_GUARD) return splitFixed(text, size, overlap)

  let idx = sepIndex
  while (idx < separators.length && separators[idx] !== '' && !text.includes(separators[idx])) idx++
  if (idx >= separators.length || separators[idx] === '') {
    return splitFixed(text, size, overlap)
  }
  const sep = separators[idx]
  const raw = text.split(sep)

  // 把分隔符拼回切片尾部，保持文本可还原
  const pieces = raw.map((part, i) => (i < raw.length - 1 ? part + sep : part))

  const chunks = []
  let buf = ''
  for (const piece of pieces) {
    if (state.calls++ > MAX_SPLIT_GUARD) break
    if (!piece) continue
    if (piece.length > size) {
      // 单切片超长：先收尾当前缓冲，再降级下一级分隔符递归切
      if (buf) { chunks.push(buf); buf = '' }
      chunks.push(...recursiveSplitAt(piece, size, overlap, separators, idx + 1, state))
      continue
    }
    if (!buf) { buf = piece; continue }
    if (buf.length + piece.length <= size) { buf += piece; continue }
    // 收尾当前块，下一块带上上一块尾部 overlap 字符（放不下时收紧 tail 保持块 ≤ size）
    chunks.push(buf)
    let tail = overlap > 0 ? buf.slice(-overlap) : ''
    if (tail && tail.length + piece.length > size) {
      tail = tail.slice(tail.length + piece.length - size)
    }
    buf = tail + piece
  }
  if (buf) chunks.push(buf)
  return chunks.filter((c) => c.length > 0)
}

// 递归切分入口（LangChain RecursiveCharacterTextSplitter 简化对齐）
function splitRecursive(text, size, overlap = 0, separators = DEFAULT_SEPARATORS) {
  if (!text) return []
  const safeSize = Math.max(1, Math.floor(size) || 1)
  const safeOverlap = Math.min(Math.max(0, Math.floor(overlap) || 0), safeSize - 1)
  const state = { calls: 0 }
  return recursiveSplitAt(text, safeSize, safeOverlap, separators, 0, state)
}

// Markdown 切分：按标题层级（^#{1,maxLevel}\s+）切成大段，代码块围栏内不切，
// 超长段内再按递归策略处理；标题切块之间天然无重叠
function splitMarkdown(text, maxLevel = 2, size = 500, overlap = 0) {
  if (!text) return []
  const safeMaxLevel = Math.min(6, Math.max(1, Math.floor(maxLevel) || 1))
  const safeSize = Math.max(1, Math.floor(size) || 1)
  const safeOverlap = Math.min(Math.max(0, Math.floor(overlap) || 0), safeSize - 1)
  const headingRe = new RegExp('^#{1,' + safeMaxLevel + '}\\s+')

  const lines = text.split('\n')
  const sections = []
  let curLines = []
  let inFence = false
  for (const line of lines) {
    if (line.trimStart().startsWith('```')) inFence = !inFence
    const isHeading = !inFence && headingRe.test(line)
    if (isHeading && curLines.length) {
      sections.push(curLines.join('\n'))
      curLines = [line]
    } else {
      curLines.push(line)
    }
  }
  if (curLines.length) sections.push(curLines.join('\n'))

  const chunks = []
  for (const sec of sections) {
    if (!sec.trim()) continue
    if (sec.length <= safeSize) chunks.push(sec)
    else chunks.push(...splitRecursive(sec, safeSize, safeOverlap, DEFAULT_SEPARATORS))
  }
  return chunks
}

// 预计算换行数前缀和：prefix[i] = text 前 i 个字符中的换行数
function buildLinePrefix(text) {
  const n = text.length
  const prefix = new Int32Array(n + 1)
  for (let i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + (text.charCodeAt(i) === 10 ? 1 : 0)
  }
  return prefix
}

// 相邻块实际重叠字符数：上一块尾部与当前块头部的最长公共边界
function computeOverlapChars(prev, cur, maxCheck = 1024) {
  const limit = Math.min(prev.length, cur.length, maxCheck)
  for (let k = limit; k > 0; k--) {
    if (prev.endsWith(cur.slice(0, k))) return k
  }
  return 0
}

// 为每个块补充元信息：序号、字符数、token 估算、起止行号、与上一块实际重叠字符数
function enrichChunks(chunks, fullText) {
  const prefix = buildLinePrefix(fullText)
  const result = []
  let cursor = 0
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i] || ''
    let pos = fullText.indexOf(chunk, cursor)
    if (pos === -1) pos = fullText.indexOf(chunk)
    let startLine
    let endLine
    if (pos >= 0) {
      startLine = prefix[pos] + 1
      endLine = prefix[Math.min(pos + chunk.length, fullText.length)] + 1
      cursor = pos + 1
    } else {
      startLine = result.length ? result[result.length - 1].startLine : 1
      endLine = startLine + (chunk.match(/\n/g) || []).length
    }
    const overlapChars = i === 0 ? 0 : computeOverlapChars(chunks[i - 1] || '', chunk)
    result.push({
      index: i,
      text: chunk,
      chars: chunk.length,
      tokens: estimateTokens(chunk),
      startLine,
      endLine,
      overlapChars
    })
  }
  return result
}

// ---------- 页面状态 ----------
const inputText = ref('')
const debouncedText = ref('')
const strategy = ref('recursive')
const chunkSize = ref(500)
const overlap = ref(50)
const maxLevel = ref(2)
const debouncedParams = ref({ strategy: 'recursive', chunkSize: 500, overlap: 50, maxLevel: 2 })
const seoContentVisible = ref(true)
const actionMessage = ref(null)

const strategyLabels = { fixed: '固定长度', recursive: '递归切分', markdown: 'Markdown 标题' }

const strategyHint = computed(() => {
  if (strategy.value === 'fixed') return '固定长度：按 chunk size 字符硬切，步长 = chunk size - overlap，相邻块共享 overlap 字符。实现最简单，块长完全可控，适合格式统一的纯文本。'
  if (strategy.value === 'markdown') return 'Markdown：先按 H1-H' + maxLevel.value + ' 标题切成大段（代码块内不切），超长段内再按递归策略处理。标题是天然语义边界，最适合带结构的 Markdown 文档。'
  return '递归：按「段落 → 句子 → 空格 → 字符」分隔符优先级聚合出尽量接近 chunk size 的块，块仍超长则降级下一级分隔符再切，overlap>0 时相邻块共享上一块尾部。LangChain 默认策略的简化对齐。'
})

// ---------- 参数联动与防抖 ----------
const overlapLimit = computed(() => Math.max(0, Math.floor(chunkSize.value / 2)))
const overlapExceeded = computed(() => (Number(overlap.value) || 0) > overlapLimit.value)
const inputChars = computed(() => inputText.value.length)
const inputTokens = computed(() => estimateTokens(inputText.value))
const inputTruncated = computed(() => inputText.value.length > MAX_INPUT_BYTES)

function clampChunkSize() {
  const n = Math.floor(Number(chunkSize.value))
  if (!Number.isFinite(n)) { chunkSize.value = 500; return }
  const clamped = Math.min(CHUNK_SIZE_MAX, Math.max(CHUNK_SIZE_MIN, n))
  if (clamped !== chunkSize.value) chunkSize.value = clamped
}

function clampOverlap() {
  const n = Math.floor(Number(overlap.value))
  if (!Number.isFinite(n) || n < 0) { overlap.value = 0; return }
  if (n > overlapLimit.value) overlap.value = overlapLimit.value
}

// chunk size 变化时同步收紧 overlap 上限
watch(overlapLimit, (limit) => {
  if ((Number(overlap.value) || 0) > limit) overlap.value = limit
})

function snapshotParams() {
  return {
    strategy: strategy.value,
    chunkSize: chunkSize.value,
    overlap: Math.min(Number(overlap.value) || 0, overlapLimit.value),
    maxLevel: maxLevel.value
  }
}

let debounceTimer = null
watch([inputText, strategy, chunkSize, overlap, maxLevel], () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedText.value = inputText.value
    debouncedParams.value = snapshotParams()
    debounceTimer = null
  }, DEBOUNCE_MS)
})

// 立即应用当前输入与参数（跳过防抖等待）
function applyNow() {
  if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }
  debouncedText.value = inputText.value
  debouncedParams.value = snapshotParams()
}

// ---------- 分块计算（computed 驱动） ----------
const analysis = computed(() => {
  const raw = debouncedText.value
  const p = debouncedParams.value
  const empty = { chunks: [], truncated: false, totalTokens: 0, avgChars: 0, maxChars: 0, minChars: 0, avgOverlap: 0 }
  if (!raw.trim()) return empty

  const text = truncateText(raw)
  const truncated = raw.length > text.length
  let chunks = []
  if (p.strategy === 'fixed') {
    chunks = splitFixed(text, p.chunkSize, p.overlap)
  } else if (p.strategy === 'markdown') {
    chunks = splitMarkdown(text, p.maxLevel, p.chunkSize, p.overlap)
  } else {
    chunks = splitRecursive(text, p.chunkSize, p.overlap)
  }
  const enriched = enrichChunks(chunks, text)

  let totalChars = 0
  let totalTokens = 0
  let maxChars = 0
  let minChars = Infinity
  for (const c of enriched) {
    totalChars += c.chars
    totalTokens += c.tokens
    if (c.chars > maxChars) maxChars = c.chars
    if (c.chars < minChars) minChars = c.chars
  }
  const overlapSum = enriched.length > 1
    ? enriched.slice(1).reduce((s, c) => s + c.overlapChars, 0)
    : 0

  return {
    chunks: enriched,
    truncated,
    totalTokens,
    avgChars: enriched.length ? Math.round(totalChars / enriched.length) : 0,
    maxChars: enriched.length ? maxChars : 0,
    minChars: enriched.length ? minChars : 0,
    avgOverlap: enriched.length > 1 ? Math.round(overlapSum / (enriched.length - 1)) : 0
  }
})

const displayChunks = computed(() => analysis.value.chunks.slice(0, MAX_DISPLAY_CHUNKS))

// ---------- 用户操作 ----------
let messageTimer = null
function showMessage(type, text) {
  actionMessage.value = { type, text }
  if (messageTimer) clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    actionMessage.value = null
    messageTimer = null
  }, 4000)
}

function rechunkNow() {
  applyNow()
  const n = analysis.value.chunks.length
  if (!n) {
    showMessage('warn', '暂无可分块的内容，请先输入文档或载入示例文档')
    return
  }
  showMessage('ok', `已重新分块：共 ${n} 块（策略：${strategyLabels[snapshotParams().strategy]}）`)
}

function loadSample() {
  inputText.value = SAMPLE_DOC
  applyNow()
  showMessage('info', `已载入示例文档（约 ${SAMPLE_DOC.length.toLocaleString()} 字符），可直接切换策略对比块边界`)
}

function clearInput() {
  inputText.value = ''
  applyNow()
  showMessage('info', '已清空输入')
}

function exportJsonl() {
  const chunks = analysis.value.chunks
  if (!chunks.length) {
    showMessage('warn', '暂无可导出的分块，请先输入文档并完成分块')
    return
  }
  try {
    const lines = chunks.map((c) => JSON.stringify({ index: c.index, text: c.text, tokens: c.tokens }))
    const blob = new Blob([lines.join('\n')], { type: 'application/x-ndjson;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rag-chunks.jsonl'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showMessage('ok', `已导出 ${chunks.length} 个分块 → rag-chunks.jsonl（UTF-8）`)
  } catch (e) {
    showMessage('warn', '导出失败：' + (e && e.message ? e.message : '未知错误'))
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('rag-chunk-previewer')
})

onBeforeUnmount(() => {
  if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }
  if (messageTimer) { clearTimeout(messageTimer); messageTimer = null }
})
</script>
