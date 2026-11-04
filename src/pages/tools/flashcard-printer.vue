<template>
  <div class="max-w-8xl mx-auto">
    <!-- 全局 @page 规则：A4 竖版、12mm 页边距（打印对话框缩放保持 100% 即与预览一致） -->
    <component :is="'style'" v-html="printPageCss"></component>

    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BookOpen class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">单词卡片打印</h1>
          <p class="text-sm text-muted-foreground mt-1">正面单词、背面释义的 Q/A 卡片模板，A4 多版式排版，双面打印长边翻页正背自动对齐，逐张裁剪即用</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线单词卡片打印工具：逐条录入或按「正面|背面」批量粘贴生成 Q/A 卡片，A4 竖版每页 8 / 10 / 12 张三种版式，正面粗体居中、背面小字释义，
        正背面同色虚线裁剪线与序号小字对位；背面页自动按「行同序、列倒序」镜像排版，打印时选择「双面打印 - 长边翻页」正背即一一对齐，
        沿虚线裁剪后每张卡片正背配套。支持标准/大号字号、六色边框轮换或统一、可编辑标题行；卡片列表仅保存在本地浏览器，不上传任何数据，
        英语单词、古文默写、知识问答卡片都能打。
      </p>
    </div>

    <div class="print-grid grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：卡片与版式设置 -->
      <div class="no-print space-y-6">
        <!-- 卡片内容 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <BookOpen class="w-5 h-5 mr-2 text-primary" /> 卡片内容
            </h2>
            <span class="text-xs text-muted-foreground">{{ cards.length }} / {{ MAX_CARDS }} 张</span>
          </div>

          <!-- 方式一：逐条表单 -->
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">逐条添加</p>
            <input
              v-model="formFront"
              type="text"
              maxlength="60"
              :class="SEL_CLS"
              placeholder="正面：单词或问题（≤60 字）"
              @keyup.enter="addCard"
            />
            <input
              v-model="formBack"
              type="text"
              maxlength="60"
              :class="SEL_CLS"
              placeholder="背面：释义或答案（≤60 字，可留空）"
              @keyup.enter="addCard"
            />
            <button
              type="button"
              @click="addCard"
              class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
            >
              <Plus class="w-4 h-4" /> 添加卡片
            </button>
          </div>

          <!-- 方式二：批量粘贴 -->
          <div class="space-y-2 border-t border-border pt-4">
            <p class="text-sm font-medium text-foreground">批量粘贴</p>
            <textarea
              v-model="batchText"
              rows="4"
              :class="SEL_CLS"
              placeholder="每行一条：apple|苹果 或 apple,苹果&#10;竖线优先、逗号回退；只有正面时背面留空"
            ></textarea>
            <button
              type="button"
              @click="importBatch"
              class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
            >
              <Plus class="w-4 h-4" /> 解析并导入
            </button>
            <p
              v-if="notice"
              class="text-xs leading-relaxed rounded px-2.5 py-2 flex items-start gap-1.5"
              :class="notice.type === 'ok' ? 'bg-green-500/10 text-green-700' : 'bg-amber-500/10 text-amber-700'"
            >
              <CheckCircle v-if="notice.type === 'ok'" class="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <TriangleAlert v-else class="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{{ notice.text }}</span>
            </p>
          </div>

          <!-- 卡片列表 -->
          <div class="border-t border-border pt-4 space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-foreground">卡片列表</p>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="loadSample"
                  class="px-2 py-1 rounded-md border border-border bg-muted/40 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground transition flex items-center gap-1"
                >
                  <RefreshCw class="w-3 h-3" /> 载入示例
                </button>
                <button
                  type="button"
                  @click="clearAll"
                  :disabled="!cards.length"
                  class="px-2 py-1 rounded-md border border-border bg-muted/40 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  清空
                </button>
              </div>
            </div>
            <div v-if="cards.length" class="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              <div
                v-for="(c, i) in cards"
                :key="i"
                class="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5"
              >
                <span class="text-[10px] text-muted-foreground w-5 shrink-0 tabular-nums">{{ i + 1 }}</span>
                <span class="text-sm font-medium text-foreground truncate w-[38%]">{{ c.front }}</span>
                <span class="text-xs text-muted-foreground truncate flex-1">{{ c.back || '（空白背面）' }}</span>
                <button
                  type="button"
                  class="p-1 rounded hover:bg-muted text-muted-foreground hover:text-red-500 transition shrink-0"
                  :aria-label="'删除第 ' + (i + 1) + ' 张卡片'"
                  @click="removeCard(i)"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p v-else class="text-xs text-muted-foreground">
              还没有卡片：逐条添加、批量粘贴，或点「载入示例」先看 10 张示例单词卡的效果。
            </p>
            <p v-if="emptyBackCount" class="text-xs text-amber-600 flex items-start gap-1">
              <TriangleAlert class="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>有 {{ emptyBackCount }} 张卡片背面为空，打印时该面为空白（可手写补充）。</span>
            </p>
          </div>
        </div>

        <!-- 版式设置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 版式与打印
          </h2>

          <div>
            <label class="block text-xs text-muted-foreground mb-1">每页行列（A4 单面）</label>
            <select v-model="layoutId" :class="SEL_CLS">
              <option v-for="o in LAYOUT_OPTIONS" :key="o.id" :value="o.id">{{ o.label }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs text-muted-foreground mb-1">字体大小</label>
            <div class="grid grid-cols-2 gap-1">
              <button
                type="button"
                @click="fontMode = 'standard'"
                class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                :class="fontMode === 'standard' ? BTN_ON : BTN_OFF"
              >
                标准
              </button>
              <button
                type="button"
                @click="fontMode = 'large'"
                class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                :class="fontMode === 'large' ? BTN_ON : BTN_OFF"
              >
                大号
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs text-muted-foreground mb-1">边框颜色（正背面同色，虚线即裁剪线）</label>
            <div class="grid grid-cols-2 gap-1 mb-2">
              <button
                type="button"
                @click="borderColorMode = 'rotate'"
                class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                :class="borderColorMode === 'rotate' ? BTN_ON : BTN_OFF"
              >
                六色轮换
              </button>
              <button
                type="button"
                @click="borderColorMode = 'uniform'"
                class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                :class="borderColorMode === 'uniform' ? BTN_ON : BTN_OFF"
              >
                统一色
              </button>
            </div>
            <div class="flex gap-1.5">
              <button
                v-for="c in BORDER_COLORS"
                :key="c"
                type="button"
                class="w-7 h-7 rounded-md border transition"
                :class="borderColorMode === 'uniform' && uniformColor === c ? 'ring-2 ring-offset-1 ring-primary border-transparent' : 'border-border'"
                :style="{ backgroundColor: c }"
                :aria-label="'使用边框颜色 ' + c"
                @click="pickColor(c)"
              ></button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              {{ borderColorMode === 'rotate' ? '按卡片序号在六色间自动轮换，便于错题归组' : '全部卡片使用统一边框色，点上方色块选择' }}
            </p>
          </div>

          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="showIndex" type="checkbox" class="accent-primary w-4 h-4" />
            显示卡片序号小字（裁剪对位用）
          </label>

          <div>
            <label class="block text-xs text-muted-foreground mb-1">标题行（{n} 会替换为页码）</label>
            <input
              v-model="titleTemplate"
              type="text"
              :class="SEL_CLS"
              placeholder="单词卡片 · 第 {n} 页"
            />
          </div>

          <div class="grid grid-cols-1 gap-2 pt-1">
            <button
              type="button"
              @click="printCards"
              :disabled="!cards.length"
              class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer class="w-4 h-4" /> 打印 / PDF（双面选长边翻页）
            </button>
            <button
              type="button"
              @click="copyText"
              :disabled="!cards.length"
              class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle v-if="copied" class="w-4 h-4 text-green-500" />
              <Copy v-else class="w-4 h-4" />
              {{ copied ? '已复制' : '复制文本版（正面|背面）' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 右：A4 预览（打印时按 正1、背1、正2、背2… 页序全部输出） -->
      <div class="lg:col-span-2 print-area">
        <div class="no-print flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Play class="w-5 h-5 mr-2 text-primary" /> A4 打印预览
          </h2>
          <div class="inline-flex rounded-lg border border-border overflow-hidden text-sm">
            <button
              type="button"
              @click="viewMode = 'front'"
              class="px-3 py-1.5 transition"
              :class="viewMode === 'front' ? 'bg-primary/10 text-primary font-medium' : 'bg-card text-muted-foreground hover:bg-muted/70'"
            >
              正面页
            </button>
            <button
              type="button"
              @click="viewMode = 'back'"
              class="px-3 py-1.5 transition"
              :class="viewMode === 'back' ? 'bg-primary/10 text-primary font-medium' : 'bg-card text-muted-foreground hover:bg-muted/70'"
            >
              背面页
            </button>
          </div>
        </div>

        <div class="no-print flex flex-wrap items-center gap-x-4 gap-y-1 mb-2 text-xs text-muted-foreground">
          <span class="flex items-center gap-1">
            <Info class="w-3.5 h-3.5 shrink-0" />
            共 {{ cards.length }} 张卡 · 正/背各 {{ pages.length }} 页 · 每页 {{ layout.rows }} 行 × {{ layout.cols }} 列 = {{ perPage }} 张
          </span>
        </div>

        <!-- 双面打印提示条（静态） -->
        <p class="no-print text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5 mb-3">
          <Info class="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
          <span>{{ duplexNote }}</span>
        </p>

        <div ref="previewWrapRef" class="w-full">
          <div class="preview-holder mx-auto" :style="holderStyle">
            <div ref="previewStackRef" class="pages-stack" :style="stackStyle">
              <template v-for="pg in previewPages" :key="pg.page">
                <!-- 正面页：卡片序号 row-major，与背面页共用同一套网格坐标 -->
                <div class="fc-sheet" v-show="viewMode === 'front'" :style="sheetStyle">
                  <p class="fc-title">{{ pg.title }}</p>
                  <div class="fc-grid" :style="gridStyle">
                    <div
                      v-for="(cell, ci) in pg.frontCells"
                      :key="'f' + pg.page + '-' + ci"
                      class="fc-cell"
                      :class="{ 'is-empty': !cell }"
                      :style="cell ? { borderColor: borderColorOf(cell) } : null"
                    >
                      <template v-if="cell">
                        <span v-if="showIndex" class="fc-no" :style="{ fontSize: fontMm.index + 'mm' }">{{ cell.no }}</span>
                        <span class="fc-front" :style="{ fontSize: fontMm.front + 'mm' }">{{ cell.card.front }}</span>
                      </template>
                    </div>
                  </div>
                </div>
                <!-- 背面页：第 r 行第 c 列 = 正面第 r 行第 (cols-1-c) 列那张卡的背面（行同序、列倒序） -->
                <div class="fc-sheet" v-show="viewMode === 'back'" :style="sheetStyle">
                  <p class="fc-title">{{ pg.title }}</p>
                  <div class="fc-grid" :style="gridStyle">
                    <div
                      v-for="(cell, ci) in pg.backCells"
                      :key="'b' + pg.page + '-' + ci"
                      class="fc-cell"
                      :class="{ 'is-empty': !cell }"
                      :style="cell ? { borderColor: borderColorOf(cell) } : null"
                    >
                      <template v-if="cell">
                        <span v-if="showIndex" class="fc-no" :style="{ fontSize: fontMm.index + 'mm' }">{{ cell.no }}</span>
                        <span v-if="cell.card.back" class="fc-back" :style="{ fontSize: fontMm.back + 'mm' }">{{ cell.card.back }}</span>
                        <span v-else class="fc-back-empty no-print">（背面留空）</span>
                      </template>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <div v-if="!cards.length" class="no-print bg-card border border-dashed border-border rounded-lg p-10 text-center mt-2">
            <BookOpen class="w-10 h-10 text-primary/30 mx-auto mb-3" />
            <p class="text-sm text-muted-foreground">
              还没有卡片。在左侧逐条添加、批量粘贴，或点「载入示例」查看 10 张示例单词卡；添加后这里会实时生成正面页与背面页预览。
            </p>
          </div>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印或另存 PDF 时缩放请选「100% / 实际大小」，本页已按 A4 竖版、12mm 页边距排版，输出页序为 正面页 1、背面页 1、正面页 2、背面页 2……
          按页配对；双面打印选「长边翻页」即自动把背面页印到对应正面页的同一张纸上。正面页与背面页共用同一套网格坐标与固定行高，虚线即裁剪线，
          设置面板与页面其余内容不会被打出来。
        </p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>单词卡片打印是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          单词卡片打印是一款免费的在线 flashcard 制作工具。它在浏览器里把「正面 = 单词或问题、背面 = 释义或答案」的卡片排成 A4 版式：
          每页可选 2×4（8 张）、2×5（10 张）、3×4（12 张）三种布局，支持标准/大号两种字号、正背面同色的六色边框（可轮换可统一）、
          用于裁剪对位的序号小字和可编辑标题行。核心是背面页的自动镜像排版：文档按「正面页 1、背面页 1、正面页 2、背面页 2……」逐页配对输出，
          打印时选「双面打印 - 长边翻页」，正反面就会一一对齐，沿虚线逐张裁剪后每张卡片正背配套，直接开背。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">flashcard 记忆法：主动回忆 + 间隔重复</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          flashcard 之所以有效，核心是两件事：一是主动回忆——先看正面自己作答、再翻面对答案，「提取记忆」这个动作本身比反复阅读更能巩固记忆（心理学上叫测试效应）；
          二是间隔重复——按照遗忘曲线在快要忘记的时间点复习，每次都把即将流失的记忆「抢」回来，复习间隔可以越拉越长。
          纸质卡片天然适合这套流程：答对的放一盒、答错的放另一盒，错题盒每天过一遍、对题盒隔几天再过，就是一个手工版的间隔重复系统。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">双面打印怎么对齐？（长边翻页原理 + 本工具布局口径）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          口径先行：本工具按「长边翻页 duplex + 逐张裁剪」设计，背面布局 = 正面同页镜像（行同序、列倒序）——背面页第 r 行第 c 列，
          印的是正面页第 r 行第（列数-1-c）列那张卡的背面。原理：A4 竖版的「长边」是左右两条竖边，「长边翻页」就是像翻书一样沿竖直轴翻纸，
          翻面后上下不变、左右对调，正面第 r 行第 c 列的物理位置翻过来正好落在背面视图的第 r 行第（列数-1-c）列；
          打印机正是按这个坐标系印背面的，所以背面页必须「行不动、列倒序」才能与正面逐点对齐。具体操作：
        </p>
        <ol class="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground mt-2">
          <li>在左侧录入卡片，选好每页行列、字号与边框色；</li>
          <li>点「打印 / PDF」，缩放保持「100% / 实际大小」；</li>
          <li>在打印对话框勾选「双面打印（长边翻页 / flip on long edge）」；</li>
          <li>打印后沿虚线逐张裁剪，每张卡片正面单词、背面释义自动配对。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">背面镜像布局为什么列要倒？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          直觉上背面按同样顺序印「看起来更整齐」，但长边翻页会把纸左右翻个面：正面同一排的卡片，翻面后位置正好左右互换。
          如果背面不倒列，裁出来的 1 号卡背面印的是同排另一端的卡片，整套卡全部错配。把背面列倒序之后，
          每张卡的正反面在物理上落在同一位置，这就是「行同序、列倒序」六个字的由来。也因此在预览里看背面页，
          卡片顺序「看起来是反的」恰恰说明排版是正确的。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">卡片纸推荐（160-200g）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          普通 70-80g 复印纸太薄，双面打印时背面的字会透过来，翻面自测等于「开卷考试」。建议选 160-200g 的白卡纸：
          接近明信片硬度，正背互不透印，裁剪后挺括耐翻；家用喷墨/激光打印机一般都能走 200g 以下的厚纸，厚纸走手动进纸口更顺。
          第一次先拿一张普通纸试打，确认对位无误后再上卡纸；250g 以上容易卡纸，且多数家用机型不支持这样厚的纸双面打印。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">和 Anki 的区别（纸质 vs App，互补）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Anki 这类 App 的强项是自动排期（算法替你安排每张卡的复习时间）、多媒体（发音、图片）和随身携带；
          纸质卡片的强项是脱离屏幕、动手感强、可以写画标注，适合亲子互动、课堂活动、结伴互考，也更适合低龄儿童或想减少屏幕时间的学习者。
          两者并不冲突：可以用本工具把当周生词打成纸卡随手翻，阶段沉淀后再把高频难词录进 Anki 做长期复习——纸卡管「上手」，App 管「排期」，互补使用效果最好。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">双面打印具体怎么操作才能正背对齐？</h3>
            <p class="text-sm text-muted-foreground mt-1">录入卡片后点「打印 / PDF」，缩放选 100%，勾选「双面打印 - 长边翻页」即可：文档已按「正面页 1、背面页 1、正面页 2……」逐页配对，打印机会自动把背面页印到对应正面页的同一张纸上，沿虚线裁剪后正背自动配对。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">预览里背面页的卡片顺序为什么是反的？</h3>
            <p class="text-sm text-muted-foreground mt-1">这是故意的。长边翻页会把纸左右翻面，背面页按「行同序、列倒序」镜像排版后，每张卡的正反面才会落在同一物理位置；如果背面按相同顺序印，裁出来整套卡片正背全部错配。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">打印机不支持自动双面怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">文档的奇数页是全部正面页、偶数页是全部背面页且按页配对。先打奇数页，取出后把同一叠纸按原页序放回纸盒再打偶数页（不要旋转纸张方向），即可手动完成双面。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">批量导入支持什么格式？</h3>
            <p class="text-sm text-muted-foreground mt-1">每行一条：优先用竖线「正面|背面」，没有竖线时用第一个逗号「正面,背面」（此时正面内不能含逗号）；只有正面时背面留空，可当纯正面卡。空行自动跳过，上限 100 张、每面 60 字。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">卡片数据会保存或上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会上传。卡片列表只保存在你浏览器的 localStorage 里，刷新或下次打开自动恢复；清空浏览器站点数据即彻底删除。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'flashcard-printer'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  BookOpen, Printer, Plus, X, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '单词卡片打印 - 背单词卡片双面打印模板生成（正背对齐）',
  description: '免费在线单词卡片打印工具：逐条录入或批量粘贴生成 flashcard，A4 每页 8/10/12 张多版式，正背面同色边框与序号对位，背面自动镜像排版，双面打印长边翻页正背对齐，逐张裁剪即用，纯浏览器本地生成不上传',
  keywords: '单词卡片打印,flashcard 制作,背单词卡片,学习卡片模板,双面卡片打印',
  author: '有条工具',
  ogTitle: '单词卡片打印 - 背单词卡片双面打印模板生成 | 有条工具',
  ogDescription: '单词卡片 Q/A 双面模板，A4 多版式排版，背面自动镜像，双面打印长边翻页正背对齐，裁剪即用。',
  ogUrl: 'https://www.util.cn/tools/flashcard-printer',
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
          name: '单词卡片打印',
          url: 'https://www.util.cn/tools/flashcard-printer',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '逐条录入与批量粘贴（正面|背面）两种录入方式',
            'A4 每页 8/10/12 张三种版式，标准/大号字号',
            '背面页自动镜像排版，长边翻页双面打印正背对齐',
            '正背面同色边框：六色轮换或统一色',
            '卡片序号对位与可编辑标题行',
            '卡片列表本地保存，不上传数据'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '单词卡片打印', item: 'https://www.util.cn/tools/flashcard-printer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '双面打印具体怎么操作才能正背对齐？',
              acceptedAnswer: { '@type': 'Answer', text: '录入卡片后点打印，缩放选100%，勾选双面打印-长边翻页即可：文档已按正面页1、背面页1、正面页2……逐页配对，打印机会自动把背面页印到对应正面页的同一张纸上，沿虚线裁剪后正背自动配对。' }
            },
            {
              '@type': 'Question',
              name: '预览里背面页的卡片顺序为什么是反的？',
              acceptedAnswer: { '@type': 'Answer', text: '这是故意的。长边翻页会把纸左右翻面，背面页按行同序、列倒序镜像排版后，每张卡的正反面才会落在同一物理位置；如果背面按相同顺序印，裁出来整套卡片正背全部错配。' }
            },
            {
              '@type': 'Question',
              name: '打印机不支持自动双面怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '文档的奇数页是全部正面页、偶数页是全部背面页且按页配对。先打奇数页，取出后把同一叠纸按原页序放回纸盒再打偶数页（不要旋转纸张方向），即可手动完成双面。' }
            },
            {
              '@type': 'Question',
              name: '批量导入支持什么格式？',
              acceptedAnswer: { '@type': 'Answer', text: '每行一条：优先用竖线「正面|背面」，没有竖线时用第一个逗号「正面,背面」（此时正面内不能含逗号）；只有正面时背面留空。空行自动跳过，上限100张、每面60字。' }
            },
            {
              '@type': 'Question',
              name: '卡片数据会保存或上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会上传。卡片列表只保存在浏览器的 localStorage 里，刷新或下次打开自动恢复；清空浏览器站点数据即彻底删除。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MAX_CARDS = 100   // 卡片数量上限
const MAX_SIDE_LEN = 60 // 正/背面单面字数上限

// 六色边框调色板（正背面同色；rotate 模式按卡片序号轮换）
const BORDER_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2']

// 单面文本规范化：去首尾空白并截断到 60 字
function normalizeSideOf(text) {
  return String(text == null ? '' : text).trim().slice(0, MAX_SIDE_LEN)
}

// 单张卡片规范化：两面都为空时丢弃（返回 null）
function normalizeCardOf(card) {
  const c = card && typeof card === 'object' ? card : {}
  const front = normalizeSideOf(c.front)
  const back = normalizeSideOf(c.back)
  if (!front && !back) return null
  return { front, back }
}

// 卡片列表规范化：去空卡、截断到 100 张
function normalizeCardList(cards) {
  const list = Array.isArray(cards) ? cards : []
  const out = []
  for (const c of list) {
    const card = normalizeCardOf(c)
    if (card) out.push(card)
    if (out.length >= MAX_CARDS) break
  }
  return out
}

// 批量文本解析：每行一条。
// 行内分隔容错口径：优先竖线「|」（行内只要含竖线就按第一个竖线切，即使正面里含逗号也安全）；
// 无竖线时回退用第一个半角逗号「,」（此时正面内不得含逗号），再回退全角逗号「，」与制表符；
// 只有正面（无分隔符）时背面留空，可当纯正面卡。空行跳过，上限 100 张。
function parseCardsOf(text) {
  const lines = String(text == null ? '' : text).split(/\r?\n/)
  const out = []
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    let front = line
    let back = ''
    const pipeIdx = line.indexOf('|')
    if (pipeIdx >= 0) {
      front = line.slice(0, pipeIdx)
      back = line.slice(pipeIdx + 1)
    } else {
      const sepIdx = [line.indexOf(','), line.indexOf('，'), line.indexOf('\t')]
        .filter((i) => i >= 0)
        .sort((a, b) => a - b)[0]
      if (sepIdx !== undefined) {
        front = line.slice(0, sepIdx)
        back = line.slice(sepIdx + 1)
      }
    }
    const card = normalizeCardOf({ front, back })
    if (card) out.push(card)
    if (out.length >= MAX_CARDS) break
  }
  return out
}

// 分页排版：cards 按 row-major（先行后列）填入 cols 列网格，每 perPage 张一页。
// 返回 [{ page, items: [{ card, row, col, no }] }]，no 为全局序号（1 起）。
// 注：规格给的签名为 (cards, perPage)，因 items 需要行/列坐标，这里追加必填参数 cols。
function sheetLayoutOf(cards, perPage, cols) {
  const list = Array.isArray(cards) ? cards : []
  const size = Math.max(1, Math.floor(Number(perPage) || 1))
  const c = Math.max(1, Math.floor(Number(cols) || 1))
  const pages = []
  for (let i = 0; i < list.length; i += size) {
    const pageCards = list.slice(i, i + size)
    const items = pageCards.map((card, k) => ({
      card,
      row: Math.floor(k / c),
      col: k % c,
      no: i + k + 1
    }))
    pages.push({ page: pages.length + 1, items })
  }
  return pages
}

// 背面页镜像布局（本工具实现口径，见页面 FAQ）：
// 按「双面打印 - 长边翻页 + 逐张裁剪」设计，背面布局 = 正面同页镜像（行同序、列倒序）：
// 背面页第 r 行第 c 列 = 正面页第 r 行第 (cols-1-c) 列那张卡的背面。
// 原理：长边翻页沿竖直轴翻纸，翻面后上下不变、左右对调，正面 (r, c) 的物理位置
// 翻过来落在背面视图的 (r, cols-1-c)，打印机正按该坐标系印背面，故列必须倒置。
// pageCards 为该页正面元素按 row-major 展开的数组（元素结构不限，原样搬运，可缺省），
// 返回 rows×cols 矩阵，镜像到空位的元素为 null。例：8 张、4 列 2 行 →
// 正面 [1,2,3,4 / 5,6,7,8] → 背面 [[4,3,2,1],[8,7,6,5]]。
function mirrorLayoutForBack(pageCards, cols, rows) {
  const flat = Array.isArray(pageCards) ? pageCards : []
  const c = Math.max(1, Math.floor(Number(cols) || 1))
  const r = Math.max(1, Math.floor(Number(rows) || 1))
  const grid = []
  for (let ri = 0; ri < r; ri++) {
    const line = []
    for (let ci = 0; ci < c; ci++) {
      const src = ri * c + (c - 1 - ci)
      line.push(src < flat.length ? flat[src] : null)
    }
    grid.push(line)
  }
  return grid
}

// 把一页 items（含 row/col）铺成 rows×cols 的 row-major 展开数组，空位为 null（保持网格形状）
function gridCellsOf(items, rows, cols) {
  const r = Math.max(0, Math.floor(Number(rows) || 0))
  const c = Math.max(0, Math.floor(Number(cols) || 0))
  const cells = new Array(r * c).fill(null)
  for (const it of Array.isArray(items) ? items : []) {
    if (it && it.row >= 0 && it.row < r && it.col >= 0 && it.col < c) {
      cells[it.row * c + it.col] = it
    }
  }
  return cells
}

// 标题行渲染：模板含 {n} 时替换为页码，否则追加「 · 第 n 页」；空模板回退「单词卡片」
function sheetTitleOf(template, page) {
  const tpl = String(template == null ? '' : template).trim() || '单词卡片'
  const n = Math.max(1, Math.floor(Number(page) || 1))
  if (tpl.includes('{n}')) return tpl.replace(/\{n\}/g, String(n))
  return tpl + ' · 第 ' + n + ' 页'
}

// 复制用文本版：每行「正面|背面」（与批量粘贴格式互逆）
function clipboardTextOf(cards) {
  const list = Array.isArray(cards) ? cards : []
  return list.map((c) => (c && c.front ? c.front : '') + '|' + (c && c.back ? c.back : '')).join('\n')
}

// 双面打印静态说明（提示条与 FAQ 共用，口径一致）
function validateDuplexNoteOf() {
  return '打印时勾选「双面打印 - 长边翻页」；若打印机只支持手动双面，先打全部正面页，再按页序回打背面页（背面页序与正面一一配对，不要旋转纸张）。' +
    '文档按「正面页 1、背面页 1、正面页 2、背面页 2……」逐页配对输出，背面布局为正面同页镜像（行同序、列倒序），逐张裁剪后正背自动对齐。'
}

// 卡片边框色：rotate 模式按全局序号在六色间轮换；uniform 模式用统一色（非法值回退第一色）
function cardBorderColorOf(no, mode, uniformColor) {
  if (mode === 'uniform') return BORDER_COLORS.includes(uniformColor) ? uniformColor : BORDER_COLORS[0]
  const n = Math.max(1, Math.floor(Number(no) || 1))
  return BORDER_COLORS[(n - 1) % BORDER_COLORS.length]
}

// ---------- 页面状态与交互 ----------
const LAYOUT_OPTIONS = [
  { id: '2x4', rows: 2, cols: 4, label: '2 行 × 4 列 · 8 张/页' },
  { id: '2x5', rows: 2, cols: 5, label: '2 行 × 5 列 · 10 张/页' },
  { id: '3x4', rows: 3, cols: 4, label: '3 行 × 4 列 · 12 张/页' }
]

const SAMPLE_CARDS = [
  { front: 'apple', back: '苹果' },
  { front: 'banana', back: '香蕉' },
  { front: 'cat', back: '猫' },
  { front: 'dog', back: '狗' },
  { front: 'elephant', back: '大象' },
  { front: 'flower', back: '花' },
  { front: 'garden', back: '花园' },
  { front: 'house', back: '房子' },
  { front: 'island', back: '岛屿' },
  { front: 'jungle', back: '丛林' }
]

const BTN_ON = 'bg-primary/10 border-primary/40 text-primary font-medium'
const BTN_OFF = 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'
const SEL_CLS = 'w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const cards = ref([])
const layoutId = ref('2x4')
const fontMode = ref('standard')
const borderColorMode = ref('rotate') // 'rotate' | 'uniform'
const uniformColor = ref(BORDER_COLORS[0])
const showIndex = ref(true)
const titleTemplate = ref('单词卡片 · 第 {n} 页')
const viewMode = ref('front') // 'front' | 'back'
const seoContentVisible = ref(true)
const formFront = ref('')
const formBack = ref('')
const batchText = ref('')
const notice = ref(null) // { type: 'ok' | 'warn', text }
const copied = ref(false)
let copiedTimer = null

const layout = computed(() => LAYOUT_OPTIONS.find((o) => o.id === layoutId.value) || LAYOUT_OPTIONS[0])
const perPage = computed(() => layout.value.rows * layout.value.cols)
const pages = computed(() => sheetLayoutOf(cards.value, perPage.value, layout.value.cols))
const emptyBackCount = computed(() => cards.value.filter((c) => !c.back).length)
const duplexNote = validateDuplexNoteOf()

// 预览页数据：正面网格(row-major 含空位) + 背面镜像网格(展平) + 标题
const previewPages = computed(() =>
  pages.value.map((pg) => ({
    page: pg.page,
    title: sheetTitleOf(titleTemplate.value, pg.page),
    frontCells: gridCellsOf(pg.items, layout.value.rows, layout.value.cols),
    backCells: mirrorLayoutForBack(pg.items, layout.value.cols, layout.value.rows).flat()
  }))
)

function borderColorOf(cell) {
  return cardBorderColorOf(cell.no, borderColorMode.value, uniformColor.value)
}

// ---------- 卡片操作 ----------
function addCard() {
  const card = normalizeCardOf({ front: formFront.value, back: formBack.value })
  if (!card) {
    notice.value = { type: 'warn', text: '正面和背面不能都为空，请至少填写一面' }
    return
  }
  if (cards.value.length >= MAX_CARDS) {
    notice.value = { type: 'warn', text: '卡片已达 ' + MAX_CARDS + ' 张上限，请先删除部分卡片' }
    return
  }
  cards.value = [...cards.value, card]
  formFront.value = ''
  formBack.value = ''
  notice.value = null
}

function removeCard(index) {
  cards.value = cards.value.filter((_, i) => i !== index)
}

function importBatch() {
  const parsed = parseCardsOf(batchText.value)
  if (!parsed.length) {
    notice.value = { type: 'warn', text: '未解析到有效卡片：请每行一条，用「正面|背面」或「正面,背面」分隔' }
    return
  }
  const remaining = MAX_CARDS - cards.value.length
  if (remaining <= 0) {
    notice.value = { type: 'warn', text: '卡片已达 ' + MAX_CARDS + ' 张上限，请先删除部分卡片再导入' }
    return
  }
  const accepted = parsed.slice(0, remaining)
  cards.value = normalizeCardList([...cards.value, ...accepted])
  batchText.value = ''
  notice.value = accepted.length < parsed.length
    ? { type: 'warn', text: '已达 ' + MAX_CARDS + ' 张上限：导入 ' + accepted.length + ' 张，放弃 ' + (parsed.length - accepted.length) + ' 张' }
    : { type: 'ok', text: '成功导入 ' + accepted.length + ' 张卡片' }
}

function loadSample() {
  cards.value = normalizeCardList(SAMPLE_CARDS.map((c) => ({ ...c })))
  notice.value = { type: 'ok', text: '已载入 ' + cards.value.length + ' 张示例单词卡' }
}

function clearAll() {
  cards.value = []
  batchText.value = ''
  notice.value = null
}

function pickColor(color) {
  uniformColor.value = color
  borderColorMode.value = 'uniform'
}

function printCards() {
  if (!cards.value.length) return
  window.print()
}

// 复制文本版（正面|背面 每行一条），剪贴板 API 失败时回退 execCommand
async function copyText() {
  const text = clipboardTextOf(cards.value)
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copied.value = true
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied.value = false
      copiedTimer = null
    }, 2000)
  } catch (err) {
    notice.value = { type: 'warn', text: '复制失败，请手动全选复制' }
  }
}

