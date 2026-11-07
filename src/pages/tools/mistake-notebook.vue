<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <NotebookPen class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">错题本整理器</h1>
          <p class="text-sm text-muted-foreground mt-1">按科目与错因归档，三遍法重练打卡，重练清单可导出、可 A4 打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线错题本整理工具：手动录入错题，标注科目、我的错解、正确解法与错因标签（审题错 / 概念不清 / 计算失误等），按「未掌握 → 重练通过 → 已掌握」三档推进掌握状态；
        支持按科目 / 状态 / 错因组合筛选与关键词搜索，自动生成各科目错题分布、错因占比统计条形图与本周待重练清单；
        重练清单可一键复制为纯文本（可选隐藏错解，先自测再看答案），也可按科目分组导出 A4 打印版。全部数据只保存在本机浏览器，不上传任何服务器。
      </p>
    </div>

    <!-- 页面说明条 -->
    <p class="flex items-start gap-2 text-xs leading-relaxed bg-primary/10 border border-primary/20 text-foreground rounded-lg p-3 mb-6">
      <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      <span>题目靠手打录入：把题干敲一遍本身就是一次精读，这里管理的是「筛选后真正要重练」的错题，不是拍照归档库。数据只存在这台设备的浏览器里。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左栏：录入表单 + 导出/数据管理 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Plus class="w-5 h-5 mr-2 text-primary" /> {{ editingId ? '编辑错题' : '录入错题' }}
          </h2>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">科目</label>
              <select
                v-model="formSubject"
                class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option v-for="s in SUBJECTS" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">掌握状态</label>
              <select
                v-model="formStatus"
                class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">题目描述（必填，支持多行粘贴）</label>
            <textarea
              v-model="formQuestion"
              rows="4"
              :maxlength="TEXT_MAX"
              placeholder="粘贴或敲入题干，例：解方程 2x²-3x-2=0……"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">我的错解（选填）</label>
            <textarea
              v-model="formWrong"
              rows="2"
              :maxlength="TEXT_MAX"
              placeholder="当时怎么错的：错误步骤、错误答案或错误思路"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">正确解法（建议填写，导出重练清单时展示）</label>
            <textarea
              v-model="formCorrect"
              rows="3"
              :maxlength="TEXT_MAX"
              placeholder="关键步骤、正确答案或一句话点破的思路"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">错因标签（可多选）</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="c in CAUSES"
                :key="c"
                type="button"
                @click="toggleFormCause(c)"
                class="px-2.5 py-1 rounded-lg border text-xs transition"
                :class="formCauses.includes(c)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'"
              >{{ c }}</button>
            </div>
          </div>

          <div class="flex gap-2 pt-1">
            <button
              @click="submitForm"
              class="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
            >
              <CheckCircle class="w-4 h-4 inline mr-1.5 -mt-0.5" /> {{ editingId ? '保存修改' : '加入错题本' }}
            </button>
            <button
              v-if="editingId"
              @click="cancelEdit"
              class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >取消</button>
          </div>
        </div>

        <!-- 导出 / 打印 / 清空 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 导出与打印
          </h2>
          <label class="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              v-model="exportIncludeWrong"
              type="checkbox"
              class="w-4 h-4 rounded border border-border accent-primary"
            >
            导出文本时包含「我的错解」（不勾选则只给题目与正确解法，方便先自测）
          </label>
          <button
            @click="copyExport"
            class="w-full px-3 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制重练清单文本（{{ pendingItems.length }} 题）
          </button>
          <button
            @click="startPrint"
            class="w-full px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <Printer class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> A4 打印（当前筛选 {{ filteredItems.length }} 题，按科目分组）
          </button>
          <template v-if="confirmClear">
            <div class="flex gap-2">
              <button
                @click="clearAll"
                class="flex-1 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition"
              >确认清空全部 {{ mistakes.length }} 条</button>
              <button
                @click="confirmClear = false"
                class="px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs text-foreground transition"
              >取消</button>
            </div>
          </template>
          <button
            v-else
            @click="askClearAll"
            class="w-full px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition"
          >
            <Trash2 class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> 清空全部数据
          </button>
        </div>
      </div>

      <!-- 右栏（占两列）：统计卡 + 筛选与列表 + 本周待重练 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 统计卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <BarChart class="w-5 h-5 mr-2 text-primary" /> 错题统计
            </h2>
            <span class="text-xs text-muted-foreground">共 {{ mistakes.length }} 条</span>
          </div>

          <div v-if="mistakes.length" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 各科目错题数条形 -->
            <div>
              <p class="text-xs font-medium text-muted-foreground mb-2">各科目错题数</p>
              <div v-if="subjectStats.length" class="space-y-2">
                <div v-for="row in subjectStats" :key="row.subject">
                  <div class="flex items-center justify-between text-xs mb-0.5">
                    <span class="text-foreground">{{ row.subject }}</span>
                    <span class="text-muted-foreground">{{ row.count }} 题</span>
                  </div>
                  <div class="h-2 bg-muted rounded-full overflow-hidden">
                    <div class="h-full bg-primary rounded-full transition-all" :style="{ width: row.width + '%' }"></div>
                  </div>
                </div>
              </div>
              <p v-else class="text-xs text-muted-foreground">暂无数据</p>
            </div>

            <!-- 各错因占比条形 -->
            <div>
              <p class="text-xs font-medium text-muted-foreground mb-2">错因占比（按标签次数）</p>
              <div v-if="causeStats.length" class="space-y-2">
                <div v-for="row in causeStats" :key="row.cause">
                  <div class="flex items-center justify-between text-xs mb-0.5">
                    <span class="text-foreground">{{ row.cause }}</span>
                    <span class="text-muted-foreground">{{ row.count }} 次 · {{ row.pct }}%</span>
                  </div>
                  <div class="h-2 bg-muted rounded-full overflow-hidden">
                    <div class="h-full bg-primary/70 rounded-full transition-all" :style="{ width: row.width + '%' }"></div>
                  </div>
                </div>
              </div>
              <p v-else class="text-xs text-muted-foreground">暂无数据</p>
            </div>
          </div>

          <div v-else class="py-6 text-center text-sm text-muted-foreground">
            错题本还是空的：录入第一条错题后，这里会生成科目分布与错因占比。
          </div>

          <!-- 掌握状态汇总 -->
          <div v-if="mistakes.length" class="mt-5 pt-4 border-t border-border">
            <div class="flex items-center justify-between text-xs mb-1.5">
              <span class="text-muted-foreground">掌握进度：已掌握 {{ masteredCount }} / {{ mistakes.length }}</span>
              <span class="text-muted-foreground">重练通过 {{ rePassedCount }} · 未掌握 {{ unmasteredCount }}</span>
            </div>
            <div class="flex h-2 rounded-full overflow-hidden bg-muted">
              <div class="h-full bg-green-500" :style="{ width: masteredPct + '%' }"></div>
              <div class="h-full bg-amber-500" :style="{ width: rePassedPct + '%' }"></div>
              <div class="h-full bg-red-500/70" :style="{ width: unmasteredPct + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- 本周待重练 -->
        <div
          v-if="pendingItems.length"
          class="p-4 bg-primary/10 border border-primary/30 rounded-lg"
        >
          <div class="flex items-center gap-2 mb-2">
            <Clock class="w-5 h-5 text-primary" />
            <span class="text-lg font-bold text-foreground">本周待重练 {{ pendingItems.length }} 条</span>
          </div>
          <p class="text-xs text-muted-foreground mb-2">三遍法口径：本周录入的未掌握/重练通过条目 + 往周仍未掌握的条目（重练通过的往周条目留到考前再过一遍）。</p>
          <div class="space-y-1">
            <div v-for="item in pendingItems.slice(0, 8)" :key="item.id" class="flex items-center gap-2 text-sm">
              <span class="px-1.5 py-0.5 text-[10px] rounded bg-primary text-primary-foreground whitespace-nowrap">{{ item.subject }}</span>
              <span class="text-foreground truncate flex-1" :title="item.question">{{ item.question }}</span>
              <span class="px-1.5 py-0.5 text-[10px] rounded border whitespace-nowrap" :class="statusBadgeClass[item.status]">{{ item.status }}</span>
            </div>
          </div>
          <p v-if="pendingItems.length > 8" class="text-xs text-muted-foreground mt-2">还有 {{ pendingItems.length - 8 }} 条，见下方列表（筛选「未掌握」）。</p>
        </div>

        <!-- 筛选条 + 列表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-lg font-semibold flex items-center mr-auto">
              <NotebookPen class="w-5 h-5 mr-2 text-primary" /> 错题列表
            </h2>
            <select
              v-model="filterSubject"
              class="border border-border bg-background rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">全部科目</option>
              <option v-for="s in SUBJECTS" :key="s" :value="s">{{ s }}</option>
            </select>
            <select
              v-model="filterStatus"
              class="border border-border bg-background rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">全部状态</option>
              <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
            </select>
            <select
              v-model="filterCause"
              class="border border-border bg-background rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">全部错因</option>
              <option v-for="c in CAUSES" :key="c" :value="c">{{ c }}</option>
            </select>
            <div class="relative">
              <Search class="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="filterKeyword"
                type="text"
                placeholder="搜题目 / 解法"
                class="border border-border bg-background rounded-lg pl-8 pr-3 py-1.5 w-40 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="!mistakes.length" class="py-10 text-center">
            <NotebookPen class="w-10 h-10 text-primary/30 mx-auto mb-3" />
            <p class="text-sm text-muted-foreground">错题本还是空的，在左侧录入第一条错题吧。</p>
          </div>

          <!-- 筛选后为空 -->
          <div v-else-if="!filteredItems.length" class="py-8 text-center">
            <p class="text-sm text-muted-foreground">当前筛选条件下没有错题，换个条件或清空搜索词试试。</p>
          </div>

          <!-- 列表卡片 -->
          <div v-else class="space-y-3">
            <div
              v-for="item in viewList"
              :key="item.id"
              class="bg-muted/50 rounded-xl p-4 border border-border space-y-2"
            >
              <div class="flex items-start gap-2">
                <span class="px-1.5 py-0.5 text-[10px] rounded bg-primary text-primary-foreground whitespace-nowrap mt-0.5">{{ item.subject }}</span>
                <p class="text-sm font-medium text-foreground flex-1 whitespace-pre-wrap break-words">{{ item.question }}</p>
                <span class="px-2 py-0.5 rounded-full border text-[10px] font-medium flex-shrink-0" :class="statusBadgeClass[item.status]">
                  {{ item.status }}
                </span>
              </div>

              <div class="flex items-center gap-1.5 flex-wrap">
                <span
                  v-for="c in item.causes"
                  :key="c"
                  class="px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground border border-border"
                >{{ c }}</span>
                <span class="text-[10px] text-muted-foreground ml-auto">录入 {{ item.createdAt }}</span>
              </div>

              <!-- 三档掌握进度（未掌握 1/3 → 重练通过 2/3 → 已掌握 3/3） -->
              <div class="flex items-center gap-2">
                <div class="flex gap-1 flex-1">
                  <span
                    v-for="s in 3"
                    :key="s"
                    class="h-1.5 flex-1 rounded-full"
                    :class="s <= item.stage ? 'bg-primary' : 'bg-muted'"
                  ></span>
                </div>
                <span class="text-[10px] text-muted-foreground whitespace-nowrap">重练进度 {{ item.stage }}/3</span>
              </div>

              <div v-if="item.wrong" class="text-xs text-muted-foreground">
                <span class="font-medium text-red-500/90">错解：</span><span class="whitespace-pre-wrap break-words">{{ item.wrong }}</span>
              </div>
              <div v-if="item.correct" class="text-xs text-muted-foreground">
                <span class="font-medium text-green-600">正解：</span><span class="whitespace-pre-wrap break-words">{{ item.correct }}</span>
              </div>

              <div class="flex items-center gap-2 pt-1">
                <button
                  v-if="item.status !== '已掌握'"
                  @click="markPassed(item.id)"
                  class="px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition"
                >重练通过</button>
                <button
                  v-if="item.status !== '已掌握'"
                  @click="markMastered(item.id)"
                  class="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs text-foreground transition"
                >已掌握</button>
                <button
                  @click="openEdit(item)"
                  class="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs text-muted-foreground transition"
                >编辑</button>
                <template v-if="pendingDelete === item.id">
                  <button
                    @click="removeItem(item.id)"
                    class="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition"
                  >确认删除</button>
                  <button
                    @click="pendingDelete = null"
                    class="px-2 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground transition"
                    aria-label="取消删除"
                  ><X class="w-3.5 h-3.5" /></button>
                </template>
                <button
                  v-else
                  @click="pendingDelete = item.id"
                  class="ml-auto px-2 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground transition"
                  aria-label="删除这条错题"
                ><Trash2 class="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- A4 打印区（仅打印时可见，按科目分组表格） -->
    <div v-if="printMode" class="print-only">
      <h2 class="print-title">错题重练清单（{{ printDate }}）</h2>
      <p class="print-sub">共 {{ filteredItems.length }} 题 · 按科目分组 · 三遍法：当天重做 → 周末重练 → 考前过一遍</p>
      <div v-for="group in printGroups" :key="group.subject" class="print-group">
        <h3 class="print-group-title">{{ group.subject }}（{{ group.items.length }} 题）</h3>
        <table class="print-table">
          <thead>
            <tr>
              <th class="w-8">序号</th>
              <th>题目描述</th>
              <th class="w-20">错因</th>
              <th>我的错解</th>
              <th>正确解法</th>
              <th class="w-16">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in group.items" :key="item.id">
              <td>{{ idx + 1 }}</td>
              <td>{{ item.question }}</td>
              <td>{{ item.causes.join('、') || '—' }}</td>
              <td>{{ item.wrong || '—' }}</td>
              <td>{{ item.correct || '—' }}</td>
              <td>{{ item.status }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12 no-print">
      <summary class="text-xl font-bold text-foreground cursor-pointer select-none flex items-center">
        <span class="text-primary mr-2">#</span> 错题本怎么整理才有效？录入规范与三遍法（FAQ）
      </summary>

      <div class="mt-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          错题本整理器是一款纯本地的在线错题归档工具。每条错题记录科目、题目描述、我的错解、正确解法、错因标签与掌握状态三档
          （未掌握 → 重练通过 → 已掌握，对应三遍法的三次重练）；工具自动统计各科目错题分布与错因占比，并按周生成「本周待重练」清单，
          支持关键词搜索与科目 / 状态 / 错因组合筛选，重练清单可复制为纯文本或按科目分组打印成 A4 练习卷。
        </p>

        <h3 class="text-lg font-semibold text-foreground">错题本怎么整理才有效：三遍法</h3>
        <p>
          一道错题只抄一遍、看一遍答案，几乎等于没整理。有效的错题本靠的是「三遍法」把每道题压进长期记忆：
        </p>
        <ol class="list-decimal list-inside space-y-2">
          <li><span class="text-foreground font-medium">第一遍 · 当天重做</span>：当天合上答案，把这道题从零再做一遍。做出来才算「重练通过」，只是看懂不算——看懂是「理解」，做出是「掌握」，两者隔着一道坎。</li>
          <li><span class="text-foreground font-medium">第二遍 · 周末重练</span>：周末把这周标着「重练通过」的题再做一遍，挡住遗忘曲线的下坠。仍卡壳的打回「未掌握」，下周继续。</li>
          <li><span class="text-foreground font-medium">第三遍 · 考前过一遍</span>：考前把「重练通过」与「已掌握」的题快速过一遍，只看题干想思路，能想通就跳过，想不通再动笔。</li>
        </ol>
        <p>
          本工具的三档状态正是三遍法的打卡位：录入默认「未掌握」，当天重做成功点「重练通过」，周末重练仍稳就点「已掌握」；
          每张卡片下方的三段进度条显示当前推进到第几遍。
        </p>

        <h3 class="text-lg font-semibold text-foreground">和拍照错题 App 怎么分工？</h3>
        <p>
          拍照 App 擅长「采集」：拍卷子、裁题、OCR 存档，适合把海量原始错题先囤起来。但它管到「存下来」就结束了，
          而错题本真正的价值在「筛出来之后」——一道题值不值得进错题本，判据是你愿不愿意为它再花三次重练的时间。
          建议的分工是：平时用拍照 App 做原始归档，每周日翻一遍本周的拍照记录，只挑出真正值得重练的题（通常十道以内），
          手打录入本工具并走完三遍法。手打题干的过程本身会逼你逐字读题，很多人在这一步就发现了当时漏看的条件。
        </p>

        <h3 class="text-lg font-semibold text-foreground">「本周待重练」是怎么算的？</h3>
        <p>
          口径很朴素：本周录入、状态还不是「已掌握」的错题，加上往周录入、至今仍是「未掌握」的错题。
          往周已经「重练通过」的条目不进本周清单——它们按三遍法属于「考前过一遍」的批次，别让周清单无限膨胀。
        </p>

        <h2 class="text-2xl font-bold text-foreground pt-2">常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h4 class="text-base font-semibold text-foreground">数据存在哪？会不会丢？</h4>
            <p class="mt-1">
              只存在这台设备浏览器的 localStorage 里，不联网、不上传、不需要注册。刷新或重开页面不会丢，
              但清除浏览器数据、无痕模式或换设备不会同步。重要错题建议用 A4 打印或复制文本留底。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">导出文本时「隐藏错解」有什么用？</h4>
            <p class="mt-1">
              不勾选「包含我的错解」时，导出的清单只有题目和正确解法，把正确解法贴到题目背面或单独放页尾，
              就能当一份先做题、后对答案的自测卷使用。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">错因标签最多选几个？选多了有用吗？</h4>
            <p class="mt-1">
              没有硬性上限，但建议每题选 1-2 个最主要的。错因占比图的作用是暴露系统性弱点——
              如果「审题错」长期占大头，该练的不是题量，而是读题时圈关键词的习惯；如果「计算失误」居高不下，
              优先修草稿习惯和验算动作，而不是刷新题。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">A4 打印会打印出什么？</h4>
            <p class="mt-1">
              按当前筛选结果、以科目分组生成表格（题目 / 错因 / 错解 / 正解 / 状态），浏览器打印对话框里可选纵向或横向、
              调整缩放。想给孩子做一份「只留题干」的空白重练卷，可以先不填正确解法再打印。
            </p>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground">来源与延伸</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>三遍法的时间设计参考艾宾浩斯遗忘曲线「先快后慢、及时巩固」的规律，间隔重排可配合 <a href="/tools/ebbinghaus-planner/" class="text-primary hover:underline">艾宾浩斯复习排期器</a> 生成日历。</li>
          <li>错因分类（审题 / 概念 / 计算 / 方法 / 粗心 / 时间）为常见教辅与学习方法的通用品类口径，非临床或学术标准量表。</li>
        </ul>
      </div>
    </details>

    <RelatedTools :currentToolId="'mistake-notebook'" :category="'others'" class="no-print" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  NotebookPen, Plus, Trash2, Search, Printer, Copy,
  X, Info, CheckCircle, Clock, BarChart
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '错题本整理器 - 在线错题归档与重练清单打印工具',
  description: '免费在线错题本整理工具，按科目与错因标签归档错题，三遍法推进未掌握/重练通过/已掌握状态，自动统计科目分布与错因占比，生成本周待重练清单，支持导出文本与 A4 按科目分组打印，数据仅存本地浏览器',
  keywords: '错题本, 错题整理, 错题集, 重练清单, 错因分类, 错题打印, 学习工具',
  author: '有条工具',
  ogTitle: '错题本整理器 - 在线错题归档与重练清单打印工具 | 有条工具',
  ogDescription: '按科目与错因归档错题，三遍法重练打卡，统计科目分布与错因占比，重练清单可导出可打印。',
  ogUrl: 'https://www.util.cn/tools/mistake-notebook',
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
          name: '错题本整理器',
          url: 'https://www.util.cn/tools/mistake-notebook',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['科目与错因标签归档', '未掌握/重练通过/已掌握三档状态', '科目分布与错因占比统计条形图', '本周待重练清单', '重练清单导出文本（可选隐藏错解）', 'A4 按科目分组打印', '关键词搜索与组合筛选', '数据仅存本机浏览器']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others' },
            { '@type': 'ListItem', position: 3, name: '错题本整理器', item: 'https://www.util.cn/tools/mistake-notebook' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '错题本怎么整理才有效？',
              acceptedAnswer: { '@type': 'Answer', text: '用三遍法：当天合上答案重做一遍标「重练通过」，周末再重练一遍仍稳标「已掌握」，考前把通过和掌握的题快速过一遍思路。只看懂不算掌握，做出才算。' }
            },
            {
              '@type': 'Question',
              name: '和拍照错题 App 怎么分工？',
              acceptedAnswer: { '@type': 'Answer', text: '拍照 App 负责采集归档海量原始错题；本工具负责筛选后真正要重练的少量错题，手打录入本身是一次精读，再用三遍法重练闭环。' }
            },
            {
              '@type': 'Question',
              name: '数据存在哪？会不会丢？',
              acceptedAnswer: { '@type': 'Answer', text: '只存这台设备浏览器的 localStorage，不上传不注册。清缓存、无痕模式或换设备不同步，重要错题建议打印或导出文本留底。' }
            },
            {
              '@type': 'Question',
              name: '本周待重练清单是怎么算的？',
              acceptedAnswer: { '@type': 'Answer', text: '本周录入且未掌握/重练通过的条目，加上往周至今仍未掌握的条目；往周已重练通过的按三遍法留到考前过一遍，不进本周清单。' }
            }
          ]
        }
      ]
    })
  }]
})

