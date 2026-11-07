<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Library class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">读书清单与阅读记录</h1>
          <p class="text-sm text-muted-foreground mt-1">想读 / 在读 / 读完三档书单，在读进度与读完短评，年度统计与目标进度环</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线读书清单与阅读记录工具：按「想读 / 在读 / 读完」三档管理书单，录入书名、作者与分类（文学 / 社科 / 科技 / 经管 / 其他）；
        在读书手动更新当前页码并按日期留下进度记录，自动换算百分比进度条；读完书记星级（1-5）、一句话短评与读完日期。
        年度统计卡汇总本年读完数量、各分类占比条形与 12 个月度分布条形，设定年度目标后显示 SVG 完成进度环；
        书单可一键复制为 Markdown 表格，年度阅读报告可 A4 打印。数据全部保存在本机浏览器，不上传任何服务器。
      </p>
    </div>

    <!-- 页面说明条 -->
    <p class="flex items-start gap-2 text-xs leading-relaxed bg-primary/10 border border-primary/20 text-foreground rounded-lg p-3 mb-6">
      <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      <span>年度统计只数「读完日期」落在当年的书：去年底读完的不会挤进今年，今年才读完后补录的会算进来。数据只存在这台设备的浏览器里。</span>
    </p>

    <!-- 顶部统计卡 -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div class="bg-card border border-border rounded-lg p-4 text-center">
        <p class="text-xs text-muted-foreground mb-1">{{ currentYear || '——' }} 年读完</p>
        <p class="text-2xl font-bold text-primary">{{ currentYear ? yearStats.count : '—' }} 本</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4 text-center">
        <p class="text-xs text-muted-foreground mb-1">在读</p>
        <p class="text-2xl font-bold text-foreground">{{ readingCount }}</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4 text-center">
        <p class="text-xs text-muted-foreground mb-1">想读</p>
        <p class="text-2xl font-bold text-foreground">{{ wantCount }}</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 100 100" class="w-16 h-16" style="transform: rotate(-90deg)" role="img" aria-label="年度目标完成进度环">
              <circle cx="50" cy="50" :r="RING_R" fill="none" stroke-width="10" class="stroke-muted" />
              <circle
                cx="50" cy="50" :r="RING_R"
                fill="none"
                stroke-width="10"
                stroke-linecap="round"
                class="stroke-primary transition-all"
                :stroke-dasharray="ring.c"
                :stroke-dashoffset="ring.offset"
              />
            </svg>
            <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">{{ ringPctDisplay }}</span>
          </div>
          <div class="min-w-0">
            <label class="block text-xs text-muted-foreground mb-1">年度目标（本）</label>
            <input
              v-model.number="goalInput"
              type="number"
              min="0"
              max="1000"
              step="1"
              class="w-20 border border-border bg-background rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              @change="setGoal"
            >
            <p class="text-[10px] text-muted-foreground mt-1">已读 {{ yearStats.count }} / {{ goal > 0 ? goal : '未设' }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左栏：添加书 + 数据管理 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Plus class="w-5 h-5 mr-2 text-primary" /> 添加书
          </h2>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">书名（必填）</label>
            <input
              v-model="formTitle"
              type="text"
              maxlength="60"
              placeholder="如：三体"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">作者（选填）</label>
            <input
              v-model="formAuthor"
              type="text"
              maxlength="40"
              placeholder="如：刘慈欣"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">分类</label>
              <select
                v-model="formCategory"
                class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">初始状态</label>
              <select
                v-model="formStatus"
                class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="want">想读</option>
                <option value="reading">在读</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">总页数（选填，方便记进度）</label>
            <input
              v-model.number="formTotalPages"
              type="number"
              min="0"
              max="100000"
              step="1"
              placeholder="如：380"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
          </div>
          <button
            @click="addBook"
            class="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            <Plus class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 加入书单
          </button>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 导出与数据
          </h2>
          <button
            @click="copyMarkdown"
            class="w-full px-3 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制书单 Markdown 表格（{{ books.length }} 本）
          </button>
          <button
            @click="startPrint"
            class="w-full px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <Printer class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> 打印 {{ currentYear || '' }} 年度阅读报告
          </button>
          <template v-if="confirmSample">
            <div class="flex gap-2">
              <button
                @click="loadSamples"
                class="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium transition"
              >确认覆盖并载入示例书单</button>
              <button
                @click="confirmSample = false"
                class="px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs text-foreground transition"
              >取消</button>
            </div>
          </template>
          <button
            v-else
            @click="askSamples"
            class="w-full px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition"
          >
            <Sparkles class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> 载入示例数据（一键填充演示书单）
          </button>
          <template v-if="confirmClear">
            <div class="flex gap-2">
              <button
                @click="clearAll"
                class="flex-1 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition"
              >确认清空全部 {{ books.length }} 本</button>
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

      <!-- 右栏（占两列）：书单列表 -->
      <div class="lg:col-span-2">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-lg font-semibold flex items-center">
              <Library class="w-5 h-5 mr-2 text-primary" /> 我的书单
            </h2>
            <div class="flex rounded-lg border border-border overflow-hidden">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                class="px-3 py-1.5 text-xs font-medium transition"
                :class="activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted'"
              >{{ tab.label }}（{{ tabCount(tab.id) }}）</button>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="!books.length" class="py-10 text-center">
            <Library class="w-10 h-10 text-primary/30 mx-auto mb-3" />
            <p class="text-sm text-muted-foreground">书单还是空的：在左侧添加一本书，或点「载入示例数据」先看看效果。</p>
          </div>

          <!-- 筛选后为空 -->
          <div v-else-if="!viewBooks.length" class="py-8 text-center">
            <p class="text-sm text-muted-foreground">这个状态下暂时没有书。</p>
          </div>

          <!-- 书卡列表 -->
          <div v-else class="space-y-3">
            <div
              v-for="book in viewBooks"
              :key="book.id"
              class="bg-muted/50 rounded-xl p-4 border border-border space-y-3"
            >
              <div class="flex items-start gap-2">
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-foreground truncate" :title="book.title">{{ book.title }}</p>
                  <p class="text-xs text-muted-foreground mt-0.5">
                    {{ book.author || '佚名' }} · {{ book.category }}<span v-if="book.totalPages"> · 全书 {{ book.totalPages }} 页</span>
                  </p>
                </div>
                <span class="px-2 py-0.5 rounded-full border text-[10px] font-medium flex-shrink-0" :class="statusBadgeClass[book.status]">
                  {{ STATUS_LABELS[book.status] }}
                </span>
              </div>

              <!-- 在读：进度条 + 更新进度 -->
              <template v-if="book.status === 'reading'">
                <div>
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span class="text-muted-foreground">读到第 {{ book.currentPage }} 页</span>
                    <span class="text-foreground font-medium tabular-nums">{{ book.pct }}%</span>
                  </div>
                  <div class="h-2 bg-muted rounded-full overflow-hidden">
                    <div class="h-full bg-primary rounded-full transition-all" :style="{ width: book.pct + '%' }"></div>
                  </div>
                  <p v-if="book.lastLogText" class="text-[10px] text-muted-foreground mt-1">{{ book.lastLogText }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="quickPages[book.id]"
                    type="number"
                    min="0"
                    :max="book.totalPages || 100000"
                    placeholder="当前页码"
                    class="w-24 border border-border bg-background rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                  <button
                    @click="updateProgress(book)"
                    class="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition"
                  >记录今日进度</button>
                  <button
                    @click="openFinish(book)"
                    class="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs text-foreground transition"
                  >读完了</button>
                </div>

                <!-- 读完登记面板 -->
                <div v-if="finishPanelId === book.id" class="bg-background border border-border rounded-lg p-3 space-y-2">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs text-muted-foreground mr-1">星级：</span>
                    <button
                      v-for="s in 5"
                      :key="s"
                      @click="finishForm.rating = s"
                      class="p-0.5"
                      :aria-label="`${s} 星`"
                    >
                      <Star
                        class="w-5 h-5"
                        :class="s <= finishForm.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/40'"
                      />
                    </button>
                  </div>
                  <input
                    v-model="finishForm.note"
                    type="text"
                    maxlength="100"
                    placeholder="一句话短评（选填，最多 100 字）"
                    class="w-full border border-border bg-background rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                  <div class="flex items-center gap-2">
                    <label class="text-xs text-muted-foreground whitespace-nowrap">读完日期</label>
                    <input
                      v-model="finishForm.date"
                      type="date"
                      class="border border-border bg-background rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                  </div>
                  <div class="flex gap-2">
                    <button
                      @click="confirmFinish(book.id)"
                      class="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium transition"
                    >确认读完</button>
                    <button
                      @click="finishPanelId = null"
                      class="px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs text-foreground transition"
                    >取消</button>
                  </div>
                </div>
              </template>

              <!-- 读完：星级 + 短评 -->
              <template v-else-if="book.status === 'done'">
                <div class="flex items-center gap-1.5">
                  <Star
                    v-for="s in 5"
                    :key="s"
                    class="w-4 h-4"
                    :class="s <= book.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'"
                  />
                  <span class="text-xs text-muted-foreground ml-1">读完于 {{ book.finishDate || '—' }}</span>
                </div>
                <p v-if="book.note" class="text-xs text-muted-foreground bg-background border border-border rounded-lg px-3 py-2">
                  「{{ book.note }}」
                </p>
              </template>

              <!-- 操作行 -->
              <div class="flex items-center gap-2">
                <button
                  v-if="book.status === 'want'"
                  @click="startReadingBook(book.id)"
                  class="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition"
                >开始阅读</button>
                <button
                  @click="openEdit(book)"
                  class="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs text-muted-foreground transition"
                >编辑</button>
                <template v-if="pendingDelete === book.id">
                  <button
                    @click="removeBook(book.id)"
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
                  @click="pendingDelete = book.id"
                  class="ml-auto px-2 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground transition"
                  aria-label="删除这本书"
                ><Trash2 class="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 年度统计卡 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold flex items-center">
          <BarChart class="w-5 h-5 mr-2 text-primary" /> {{ currentYear || '' }} 年度统计
        </h2>
        <span class="text-xs text-muted-foreground">只统计读完日期在本年度的书（共 {{ books.length }} 本在册）</span>
      </div>

      <div v-if="currentYear && yearStats.count" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 分类占比条形 -->
        <div>
          <p class="text-xs font-medium text-muted-foreground mb-2">各分类占比（本年读完 {{ yearStats.count }} 本）</p>
          <div class="space-y-2">
            <div v-for="row in yearStats.catStats" :key="row.category">
              <div class="flex items-center justify-between text-xs mb-0.5">
                <span class="text-foreground">{{ row.category }}</span>
                <span class="text-muted-foreground">{{ row.count }} 本 · {{ row.pct }}%</span>
              </div>
              <div class="h-2 bg-muted rounded-full overflow-hidden">
                <div class="h-full bg-primary/70 rounded-full transition-all" :style="{ width: row.width + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 月度读完数条形 -->
        <div>
          <p class="text-xs font-medium text-muted-foreground mb-2">月度读完分布（1-12 月）</p>
          <div class="flex items-end gap-1.5 h-24">
            <div v-for="(n, mi) in yearStats.monthly" :key="mi" class="flex-1 flex flex-col items-center justify-end h-full">
              <span v-if="n" class="text-[10px] text-muted-foreground mb-0.5">{{ n }}</span>
              <div
                class="w-full bg-primary rounded-t transition-all"
                :style="{ height: monthlyHeight(n) + '%' }"
              ></div>
            </div>
          </div>
          <div class="flex gap-1.5 mt-1">
            <span v-for="mi in 12" :key="mi" class="flex-1 text-center text-[10px] text-muted-foreground">{{ mi }}</span>
          </div>
        </div>
      </div>

      <div v-else class="py-6 text-center text-sm text-muted-foreground">
        {{ currentYear ? `${currentYear} 年还没有读完书记录：把在读的书翻完，或在读完卡片里补录一本吧。` : '年度统计载入中……' }}
      </div>
    </div>

    <!-- A4 打印区（年度阅读报告） -->
    <div v-if="printMode" class="print-only">
      <h2 class="print-title">{{ currentYear }} 年度阅读报告</h2>
      <p class="print-sub">生成于 {{ todayIso }} · 本年读完 {{ yearStats.count }} 本 · 年度目标 {{ goal > 0 ? goal + ' 本' : '未设定' }} · 在读 {{ readingCount }} 本 · 想读 {{ wantCount }} 本</p>

      <h3 class="print-group-title">分类分布</h3>
      <table class="print-table">
        <thead>
          <tr><th>分类</th><th>本数</th><th>占比</th></tr>
        </thead>
        <tbody>
          <tr v-for="row in yearStats.catStats" :key="row.category">
            <td>{{ row.category }}</td>
            <td>{{ row.count }}</td>
            <td>{{ row.pct }}%</td>
          </tr>
          <tr v-if="!yearStats.catStats.length">
            <td colspan="3">本年暂无读完记录</td>
          </tr>
        </tbody>
      </table>

      <h3 class="print-group-title">本年读完书目</h3>
      <table class="print-table">
        <thead>
          <tr><th>书名</th><th>作者</th><th>分类</th><th>星级</th><th>一句话短评</th><th>读完日期</th></tr>
        </thead>
        <tbody>
          <tr v-for="b in yearStats.finished" :key="b.id">
            <td>{{ b.title }}</td>
            <td>{{ b.author || '—' }}</td>
            <td>{{ b.category }}</td>
            <td>{{ '★'.repeat(b.rating) || '—' }}</td>
            <td>{{ b.note || '—' }}</td>
            <td>{{ b.finishDate || '—' }}</td>
          </tr>
          <tr v-if="!yearStats.finished.length">
            <td colspan="6">本年暂无读完记录</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 编辑弹层 -->
    <div v-if="editingId" class="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      <div class="absolute inset-0 bg-black/50" @click="closeEdit"></div>
      <div class="relative bg-card border border-border rounded-lg p-6 w-full max-w-md space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Pencil class="w-5 h-5 mr-2 text-primary" /> 编辑书目
          </h2>
          <button @click="closeEdit" class="text-muted-foreground hover:text-foreground" aria-label="关闭">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">书名</label>
          <input
            v-model="editForm.title"
            type="text"
            maxlength="60"
            class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">作者</label>
          <input
            v-model="editForm.author"
            type="text"
            maxlength="40"
            class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">分类</label>
            <select
              v-model="editForm.category"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">状态</label>
            <select
              v-model="editForm.status"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="want">想读</option>
              <option value="reading">在读</option>
              <option value="done">读完</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">当前页码</label>
            <input
              v-model.number="editForm.currentPage"
              type="number"
              min="0"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">总页数</label>
            <input
              v-model.number="editForm.totalPages"
              type="number"
              min="0"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
          </div>
        </div>

        <div v-if="editForm.status === 'done'" class="space-y-3">
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-muted-foreground mr-1">星级：</span>
            <button
              v-for="s in 5"
              :key="s"
              @click="editForm.rating = s"
              class="p-0.5"
              :aria-label="`${s} 星`"
            >
              <Star
                class="w-5 h-5"
                :class="s <= editForm.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/40'"
              />
            </button>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">一句话短评</label>
            <input
              v-model="editForm.note"
              type="text"
              maxlength="100"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">读完日期</label>
            <input
              v-model="editForm.finishDate"
              type="date"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
          </div>
        </div>

        <div class="flex gap-2 pt-1">
          <button
            @click="saveEdit"
            class="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >保存修改</button>
          <button
            @click="closeEdit"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >取消</button>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12 no-print">
      <summary class="text-xl font-bold text-foreground cursor-pointer select-none flex items-center">
        <span class="text-primary mr-2">#</span> 一年读多少本书合适？读书笔记怎么做？（FAQ）
      </summary>

      <div class="mt-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          读书清单与阅读记录是一款纯本地的书单管理工具：想读、在读、读完三档状态覆盖一本书的完整生命周期，
          在读书记页码进度（手动更新 + 日期记录），读完书留星级与一句话短评。年度统计卡汇总本年读完数、分类占比与月度分布，
          设定年度目标后由 SVG 进度环直观呈现完成度；书单可复制为 Markdown 表格，年度报告可打印成 A4 留存。
        </p>

        <h3 class="text-lg font-semibold text-foreground">一年读多少本书合适？不卷量</h3>
        <p>
          没有标准答案，但有一个朴素的参照：一本 300 页的普通书，按每晚半小时、每周四晚的节奏，大约三到四周读完，
          一年从容读完 15-25 本；有整块时间或读的是轻量读物，30-50 本也不夸张。数字本身没有意义，
          关键看读完之后留下了什么——能复述核心观点、改变了一个做法的书，一本顶十本。
          建议把年度目标设在自己当前节奏的「跳一跳够得着」处（比如去年读了 8 本就设 12 本），
          并允许随时下调：目标是为阅读服务，不是让书单变成 KPI。想读清单也别设上限——囤书的快乐是真实的，
          但每个月从想读里真正开一本，比收藏一百本更有用。
        </p>

        <h3 class="text-lg font-semibold text-foreground">做读书笔记的三个层次</h3>
        <ol class="list-decimal list-inside space-y-2">
          <li><span class="text-foreground font-medium">摘抄</span>：把打动你的句子原样抄下来。这是最浅的一层，但并非无用——抄写强制慢读，是筛选「什么值得记」的第一道闸。</li>
          <li><span class="text-foreground font-medium">复述</span>：合上书，用自己的话把这一章讲了什么说清楚（说给谁都行，说不出就是没读懂）。复述逼你从「记住句子」升级到「抓住结构」。</li>
          <li><span class="text-foreground font-medium">联结</span>：把新观点和你已有的经验、读过的其他书挂上钩——「这和我上个月那本讲的是一件事的两个面」「这个方法可以搬到我的周报里」。知识成网之后才不容易忘。</li>
        </ol>
        <p>
          一句话短评建议写到第二层（用自己的话概括这本书），星级则留给第三层的直觉：这本书有没有真的改变你什么。
          记完的书隔段时间重翻短评，比重读全书划算得多。
        </p>

        <h2 class="text-2xl font-bold text-foreground pt-2">常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h4 class="text-base font-semibold text-foreground">年度统计的口径是什么？</h4>
            <p class="mt-1">
              只统计「读完日期」落在本年度的读完书：去年 12 月底读完的算去年，今年 1 月才合上最后一页的算今年。
              所以跨年时不用刻意「清零」，把读完日期如实填写，统计自然准确。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">在读进度怎么记？</h4>
            <p class="mt-1">
              在在读卡片的页码框里填当前页，点「记录今日进度」即可：进度条按当前页 ÷ 总页数换算（如 212/380 ≈ 55.8%），
              同一天重复更新会覆盖当天的记录，不会堆积重复条目。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">数据存在哪？换设备会同步吗？</h4>
            <p class="mt-1">
              只存在这台设备浏览器的 localStorage，不联网、不上传、不同步。清浏览器数据会清空书单，
              建议定期用「复制书单 Markdown 表格」留一份备份，贴在笔记软件里即可。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">示例数据会污染我的书单吗？</h4>
            <p class="mt-1">
              「载入示例数据」会覆盖当前书单（有数据时会先要求确认），示例里特意放了一本去年读完的书，
              用来看清「年度统计只数当年」的效果；看完点「清空全部数据」即可恢复干净。
            </p>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground">来源与延伸</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>读完之后的记忆巩固：重读与间隔复习比一次性精读更耐忘，复习日历可配合 <a href="/tools/ebbinghaus-planner/" class="text-primary hover:underline">艾宾浩斯复习排期器</a> 使用。</li>
          <li>阅读速度与阅读量的关系可参考 <a href="/tools/reading-speed-test/" class="text-primary hover:underline">阅读速度测试</a>：先测速再排年度目标，估出来的「今年能读几本」更贴近实际。</li>
          <li>「摘抄 / 复述 / 联结」三层次为常见读书方法论的通用品类口径，非学术标准。</li>
        </ul>
      </div>
    </details>

    <RelatedTools :currentToolId="'reading-log-tracker'" :category="'others'" class="no-print" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  Library, Plus, Trash2, Pencil, Printer, Copy, Star, X, Info, BarChart, Sparkles
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '读书清单与阅读记录 - 在线书单管理与年度阅读统计工具',
  description: '免费在线读书清单工具：想读/在读/读完三档书单，在读页码进度条与每日进度记录，读完书星级短评与读完日期，年度统计卡（本年读完数、分类占比、月度分布）与目标进度环，书单导出 Markdown、年度报告可打印，数据本地保存',
  keywords: '读书清单, 阅读记录, 书单管理, 读书打卡, 年度书单统计, 阅读目标',
  author: '有条工具',
  ogTitle: '读书清单与阅读记录 - 在线书单管理与年度阅读统计工具 | 有条工具',
  ogDescription: '想读/在读/读完三档书单，页码进度与星级短评，年度统计与目标进度环，可导出可打印。',
  ogUrl: 'https://www.util.cn/tools/reading-log-tracker',
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
          name: '读书清单与阅读记录',
          url: 'https://www.util.cn/tools/reading-log-tracker',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['想读/在读/读完三档书单', '在读页码进度条与按日进度记录', '读完书星级、一句话短评与读完日期', '年度统计（本年读完数、分类占比、月度分布）', '年度目标 SVG 完成进度环', '书单导出 Markdown 表格', '年度阅读报告 A4 打印', '示例数据一键填充', '数据仅存本机浏览器']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others' },
            { '@type': 'ListItem', position: 3, name: '读书清单与阅读记录', item: 'https://www.util.cn/tools/reading-log-tracker' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '一年读多少本书合适？',
              acceptedAnswer: { '@type': 'Answer', text: '按每周四晚、每晚半小时的从容节奏，一年约 15-25 本；把目标设在当前节奏的跳一跳够得着处，并允许随时下调。读完能复述、能改变做法的书才真正算数，不建议卷数量。' }
            },
            {
              '@type': 'Question',
              name: '年度统计的口径是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '只统计读完日期落在本年度的读完书，跨年读书按实际读完那一年计入，无需刻意清零。' }
            },
            {
              '@type': 'Question',
              name: '做读书笔记的三个层次是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '摘抄（原样记下打动你的句子）、复述（合上书用自己的话讲清楚）、联结（把新观点与已有经验和读过的书挂钩），一层比一层深，短评写到复述层最实用。' }
            },
            {
              '@type': 'Question',
              name: '数据存在哪？换设备会同步吗？',
              acceptedAnswer: { '@type': 'Answer', text: '只存这台设备浏览器的 localStorage，不上传不同步；建议定期用「复制书单 Markdown 表格」在笔记软件里留备份。' }
            }
          ]
        }
      ]
    })
  }]
})