// ---------- localStorage（读写均 try/catch，读只在 onMounted） ----------
const STORAGE_KEY = 'util:flashcard-printer:cards'

function saveCardsToStorage(list) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeCardList(list)))
  } catch (e) {
    // 隐私模式 / 存储被禁用时忽略写入失败
  }
}

function readCardsFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const list = normalizeCardList(JSON.parse(raw))
    return list.length ? list : null
  } catch (e) {
    return null
  }
}

watch(cards, (v) => saveCardsToStorage(v), { deep: true })

// ---------- A4 排版（mm 为单位，屏幕缩放预览、打印还原物理尺寸） ----------
const MM_PX = 96 / 25.4
const SHEET_W_MM = 210
const PAGE_MARGIN_MM = 12
const GAP_MM = 3        // 卡片间距
const TITLE_H_MM = 9    // 标题行总高（6mm 行高 + 3mm 下边距），正背页一致保证对位
const AVAIL_GRID_MM = 297 - PAGE_MARGIN_MM * 2 - TITLE_H_MM - 2 // 网格可用高度（留 2mm 余量防溢出）
const FONT_MM = {
  standard: { front: 5, back: 3.4, index: 2.2 },
  large: { front: 6.5, back: 4.4, index: 2.6 }
}

const fontMm = computed(() => (fontMode.value === 'large' ? FONT_MM.large : FONT_MM.standard))