onMounted(() => {
  addRecentTool('mistake-notebook')
  todayIso.value = localDateIso()
  mistakes.value = loadStored()
})

// ---------- 纯逻辑（单测区开始） ----------
const SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '其他']
const CAUSES = ['审题错', '概念不清', '计算失误', '方法不会', '粗心', '时间不够']
const STATUSES = ['未掌握', '重练通过', '已掌握']
const MAX_ITEMS = 500
const TEXT_MAX = 2000
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isValidIso(iso) {
  return typeof iso === 'string' && ISO_DATE_RE.test(iso)
}

// 本周区间（周一至周日）：传入任意 ISO 日期，返回该日期所在周的 start/end
function weekRangeOf(iso) {
  if (!isValidIso(iso)) return { start: '', end: '' }
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const back = (dt.getDay() + 6) % 7 // 周一为一周起点
  const pad = (n) => String(n).padStart(2, '0')
  const fmt = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const start = new Date(y, m - 1, d - back)
  const end = new Date(y, m - 1, d - back + 6)
  return { start: fmt(start), end: fmt(end) }
}

// 掌握阶段（1/3 未掌握，2/3 重练通过，3/3 已掌握）；非法状态按未掌握计
function stageOfStatus(status) {
  const idx = STATUSES.indexOf(status)
  return idx < 0 ? 1 : idx + 1
}

