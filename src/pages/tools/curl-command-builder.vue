<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Send class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">curl 命令构建器</h1>
          <p class="text-sm text-muted-foreground mt-1">可视化拼装 Method / URL / Header / Body / Query，一键生成 POSIX、Windows CMD、PowerShell 与 HTTPie 四种命令</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 curl 命令生成工具：在左侧表单里选择请求方法、填写 URL、增删请求头、切换 JSON / 表单 / multipart 请求体并追加 Query 参数，
        右侧实时生成可直接执行的 curl 命令，并自动处理 macOS/Linux 单引号、Windows CMD 双引号转义与 PowerShell 的 curl 别名陷阱；
        另附 HTTPie 等价命令。GET 默认省略 -X、HEAD 使用 -I、multipart 走 -F，全程纯本地构建，不发出任何网络请求。
      </p>
    </div>

    <!-- 静态说明条 -->
    <div class="mb-6 flex items-start gap-2 p-3 rounded-lg bg-muted/60 border border-border text-sm text-foreground">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p>本工具只生成命令文本，不发送任何请求；生成后复制到终端执行。</p>
    </div>

    <!-- 示例预填 -->
    <div class="mb-6 flex flex-wrap items-center gap-2">
      <span class="text-sm text-muted-foreground">示例预填：</span>
      <button
        v-for="ex in exampleList"
        :key="ex.id"
        @click="loadExample(ex.id)"
        class="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-sm text-foreground transition"
      >
        <Play class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-primary" />{{ ex.label }}
      </button>
      <button
        @click="resetForm"
        class="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-sm text-muted-foreground hover:text-foreground transition"
      >
        <RefreshCw class="w-3.5 h-3.5 inline mr-1 -mt-0.5" />清空重置
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：请求配置表单 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Send class="w-5 h-5 mr-2 text-primary" /> 请求配置
        </h2>

        <!-- Method + URL -->
        <div class="grid grid-cols-[110px_1fr] gap-2">
          <div>
            <label for="ccb-method" class="block text-sm font-medium text-foreground mb-1.5">方法</label>
            <select
              id="ccb-method"
              v-model="method"
              class="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option v-for="m in METHOD_OPTIONS" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
          <div>
            <label for="ccb-url" class="block text-sm font-medium text-foreground mb-1.5">请求 URL<span class="text-red-500">（必填）</span></label>
            <input
              id="ccb-url"
              v-model="url"
              type="text"
              placeholder="https://api.example.com/v1/orders"
              @blur="urlTouched = true"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
            >
            <p v-if="urlError" class="text-xs text-red-500 mt-1">{{ urlError }}</p>
          </div>
        </div>

        <!-- Headers 键值行 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground">请求 Headers</label>
            <button
              @click="addHeader"
              class="text-xs px-2 py-1 rounded border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition"
            >
              <Plus class="w-3 h-3 inline mr-0.5 -mt-0.5" />添加
            </button>
          </div>
          <div class="space-y-2">
            <div v-for="(h, i) in headers" :key="`h-${i}`" class="flex items-center gap-2">
              <input
                v-model="h.key"
                type="text"
                placeholder="Header 名称"
                class="w-2/5 min-w-0 px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
              >
              <input
                v-model="h.value"
                type="text"
                placeholder="值"
                class="flex-1 min-w-0 px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
              >
              <button
                @click="removeHeader(i)"
                class="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition flex-shrink-0"
                :aria-label="`删除第 ${i + 1} 个 Header`"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button
              v-for="q in QUICK_HEADERS"
              :key="q.label"
              @click="insertQuickHeader(q)"
              class="px-2 py-1 rounded bg-muted/70 hover:bg-muted border border-border text-[11px] font-mono text-muted-foreground hover:text-foreground transition"
              :title="`插入 ${q.key}: ${q.value}`"
            >
              {{ q.label }}
            </button>
          </div>
        </div>

        <!-- Body 模式 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">Body 类型</label>
          <div class="flex flex-wrap gap-x-4 gap-y-2">
            <label
              v-for="bm in bodyModeOptions"
              :key="bm.value"
              class="flex items-center gap-1.5 text-sm"
              :class="bm.disabled ? 'opacity-40 cursor-not-allowed text-muted-foreground' : 'cursor-pointer text-foreground'"
            >
              <input type="radio" name="ccb-body-mode" :value="bm.value" v-model="bodyMode" :disabled="bm.disabled" class="accent-primary">
              {{ bm.label }}
            </label>
          </div>

          <!-- raw JSON -->
          <div v-if="bodyMode === 'json'" class="mt-3">
            <textarea
              v-model="jsonBody"
              rows="6"
              placeholder='{"name":"示例字段","count":2}'
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
            ></textarea>
            <p v-if="jsonError" class="text-xs text-amber-600 flex items-start gap-1.5 mt-1.5">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ jsonError }}</span>
            </p>
            <p v-else class="text-xs text-muted-foreground mt-1.5">JSON 已通过格式校验；单双引号转义由生成器自动处理。</p>
          </div>

          <!-- form / multipart 键值行 -->
          <div v-if="bodyMode === 'form' || bodyMode === 'multipart'" class="mt-3 space-y-2">
            <div v-for="(p, i) in bodyPairs" :key="`p-${i}`" class="flex items-center gap-2">
              <input
                v-model="p.key"
                type="text"
                placeholder="字段名"
                class="w-2/5 min-w-0 px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
              >
              <input
                v-model="p.value"
                type="text"
                :placeholder="bodyMode === 'multipart' ? '值；文件路径以 @ 开头，如 @/path/a.pdf' : '值（&、空格、中文自动编码）'"
                class="flex-1 min-w-0 px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
              >
              <button
                @click="removeBodyPair(i)"
                class="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition flex-shrink-0"
                :aria-label="`删除第 ${i + 1} 个字段`"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              @click="addBodyPair"
              class="text-xs px-2 py-1 rounded border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition"
            >
              <Plus class="w-3 h-3 inline mr-0.5 -mt-0.5" />添加字段
            </button>
            <p v-if="bodyMode === 'multipart' && hasContentTypeHeader" class="text-xs text-amber-600 flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>使用 -F 时 curl 会自动设置 multipart/form-data 及边界，建议删除上方手动的 Content-Type 行。</span>
            </p>
          </div>
        </div>

        <!-- Query 参数 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground">Query 参数<span class="text-xs text-muted-foreground ml-1">（自动拼到 URL ? 后）</span></label>
            <button
              @click="addQueryPair"
              class="text-xs px-2 py-1 rounded border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition"
            >
              <Plus class="w-3 h-3 inline mr-0.5 -mt-0.5" />添加
            </button>
          </div>
          <div class="space-y-2">
            <div v-for="(p, i) in queryPairs" :key="`q-${i}`" class="flex items-center gap-2">
              <input
                v-model="p.key"
                type="text"
                placeholder="参数名"
                class="w-2/5 min-w-0 px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
              >
              <input
                v-model="p.value"
                type="text"
                placeholder="值"
                class="flex-1 min-w-0 px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
              >
              <button
                @click="removeQueryPair(i)"
                class="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition flex-shrink-0"
                :aria-label="`删除第 ${i + 1} 个 Query 参数`"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- curl 选项 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">curl 选项</label>
          <div class="space-y-1.5">
            <label class="flex items-center gap-2 text-sm cursor-pointer text-foreground">
              <input type="checkbox" v-model="optFollow" class="accent-primary">
              <code class="text-xs bg-muted/70 px-1.5 py-0.5 rounded">-L</code> 跟随重定向
            </label>
            <label class="flex items-center gap-2 text-sm cursor-pointer text-foreground">
              <input type="checkbox" v-model="optInsecure" class="accent-primary">
              <code class="text-xs bg-muted/70 px-1.5 py-0.5 rounded">-k</code> 跳过证书验证
              <span class="text-xs text-muted-foreground">（仅调试用）</span>
            </label>
            <label class="flex items-center gap-2 text-sm cursor-pointer text-foreground">
              <input type="checkbox" v-model="optInclude" class="accent-primary">
              <code class="text-xs bg-muted/70 px-1.5 py-0.5 rounded">-i</code> 显示响应头
            </label>
            <label class="flex items-center gap-2 text-sm cursor-pointer text-foreground">
              <input type="checkbox" v-model="optSilent" class="accent-primary">
              <code class="text-xs bg-muted/70 px-1.5 py-0.5 rounded">-s</code> 静默模式（不输出进度条）
            </label>
            <label class="flex items-center gap-2 text-sm cursor-pointer text-foreground">
              <input type="checkbox" v-model="optCompressed" class="accent-primary">
              <code class="text-xs bg-muted/70 px-1.5 py-0.5 rounded">--compressed</code> 请求压缩并自动解压
            </label>
          </div>
        </div>
      </div>

      <!-- 右：命令输出 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Play class="w-5 h-5 mr-2 text-primary" /> 生成的命令
          </h2>
          <div class="flex items-center gap-2">
            <button
              @click="copyCurrent"
              class="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
              :disabled="!currentCommand"
            >
              <CheckCircle v-if="copiedWhich === 'current'" class="w-4 h-4 inline mr-1 -mt-0.5" />
              <Copy v-else class="w-4 h-4 inline mr-1 -mt-0.5" />
              {{ copiedWhich === 'current' ? '已复制' : '复制当前命令' }}
            </button>
            <button
              @click="copyAll"
              class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-sm font-medium text-foreground transition disabled:opacity-40"
              :disabled="!allCommandsText"
            >
              <CheckCircle v-if="copiedWhich === 'all'" class="w-4 h-4 inline mr-1 -mt-0.5" />
              <Copy v-else class="w-4 h-4 inline mr-1 -mt-0.5" />
              {{ copiedWhich === 'all' ? '已复制' : '复制全部' }}
            </button>
          </div>
        </div>

        <!-- 平台 tab -->
        <div class="flex flex-wrap gap-1 border-b border-border">
          <button
            v-for="t in PLATFORM_TABS"
            :key="t.id"
            @click="activeTab = t.id"
            class="px-3 py-2 text-sm transition border-b-2 -mb-px"
            :class="activeTab === t.id ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'"
          >
            {{ t.label }}
          </button>
        </div>

        <pre
          v-if="currentCommand"
          class="bg-muted/50 border border-border rounded-lg p-4 text-sm font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all leading-relaxed"
        >{{ currentCommand }}</pre>
        <div v-else class="bg-muted/30 border border-dashed border-border rounded-lg p-10 text-center">
          <Send class="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p class="text-sm text-muted-foreground">在左侧填写 URL（必填）后，命令会在这里实时生成</p>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          POSIX 版适用于 macOS / Linux / Git Bash / WSL，单引号包裹、反斜杠续行；Windows CMD 版用 ^ 续行、双引号包裹并把内部 " 写成 \"；
          PowerShell 版必须用 curl.exe（避免命中 Invoke-WebRequest 别名）并用单引号字面量；HTTPie 为等价语义，需另行安装 httpie。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>curl 命令构建器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          curl 命令构建器是一款纯前端的 HTTP 请求命令生成工具。你在表单里选择请求方法（GET / POST / PUT / PATCH / DELETE / HEAD / OPTIONS）、
          填写 URL、增删 Header 键值行、选择 JSON / 表单 / multipart 请求体并追加 Query 参数后，页面实时生成对应平台的完整命令文本：
          POSIX 版（macOS / Linux / Git Bash）、Windows CMD 版、PowerShell 版（curl.exe）以及 HTTPie 等价命令。
          生成过程只做字符串拼装与转义，不会向任何服务器发送请求。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">curl 常用参数速查</h3>
        <div class="overflow-x-auto mb-2">
          <table class="w-full text-sm border border-border rounded-lg">
            <thead>
              <tr class="bg-muted/60 text-left">
                <th class="px-3 py-2 font-medium text-foreground border-b border-border">参数</th>
                <th class="px-3 py-2 font-medium text-foreground border-b border-border">作用</th>
                <th class="px-3 py-2 font-medium text-foreground border-b border-border">示例</th>
              </tr>
            </thead>
            <tbody class="text-muted-foreground">
              <tr><td class="px-3 py-2 border-b border-border font-mono text-foreground">-X</td><td class="px-3 py-2 border-b border-border">指定请求方法，GET 是默认值可省略</td><td class="px-3 py-2 border-b border-border font-mono">-X POST</td></tr>
              <tr><td class="px-3 py-2 border-b border-border font-mono text-foreground">-H</td><td class="px-3 py-2 border-b border-border">添加请求头，可重复多次</td><td class="px-3 py-2 border-b border-border font-mono">-H 'Content-Type: application/json'</td></tr>
              <tr><td class="px-3 py-2 border-b border-border font-mono text-foreground">-d</td><td class="px-3 py-2 border-b border-border">发送请求体，同时自动把请求切为 POST</td><td class="px-3 py-2 border-b border-border font-mono">-d '{"name":"a"}'</td></tr>
              <tr><td class="px-3 py-2 border-b border-border font-mono text-foreground">-F</td><td class="px-3 py-2 border-b border-border">发送 multipart/form-data，值前加 @ 表示上传文件</td><td class="px-3 py-2 border-b border-border font-mono">-F 'file=@/path/a.pdf'</td></tr>
              <tr><td class="px-3 py-2 border-b border-border font-mono text-foreground">-L</td><td class="px-3 py-2 border-b border-border">跟随 3xx 重定向继续请求</td><td class="px-3 py-2 border-b border-border font-mono">curl -L https://a.com</td></tr>
              <tr><td class="px-3 py-2 border-b border-border font-mono text-foreground">-k</td><td class="px-3 py-2 border-b border-border">跳过 HTTPS 证书校验，仅限本地调试</td><td class="px-3 py-2 border-b border-border font-mono">curl -k https://self-signed.dev</td></tr>
              <tr><td class="px-3 py-2 border-b border-border font-mono text-foreground">-i</td><td class="px-3 py-2 border-b border-border">在输出中包含响应头</td><td class="px-3 py-2 border-b border-border font-mono">curl -i https://a.com</td></tr>
              <tr><td class="px-3 py-2 border-b border-border font-mono text-foreground">-s</td><td class="px-3 py-2 border-b border-border">静默模式，不显示进度条与错误信息</td><td class="px-3 py-2 border-b border-border font-mono">curl -s https://a.com</td></tr>
              <tr><td class="px-3 py-2 font-mono text-foreground">--compressed</td><td class="px-3 py-2">请求压缩传输并自动解压响应</td><td class="px-3 py-2 font-mono">curl --compressed https://a.com</td></tr>
            </tbody>
          </table>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Windows 下 curl 的引号坑</h3>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          POSIX shell 里单引号是「字面量」，内部无需转义；而 Windows CMD 不把单引号当作字符串定界符，整条命令的字符串参数必须用双引号包裹，
          JSON 里的每一个双引号都要改写成 \" 才能原样传给 curl（curl.exe 按 C 运行时规则解析 \" 为字面双引号）。
          另外还有四个高频坑：① .bat 批处理文件里 % 必须写成 %%，交互式 CMD 则不用；② 参数以反斜杠结尾时（如 "C:\dir\"）反斜杠会把收尾引号转义掉，
          路径结尾建议补一个 \ 或改用正斜杠；③ CMD 的续行符是 ^，且 ^ 之后不能有空格；④ JSON 值里本身带 \"（反斜杠+引号）时，按 CRT 规则反斜杠需双写成 \\\"，
          此类复杂转义建议直接改用 PowerShell 版（单引号字面量零转义）或 Git Bash。拿不准时可直接复制本页生成的 Windows CMD 版本。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">cmd 与 PowerShell 的区别</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground mb-4">
          <li>续行符不同：cmd 用 ^，PowerShell 用反引号 `（且必须是行尾最后一个字符）。</li>
          <li>引号规则不同：cmd 内部双引号写成 \"；PowerShell 的单引号字符串是字面量，内部单引号写成两个单引号 ''，双引号则原样保留。</li>
          <li>curl 别名陷阱：PowerShell 5.x 里 curl 是 Invoke-WebRequest 的别名，参数体系完全不同，必须显式写 curl.exe 才会调用系统自带的真 curl；PowerShell 7+ 才默认解析为 curl.exe。</li>
          <li>默认环境：Windows 10 1803 之后的系统自带 curl.exe，老版本需要自行安装或改用 Git Bash / WSL。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">POST JSON 完整示例讲解</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          以本页「POST JSON 带 Bearer」示例生成的 POSIX 命令为例：
        </p>
        <pre class="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono text-foreground overflow-x-auto mb-2 leading-relaxed">curl 'https://api.example.com/v1/orders?dry_run=true' \
  -X POST \
  -H 'Authorization: Bearer sk-live-xxx' \
  -H 'Content-Type: application/json' \
  -d '{"name":"测试订单","note":"备注含 \"引号\" 与中文"}' \
  -i</pre>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground mb-4">
          <li>第一行：目标 URL；Query 参数已拼接到 ? 后，整个 URL 用单引号包裹，避免 &amp;、? 被 shell 误解。</li>
          <li>-X POST：显式声明方法（GET 时惯例省略，HEAD 时应改用 -I 而不是 -X HEAD，否则部分服务器会挂起）。</li>
          <li>-H Authorization：携带 Bearer Token；-H Content-Type: application/json 告诉服务器请求体是 JSON。</li>
          <li>-d：请求体原文放在单引号里，JSON 内部的 " 无需额外处理；若不用单引号，就得逐个写成 \"。</li>
          <li>-i：把响应头一并打印出来，调试时便于确认状态码与 Content-Type。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么本地构建而不是在线发送？</h3>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          调试请求里经常出现 Authorization Token、Cookie、API Key、内网地址这类敏感信息。市面上不少「在线发请求」工具会把你的 Header 原文提交到第三方服务器中转，
          等于把凭证拱手交出去。本页面是纯静态前端：所有拼装、转义、校验都在你的浏览器内存里完成，不产生任何网络请求，也不写除本地偏好之外的存储；
          生成的命令复制到你自己的终端执行，Token 与内网 URL 从始至终不经过任何第三方。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">生成的命令在哪里执行？</h3>
            <p class="text-sm text-muted-foreground mt-1">按平台复制对应版本：POSIX 版粘贴到 macOS 终端 / iTerm2 / Linux Shell / Git Bash / WSL；Windows CMD 版粘贴到 cmd.exe；PowerShell 版粘贴到 PowerShell 窗口；HTTPie 版需先安装 httpie（pip install httpie 或 brew install httpie）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">Windows 上执行报错怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">最常见原因是复制错了版本：把 POSIX 版（单引号）粘进了 CMD 或 PowerShell。请切换到对应平台 Tab 再复制；PowerShell 里还必须用 curl.exe 开头，写 curl 会命中 Invoke-WebRequest 别名而报参数错误。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">multipart 文件路径怎么填？</h3>
            <p class="text-sm text-muted-foreground mt-1">在字段值前加 @ 表示上传文件，例如 @/Users/me/report.pdf 或 @./a.png（相对当前终端目录）；Windows 路径建议写成正斜杠 @C:/dir/a.pdf，避免收尾反斜杠与引号转义冲突。不带 @ 的字段按普通文本上传。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">我填的 Token 会被上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。本工具纯本地运行，生成命令的过程不发任何网络请求，配置仅保存在你浏览器的 localStorage 中，清除浏览器数据即可彻底删除。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'curl-command-builder'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Send, Copy, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, Plus, X
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'curl 命令构建器 - 在线生成 curl/HTTPie 命令（POST JSON/Header/-F 上传）',
  description: '免费在线 curl 命令生成器：可视化配置请求方法、URL、Query 参数、Header 与 JSON/表单/multipart 请求体，一键生成 macOS/Linux、Windows CMD、PowerShell 与 HTTPie 四种平台命令，自动处理单双引号转义与续行符，纯本地构建不发送请求，敏感 Token 不经过第三方。',
  keywords: 'curl 命令生成,curl 在线构建,POST 请求测试,http 请求调试,curl -H -d',
  author: '有条工具',
  ogTitle: 'curl 命令构建器 - 在线生成 curl/HTTPie 命令 | 有条工具',
  ogDescription: '可视化拼装 Method/URL/Header/Body/Query，一键生成 POSIX、Windows CMD、PowerShell 与 HTTPie 四种 curl 命令。',
  ogUrl: 'https://www.util.cn/tools/curl-command-builder',
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
          name: 'curl 命令构建器',
          url: 'https://www.util.cn/tools/curl-command-builder',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['可视化配置 Method/URL/Header/Body/Query', '一键生成 POSIX/Windows CMD/PowerShell/HTTPie 命令', '跨平台单双引号转义自动处理', 'JSON 请求体格式校验', 'multipart 文件上传 -F 语法', '常用 Header 快捷插入', '本地构建不发送任何请求']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'curl 命令构建器', item: 'https://www.util.cn/tools/curl-command-builder/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '生成的 curl 命令在哪里执行？',
              acceptedAnswer: { '@type': 'Answer', text: '按平台复制对应版本：POSIX 版粘贴到 macOS 终端、Linux Shell、Git Bash 或 WSL；Windows CMD 版粘贴到 cmd.exe；PowerShell 版粘贴到 PowerShell 窗口且必须以 curl.exe 开头；HTTPie 版需先安装 httpie。' }
            },
            {
              '@type': 'Question',
              name: 'Windows 上执行生成的命令报错怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '最常见原因是版本粘错：POSIX 版使用单引号，CMD 无法识别。请切换到 Windows CMD 或 PowerShell Tab 再复制；PowerShell 中必须写 curl.exe，写 curl 会命中 Invoke-WebRequest 别名导致参数错误。' }
            },
            {
              '@type': 'Question',
              name: 'multipart 上传的文件路径怎么填？',
              acceptedAnswer: { '@type': 'Answer', text: '字段值前加 @ 表示上传文件，如 @/Users/me/report.pdf 或 @./a.png；Windows 路径建议写成正斜杠 @C:/dir/a.pdf，避免结尾反斜杠与引号转义冲突。不带 @ 的字段按普通文本表单字段上传。' }
            },
            {
              '@type': 'Question',
              name: '在页面里填写的 Token 会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。本工具纯本地运行，命令生成过程不发任何网络请求，配置仅保存在浏览器 localStorage 中，清除浏览器数据即可彻底删除，敏感 Header 全程不经过第三方服务器。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 说明：本分区所有函数不依赖任何响应式状态与浏览器 API，可整体抽出做单元测试。

// POSIX shell 单引号规则：单引号字符串内部不存在任何转义序列，
// 唯一安全的写法是「结束当前单引号 + 插入转义的单引号 \' + 重新开始单引号」，即 '\''
// 例：O'Brien → 'O'\''Brien'
function shellQuoteOf(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`
}