onMounted(() => {
  addRecentTool('reading-log-tracker')
  todayIso.value = localDateIso()
  currentYear.value = Number(todayIso.value.slice(0, 4)) || 0
  const stored = loadStored()
  books.value = stored.books
  goal.value = stored.goal
  goalInput.value = stored.goal
})

onBeforeUnmount(() => {
  if (confirmTimer) clearTimeout(confirmTimer)
})

// ---------- 纯逻辑（单测区开始） ----------
const CATEGORIES = ['文学', '社科', '科技', '经管', '其他']
const STATUS_LIST = ['want', 'reading', 'done']
const STATUS_LABELS = { want: '想读', reading: '在读', done: '读完' }
const RING_R = 42
const MAX_BOOKS = 300
const TITLE_MAX = 60
const NOTE_MAX = 100
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isValidIso(iso) {
  return typeof iso === 'string' && ISO_DATE_RE.test(iso)
}

function clampInt(n, min, max) {
  const v = Math.floor(Number(n))
  if (!Number.isFinite(v)) return min
  return Math.min(max, Math.max(min, v))
}

// 阅读进度百分比：212/380 → 55.8（保留 1 位小数，夹紧 0-100）
function progressPctOf(current, total) {
  const c = Number(current)
  const t = Number(total)
  if (!Number.isFinite(c) || !Number.isFinite(t) || t <= 0) return 0
  const pct = Math.min(100, Math.max(0, (c / t) * 100))
  return Math.round(pct * 10) / 10
}