// 本周待重练判定：未掌握/重练通过 且（本周录入，或往周录入但仍未掌握）
function isPendingRepractice(item, start, end) {
  if (!item || item.status === '已掌握' || !isValidIso(item.createdAt)) return false
  if (item.createdAt > end) return false
  if (item.createdAt >= start) return true
  return item.status === '未掌握'
}

function pendingRepracticeOf(items, start, end) {
  if (!isValidIso(start) || !isValidIso(end)) return []
  return items.filter((it) => isPendingRepractice(it, start, end))
}

// 组合筛选：科目 + 状态 + 错因 + 关键词（空条件表示不启用）
function filterMistakes(items, opts) {
  const subject = (opts && opts.subject) || ''
  const status = (opts && opts.status) || ''
  const cause = (opts && opts.cause) || ''
  const keyword = ((opts && opts.keyword) || '').trim().toLowerCase()
  return items.filter((it) => {
    if (subject && it.subject !== subject) return false
    if (status && it.status !== status) return false
    if (cause && !(Array.isArray(it.causes) && it.causes.includes(cause))) return false
    if (keyword) {
      const hay = `${it.question}\n${it.wrong}\n${it.correct}`.toLowerCase()
      if (!hay.includes(keyword)) return false
    }
    return true
  })
}

// 各科目错题数（仅列有数据的科目，按 SUBJECTS 固定顺序），width 为条形宽度百分比
function subjectStatsOf(items) {
  const counts = {}
  for (const it of items) {
    const s = SUBJECTS.includes(it.subject) ? it.subject : '其他'
    counts[s] = (counts[s] || 0) + 1
  }
  const max = Math.max(0, ...Object.values(counts))
  return SUBJECTS
    .filter((s) => counts[s])
    .map((s) => ({ subject: s, count: counts[s], width: max ? Math.round(counts[s] / max * 100) : 0 }))
}