// Windows CMD 引号规则：cmd 自身不解析反斜杠转义，但 curl.exe 按 C 运行时（CRT）规则解析参数，
// \" 表示字面双引号，因此内部每个 " 写成 \"（本生成器采用该直译口径）。
// 已知坑（复杂场景建议改用 PowerShell / Git Bash 版本，详见 SEO 说明）：
// ① .bat 批处理里 % 需写成 %%；② 收尾反斜杠会转义掉收尾引号；
// ③ JSON 值内嵌 \"（反斜杠+引号）时，CRT 规则要求反斜杠双写为 \\\"，手工拼命令时极易出错。
function cmdQuoteOf(s) {
  return `"${String(s).replace(/"/g, '\\"')}"`
}

// PowerShell 单引号字符串是字面量（不解析 $var 与反引号），内部单引号写成两个单引号 ''
// 例：O'Brien → 'O''Brien'；双引号在单引号内原样保留
function psQuoteOf(s) {
  return `'${String(s).replace(/'/g, "''")}'`
}

// 按平台选择引号策略：posix | windows | powershell
function quoteFor(platform, s) {
  if (platform === 'windows') return cmdQuoteOf(s)
  if (platform === 'powershell') return psQuoteOf(s)
  return shellQuoteOf(s)
}

// 拼接 Query 参数：
// - params 为空时原样返回 url
// - url 已含 "?" 时用 "&" 续接，否则补 "?"
// - 键与值分别 encodeURIComponent（空格→%20、&→%26、中文→%XX）
// - 键为空的行直接忽略；URL 尾斜杠原样保留（query 追加在斜杠之后）
function appendQueryOf(url, params) {
  const rows = (Array.isArray(params) ? params : []).filter((p) => p && String(p.key || '').trim() !== '')
  if (!rows.length) return url
  const qs = rows.map((p) => `${encodeURIComponent(String(p.key).trim())}=${encodeURIComponent(String(p.value == null ? '' : p.value))}`).join('&')
  return url + (url.includes('?') ? '&' : '?') + qs
}