// 年度统计：只数 finishDate 落在该年的读完书（跨年过滤）
function yearStatsOf(books, year) {
  const y = Number(year)
  const finished = (!Number.isFinite(y) || y <= 0)
    ? []
    : books.filter((b) => b.status === 'done' && isValidIso(b.finishDate) && Number(b.finishDate.slice(0, 4)) === y)
  const byCat = {}
  const monthly = new Array(12).fill(0)
  for (const b of finished) {
    byCat[b.category] = (byCat[b.category] || 0) + 1
    const m = Number(String(b.finishDate).slice(5, 7))
    if (m >= 1 && m <= 12) monthly[m - 1] += 1
  }
  const maxCat = Math.max(0, ...Object.values(byCat))
  const catStats = CATEGORIES
    .filter((c) => byCat[c])
    .map((c) => ({
      category: c,
      count: byCat[c],
      pct: finished.length ? Math.round(byCat[c] / finished.length * 100) : 0,
      width: maxCat ? Math.round(byCat[c] / maxCat * 100) : 0
    }))
  return { count: finished.length, catStats, monthly, finished }
}

// 目标进度环换算：周长 C = 2πr，offset = C × (1 - pct/100)
function ringOf(pct, r) {
  const radius = Number(r)
  if (!Number.isFinite(radius) || radius <= 0) return { c: 0, offset: 0 }
  const c = 2 * Math.PI * radius
  const p = Math.min(100, Math.max(0, Number(pct) || 0))
  return { c: Math.round(c * 100) / 100, offset: Math.round(c * (1 - p / 100) * 100) / 100 }
}