// 各错因标签次数与占比（分母为全部标签次数），width 为条形宽度百分比
function causeStatsOf(items) {
  const counts = {}
  let total = 0
  for (const it of items) {
    for (const c of (Array.isArray(it.causes) ? it.causes : [])) {
      if (!CAUSES.includes(c)) continue
      counts[c] = (counts[c] || 0) + 1
      total += 1
    }
  }
  return CAUSES
    .filter((c) => counts[c])
    .map((c) => ({
      cause: c,
      count: counts[c],
      pct: total ? Math.round(counts[c] / total * 100) : 0,
      width: counts[c] && total ? Math.round(counts[c] / total * 100) : 0
    }))
}

// 掌握状态汇总
function statusSummaryOf(items) {
  const summary = { 未掌握: 0, 重练通过: 0, 已掌握: 0 }
  for (const it of items) {
    if (summary[it.status] === undefined) summary['未掌握'] += 1
    else summary[it.status] += 1
  }
  return summary
}

// 重练清单导出文本（可选包含错解）
function exportTextOf(items, includeWrong, todayIso) {
  const lines = []
  lines.push(`错题重练清单${todayIso ? `（${todayIso}）` : ''}`)
  lines.push(`共 ${items.length} 题 · 三遍法：当天重做 → 周末重练 → 考前过一遍`)
  if (!items.length) return lines.join('\n')
  lines.push('')
  items.forEach((it, i) => {
    lines.push(`【${i + 1}】${it.subject} · 错因：${(it.causes || []).join('、') || '未标注'} · 录入：${it.createdAt} · ${it.status}`)
    lines.push(`题目：${it.question}`)
    if (includeWrong && it.wrong) lines.push(`我的错解：${it.wrong}`)
    if (it.correct) lines.push(`正确解法：${it.correct}`)
    lines.push('')
  })
  return lines.join('\n').trim()
}