// 生成 curl 参数段列表：每段渲染为命令的一行
// token 形如 { raw: '-L' }（不加引号）或 { v: '...' }（按平台引号策略包裹）
function curlSegmentsOf(input) {
  const fullUrl = appendQueryOf(input.url, input.queryPairs)
  const segments = [[{ v: fullUrl }]]

  // 方法口径：GET 是 curl 默认方法，省略 -X；HEAD 用 -I 而不是 -X HEAD
  //（-X HEAD 会让 curl 等一个不会到来的响应体，部分服务器表现为挂起）
  if (input.method === 'HEAD') {
    segments.push([{ raw: '-I' }])
  } else if (input.method !== 'GET') {
    segments.push([{ raw: '-X' }, { raw: input.method }])
  }

  for (const h of input.headers || []) {
    const k = String(h.key || '').trim()
    if (!k) continue
    const v = String(h.value || '').trim()
    segments.push([{ raw: '-H' }, { v: v ? `${k}: ${v}` : `${k}:` }])
  }

  const hasBody = input.method !== 'GET' && input.method !== 'HEAD'
  if (hasBody) {
    if (input.bodyMode === 'json') {
      const raw = String(input.jsonBody || '').trim()
      // 口径：JSON 原文直接作为 -d 请求体，所见即所得；转义交给各平台引号策略
      if (raw) segments.push([{ raw: '-d' }, { v: raw }])
    } else if (input.bodyMode === 'form') {
      // 口径：选 --data-urlencode（每个键值一行）而不是 -d 'a=1&b=2'：
      // 值中的 &、=、空格、中文由 curl 自行做 URL 编码，避免手工拼接时 & 被误当字段分隔符；
      // 且 curl 使用 -d/--data-urlencode 时会自动附上 Content-Type: application/x-www-form-urlencoded
      for (const p of input.bodyPairs || []) {
        const k = String(p.key || '').trim()
        if (!k) continue
        segments.push([{ raw: '--data-urlencode' }, { v: `${k}=${String(p.value == null ? '' : p.value)}` }])
      }
    } else if (input.bodyMode === 'multipart') {
      // 口径：-F 语法；值以 @ 开头表示文件路径（curl -F 的 file=@path 语义），
      // -F 会自动设置 multipart/form-data 与随机边界，无需也不应手动指定 Content-Type
      for (const p of input.bodyPairs || []) {
        const k = String(p.key || '').trim()
        if (!k) continue
        segments.push([{ raw: '-F' }, { v: `${k}=${String(p.value == null ? '' : p.value)}` }])
      }
    }
  }

  const flagList = []
  if (input.opts && input.opts.follow) flagList.push({ raw: '-L' })
  if (input.opts && input.opts.insecure) flagList.push({ raw: '-k' })
  if (input.opts && input.opts.include) flagList.push({ raw: '-i' })
  if (input.opts && input.opts.silent) flagList.push({ raw: '-s' })
  if (input.opts && input.opts.compressed) flagList.push({ raw: '--compressed' })
  if (flagList.length) segments.push(flagList)
  return segments
}

