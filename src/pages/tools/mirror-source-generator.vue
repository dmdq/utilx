<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Globe class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">镜像源配置生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">pip / npm / yarn / conda / brew / cargo / go 一键生成换源命令与配置片段</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        新机器装环境最繁琐的就是挨个换源。选择镜像站（清华 TUNA / 阿里云 / 中科大 / 腾讯云 / 官方默认还原）并勾选包管理器，即可生成对应的配置命令或文件片段：pip 用 <code class="px-1 bg-muted rounded text-sm">pip config set</code>、npm 用 <code class="px-1 bg-muted rounded text-sm">npm config set registry</code>、conda 给 .condarc、brew 给环境变量、cargo 给 config.toml、go 用 <code class="px-1 bg-muted rounded text-sm">go env -w GOPROXY</code>。地址为内置静态表，纯本地拼接生成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：选择 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Globe class="w-5 h-5 mr-2 text-primary" /> 选择
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">镜像站</label>
          <div class="space-y-1.5">
            <button
              v-for="(meta, key) in MIRROR_META"
              :key="key"
              @click="mirrorId = key"
              :class="mirrorId === key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="w-full py-2.5 rounded-lg text-sm font-medium transition-all text-left px-4"
            >{{ meta.label }}</button>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-foreground">包管理器（可多选）</label>
            <button
              @click="toggleAll"
              class="text-xs text-muted-foreground hover:text-primary transition-colors"
            >{{ selectedManagers.length === MANAGERS.length ? '取消全选' : '全选' }}</button>
          </div>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="m in MANAGERS"
              :key="m.value"
              @click="toggleManager(m.value)"
              :class="selectedManagers.includes(m.value) ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ m.label }}</button>
          </div>
        </div>

        <button
          @click="copyAll"
          class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Check v-if="copiedAll" class="w-4 h-4" />
          <Copy v-else class="w-4 h-4" />
          {{ copiedAll ? '已复制全部配置' : '复制全部配置' }}
        </button>

        <p class="text-xs text-muted-foreground leading-relaxed">
          镜像地址为公开常用地址的内置静态表，可能随镜像站策略调整，使用前请以各镜像站官方说明为准。
        </p>
      </div>

      <!-- 右侧：输出 -->
      <div class="lg:col-span-2 space-y-4">
        <div
          v-for="item in outputs"
          :key="item.manager"
          class="bg-card border border-border rounded-lg p-5 space-y-3"
        >
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-foreground">{{ item.title }}</h3>
            <button
              @click="copyText(item.content, item.manager)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs text-foreground transition-colors"
            >
              <Check v-if="copiedKey === item.manager" class="w-3.5 h-3.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copiedKey === item.manager ? '已复制' : '复制' }}
            </button>
          </div>
          <div class="relative border border-border rounded-lg overflow-hidden">
            <pre class="overflow-auto p-4 bg-muted/30 text-xs font-mono leading-relaxed max-h-64 whitespace-pre text-foreground">{{ item.content }}</pre>
          </div>
        </div>

        <div
          v-if="!outputs.length"
          class="bg-card border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground"
        >
          勾选包管理器后，这里会生成对应的换源配置
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于镜像源配置生成器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            国内访问 PyPI、npm、Homebrew 等官方源的下载速度常常不理想，换用国内镜像站可以显著加速。但每家包管理器的换源方式都不一样：有的改命令行配置，有的写配置文件，有的设环境变量。本工具内置清华 TUNA、阿里云、中科大、腾讯云四家镜像站的常用地址静态表，按需生成每种包管理器的换源命令与配置片段，并附还原命令——全部本地拼接，不发起任何网络请求。
          </p>

          <h3 class="text-lg font-semibold text-foreground">各包管理器的换源方式</h3>
          <p>
            pip 推荐写入配置：<code class="px-1 bg-muted rounded">pip config set global.index-url &lt;镜像地址&gt;</code>，临时使用可加 <code class="px-1 bg-muted rounded">-i</code> 参数；npm / yarn 用 <code class="px-1 bg-muted rounded">config set registry</code>；conda 写 <code class="px-1 bg-muted rounded">~/.condarc</code> 或用 <code class="px-1 bg-muted rounded">conda config --add channels</code>；brew 通过 <code class="px-1 bg-muted rounded">HOMEBREW_BOTTLE_DOMAIN</code> 等环境变量指定；cargo 写 <code class="px-1 bg-muted rounded">~/.cargo/config.toml</code> 的 source 段（sparse 索引协议）；go 一行 <code class="px-1 bg-muted rounded">go env -w GOPROXY=&lt;代理&gt;,direct</code> 即可。
          </p>

          <h3 class="text-lg font-semibold text-foreground">怎么还原官方源</h3>
          <p>
            选择「官方默认」即可生成还原命令：pip 用 <code class="px-1 bg-muted rounded">config unset</code>，npm/yarn 把 registry 改回官方地址，conda 用 <code class="px-1 bg-muted rounded">--remove-key channels</code>，brew unset 对应环境变量，cargo 删除 config.toml 中的 source 替换段，go 把 GOPROXY 改回 proxy.golang.org。换源与还原命令一一对应，随时可逆。
          </p>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">镜像地址会失效吗？</span>镜像站偶有路径调整，本工具的静态表按公开常用地址内置，执行前建议对照镜像站官方说明核对一次。</li>
            <li><span class="text-foreground font-medium">npm 换源后 lock 文件要改吗？</span>不需要。registry 换源只影响下载地址，package-lock.json / yarn.lock 中的 resolved 字段在安装时会按新 registry 解析。</li>
            <li><span class="text-foreground font-medium">为什么 go 源要以 ,direct 结尾？</span>,direct 表示镜像代理没有的模块会回落到版本库原地址直连，避免私有模块或新模块拉取失败。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'mirror-source-generator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Globe, Copy, Check, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '镜像源配置生成器 - pip/npm/conda/brew/cargo/go 一键换源',
  description: '在线镜像源配置生成器：内置清华 TUNA、阿里云、中科大、腾讯云镜像地址，一键生成 pip、npm、yarn、conda、brew、cargo、go 的换源命令与配置文件片段，附官方源还原命令，纯本地生成',
  keywords: '镜像源配置, pip镜像源, npm换源, conda镜像, brew镜像, cargo换源, goproxy, tuna镜像',
  author: 'Util工具箱',
  ogTitle: '镜像源配置生成器 - 有条工具',
  ogDescription: 'pip/npm/conda/brew/cargo/go 一键生成国内镜像源配置命令与文件片段',
  ogUrl: 'https://www.util.cn/tools/mirror-source-generator',
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
          name: '镜像源配置生成器',
          url: 'https://www.util.cn/tools/mirror-source-generator',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['pip/npm/yarn/conda/brew/cargo/go 七种换源', '清华/阿里云/中科大/腾讯云地址表', '官方源还原命令', '配置文件片段生成', '一键复制全部']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '镜像源配置生成器', item: 'https://www.util.cn/tools/mirror-source-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '镜像地址会失效吗？',
              acceptedAnswer: { '@type': 'Answer', text: '镜像站偶有路径调整，本工具按公开常用地址内置静态表，执行前建议对照镜像站官方说明核对一次。' }
            },
            {
              '@type': 'Question',
              name: 'npm 换源后需要改 lock 文件吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不需要。registry 换源只影响下载地址，安装时会按当前 registry 解析 package-lock.json 中的 resolved 字段。' }
            },
            {
              '@type': 'Question',
              name: 'GOPROXY 为什么要以 ,direct 结尾？',
              acceptedAnswer: { '@type': 'Answer', text: ',direct 表示镜像代理没有缓存的模块会回落到版本库原地址直连，避免私有模块或过新的模块拉取失败。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'mirror-source-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ===== [PURE-START] 镜像源静态表与生成纯函数（可独立提取测试） =====
const MANAGERS = [
  { value: 'pip', label: 'pip' },
  { value: 'npm', label: 'npm' },
  { value: 'yarn', label: 'yarn' },
  { value: 'conda', label: 'conda' },
  { value: 'brew', label: 'brew' },
  { value: 'cargo', label: 'cargo' },
  { value: 'go', label: 'go' }
]

// 各镜像站各包管理器的常用公开地址
const MIRROR_META = {
  tuna: {
    label: '清华 TUNA',
    urls: {
      pip: 'https://pypi.tuna.tsinghua.edu.cn/simple',
      npm: 'https://registry.npmmirror.com',
      yarn: 'https://registry.npmmirror.com',
      conda: 'https://mirrors.tuna.tsinghua.edu.cn/anaconda/',
      cargo: 'sparse+https://mirrors.tuna.tsinghua.edu.cn/crates.io-index/',
      go: 'https://goproxy.cn'
    },
    brew: {
      api: 'https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles/api',
      bottle: 'https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles',
      brewGit: 'https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git',
      coreGit: 'https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-core.git'
    }
  },
  ali: {
    label: '阿里云',
    urls: {
      pip: 'https://mirrors.aliyun.com/pypi/simple/',
      npm: 'https://registry.npmmirror.com',
      yarn: 'https://registry.npmmirror.com',
      conda: 'https://mirrors.aliyun.com/anaconda/',
      cargo: 'sparse+https://mirrors.aliyun.com/crates.io-index/',
      go: 'https://mirrors.aliyun.com/goproxy/'
    },
    brew: {
      api: 'https://mirrors.aliyun.com/homebrew-bottles/api',
      bottle: 'https://mirrors.aliyun.com/homebrew-bottles',
      brewGit: 'https://mirrors.aliyun.com/homebrew/brew.git',
      coreGit: 'https://mirrors.aliyun.com/homebrew/homebrew-core.git'
    }
  },
  ustc: {
    label: '中科大 USTC',
    urls: {
      pip: 'https://mirrors.ustc.edu.cn/pypi/simple',
      npm: 'https://mirrors.ustc.edu.cn/npm/',
      yarn: 'https://mirrors.ustc.edu.cn/npm/',
      conda: 'https://mirrors.ustc.edu.cn/anaconda/',
      cargo: 'sparse+https://mirrors.ustc.edu.cn/crates.io-index/',
      go: 'https://goproxy.io'
    },
    brew: {
      api: 'https://mirrors.ustc.edu.cn/homebrew-bottles/api',
      bottle: 'https://mirrors.ustc.edu.cn/homebrew-bottles',
      brewGit: 'https://mirrors.ustc.edu.cn/brew.git',
      coreGit: 'https://mirrors.ustc.edu.cn/homebrew-core.git'
    }
  },
  tencent: {
    label: '腾讯云',
    urls: {
      pip: 'https://mirrors.cloud.tencent.com/pypi/simple',
      npm: 'https://mirrors.cloud.tencent.com/npm/',
      yarn: 'https://mirrors.cloud.tencent.com/npm/',
      conda: 'https://mirrors.cloud.tencent.com/anaconda/',
      cargo: 'sparse+https://mirrors.cloud.tencent.com/crates.io-index/',
      go: 'https://mirrors.cloud.tencent.com/goproxy/'
    },
    brew: {
      api: 'https://mirrors.cloud.tencent.com/homebrew-bottles/api',
      bottle: 'https://mirrors.cloud.tencent.com/homebrew-bottles',
      brewGit: 'https://mirrors.cloud.tencent.com/homebrew/brew.git',
      coreGit: 'https://mirrors.cloud.tencent.com/homebrew/homebrew-core.git'
    }
  },
  official: {
    label: '官方默认（还原）',
    urls: {
      pip: 'https://pypi.org/simple',
      npm: 'https://registry.npmjs.org',
      yarn: 'https://registry.yarnpkg.com',
      conda: 'https://repo.anaconda.com/pkgs/',
      cargo: 'sparse+https://index.crates.io/',
      go: 'https://proxy.golang.org'
    },
    brew: null
  }
}

// 生成某镜像下某包管理器的换源配置片段
function buildSnippet(manager, mirrorId) {
  const mirror = MIRROR_META[mirrorId] || MIRROR_META.official
  const url = mirror.urls[manager]
  const isOfficial = mirrorId === 'official'

  if (manager === 'pip') {
    const lines = isOfficial
      ? [
        '# 还原官方 PyPI 源',
        'pip config unset global.index-url'
      ]
      : [
        '# 临时使用（单次安装）',
        `pip install -i ${url} 包名`,
        '',
        '# 写入默认配置（永久生效）',
        `pip config set global.index-url ${url}`,
        '',
        '# 还原: pip config unset global.index-url'
      ]
    return { title: 'pip（PyPI）', content: lines.join('\n') }
  }

  if (manager === 'npm') {
    const lines = isOfficial
      ? [
        '# 还原官方 npm registry',
        `npm config set registry ${url}`,
        'npm config get registry  # 验证'
      ]
      : [
        `npm config set registry ${url}`,
        'npm config get registry  # 验证',
        `# 还原: npm config set registry https://registry.npmjs.org`
      ]
    return { title: 'npm', content: lines.join('\n') }
  }

  if (manager === 'yarn') {
    const lines = isOfficial
      ? [
        '# 还原官方 yarn registry',
        `yarn config set registry ${url}`
      ]
      : [
        `yarn config set registry ${url}`,
        `# 还原: yarn config set registry https://registry.yarnpkg.com`
      ]
    return { title: 'yarn', content: lines.join('\n') }
  }

  if (manager === 'conda') {
    const lines = isOfficial
      ? [
        '# 还原 conda 默认源（移除自定义 channels）',
        'conda config --remove-key channels',
        'conda config --set show_channel_urls no'
      ]
      : [
        '# 写入 ~/.condarc 的等效命令',
        `conda config --add channels ${url}pkgs/main/`,
        `conda config --add channels ${url}pkgs/free/`,
        'conda config --set show_channel_urls yes',
        '',
        '# 或直接写入 ~/.condarc：',
        'channels:',
        `  - ${url}pkgs/main/`,
        `  - ${url}pkgs/free/`,
        '  - defaults',
        'show_channel_urls: true',
        '',
        '# 还原: conda config --remove-key channels'
      ]
    return { title: 'conda（.condarc）', content: lines.join('\n') }
  }

  if (manager === 'brew') {
    if (isOfficial || !mirror.brew) {
      const lines = [
        '# 还原 Homebrew 官方源（写入 ~/.zshrc 后 source 生效，或直接执行）',
        'unset HOMEBREW_API_DOMAIN HOMEBREW_BOTTLE_DOMAIN HOMEBREW_BREW_GIT_REMOTE HOMEBREW_CORE_GIT_REMOTE',
        'brew update'
      ]
      return { title: 'Homebrew（环境变量）', content: lines.join('\n') }
    }
    const b = mirror.brew
    const lines = [
      '# 追加到 ~/.zshrc 或 ~/.bashrc 后 source 生效',
      `export HOMEBREW_API_DOMAIN="${b.api}"`,
      `export HOMEBREW_BOTTLE_DOMAIN="${b.bottle}"`,
      `export HOMEBREW_BREW_GIT_REMOTE="${b.brewGit}"`,
      `export HOMEBREW_CORE_GIT_REMOTE="${b.coreGit}"`,
      '',
      '# 生效',
      'source ~/.zshrc && brew update',
      '',
      '# 还原: unset HOMEBREW_API_DOMAIN HOMEBREW_BOTTLE_DOMAIN HOMEBREW_BREW_GIT_REMOTE HOMEBREW_CORE_GIT_REMOTE'
    ]
    return { title: 'Homebrew（环境变量）', content: lines.join('\n') }
  }

  if (manager === 'cargo') {
    const lines = isOfficial
      ? [
        '# 还原 crates.io 官方源',
        '# 删除 ~/.cargo/config.toml 中的 [source.*] 替换段即可',
        `# 官方 sparse 索引: ${url}`
      ]
      : [
        '# 写入 ~/.cargo/config.toml（旧版本为 ~/.cargo/config）',
        '[source.crates-io]',
        `replace-with = '${mirrorId}'`,
        '',
        `[source.${mirrorId}]`,
        `registry = "${url}"`,
        '',
        '# 还原: 删除上述 [source.*] 段落'
      ]
    return { title: 'cargo（config.toml）', content: lines.join('\n') }
  }

  if (manager === 'go') {
    const lines = isOfficial
      ? [
        '# 还原 Go 官方代理',
        `go env -w GOPROXY=${url},direct`,
        'go env -w GOSUMDB=sum.golang.org'
      ]
      : [
        `go env -w GOPROXY=${url},direct`,
        'go env -w GONOSUMCHECK=*  # 可选：私有模块跳过校验',
        `# 还原: go env -w GOPROXY=https://proxy.golang.org,direct`
      ]
    return { title: 'go（GOPROXY）', content: lines.join('\n') }
  }

  return { title: manager, content: '' }
}
// ===== [PURE-END] =====

// ---------- 状态 ----------
const mirrorId = ref('tuna')
const selectedManagers = ref(['pip', 'npm'])
const copiedKey = ref('')
const copiedAll = ref(false)
const seoContentVisible = ref(true)

const toggleManager = (m) => {
  const idx = selectedManagers.value.indexOf(m)
  if (idx > -1) {
    selectedManagers.value.splice(idx, 1)
  } else {
    selectedManagers.value.push(m)
  }
}

const toggleAll = () => {
  if (selectedManagers.value.length === MANAGERS.length) {
    selectedManagers.value.splice(0, selectedManagers.value.length)
  } else {
    selectedManagers.value.splice(0, selectedManagers.value.length, ...MANAGERS.map(m => m.value))
  }
}

const outputs = computed(() => {
  return selectedManagers.value.map(m => ({
    manager: m,
    ...buildSnippet(m, mirrorId.value)
  }))
})

const allText = computed(() => {
  const mirror = MIRROR_META[mirrorId.value]
  const header = `# ${mirror.label} 镜像源配置\n# 生成于 Util 工具箱，执行前请以镜像站官方说明为准\n`
  return header + outputs.value.map(o => `\n# ===== ${o.title} =====\n${o.content}`).join('\n')
})

let copyTimer = null
let copyAllTimer = null
const copyText = async (text, key) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedKey.value = ''
    }, 1500)
  } catch (e) {
    // 剪贴板不可用时静默失败
  }
}

const copyAll = async () => {
  try {
    await navigator.clipboard.writeText(allText.value)
    copiedAll.value = true
    if (copyAllTimer) clearTimeout(copyAllTimer)
    copyAllTimer = setTimeout(() => {
      copiedAll.value = false
    }, 1500)
  } catch (e) {
    // 剪贴板不可用时静默失败
  }
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}
</script>
