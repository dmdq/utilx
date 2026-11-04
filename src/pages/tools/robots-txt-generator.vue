<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Bot class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">robots.txt 生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">多爬虫分组、Allow/Disallow 规则、Crawl-delay 与 Sitemap 表单化配置，实时生成并一键复制下载</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 robots.txt 生成工具：内置全开放、全封锁、WordPress 标准版与屏蔽敏感目录四类预设模板，支持多 User-agent 爬虫分组、逐条 Allow/Disallow 规则校验与通配符标记、
        Crawl-delay 抓取间隔与多行 Sitemap 配置，右侧实时预览生成的 robots.txt 文本，自动检测重复 User-agent 并给出合并警告，结果可一键复制或下载后上传到网站根目录。
        全部生成在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左列：配置表单 -->
      <div class="space-y-6">
        <!-- 预设模板 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Bot class="w-5 h-5 mr-2 text-primary" /> 预设模板
          </h2>
          <select
            v-model="presetId"
            @change="loadPreset(presetId)"
            class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="tpl in presetTemplates" :key="tpl.id" :value="tpl.id">{{ tpl.label }}</option>
          </select>
          <p class="text-xs text-muted-foreground leading-relaxed">切换模板会覆盖当前所有分组与 Sitemap 配置，之后可继续手动微调。</p>
        </div>

        <!-- 爬虫分组 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Bot class="w-5 h-5 mr-2 text-primary" /> 爬虫分组
            </h2>
            <span class="text-xs text-muted-foreground">共 {{ groups.length }} 组</span>
          </div>

          <!-- 重复 User-agent 黄条警告 -->
          <p
            v-if="duplicateUas.length"
            class="text-xs leading-relaxed p-2.5 rounded bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 flex items-start gap-1.5"
          >
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>检测到重复的 User-agent：「{{ duplicateUas.join('、') }}」。同名爬虫会被搜索引擎合并为一个分组，建议把规则并入同一组或改用其他名称。</span>
          </p>

          <div
            v-for="(group, gi) in groups"
            :key="group.id"
            class="border rounded-lg p-4 space-y-3 bg-muted/30 transition"
            :class="group.id === activeGroupId ? 'border-primary/50' : 'border-border'"
            @click="setActiveGroup(group.id)"
            @focusin="setActiveGroup(group.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-foreground">分组 {{ gi + 1 }}</span>
                <span v-if="group.id === activeGroupId" class="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">当前组</span>
              </div>
              <button
                @click.stop="removeGroup(group.id)"
                :disabled="groups.length <= 1"
                class="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                :aria-label="'删除分组 ' + (gi + 1)"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <label class="block">
              <span class="text-xs text-muted-foreground block mb-1">User-agent</span>
              <select
                v-model="group.uaType"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option v-for="opt in uaOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </label>

            <input
              v-if="group.uaType === '__custom__'"
              v-model="group.customUa"
              type="text"
              placeholder="输入爬虫名称，例如 GPTBot"
              class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />

            <label class="block">
              <span class="text-xs text-muted-foreground block mb-1">Crawl-delay（秒，选填 0-30）</span>
              <input
                v-model="group.crawlDelay"
                type="number"
                min="0"
                max="30"
                step="1"
                placeholder="不设置则不输出该行"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <p class="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Google 不支持 Crawl-delay，Bing/百度支持；超出 0-30 的数值会自动截断。</span>
            </p>

            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-foreground">抓取规则</span>
                <span class="text-xs text-muted-foreground">{{ group.rules.length }} 条</span>
              </div>
              <div v-for="(rule, ri) in group.rules" :key="rule.id" class="space-y-1">
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-2 flex-shrink-0 text-xs text-muted-foreground">
                    <label class="flex items-center gap-1 cursor-pointer">
                      <input type="radio" :name="'rule-type-' + rule.id" value="Allow" v-model="rule.type" class="accent-primary" /> Allow
                    </label>
                    <label class="flex items-center gap-1 cursor-pointer">
                      <input type="radio" :name="'rule-type-' + rule.id" value="Disallow" v-model="rule.type" class="accent-primary" /> Disallow
                    </label>
                  </div>
                  <input
                    v-model="rule.path"
                    type="text"
                    placeholder="/path/to/block"
                    class="flex-1 min-w-0 px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    :class="validatePath(rule.path) === 'invalid' ? 'border-red-500/60' : 'border-border'"
                  />
                  <span v-if="hasWildcard(rule.path)" class="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium flex-shrink-0">通配符</span>
                  <button
                    @click.stop="removeRule(group, rule.id)"
                    class="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition flex-shrink-0"
                    :aria-label="'删除规则 ' + (ri + 1)"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
                <p v-if="validatePath(rule.path) === 'invalid'" class="text-xs text-red-500 pl-1">路径需以 / 开头，例如 /admin</p>
                <p v-else-if="validatePath(rule.path) === 'empty'" class="text-xs text-muted-foreground pl-1">留空将输出 Disallow:（即允许抓取所有内容）</p>
              </div>
              <button
                @click.stop="addRule(group)"
                class="w-full px-3 py-1.5 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition flex items-center justify-center gap-1"
              >
                <Plus class="w-3.5 h-3.5" /> 添加规则
              </button>
            </div>
          </div>

          <button
            @click="addGroup"
            class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <Plus class="w-4 h-4" /> 添加爬虫分组
          </button>
        </div>

        <!-- Sitemap 地址 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> Sitemap 地址
          </h2>
          <textarea
            v-model="sitemapsText"
            rows="4"
            placeholder="https://www.example.com/sitemap.xml（每行一个）"
            class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          ></textarea>
          <ul v-if="invalidSitemaps.length" class="space-y-1">
            <li v-for="bad in invalidSitemaps" :key="bad.line" class="text-xs text-red-500 flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>第 {{ bad.line }} 行「{{ bad.text }}」不是以 http:// 或 https:// 开头的合法地址，不会输出。</span>
            </li>
          </ul>
          <p v-else class="text-xs text-muted-foreground leading-relaxed">
            每行填写一个 Sitemap 地址，需以 http:// 或 https:// 开头，空行自动忽略；生成的文件末尾会逐行输出 Sitemap: 指令。
          </p>
        </div>
      </div>

      <!-- 右列：预览（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <h2 class="text-lg font-semibold flex items-center">
              <Bot class="w-5 h-5 mr-2 text-primary" /> robots.txt 预览
            </h2>
            <div class="flex items-center gap-2">
              <button
                @click="copyOutput"
                class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
              <button
                @click="downloadTxt"
                class="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition flex items-center gap-1.5"
              >
                <Download class="w-3.5 h-3.5" /> 下载 robots.txt
              </button>
              <button
                @click="resetAll"
                class="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition flex items-center gap-1.5"
              >
                <RefreshCw class="w-3.5 h-3.5" /> 重置
              </button>
            </div>
          </div>

          <pre class="whitespace-pre-wrap font-mono text-sm leading-relaxed bg-muted/50 border border-border rounded-lg p-4 min-h-[320px] text-foreground">{{ robotsTxt }}</pre>

          <div class="flex items-center justify-between flex-wrap gap-2 text-xs text-muted-foreground">
            <span>共 {{ lineCount }} 行 · {{ byteSize }} 字节 · UTF-8 纯文本</span>
            <span class="flex items-center gap-1">
              <CheckCircle class="w-3.5 h-3.5 text-green-500" /> 浏览器本地生成，不上传任何数据
            </span>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed">
            使用方法：点击「复制」或「下载」得到 robots.txt，上传到网站根目录，保证能通过 https://你的域名/robots.txt 直接访问；若站点或 CDN 对该路径有缓存，更新后记得同步刷新缓存。
          </p>
        </div>

        <!-- 快速屏蔽路径速查 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 快速屏蔽路径速查
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div v-for="qp in quickPaths" :key="qp.path" class="flex items-start justify-between gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2">
              <div class="min-w-0">
                <p class="text-sm font-mono text-foreground truncate">{{ qp.path }}</p>
                <p class="text-xs text-muted-foreground mt-0.5">{{ qp.desc }}</p>
              </div>
              <button
                @click="appendQuickPath(qp.path)"
                class="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition flex-shrink-0"
                :aria-label="'把 ' + qp.path + ' 追加到当前组'"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">点击加号会把该路径以 Disallow 规则追加到当前组（左侧带「当前组」标记的爬虫分组）。</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>robots.txt 生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          robots.txt 生成器是一款在线 robots 排除协议文件生成工具。它把 User-agent 分组、Allow/Disallow 规则、Crawl-delay 抓取间隔与 Sitemap 地址做成表单，
          按协议语法实时拼接出可用的 robots.txt 文本，并提供全开放、全封锁、WordPress 标准版与屏蔽敏感目录四类预设模板。工具会在同一分组下逐条校验路径格式、
          标记通配符写法、检测重复的 User-agent 并提示合并，避免生成一条同名分组互相覆盖的无效配置。生成结果可一键复制或下载，上传到网站根目录即可生效。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">robots.txt 是什么？应该放在哪里？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          robots.txt 是「robots 排除协议」的载体，一个告诉爬虫（搜索引擎蜘蛛）哪些路径可以抓取、哪些不要抓的纯文本文件。它必须放在站点根目录，
          保证能通过「你的域名/robots.txt」直接访问到，例如 https://www.util.cn/robots.txt；放在子目录（如 /blog/robots.txt）对搜索引擎无效。
          文件名必须全小写 robots.txt，使用 UTF-8 编码，指令区分 User-agent 分组，每组内书写 Disallow、Allow 与 Crawl-delay。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Disallow 和 Allow 冲突时谁赢？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          同一个 User-agent 分组里某条 URL 同时命中 Disallow 与 Allow 时，遵循「最长匹配优先」：路径匹配串更长的那条规则获胜。例如 Disallow: /admin 与
          Allow: /admin/login，对 /admin/login.html 来说 Allow 匹配更长，因此允许抓取——这也是 WordPress 模板里「屏蔽 /wp-admin/ 但放行
          admin-ajax.php」能够生效的原理。若两条规则匹配长度相同，以限制更宽松的 Allow 为准；一条都不匹配时默认允许抓取。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">meta robots 与 robots.txt 有什么区别？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两者作用层级不同：robots.txt 管「抓取」，是全站级别的入口开关，决定爬虫能不能来抓某个路径；meta robots（&lt;meta name="robots" content="noindex"&gt;）
          管「索引」，作用在单个页面，决定已被抓取的页面要不要进入搜索结果。特别注意：一旦用 robots.txt 屏蔽了某页面，爬虫根本不会抓它，页面里写的
          noindex 也无法被看到；想彻底让某页从搜索结果消失，正确做法是放行抓取并在页面加 noindex。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么测试 robots.txt 已经生效？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          三种常用方式：一是浏览器直接访问 https://你的域名/robots.txt，核对线上内容与本工具预览一致；二是命令行 curl https://你的域名/robots.txt，
          查看服务器实际返回的文本；三是在 Google Search Console 的「robots.txt 报告」里查看 Google 抓取到的最新版本与语法报错，并用「网址检查」工具
          测试具体 URL 是否被屏蔽。Bing Webmaster Tools 与百度搜索资源平台也提供类似的抓取诊断功能。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">修改后多久生效？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Google 对 robots.txt 有缓存，通常 24 小时内会重新拉取，可在 Search Console 的 robots.txt 报告中点击「请求重新抓取」加速；Bing、百度等
          引擎各有抓取节奏，一般几天内生效。另外要记住 robots.txt 只是协议约定，正规搜索引擎会遵守，但恶意爬虫完全可以无视它——后台、接口等敏感
          路径仍需配合登录鉴权保护，不能只靠 robots.txt。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">robots.txt 应该放在网站的哪个位置？</h3>
            <p class="text-sm text-muted-foreground mt-1">必须放在站点根目录，保证能通过 https://你的域名/robots.txt 直接访问；放在子目录对搜索引擎无效。文件名必须全小写 robots.txt、UTF-8 编码，用本工具生成后复制或下载上传到根目录即可。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">Disallow 和 Allow 规则冲突时哪条生效？</h3>
            <p class="text-sm text-muted-foreground mt-1">遵循最长匹配优先原则：同一条 URL 同时命中 Disallow 与 Allow 时，匹配字符串更长的规则获胜；长度相同时以更宽松的 Allow 为准；两条都不匹配则默认允许抓取。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">robots.txt 和 meta robots 标签有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">robots.txt 管全站「抓取」，决定爬虫能不能来抓某个路径；meta robots 管单页「索引」，决定被抓的页面要不要进入搜索结果。robots.txt 屏蔽后爬虫看不到页面里的 noindex，想从结果中移除页面应放行抓取并加 noindex。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">怎么验证 robots.txt 已经生效？</h3>
            <p class="text-sm text-muted-foreground mt-1">浏览器直接访问 https://你的域名/robots.txt 核对内容；或用 curl https://你的域名/robots.txt 查看服务器返回；也可在 Google Search Console 的 robots.txt 报告查看 Google 抓到的版本，并用网址检查工具测试具体 URL 是否被屏蔽。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">修改 robots.txt 后多久生效？</h3>
            <p class="text-sm text-muted-foreground mt-1">Google 对 robots.txt 有缓存，通常 24 小时内重新拉取，可在 Search Console 手动请求重新抓取；Bing、百度等引擎一般几天内生效。robots.txt 只是协议约定，恶意爬虫可以无视它，敏感目录仍需登录鉴权保护。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'robots-txt-generator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Bot, CheckCircle, TriangleAlert, Copy, Download, RefreshCw,
  ChevronUp, ChevronDown, Info, Plus, X
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'robots.txt 生成器 - 在线 robots 协议文件生成工具',
  description: '免费在线 robots.txt 生成器，内置 WordPress、全开放、全封锁与敏感目录预设模板，支持多 User-agent 分组、Allow/Disallow 规则校验、Crawl-delay 与 Sitemap 配置，重复爬虫检测，一键复制下载，纯浏览器本地运行不上传',
  keywords: 'robots.txt生成器,robots协议生成,robots.txt在线生成,Disallow Allow规则,WordPress robots.txt,Crawl-delay设置,Sitemap提交,屏蔽搜索引擎爬虫',
  author: '有条工具',
  ogTitle: 'robots.txt 生成器 - 在线 robots 协议文件生成工具 | 有条工具',
  ogDescription: '多爬虫分组配置 Allow/Disallow 规则、Crawl-delay 与 Sitemap，实时预览并一键复制下载 robots.txt。',
  ogUrl: 'https://www.util.cn/tools/robots-txt-generator',
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
          name: 'robots.txt 生成器',
          url: 'https://www.util.cn/tools/robots-txt-generator',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['预设全开放/全封锁/WordPress/敏感目录模板', '多 User-agent 分组与自定义爬虫', 'Allow/Disallow 规则校验与通配符标记', 'Crawl-delay 抓取间隔设置（0-30 秒）', '多行 Sitemap 地址校验与输出', '重复 User-agent 合并警告', '一键复制与下载 robots.txt', '纯浏览器本地生成不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'robots.txt 生成器', item: 'https://www.util.cn/tools/robots-txt-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'robots.txt 应该放在网站的哪个位置？',
              acceptedAnswer: { '@type': 'Answer', text: '必须放在站点根目录，保证能通过 https://你的域名/robots.txt 直接访问；放在子目录对搜索引擎无效。文件名必须全小写 robots.txt、UTF-8 编码，用本工具生成后复制或下载上传到根目录即可。' }
            },
            {
              '@type': 'Question',
              name: 'Disallow 和 Allow 规则冲突时哪条生效？',
              acceptedAnswer: { '@type': 'Answer', text: '遵循最长匹配优先原则：同一条 URL 同时命中 Disallow 与 Allow 时，匹配字符串更长的规则获胜；长度相同时以更宽松的 Allow 为准；两条都不匹配则默认允许抓取。' }
            },
            {
              '@type': 'Question',
              name: 'robots.txt 和 meta robots 标签有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'robots.txt 管全站抓取，决定爬虫能不能来抓某个路径；meta robots 管单页索引，决定被抓的页面要不要进入搜索结果。robots.txt 屏蔽后爬虫看不到页面里的 noindex，想从结果中移除页面应放行抓取并加 noindex。' }
            },
            {
              '@type': 'Question',
              name: '怎么验证 robots.txt 已经生效？',
              acceptedAnswer: { '@type': 'Answer', text: '浏览器直接访问 https://你的域名/robots.txt 核对内容；或用 curl https://你的域名/robots.txt 查看服务器返回；也可在 Google Search Console 的 robots.txt 报告查看 Google 抓到的版本，并用网址检查工具测试具体 URL 是否被屏蔽。' }
            },
            {
              '@type': 'Question',
              name: '修改 robots.txt 后多久生效？',
              acceptedAnswer: { '@type': 'Answer', text: 'Google 对 robots.txt 有缓存，通常 24 小时内重新拉取，可在 Search Console 手动请求重新抓取；Bing、百度等引擎一般几天内生效。robots.txt 只是协议约定，恶意爬虫可以无视它，敏感目录仍需登录鉴权保护。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 解析分组的 User-agent 名称：自定义输入取 customUa，为空回退到 *
function resolveUaName(group) {
  const raw = group.uaType === '__custom__' ? group.customUa : group.uaType
  return String(raw || '').trim() || '*'
}

// Crawl-delay 规整：空/非法返回 null（不输出该行），合法值取整并截断到 0-30
function normalizeCrawlDelay(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = Math.floor(Number(value))
  if (!Number.isFinite(n) || n < 0) return null
  return Math.min(n, 30)
}

// 路径校验：空 → 'empty'，不以 / 开头 → 'invalid'，合法 → 'ok'
function validatePath(path) {
  const s = String(path || '').trim()
  if (!s) return 'empty'
  return s.startsWith('/') ? 'ok' : 'invalid'
}

// 是否包含 robots 通配符（* 或行尾限定符 $）
function hasWildcard(path) {
  const s = String(path || '')
  return s.includes('*') || s.includes('$')
}

// Sitemap 行校验：空行 → 'skip'（跳过），http(s) 开头 → 'ok'，其余 → 'invalid'
function validateUrlLine(line) {
  const s = String(line || '').trim()
  if (!s) return 'skip'
  return /^https?:\/\//i.test(s) ? 'ok' : 'invalid'
}

// 找出重复的 User-agent 名称（同名分组会被搜索引擎合并，需 UI 黄条提示）
function duplicateUaOf(groupList) {
  const seen = new Set()
  const duplicates = new Set()
  groupList.forEach((group) => {
    const name = resolveUaName(group)
    if (seen.has(name)) duplicates.add(name)
    else seen.add(name)
  })
  return Array.from(duplicates)
}

// 核心：由爬虫分组与 Sitemap 列表生成 robots.txt 文本
// 每组输出 User-agent 行 + 逐条 Allow/Disallow 行 + 可选 Crawl-delay 行；
// 空路径输出裸 Disallow:（允许抓取所有内容）并附中文注释；末尾逐行输出 Sitemap
function buildRobotsTxt(groupList, sitemapList) {
  const blocks = (groupList || []).map((group) => {
    const lines = ['User-agent: ' + resolveUaName(group)]
    const delay = normalizeCrawlDelay(group.crawlDelay)
    if (delay !== null) lines.push('Crawl-delay: ' + delay)
    ;(group.rules || []).forEach((rule) => {
      const path = String(rule.path || '').trim()
      if (!path) {
        lines.push('Disallow:')
        lines.push('# 空的 Disallow 表示允许抓取所有内容')
      } else {
        lines.push((rule.type === 'Allow' ? 'Allow: ' : 'Disallow: ') + path)
      }
    })
    return lines.join('\n')
  })
  const sitemapUrls = (sitemapList || [])
    .map((line) => String(line).trim())
    .filter((line) => validateUrlLine(line) === 'ok')
  const body = blocks.join('\n\n')
  if (!sitemapUrls.length) return body
  const sitemapBlock = sitemapUrls.map((url) => 'Sitemap: ' + url).join('\n')
  return body ? body + '\n\n' + sitemapBlock : sitemapBlock
}

// ---------- 常量与预设模板 ----------
const uaOptions = [
  { value: '*', label: '* （全部爬虫）' },
  { value: 'Googlebot', label: 'Googlebot（谷歌）' },
  { value: 'Bingbot', label: 'Bingbot（必应）' },
  { value: 'Baiduspider', label: 'Baiduspider（百度）' },
  { value: '__custom__', label: '自定义输入…' }
]

const quickPaths = [
  { path: '/wp-admin/', desc: 'WordPress 后台入口，避免管理界面被抓取收录' },
  { path: '/admin', desc: '通用后台路径，防止暴露管理入口与登录漏洞' },
  { path: '/login', desc: '登录页对搜索无价值，屏蔽可节省抓取配额' },
  { path: '/cart', desc: '购物车是会话级页面，收录没有意义' },
  { path: '/checkout', desc: '结算流程页，可能泄露订单参数，不该被收录' },
  { path: '/search?', desc: '站内搜索结果页，避免大量低质量页面进索引' },
  { path: '/*?s=', desc: '通配符屏蔽所有带 s= 搜索参数的 URL' }
]

const presetTemplates = [
  {
    id: 'open',
    label: '全开放（只 Allow + Sitemap 占位）',
    groups: [
      { uaType: '*', customUa: '', crawlDelay: '', rules: [{ type: 'Allow', path: '/' }] }
    ],
    sitemaps: 'https://www.example.com/sitemap.xml'
  },
  {
    id: 'closed',
    label: '全封锁（Disallow: /）',
    groups: [
      { uaType: '*', customUa: '', crawlDelay: '', rules: [{ type: 'Disallow', path: '/' }] }
    ],
    sitemaps: ''
  },
  {
    id: 'wordpress',
    label: 'WordPress 标准版',
    groups: [
      {
        uaType: '*',
        customUa: '',
        crawlDelay: '',
        rules: [
          { type: 'Disallow', path: '/wp-admin/' },
          { type: 'Allow', path: '/wp-admin/admin-ajax.php' },
          { type: 'Disallow', path: '/wp-login.php' },
          { type: 'Disallow', path: '/?s=' },
          { type: 'Disallow', path: '/feed/' }
        ]
      }
    ],
    sitemaps: ''
  },
  {
    id: 'sensitive',
    label: '屏蔽敏感目录',
    groups: [
      {
        uaType: '*',
        customUa: '',
        crawlDelay: '',
        rules: [
          { type: 'Disallow', path: '/admin' },
          { type: 'Disallow', path: '/login' },
          { type: 'Disallow', path: '/cgi-bin' },
          { type: 'Disallow', path: '/tmp' },
          { type: 'Disallow', path: '/.git' }
        ]
      }
    ],
    sitemaps: ''
  }
]
const DEFAULT_PRESET_ID = 'wordpress'

// ---------- 状态 ----------
let idSeed = 0
function nextId() {
  idSeed += 1
  return idSeed
}

function createRule(type = 'Disallow', path = '') {
  return { id: nextId(), type, path }
}

function createGroup() {
  return { id: nextId(), uaType: '*', customUa: '', crawlDelay: '', rules: [createRule()] }
}

function cloneGroupData(data) {
  return {
    id: nextId(),
    uaType: data.uaType,
    customUa: data.customUa || '',
    crawlDelay: data.crawlDelay || '',
    rules: (data.rules || []).map((rule) => createRule(rule.type, rule.path))
  }
}

const presetId = ref(DEFAULT_PRESET_ID)
const groups = ref([])
const sitemapsText = ref('')
const activeGroupId = ref(null)
const seoContentVisible = ref(true)

// 应用预设模板（覆盖全部分组与 Sitemap），setup 期间调用一次作为初始状态，
// 服务端与客户端执行同一份纯数据，保证 SSR 水合一致
function loadPreset(id) {
  const tpl = presetTemplates.find((t) => t.id === id)
  if (!tpl) return
  groups.value = tpl.groups.map(cloneGroupData)
  sitemapsText.value = tpl.sitemaps
  activeGroupId.value = groups.value.length ? groups.value[0].id : null
}
loadPreset(DEFAULT_PRESET_ID)

// ---------- 计算属性 ----------
const duplicateUas = computed(() => duplicateUaOf(groups.value))
const sitemapLines = computed(() => sitemapsText.value.split('\n'))
const invalidSitemaps = computed(() =>
  sitemapLines.value
    .map((text, idx) => ({ line: idx + 1, text: text.trim(), status: validateUrlLine(text) }))
    .filter((item) => item.status === 'invalid')
)
const robotsTxt = computed(() => buildRobotsTxt(groups.value, sitemapLines.value))
const lineCount = computed(() => (robotsTxt.value ? robotsTxt.value.split('\n').length : 0))
const byteSize = computed(() => new TextEncoder().encode(robotsTxt.value).length)

// ---------- 事件处理（浏览器 API 只在用户回调中使用，SSR 安全） ----------
function setActiveGroup(id) {
  activeGroupId.value = id
}

function addGroup() {
  const group = createGroup()
  groups.value = [...groups.value, group]
  activeGroupId.value = group.id
}

function removeGroup(id) {
  if (groups.value.length <= 1) return
  groups.value = groups.value.filter((g) => g.id !== id)
  if (activeGroupId.value === id) activeGroupId.value = groups.value[0].id
}

function addRule(group) {
  group.rules.push(createRule())
}

function removeRule(group, ruleId) {
  group.rules = group.rules.filter((r) => r.id !== ruleId)
  if (!group.rules.length) group.rules.push(createRule())
}

// 快速路径：以 Disallow 规则追加到当前组（无选中时回退到第一组）
function appendQuickPath(path) {
  const group = groups.value.find((g) => g.id === activeGroupId.value) || groups.value[0]
  if (!group) return
  group.rules.push(createRule('Disallow', path))
}

function resetAll() {
  presetId.value = DEFAULT_PRESET_ID
  loadPreset(DEFAULT_PRESET_ID)
}

async function copyOutput() {
  const text = robotsTxt.value
  if (!text) {
    alert('暂无可复制的内容，请先配置爬虫分组或规则')
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    alert('robots.txt 内容已复制到剪贴板，可直接粘贴保存')
  } catch (err) {
    // 剪贴板 API 不可用（如非安全上下文）时退回 execCommand 方案
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      alert(ok ? 'robots.txt 内容已复制到剪贴板，可直接粘贴保存' : '复制失败，请手动选中预览区文本复制')
    } catch (err2) {
      alert('复制失败，请手动选中预览区文本复制')
    }
  }
}

function downloadTxt() {
  const blob = new Blob([robotsTxt.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'robots.txt'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('robots-txt-generator')
})
</script>