// 单条清洗：非法字段丢弃或夹紧；题干为空视为非法返回 null
function normalizeMistake(raw, idx) {
  if (!raw || typeof raw !== 'object') return null
  const question = typeof raw.question === 'string' ? raw.question.trim().slice(0, TEXT_MAX) : ''
  if (!question) return null
  const status = STATUSES.includes(raw.status) ? raw.status : '未掌握'
  const causes = Array.isArray(raw.causes)
    ? Array.from(new Set(raw.causes.filter((c) => CAUSES.includes(c))))
    : []
  const createdAt = isValidIso(raw.createdAt) ? raw.createdAt : '1970-01-01'
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `m-${createdAt}-${idx}`,
    subject: SUBJECTS.includes(raw.subject) ? raw.subject : '其他',
    question,
    wrong: typeof raw.wrong === 'string' ? raw.wrong.slice(0, TEXT_MAX) : '',
    correct: typeof raw.correct === 'string' ? raw.correct.slice(0, TEXT_MAX) : '',
    causes,
    status,
    createdAt,
    updatedAt: isValidIso(raw.updatedAt) ? raw.updatedAt : ''
  }
}

// 列表清洗：过滤脏数据并裁到上限
function normalizeMistakes(list) {
  if (!Array.isArray(list)) return []
  return list.map((r, i) => normalizeMistake(r, i)).filter(Boolean).slice(0, MAX_ITEMS)
}
// ---------- 纯逻辑（单测区结束） ----------