const rowHeightMm = computed(() => {
  const rows = layout.value.rows
  const h = (AVAIL_GRID_MM - GAP_MM * (rows - 1)) / rows
  return Math.round(h * 100) / 100
})

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(' + layout.value.cols + ', 1fr)',
  gridTemplateRows: 'repeat(' + layout.value.rows + ', ' + rowHeightMm.value + 'mm)',
  gap: GAP_MM + 'mm'
}))

const sheetStyle = computed(() => ({
  width: SHEET_W_MM + 'mm',
  minHeight: '297mm',
  padding: PAGE_MARGIN_MM + 'mm'
}))

// 预览缩放：屏幕上把 210mm 宽的页缩放到面板宽度内，打印时还原
const previewWrapRef = ref(null)
const previewStackRef = ref(null)
const previewScale = ref(1)
const stackH = ref(0)
let resizeObserver = null
const pageWpx = SHEET_W_MM * MM_PX

const holderStyle = computed(() => ({
  width: pageWpx * previewScale.value + 'px',
  height: stackH.value > 0 ? stackH.value * previewScale.value + 'px' : 'auto'
}))

const stackStyle = computed(() => ({
  width: pageWpx + 'px',
  transform: 'scale(' + previewScale.value + ')',
  transformOrigin: 'top left'
}))