// 按 platform 渲染完整 curl 命令：posix（\ 续行）/ windows（^ 续行）/ powershell（` 续行）
function buildCurl(input, platform) {
  if (!input || !String(input.url || '').trim()) return ''
  const bin = platform === 'powershell' ? 'curl.exe' : 'curl'
  const cont = platform === 'windows' ? '^' : platform === 'powershell' ? '`' : '\\'
  const lines = curlSegmentsOf(input).map((seg) =>
    seg.map((tk) => (tk.raw !== undefined ? tk.raw : quoteFor(platform, tk.v))).join(' ')
  )
  lines[0] = `${bin} ${lines[0]}`
  return lines.map((l, i) => (i < lines.length - 1 ? `${l} ${cont}` : l)).join('\n  ')
}

// 生成 HTTPie 等价命令（POSIX 单引号风格）：
// header → 'Name:value'；JSON 对象键 → key:=JSON 值（保留类型）；无法拆键时回退 --raw；
// form → --form key=value；multipart → --multipart key=value / key@文件路径
// 说明：httpie 默认打印响应头并自动处理压缩，故 curl 的 -i / --compressed 无需映射
function buildHttpieOf(input) {
  if (!input || !String(input.url || '').trim()) return ''
  const fullUrl = appendQueryOf(input.url, input.queryPairs)
  const segments = []

  const flags = []
  if (input.opts && input.opts.follow) flags.push('--follow')
  if (input.opts && input.opts.insecure) flags.push('--verify=no')
  if (input.opts && input.opts.silent) flags.push('--quiet')
  if (flags.length) segments.push(flags.map((f) => ({ raw: f })))

  segments.push([{ raw: input.method }, { v: fullUrl }])

  for (const h of input.headers || []) {
    const k = String(h.key || '').trim()
    if (!k) continue
    const v = String(h.value || '').trim()
    segments.push([{ v: v ? `${k}:${v}` : `${k}:` }])
  }

  const hasBody = input.method !== 'GET' && input.method !== 'HEAD'
  if (hasBody) {
    if (input.bodyMode === 'json') {
      const raw = String(input.jsonBody || '').trim()
      let obj
      try {
        obj = JSON.parse(raw)
      } catch (e) {
        obj = undefined
      }
      if (obj !== undefined && obj !== null && !Array.isArray(obj) && typeof obj === 'object') {
        const entries = Object.entries(obj)
        if (entries.length) {
          for (const [k, val] of entries) segments.push([{ v: `${k}:=${JSON.stringify(val)}` }])
        } else {
          segments.push([{ raw: '--raw' }, { v: raw }])
        }
      } else if (raw) {
        segments.push([{ raw: '--raw' }, { v: raw }])
      }
    } else if (input.bodyMode === 'form') {
      segments.push([{ raw: '--form' }])
      for (const p of input.bodyPairs || []) {
        const k = String(p.key || '').trim()
        if (!k) continue
        segments.push([{ v: `${k}=${String(p.value == null ? '' : p.value)}` }])
      }
    } else if (input.bodyMode === 'multipart') {
      segments.push([{ raw: '--multipart' }])
      for (const p of input.bodyPairs || []) {
        const k = String(p.key || '').trim()
        if (!k) continue
        const v = String(p.value == null ? '' : p.value)
        segments.push([{ v: v.startsWith('@') ? `${k}@${v.slice(1)}` : `${k}=${v}` }])
      }
    }
  }

  const lines = segments.map((seg) =>
    seg.map((tk) => (tk.raw !== undefined ? tk.raw : shellQuoteOf(tk.v))).join(' ')
  )
  lines[0] = `http ${lines[0]}`
  return lines.map((l, i) => (i < lines.length - 1 ? `${l} \\` : l)).join('\n  ')
}