// 记录今日进度：同日覆盖、按日期升序；页码夹紧到 [0, totalPages]
function applyProgress(book, page, dateIso) {
  const totalPages = Math.max(0, Math.floor(Number(book.totalPages) || 0))
  const p = totalPages > 0 ? clampInt(page, 0, totalPages) : clampInt(page, 0, 1000000)
  const log = (Array.isArray(book.log) ? book.log.filter((e) => e && e.date !== dateIso) : [])
    .concat({ date: dateIso, page: p })
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
  return { ...book, totalPages, currentPage: p, log }
}

// 标记读完：星级 1-5、短评、读完日期
function finishBookOf(book, opts) {
  const rating = clampInt(opts && opts.rating, 1, 5)
  const note = String((opts && opts.note) || '').slice(0, NOTE_MAX)
  const finishDate = isValidIso(opts && opts.finishDate) ? opts.finishDate : ''
  return {
    ...book,
    status: 'done',
    rating,
    note,
    finishDate,
    currentPage: book.totalPages || book.currentPage || 0
  }
}

// 书单导出 Markdown 表格
function markdownOf(books, todayIso) {
  const esc = (s) => String(s || '').replace(/\|/g, '／').replace(/\n/g, ' ')
  const lines = []
  lines.push(`# 我的书单（生成于 ${todayIso || ''}）`)
  lines.push('')
  lines.push('| 书名 | 作者 | 分类 | 状态 | 进度 | 星级 | 短评 | 读完日期 |')
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |')
  for (const b of books) {
    const progress = b.status === 'reading' && b.totalPages
      ? `${b.currentPage}/${b.totalPages}（${progressPctOf(b.currentPage, b.totalPages)}%）`
      : (b.status === 'reading' ? `${b.currentPage} 页` : (b.status === 'done' && b.totalPages ? `${b.totalPages}/${b.totalPages}` : ''))
    const stars = b.status === 'done' ? '★'.repeat(b.rating) : ''
    lines.push(`| ${esc(b.title)} | ${esc(b.author)} | ${b.category} | ${STATUS_LABELS[b.status] || b.status} | ${progress} | ${stars} | ${esc(b.note)} | ${b.status === 'done' ? b.finishDate : ''} |`)
  }
  return lines.join('\n')
}