function updateScale() {
  const wrap = previewWrapRef.value
  if (!wrap) return
  const avail = wrap.clientWidth
  if (avail > 0) previewScale.value = Math.min(1, (avail - 2) / pageWpx)
  if (previewStackRef.value) stackH.value = previewStackRef.value.offsetHeight
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// @page 规则单独注入（静态内容，A4 竖版 + 12mm 页边距）
const printPageCss = '@page { size: A4 portrait; margin: 12mm; }'

onMounted(() => {
  const saved = readCardsFromStorage()
  if (saved) cards.value = saved
  updateScale()
  if (typeof ResizeObserver !== 'undefined' && previewWrapRef.value) {
    resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(previewWrapRef.value)
    if (previewStackRef.value) resizeObserver.observe(previewStackRef.value)
  }
  addRecentTool('flashcard-printer')
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (copiedTimer) {
    clearTimeout(copiedTimer)
    copiedTimer = null
  }
})
</script>

<style scoped>
/* 屏幕上的 A4 卡片页 */
.fc-sheet {
  background: #ffffff;
  color: #111827;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
  border-radius: 2px;
  overflow: hidden;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.pages-stack > .fc-sheet {
  margin-top: 16px;
}
/* 标题行固定 9mm（6mm 高 + 3mm 下边距），正背页一致才能逐位对齐 */
.fc-title {
  box-sizing: border-box;
  height: 6mm;
  line-height: 6mm;
  font-size: 3.2mm;
  color: #374151;
  border-bottom: 1px solid #d1d5db;
  margin-bottom: 3mm;
  white-space: nowrap;
  overflow: hidden;
  font-variant-numeric: tabular-nums;
}
.fc-grid {
  flex: 1;
}
/* 卡片单元：虚线裁剪线，颜色由内联样式按正背同色规则注入 */
.fc-cell {
  position: relative;
  border: 1.5px dashed #d1d5db;
  border-radius: 1.5mm;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3.5mm 2mm 2mm;
  word-break: break-word;
  overflow-wrap: anywhere;
  line-height: 1.4;
  box-sizing: border-box;
}
.fc-cell.is-empty {
  border-color: #f1f5f9;
}
.fc-no {
  position: absolute;
  top: 1mm;
  left: 2mm;
  color: #9ca3af;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.fc-front {
  font-weight: 700;
  color: #111827;
}
.fc-back {
  color: #1f2937;
}
.fc-back-empty {
  color: #cbd5e1;
}

@media print {
  .no-print {
    display: none !important;
  }
  /* 打印时放开布局壳层：左右分栏改为通栏，保证 A4 页面完整输出 */
  .print-grid {
    display: block !important;
  }
  .print-area {
    width: auto !important;
  }
  :global(main) {
    overflow: visible !important;
    height: auto !important;
  }
  .preview-holder {
    width: auto !important;
    height: auto !important;
  }
  .pages-stack {
    transform: none !important;
    width: auto !important;
  }
  .pages-stack > .fc-sheet {
    margin-top: 0 !important;
  }
  /* 覆盖 v-show 的 display:none：正面页与背面页按 DOM 顺序（正1、背1、正2、背2…）全部输出 */
  .fc-sheet {
    display: flex !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    width: auto !important;
    min-height: 0 !important;
    padding: 0 !important;
    break-after: page;
    page-break-after: always;
  }
  .pages-stack > .fc-sheet:last-child {
    break-after: auto;
    page-break-after: auto;
  }
}
</style>