// ---------- 常量定义 ----------
const METHOD_OPTIONS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

const PLATFORM_TABS = [
  { id: 'posix', label: 'POSIX' },
  { id: 'windows', label: 'Windows CMD' },
  { id: 'powershell', label: 'PowerShell' },
  { id: 'httpie', label: 'HTTPie' }
]

// 常用 Header 快捷插入
const QUICK_HEADERS = [
  { label: 'Authorization Bearer', key: 'Authorization', value: 'Bearer your-token-here' },
  { label: 'Content-Type JSON', key: 'Content-Type', value: 'application/json' },
  { label: 'Content-Type 表单', key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
  { label: 'X-Requested-With', key: 'X-Requested-With', value: 'XMLHttpRequest' }
]

// 初始（空）状态：默认预填一行 Content-Type: application/json
const EMPTY_STATE = {
  method: 'GET',
  url: '',
  headers: [{ key: 'Content-Type', value: 'application/json' }],
  bodyMode: 'none',
  jsonBody: '',
  bodyPairs: [],
  queryPairs: [],
  opts: { follow: false, insecure: false, include: false, silent: false, compressed: false }
}

// 三个示例场景
const EXAMPLES = {
  get: {
    label: 'GET 带 query',
    state: {
      method: 'GET',
      url: 'https://api.github.com/search/repositories',
      headers: [{ key: 'Accept', value: 'application/vnd.github+json' }],
      bodyMode: 'none',
      jsonBody: '',
      bodyPairs: [],
      queryPairs: [{ key: 'q', value: 'curl builder' }, { key: 'per_page', value: '5' }],
      opts: { follow: true, insecure: false, include: false, silent: false, compressed: true }
    }
  },
  postJson: {
    label: 'POST JSON 带 Bearer',
    state: {
      method: 'POST',
      url: 'https://api.example.com/v1/orders',
      headers: [
        { key: 'Authorization', value: 'Bearer sk-live-4f9a-demo' },
        { key: 'Content-Type', value: 'application/json' }
      ],
      bodyMode: 'json',
      jsonBody: '{\n  "name": "测试订单",\n  "quantity": 2,\n  "tags": ["vip", "urgent"],\n  "note": "备注含 \\"引号\\" 与中文"\n}',
      bodyPairs: [],
      queryPairs: [{ key: 'dry_run', value: 'true' }],
      opts: { follow: false, insecure: false, include: true, silent: false, compressed: false }
    }
  },
  multipart: {
    label: 'POST multipart 文件上传',
    state: {
      method: 'POST',
      url: 'https://upload.example.com/api/v1/files',
      headers: [],
      bodyMode: 'multipart',
      jsonBody: '',
      bodyPairs: [{ key: 'file', value: '@/Users/me/Downloads/report.pdf' }, { key: 'scene', value: 'avatar' }],
      queryPairs: [],
      opts: { follow: false, insecure: false, include: false, silent: false, compressed: false }
    }
  }
}
const exampleList = Object.entries(EXAMPLES).map(([id, ex]) => ({ id, label: ex.label }))

// ---------- 表单状态（响应式） ----------
const method = ref(EMPTY_STATE.method)
const url = ref(EMPTY_STATE.url)
const headers = ref(EMPTY_STATE.headers.map((h) => ({ ...h })))
const bodyMode = ref(EMPTY_STATE.bodyMode)
const jsonBody = ref(EMPTY_STATE.jsonBody)
const bodyPairs = ref([])
const queryPairs = ref([])
const optFollow = ref(EMPTY_STATE.opts.follow)
const optInsecure = ref(EMPTY_STATE.opts.insecure)
const optInclude = ref(EMPTY_STATE.opts.include)
const optSilent = ref(EMPTY_STATE.opts.silent)
const optCompressed = ref(EMPTY_STATE.opts.compressed)

const activeTab = ref('posix')
const copiedWhich = ref('') // 'current' | 'all' | ''
const seoContentVisible = ref(true)
const urlTouched = ref(false)

// GET / HEAD 不允许携带请求体，联动回「无」
watch(method, (m) => {
  if ((m === 'GET' || m === 'HEAD') && bodyMode.value !== 'none') {
    bodyMode.value = 'none'
  }
})

const bodyModeOptions = computed(() => {
  const noBody = method.value === 'GET' || method.value === 'HEAD'
  return [
    { value: 'none', label: '无', disabled: false },
    { value: 'json', label: 'raw JSON', disabled: noBody },
    { value: 'form', label: 'form-urlencoded', disabled: noBody },
    { value: 'multipart', label: 'multipart 文件', disabled: noBody }
  ]
})

// ---------- 校验提示 ----------
const urlError = computed(() => {
  const u = url.value.trim()
  if (!u) return urlTouched.value ? '请求 URL 为必填项' : ''
  if (!/^https?:\/\/\S+$/i.test(u)) return 'URL 需以 http:// 或 https:// 开头，且不含空格'
  return ''
})

// JSON 非法时黄字提示，但不阻断生成（仍按原文输出命令）
const jsonError = computed(() => {
  if (bodyMode.value !== 'json') return ''
  const raw = jsonBody.value.trim()
  if (!raw) return ''
  try {
    JSON.parse(raw)
    return ''
  } catch (e) {
    return `JSON 解析失败：${e.message}（仍会按原文生成命令，请自行确认服务器能否接受）`
  }
})

const hasContentTypeHeader = computed(() =>
  headers.value.some((h) => String(h.key || '').trim().toLowerCase() === 'content-type')
)

// ---------- 纯函数入参组装 ----------
const formInput = computed(() => ({
  method: method.value,
  url: url.value.trim(),
  headers: headers.value.map((h) => ({ key: h.key, value: h.value })),
  bodyMode: bodyMode.value,
  jsonBody: jsonBody.value,
  bodyPairs: bodyPairs.value.map((p) => ({ key: p.key, value: p.value })),
  queryPairs: queryPairs.value.map((p) => ({ key: p.key, value: p.value })),
  opts: {
    follow: optFollow.value,
    insecure: optInsecure.value,
    include: optInclude.value,
    silent: optSilent.value,
    compressed: optCompressed.value
  }
}))

const curlCmd = computed(() => ({
  posix: buildCurl(formInput.value, 'posix'),
  windows: buildCurl(formInput.value, 'windows'),
  powershell: buildCurl(formInput.value, 'powershell')
}))
const httpieCmd = computed(() => buildHttpieOf(formInput.value))

const currentCommand = computed(() => {
  if (activeTab.value === 'httpie') return httpieCmd.value
  return curlCmd.value[activeTab.value] || ''
})

const allCommandsText = computed(() => {
  const parts = []
  if (curlCmd.value.posix) parts.push(`# POSIX / macOS / Linux\n${curlCmd.value.posix}`)
  if (curlCmd.value.windows) parts.push(`# Windows CMD\n${curlCmd.value.windows}`)
  if (curlCmd.value.powershell) parts.push(`# PowerShell\n${curlCmd.value.powershell}`)
  if (httpieCmd.value) parts.push(`# HTTPie\n${httpieCmd.value}`)
  return parts.join('\n\n')
})

// ---------- 行编辑 ----------
function addHeader() {
  headers.value.push({ key: '', value: '' })
}
function removeHeader(i) {
  headers.value.splice(i, 1)
}
function insertQuickHeader(q) {
  // 同名 Header（忽略大小写）已存在时替换其值，避免重复行
  const existed = headers.value.find((h) => String(h.key || '').trim().toLowerCase() === q.key.toLowerCase())
  if (existed) {
    existed.value = q.value
  } else {
    headers.value.push({ key: q.key, value: q.value })
  }
}
function addBodyPair() {
  bodyPairs.value.push({ key: '', value: '' })
}
function removeBodyPair(i) {
  bodyPairs.value.splice(i, 1)
}
function addQueryPair() {
  queryPairs.value.push({ key: '', value: '' })
}
function removeQueryPair(i) {
  queryPairs.value.splice(i, 1)
}

// ---------- 状态应用 / 持久化 ----------
const STORAGE_KEY = 'curl-command-builder:state'

function snapshotOf() {
  return {
    method: method.value,
    url: url.value,
    headers: headers.value.map((h) => ({ key: h.key, value: h.value })),
    bodyMode: bodyMode.value,
    jsonBody: jsonBody.value,
    bodyPairs: bodyPairs.value.map((p) => ({ key: p.key, value: p.value })),
    queryPairs: queryPairs.value.map((p) => ({ key: p.key, value: p.value })),
    opts: {
      follow: optFollow.value,
      insecure: optInsecure.value,
      include: optInclude.value,
      silent: optSilent.value,
      compressed: optCompressed.value
    }
  }
}

function applyState(s) {
  if (!s || typeof s !== 'object') return
  if (METHOD_OPTIONS.includes(s.method)) method.value = s.method
  url.value = typeof s.url === 'string' ? s.url : ''
  headers.value = Array.isArray(s.headers)
    ? s.headers.map((h) => ({ key: String((h && h.key) || ''), value: String((h && h.value) || '') }))
    : EMPTY_STATE.headers.map((h) => ({ ...h }))
  bodyMode.value = ['none', 'json', 'form', 'multipart'].includes(s.bodyMode) ? s.bodyMode : 'none'
  if (method.value === 'GET' || method.value === 'HEAD') bodyMode.value = 'none'
  jsonBody.value = typeof s.jsonBody === 'string' ? s.jsonBody : ''
  bodyPairs.value = Array.isArray(s.bodyPairs)
    ? s.bodyPairs.map((p) => ({ key: String((p && p.key) || ''), value: String((p && p.value) || '') }))
    : []
  queryPairs.value = Array.isArray(s.queryPairs)
    ? s.queryPairs.map((p) => ({ key: String((p && p.key) || ''), value: String((p && p.value) || '') }))
    : []
  const o = s.opts || {}
  optFollow.value = Boolean(o.follow)
  optInsecure.value = Boolean(o.insecure)
  optInclude.value = Boolean(o.include)
  optSilent.value = Boolean(o.silent)
  optCompressed.value = Boolean(o.compressed)
}

function loadExample(id) {
  const ex = EXAMPLES[id]
  if (!ex) return
  applyState(ex.state)
  urlTouched.value = true
}

function resetForm() {
  applyState(EMPTY_STATE)
  urlTouched.value = false
}

// 表单状态持久化到 localStorage（隐私模式等异常静默忽略）
watch(formInput, () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshotOf()))
  } catch (e) {
    /* 存储不可用时静默降级，不影响生成功能 */
  }
})

// ---------- 复制（SSR 安全，失败时 alert 提示） ----------
async function copyText(text, which) {
  if (!text) {
    alert('暂无可复制的命令，请先填写请求 URL')
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    copiedWhich.value = which
    setTimeout(() => {
      if (copiedWhich.value === which) copiedWhich.value = ''
    }, 2000)
  } catch (e) {
    alert('复制失败（浏览器限制了剪贴板权限），请手动选中命令文本复制')
  }
}

function copyCurrent() {
  copyText(currentCommand.value, 'current')
}
function copyAll() {
  copyText(allCommandsText.value, 'all')
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

onMounted(() => {
  // 恢复上次配置（数据损坏时静默忽略，回退到默认状态）
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) applyState(JSON.parse(saved))
  } catch (e) {
    /* 忽略解析与读取异常 */
  }
  addRecentTool('curl-command-builder')
})
</script>
