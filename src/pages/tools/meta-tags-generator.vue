<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Tags class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Meta 标签生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">一键生成 SEO / Open Graph / Twitter Card 标签，实时 SERP 预览与长度截断体检，复制即用</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 Meta 标签生成工具：填写页面标题（title）、描述（description）、canonical、robots、viewport 与 Open Graph、Twitter Card 分享字段，
        实时生成一份缩进规范、可直接粘贴进页面 head 的完整标签代码，并同步模拟 Google 搜索结果与社交平台分享卡片的展示效果；
        自带 title / description 长度体检（按中文约 30 字、Google 移动端描述约 120-165 字符口径提示截断风险），
        空字段自动省略、表单本地自动保存。全部生成与预览在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左面板：表单填写 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Tags class="w-5 h-5 mr-2 text-primary" /> 表单填写
        </h2>

        <!-- 基础字段 -->
        <h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span> 基础字段
        </h3>

        <!-- title -->
        <div>
          <label for="mt-title" class="block text-sm font-medium text-foreground mb-1.5">页面标题 title</label>
          <input
            id="mt-title"
            v-model="form.title"
            type="text"
            placeholder="例如：Meta 标签生成器 - 在线网页 SEO 标签工具"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div class="flex items-start justify-between gap-3 mt-1.5">
            <p class="text-xs leading-relaxed flex items-start gap-1 min-w-0" :class="STATUS_TEXT_CLASS[titleStatus.level]">
              <component :is="statusIconOf(titleStatus.level)" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ titleStatus.label }}：{{ titleStatus.detail }}</span>
            </p>
            <span class="text-xs font-mono flex-shrink-0 tabular-nums" :class="STATUS_TEXT_CLASS[titleStatus.level]">{{ titleCount }} 字</span>
          </div>
        </div>

        <!-- description -->
        <div>
          <label for="mt-desc" class="block text-sm font-medium text-foreground mb-1.5">页面描述 description</label>
          <textarea
            id="mt-desc"
            v-model="form.description"
            rows="3"
            placeholder="写清页面能解决什么问题、适合谁用，理想区间 120-165 字"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          ></textarea>
          <div class="flex items-start justify-between gap-3 mt-1.5">
            <p class="text-xs leading-relaxed flex items-start gap-1 min-w-0" :class="STATUS_TEXT_CLASS[descStatus.level]">
              <component :is="statusIconOf(descStatus.level)" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ descStatus.label }}：{{ descStatus.detail }}</span>
            </p>
            <span class="text-xs font-mono flex-shrink-0 tabular-nums" :class="STATUS_TEXT_CLASS[descStatus.level]">{{ descCount }} 字</span>
          </div>
        </div>

        <!-- canonical -->
        <div>
          <label for="mt-canonical" class="block text-sm font-medium text-foreground mb-1.5">Canonical URL<span class="text-xs text-muted-foreground font-normal ml-1.5">选填</span></label>
          <input
            id="mt-canonical"
            v-model="form.canonical"
            type="text"
            placeholder="https://www.example.com/page"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div class="flex items-start justify-between gap-3 mt-1.5">
            <p class="text-xs leading-relaxed flex items-start gap-1 min-w-0" :class="STATUS_TEXT_CLASS[canonicalStatus.level]">
              <component :is="statusIconOf(canonicalStatus.level)" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ canonicalStatus.label }}：{{ canonicalStatus.detail }}</span>
            </p>
            <span class="text-xs font-mono flex-shrink-0 tabular-nums" :class="form.canonical.trim() ? 'text-primary' : 'text-muted-foreground'">{{ charCount(form.canonical) }} 字符</span>
          </div>
        </div>

        <!-- robots -->
        <div>
          <label for="mt-robots" class="block text-sm font-medium text-foreground mb-1.5">Robots</label>
          <select
            id="mt-robots"
            v-model="form.robots"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="r in ROBOTS_CHOICES" :key="r.value" :value="r.value">{{ r.label }}</option>
          </select>
          <p class="text-xs text-muted-foreground mt-1.5">控制搜索引擎是否收录本页；什么时候该用 noindex 见下方说明。</p>
        </div>

        <!-- keywords -->
        <div>
          <label for="mt-keywords" class="block text-sm font-medium text-foreground mb-1.5">Keywords<span class="text-xs text-muted-foreground font-normal ml-1.5">选填</span></label>
          <input
            id="mt-keywords"
            v-model="form.keywords"
            type="text"
            placeholder="关键词1, 关键词2, 关键词3"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div class="flex items-center justify-between gap-3 mt-1.5">
            <p class="text-xs text-muted-foreground min-w-0">主流搜索引擎已忽略此标签，仅存档用</p>
            <span class="text-xs font-mono flex-shrink-0 tabular-nums" :class="form.keywords.trim() ? 'text-primary' : 'text-muted-foreground'">{{ charCount(form.keywords) }} 字</span>
          </div>
        </div>

        <!-- author -->
        <div>
          <label for="mt-author" class="block text-sm font-medium text-foreground mb-1.5">Author<span class="text-xs text-muted-foreground font-normal ml-1.5">选填</span></label>
          <input
            id="mt-author"
            v-model="form.author"
            type="text"
            placeholder="页面作者或机构名"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div class="flex items-center justify-end mt-1.5">
            <span class="text-xs font-mono tabular-nums" :class="form.author.trim() ? 'text-primary' : 'text-muted-foreground'">{{ charCount(form.author) }} 字</span>
          </div>
        </div>

        <!-- viewport -->
        <div>
          <label for="mt-viewport" class="block text-sm font-medium text-foreground mb-1.5">Viewport</label>
          <input
            id="mt-viewport"
            v-model="form.viewport"
            type="text"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div class="flex items-center justify-between gap-3 mt-1.5">
            <p class="text-xs text-muted-foreground min-w-0">移动端自适应必需，一般保持默认即可</p>
            <span class="text-xs font-mono flex-shrink-0 tabular-nums" :class="form.viewport.trim() ? 'text-primary' : 'text-muted-foreground'">{{ charCount(form.viewport) }} 字符</span>
          </div>
        </div>

        <!-- charset 固定说明行 -->
        <div class="flex items-start gap-1.5 p-2.5 rounded bg-muted/60 text-xs text-muted-foreground">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
          <p>字符编码 charset 固定输出 <code class="font-mono text-foreground">&lt;meta charset="utf-8"&gt;</code>，现代页面统一使用 UTF-8，无需配置。</p>
        </div>

        <!-- Open Graph -->
        <h3 class="text-sm font-semibold text-foreground flex items-center gap-2 border-t border-border pt-5">
          <span class="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span> Open Graph（社交分享）
        </h3>

        <!-- og:title -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label for="mt-ogtitle" class="text-sm font-medium text-foreground">og:title</label>
            <label class="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" v-model="form.ogTitleSync" class="w-3.5 h-3.5 accent-primary cursor-pointer" />
              同步 title
            </label>
          </div>
          <input
            v-if="form.ogTitleSync"
            type="text"
            disabled
            :value="form.title"
            placeholder="与上方 title 保持一致"
            class="w-full px-3 py-2 bg-muted/50 border border-input rounded-lg text-foreground text-sm opacity-70 cursor-not-allowed"
          />
          <input
            v-else
            id="mt-ogtitle"
            v-model="form.ogTitle"
            type="text"
            placeholder="独立填写 og:title，留空则整行省略"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div class="flex items-center justify-end mt-1.5">
            <span v-if="!form.ogTitleSync" class="text-xs font-mono tabular-nums" :class="form.ogTitle.trim() ? 'text-primary' : 'text-muted-foreground'">{{ charCount(form.ogTitle) }} 字</span>
          </div>
        </div>

        <!-- og:description（固定同步） -->
        <div>
          <label for="mt-ogdesc" class="block text-sm font-medium text-foreground mb-1.5">og:description</label>
          <input
            id="mt-ogdesc"
            type="text"
            disabled
            :value="form.description"
            placeholder="自动同步 description"
            class="w-full px-3 py-2 bg-muted/50 border border-input rounded-lg text-foreground text-sm opacity-70 cursor-not-allowed"
          />
          <p class="text-xs text-muted-foreground mt-1.5">固定同步上方 description，留空则整行省略</p>
        </div>

        <!-- og:image -->
        <div>
          <label for="mt-ogimage" class="block text-sm font-medium text-foreground mb-1.5">og:image</label>
          <input
            id="mt-ogimage"
            v-model="form.ogImage"
            type="text"
            placeholder="https://www.example.com/cover.png"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div class="flex items-start justify-between gap-3 mt-1.5">
            <p class="text-xs leading-relaxed flex items-start gap-1 min-w-0" :class="STATUS_TEXT_CLASS[ogImageStatus.level]">
              <component :is="statusIconOf(ogImageStatus.level)" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ ogImageStatus.label }}：{{ ogImageStatus.detail }}</span>
            </p>
            <span class="text-xs font-mono flex-shrink-0 tabular-nums" :class="form.ogImage.trim() ? 'text-primary' : 'text-muted-foreground'">{{ charCount(form.ogImage) }} 字符</span>
          </div>
        </div>

        <!-- og:url（固定同步） -->
        <div>
          <label for="mt-ogurl" class="block text-sm font-medium text-foreground mb-1.5">og:url</label>
          <input
            id="mt-ogurl"
            type="text"
            disabled
            :value="form.canonical"
            placeholder="自动同步 canonical"
            class="w-full px-3 py-2 bg-muted/50 border border-input rounded-lg text-foreground text-sm opacity-70 cursor-not-allowed"
          />
          <p class="text-xs text-muted-foreground mt-1.5">固定同步上方 Canonical URL，留空则整行省略</p>
        </div>

        <!-- og:type -->
        <div>
          <label for="mt-ogtype" class="block text-sm font-medium text-foreground mb-1.5">og:type</label>
          <select
            id="mt-ogtype"
            v-model="form.ogType"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="t in OG_TYPE_CHOICES" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>

        <!-- Twitter Card -->
        <h3 class="text-sm font-semibold text-foreground flex items-center gap-2 border-t border-border pt-5">
          <span class="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span> Twitter Card（Twitter / X 分享）
        </h3>

        <!-- twitter:card -->
        <div>
          <label for="mt-twcard" class="block text-sm font-medium text-foreground mb-1.5">twitter:card</label>
          <select
            id="mt-twcard"
            v-model="form.twitterCard"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="c in TWITTER_CARD_CHOICES" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
          <p class="text-xs text-muted-foreground mt-1.5">大图卡片需要页面有可用配图，否则部分平台会退回小图样式</p>
        </div>

        <!-- twitter:title -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label for="mt-twtitle" class="text-sm font-medium text-foreground">twitter:title</label>
            <label class="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" v-model="form.twTitleUseOg" class="w-3.5 h-3.5 accent-primary cursor-pointer" />
              复用 OG
            </label>
          </div>
          <input
            v-if="form.twTitleUseOg"
            type="text"
            disabled
            :value="effOgTitle"
            placeholder="复用 og:title"
            class="w-full px-3 py-2 bg-muted/50 border border-input rounded-lg text-foreground text-sm opacity-70 cursor-not-allowed"
          />
          <input
            v-else
            id="mt-twtitle"
            v-model="form.twTitle"
            type="text"
            placeholder="独立填写 twitter:title，留空则整行省略"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div class="flex items-center justify-end mt-1.5">
            <span v-if="!form.twTitleUseOg" class="text-xs font-mono tabular-nums" :class="form.twTitle.trim() ? 'text-primary' : 'text-muted-foreground'">{{ charCount(form.twTitle) }} 字</span>
          </div>
        </div>

        <!-- twitter:description -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label for="mt-twdesc" class="text-sm font-medium text-foreground">twitter:description</label>
            <label class="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" v-model="form.twDescUseOg" class="w-3.5 h-3.5 accent-primary cursor-pointer" />
              复用 OG
            </label>
          </div>
          <input
            v-if="form.twDescUseOg"
            type="text"
            disabled
            :value="form.description"
            placeholder="复用 og:description"
            class="w-full px-3 py-2 bg-muted/50 border border-input rounded-lg text-foreground text-sm opacity-70 cursor-not-allowed"
          />
          <textarea
            v-else
            id="mt-twdesc"
            v-model="form.twDesc"
            rows="2"
            placeholder="独立填写 twitter:description，留空则整行省略"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          ></textarea>
          <div class="flex items-center justify-end mt-1.5">
            <span v-if="!form.twDescUseOg" class="text-xs font-mono tabular-nums" :class="form.twDesc.trim() ? 'text-primary' : 'text-muted-foreground'">{{ charCount(form.twDesc) }} 字</span>
          </div>
        </div>

        <!-- twitter:image -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label for="mt-twimage" class="text-sm font-medium text-foreground">twitter:image</label>
            <label class="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" v-model="form.twImageUseOg" class="w-3.5 h-3.5 accent-primary cursor-pointer" />
              复用 OG
            </label>
          </div>
          <input
            v-if="form.twImageUseOg"
            type="text"
            disabled
            :value="form.ogImage"
            placeholder="复用 og:image"
            class="w-full px-3 py-2 bg-muted/50 border border-input rounded-lg text-foreground text-sm opacity-70 cursor-not-allowed"
          />
          <input
            v-else
            id="mt-twimage"
            v-model="form.twImage"
            type="text"
            placeholder="https://www.example.com/twitter-cover.png"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div class="flex items-center justify-end mt-1.5">
            <span v-if="!form.twImageUseOg" class="text-xs font-mono tabular-nums" :class="form.twImage.trim() ? 'text-primary' : 'text-muted-foreground'">{{ charCount(form.twImage) }} 字符</span>
          </div>
        </div>
      </div>

      <!-- 右面板：预览 + 输出 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 上半：SERP 与 OG 预览 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Eye class="w-5 h-5 mr-2 text-primary" /> 实时预览
            </h2>
            <span class="text-xs text-muted-foreground">随左侧表单实时更新</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- Google 搜索结果模拟 -->
            <div class="space-y-2">
              <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Eye class="w-3.5 h-3.5" /> Google 搜索结果模拟
              </div>
              <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p class="text-[13px] text-green-700 dark:text-green-400 mb-1 truncate font-mono" :title="serp.urlShown">{{ serp.urlShown }}</p>
                <p
                  class="text-xl font-medium leading-snug mb-1.5 line-clamp-2"
                  :class="form.title.trim() ? 'text-blue-700 dark:text-blue-400' : 'text-muted-foreground'"
                  :title="serp.titleShown"
                >{{ serp.titleShown || '这是页面标题在搜索结果中的展示位置' }}</p>
                <p class="text-[13px] leading-relaxed line-clamp-2" :class="form.description.trim() ? 'text-muted-foreground' : 'text-muted-foreground/60'" :title="serp.descShown">{{ serp.descShown || '页面描述 description 会以两行摘要的形式展示在这里，把页面能解决什么问题写清楚，更能吸引用户点击……' }}</p>
              </div>
            </div>

            <!-- OG 社交分享卡片模拟 -->
            <div class="space-y-2">
              <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Tags class="w-3.5 h-3.5" /> 社交分享卡片模拟（Open Graph）
              </div>
              <div class="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <img
                  v-if="effOgImage && !ogImgFailed"
                  :src="effOgImage"
                  alt="og:image 预览"
                  class="w-full h-44 object-cover bg-muted"
                  @error="ogImgFailed = true"
                />
                <div v-else class="w-full h-44 bg-muted/40 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                  <Info class="w-5 h-5" />
                  <p class="text-xs px-4 text-center">{{ effOgImage ? 'og:image 加载失败，已退回占位图' : 'og:image 未设置，部分平台将不显示配图' }}</p>
                  <p class="text-[10px] text-muted-foreground/70">建议 1200×630 以上的 http(s) 图片直链</p>
                </div>
                <div class="p-3.5 space-y-1">
                  <p class="text-[11px] uppercase tracking-wide text-muted-foreground truncate font-mono">{{ ogDomain }}</p>
                  <p class="text-sm font-semibold truncate" :class="effOgTitle ? 'text-foreground' : 'text-muted-foreground'">{{ effOgTitle || 'og:title 将同步左侧标题' }}</p>
                  <p class="text-xs line-clamp-2" :class="effOgDesc ? 'text-muted-foreground' : 'text-muted-foreground/60'">{{ effOgDesc || 'og:description 将同步左侧描述' }}</p>
                </div>
              </div>
            </div>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5 p-2.5 rounded bg-muted/60">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>预览按中文口径模拟：标题在约 30 字、描述在约 165 字符处加 … 截断（中英文口径差异见下方说明），实际展示宽度因设备与搜索引擎而异；社交卡片以 Facebook / Telegram 样式为参考。</span>
          </p>
        </div>

        <!-- 下半：代码输出 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-lg font-semibold flex items-center">
              <Copy class="w-5 h-5 mr-2 text-primary" /> 生成的 Meta 标签
            </h2>
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground mr-1 hidden sm:inline">{{ outputLineCount }} 行 · 空字段已自动省略</span>
              <button
                @click="resetForm"
                class="px-3 py-1.5 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 border border-border rounded-lg transition"
              >
                <RefreshCw class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 还原默认
              </button>
              <button
                @click="copyOutput"
                class="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                <Copy class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 复制全部
              </button>
            </div>
          </div>

          <pre class="text-xs font-mono leading-relaxed bg-muted/50 border border-border rounded-lg p-4 overflow-auto max-h-[420px] text-foreground">{{ metaTagsOutput }}</pre>

          <p class="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 text-primary" />
            <span>使用方法：复制以上代码，粘贴到页面源码 &lt;head&gt; 与 &lt;/head&gt; 之间即可生效；框架 / 建站项目请写入对应页面的头部配置或 SEO 插件字段。</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>Meta 标签生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          Meta 标签生成器是一款纯本地运行的网页头部（head）标签生成工具。填写页面标题、描述、canonical、robots、viewport 等字段后，
          工具会实时生成一份缩进规范、可直接粘贴使用的 HTML Meta 标签，覆盖 SEO 基础标签（title、description、robots、canonical）、
          Open Graph 社交分享标签与 Twitter Card 卡片标签；右侧同步模拟 Google 搜索结果与社交平台分享卡片的展示效果，
          并对标题、描述做长度体检，超长即时提示截断风险。属性值中的 &amp;、&lt;、&gt;、双引号会自动转义，生成的代码可安全嵌入 HTML；
          表单内容自动保存在本机浏览器中，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">title 和 description 怎么写？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>关键词前置：核心关键词放在 title 开头、品牌词放结尾，用「-」「|」等分隔符隔开；description 首句就把页面核心价值说清，被截断时不丢关键信息。</li>
          <li>长度控制：中文 title 建议不超过 30 字（英文口径约 60 字符），description 建议写到 120-165 字（Google 移动端约 120-165 字符口径；桌面端约 150-160 字符）。超长会以 … 截断，排在尾部的关键词等于白写。</li>
          <li>吸引力：description 写清「谁能用、解决什么问题、有什么不同」，适当加入数字与利益点引导点击；避免多个页面复用同一段描述，也避免堆砌关键词——搜索引擎可能会改写你的 description。</li>
          <li>每个页面独立：title 与 description 应概括当前页面内容，全站共用一套会稀释每个页面的搜索展示质量。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">OG 标签对微信、微博分享生效吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          诚实地说：作用有限。微信聊天内的链接卡片在多数场景由微信 JS-SDK（wx.updateAppMessageShareData 等接口）配置决定，公众号文章环境也不完整读取 OG；
          微博主要按自身接口与站内数据生成卡片，两者都不完全依赖 Open Graph 协议。OG 标签主要对 Telegram、Twitter/X、Facebook、LinkedIn、Slack、Discord
          等海外平台和部分即时通讯生效。因此面向国内社媒的分享样式，需要再接入对应平台的官方 SDK；OG 标签则把海外平台与通用抓取场景覆盖好，两者互补而非互替。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Twitter Card 类型怎么选？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>summary：小方图（约 1:1）+ 标题 + 描述，体积小、加载快，适合文章、文档、工具页等以文字为主的页面。</li>
          <li>summary_large_image：大横幅图（约 2:1）+ 标题 + 描述，视觉冲击强，适合首页、活动页、作品集等有高质量主视觉的页面。</li>
          <li>配图建议 300×157 以上、小于 5MB 的 http(s) 直链；配图缺失或加载失败时，部分平台会退回 summary 样式或不显示配图。</li>
          <li>本工具默认生成 summary_large_image，没有合适配图时可在左侧切换为 summary。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">robots meta 什么时候用 noindex？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          noindex 用于「不希望出现在搜索结果」的页面：后台登录页、站内搜索结果页、购物车与结算流程页、测试或临时页面、重复内容页等。
          注意三点：noindex 只影响搜索引擎收录，不影响用户正常访问；不要同时用 robots.txt 屏蔽该页——爬虫抓不到页面就读不到 noindex 标签；
          对已收录页面加 noindex 后，搜索引擎通常会在一段时间后将其移出索引，操作前请确认该页确实不需要搜索流量。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">生成的 Meta 标签应该放在网页什么位置？</h3>
            <p class="text-sm text-muted-foreground mt-1">复制生成结果，粘贴到页面源码 head 与 /head 之间，通常紧跟 charset 与 viewport 之后；使用 Nuxt、WordPress 等框架或建站系统时，写入对应页面的头部配置或 SEO 插件字段，效果相同。修改后可用搜索引擎站长平台的网址检查工具验证。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">OG 标签对微信、微博分享生效吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">作用有限。微信聊天内链接卡片多数场景由微信 JS-SDK 配置，微博主要读取自身接口数据，两者都不完整依赖 OG；OG 标签主要对 Telegram、Twitter/X、Facebook、Slack、Discord 等海外平台生效。国内社媒分享样式建议再接入对应平台官方 SDK，两者互补。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">Twitter Card 类型怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1">summary 是小方图加标题描述，适合文章、文档等以文字为主的页面；summary_large_image 是大横幅图，视觉冲击强，适合有高质量主视觉的首页、活动页。配图建议 300×157 以上、小于 5MB 的 http(s) 直链，配图缺失时部分平台会退回小图样式。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">什么时候该用 robots noindex？</h3>
            <p class="text-sm text-muted-foreground mt-1">不希望出现在搜索结果的页面：后台登录页、站内搜索结果页、购物车与结算页、测试或临时页、重复内容页。注意 noindex 不影响用户访问，也不要与 robots.txt 屏蔽同时使用——爬虫抓不到页面就读不到这个标签。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'meta-tags-generator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  Tags, CheckCircle, TriangleAlert, Copy, RefreshCw,
  ChevronUp, ChevronDown, Info, Eye
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'Meta 标签生成器 - 在线网页 SEO/OG/Twitter Card 标签生成工具',
  description: '免费在线 Meta 标签生成器：填写标题、描述、canonical、robots 即可一键生成规范网页 head 标签，支持 Open Graph 与 Twitter Card 分享标签，实时模拟 Google 搜索结果与社交分享卡片，自带长度截断体检，纯本地运行不上传数据',
  keywords: 'meta标签生成器,meta description生成,og标签生成器,open graph生成,twitter card生成,canonical标签,robots meta,seo标签生成,head标签生成',
  author: '有条工具',
  ogTitle: 'Meta 标签生成器 - 在线网页 SEO/OG/Twitter Card 标签生成工具',
  ogDescription: '一键生成规范 Meta / Open Graph / Twitter Card 标签，实时 SERP 与分享卡片预览，长度体检防截断。',
  ogUrl: 'https://www.util.cn/tools/meta-tags-generator',
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
          name: 'Meta 标签生成器',
          url: 'https://www.util.cn/tools/meta-tags-generator',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['一键生成 Meta / Open Graph / Twitter Card 标签', 'title 与 description 长度体检', 'Google 搜索结果实时预览', 'OG 社交分享卡片预览', 'canonical 与 robots 配置', '属性值自动 HTML 转义', '表单本地自动保存']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'Meta 标签生成器', item: 'https://www.util.cn/tools/meta-tags-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '生成的 Meta 标签应该放在网页什么位置？',
              acceptedAnswer: { '@type': 'Answer', text: '复制生成结果，粘贴到页面源码 head 与 /head 之间，通常紧跟 charset 与 viewport 之后；使用 Nuxt、WordPress 等框架或建站系统时，写入对应页面的头部配置或 SEO 插件字段，效果相同。修改后可用搜索引擎站长平台的网址检查工具验证。' }
            },
            {
              '@type': 'Question',
              name: 'OG 标签对微信、微博分享生效吗？',
              acceptedAnswer: { '@type': 'Answer', text: '作用有限。微信聊天内链接卡片多数场景由微信 JS-SDK 配置，微博主要读取自身接口数据，两者都不完整依赖 OG；OG 标签主要对 Telegram、Twitter/X、Facebook、Slack、Discord 等海外平台生效。国内社媒分享样式建议再接入对应平台官方 SDK，两者互补。' }
            },
            {
              '@type': 'Question',
              name: 'Twitter Card 类型怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: 'summary 是小方图加标题描述，适合文章、文档等以文字为主的页面；summary_large_image 是大横幅图，视觉冲击强，适合有高质量主视觉的首页、活动页。配图建议 300×157 以上、小于 5MB 的 http(s) 直链，配图缺失时部分平台会退回小图样式。' }
            },
            {
              '@type': 'Question',
              name: '什么时候该用 robots noindex？',
              acceptedAnswer: { '@type': 'Answer', text: '不希望出现在搜索结果的页面：后台登录页、站内搜索结果页、购物车与结算页、测试或临时页、重复内容页。注意 noindex 不影响用户访问，也不要与 robots.txt 屏蔽同时使用——爬虫抓不到页面就读不到这个标签。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const TITLE_SAFE_MAX = 30  // 中文 SERP 标题完整展示字数（英文口径约 60 字符）
const TITLE_WARN_MAX = 60  // 31-60：偏长，可能被截断
const DESC_SHORT_MAX = 78  // 描述 ≤78：完整显示（偏短）
const DESC_WARN_MAX = 120  // 79-120：略短于移动端理想区间
const DESC_OK_MAX = 165    // Google 移动端描述约 120-165 字符
const SERP_TITLE_MAX = 30  // SERP 预览标题模拟截断位置（中文口径）
const SERP_DESC_MAX = 165  // SERP 预览描述模拟截断位置（移动端口径）
const TWITTER_CARD_DEFAULT = 'summary_large_image'
const ROBOTS_OPTIONS = ['index, follow', 'noindex, follow', 'index, nofollow', 'noindex, nofollow']
const OG_TYPES = ['website', 'article', 'product']
const TWITTER_CARDS = ['summary', 'summary_large_image']

// 有效字符数：按 Unicode 码点计数（emoji 算 1 个字），并去掉首尾空白
function charCount(s) {
  return [...String(s == null ? '' : s).trim()].length
}

// 属性值 / 文本转义：& < > "（& 必须先转义，避免二次转义）
function escapeAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// title 长度判定：≤30 合适 / 31-60 偏长可能被截断 / 61+ 会被截断
// 口径说明：中文搜索结果约 30 字、英文约 60 字符
function judgeTitleLength(n) {
  const c = Number(n) || 0
  if (c <= TITLE_SAFE_MAX) {
    return { level: 'ok', label: '长度合适', detail: '中文搜索结果约 30 字内完整展示（英文口径约 60 字符）' }
  }
  if (c <= TITLE_WARN_MAX) {
    return { level: 'warn', label: '偏长，可能被截断', detail: '已超中文约 30 字口径，超出部分在多数设备会被截断，建议精简' }
  }
  return { level: 'bad', label: '会被截断', detail: '远超展示宽度，标题后半段会被截断，建议控制在 30 字内并把关键词前置' }
}

// description 长度判定：≤78 绿 / 79-120 黄 / 121-165 绿 / 165+ 红
// 口径说明：按 Google 移动端约 120-165 字符给区间提示
function judgeDescLength(n) {
  const c = Number(n) || 0
  if (c <= DESC_SHORT_MAX) {
    return { level: 'ok', label: '完整显示', detail: '偏短但不会被截断；理想区间 120-165 字，可继续补充信息量' }
  }
  if (c <= DESC_WARN_MAX) {
    return { level: 'warn', label: '略短', detail: '略短，建议写到 120-165 字（Google 移动端约 120-165 字符口径）' }
  }
  if (c <= DESC_OK_MAX) {
    return { level: 'ok', label: '理想区间', detail: '处于 Google 移动端 120-165 字符理想区间，桌面与移动端展示都较完整' }
  }
  return { level: 'bad', label: '会被截断', detail: '超出移动端展示上限，结尾将以 … 截断，建议精简到 165 字以内' }
}

// 简单 http(s) 校验：以 http:// 或 https:// 开头且不含空白字符
function isValidHttpUrl(s) {
  return /^https?:\/\/\S+$/i.test(String(s == null ? '' : s).trim())
}

// 按码点截断，超长时以 … 结尾
function truncateWithEllipsis(s, max) {
  const chars = [...String(s == null ? '' : s)]
  return chars.length > max ? chars.slice(0, max).join('') + '…' : chars.join('')
}

// canonical → SERP 展示域名+路径（去协议；空值回退示例域名；非法 URL 走正则去协议）
function serpUrlOf(canonical) {
  const s = String(canonical == null ? '' : canonical).trim()
  if (!s) return 'www.example.com'
  try {
    const u = new URL(s)
    return u.host + (u.pathname === '/' ? '' : u.pathname) + u.search
  } catch (e) {
    return s.replace(/^https?:\/\//i, '').replace(/\/$/, '')
  }
}

// SERP 预览数据：标题 / 描述超长加 …，URL 去协议留域名+路径
function serpPreviewOf(form) {
  const f = form || {}
  return {
    titleShown: truncateWithEllipsis(String(f.title == null ? '' : f.title).trim(), SERP_TITLE_MAX),
    descShown: truncateWithEllipsis(String(f.description == null ? '' : f.description).trim(), SERP_DESC_MAX),
    urlShown: serpUrlOf(f.canonical)
  }
}

// 生成 Meta 标签文本：缩进 2 空格、分组间空行；空字段整行省略；
// twitter:card 必出；结尾不输出 <meta name="generator">
function buildMetaTags(form) {
  const f = form || {}
  const v = (x) => String(x == null ? '' : x).trim()

  // OG 生效值：og:title 默认同步 title（可解锁独立填写），description / url 固定同步对应字段
  const ogTitle = f.ogTitleSync ? v(f.title) : v(f.ogTitle)
  const ogDesc = v(f.description)
  const ogUrl = v(f.canonical)
  const ogImage = v(f.ogImage)
  // Twitter 生效值：开关打开时复用 OG 对应值，关闭时用独立输入（空值整行省略）
  const twTitle = f.twTitleUseOg ? ogTitle : v(f.twTitle)
  const twDesc = f.twDescUseOg ? ogDesc : v(f.twDesc)
  const twImage = f.twImageUseOg ? ogImage : v(f.twImage)

  const base = [`<meta charset="utf-8">`]
  if (v(f.viewport)) base.push(`<meta name="viewport" content="${escapeAttr(v(f.viewport))}">`)

  const seo = []
  if (v(f.title)) seo.push(`<title>${escapeAttr(v(f.title))}</title>`)
  if (ogDesc) seo.push(`<meta name="description" content="${escapeAttr(ogDesc)}">`)
  if (v(f.robots)) seo.push(`<meta name="robots" content="${escapeAttr(v(f.robots))}">`)
  if (ogUrl) seo.push(`<link rel="canonical" href="${escapeAttr(ogUrl)}">`)

  const extra = []
  if (v(f.author)) extra.push(`<meta name="author" content="${escapeAttr(v(f.author))}">`)
  if (v(f.keywords)) extra.push(`<meta name="keywords" content="${escapeAttr(v(f.keywords))}">`)

  const og = []
  if (ogTitle) og.push(`<meta property="og:title" content="${escapeAttr(ogTitle)}">`)
  if (ogDesc) og.push(`<meta property="og:description" content="${escapeAttr(ogDesc)}">`)
  if (ogImage) og.push(`<meta property="og:image" content="${escapeAttr(ogImage)}">`)
  if (ogUrl) og.push(`<meta property="og:url" content="${escapeAttr(ogUrl)}">`)
  if (v(f.ogType)) og.push(`<meta property="og:type" content="${escapeAttr(v(f.ogType))}">`)

  const tw = []
  tw.push(`<meta name="twitter:card" content="${escapeAttr(v(f.twitterCard) || TWITTER_CARD_DEFAULT)}">`)
  if (twTitle) tw.push(`<meta name="twitter:title" content="${escapeAttr(twTitle)}">`)
  if (twDesc) tw.push(`<meta name="twitter:description" content="${escapeAttr(twDesc)}">`)
  if (twImage) tw.push(`<meta name="twitter:image" content="${escapeAttr(twImage)}">`)

  return [base, seo, extra, og, tw]
    .filter((group) => group.length > 0)
    .map((group) => group.map((line) => '  ' + line).join('\n'))
    .join('\n\n')
}

// ---------- 下拉选项与展示配置 ----------
const ROBOTS_CHOICES = [
  { value: 'index, follow', label: 'index, follow（收录并跟踪链接）' },
  { value: 'noindex, follow', label: 'noindex, follow（不收录，跟踪链接）' },
  { value: 'index, nofollow', label: 'index, nofollow（收录，不跟踪链接）' },
  { value: 'noindex, nofollow', label: 'noindex, nofollow（不收录也不跟踪）' }
]
const OG_TYPE_CHOICES = [
  { value: 'website', label: 'website（网页 / 站点）' },
  { value: 'article', label: 'article（文章 / 资讯）' },
  { value: 'product', label: 'product（商品）' }
]
const TWITTER_CARD_CHOICES = [
  { value: 'summary_large_image', label: 'summary_large_image（大图卡片，推荐）' },
  { value: 'summary', label: 'summary（小方图卡片）' }
]
const STATUS_TEXT_CLASS = {
  ok: 'text-green-600 dark:text-green-400',
  warn: 'text-amber-600 dark:text-amber-400',
  bad: 'text-red-600 dark:text-red-400',
  empty: 'text-muted-foreground'
}

function statusIconOf(level) {
  if (level === 'ok') return CheckCircle
  if (level === 'warn' || level === 'bad') return TriangleAlert
  return Info
}

// ---------- 表单状态 ----------
const STORAGE_KEY = 'meta-tags-generator:form'

function defaultForm() {
  return {
    title: '',
    description: '',
    canonical: '',
    robots: 'index, follow',
    keywords: '',
    author: '',
    viewport: 'width=device-width, initial-scale=1.0',
    ogTitleSync: true,
    ogTitle: '',
    ogImage: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twTitleUseOg: true,
    twDescUseOg: true,
    twImageUseOg: true,
    twTitle: '',
    twDesc: '',
    twImage: ''
  }
}

const form = reactive(defaultForm())
const seoContentVisible = ref(true)
const ogImgFailed = ref(false)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 字段状态（长度 / 格式体检） ----------
const titleStatus = computed(() => {
  const n = charCount(form.title)
  if (!n) return { level: 'empty', label: '未填写', detail: '搜索结果最重要的展示字段，建议填写' }
  return judgeTitleLength(n)
})
const descStatus = computed(() => {
  const n = charCount(form.description)
  if (!n) return { level: 'empty', label: '未填写', detail: '展示在标题下方的摘要文案，建议填写' }
  return judgeDescLength(n)
})
const canonicalStatus = computed(() => {
  const s = form.canonical.trim()
  if (!s) return { level: 'empty', label: '选填', detail: '同一内容存在多个 URL 或带参数时建议填写，统一收录权重' }
  return isValidHttpUrl(s)
    ? { level: 'ok', label: '格式正确', detail: 'http(s) 完整链接' }
    : { level: 'bad', label: '格式有误', detail: '需以 http:// 或 https:// 开头的完整 URL' }
})
const ogImageStatus = computed(() => {
  const s = form.ogImage.trim()
  if (!s) return { level: 'empty', label: '选填', detail: '分享卡片主视觉，建议 1200×630 以上图片直链' }
  return isValidHttpUrl(s)
    ? { level: 'ok', label: '格式正确', detail: 'http(s) 图片直链' }
    : { level: 'bad', label: '格式有误', detail: '需以 http:// 或 https:// 开头的完整图片 URL' }
})

const titleCount = computed(() => charCount(form.title))
const descCount = computed(() => charCount(form.description))

// ---------- 生效值与预览 ----------
const effOgTitle = computed(() => (form.ogTitleSync ? form.title : form.ogTitle).trim())
const effOgDesc = computed(() => form.description.trim())
const effOgImage = computed(() => form.ogImage.trim())
const serp = computed(() => serpPreviewOf({ title: form.title, description: form.description, canonical: form.canonical }))
const ogDomain = computed(() => serp.value.urlShown.split('/')[0])
const metaTagsOutput = computed(() => buildMetaTags(form))
const outputLineCount = computed(() => metaTagsOutput.value.split('\n').length)

// og:image 变更时重置加载失败标记
watch(() => form.ogImage, () => { ogImgFailed.value = false })

// ---------- 复制 / 重置 ----------
function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch (e) {
    return false
  }
}

function copyOutput() {
  const text = metaTagsOutput.value
  if (!text) {
    alert('暂无可复制的内容')
    return
  }
  const okMsg = '已复制全部 Meta 标签，请粘贴到页面 <head> 与 </head> 之间'
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => alert(okMsg),
      () => alert(fallbackCopy(text) ? okMsg : '复制失败，请手动全选输出区文本复制')
    )
  } else {
    alert(fallbackCopy(text) ? okMsg : '复制失败，请手动全选输出区文本复制')
  }
}

function resetForm() {
  Object.assign(form, defaultForm())
}

// ---------- localStorage 持久化（读写都带 try/catch，读只在 onMounted） ----------
function saveForm() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
  } catch (e) {
    // 隐私模式 / 配额不足时忽略存储失败
  }
}

function loadForm() {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (!saved || typeof saved !== 'object') return
    const d = defaultForm()
    for (const key of Object.keys(d)) {
      if (typeof d[key] === 'boolean') form[key] = typeof saved[key] === 'boolean' ? saved[key] : d[key]
      else form[key] = typeof saved[key] === 'string' ? saved[key] : d[key]
    }
    if (!ROBOTS_OPTIONS.includes(form.robots)) form.robots = d.robots
    if (!OG_TYPES.includes(form.ogType)) form.ogType = d.ogType
    if (!TWITTER_CARDS.includes(form.twitterCard)) form.twitterCard = d.twitterCard
  } catch (e) {
    // 解析失败时忽略，使用默认表单
  }
}

watch(form, saveForm, { deep: true })

onMounted(() => {
  loadForm()
  addRecentTool('meta-tags-generator')
})
</script>
