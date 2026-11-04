<template>
  <div class="max-w-8xl mx-auto">
    <!-- 页面顶部兼容性显著标注 -->
    <div class="mb-6 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <TriangleAlert class="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-sm leading-relaxed text-foreground">
        本工具使用 File System Access API：需要 <strong class="font-semibold">Chrome/Edge 86+ 或 Opera</strong>（Firefox/Safari 不支持），且必须 HTTPS；目录授权仅本次会话有效，刷新后需重新选择。全程本地执行，文件名不离开你的电脑。
      </p>
    </div>

    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FilePen class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">批量重命名</h1>
          <p class="text-sm text-muted-foreground mt-1">目录内文件按规则批量改名：查找替换、正则、前后缀、序号与大小写，改前逐行预览、冲突检测，改后一键撤销</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线批量重命名工具：选择本地文件夹后，用查找替换、正则替换（支持 $1 捕获组）、前缀后缀（自动加在扩展名之前）、序号模板（{n} 序号补零、{name} 引用主名、{date} 修改日期）与大小写转换五类规则叠加出新文件名；
        每一步都先在右侧逐行预览、自动检测撞名冲突，确认后逐个执行并支持整批撤销。全部操作在浏览器本地通过 File System Access API 完成，文件名与文件内容都不会离开你的电脑。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：选择目录 + 改名规则 -->
      <div class="space-y-6">
        <!-- ① 选择目录 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <FolderOpen class="w-5 h-5 mr-2 text-primary" /> ① 选择目录
          </h2>

          <button
            @click="pickDirectory"
            :disabled="!fsApiAvailable || scanning"
            class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <RefreshCw v-if="scanning" class="w-4 h-4 animate-spin" />
            <FolderOpen v-else class="w-4 h-4" />
            {{ scanning ? '扫描中…' : (dirName ? '重新选择目录' : '选择文件夹') }}
          </button>

          <!-- 浏览器不兼容：红条 + 支持清单 -->
          <div v-if="!fsApiAvailable" class="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs leading-relaxed text-red-600">
            当前浏览器不支持 File System Access API，无法选择目录。支持清单：Chrome / Edge 86+、Opera 72+ 及其他 Chromium 内核浏览器（含 Android Chrome）；Firefox、Safari（含 iOS 上的全部浏览器）暂不支持，请更换浏览器后使用。
          </div>

          <div v-if="dirName" class="rounded-lg bg-muted/50 border border-border px-3 py-2.5 text-sm space-y-1">
            <p class="font-medium text-foreground truncate" :title="dirName">{{ dirName }}</p>
            <p class="text-xs text-muted-foreground">
              已列出 {{ files.length }} 个文件<template v-if="subCount">，其中 {{ subCount }} 个来自子目录（暂不参与改名）</template><template v-if="truncated">，已达 {{ MAX_FILES }} 个上限，仅列出前 {{ MAX_FILES }} 个，请分批处理</template>
            </p>
          </div>

          <label class="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
            <input v-model="includeSubdirs" type="checkbox" class="mt-0.5 accent-primary" />
            <span>同时列出子目录中的文件（仅列出与预览，本版仅对顶层文件执行改名；FSA 支持递归重命名，后续版本开放，勾选后自动重新扫描）</span>
          </label>

          <p v-if="scanError" class="text-xs text-red-600 leading-relaxed flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ scanError }}</span>
          </p>
          <p v-else-if="scanWarn" class="text-xs text-amber-600 leading-relaxed flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ scanWarn }}</span>
          </p>

          <p v-if="dirName && !canWrite" class="text-xs text-amber-600 leading-relaxed flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>未授予「写入」权限：当前只能预览，不能执行改名。请重新选择目录并在浏览器弹窗中选择「允许（含写入文件）」。</span>
          </p>

          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>目录授权仅本次会话有效：刷新或关闭标签页后需要重新选择目录。撤销记录同样只保存在本次会话内存中。</span>
          </p>
        </div>

        <!-- ② 改名规则 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <FilePen class="w-5 h-5 mr-2 text-primary" /> ② 改名规则
            </h2>
            <button
              @click="clearRules"
              class="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition"
            >
              <RefreshCw class="w-3.5 h-3.5" /> 清空规则
            </button>
          </div>
          <p class="text-xs text-muted-foreground -mt-3">五类规则自上而下依次叠加应用，输入框留空即不启用对应规则。</p>

          <!-- 规则 1：查找替换 -->
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">1. 查找替换 <span class="text-xs text-muted-foreground font-normal">（字面量）</span></p>
            <div class="grid grid-cols-2 gap-2">
              <input v-model="rules.find" type="text" placeholder="查找内容" class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <input v-model="rules.replace" type="text" placeholder="替换为（留空即删除）" class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <label class="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input v-model="rules.caseSensitive" type="checkbox" class="accent-primary" /> 区分大小写
            </label>
          </div>

          <!-- 规则 2：正则替换 -->
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">2. 正则替换 <span class="text-xs text-muted-foreground font-normal">（替换串支持 $1 捕获组）</span></p>
            <div class="flex items-center gap-1.5">
              <span class="text-muted-foreground text-sm font-mono">/</span>
              <input v-model="rules.pattern" type="text" placeholder="pattern，如 S1E(\d)" class="flex-1 min-w-0 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <span class="text-muted-foreground text-sm font-mono">/</span>
              <input v-model="rules.flags" type="text" placeholder="g" class="w-16 px-2 py-2 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <input v-model="rules.regexRepl" type="text" placeholder="替换为，如 S01E$1（$1 表示第 1 个捕获组）" class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <p v-if="!regexState.ok" class="text-xs text-red-600 flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>正则无效：{{ regexState.error }}（该规则暂不应用，修正后自动恢复）</span>
            </p>
          </div>

          <!-- 规则 3：前缀 / 后缀 -->
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">3. 前缀 / 后缀 <span class="text-xs text-muted-foreground font-normal">（自动加在扩展名之前）</span></p>
            <div class="grid grid-cols-2 gap-2">
              <input v-model="rules.prefix" type="text" placeholder="前缀，如 2024_" class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <input v-model="rules.suffix" type="text" placeholder="后缀，如 _备份" class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <p class="text-[10px] text-muted-foreground leading-relaxed">示例：archive.tar.gz 加后缀 _bak → archive.tar_bak.gz（多重点名取最后一个点作为扩展名口径）。</p>
          </div>

          <!-- 规则 4：序号模板 -->
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">4. 序号模板</p>
            <input v-model="rules.seqTemplate" type="text" placeholder="如 {name}_{n} 或 V{n}_{date}" class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <div class="grid grid-cols-3 gap-2">
              <label class="text-xs text-muted-foreground space-y-1">
                <span class="block">起始</span>
                <input v-model.number="rules.seqStart" type="number" min="0" class="w-full px-2 py-1.5 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </label>
              <label class="text-xs text-muted-foreground space-y-1">
                <span class="block">步进</span>
                <input v-model.number="rules.seqStep" type="number" min="1" class="w-full px-2 py-1.5 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </label>
              <label class="text-xs text-muted-foreground space-y-1">
                <span class="block">位宽（1-6）</span>
                <input v-model.number="rules.seqWidth" type="number" min="1" max="6" class="w-full px-2 py-1.5 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </label>
            </div>
            <p class="text-[10px] text-muted-foreground leading-relaxed">{n}=按列表顺序的序号（按位宽补零）；{name}=主名（进入本规则时的文件主名，未启用其他规则时即原名）；{date}=文件修改日期 YYYYMMDD。模板会替换整个主名（扩展名保留），不想丢弃旧名请引用 {name}，如 {name}_{n}。</p>
          </div>

          <!-- 规则 5：大小写 -->
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">5. 大小写转换 <span class="text-xs text-muted-foreground font-normal">（仅文件主名，不改扩展名）</span></p>
            <select v-model="rules.caseMode" class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="none">不改变</option>
              <option value="lower">全部小写</option>
              <option value="upper">全部大写</option>
              <option value="capitalize">首字母大写</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 右侧：预览与执行（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Play class="w-5 h-5 mr-2 text-primary" /> ③ 预览与执行
          </h2>
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{{ statTotal }} 个文件</span>
            <span class="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">将改名 {{ statRename }}</span>
            <span class="px-2.5 py-1 rounded-full font-medium" :class="statCollide > 0 ? 'bg-red-500/10 text-red-600' : 'bg-muted text-muted-foreground'">冲突 {{ statCollide }}</span>
          </div>
        </div>

        <!-- 未选择目录 / 空目录占位 -->
        <div v-if="!dirName" class="py-16 flex flex-col items-center justify-center text-center">
          <FolderOpen class="w-12 h-12 text-primary/30 mb-3" />
          <p class="text-sm font-medium text-muted-foreground">先在左侧选择一个文件夹</p>
          <p class="text-xs text-muted-foreground/70 mt-1">选择目录后此处会列出文件并逐行预览改名结果，全程本地执行</p>
        </div>
        <div v-else-if="!files.length" class="py-16 flex flex-col items-center justify-center text-center">
          <Info class="w-10 h-10 text-primary/30 mb-3" />
          <p class="text-sm font-medium text-muted-foreground">这个目录里没有文件（可能只有空的子目录）</p>
        </div>

        <template v-else>
          <!-- 操作按钮 -->
          <div class="flex flex-wrap items-center gap-2">
            <button
              @click="executeRenames"
              :disabled="!canExecute"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <RefreshCw v-if="executing" class="w-4 h-4 animate-spin" />
              <Play v-else class="w-4 h-4" />
              {{ executing ? '执行中…' : `执行改名（${statRename}）` }}
            </button>
            <button
              @click="undoRenames"
              :disabled="!canUndo"
              class="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <RefreshCw v-if="undoing" class="w-4 h-4 animate-spin" />
              <Undo2 v-else class="w-4 h-4" />
              撤销本次改名{{ undoStack.length ? `（${undoStack.length}）` : '' }}
            </button>
            <button
              @click="rescanDirectory"
              :disabled="!dirHandle || scanning"
              class="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <RefreshCw class="w-4 h-4" :class="scanning ? 'animate-spin' : ''" /> 重新扫描
            </button>
          </div>

          <p v-if="executeBlockReason" class="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ executeBlockReason }}</span>
          </p>

          <!-- 执行结果汇总 -->
          <div v-if="execSummary" class="rounded-lg border px-3 py-2.5 space-y-1" :class="execSummary.fail > 0 ? 'border-amber-500/30 bg-amber-500/10' : 'border-green-500/20 bg-green-500/10'">
            <p class="text-sm font-medium flex items-center gap-1.5" :class="execSummary.fail > 0 ? 'text-amber-600' : 'text-green-600'">
              <CheckCircle v-if="execSummary.fail === 0" class="w-4 h-4" />
              <TriangleAlert v-else class="w-4 h-4" />
              执行完成：成功 {{ execSummary.success }} 个，失败 {{ execSummary.fail }} 个
            </p>
            <p class="text-xs text-muted-foreground">已改名文件已固定显示，可用「撤销本次改名」整批回退（撤销仅本次会话有效）；继续改名前建议先调整或清空规则，避免规则对新文件名再次叠加。</p>
          </div>

          <!-- 撤销逐条报告 -->
          <div v-if="undoResults.length" class="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <p class="text-sm font-medium text-foreground">撤销结果</p>
            <ul class="mt-1.5 space-y-1 text-xs">
              <li v-for="(r, i) in undoResults" :key="i" class="flex items-start gap-1.5" :class="r.ok ? 'text-green-600' : 'text-red-600'">
                <CheckCircle v-if="r.ok" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <TriangleAlert v-else class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span class="break-all">{{ r.name }}：{{ r.ok ? '已恢复原名' : r.msg }}</span>
              </li>
            </ul>
          </div>

          <!-- 预览表 -->
          <div class="overflow-x-auto rounded-lg border border-border">
            <table class="w-full min-w-[640px] text-sm">
              <thead>
                <tr class="bg-muted/60 text-left text-xs text-muted-foreground">
                  <th class="px-3 py-2 font-medium whitespace-nowrap">状态</th>
                  <th class="px-3 py-2 font-medium">原名</th>
                  <th class="px-3 py-2 font-medium">新名</th>
                  <th class="px-3 py-2 font-medium whitespace-nowrap">大小</th>
                  <th class="px-3 py-2 font-medium whitespace-nowrap">修改时间</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in previewRows"
                  :key="row.id"
                  class="border-t border-border"
                  :class="row.collision ? 'bg-red-500/10' : (row.changed && row.participates ? '' : 'opacity-60')"
                >
                  <td class="px-3 py-2 whitespace-nowrap">
                    <span v-if="!row.participates" class="inline-block px-2 py-0.5 rounded-full border text-[10px] bg-muted text-muted-foreground border-border">子目录 · 暂不改名</span>
                    <span v-else-if="row.exec && row.exec.status === 'ok'" class="inline-flex items-center gap-1 text-[11px] text-green-600 font-medium"><CheckCircle class="w-3.5 h-3.5" />已改名</span>
                    <span v-else-if="row.exec && row.exec.status === 'error'" class="inline-flex items-center gap-1 text-[11px] text-red-600 font-medium"><TriangleAlert class="w-3.5 h-3.5" />失败</span>
                    <span v-else-if="row.collision" class="inline-flex items-center gap-1 text-[11px] text-red-600 font-medium"><TriangleAlert class="w-3.5 h-3.5" />冲突</span>
                    <span v-else-if="!row.changed" class="inline-block px-2 py-0.5 rounded-full border text-[10px] bg-muted text-muted-foreground border-border">无变化</span>
                    <span v-else class="text-[11px] text-muted-foreground">待执行</span>
                  </td>
                  <td class="px-3 py-2 font-mono text-xs break-all max-w-[260px]">
                    <span v-if="row.relPath" class="text-muted-foreground/70 mr-1">{{ row.relPath }}</span>
                    <span>{{ row.seg.prefix }}</span><span v-if="row.seg.oldMid" class="bg-red-500/15 text-red-600 rounded px-0.5">{{ row.seg.oldMid }}</span><span>{{ row.seg.suffix }}</span>
                  </td>
                  <td class="px-3 py-2 font-mono text-xs break-all max-w-[260px]">
                    <span class="text-muted-foreground/50 mr-1">→</span>
                    <span>{{ row.seg.prefix }}</span><span v-if="row.seg.newMid" class="bg-green-500/20 text-green-700 rounded px-0.5">{{ row.seg.newMid }}</span><span>{{ row.seg.suffix }}</span>
                    <p v-if="row.collision" class="text-[10px] text-red-600 mt-1 font-sans">{{ row.collisionReason }}</p>
                    <p v-else-if="row.exec && row.exec.status === 'error'" class="text-[10px] text-red-600 mt-1 font-sans">{{ row.exec.msg }}</p>
                  </td>
                  <td class="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{{ formatSizeOf(row.size) }}</td>
                  <td class="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap" :title="formatDateOf(row.mtime)">{{ formatDateOf(row.mtime) || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
            <span class="flex items-center gap-1"><i class="w-2 h-2 rounded-sm bg-red-500/40 inline-block"></i>红色 = 删除的部分</span>
            <span class="flex items-center gap-1"><i class="w-2 h-2 rounded-sm bg-green-500/40 inline-block"></i>绿色 = 新增的部分</span>
            <span>新名与其他文件撞名或多条规则产物相同时，该行标红且无法执行，需调整规则或分两批改名。</span>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>撤销记录只保存在本次会话内存中：刷新或关闭标签页后即丢失，届时无法一键回退，请谨慎执行。Windows 下文件名不允许 \ / : * ? " &lt; &gt; | 字符，工具会在改名前自动把它们替换为下划线 _。</span>
          </p>
        </template>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>在线批量重命名工具是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          批量重命名是一款基于 File System Access API 的本地文件改名工具。选择一个文件夹后，工具会列出其中的文件（含大小、修改时间），并按你配置的五类规则——查找替换、正则替换（支持 $1 捕获组）、前缀后缀（自动加在扩展名之前）、序号模板（{n} 序号补零、{name} 引用主名、{date} 修改日期）与大小写转换——自上而下叠加算出新文件名。
          右侧预览表逐行给出「原名 → 新名」并高亮变化片段，自动检测新名与目录内其他文件撞名、多条规则产物互相撞名两类冲突；冲突未解除时执行按钮保持禁用。执行阶段逐个文件调用 rename()，单个失败不影响其余文件，并汇总成功/失败数；整批操作可通过撤销按钮反向恢复。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">批量重命名的常见场景</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>照片按日期归档：用前缀 2024_ 或序号模板 {date}_{n}，把 IMG_0001.jpg 这类相机原始名整理成「日期 + 序号」，按修改时间排序后一次到位。</li>
          <li>剧集编号补零：用正则 E(\d) → E0$1 把「剧名 E1.mp4」改成「剧名 E01.mp4」，补零后播放器与资源管理器才能按正确顺序排列。</li>
          <li>去广告/水印后缀：查找替换直接删掉「[广告]」「@水印号」等固定片段，或用正则 \s*\[.*?\]\s* → （替换为空）一次性清理各类括号尾巴。</li>
          <li>统一大小写：全大写或全小写，方便在大小写敏感的 Linux 服务器上排查同名不同大小写的文件。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Windows 资源管理器「F2 大法」与本工具的差别</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Windows 里常见的批量改名是：全选文件 → F2 → 输入一个名字 → 回车，系统会生成「名字(1)、名字(2)…」。它胜在零门槛，但只能加同一个基础名，无法保留原文件名做变量、无法正则匹配、无法只给编号补零、扩展名处理也不可控。
          本工具的差异在于：规则可以叠加（比如先正则删广告词、再加日期前缀、最后补序号）；{name} 会把原始文件名带回新名字里；改名前有逐行预览与撞名预检，不会改到一半才发现重名；执行后还支持整批撤销。macOS 访达的「多选右键重新命名」类似 F2，同样不具备正则与冲突预检能力。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">正则改名示例三则（本工具语法）</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>剧集一位编号补零：pattern 填 E(\d)(?!\d)、flags 填 g、替换串填 E0$1。「剧名 E1.mp4」→「剧名 E01.mp4」；负向前瞻 (?!\d) 保证 E12 不会被误改成 E012。</li>
          <li>批量加拍摄日期：pattern 填 ^IMG、flags 填 g、替换串填 20231104_IMG。「IMG_0001.jpg」→「20231104_IMG_0001.jpg」；^ 只锚定开头，不会误伤文件名中间的 IMG。</li>
          <li>空格与特殊符号统一：pattern 填 \s+、flags 填 g、替换串填 _。「my file 1.jpg」→「my_file_1.jpg」，脚本处理与命令行操作时不再需要引号转义。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么 Firefox 和 Safari 不支持？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本工具依赖的 File System Access API（showDirectoryPicker / handle.rename 等）目前是 W3C WICG 的草案规范，尚未成为正式 Web 标准。Chromium 系浏览器（Chrome、Edge、Opera 及 Android Chrome）已经稳定落地并长期维护；Firefox 曾做过原型试验，但出于安全与工程优先级考虑暂停了实现，至今没有默认启用；Safari 同样以隐私与安全考量未提供「选择目录并读写」这类入口。
          因此在 Firefox/Safari 打开本页时，会直接看到红色的不兼容提示与支持清单，而不是一个点了没反应的按钮。这意味着此类能力短期内无法跨全浏览器，需要本地批量改名的 Firefox 用户可临时换用 Chromium 内核浏览器。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">文件名非法字符提醒</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Windows 文件名不允许包含反斜杠 \、正斜杠 /、冒号 :、星号 *、问号 ?、双引号 "、小于号 &lt;、大于号 &gt;、竖线 | 这九个字符（macOS 额外禁冒号，Linux 仅禁正斜杠）。本工具会在每次计算新文件名时自动把 \ / : * ? " &lt; &gt; | 替换为下划线 _，避免规则产物非法导致执行到一半才失败。
          另外提醒：Windows 还不允许文件名以空格或点结尾（如「name. 」），这类情况本工具不自动处理，请在规则里自行避免；目录与文件同名也会冲突，改名结果撞上子目录名时会被冲突检测拦下。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">批量重命名会上传我的文件吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。工具通过浏览器的 File System Access API 直接在你本机读写文件名，扫描、预览、改名全部在浏览器内完成，页面没有任何上传逻辑，文件名与文件内容都不离开你的电脑。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">撤销功能能跨刷新使用吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不能。撤销记录 [{handle, 原名, 新名}] 只保存在本次会话内存里，刷新或关闭标签页后即丢失；目录授权同样仅本次会话有效，刷新后需要重新选择目录。执行前请先确认预览无误。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">改名冲突了会怎样？</h3>
            <p class="text-sm text-muted-foreground mt-1">执行前会逐行预检：新名与目录内其他文件（含未列出的超上限文件与子目录名）撞名，或多条规则产物互相撞名时，冲突行标红并给出原因，执行按钮整体禁用；需调整规则或分两批改名后再执行。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">子目录里的文件能一起改名吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">可以勾选「同时列出子目录中的文件」来列出与预览，但本版本仅对顶层文件执行改名——File System Access API 本身支持递归重命名，后续版本会开放对子目录文件的批量改名。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'batch-rename-tool'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  FilePen, FolderOpen, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Undo2
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '批量重命名 - 在线文件批量改名工具（正则/序号/可撤销）',
  description: '免费在线批量重命名工具：选择文件夹后用查找替换、正则替换（支持 $1 捕获组）、前缀后缀、序号模板 {n}/{name}/{date} 与大小写转换批量改名，改前逐行预览、自动检测撞名冲突、改后一键撤销，基于 File System Access API 纯本地执行，文件名不上传，需 Chrome/Edge 86+ 或 Opera。',
  keywords: '批量重命名,文件批量改名,批量改名工具,正则重命名,在线改名',
  author: '有条工具',
  ogTitle: '批量重命名 - 在线文件批量改名工具 | 有条工具',
  ogDescription: '查找替换、正则、前后缀、序号模板与大小写五类规则叠加，改前预览冲突检测、改后一键撤销，纯本地执行。',
  ogUrl: 'https://www.util.cn/tools/batch-rename-tool',
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
          name: '批量重命名',
          url: 'https://www.util.cn/tools/batch-rename-tool',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['目录内文件批量改名逐行预览', '查找替换（区分大小写可关）', '正则替换支持 $1 捕获组', '前缀后缀自动加在扩展名之前', '序号模板 {n}/{name}/{date} 位宽补零', '大小写转换', '撞名冲突预检', '一键撤销本次改名', '纯本地执行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '批量重命名', item: 'https://www.util.cn/tools/batch-rename-tool/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '批量重命名会上传我的文件吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。工具通过浏览器的 File System Access API 直接在你本机读写文件名，扫描、预览、改名全部在浏览器内完成，页面没有任何上传逻辑，文件名与文件内容都不离开你的电脑。' }
            },
            {
              '@type': 'Question',
              name: '撤销功能能跨刷新使用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。撤销记录只保存在本次会话内存里，刷新或关闭标签页后即丢失；目录授权同样仅本次会话有效，刷新后需要重新选择目录。执行前请先确认预览无误。' }
            },
            {
              '@type': 'Question',
              name: '改名冲突了会怎样？',
              acceptedAnswer: { '@type': 'Answer', text: '执行前会逐行预检：新名与目录内其他文件（含未列出的超上限文件与子目录名）撞名，或多条规则产物互相撞名时，冲突行标红并给出原因，执行按钮整体禁用；需调整规则或分两批改名后再执行。' }
            },
            {
              '@type': 'Question',
              name: '子目录里的文件能一起改名吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以勾选「同时列出子目录中的文件」来列出与预览，但本版本仅对顶层文件执行改名，File System Access API 本身支持递归重命名，后续版本会开放对子目录文件的批量改名。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MAX_FILES = 500      // 单次列出的文件上限，超出仅列出前 500 个（其余名字仍参与撞名检测）
const MAX_SCAN_DEPTH = 10  // 递归枚举子目录的最大深度保护

// 拆分扩展名。口径：取「最后一个点」之后作为扩展名（多重点名 archive.tar.gz 的 ext 是 .gz、base 是 archive.tar）；
// 以点开头且没有第二个点的名字（如 .gitignore）视为隐藏文件，整体作为 base、ext 为空；无点同名亦然。
function splitExtOf(name) {
  const n = String(name == null ? '' : name)
  const dot = n.lastIndexOf('.')
  if (dot <= 0) return { base: n, ext: '' }
  return { base: n.slice(0, dot), ext: n.slice(dot) }
}

// 非法字符清洗：Windows 文件名禁用的 \ / : * ? " < > | 九个字符统一替换为下划线
const ILLEGAL_NAME_CHARS = /[\\/:*?"<>|]/g
function sanitizeNameOf(name) {
  return String(name == null ? '' : name).replace(ILLEGAL_NAME_CHARS, '_')
}

// 大小写转换：仅作用于文件主名 base；capitalize 只把首字母大写、其余保持原样
function applyCaseOf(base, mode) {
  const s = String(base == null ? '' : base)
  if (mode === 'lower') return s.toLowerCase()
  if (mode === 'upper') return s.toUpperCase()
  if (mode === 'capitalize') return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
  return s
}

// 序号补零：位宽钳制在 1-6，如 padSeqOf(42, 4) → '0042'
function padSeqOf(n, width) {
  const w = Math.min(6, Math.max(1, Math.floor(Number(width) || 1)))
  let s = String(Math.floor(Number(n) || 0))
  if (s.length < w) s = s.padStart(w, '0')
  return s
}

// 修改时间 → YYYYMMDD（取本地时间）
function formatDateOf(ms) {
  const n = Number(ms)
  if (!isFinite(n) || n <= 0) return ''
  const d = new Date(n)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

// 序号模板渲染：{n}=补零序号，{name}=原名 base，{date}=YYYYMMDD；其余 {…} 占位符原样保留
function renderSeqTemplateOf(template, parts) {
  const t = String(template == null ? '' : template)
  if (!t) return ''
  return t
    .replace(/\{n\}/g, padSeqOf(parts.n, parts.width))
    .replace(/\{name\}/g, String(parts.name == null ? '' : parts.name))
    .replace(/\{date\}/g, String(parts.date == null ? '' : parts.date))
}

// 正则元字符转义（字面量替换用）
function escapeRegExpOf(s) {
  return String(s == null ? '' : s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 字面量查找替换：caseSensitive 为 true 时用 split/join（精确字面量），否则按转义后的不区分大小写正则替换；
// 替换串用函数回写，避免 repl 中的 $& 等 $ 序列被 String.replace 二次解释（字面量模式应原样输出）
function literalReplaceOf(name, find, repl, caseSensitive) {
  const src = String(name == null ? '' : name)
  const f = String(find == null ? '' : find)
  if (!f) return src
  const r = String(repl == null ? '' : repl)
  if (caseSensitive) return src.split(f).join(r)
  return src.replace(new RegExp(escapeRegExpOf(f), 'gi'), () => r)
}

// 正则替换容错：非法 pattern/flags 时不抛异常，返回 ok:false 与原因，value 保持原名
function safeRegexReplaceOf(name, pattern, flags, repl) {
  const src = String(name == null ? '' : name)
  const p = String(pattern == null ? '' : pattern)
  try {
    if (!p) return { ok: false, value: src, error: '正则为空，未应用' }
    const re = new RegExp(p, String(flags == null ? '' : flags))
    return { ok: true, value: src.replace(re, String(repl == null ? '' : repl)), error: '' }
  } catch (e) {
    return { ok: false, value: src, error: e && e.message ? e.message : '正则无效' }
  }
}

// 正则输入校验（供界面红字提示）：留空视为未启用（skip），非法返回错误信息
function validateRegexOf(pattern, flags) {
  const p = String(pattern == null ? '' : pattern)
  if (!p.trim()) return { ok: true, skip: true, error: '' }
  try {
    new RegExp(p, String(flags == null ? '' : flags))
    return { ok: true, skip: false, error: '' }
  } catch (e) {
    return { ok: false, skip: false, error: e && e.message ? e.message : '正则无效' }
  }
}

// 规则叠加主入口：按 ①查找替换 → ②正则替换 → ③前缀/后缀 → ④序号 → ⑤大小写 的固定顺序应用，
// 最后统一做非法字符清洗。ctx = { seqIndex: 该文件在参与改名列表中的序位, mtime: 修改时间毫秒 }。
// ② 中非法正则自动跳过（由 validateRegexOf 在界面红字提示），保证函数总是返回一个可用的新名。
function applyRulesOf(name, rules, ctx) {
  const c = ctx || { seqIndex: 0, mtime: null }
  let cur = String(name == null ? '' : name)

  // 1) 查找替换（字面量）
  if (rules.find) {
    cur = literalReplaceOf(cur, rules.find, rules.replace, rules.caseSensitive)
  }

  // 2) 正则替换（容错）
  if (rules.pattern) {
    const r = safeRegexReplaceOf(cur, rules.pattern, rules.flags, rules.regexRepl)
    if (r.ok) cur = r.value
  }

  // 3) 前缀 / 后缀（自动加在扩展名之前）
  if (rules.prefix || rules.suffix) {
    const parts = splitExtOf(cur)
    cur = `${rules.prefix || ''}${parts.base}${rules.suffix || ''}${parts.ext}`
  }

  // 4) 序号模板：模板定义「新的主名」（扩展名保留在原位）；{name} 引用进入本规则时的主名
  //    （即规则 1-3 处理后的结果，未启用其他规则时即原名 base），因此与前序规则可自然叠加；
  //    若模板未引用 {name}，主名会被模板整体替换（如模板 '{n}' 即改为纯数字编号）。
  if (rules.seqTemplate && String(rules.seqTemplate).trim()) {
    const width = Math.min(6, Math.max(1, Math.floor(Number(rules.seqWidth) || 2)))
    const n = (Number(rules.seqStart) || 0) + (Number(c.seqIndex) || 0) * (Number(rules.seqStep) || 1)
    const curBase = splitExtOf(cur).base
    const seqText = renderSeqTemplateOf(rules.seqTemplate, {
      n,
      width,
      name: curBase,
      date: formatDateOf(c.mtime)
    })
    const parts = splitExtOf(cur)
    cur = `${seqText}${parts.ext}`
  }

  // 5) 大小写（仅 base，扩展名保持原样）
  if (rules.caseMode && rules.caseMode !== 'none') {
    const parts = splitExtOf(cur)
    cur = `${applyCaseOf(parts.base, rules.caseMode)}${parts.ext}`
  }

  // 6) 非法字符清洗（\/:*?"<>| → _）
  return sanitizeNameOf(cur)
}

// 冲突检测：pairs = [{ id, oldName, newName, changed, participates }]，occupiedNames 为目录内
// 不参与改名条目的名字集合（子目录名、超上限未列出的文件名等）。命中两类冲突：
// ① 互相撞名——多条规则产物得到同一个新名；② 目录撞名——新名等于目录内某个现有名字
// （保守策略：即便该名字的文件自身也在被改名，也先判冲突，需分两批改名）。
// 返回 [{ id, newName, reason }]。
function detectCollisionsOf(pairs, occupiedNames) {
  const extra = occupiedNames instanceof Set ? occupiedNames : new Set(occupiedNames || [])
  const newCount = new Map()
  for (const p of pairs) {
    if (!p || !p.changed || !p.newName) continue
    newCount.set(p.newName, (newCount.get(p.newName) || 0) + 1)
  }
  const oldNames = new Set(pairs.filter((p) => p && p.changed).map((p) => p.oldName))
  const out = []
  for (const p of pairs) {
    if (!p || !p.changed || !p.newName || p.newName === p.oldName) continue
    if ((newCount.get(p.newName) || 0) > 1) {
      out.push({ id: p.id, newName: p.newName, reason: '与另一条改名结果的新名相同（互相撞名）' })
      continue
    }
    if (oldNames.has(p.newName)) {
      out.push({ id: p.id, newName: p.newName, reason: '与目录内其他文件的现有名称冲突' })
      continue
    }
    if (extra.has(p.newName)) {
      out.push({ id: p.id, newName: p.newName, reason: '与目录内子目录或未列出文件撞名' })
    }
  }
  return out
}

// 原名/新名差异片段：找出公共前缀与公共后缀，中间即变化部分（供预览高亮）
function diffSegmentsOf(oldName, newName) {
  const s = String(oldName == null ? '' : oldName)
  const t = String(newName == null ? '' : newName)
  let start = 0
  while (start < s.length && start < t.length && s[start] === t[start]) start++
  let endS = s.length
  let endT = t.length
  while (endS > start && endT > start && s[endS - 1] === t[endT - 1]) { endS--; endT-- }
  return { prefix: s.slice(0, start), oldMid: s.slice(start, endS), newMid: t.slice(start, endT), suffix: s.slice(endS) }
}

// 字节数人性化显示（null/非法值显示为 —，0 显示为 0 B）
function formatSizeOf(bytes) {
  if (bytes == null) return '—'
  const n = Number(bytes)
  if (!isFinite(n) || n < 0) return '—'
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let v = n
  let i = -1
  do { v /= 1024; i++ } while (v >= 1024 && i < units.length - 1)
  return `${v >= 100 ? Math.round(v) : v.toFixed(1)} ${units[i]}`
}

// FSA 错误名 → 中文友好提示
function friendlyFsaErrorOf(e) {
  const name = e && e.name ? e.name : ''
  if (name === 'NotAllowedError') return '授权被拒绝：目录访问权限仅本次会话有效，请重新选择目录并在浏览器弹窗中允许访问'
  if (name === 'NotFoundError') return '文件不存在：可能已被移动、删除或再次改名'
  if (name === 'NoModificationAllowedError' || name === 'InvalidModificationError') return '无法改名：目标名称已被占用或文件被系统锁定'
  if (name === 'TypeMismatchError') return '目标名称与现有文件夹冲突'
  if (name === 'SecurityError') return '安全限制：请确认页面通过 HTTPS 访问且已授予目录权限'
  if (name === 'NoRenameSupport') return e && e.message ? e.message : '当前浏览器不支持 rename()，需 Chrome/Edge 111+ 或 Opera'
  if (name === 'AbortError') return '已取消操作'
  return e && e.message ? e.message : '未知错误'
}

// ---------- 页面状态 ----------
const seoContentVisible = ref(true)

// SSR 安全：FSA 能力在 onMounted 时探测，避免 SSR/客户端水合不一致
const fsApiAvailable = ref(true)
const renameSupported = ref(true)

function defaultRules() {
  return {
    find: '', replace: '', caseSensitive: false,
    pattern: '', flags: 'gi', regexRepl: '',
    prefix: '', suffix: '',
    seqTemplate: '', seqStart: 1, seqStep: 1, seqWidth: 2,
    caseMode: 'none'
  }
}
const rules = reactive(defaultRules())

const dirHandle = ref(null)   // FileSystemDirectoryHandle（浅存即可，仅会话内使用）
const dirName = ref('')
const canWrite = ref(false)
const includeSubdirs = ref(false)
const files = ref([])         // [{ id, handle, depth, relPath, name, size, mtime, frozen }]
const topEntryNames = ref(new Set()) // 顶层全部条目名（含超上限文件与子目录名），供撞名检测
const truncated = ref(false)
const scanning = ref(false)
const scanError = ref('')
const scanWarn = ref('')

const executing = ref(false)
const undoing = ref(false)
const execResults = ref({})   // id → { status: 'ok'|'error', msg }
const execSummary = ref(null) // { total, success, fail }
const undoStack = ref([])     // [{ handle, oldName, newName }]，仅本次会话有效
const undoResults = ref([])   // [{ name, ok, msg }]

const subCount = computed(() => files.value.filter((f) => f.depth > 0).length)

const regexState = computed(() => validateRegexOf(rules.pattern, rules.flags))

// 预览行推导：顶层文件应用规则（frozen 行为已改名文件，固定显示不再叠加规则），
// 子目录文件仅列出，不参与改名；随后整体做撞名检测。
const previewRows = computed(() => {
  const rows = []
  let seqIdx = 0
  for (const f of files.value) {
    const participates = f.depth === 0
    if (!participates) {
      rows.push({
        id: f.id, handle: f.handle, relPath: f.relPath,
        oldName: f.name, newName: f.name, size: f.size, mtime: f.mtime,
        participates, frozen: false, changed: false,
        collision: false, collisionReason: '',
        seg: diffSegmentsOf(f.name, f.name),
        exec: null
      })
      continue
    }
    const newName = f.frozen ? f.name : applyRulesOf(f.name, rules, { seqIndex: seqIdx, mtime: f.mtime })
    seqIdx++
    const changed = newName !== f.name
    rows.push({
      id: f.id, handle: f.handle, relPath: f.relPath,
      oldName: f.name, newName, size: f.size, mtime: f.mtime,
      participates, frozen: f.frozen, changed,
      collision: false, collisionReason: '',
      seg: diffSegmentsOf(f.name, newName),
      exec: execResults.value[f.id] || null
    })
  }
  const collisions = detectCollisionsOf(rows.filter((r) => r.participates), topEntryNames.value)
  if (collisions.length) {
    const byId = new Map(collisions.map((c) => [c.id, c]))
    for (const r of rows) {
      const c = byId.get(r.id)
      if (c) { r.collision = true; r.collisionReason = c.reason }
    }
  }
  return rows
})

const statTotal = computed(() => previewRows.value.length)
const statRename = computed(() => previewRows.value.filter((r) => r.participates && r.changed).length)
const statCollide = computed(() => previewRows.value.filter((r) => r.collision).length)

const canExecute = computed(() =>
  !!dirHandle.value &&
  canWrite.value &&
  renameSupported.value &&
  !executing.value &&
  statRename.value > 0 &&
  statCollide.value === 0
)

const canUndo = computed(() => !!dirHandle.value && canWrite.value && !undoing.value && undoStack.value.length > 0)

const executeBlockReason = computed(() => {
  if (!dirHandle.value) return ''
  if (!renameSupported.value) return '当前浏览器的文件句柄不支持 rename()（需 Chrome/Edge 111+ 或 Opera），无法执行改名，仅可预览。'
  if (!canWrite.value) return '未授予写入权限，无法执行改名；请重新选择目录并在弹窗中允许写入。'
  if (executing.value) return '正在执行改名…'
  if (statCollide.value > 0) return `存在 ${statCollide.value} 处改名冲突：请调整规则，或先改走冲突文件再分批执行。`
  if (statRename.value === 0) return '当前规则没有产生任何变化：填写或调整左侧规则后再执行。'
  return ''
})

// ---------- 目录扫描（FSA，仅在用户点击回调 / 其派生的异步流程中执行） ----------
// TODO(递归重命名)：FSA 的 handle.rename 对子目录内文件同样可用，后续版本把规则应用与执行
// 范围扩展到 depth > 0 的文件；本版本按规格仅对顶层（depth === 0）文件执行改名。
async function scanDirectory() {
  const dir = dirHandle.value
  if (!dir) return
  scanning.value = true
  scanError.value = ''
  scanWarn.value = ''
  try {
    const records = []
    const topNames = new Set()
    let truncatedLocal = false
    const walk = async (dirRef, prefix, depth) => {
      if (depth > MAX_SCAN_DEPTH) return
      for await (const entry of dirRef.values()) {
        if (depth === 0) topNames.add(entry.name)
        if (entry.kind === 'directory') {
          // 含子目录时递归枚举列出，但改名仅对顶层执行（见上方 TODO）
          if (includeSubdirs.value && records.length < MAX_FILES) {
            await walk(entry, `${prefix}${entry.name}/`, depth + 1)
          }
          continue
        }
        if (records.length >= MAX_FILES) { truncatedLocal = true; continue }
        let file = null
        try { file = await entry.getFile() } catch (err) { file = null }
        records.push({
          id: `${prefix}${entry.name}`,
          handle: entry,
          depth,
          relPath: prefix,
          name: entry.name,
          size: file ? file.size : null,
          mtime: file ? file.lastModified : null,
          frozen: false
        })
      }
    }
    await walk(dir, '', 0)
    files.value = records
    topEntryNames.value = topNames
    truncated.value = truncatedLocal
    if (truncatedLocal) {
      scanWarn.value = `文件数量超过 ${MAX_FILES} 个上限：仅列出前 ${MAX_FILES} 个（其余文件的名字已计入撞名检测，但不会出现在列表中），请分批改名。`
    }
    execResults.value = {}
  } catch (e) {
    scanError.value = `扫描目录失败：${friendlyFsaErrorOf(e)}`
  } finally {
    scanning.value = false
  }
}

async function pickDirectory() {
  if (!fsApiAvailable.value) return
  let dir = null
  try {
    // FSA 入口必须在用户手势回调中调用：本函数仅由「选择文件夹」按钮触发
    dir = await window.showDirectoryPicker({ mode: 'readwrite' })
  } catch (e) {
    if (e && e.name === 'AbortError') {
      scanWarn.value = '已取消选择目录。'
      return
    }
    scanError.value = `无法打开目录选择器：${friendlyFsaErrorOf(e)}`
    return
  }
  // 读写权限确认（旧版 Chromium 会忽略 mode 选项，这里统一兜底申请 readwrite）
  try {
    const permOpts = { mode: 'readwrite' }
    let perm = dir.queryPermission ? await dir.queryPermission(permOpts) : 'granted'
    if (perm !== 'granted' && dir.requestPermission) {
      perm = await dir.requestPermission(permOpts)
    }
    canWrite.value = perm === 'granted'
    if (!canWrite.value) {
      scanWarn.value = '未授予写入权限：可以预览改名效果，但无法执行。请重新选择目录并在浏览器弹窗中允许写入。'
    }
  } catch (e) {
    canWrite.value = false
    scanError.value = `权限确认失败：${friendlyFsaErrorOf(e)}`
    return
  }
  dirHandle.value = dir
  dirName.value = dir.name
  // 换目录后清空旧的执行/撤销状态（撤销记录仅内存保存且只对原目录有效）
  undoStack.value = []
  execSummary.value = null
  undoResults.value = []
  await scanDirectory()
}

async function rescanDirectory() {
  if (!dirHandle.value || scanning.value) return
  await scanDirectory()
}

// ---------- 执行与撤销 ----------
async function executeRenames() {
  if (!canExecute.value) return
  executing.value = true
  execSummary.value = null
  // 计划快照：只改「顶层 + 有变化 + 无冲突 + 本次尚未成功」的行
  const plan = previewRows.value.filter((r) => r.participates && r.changed && !r.collision && !(r.exec && r.exec.status === 'ok'))
  let success = 0
  let fail = 0
  const doneRecords = []
  for (const row of plan) {
    try {
      if (typeof row.handle.rename !== 'function') {
        const err = new Error('当前浏览器的文件句柄不支持 rename()（需 Chrome/Edge 111+ 或 Opera）')
        err.name = 'NoRenameSupport'
        throw err
      }
      await row.handle.rename(row.newName)
      const f = files.value.find((x) => x.id === row.id)
      if (f) { f.name = row.newName; f.frozen = true }
      doneRecords.push({ handle: row.handle, oldName: row.oldName, newName: row.newName })
      execResults.value = { ...execResults.value, [row.id]: { status: 'ok', msg: '' } }
      success++
    } catch (e) {
      // 单个失败不中断：行内红字提示，继续下一个
      execResults.value = { ...execResults.value, [row.id]: { status: 'error', msg: friendlyFsaErrorOf(e) } }
      fail++
    }
  }
  if (doneRecords.length) undoStack.value = undoStack.value.concat(doneRecords)
  execSummary.value = { total: plan.length, success, fail }
  executing.value = false
}

// 名称是否已被目录内某条目占用（不存在返回 false；是目录等其他情况一律视为占用）
async function entryExistsIn(dirRef, name) {
  try {
    await dirRef.getFileHandle(name, { create: false })
    return true
  } catch (e) {
    return !!(e && e.name === 'NotFoundError')
  }
}

async function undoRenames() {
  if (!canUndo.value) return
  undoing.value = true
  const remaining = []
  const reports = []
  for (const rec of undoStack.value) {
    try {
      // 仅当「新名仍存在」且「原名空闲」时才反向改名，避免误改/覆盖
      const stillThere = await entryExistsIn(dirHandle.value, rec.newName)
      if (!stillThere) {
        reports.push({ name: rec.oldName, ok: false, msg: '改名后的文件已不存在（可能被移动或再次改名），已跳过' })
        remaining.push(rec)
        continue
      }
      const oldFree = !(await entryExistsIn(dirHandle.value, rec.oldName))
      if (!oldFree) {
        reports.push({ name: rec.oldName, ok: false, msg: '原名已被其他文件占用，已跳过' })
        remaining.push(rec)
        continue
      }
      await rec.handle.rename(rec.oldName)
      const f = files.value.find((x) => x.handle === rec.handle)
      if (f) { f.name = rec.oldName; f.frozen = false }
      reports.push({ name: rec.oldName, ok: true, msg: '' })
    } catch (e) {
      reports.push({ name: rec.oldName, ok: false, msg: friendlyFsaErrorOf(e) })
      remaining.push(rec)
    }
  }
  undoStack.value = remaining
  undoResults.value = reports
  undoing.value = false
}

// ---------- 其他操作 ----------
function clearRules() {
  Object.assign(rules, defaultRules())
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 勾选/取消「含子目录」后自动重新扫描（枚举无需用户手势，仅 showDirectoryPicker 需要）
watch(includeSubdirs, () => {
  if (dirHandle.value && !scanning.value) scanDirectory()
})

onMounted(() => {
  fsApiAvailable.value = typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
  renameSupported.value =
    typeof window !== 'undefined' &&
    typeof FileSystemFileHandle !== 'undefined' &&
    typeof FileSystemFileHandle.prototype.rename === 'function'
  addRecentTool('batch-rename-tool')
})
</script>
