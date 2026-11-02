<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <KeyRound class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">chmod 权限计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">勾选读/写/执行位实时得到八进制与符号表示，双向换算并生成 chmod 命令，755、644、600 一看就懂</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 Linux chmod 权限计算器：通过 Owner / Group / Others × 读 / 写 / 执行 的九宫格勾选与八进制、符号模式双向联动，
        实时换算 rwxr-xr-x、755、644、600 等常见权限的对应关系，逐位展示 r=4、w=2、x=1 的组成算式，并生成可直接执行的 chmod 命令
        （目录递归场景提供 find 分开口径的安全版本）。附 777 危险警告、常用预设与 setuid/setgid/sticky 特殊权限位说明，全部计算在浏览器本地完成。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左面板：九宫格矩阵 + 双向输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <KeyRound class="w-5 h-5 mr-2 text-primary" /> 权限矩阵（勾选即生效）
        </h2>

        <!-- 三角色 × 三权限 九宫格 -->
        <div class="space-y-2">
          <div class="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
            <span></span>
            <span class="text-center font-medium">读 r</span>
            <span class="text-center font-medium">写 w</span>
            <span class="text-center font-medium">执行 x</span>
          </div>
          <div v-for="role in roleDefs" :key="role.key" class="grid grid-cols-4 gap-2 items-center">
            <div class="min-w-0">
              <p class="text-sm font-medium text-foreground truncate">{{ role.label }}</p>
              <p class="text-[10px] text-muted-foreground">{{ role.hint }}</p>
            </div>
            <label
              v-for="bit in bitDefs"
              :key="bit.key"
              class="flex items-center justify-center p-2 rounded-md border cursor-pointer transition"
              :class="perms[role.key][bit.key] ? 'bg-primary/10 border-primary/40' : 'border-border bg-background hover:bg-muted/60'"
            >
              <input
                type="checkbox"
                class="w-4 h-4 accent-primary cursor-pointer"
                :checked="perms[role.key][bit.key]"
                :aria-label="`${role.label}${bit.label}权限`"
                @change="toggleBit(role.key, bit.key)"
              />
            </label>
          </div>
        </div>

        <!-- 对象类型 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">对象类型（影响符号前缀与命令）</p>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="t in typeOptions"
              :key="t.value"
              @click="fileType = t.value"
              class="px-2 py-2 rounded-lg text-xs font-medium border transition"
              :class="fileType === t.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 hover:bg-muted border-border text-muted-foreground'"
            >
              {{ t.label }}
            </button>
          </div>
        </div>

        <!-- 八进制输入（反向） -->
        <div>
          <label class="text-sm font-medium text-foreground" for="chmod-octal-input">八进制输入（3 位，0-7）</label>
          <input
            id="chmod-octal-input"
            :value="octalInput"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="如 755"
            class="mt-1.5 w-full px-3 py-2 font-mono text-lg rounded-lg border bg-background focus:outline-none focus:ring-2 transition"
            :class="octalError ? 'border-red-500 focus:ring-red-500/30 text-red-600' : 'border-border focus:ring-primary/30'"
            @input="handleOctalInput"
          />
          <p v-if="octalError" class="mt-1 text-xs text-red-500 flex items-start gap-1">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ octalError }}</span>
          </p>
        </div>

        <!-- 符号模式输入（反向） -->
        <div>
          <label class="text-sm font-medium text-foreground" for="chmod-symbolic-input">符号模式输入（支持 d / l / - 前缀）</label>
          <input
            id="chmod-symbolic-input"
            :value="symbolicInput"
            type="text"
            maxlength="12"
            placeholder="如 rwxr-xr-x 或 drwxr-xr-x"
            class="mt-1.5 w-full px-3 py-2 font-mono text-lg rounded-lg border bg-background focus:outline-none focus:ring-2 transition"
            :class="symbolicError ? 'border-red-500 focus:ring-red-500/30 text-red-600' : 'border-border focus:ring-primary/30'"
            @input="handleSymbolicInput"
          />
          <p v-if="symbolicError" class="mt-1 text-xs text-red-500 flex items-start gap-1">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ symbolicError }}</span>
          </p>
        </div>

        <!-- 状态提示 -->
        <p
          class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5"
          :class="isWorldWritable ? 'bg-red-500/10' : ''"
        >
          <TriangleAlert v-if="isWorldWritable" class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
          <CheckCircle v-else class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
          <span>{{ statusHint }}</span>
        </p>

        <button
          @click="resetAll"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认（755 · 普通文件）
        </button>
      </div>

      <!-- 右面板：结果展示 + 命令 + 预设 + 说明 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <!-- 大八进制 + 符号表示 + 拆解算式 -->
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="bg-primary/10 rounded-xl px-8 py-5 text-center flex flex-col justify-center sm:w-56">
            <p class="text-xs text-muted-foreground mb-1">八进制模式</p>
            <p class="text-6xl font-bold font-mono text-primary tracking-widest">{{ octalResult.octal }}</p>
            <p class="text-[10px] text-muted-foreground mt-2">所有者 {{ octalResult.owner }} · 属组 {{ octalResult.group }} · 其他人 {{ octalResult.others }}</p>
          </div>
          <div class="flex-1 space-y-3">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">符号模式（ls -l 样式）</p>
              <p class="text-2xl font-mono font-bold text-foreground break-all">{{ symbolicDisplay }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-xs font-mono text-muted-foreground space-y-1">
              <p class="text-[10px] text-muted-foreground/80 font-sans mb-0.5">数字组成（r=4 · w=2 · x=1，逐位求和）</p>
              <p v-for="line in digitBreakdown" :key="line.key">
                <span class="text-foreground font-semibold">{{ line.digit }}</span>
                <span class="ml-1">{{ line.terms }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- 命令输出卡 -->
        <div class="border border-border rounded-lg p-4 space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <h3 class="text-sm font-semibold flex items-center">
              <Terminal class="w-4 h-4 mr-1.5 text-primary" /> 对应命令
            </h3>
            <label
              v-if="fileType === 'dir'"
              class="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer"
            >
              <input v-model="recursive" type="checkbox" class="w-3.5 h-3.5 accent-primary cursor-pointer" />
              递归子内容（find 分开口径）
            </label>
          </div>
          <pre class="bg-muted/60 border border-border rounded-lg p-3 text-sm font-mono text-foreground overflow-x-auto whitespace-pre-wrap">{{ commandText }}</pre>
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <p class="text-xs text-muted-foreground leading-relaxed flex-1 min-w-[200px]">{{ commandNote }}</p>
            <button
              @click="copyCommand"
              class="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium transition flex items-center gap-1.5 flex-shrink-0"
            >
              <Copy class="w-3.5 h-3.5" /> 复制命令
            </button>
          </div>
        </div>

        <!-- 常用预设 -->
        <div>
          <h3 class="text-sm font-semibold flex items-center mb-2">
            <Info class="w-4 h-4 mr-1.5 text-primary" /> 常用预设（点击即应用并联动全部表示）
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              v-for="p in presets"
              :key="p.octal"
              @click="applyPreset(p.octal)"
              class="text-left px-3 py-2.5 rounded-lg border transition space-y-0.5"
              :class="[
                p.danger ? 'border-red-500/40 bg-red-500/10 hover:bg-red-500/15' : 'border-border bg-muted/40 hover:bg-muted/70',
                octalResult.octal === p.octal ? 'ring-2 ring-primary/40' : ''
              ]"
            >
              <span class="flex items-center gap-2">
                <span class="font-mono font-bold text-sm" :class="p.danger ? 'text-red-600' : 'text-primary'">{{ p.octal }}</span>
                <span class="text-sm font-medium text-foreground">{{ p.title }}</span>
                <TriangleAlert v-if="p.danger" class="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              </span>
              <span class="block text-xs text-muted-foreground leading-snug">{{ p.scenario }}</span>
            </button>
          </div>
        </div>

        <!-- 权限位速查（静态说明） -->
        <div class="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
          <h3 class="text-sm font-semibold flex items-center">
            <Info class="w-4 h-4 mr-1.5 text-primary" /> 权限位速查
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div class="bg-card border border-border rounded-lg p-2.5">
              <p class="font-semibold text-foreground">第 1 位 · 所有者 u</p>
              <p class="text-muted-foreground mt-0.5">文件属主，通常就是创建者</p>
            </div>
            <div class="bg-card border border-border rounded-lg p-2.5">
              <p class="font-semibold text-foreground">第 2 位 · 属组 g</p>
              <p class="text-muted-foreground mt-0.5">文件所属用户组的成员</p>
            </div>
            <div class="bg-card border border-border rounded-lg p-2.5">
              <p class="font-semibold text-foreground">第 3 位 · 其他人 o</p>
              <p class="text-muted-foreground mt-0.5">除属主与属组外的其余用户</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs border-collapse">
              <thead>
                <tr class="text-left text-muted-foreground border-b border-border">
                  <th class="py-1.5 pr-3 font-medium">常见组合</th>
                  <th class="py-1.5 pr-3 font-medium">符号</th>
                  <th class="py-1.5 font-medium">含义</th>
                </tr>
              </thead>
              <tbody class="font-mono">
                <tr class="border-b border-border/60">
                  <td class="py-1.5 pr-3 text-primary font-bold">755</td>
                  <td class="py-1.5 pr-3 text-foreground">rwxr-xr-x</td>
                  <td class="py-1.5 font-sans text-muted-foreground">目录可进入浏览，程序可执行，仅属主可改动</td>
                </tr>
                <tr class="border-b border-border/60">
                  <td class="py-1.5 pr-3 text-primary font-bold">644</td>
                  <td class="py-1.5 pr-3 text-foreground">rw-r--r--</td>
                  <td class="py-1.5 font-sans text-muted-foreground">普通文件：属主可读写，其他人只读</td>
                </tr>
                <tr class="border-b border-border/60">
                  <td class="py-1.5 pr-3 text-primary font-bold">600</td>
                  <td class="py-1.5 pr-3 text-foreground">rw-------</td>
                  <td class="py-1.5 font-sans text-muted-foreground">私钥 / 凭证：仅属主可读写</td>
                </tr>
                <tr class="border-b border-border/60">
                  <td class="py-1.5 pr-3 text-primary font-bold">700</td>
                  <td class="py-1.5 pr-3 text-foreground">rwx------</td>
                  <td class="py-1.5 font-sans text-muted-foreground">私人目录：仅属主可进入和改动</td>
                </tr>
                <tr>
                  <td class="py-1.5 pr-3 text-primary font-bold">444</td>
                  <td class="py-1.5 pr-3 text-foreground">r--r--r--</td>
                  <td class="py-1.5 font-sans text-muted-foreground">只读：所有人都不能修改</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            特殊权限位：在三位之前还有一位特殊位——setuid（4）让可执行文件以属主身份运行（如 /usr/bin/passwd）、setgid（2）让目录内新建文件继承目录属组、
            sticky（1）限制仅属主可删除目录内文件（如 /tmp，其他人执行位显示为 t）。四位写法如 4755、1777，首位即特殊位；本工具仅覆盖最常用的三位基本权限。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>chmod 755 是什么意思？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          chmod 用三位八进制数字表示文件权限，从左到右分别对应所有者（u）、属组（g）、其他人（o），每一位由「读 r=4、写 w=2、执行 x=1」相加得到。
          以 755 为例逐位拆解：第 1 位 7 = 4 + 2 + 1，即所有者 rwx（可读、可写、可执行）；第 2 位 5 = 4 + 1，即属组 r-x（可读、可执行、不可写）；
          第 3 位同样是 5，其他人也是 r-x。符号表示就是 rwxr-xr-x。755 是目录和可执行脚本（如 deploy.sh）的常规权限：
          任何人都能进入目录浏览、运行程序，但只有属主能修改内容。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">644 和 755 的区别</h3>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          644 对应 rw-r--r--：属主可读写，属组和其他人只读，没有任何执行位，适合普通文件（网页、图片、配置、文档）。
          755 对应 rwxr-xr-x：比 644 多了三个执行位，且属组和其他人可以「执行/进入」，适合目录与可执行程序。
          核心区别就在执行位：目录没有 x 就无法进入，脚本没有 x 就无法直接运行；反过来，普通文件不该有执行位——
          给不需要执行的文件加 x 既不必要，也会扩大被植入脚本利用的风险，最小权限原则下能不给就不给。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">600 用于什么？</h3>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          600 对应 rw-------：只有文件所有者能读写，属组和其他人没有任何权限。它是私钥、证书、含数据库密码或 API Key 的配置文件的标准权限：
          这类文件一旦被同机其他用户读走，等于凭证泄露。SSH 对此有硬性要求——私钥权限过宽（如 644）时会直接拒绝使用并报
          「Permissions too open」，正确做法是 ~/.ssh 目录设为 700、id_rsa 等私钥设为 600。比 600 更严格的是 400（仅可读），
          用于完全不想被意外改写的密钥与归档。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">777 为什么危险？</h3>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          777 表示所有人可读、可写、可执行：同一台机器上的任何用户、任何进程都能修改或替换这个文件——攻击者可以把 Web 目录里的文件改成恶意脚本，
          或利用可写目录放置要执行的程序。生产环境的网站目录设为 777 是被入侵的常见原因之一，「上传目录写不进去就用 777 解决」是典型反模式，
          正确做法是把目录属主改成运行服务的用户。777 只适合临时排查权限问题时短暂使用，调试结束应立即改回 644 / 755。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">递归改权限怎么做？find 与 -R 的安全差异</h3>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          `chmod -R 755 dir` 会把目录里所有内容无差别改成 755：本该是 644 的普通文件也被加上执行位，粒度太粗。
          更安全的做法是用 find 把目录与文件分开设置：`find dir -type d -exec chmod 755 {} +` 只处理子目录，
          `find dir -type f -exec chmod 644 {} +` 只处理文件，各自拿到恰好的权限，也不会改动 dir 本身。
          顺带一提，`-exec ... {} +` 会把多个路径合并成一次 chmod 调用，比 `\;` 逐个调用快得多。
          本页命令卡勾选「递归子内容」即可直接生成这套 find 命令。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">符号模式与数字模式怎么互转？</h3>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          符号模式每组三位按 r、w、x 排列，缺失的位用 - 占位；数字模式把每组的 r=4、w=2、x=1 相加。
          正向：rwxr-x--- → 属组 7、其他人 5、最后一位 0，即 750；rw-r--r-- → 644。
          反向：640 → 属主 rw-、属组 r--、其他人 ---，即 rw-r-----；还能在 ls -l 输出前加 d（目录）、l（符号链接）或 -（普通文件）前缀，
          如 drwxr-xr-x 去掉 d 后按上述规则换算就是 755。本工具左右两侧的矩阵、八进制输入框与符号输入框完全双向联动，任一表示变化都会实时同步其余表示。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">chmod 755 是什么意思？</h3>
            <p class="text-sm text-muted-foreground mt-1">755 表示所有者 rwx（4+2+1=7，可读写执行），属组和其他人各为 r-x（4+1=5，可读可执行、不可写），符号表示为 rwxr-xr-x，常用于目录与可执行脚本：人人可用，仅属主可改。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">644 和 755 有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">644（rw-r--r--）是普通文件：属主可写、他人只读、无执行位；755（rwxr-xr-x）多了执行位，用于目录（x 即可进入）与程序。普通文件不该加执行位，能不给就不给。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">递归修改目录权限用什么命令？</h3>
            <p class="text-sm text-muted-foreground mt-1">推荐 find 分开口径：find dir -type d -exec chmod 755 {} + 处理子目录，find dir -type f -exec chmod 644 {} + 处理文件。chmod -R 会把同一权限无差别套给所有文件和目录，容易给文件误加执行位。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">777 权限为什么危险？</h3>
            <p class="text-sm text-muted-foreground mt-1">777 意味着任何用户、任何进程都能写入：文件可被篡改、替换或植入恶意代码，网站目录设 777 是常见被入侵原因。仅限临时调试，用完立即改回 644 / 755。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'chmod-calculator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  KeyRound, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, Copy, RefreshCw, Terminal
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'chmod 权限计算器 - Linux 文件权限在线换算（755/644/600）',
  description: '免费在线 chmod 权限计算器，勾选 Owner/Group/Others 的读/写/执行位实时换算八进制与符号模式（rwxr-xr-x），生成 chmod 命令与 find 递归安全版，附 755 是什么意思、644 与 755 区别、600 私钥权限、777 风险等说明，纯浏览器本地运行不上传',
  keywords: 'chmod 计算器,linux 权限,755 是什么意思,文件权限,chmod 644',
  author: '有条工具',
  ogTitle: 'chmod 权限计算器 - Linux 文件权限在线换算 | 有条工具',
  ogDescription: '九宫格勾选与八进制、符号模式双向联动，实时生成 chmod 命令与递归安全版本。',
  ogUrl: 'https://www.util.cn/tools/chmod-calculator',
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
          name: 'chmod 权限计算器',
          url: 'https://www.util.cn/tools/chmod-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['九宫格勾选实时换算八进制与符号模式', '八进制 / 符号模式双向解析容错', '生成 chmod 命令与 find 递归安全版', '755/644/600/700/777/666/444 常用预设', '全员可写等危险权限红色警告', '特殊权限位 setuid/setgid/sticky 说明']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'chmod 权限计算器', item: 'https://www.util.cn/tools/chmod-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'chmod 755 是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '755 表示所有者 rwx（4+2+1=7，可读写执行），属组和其他人各为 r-x（4+1=5，可读可执行、不可写），符号表示为 rwxr-xr-x，常用于目录与可执行脚本：人人可用，仅属主可改。' }
            },
            {
              '@type': 'Question',
              name: '644 和 755 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '644（rw-r--r--）是普通文件：属主可写、他人只读、无执行位；755（rwxr-xr-x）多了执行位，用于目录（x 即可进入）与程序。普通文件不该加执行位，能不给就不给。' }
            },
            {
              '@type': 'Question',
              name: '递归修改目录权限用什么命令？',
              acceptedAnswer: { '@type': 'Answer', text: '推荐 find 分开口径：find dir -type d -exec chmod 755 {} + 处理子目录，find dir -type f -exec chmod 644 {} + 处理文件。chmod -R 会把同一权限无差别套给所有文件和目录，容易给文件误加执行位。' }
            },
            {
              '@type': 'Question',
              name: '777 权限为什么危险？',
              acceptedAnswer: { '@type': 'Answer', text: '777 意味着任何用户、任何进程都能写入：文件可被篡改、替换或植入恶意代码，网站目录设 777 是常见被入侵原因。仅限临时调试，用完立即改回 644/755。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 三个基本权限位：r=4、w=2、x=1，逐位求和得到 0-7
const BIT_DEFS = [
  { key: 'read', label: '读', letter: 'r', value: 4 },
  { key: 'write', label: '写', letter: 'w', value: 2 },
  { key: 'exec', label: '执行', letter: 'x', value: 1 }
]
const ROLE_DEFS = [
  { key: 'owner', label: '所有者', hint: 'u · 属主' },
  { key: 'group', label: '属组', hint: 'g · 用户组' },
  { key: 'others', label: '其他人', hint: 'o · 其余用户' }
]
const ROLE_KEYS = ['owner', 'group', 'others']

// 构造全空权限对象（九个布尔全为 false）
function createEmptyPerms() {
  return {
    owner: { read: false, write: false, exec: false },
    group: { read: false, write: false, exec: false },
    others: { read: false, write: false, exec: false }
  }
}

// 深拷贝权限对象（九个布尔）
function copyPerms(perms) {
  return {
    owner: { ...perms.owner },
    group: { ...perms.group },
    others: { ...perms.others }
  }
}

// perms → 逐位求和：{ owner, group, others, octal }，如 { 7, 5, 5, '755' }
function permsToOctal(perms) {
  const digitOf = (role) => BIT_DEFS.reduce((sum, bit) => sum + (perms[role][bit.key] ? bit.value : 0), 0)
  const owner = digitOf('owner')
  const group = digitOf('group')
  const others = digitOf('others')
  return { owner, group, others, octal: `${owner}${group}${others}` }
}

// 八进制字符串 → perms。容错：必须恰好 3 位且字符均在 0-7；
// 合法返回 { ok: true, perms }，非法返回 { ok: false, error }（error 供界面红字展示）
function octalToPerms(input) {
  const raw = String(input ?? '').trim()
  if (!raw) return { ok: false, error: '请输入 3 位八进制数字（每位 0-7），如 755' }
  if (raw.length !== 3) return { ok: false, error: `长度应为 3 位，当前 ${raw.length} 位：八进制权限形如 755` }
  if (!/^[0-7]{3}$/.test(raw)) {
    const bad = [...new Set(raw.split('').filter((ch) => ch < '0' || ch > '7'))]
    return { ok: false, error: `非法字符「${bad.join('、')}」：八进制每一位只能是 0-7` }
  }
  const perms = createEmptyPerms()
  ROLE_KEYS.forEach((role, i) => {
    const d = Number(raw[i])
    BIT_DEFS.forEach((bit) => { perms[role][bit.key] = (d & bit.value) !== 0 })
  })
  return { ok: true, perms }
}

// perms → 符号串（9 位）。type='dir' 前缀 d，'symlink' 前缀 l，'file'（默认）无前缀
function permsToSymbolic(perms, type = 'file') {
  const prefix = type === 'dir' ? 'd' : type === 'symlink' ? 'l' : ''
  const triad = (role) => BIT_DEFS.map((bit) => (perms[role][bit.key] ? bit.letter : '-')).join('')
  return prefix + triad('owner') + triad('group') + triad('others')
}

// 八进制 → 符号串组合；非法输入返回 null
function octalToSymbolic(octal, type = 'file') {
  const parsed = octalToPerms(octal)
  if (!parsed.ok) return null
  return permsToSymbolic(parsed.perms, type)
}

// 符号串 → 八进制（反向解析）。容错：允许 d / l / - 前缀（ls -l 风格）；非法返回 null
function symbolicToOctal(input) {
  let s = String(input ?? '').trim()
  if (!s) return null
  // 前缀容错：总长 10 位且首字符为 d / l / -（ls -l 风格）时剥掉前缀；
  // 9 位的 '---------'（即 000）不含前缀，不能误剥
  if (s.length === 10 && (s[0] === 'd' || s[0] === 'l' || s[0] === '-')) s = s.slice(1)
  if (s.length !== 9) return null
  for (let i = 0; i < 9; i++) {
    if (s[i] !== '-' && s[i] !== BIT_DEFS[i % 3].letter) return null
  }
  const digits = ROLE_KEYS.map((role, ri) =>
    BIT_DEFS.reduce((sum, bit, bi) => sum + (s[ri * 3 + bi] === bit.letter ? bit.value : 0), 0)
  )
  return digits.join('')
}

// 生成 chmod 命令文本。目录 + 递归时输出 find 分开口径（更安全）并附中文注释；
// 目录非递归输出 chmod 755 dir，普通输出 chmod 755 path/
function buildChmodCommand(octal, { recursive = false, type = 'file' } = {}) {
  const mode = String(octal)
  if (type === 'dir' && recursive) {
    return [
      '# 文件与目录分开设置更安全',
      `find dir -type d -exec chmod ${mode} {} +`,
      `find dir -type f -exec chmod ${mode} {} +`
    ].join('\n')
  }
  if (type === 'dir') return `chmod ${mode} dir`
  return `chmod ${mode} path/`
}

// 静态预设表：每个常用权限附一句使用场景；777 标记危险（界面红色警告）
function commonPresetsOf() {
  return [
    { octal: '755', title: '目录 / 可执行程序', danger: false, scenario: '任何人可进入浏览与执行，仅属主可改动，目录和脚本的常规权限' },
    { octal: '644', title: '普通文件', danger: false, scenario: '属主可读写、其他人只读，网页、图片与一般文档的标准权限' },
    { octal: '600', title: '私钥 / 凭证', danger: false, scenario: '仅属主可读写，SSH 私钥、证书与含密码配置的必备权限' },
    { octal: '700', title: '私人目录', danger: false, scenario: '仅属主可进入和改动，其他用户完全不可见，适合 ~/.ssh 等私密目录' },
    { octal: '777', title: '全员可写（危险）', danger: true, scenario: '全员可写，任何用户都能篡改或植入代码，仅临时调试用，用完立即改回' },
    { octal: '666', title: '共享可写文件', danger: false, scenario: '所有人可读写但不可执行，多用户共同编辑的临时文件可用，风险较高' },
    { octal: '444', title: '只读文件', danger: false, scenario: '所有人只能读取，防止误改的归档、样本与证据文件' }
  ]
}

// ---------- 交互状态 ----------
const perms = ref({
  owner: { read: true, write: true, exec: true },
  group: { read: true, write: false, exec: true },
  others: { read: true, write: false, exec: true }
})
const fileType = ref('file')
const recursive = ref(false)
const octalInput = ref('755')
const octalError = ref('')
const symbolicInput = ref('rwxr-xr-x')
const symbolicError = ref('')
const seoContentVisible = ref(true)

const roleDefs = ROLE_DEFS
const bitDefs = BIT_DEFS
const presets = commonPresetsOf()
const typeOptions = [
  { value: 'file', label: '普通文件' },
  { value: 'dir', label: '目录' },
  { value: 'symlink', label: '符号链接' }
]

// ---------- 计算属性（勾选 ↔ 数字/符号 双向联动的正向面） ----------
const octalResult = computed(() => permsToOctal(perms.value))
const symbolicDisplay = computed(() => permsToSymbolic(perms.value, fileType.value))

// 数字组成拆解：每行如「属组 5 = 4(r) + 1(x)」
const digitBreakdown = computed(() =>
  ROLE_DEFS.map((role) => {
    const digit = octalResult.value[role.key]
    const parts = BIT_DEFS
      .filter((bit) => perms.value[role.key][bit.key])
      .map((bit) => `${bit.value}(${bit.letter})`)
    return {
      key: role.key,
      digit,
      terms: `${role.label}：${digit} = ${parts.length ? parts.join(' + ') : '0（无权限）'}`
    }
  })
)

const commandText = computed(() =>
  buildChmodCommand(octalResult.value.octal, { recursive: recursive.value, type: fileType.value })
)

const commandNote = computed(() => {
  if (fileType.value === 'dir' && recursive.value) {
    return 'find 版把子目录与文件分开设置、不改动 dir 本身的权限，比 chmod -R 更安全（-R 会把同一权限无差别套给文件和目录）。'
  }
  if (fileType.value === 'dir') {
    return '只改目录本身；要连同内部所有内容一起调整，请勾选上方「递归子内容」使用 find 版，文件与目录分开设置更安全。另一种口径是 chmod 755 dir。'
  }
  if (fileType.value === 'symlink') {
    return 'chmod 默认作用于符号链接指向的目标文件；macOS 如需修改链接本身，可加 -h 参数。'
  }
  return '直接对单个文件生效，替换 path/ 为实际文件路径即可。'
})

const isWorldWritable = computed(() => perms.value.group.write || perms.value.others.write)

// 各角色能力摘要，用于状态提示
function describeRoleCaps(roleKey) {
  const p = perms.value[roleKey]
  const caps = []
  if (p.read) caps.push('可读')
  if (p.write) caps.push('可写')
  if (p.exec) caps.push('可执行/进入')
  return caps.length ? caps.join('、') : '无任何权限'
}

const statusHint = computed(() => {
  if (isWorldWritable.value) {
    return '警告：属组或其他人拥有写权限（全员可写），任何用户都能修改内容或植入代码，仅建议临时调试时短暂使用。'
  }
  if (octalResult.value.octal === '000') {
    return '当前为 000：所有人都无任何权限，文件不可读不可写、目录不可进入，请确认这是预期设置。'
  }
  return `当前 ${octalResult.value.octal}（${symbolicDisplay.value}）：所有者${describeRoleCaps('owner')}，属组${describeRoleCaps('group')}，其他人${describeRoleCaps('others')}。`
})

// ---------- 应用与联动 ----------
// 统一入口：设置新权限并同步两个输入框；source 指明触发来源，避免覆盖正在编辑的输入框
function applyPerms(nextPerms, source = '') {
  perms.value = copyPerms(nextPerms)
  const octal = permsToOctal(perms.value).octal
  if (source !== 'octal') {
    octalInput.value = octal
    octalError.value = ''
  }
  if (source !== 'symbolic') {
    symbolicInput.value = permsToSymbolic(perms.value, fileType.value)
    symbolicError.value = ''
  }
}

// 九宫格勾选变化 → 联动右侧全部表示与两个输入框
function toggleBit(roleKey, bitKey) {
  const next = copyPerms(perms.value)
  next[roleKey][bitKey] = !next[roleKey][bitKey]
  applyPerms(next, 'checkbox')
}

// 八进制输入（反向）：合法则更新权限，非法保持原权限并红字提示
function handleOctalInput(e) {
  const raw = e.target.value
  octalInput.value = raw
  const parsed = octalToPerms(raw)
  if (parsed.ok) {
    applyPerms(parsed.perms, 'octal')
    octalError.value = ''
  } else {
    octalError.value = parsed.error
  }
}

// 符号模式输入（反向）：合法则更新权限，非法保持原权限并红字提示
function handleSymbolicInput(e) {
  const raw = e.target.value
  symbolicInput.value = raw
  const octal = symbolicToOctal(raw)
  if (octal !== null) {
    const parsed = octalToPerms(octal)
    if (parsed.ok) applyPerms(parsed.perms, 'symbolic')
    symbolicError.value = ''
  } else {
    symbolicError.value = '无法解析：应为 9 位符号串（如 rwxr-xr-x），可带 d / l / - 前缀'
  }
}

// 预设点击 → 应用并联动全部表示
function applyPreset(octal) {
  const parsed = octalToPerms(octal)
  if (parsed.ok) applyPerms(parsed.perms, 'preset')
}

// 对象类型变化 → 符号前缀变化，同步符号输入框
watch(fileType, (type) => {
  symbolicInput.value = permsToSymbolic(perms.value, type)
  symbolicError.value = ''
})

function resetAll() {
  fileType.value = 'file'
  recursive.value = false
  const parsed = octalToPerms('755')
  if (parsed.ok) applyPerms(parsed.perms, 'preset')
}

// ---------- 复制（浏览器 API 仅在回调中使用，SSR 安全） ----------
function copyCommand() {
  const text = commandText.value
  const done = () => alert('chmod 命令已复制到剪贴板')
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done))
  } else {
    fallbackCopy(text, done)
  }
}

function fallbackCopy(text, done) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    done()
  } catch (err) {
    alert('复制失败，请手动选择命令文本复制')
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('chmod-calculator')
})
</script>