// 单本清洗：非法字段丢弃或夹紧；书名为空返回 null
function normalizeBook(raw, idx) {
  if (!raw || typeof raw !== 'object') return null
  const title = typeof raw.title === 'string' ? raw.title.trim().slice(0, TITLE_MAX) : ''
  if (!title) return null
  const status = STATUS_LIST.includes(raw.status) ? raw.status : 'want'
  const totalPages = Math.max(0, Math.floor(Number(raw.totalPages) || 0))
  const currentPage = clampInt(raw.currentPage, 0, totalPages || 1000000)
  const rating = clampInt(raw.rating, 0, 5)
  const log = Array.isArray(raw.log)
    ? raw.log
        .filter((e) => e && isValidIso(e.date))
        .map((e) => ({ date: e.date, page: clampInt(e.page, 0, totalPages || 1000000) }))
        .sort((a, b) => a.date.localeCompare(b.date))
    : []
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `b-${idx}-${title}`,
    title,
    author: typeof raw.author === 'string' ? raw.author.trim().slice(0, 40) : '',
    category: CATEGORIES.includes(raw.category) ? raw.category : '其他',
    status,
    totalPages,
    currentPage,
    log,
    rating,
    note: typeof raw.note === 'string' ? raw.note.slice(0, NOTE_MAX) : '',
    finishDate: isValidIso(raw.finishDate) ? raw.finishDate : '',
    startDate: isValidIso(raw.startDate) ? raw.startDate : '',
    createdAt: isValidIso(raw.createdAt) ? raw.createdAt : ''
  }
}