// ---------- 页面状态 ----------
const STORAGE_KEY = 'mistake-notebook-v1'
const mistakes = ref([])
const todayIso = ref('')
const pendingDelete = ref(null)
const confirmClear = ref(false)
const editingId = ref('')
const exportIncludeWrong = ref(true)
const printMode = ref(false)
let statusTimer = null

const formSubject = ref('数学')
const formStatus = ref('未掌握')
const formQuestion = ref('')
const formWrong = ref('')
const formCorrect = ref('')
const formCauses = ref([])

const filterSubject = ref('')
const filterStatus = ref('')
const filterCause = ref('')
const filterKeyword = ref('')

const statusBadgeClass = {
  '未掌握': 'bg-red-500/10 text-red-600 border-red-500/30',
  '重练通过': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  '已掌握': 'bg-green-500/10 text-green-600 border-green-500/30'
}

// 浏览器本地日历日（仅 onMounted 调用）
function localDateIso() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function genId() {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// ---------- 存取（读只在 onMounted，写只在事件回调，均带 try/catch） ----------
function loadStored() {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return normalizeMistakes(JSON.parse(raw))
  } catch (e) {
    return []
  }
}

function persist() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mistakes.value))
  } catch (e) { /* 忽略存储异常 */ }
}

function commit(nextList) {
  mistakes.value = normalizeMistakes(nextList)
  persist()
}

