<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <MessagesSquare class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">System Prompt 构建器</h1>
          <p class="text-sm text-muted-foreground mt-1">区块化拼装大模型 system prompt：留空的区块整段省略，实时字符数与 token 估算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 system prompt 生成工具：把系统提示词拆成角色定义、背景上下文、能力与边界、输出格式、语气风格、安全约束、少样本示例等区块逐段填写，
        支持「分节式」（# Role / # Context / # Constraints / # Output Format / # Examples）与「紧凑式」（一段连贯指令）两种排版，
        选 JSON 输出时自动附结构模板并校验合法性，估算超过 1500 token 自动提醒精简。全部生成在浏览器本地完成，配置自动保存在本机，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：区块表单 -->
      <div class="space-y-5">
        <button
          @click="fillExample"
          class="w-full px-4 py-2.5 bg-primary/10 hover:bg-primary/15 border border-primary/30 rounded-lg text-sm font-medium text-primary transition flex items-center justify-center gap-1.5"
        >
          <Info class="w-4 h-4" /> 一键填入示例：代码评审助手
        </button>

        <!-- 基础区块 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <MessagesSquare class="w-5 h-5 mr-2 text-primary" /> 基础区块
          </h2>

          <div>
            <label for="spb-role" class="block text-sm font-medium text-foreground mb-2">角色定义</label>
            <textarea
              id="spb-role"
              v-model="form.role"
              rows="3"
              spellcheck="false"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="你是一位资深前端工程师，擅长 Vue 与 TypeScript"
            ></textarea>
            <p class="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
              <Info class="w-3 h-3 flex-shrink-0 mt-0.5" />
              模型的身份与专长，决定回答的专业口径。留空则整段省略。
            </p>
          </div>

          <div>
            <label for="spb-context" class="block text-sm font-medium text-foreground mb-2">背景上下文</label>
            <textarea
              id="spb-context"
              v-model="form.context"
              rows="3"
              spellcheck="false"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="项目是一个内部知识库问答机器人，受众是没有技术背景的客服同学，回答会被直接复制进工单"
            ></textarea>
            <p class="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
              <Info class="w-3 h-3 flex-shrink-0 mt-0.5" />
              项目信息 / 受众 / 使用场景，模型据此拿捏深浅与默认假设。
            </p>
          </div>

          <div>
            <label for="spb-constraints" class="block text-sm font-medium text-foreground mb-2">能力与边界</label>
            <textarea
              id="spb-constraints"
              v-model="form.constraints"
              rows="3"
              spellcheck="false"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="只分析代码，不负责业务逻辑设计&#10;不确定时明确说明，不要编造 API"
            ></textarea>
            <p class="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
              <Info class="w-3 h-3 flex-shrink-0 mt-0.5" />
              「不要做什么」：越界行为、拒答范围、诚实性要求，一行一条。
            </p>
          </div>
        </div>

        <!-- 输出格式 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 输出格式
          </h2>
          <div>
            <label for="spb-format" class="block text-sm font-medium text-foreground mb-2">格式要求</label>
            <select
              id="spb-format"
              v-model="form.outputFormat"
              @change="onOutputFormatChange"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">未选择（省略此段）</option>
              <option v-for="opt in formatOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <div v-if="form.outputFormat === 'json'" class="space-y-2">
            <label for="spb-json-template" class="block text-sm font-medium text-foreground">JSON 结构示例（可编辑）</label>
            <textarea
              id="spb-json-template"
              v-model="form.outputTemplate"
              rows="4"
              spellcheck="false"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder='{"answer": "..."}'
            ></textarea>
            <p
              v-if="jsonHintMessage"
              class="text-xs leading-relaxed p-2.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 flex items-start gap-1.5"
            >
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ jsonHintMessage }}</span>
            </p>
            <p v-else-if="form.outputTemplate.trim()" class="text-xs text-green-600 flex items-center gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0" />
              JSON 模板合法，将原样附在 Output Format 段作为结构示例。
            </p>
          </div>

          <div v-else-if="form.outputFormat === 'custom'" class="space-y-2">
            <label for="spb-format-custom" class="block text-sm font-medium text-foreground">自定义格式说明</label>
            <textarea
              id="spb-format-custom"
              v-model="form.outputTemplate"
              rows="3"
              spellcheck="false"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="例如：输出两列 Markdown 表格，列为「文件」和「问题」，按严重程度从高到低排序"
            ></textarea>
          </div>
        </div>

        <!-- 语气风格 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 语气风格
          </h2>
          <div>
            <label for="spb-tone" class="block text-sm font-medium text-foreground mb-2">语气要求</label>
            <select
              id="spb-tone"
              v-model="form.tone"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">未选择（省略此段）</option>
              <option value="professional">专业严谨</option>
              <option value="concise">简洁直接</option>
              <option value="friendly">友好口语</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <div v-if="form.tone === 'custom'">
            <label for="spb-tone-custom" class="block text-sm font-medium text-foreground mb-2">自定义语气描述</label>
            <textarea
              id="spb-tone-custom"
              v-model="form.toneCustom"
              rows="2"
              spellcheck="false"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="例如：像结对编程的同事一样，直接指出问题但不绕弯子"
            ></textarea>
          </div>
        </div>

        <!-- 安全约束 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <TriangleAlert class="w-5 h-5 mr-2 text-primary" /> 安全约束
          </h2>
          <p class="text-xs text-muted-foreground flex items-start gap-1">
            <Info class="w-3 h-3 flex-shrink-0 mt-0.5" />
            开启后会在 Constraints 段追加对应约束行，一条一行。
          </p>
          <div
            v-for="s in safetyDefs"
            :key="s.key"
            class="flex items-center justify-between gap-3 py-2 border-t border-border first:border-t-0"
          >
            <div>
              <p class="text-sm font-medium text-foreground">{{ s.title }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">{{ s.desc }}</p>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="form.safety[s.key]"
              :aria-label="s.title"
              @click="toggleSafety(s.key)"
              class="relative inline-flex flex-shrink-0 h-5 w-9 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              :class="form.safety[s.key] ? 'bg-primary' : 'bg-muted border border-border'"
            >
              <span
                class="absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                :class="form.safety[s.key] ? 'translate-x-4' : 'translate-x-0'"
              ></span>
            </button>
          </div>
        </div>

        <!-- 少样本示例 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Plus class="w-5 h-5 mr-2 text-primary" /> 少样本示例
            </h2>
            <button
              @click="addExample"
              class="px-2.5 py-1 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition flex items-center gap-1"
            >
              <Plus class="w-3.5 h-3.5" /> 添加一组
            </button>
          </div>
          <p class="text-xs text-muted-foreground flex items-start gap-1">
            <Info class="w-3 h-3 flex-shrink-0 mt-0.5" />
            Q 与 A 都填写才算一组完整示例，不完整的组不会进入结果。
          </p>
          <div
            v-for="(pair, idx) in form.examples"
            :key="pair.id"
            class="bg-muted/40 border border-border rounded-lg p-3 space-y-2"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-muted-foreground">示例 {{ idx + 1 }}</span>
              <button
                @click="removeExample(pair.id)"
                class="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition"
                :aria-label="'删除示例 ' + (idx + 1)"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              v-model="pair.q"
              rows="2"
              spellcheck="false"
              class="w-full px-2.5 py-2 bg-background border border-input rounded-lg text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="用户输入示例（Q），如：这段函数有什么问题？"
            ></textarea>
            <textarea
              v-model="pair.a"
              rows="3"
              spellcheck="false"
              class="w-full px-2.5 py-2 bg-background border border-input rounded-lg text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="期望回答示例（A），写清格式与要点"
            ></textarea>
          </div>
          <p v-if="!form.examples.length" class="text-xs text-muted-foreground leading-relaxed">
            尚无示例。给一组真实的输入 / 输出示例，是锁定输出格式与风格最有效的手段，建议至少 1 组。
          </p>
        </div>
      </div>

      <!-- 右：预览与统计（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4 flex flex-col">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <h2 class="text-lg font-semibold flex items-center">
            <MessagesSquare class="w-5 h-5 mr-2 text-primary" /> 生成预览
          </h2>
          <div class="flex items-center gap-4">
            <label
              class="flex items-center gap-1.5 text-sm cursor-pointer"
              :class="outputStyle === 'sectioned' ? 'text-foreground font-medium' : 'text-muted-foreground'"
            >
              <input type="radio" value="sectioned" v-model="outputStyle" class="accent-primary" />
              分节式
            </label>
            <label
              class="flex items-center gap-1.5 text-sm cursor-pointer"
              :class="outputStyle === 'compact' ? 'text-foreground font-medium' : 'text-muted-foreground'"
            >
              <input type="radio" value="compact" v-model="outputStyle" class="accent-primary" />
              紧凑式
            </label>
          </div>
        </div>

        <p class="text-xs text-muted-foreground flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
          <span>{{ outputStyleHint }}</span>
        </p>

        <!-- 统计条 -->
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-xs text-muted-foreground mb-1">字符数</p>
            <p class="text-xl font-bold text-foreground">{{ charCount }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-xs text-muted-foreground mb-1">估算 token</p>
            <p class="text-xl font-bold" :class="isTokenHeavy ? 'text-yellow-600' : 'text-foreground'">{{ tokenCount }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-xs text-muted-foreground mb-1">区块完成度</p>
            <p class="text-xl font-bold text-foreground">{{ completedCount }} / {{ BLOCK_TOTAL }}</p>
          </div>
        </div>

        <!-- token 超长提醒 -->
        <p
          v-if="isTokenHeavy"
          class="text-xs leading-relaxed p-2.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 flex items-start gap-1.5"
        >
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>当前约 {{ tokenCount }} token：过长的 system prompt 持续占用每次对话的上下文，考虑精简。</span>
        </p>

        <!-- 预览 -->
        <pre
          v-if="promptText"
          class="flex-1 min-h-[320px] max-h-[560px] overflow-auto whitespace-pre-wrap break-words bg-muted/40 border border-border rounded-lg p-4 text-sm font-mono text-foreground leading-relaxed"
        >{{ promptText }}</pre>
        <div
          v-else
          class="flex-1 min-h-[320px] rounded-lg border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center text-center p-6"
        >
          <MessagesSquare class="w-10 h-10 text-muted-foreground/40 mb-2" />
          <p class="text-sm font-medium text-muted-foreground">在左侧填写任意区块，这里实时生成 system prompt</p>
          <p class="text-xs text-muted-foreground/70 mt-1">留空的区块整段省略；也可以先点左上角「一键填入示例」看效果</p>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-wrap gap-2">
          <button
            @click="copyOutput"
            class="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition flex items-center gap-1.5"
          >
            <Copy class="w-4 h-4" /> 复制
          </button>
          <button
            @click="downloadTxt"
            class="px-4 py-2.5 bg-primary/10 hover:bg-primary/15 border border-primary/30 text-primary rounded-lg text-sm font-medium transition flex items-center gap-1.5"
          >
            <Download class="w-4 h-4" /> 下载 system-prompt.txt
          </button>
          <button
            @click="resetAll"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border text-foreground rounded-lg text-sm font-medium transition flex items-center gap-1.5"
          >
            <RefreshCw class="w-4 h-4" /> 重置
          </button>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          说明：token 按站内统一口径估算（CJK 字符 1 字 ≈ 1 token，其余 4 字符 ≈ 1 token），与各模型实际分词器结果会有出入，仅供量级参考；
          表单内容自动保存在浏览器 localStorage，仅本机可见，重置或清除浏览器数据即彻底删除。
        </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是 System Prompt 构建器？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          System Prompt 构建器是一款在线大模型系统提示词编排工具。它把一段完整的 system prompt 拆成 8 个可留空的区块——角色定义、背景上下文、能力与边界、
          输出格式（含 JSON 结构模板）、语气风格、安全约束、少样本示例——逐块填写后实时拼装成成品：可选「分节式」输出 # Role / # Context / # Constraints /
          # Output Format / # Examples 五个英文节，或「紧凑式」把所有区块连成一段以句号衔接的连贯指令。页内同步统计字符数与估算 token，
          超过 1500 token 给出精简提醒；全部拼接逻辑在浏览器本地运行，表单自动保存在本机，不上传任何数据。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">system prompt 和 user prompt 有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">system prompt 在会话开始前注入、整段会话持续生效且优先级更高，用来设定行为准则——角色、能力边界、输出格式与安全底线；user prompt 是用户当轮输入的具体内容，是模型处理的对象。简单说：system 定规矩，user 出题目，规矩对每一道题都生效，一般不会因为多轮追问而失效。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">好的 system prompt 长什么样？</h3>
            <p class="text-sm text-muted-foreground mt-1">三条经验法则：一是具体大于空泛，「输出不超过 200 字、用 Markdown 列表」远比「回答要简洁」有效；二是正面指令优于否定清单，优先告诉模型该做什么，否定句留给安全底线；三是给示例最有效，一组真实的输入/输出少样本示例，往往比几十行描述更能锁定格式与风格。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">system prompt 写多长合适？</h3>
            <p class="text-sm text-muted-foreground mt-1">常见场景几百 token 内就够：角色、边界、输出格式各一两句。任务复杂（代码评审、长文改写）可以写长，但 system prompt 每一轮对话都占用上下文窗口和费用，估算超过 1500 token 就值得精简或裁掉低频规则——本页预览区超限时会给出黄色提醒。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">和 CLAUDE.md、.cursorrules 这类规则文件是什么关系？</h3>
            <p class="text-sm text-muted-foreground mt-1">机制相同，载体不同。CLAUDE.md、.cursorrules、AGENTS.md 本质上是「按项目放置的持久 system prompt」：AI 编程工具启动时读取项目根目录的规则文件并注入每次会话的 system prompt。可以在本页拼好核心约束，再用站内「AI编程规则生成器」一键生成对应格式的规则文件放进仓库。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">system prompt 会一成不变吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。不同模型对指令的敏感度不同，任务变化后旧约束也可能失效，system prompt 应随模型与任务持续迭代：改一版、跑几个典型用例、对比输出再调整。两个版本拿不准差异时，可以用站内「Prompt版本对比」工具把两版贴进去逐行查看增删改。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'system-prompt-builder'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  MessagesSquare, CheckCircle, TriangleAlert, Copy, RefreshCw,
  ChevronUp, ChevronDown, Info, Plus, X, Download
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'System Prompt 构建器 - 在线大模型系统提示词生成工具',
  description: '免费在线 system prompt 生成器：区块化拼装角色定义、背景上下文、能力与边界、输出格式、语气风格、安全约束与少样本示例，留空整段省略，支持分节式与紧凑式双排版、JSON 结构模板校验、字符数与 token 实时估算、超长精简提醒，纯浏览器本地运行不上传。',
  keywords: 'system prompt构建器,系统提示词生成工具,prompt模板生成,AI提示词工程,system prompt模板,提示词token估算,大模型提示词编写',
  author: '有条工具',
  ogTitle: 'System Prompt 构建器 - 在线大模型系统提示词生成工具 | 有条工具',
  ogDescription: '区块化拼装 system prompt：角色/背景/边界/输出格式/语气/安全约束/少样本示例，分节式与紧凑式一键切换，实时 token 估算。',
  ogUrl: 'https://www.util.cn/tools/system-prompt-builder',
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
          name: 'System Prompt 构建器',
          url: 'https://www.util.cn/tools/system-prompt-builder',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '区块化拼装 8 类 system prompt 区块，留空整段省略',
            '分节式（# Role / # Context 等）与紧凑式双排版输出',
            '输出格式预设与 JSON 结构模板合法性校验',
            '少样本示例 Q/A 组增删管理',
            '字符数与 token 实时估算，超 1500 token 提醒精简',
            '一键填入完整示例，配置本地保存不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'System Prompt 构建器', item: 'https://www.util.cn/tools/system-prompt-builder/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'system prompt 和 user prompt 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'system prompt 在会话开始前注入、整段会话持续生效且优先级更高，用来设定行为准则——角色、能力边界、输出格式与安全底线；user prompt 是用户当轮输入的具体内容，是模型处理的对象。简单说：system 定规矩，user 出题目，规矩对每一道题都生效。' }
            },
            {
              '@type': 'Question',
              name: '好的 system prompt 长什么样？',
              acceptedAnswer: { '@type': 'Answer', text: '三条经验法则：一是具体大于空泛，量化要求比「回答要简洁」有效；二是正面指令优于否定清单，优先告诉模型该做什么，否定句留给安全底线；三是给示例最有效，一组真实的输入/输出少样本示例往往比几十行描述更能锁定格式与风格。' }
            },
            {
              '@type': 'Question',
              name: 'system prompt 写多长合适？',
              acceptedAnswer: { '@type': 'Answer', text: '常见场景几百 token 内就够：角色、边界、输出格式各一两句。任务复杂可以写长，但 system prompt 每一轮对话都占用上下文窗口和费用，估算超过 1500 token 就值得精简或裁掉低频规则。' }
            },
            {
              '@type': 'Question',
              name: '和 CLAUDE.md、.cursorrules 这类规则文件是什么关系？',
              acceptedAnswer: { '@type': 'Answer', text: '机制相同，载体不同。CLAUDE.md、.cursorrules、AGENTS.md 本质上是按项目放置的持久 system prompt：AI 编程工具启动时读取规则文件并注入每次会话的 system prompt。可以在本页拼好核心约束，再用站内 AI编程规则生成器生成对应格式的规则文件放进仓库。' }
            },
            {
              '@type': 'Question',
              name: 'system prompt 会一成不变吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。不同模型对指令的敏感度不同，任务变化后旧约束也可能失效，system prompt 应随模型与任务持续迭代：改一版、跑几个典型用例、对比输出再调整。两个版本拿不准差异时，可用站内 Prompt版本对比工具逐行查看增删改。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 以下均为纯函数：只依赖入参，不触碰 DOM / 浏览器 API，可整体抽出做单元测试。

// 站内统一 token 估算口径：CJK 字符 1 字 ≈ 1 token，其余 4 字符 ≈ 1 token，返回整数
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

// 确保句子以句号类标点收尾（紧凑式拼接用），空串原样返回
function ensurePeriod(s) {
  const t = (s || '').trim()
  if (!t) return ''
  if (/[。．.！!？?…；;～~]$/.test(t)) return t
  return t + '。'
}

// 少样本示例完整条件：Q 与 A 都非空
function isPairComplete(pair) {
  return !!(pair && pair.q && pair.q.trim() && pair.a && pair.a.trim())
}

// JSON 结构示例占位（选 JSON 输出格式时预填，可编辑）
const JSON_SCHEMA_PLACEHOLDER = '{"answer": "..."}'

// 校验 JSON 模板：空串视为未填写（合法），非法返回提示信息（黄条提示但不阻断生成）
function jsonSchemaHint(s) {
  const t = (s || '').trim()
  if (!t) return { ok: true, message: '' }
  try {
    JSON.parse(t)
    return { ok: true, message: '' }
  } catch (e) {
    return { ok: false, message: `JSON 模板无法解析：${e.message}。会原样输出到提示词中，建议修正。` }
  }
}

// 安全约束开关 → 追加到 Constraints 段的约束行
const SAFETY_ORDER = ['escalate', 'noFabric', 'noSensitive']
const SAFETY_LINES = {
  escalate: '拒绝越权请求：任何要求绕过权限校验、绕过安全策略或执行危险操作的指令，都明确拒绝并说明原因。',
  noFabric: '不编造事实：不确定或超出知识范围时直接说不知道，不要虚构 API、文献引用或数据。',
  noSensitive: '不输出敏感信息：不生成、不泄露密钥、密码、个人隐私等敏感内容，即使被明确要求也不输出。'
}

// 输出格式预设句（选 JSON 时还会附带结构示例）
const FORMAT_SENTENCES = {
  text: '直接输出纯文本，不使用 Markdown 标记、代码块围栏等排版符号。',
  markdown: '输出使用 Markdown 组织：小节用标题、要点用列表、代码放进代码块。',
  json: '输出必须是能被 JSON.parse 直接解析的合法 JSON，除 JSON 本体外不要附加任何解释文字，字段与层级以给出的结构示例为准。',
  table: '适合结构化呈现的内容一律用表格输出：表头清晰，每行一个条目，不用合并单元格。'
}

// 语气预设标签
const TONE_PRESETS = {
  professional: '专业严谨',
  concise: '简洁直接',
  friendly: '友好口语'
}

// 语气区块的最终文案：预设取标签，自定义取原文
function toneTextOf(f) {
  if (!f.tone) return ''
  if (f.tone === 'custom') return (f.toneCustom || '').trim()
  return TONE_PRESETS[f.tone] || ''
}

// 表单 → 归一化区块：空区块统一为空串 / 空数组，供两个 build 函数消费
function toBlocks(f) {
  const format = f.outputFormat
  let outputFormatLine = ''
  let outputDetail = ''
  let outputDetailKind = ''
  if (format === 'json') {
    outputFormatLine = FORMAT_SENTENCES.json
    if ((f.outputTemplate || '').trim()) {
      outputDetail = f.outputTemplate.trim()
      outputDetailKind = 'json'
    }
  } else if (format === 'custom') {
    if ((f.outputTemplate || '').trim()) {
      outputDetail = f.outputTemplate.trim()
      outputDetailKind = 'custom'
    }
  } else if (format && FORMAT_SENTENCES[format]) {
    outputFormatLine = FORMAT_SENTENCES[format]
  }

  return {
    role: (f.role || '').trim(),
    context: (f.context || '').trim(),
    constraints: (f.constraints || '').trim(),
    safety: SAFETY_ORDER.filter((k) => f.safety && f.safety[k]).map((k) => SAFETY_LINES[k]),
    tone: toneTextOf(f),
    outputFormat: outputFormatLine,
    outputDetail,
    outputDetailKind,
    examples: (f.examples || []).filter(isPairComplete).map((p) => ({ q: p.q.trim(), a: p.a.trim() }))
  }
}

// 分节式拼接：# Role / # Context / # Constraints / # Output Format / # Examples，空区块整段省略
function buildSectioned(blocks) {
  const b = blocks || {}
  const sections = []

  // # Role：角色定义 + 语气风格（语气没有独立节名，挂在 Role 下）
  const roleLines = []
  if (b.role) roleLines.push(b.role)
  if (b.tone) roleLines.push(`语气与风格：${ensurePeriod(b.tone)}`)
  if (roleLines.length) sections.push({ title: 'Role', body: roleLines.join('\n') })

  if (b.context) sections.push({ title: 'Context', body: b.context })

  // # Constraints：能力与边界原文 + 安全约束行（一行一条）
  const constraintLines = []
  if (b.constraints) constraintLines.push(b.constraints)
  for (const line of b.safety || []) constraintLines.push('- ' + line)
  if (constraintLines.length) sections.push({ title: 'Constraints', body: constraintLines.join('\n') })

  // # Output Format：格式要求句 + JSON 结构示例 / 自定义说明（空行分隔便于粘贴代码）
  const formatLines = []
  if (b.outputFormat) formatLines.push(b.outputFormat)
  if (b.outputDetail) formatLines.push(b.outputDetail)
  if (formatLines.length) sections.push({ title: 'Output Format', body: formatLines.join('\n\n') })

  // # Examples：只收录完整的 Q/A 对，组间空行分隔
  const pairs = (b.examples || []).filter(isPairComplete)
  if (pairs.length) {
    sections.push({
      title: 'Examples',
      body: pairs.map((p) => `用户：${p.q.trim()}\n助手：${p.a.trim()}`).join('\n\n')
    })
  }

  return sections.map((s) => `# ${s.title}\n\n${s.body}`).join('\n\n')
}

// 紧凑式拼接：每区块一句，句号衔接成一段连贯指令，空区块跳过（安全约束 / 示例逐条成句）
function buildCompact(blocks) {
  const b = blocks || {}
  const sentences = []

  if (b.role) sentences.push(ensurePeriod(b.role))
  if (b.context) sentences.push(ensurePeriod(`背景与使用场景：${b.context}`))
  if (b.tone) sentences.push(ensurePeriod(`回复语气：${b.tone}`))
  if (b.constraints) sentences.push(ensurePeriod(`行为边界：${b.constraints}`))
  for (const line of b.safety || []) sentences.push(ensurePeriod(line))
  if (b.outputFormat) sentences.push(ensurePeriod(b.outputFormat))
  if (b.outputDetail) {
    const prefix = b.outputDetailKind === 'json' ? '字段结构示例：' : ''
    sentences.push(ensurePeriod(`${prefix}${b.outputDetail}`))
  }
  for (const p of (b.examples || []).filter(isPairComplete)) {
    sentences.push(ensurePeriod(`示例：用户问「${p.q.trim()}」时，参考回答：「${p.a.trim()}」`))
  }

  // 压成一段：句内换行折叠为空格，各句以句号类标点自然衔接
  return sentences.map((s) => s.replace(/\s+/g, ' ').trim()).join('')
}

// 区块完成度：8 个可填区块中已完成的个数
const BLOCK_TOTAL = 8

// 输出模板区块：JSON / 自定义需要模板文本，其余格式选了即算完成
function isOutputTemplateDone(f) {
  if (!f.outputFormat) return false
  if (f.outputFormat === 'json' || f.outputFormat === 'custom') return !!(f.outputTemplate || '').trim()
  return true
}

function countCompletedBlocks(f) {
  const checks = [
    !!(f.role || '').trim(),
    !!(f.context || '').trim(),
    !!(f.constraints || '').trim(),
    !!f.outputFormat,
    isOutputTemplateDone(f),
    !!f.tone,
    SAFETY_ORDER.some((k) => f.safety && f.safety[k]),
    (f.examples || []).some(isPairComplete)
  ]
  return checks.filter(Boolean).length
}

// ---------- 页面常量 ----------
const formatOptions = [
  { value: 'text', label: '纯文本' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'json', label: 'JSON' },
  { value: 'table', label: '表格' },
  { value: 'custom', label: '自定义' }
]

const safetyDefs = [
  { key: 'escalate', title: '拒绝越权请求', desc: '绕过权限、绕过安全策略或危险操作的指令一律明确拒绝' },
  { key: 'noFabric', title: '不编造事实', desc: '不确定时说不知道，不虚构 API、引用与数据' },
  { key: 'noSensitive', title: '不输出敏感信息', desc: '不生成或泄露密钥、密码、个人隐私等敏感内容' }
]

const STORAGE_KEY = 'util-system-prompt-builder'
const TOKEN_HEAVY_LIMIT = 1500 // 估算 token 超过此值给出精简提醒

// ---------- 表单状态 ----------
function emptyForm() {
  return {
    role: '',
    context: '',
    constraints: '',
    outputFormat: '',
    outputTemplate: '',
    tone: '',
    toneCustom: '',
    safety: { escalate: false, noFabric: false, noSensitive: false },
    examples: []
  }
}

const form = ref(emptyForm())
const outputStyle = ref('sectioned')
const seoContentVisible = ref(true)
let exampleSeq = 0

// ---------- 派生状态 ----------
const normalizedBlocks = computed(() => toBlocks(form.value))
const promptText = computed(() =>
  outputStyle.value === 'compact' ? buildCompact(normalizedBlocks.value) : buildSectioned(normalizedBlocks.value)
)
const charCount = computed(() => promptText.value.length)
const tokenCount = computed(() => estimateTokens(promptText.value))
const completedCount = computed(() => countCompletedBlocks(form.value))
const isTokenHeavy = computed(() => tokenCount.value > TOKEN_HEAVY_LIMIT)
const jsonHintMessage = computed(() =>
  form.value.outputFormat === 'json' ? jsonSchemaHint(form.value.outputTemplate).message : ''
)
const outputStyleHint = computed(() =>
  outputStyle.value === 'compact'
    ? '紧凑式：不分节，各区块拼成以句号衔接的一段连贯指令，token 更省，适合简短场景或按字符计费的接口。'
    : '分节式：以 # Role / # Context / # Constraints / # Output Format / # Examples 英文节名分节，结构与主流模型的训练语料一致，长提示词更易被分区遵循，更通用。'
)

// ---------- 交互 ----------
function addExample() {
  form.value.examples.push({ id: ++exampleSeq, q: '', a: '' })
}

function removeExample(id) {
  form.value.examples = form.value.examples.filter((p) => p.id !== id)
}

function toggleSafety(key) {
  form.value.safety[key] = !form.value.safety[key]
}

// 切到 JSON 输出格式时，若结构示例为空则预填占位模板
function onOutputFormatChange() {
  if (form.value.outputFormat === 'json' && !form.value.outputTemplate.trim()) {
    form.value.outputTemplate = JSON_SCHEMA_PLACEHOLDER
  }
}

// 一键填入完整可用的「代码评审助手」示例
function fillExample() {
  form.value = {
    role: '你是一位资深代码评审助手，负责评审用户提交的代码片段，指出缺陷并给出可执行的修改建议',
    context: '这是一个内部团队的代码评审平台，用户多为 1-3 年经验的前端工程师，提交的代码以 Vue 3 与 TypeScript 为主，评审结果会直接贴到 Pull Request 评论里',
    constraints: '只评审代码本身，不对作者的水平发表评论\n指出问题时必须给出修改后的参考写法\n不确定的结论要明确说明，不要编造 API 或框架行为',
    outputFormat: 'markdown',
    outputTemplate: '',
    tone: 'professional',
    toneCustom: '',
    safety: { escalate: true, noFabric: true, noSensitive: false },
    examples: [
      {
        id: ++exampleSeq,
        q: '这段函数有什么问题？\nfunction getUser(id) {\n  const res = await fetch("/api/user?id=" + id)\n  return res.json()\n}',
        a: '两个问题：1. 没有检查 res.ok，接口返回 404 时会把错误响应当作用户数据返回；2. id 没有做 URL 编码，特殊字符会破坏查询参数。建议改为：先 await fetch("/api/user/" + encodeURIComponent(id))，再判断 if (!res.ok) throw new Error("请求失败: " + res.status)，最后 return res.json()。'
      }
    ]
  }
}

function resetAll() {
  if (completedCount.value > 0 && !confirm('确定要清空全部区块并恢复默认设置吗？')) return
  form.value = emptyForm()
  outputStyle.value = 'sectioned'
}

async function copyOutput() {
  if (!promptText.value) {
    alert('暂无内容可复制，请先在左侧填写任意区块')
    return
  }
  try {
    await navigator.clipboard.writeText(promptText.value)
    alert('system prompt 已复制到剪贴板')
  } catch (e) {
    alert('复制失败，请手动全选预览区文本复制')
  }
}

function downloadTxt() {
  if (!promptText.value) {
    alert('暂无内容可下载，请先在左侧填写任意区块')
    return
  }
  try {
    const blob = new Blob([promptText.value], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'system-prompt.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    alert('下载失败，请手动复制预览区文本保存')
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 本地持久化（保存全部区块与输出风格，try/catch 兜底） ----------
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ form: form.value, outputStyle: outputStyle.value }))
  } catch (e) {
    // 隐私模式 / 存储被禁用 / 配额不足时静默降级为不保存
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return
    const f = data.form || {}
    form.value = {
      role: typeof f.role === 'string' ? f.role : '',
      context: typeof f.context === 'string' ? f.context : '',
      constraints: typeof f.constraints === 'string' ? f.constraints : '',
      outputFormat: formatOptions.some((o) => o.value === f.outputFormat) ? f.outputFormat : '',
      outputTemplate: typeof f.outputTemplate === 'string' ? f.outputTemplate : '',
      tone: ['professional', 'concise', 'friendly', 'custom'].includes(f.tone) ? f.tone : '',
      toneCustom: typeof f.toneCustom === 'string' ? f.toneCustom : '',
      safety: {
        escalate: !!(f.safety && f.safety.escalate),
        noFabric: !!(f.safety && f.safety.noFabric),
        noSensitive: !!(f.safety && f.safety.noSensitive)
      },
      examples: Array.isArray(f.examples)
        ? f.examples.slice(0, 50).map((p) => ({
            id: ++exampleSeq,
            q: p && typeof p.q === 'string' ? p.q : '',
            a: p && typeof p.a === 'string' ? p.a : ''
          }))
        : []
    }
    outputStyle.value = data.outputStyle === 'compact' ? 'compact' : 'sectioned'
  } catch (e) {
    // 本地存档损坏时忽略，使用空表单
  }
}

watch([form, outputStyle], () => { saveState() }, { deep: true })

onMounted(() => {
  loadState()
  addRecentTool('system-prompt-builder')
})
</script>