function normalizeBooks(list) {
  if (!Array.isArray(list)) return []
  return list.map((r, i) => normalizeBook(r, i)).filter(Boolean).slice(0, MAX_BOOKS)
}

// 示例书单（含一本去年读完的书，用于演示跨年过滤）
function sampleBooksOf(todayIso) {
  const year = Number(String(todayIso).slice(0, 4)) || 2026
  const lastYear = year - 1
  const mk = (n) => `demo-b-${n}`
  return normalizeBooks([
    { id: mk(1), title: '三体', author: '刘慈欣', category: '科技', status: 'done', totalPages: 302, currentPage: 302, rating: 5, note: '黑暗森林法则一出，整个宇宙的规则都变了。', finishDate: `${year}-02-14`, startDate: `${year}-01-20`, createdAt: `${year}-01-20` },
    { id: mk(2), title: '置身事内', author: '兰小欢', category: '经管', status: 'done', totalPages: 320, currentPage: 320, rating: 4, note: '用最平实的话讲清地方政府与经济的绑定关系。', finishDate: `${year}-05-02`, startDate: `${year}-04-10`, createdAt: `${year}-04-10` },
    { id: mk(3), title: '人类简史', author: '尤瓦尔·赫拉利', category: '社科', status: 'done', totalPages: 440, currentPage: 440, rating: 4, note: '观点可以不同意，但叙事确实停不下来。', finishDate: `${year}-08-30`, startDate: `${year}-07-15`, createdAt: `${year}-07-15` },
    { id: mk(4), title: '我与地坛', author: '史铁生', category: '文学', status: 'done', totalPages: 292, currentPage: 292, rating: 5, note: '在命运面前，文字安静而有力。', finishDate: `${lastYear}-11-20`, startDate: `${lastYear}-11-01`, createdAt: `${lastYear}-11-01` },
    { id: mk(5), title: '思考，快与慢', author: '丹尼尔·卡尼曼', category: '经管', status: 'reading', totalPages: 424, currentPage: 156, log: [{ date: `${year}-10-08`, page: 96 }, { date: `${year}-10-20`, page: 130 }, { date: `${year}-11-02`, page: 156 }], createdAt: `${year}-09-25` },
    { id: mk(6), title: '乡土中国', author: '费孝通', category: '社科', status: 'reading', totalPages: 136, currentPage: 64, log: [{ date: `${year}-10-15`, page: 40 }, { date: `${year}-11-01`, page: 64 }], createdAt: `${year}-10-10` },
    { id: mk(7), title: '银河系边缘的小失常', author: '埃特加·凯雷特', category: '文学', status: 'want', createdAt: `${year}-10-26` },
    { id: mk(8), title: '芯片战争', author: '克里斯·米勒', category: '科技', status: 'want', createdAt: `${year}-11-01` }
  ])
}
// ---------- 纯逻辑（单测区结束） ----------