// ---------- 派生数据 ----------
const week = computed(() => weekRangeOf(todayIso.value))
const filteredItems = computed(() => filterMistakes(mistakes.value, {
  subject: filterSubject.value,
  status: filterStatus.value,
  cause: filterCause.value,
  keyword: filterKeyword.value
}))
const pendingItems = computed(() => pendingRepracticeOf(mistakes.value, week.value.start, week.value.end))
const subjectStats = computed(() => subjectStatsOf(mistakes.value))
const causeStats = computed(() => causeStatsOf(mistakes.value))
const statusSummary = computed(() => statusSummaryOf(mistakes.value))

const masteredCount = computed(() => statusSummary.value['已掌握'])
const rePassedCount = computed(() => statusSummary.value['重练通过'])
const unmasteredCount = computed(() => statusSummary.value['未掌握'])

function pctOf(n, total) {
  return total ? Math.round(n / total * 100) : 0
}
const masteredPct = computed(() => pctOf(masteredCount.value, mistakes.value.length))
const rePassedPct = computed(() => pctOf(rePassedCount.value, mistakes.value.length))
const unmasteredPct = computed(() => pctOf(unmasteredCount.value, mistakes.value.length))

const viewList = computed(() => filteredItems.value.map((it) => ({ ...it, stage: stageOfStatus(it.status) })))
const printDate = computed(() => todayIso.value || '')
const printGroups = computed(() => {
  const groups = []
  for (const s of SUBJECTS) {
    const items = filteredItems.value.filter((it) => it.subject === s)
    if (items.length) groups.push({ subject: s, items })
  }
  return groups
})

// ---------- 操作 ----------
function resetForm() {
  formQuestion.value = ''
  formWrong.value = ''
  formCorrect.value = ''
  formCauses.value = []
  formStatus.value = '未掌握'
}

function toggleFormCause(c) {
  const i = formCauses.value.indexOf(c)
  if (i >= 0) formCauses.value.splice(i, 1)
  else formCauses.value.push(c)
}

function submitForm() {
  const question = formQuestion.value.trim()
  if (!question) {
    alert('请先填写题目描述')
    return
  }
  const base = {
    subject: SUBJECTS.includes(formSubject.value) ? formSubject.value : '其他',
    question,
    wrong: formWrong.value.trim(),
    correct: formCorrect.value.trim(),
    causes: formCauses.value.slice(),
    status: STATUSES.includes(formStatus.value) ? formStatus.value : '未掌握'
  }
  if (editingId.value) {
    commit(mistakes.value.map((it) => (it.id === editingId.value
      ? { ...it, ...base, updatedAt: todayIso.value }
      : it)))
    editingId.value = ''
  } else {
    if (mistakes.value.length >= MAX_ITEMS) {
      alert(`错题本已达 ${MAX_ITEMS} 条上限，请先整理删除`)
      return
    }
    commit(mistakes.value.concat({ ...base, id: genId(), createdAt: todayIso.value, updatedAt: '' }))
  }
  resetForm()
}

function openEdit(item) {
  editingId.value = item.id
  formSubject.value = item.subject
  formStatus.value = item.status
  formQuestion.value = item.question
  formWrong.value = item.wrong
  formCorrect.value = item.correct
  formCauses.value = item.causes.slice()
}

function cancelEdit() {
  editingId.value = ''
  resetForm()
}

function markPassed(id) {
  commit(mistakes.value.map((it) => (it.id === id && it.status === '未掌握'
    ? { ...it, status: '重练通过', updatedAt: todayIso.value }
    : it)))
}

function markMastered(id) {
  commit(mistakes.value.map((it) => (it.id === id && it.status !== '已掌握'
    ? { ...it, status: '已掌握', updatedAt: todayIso.value }
    : it)))
}

function removeItem(id) {
  const target = mistakes.value.find((it) => it.id === id)
  pendingDelete.value = null
  if (editingId.value === id) cancelEdit()
  commit(mistakes.value.filter((it) => it.id !== id))
  if (target) alert(`已删除「${target.question.slice(0, 12)}…」`)
}

function askClearAll() {
  if (!mistakes.value.length) {
    alert('错题本本来就是空的')
    return
  }
  confirmClear.value = true
  if (statusTimer) clearTimeout(statusTimer)
  statusTimer = setTimeout(() => { confirmClear.value = false }, 6000)
}

function clearAll() {
  confirmClear.value = false
  commit([])
}

async function copyExport() {
  const text = exportTextOf(pendingItems.value, exportIncludeWrong.value, todayIso.value)
  if (!pendingItems.value.length) {
    alert('本周没有待重练错题，先去录入或调整筛选')
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
  } catch (e) {
    alert('复制失败，请手动选择文本复制')
  }
}

async function startPrint() {
  if (!filteredItems.value.length) {
    alert('当前筛选结果为空，没有可打印的错题')
    return
  }
  printMode.value = true
  await nextTick()
  try {
    window.print()
  } catch (e) { /* 忽略 */ }
  printMode.value = false
}

onBeforeUnmount(() => {
  if (statusTimer) clearTimeout(statusTimer)
})
</script>

<style scoped>
.print-only {
  display: none;
}

@media print {
  .no-print {
    display: none !important;
  }

  .print-only {
    display: block;
  }

  .print-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .print-sub {
    font-size: 12px;
    color: #444;
    margin-bottom: 16px;
  }

  .print-group {
    margin-bottom: 14px;
    page-break-inside: avoid;
  }

  .print-group-title {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 6px;
  }

  .print-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }

  .print-table th,
  .print-table td {
    border: 1px solid #999;
    padding: 5px 6px;
    text-align: left;
    vertical-align: top;
    word-break: break-all;
  }

  .print-table th {
    background: #f0f0f0;
  }
}
</style>