// ---------- 页面状态 ----------
const STORAGE_KEY = 'reading-log-tracker-v1'
const books = ref([])
const goal = ref(0)
const todayIso = ref('')
const currentYear = ref(0)
const activeTab = ref('all')
const pendingDelete = ref(null)
const confirmClear = ref(false)
const confirmSample = ref(false)
const editingId = ref('')
const finishPanelId = ref(null)
const printMode = ref(false)
const quickPages = ref({})
const goalInput = ref(0)
let confirmTimer = null

const formTitle = ref('')
const formAuthor = ref('')
const formCategory = ref('文学')
const formStatus = ref('want')
const formTotalPages = ref(null)

const finishForm = reactive({ rating: 0, note: '', date: '' })
const editForm = reactive({
  title: '', author: '', category: '文学', status: 'want',
  currentPage: 0, totalPages: 0, rating: 0, note: '', finishDate: ''
})

const tabs = [
  { id: 'all', label: '全部' },
  { id: 'want', label: '想读' },
  { id: 'reading', label: '在读' },
  { id: 'done', label: '读完' }
]

const statusBadgeClass = {
  want: 'bg-muted/60 text-muted-foreground border-border',
  reading: 'bg-sky-500/10 text-sky-600 border-sky-500/30',
  done: 'bg-green-500/10 text-green-600 border-green-500/30'
}

// 浏览器本地日历日（仅 onMounted 调用）
function localDateIso() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function genId() {
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// ---------- 存取（读只在 onMounted，写只在事件回调，均带 try/catch） ----------
function loadStored() {
  if (typeof localStorage === 'undefined') return { books: [], goal: 0 }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { books: [], goal: 0 }
    const parsed = JSON.parse(raw) || {}
    return {
      books: normalizeBooks(parsed.books),
      goal: clampInt(parsed.goal, 0, 1000)
    }
  } catch (e) {
    return { books: [], goal: 0 }
  }
}

function persist() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ books: books.value, goal: goal.value }))
  } catch (e) { /* 忽略存储异常 */ }
}

function commit(nextBooks) {
  books.value = normalizeBooks(nextBooks)
  persist()
}

// ---------- 派生数据 ----------
const wantCount = computed(() => books.value.filter((b) => b.status === 'want').length)
const readingCount = computed(() => books.value.filter((b) => b.status === 'reading').length)
const yearStats = computed(() => yearStatsOf(books.value, currentYear.value))

const ringPct = computed(() => {
  if (!goal.value || goal.value <= 0) return 0
  return progressPctOf(yearStats.value.count, goal.value)
})
const ring = computed(() => ringOf(ringPct.value, RING_R))
const ringPctDisplay = computed(() => (goal.value > 0 ? `${Math.floor(ringPct.value)}%` : '—'))

const viewBooks = computed(() => {
  const list = books.value
    .filter((b) => (activeTab.value === 'all' ? true : b.status === activeTab.value))
    .map((b) => {
      const last = Array.isArray(b.log) && b.log.length ? b.log[b.log.length - 1] : null
      return {
        ...b,
        pct: progressPctOf(b.currentPage, b.totalPages),
        lastLogText: last ? `最近更新 ${last.date} · 第 ${last.page} 页（共记录 ${b.log.length} 次）` : ''
      }
    })
  const order = { reading: 0, want: 1, done: 2 }
  return list.sort((a, b) => order[a.status] - order[b.status] || a.title.localeCompare(b.title, 'zh-Hans-CN'))
})

function tabCount(id) {
  if (id === 'all') return books.value.length
  return books.value.filter((b) => b.status === id).length
}

function monthlyHeight(n) {
  const max = Math.max(1, ...yearStats.value.monthly)
  if (!n) return 2
  return Math.max(6, Math.round(n / max * 100))
}

// ---------- 操作 ----------
function addBook() {
  const title = formTitle.value.trim()
  if (!title) {
    alert('请先填写书名')
    return
  }
  if (books.value.length >= MAX_BOOKS) {
    alert(`书单已达 ${MAX_BOOKS} 本上限`)
    return
  }
  const totalPages = Math.max(0, Math.floor(Number(formTotalPages.value) || 0))
  commit(books.value.concat({
    id: genId(),
    title: title.slice(0, TITLE_MAX),
    author: formAuthor.value.trim().slice(0, 40),
    category: CATEGORIES.includes(formCategory.value) ? formCategory.value : '其他',
    status: formStatus.value === 'reading' ? 'reading' : 'want',
    totalPages,
    currentPage: 0,
    log: [],
    rating: 0,
    note: '',
    finishDate: '',
    startDate: formStatus.value === 'reading' ? todayIso.value : '',
    createdAt: todayIso.value
  }))
  formTitle.value = ''
  formAuthor.value = ''
  formTotalPages.value = null
}

function startReadingBook(id) {
  commit(books.value.map((b) => (b.id === id
    ? { ...b, status: 'reading', startDate: todayIso.value, log: b.log || [] }
    : b)))
}

function updateProgress(book) {
  const page = Number(quickPages.value[book.id])
  if (!Number.isFinite(page) || page < 0) {
    alert('请先填写当前页码')
    return
  }
  if (!isValidIso(todayIso.value)) {
    alert('日期尚未载入，请稍后再试')
    return
  }
  commit(books.value.map((b) => (b.id === book.id ? applyProgress(b, page, todayIso.value) : b)))
  quickPages.value[book.id] = null
}

function openFinish(book) {
  finishPanelId.value = book.id
  finishForm.rating = 0
  finishForm.note = ''
  finishForm.date = todayIso.value
}

function confirmFinish(id) {
  if (!finishForm.rating) {
    alert('请先点星星打分（1-5 星）')
    return
  }
  if (!isValidIso(finishForm.date)) {
    alert('请选择有效的读完日期')
    return
  }
  commit(books.value.map((b) => (b.id === id
    ? finishBookOf(b, { rating: finishForm.rating, note: finishForm.note, finishDate: finishForm.date })
    : b)))
  finishPanelId.value = null
}

function openEdit(book) {
  editingId.value = book.id
  editForm.title = book.title
  editForm.author = book.author
  editForm.category = book.category
  editForm.status = book.status
  editForm.currentPage = book.currentPage
  editForm.totalPages = book.totalPages
  editForm.rating = book.rating
  editForm.note = book.note
  editForm.finishDate = book.finishDate
}

function closeEdit() {
  editingId.value = ''
}

function saveEdit() {
  const id = editingId.value
  if (!id) return
  const title = editForm.title.trim()
  if (!title) {
    alert('书名不能为空')
    return
  }
  commit(books.value.map((b) => (b.id === id
    ? {
        ...b,
        title: title.slice(0, TITLE_MAX),
        author: editForm.author.trim().slice(0, 40),
        category: CATEGORIES.includes(editForm.category) ? editForm.category : b.category,
        status: STATUS_LIST.includes(editForm.status) ? editForm.status : b.status,
        totalPages: Math.max(0, Math.floor(Number(editForm.totalPages) || 0)),
        currentPage: clampInt(editForm.currentPage, 0, Math.max(0, Math.floor(Number(editForm.totalPages) || 0)) || 1000000),
        rating: clampInt(editForm.rating, 0, 5),
        note: String(editForm.note || '').slice(0, NOTE_MAX),
        finishDate: isValidIso(editForm.finishDate) ? editForm.finishDate : ''
      }
    : b)))
  closeEdit()
}

function removeBook(id) {
  pendingDelete.value = null
  if (finishPanelId.value === id) finishPanelId.value = null
  if (editingId.value === id) closeEdit()
  commit(books.value.filter((b) => b.id !== id))
}

function setGoal() {
  goal.value = clampInt(goalInput.value, 0, 1000)
  goalInput.value = goal.value
  persist()
}

function askClearAll() {
  if (!books.value.length && !goal.value) {
    alert('书单本来就是空的')
    return
  }
  confirmClear.value = true
  if (confirmTimer) clearTimeout(confirmTimer)
  confirmTimer = setTimeout(() => { confirmClear.value = false }, 6000)
}

function clearAll() {
  confirmClear.value = false
  goal.value = 0
  goalInput.value = 0
  commit([])
  persist()
}

function askSamples() {
  if (books.value.length) {
    confirmSample.value = true
    if (confirmTimer) clearTimeout(confirmTimer)
    confirmTimer = setTimeout(() => { confirmSample.value = false }, 6000)
    return
  }
  loadSamples()
}

function loadSamples() {
  confirmSample.value = false
  books.value = sampleBooksOf(todayIso.value)
  persist()
}

async function copyMarkdown() {
  if (!books.value.length) {
    alert('书单还是空的，先添加几本书')
    return
  }
  const md = markdownOf(books.value, todayIso.value)
  try {
    await navigator.clipboard.writeText(md)
    alert('已复制')
  } catch (e) {
    alert('复制失败，请手动选择文本复制')
  }
}

async function startPrint() {
  printMode.value = true
  await nextTick()
  try {
    window.print()
  } catch (e) { /* 忽略 */ }
  printMode.value = false
}
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

  .print-group-title {
    font-size: 15px;
    font-weight: 700;
    margin: 14px 0 6px;
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
