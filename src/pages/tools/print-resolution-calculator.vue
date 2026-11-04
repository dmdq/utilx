<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ImageIcon class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">打印分辨率计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">像素 ↔ DPI 双向换算：这张照片能印多大、冲 6 寸 / A4 / 海报要多少像素，几寸相纸能不能达标</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线打印分辨率换算工具，服务照片冲印、相册书、电商主图与海报打印四类场景。正向：输入照片宽高像素，一次给出 300 / 200 / 150 DPI 三档下能印的尺寸（厘米与英寸并排），
        并逐档判定能否直接冲 3R、6 寸、7 寸、8 寸、10 寸、A4、A3，附带居中裁剪比例与加白边的提示；反向：选目标相纸或自定义厘米尺寸、挑质量档，算出所需像素与所需百万像素，
        再反查「你的 1200 万像素相机印 A4 @300DPI 是否达标」。所有换算在浏览器本地完成，不上传图片、不发送任何请求。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Ruler class="w-5 h-5 mr-2 text-primary" /> 换算方向与参数
        </h2>

        <!-- 双向模式切换 -->
        <div class="grid grid-cols-2 gap-1 p-1 bg-muted/50 rounded-lg">
          <button
            @click="mode = 'toSize'"
            class="px-3 py-2 rounded-md text-sm font-medium transition"
            :class="mode === 'toSize' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'"
          >
            像素 → 能印多大
          </button>
          <button
            @click="mode = 'toPx'"
            class="px-3 py-2 rounded-md text-sm font-medium transition"
            :class="mode === 'toPx' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'"
          >
            要印尺寸 → 需要像素
          </button>
        </div>

        <!-- 模式一：像素 → 尺寸 -->
        <div v-if="mode === 'toSize'" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="prc-pxw" class="block text-sm font-medium text-foreground mb-1">照片宽度（px）</label>
              <input id="prc-pxw" v-model.number="pxW" type="number" min="1" step="1"
                class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary font-mono" placeholder="4000" />
            </div>
            <div>
              <label for="prc-pxh" class="block text-sm font-medium text-foreground mb-1">照片高度（px）</label>
              <input id="prc-pxh" v-model.number="pxH" type="number" min="1" step="1"
                class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary font-mono" placeholder="3000" />
            </div>
          </div>
          <div>
            <p class="text-xs text-muted-foreground mb-2">快速预设（含竖图）</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="p in presets"
                :key="p.id"
                @click="applyPreset(p)"
                class="px-2.5 py-2 text-xs bg-muted hover:bg-muted/80 border border-border rounded-lg text-foreground transition text-left"
              >
                <Play class="w-3 h-3 inline mr-1.5 -mt-0.5 text-primary" />{{ p.name }}
                <span class="block text-[10px] text-muted-foreground font-mono">{{ p.w }} × {{ p.h }} px</span>
              </button>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>当前 {{ pixelsValid ? `${fmtInt(pxN)} 像素 · ${mpText} MP · 比例 ${ratioText}` : '请输入有效的宽高像素（正整数）' }}</span>
          </p>
        </div>

        <!-- 模式二：尺寸 → 像素 -->
        <div v-else class="space-y-4">
          <div>
            <label for="prc-target" class="block text-sm font-medium text-foreground mb-1">打印目标</label>
            <select id="prc-target" v-model="targetId"
              class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm text-foreground">
              <option v-for="opt in targetOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
            </select>
          </div>
          <div v-if="targetId === 'custom'" class="grid grid-cols-2 gap-3">
            <div>
              <label for="prc-cmw" class="block text-sm font-medium text-foreground mb-1">宽（cm）</label>
              <input id="prc-cmw" v-model.number="customW" type="number" min="1" step="0.1"
                class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary font-mono" placeholder="30" />
            </div>
            <div>
              <label for="prc-cmh" class="block text-sm font-medium text-foreground mb-1">高（cm）</label>
              <input id="prc-cmh" v-model.number="customH" type="number" min="1" step="0.1"
                class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary font-mono" placeholder="40" />
            </div>
          </div>
          <div>
            <label for="prc-dpi" class="block text-sm font-medium text-foreground mb-1">质量档（DPI）</label>
            <select id="prc-dpi" v-model.number="selectedDpi"
              class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm text-foreground">
              <option v-for="q in qualityOptions" :key="q.dpi" :value="q.dpi">{{ q.label }}</option>
            </select>
          </div>
          <div>
            <label for="prc-cam" class="block text-sm font-medium text-foreground mb-1">你的相机像素（百万像素 MP）</label>
            <input id="prc-cam" v-model.number="cameraMp" type="number" min="1" step="0.1"
              class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary font-mono" placeholder="12" />
            <p class="text-[10px] text-muted-foreground mt-1">手机主摄常见 12 / 48 / 50 MP，全画幅相机 24–61 MP，用于反查是否达标。</p>
          </div>
        </div>

        <div class="flex gap-2 pt-1">
          <button
            @click="loadExample"
            class="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 载入示例
          </button>
          <button
            @click="resetInputs"
            class="flex-1 px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
          </button>
        </div>
      </div>

      <!-- 结果区（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 模式一：三档 DPI 并排 -->
        <div v-if="mode === 'toSize'" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ImageIcon class="w-5 h-5 mr-2 text-primary" /> 三档分辨率下的可印尺寸
          </h2>

          <div v-if="pixelsValid" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div v-for="t in tierResults" :key="t.dpi" class="rounded-lg border border-border bg-muted/40 p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">{{ t.dpi }} DPI · {{ t.note }}</p>
              <p class="text-xl font-bold text-foreground font-mono leading-tight">{{ t.cmText }}</p>
              <p class="text-xs text-muted-foreground mt-1 font-mono">{{ t.inchText }}</p>
              <span class="inline-block mt-2 px-2 py-0.5 rounded-full border text-[10px] font-medium" :class="toneClass[t.grade.tone]">
                {{ t.grade.label }}
              </span>
              <p class="text-[10px] text-muted-foreground mt-2 leading-snug">{{ t.grade.hint }}</p>
            </div>
          </div>

          <div v-if="!pixelsValid" class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <TriangleAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">还差照片尺寸</p>
              <p class="text-xs text-muted-foreground mt-1">在左侧填入照片的宽和高（像素），或点「载入示例」用一张 2400 × 1600 的老手机照片试算各档判定。</p>
            </div>
          </div>

          <!-- 档位结论徽章 -->
          <div v-if="pixelsValid" class="rounded-lg border border-border bg-primary/5 p-4">
            <div class="flex flex-wrap items-center gap-2">
              <span
                v-for="chip in verdictChips"
                :key="chip.id"
                class="px-2.5 py-1 rounded-full border text-xs font-medium"
                :class="toneClass[chip.tone]"
              >
                {{ chip.text }}
              </span>
            </div>
            <p class="text-xs text-muted-foreground mt-2.5 leading-relaxed">{{ verdictText }}</p>
          </div>
        </div>

        <!-- 模式二：所需像素 -->
        <div v-else class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Crop class="w-5 h-5 mr-2 text-primary" /> {{ targetLabel }} @ {{ selectedDpi }} DPI 所需像素
          </h2>

          <div v-if="targetValid" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">所需像素（宽 × 高）</p>
              <p class="text-2xl font-bold text-primary font-mono leading-tight">{{ required.w }} × {{ required.h }}</p>
              <p class="text-xs text-muted-foreground mt-1">整十近似 {{ requiredRoundedText }} px</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">所需总像素</p>
              <p class="text-2xl font-bold text-foreground font-mono leading-tight mt-1">{{ requiredMpText }} MP</p>
              <p class="text-xs text-muted-foreground mt-1">{{ pxSizeText }}</p>
              <p class="text-[10px] text-muted-foreground mt-1.5 leading-snug">{{ selectedDpi }} DPI {{ selectedGrade.label }}：{{ selectedGrade.hint }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">相机是否达标</p>
              <p class="text-xl font-bold leading-tight mt-1" :class="cameraOk ? 'text-green-600' : 'text-red-600'">
                {{ cameraOk ? '达标' : '不达标' }}
              </p>
              <p class="text-xs text-muted-foreground mt-1 font-mono">{{ cameraMpText }} MP ÷ {{ requiredMpText }} MP</p>
            </div>
          </div>

          <div v-if="!targetValid" class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <TriangleAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">目标尺寸无效</p>
              <p class="text-xs text-muted-foreground mt-1">自定义厘米数需为大于 0 的数字（例如 30 × 40 cm）。</p>
            </div>
          </div>

          <p v-if="targetValid" class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <CheckCircle v-if="cameraOk" class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <TriangleAlert v-else class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>{{ cameraVerdictText }}</span>
          </p>

          <div v-if="targetValid && sourceMatch" class="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Crop class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-muted-foreground leading-relaxed">{{ sourceMatch.text }}</p>
          </div>
        </div>

        <!-- 相纸档位判定表 -->
        <div v-if="mode === 'toSize' && pixelsValid" class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 常用相纸档位判定
          </h2>
          <div class="rounded-lg border border-border overflow-hidden">
            <div class="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
              <div class="col-span-4">相纸 / 冲印店叫法</div>
              <div class="col-span-3 text-right">满幅实际 DPI</div>
              <div class="col-span-3">质量判定</div>
              <div class="col-span-2 text-right">铺满需裁</div>
            </div>
            <div v-for="row in paperRows" :key="row.id" class="grid grid-cols-12 gap-2 px-3 py-2 border-t border-border text-sm items-center">
              <div class="col-span-4">
                <p class="font-medium text-foreground">{{ row.name }}</p>
                <p class="text-[10px] text-muted-foreground font-mono">{{ row.sizeText }}</p>
              </div>
              <div class="col-span-3 text-right font-mono text-foreground">{{ row.dpiText }}</div>
              <div class="col-span-3">
                <span class="inline-block px-2 py-0.5 rounded-full border text-[10px] font-medium" :class="toneClass[row.grade.tone]" :title="row.grade.hint">
                  {{ row.grade.label }} · {{ row.grade.verdict }}
                </span>
              </div>
              <div class="col-span-2 text-right font-mono text-xs" :class="row.cropPercent > 0.5 ? 'text-amber-600' : 'text-muted-foreground'">
                {{ row.cropPercent > 0.5 ? `${row.cropPercent}%` : '—' }}
              </div>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            实际 DPI 按短边取严：把照片铺满该相纸（允许横竖旋转）时，两个方向各自折算 DPI，取较小的一个作为判定值。
            「铺满需裁」指按相纸比例居中裁剪掉的像素占比，超出部分也可用白边 / 背景补齐，不必裁剪。
          </p>
        </div>

        <!-- 科普卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 屏幕像素 vs 印刷像素为什么不同
          </h2>
          <p class="text-sm text-muted-foreground leading-relaxed">
            屏幕按物理尺寸连续发光，人眼在 50–70cm 距离看 100–150 PPI 就觉得细腻，网页因此沿用 72 / 96 PPI 的历史约定；
            印刷品靠反射光、以墨点网点重建画面，观距可近到 25cm，人眼在 25cm 处大约能分辨 300 线/英寸，于是照片冲印把 300 DPI 当成「精修线」。
            同一个「1000 像素」在屏幕上是一小段宽度，在纸上则被摊成 1000÷DPI 英寸：DPI 越低摊得越大、颗粒越明显。
            所以换算公式永远是 <span class="font-mono text-foreground">英寸 = 像素 ÷ DPI</span>、<span class="font-mono text-foreground">厘米 = 英寸 × 2.54</span>，
            本工具做的就是把这条式子在两种方向上反复摊开。
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <p class="p-2.5 rounded bg-muted/60 text-foreground">
              <span class="text-muted-foreground">25cm 手持看：</span>需要 ≥300 DPI 才看不见网点
            </p>
            <p class="p-2.5 rounded bg-muted/60 text-foreground">
              <span class="text-muted-foreground">50cm 桌面看：</span>200 DPI 已经锐利，相册书常用档
            </p>
            <p class="p-2.5 rounded bg-muted/60 text-foreground">
              <span class="text-muted-foreground">1–3m 远看：</span>100 DPI 甚至 50 DPI 足够，海报与展架档
            </p>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>打印分辨率计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一款像素与印刷尺寸的双向换算工具。核心只有一条换算链：像素 ÷ DPI = 英寸，英寸 × 2.54 = 厘米，反过来 厘米 ÷ 2.54 × DPI = 需要的像素。
          正向输入照片宽高，页面给出 300 / 200 / 150 DPI 三档下能印的厘米与英寸尺寸，再逐档对照主流冲印规格（3R、4R、5R、6R、8R、A4、A3）给出实际 DPI 与质量徽章；
          反向选择目标相纸或自定义厘米尺寸、挑质量档，得到所需宽高风险像素与百万像素数，并用你的相机像素反查是否达标、有没有方向裁剪的代价。
          全部计算在前端完成，不读取相册、不上传图片。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">DPI 和 PPI 是一回事吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          严格定义不同：PPI（pixels per inch）是图像的采样密度，指一张图每英寸排了多少个像素；DPI（dots per inch）是输出设备的网点密度，指打印机每英寸喷多少个墨点。
          一张 300 PPI 的图交给 300 DPI 的打印机，理想是 1 像素对 1 墨点；但多数喷墨机一个像素要由几个不同大小的墨点叠出，激光机则用半色调抖动，所以厂商标称的 1200、2400 DPI 并不等于照片需要 1200 PPI。
          日常沟通里两个词常被混用，本工具按「1 像素 ≈ 1 印刷点」的通用近似换算，这在冲印店、相册书与海报输出的实际下单口径中足够准确。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么照片要 300dpi 才觉得清晰？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          取决于线数与观距。人眼在明视距离（约 25cm）的分辨极限约 1 角分，对应纸面上大约 0.08mm 的间距，也就是接近 300 线/英寸；
          低于这个密度，手指着看就能察觉网点与锯齿，因此照片冲印、杂志内页把 300 DPI 定为精修线。观距拉远时结论改变：
          相册翻着看 200 DPI 已足够，A1 海报退到一米外 100 DPI 不显眼，商场灯箱三米外 50 DPI 都看不出问题。
          所以「需要多少 DPI」是先定观距、再定密度，而不是所有印刷品都要 300 DPI；反向模式里的质量档下拉就是按观距分档给出的。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">朋友圈的图为什么印不了海报？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          算的是短边像素这笔账。社交平台上传常被压到 1080px 宽，1080 短边印 6 寸（10.2cm ≈ 4.02 英寸）折算约 269 DPI，冲一张 6 寸完全够；
          印 A4（21cm ≈ 8.27 英寸）只剩约 130 DPI，手持看明显偏柔；印 60×90cm 海报时 90cm 那侧是 35.4 英寸，1080÷35.4 ≈ 30 DPI，
          退到一米也糊成马赛克。想印大尺寸，必须回到原图或重新拍摄：60×90cm @100DPI 需要约 2362×3543 像素，也就是 800 万像素以上的原片。
          这也是「同一张照片能冲 6 寸却不能做海报」的原因——像素总量没变，摊开的面积变大了。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">打印机 1200dpi 和照片 300dpi 差哪了？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两者量的不是同一件事。打印机的 1200 DPI 是墨点密度——喷头每英寸最多能落 1200 个极小墨点，多个墨点叠出一种颜色，所以它对连续调照片是有利的硬件冗余；
          而照片的 300 DPI 是图像采样密度——每英寸只给了 300 个像素的颜色信息。给 1200 DPI 的机器喂 72 DPI 的图，机器不会凭空补出细节，
          只能把每个像素摊到更多墨点上，结果仍是模糊；反过来喂 300 DPI 的图，多余的墨点密度用来表现色阶过渡和锐度，才看得见提升。
          结论是：源图分辨率决定清晰度上限，打印机 DPI 决定它能把这个上限还原得多干净。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">相纸几寸对应多少厘米（主流冲印规格）</h3>
        <p class="text-sm text-muted-foreground mb-3">
          国内冲印店习惯按长边英寸称呼：所谓「6 寸」即 4R（15.2×10.2cm，4×6 英寸），「7 寸」是 5R、「8 寸」是 6R、「10 寸」是 8R，
          而 3R（也叫 L 版）常被叫作 5 寸。下列尺寸为行业主流规格（长边 × 短边，厘米），下单前建议再与店家确认裁边余量。
        </p>
        <div class="rounded-lg border border-border overflow-hidden mb-3">
          <div class="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
            <div class="col-span-4">规格</div>
            <div class="col-span-4">常用叫法</div>
            <div class="col-span-4 text-right">尺寸（cm）</div>
          </div>
          <div v-for="p in PAPER_SIZES" :key="p.id" class="grid grid-cols-12 gap-2 px-3 py-2 border-t border-border text-sm">
            <div class="col-span-4 font-medium text-foreground">{{ p.name }}</div>
            <div class="col-span-4 text-muted-foreground">{{ p.aka }}</div>
            <div class="col-span-4 text-right font-mono text-foreground">{{ p.w }} × {{ p.h }}</div>
          </div>
        </div>
        <p class="text-sm text-muted-foreground leading-relaxed">
          换算时记得区分横竖：相纸的英寸叫法按长边计，照片 4:3 与相纸 3:2 的比例差异会导致上下或左右被裁掉几个百分点，本工具在判定表里给出了每档相纸的居中裁剪比例。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">手机拍的照片能冲多大？</h3>
            <p class="text-sm text-muted-foreground mt-1">以 4000 × 3000 的主摄照片为例：300 DPI 精修口径可印 33.9 × 25.4cm（接近 A3 一半），200 DPI 可印 50.8 × 38.1cm，150 DPI 可印到 67.7 × 50.8cm（对开海报级别，退一米看没问题）。6 寸、7 寸、8 寸、10 寸与 A4 全部直接达标。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">冲一张 6 寸照片需要多少像素？</h3>
            <p class="text-sm text-muted-foreground mt-1">6 寸即 4R，尺寸 15.2 × 10.2cm，按 300 DPI 精修需要约 1795 × 1205 像素（约 220 万），任何手机都能满足；放宽到 200 DPI 只需约 1197 × 803 像素。想印 A4 @300 DPI 则需要约 2480 × 3508 像素，约 870 万。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">照片比例和相纸不一致会被裁掉吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">会。4:3 的照片铺满 3:2 的 6 寸相纸需居中裁掉上下约 10.5%，铺满 1:1 的方形卡需裁掉左右约 25%。若不想裁，可加白边或背景色补齐，代价是实际画面分辨率下降一档，本工具在裁剪警告条里同时给出两种方案。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。页面只做像素、厘米、英寸与 DPI 的数值换算，不访问相册、不读取文件、不发送任何网络请求，断网后刷新前已渲染的结果依然正确。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'print-resolution-calculator'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Image as ImageIcon, Crop, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Ruler
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '打印分辨率计算器 - 照片打印尺寸与 DPI 像素双向换算',
  description: '免费在线打印分辨率计算器：输入照片像素看 300/200/150DPI 能印多大（厘米与英寸双显），逐档判定 6 寸/7 寸/8 寸/A4/A3 相纸能否达标并给出裁剪比例；反向按目标尺寸与质量档算出所需像素与百万像素，反查相机是否达标。照片冲印、相册书、电商主图、海报打印适用，纯浏览器本地运行不上传',
  keywords: '照片打印尺寸计算,DPI PPI 换算,几寸照片多少像素,印刷分辨率要求,放大照片清晰',
  author: '有条工具',
  ogTitle: '打印分辨率计算器 - 照片打印尺寸与 DPI 像素双向换算 | 有条工具',
  ogDescription: '像素与 DPI 双向换算：这张照片能印多大、冲 6 寸 / A4 / 海报要多少像素，几寸相纸能不能达标。',
  ogUrl: 'https://www.util.cn/tools/print-resolution-calculator',
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
          name: '打印分辨率计算器',
          url: 'https://www.util.cn/tools/print-resolution-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '像素到可印尺寸的双向换算（300/200/150 DPI 三档并排）',
            '厘米与英寸双显，英寸 = 像素 ÷ DPI',
            '主流冲印规格档位判定（3R/4R/5R/6R/8R/A4/A3）',
            '按目标尺寸与质量档反推所需像素与百万像素',
            '相机像素达标反查与余量倍数',
            '相纸比例居中裁剪比例与加白边方案',
            'DPI 与 PPI 区别、观距与线数科普',
            '本地运行不上传图片'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图像处理', item: 'https://www.util.cn/image/' },
            { '@type': 'ListItem', position: 3, name: '打印分辨率计算器', item: 'https://www.util.cn/tools/print-resolution-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '手机拍的照片能冲多大？',
              acceptedAnswer: { '@type': 'Answer', text: '以 4000×3000 的主摄照片为例：300DPI 精修口径可印 33.9×25.4cm，200DPI 可印 50.8×38.1cm，150DPI 可印到 67.7×50.8cm（对开海报级，退一米看没问题），6 寸、7 寸、8 寸、10 寸与 A4 全部直接达标。' }
            },
            {
              '@type': 'Question',
              name: '冲一张 6 寸照片需要多少像素？',
              acceptedAnswer: { '@type': 'Answer', text: '6 寸即 4R，尺寸 15.2×10.2cm，按 300DPI 精修需约 1795×1205 像素（约 220 万），任何手机都满足；放宽到 200DPI 约 1197×803 像素。印 A4@300DPI 需约 2480×3508 像素，约 870 万。' }
            },
            {
              '@type': 'Question',
              name: '照片比例和相纸不一致会被裁掉吗？',
              acceptedAnswer: { '@type': 'Answer', text: '会。4:3 的照片铺满 3:2 的 6 寸相纸需居中裁掉上下约 10.5%，铺满 1:1 方形卡需裁掉左右约 25%。不想裁可加白边或背景补齐，代价是实际画面分辨率下降一档。' }
            },
            {
              '@type': 'Question',
              name: 'DPI 和 PPI 有区别吗？',
              acceptedAnswer: { '@type': 'Answer', text: 'PPI 是图像每英寸的像素采样数，DPI 是打印机每英寸落下的墨点数。下单沟通时常混用，本工具按 1 像素约等于 1 印刷点换算；打印机标称 1200DPI 并不意味着照片需要 1200PPI。' }
            },
            {
              '@type': 'Question',
              name: '计算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。页面只做像素、厘米、英寸与 DPI 的数值换算，不访问相册、不读取文件、不发送网络请求。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const CM_PER_INCH = 2.54

// 统一小数位（默认 1 位），避免浮点尾差进入展示
function roundTo(value, digits = 1) {
  const f = Math.pow(10, digits)
  return Math.round(value * f) / f
}

function isPosNum(v) {
  return typeof v === 'number' && Number.isFinite(v) && v > 0
}

// 像素 → 可印尺寸：英寸 = 像素 ÷ DPI，厘米 = 英寸 × 2.54
function printSizeOf(w, h, dpi) {
  if (!isPosNum(w) || !isPosNum(h) || !isPosNum(dpi)) return null
  const inchW = w / dpi
  const inchH = h / dpi
  return {
    dpi,
    inch: { w: roundTo(inchW, 1), h: roundTo(inchH, 1) },
    cm: { w: roundTo(inchW * CM_PER_INCH, 1), h: roundTo(inchH * CM_PER_INCH, 1) }
  }
}

// 尺寸 → 所需像素：像素 = 厘米 ÷ 2.54 × DPI，个位取整（整数像素）
function requiredPxOf(cmW, cmH, dpi) {
  if (!isPosNum(cmW) || !isPosNum(cmH) || !isPosNum(dpi)) return null
  return {
    w: Math.round((cmW / CM_PER_INCH) * dpi),
    h: Math.round((cmH / CM_PER_INCH) * dpi)
  }
}

// 百万像素（保留 1 位小数）
function megapixelsOf(w, h) {
  if (!isPosNum(w) || !isPosNum(h)) return null
  return roundTo((w * h) / 1000000, 1)
}

// 质量档判定：按实际 DPI 落入六档，给出徽章与一句话观感
const QUALITY_GRADES = [
  { id: 'refine', min: 300, label: '精修', tone: 'green', verdict: '放心冲', hint: '25cm 手持看仍锐利无网点，杂志、收藏级相册' },
  { id: 'sharp', min: 200, label: '清晰', tone: 'blue', verdict: '可冲', hint: '正常距离看不出颗粒，相册书与桌面打印足够' },
  { id: 'good', min: 150, label: '良好', tone: 'primary', verdict: '可冲', hint: 'A4 以内通用档，贴近看略软' },
  { id: 'ok', min: 100, label: '可接受', tone: 'amber', verdict: '偏柔', hint: '海报、展架等一米外观看够用，近看偏软' },
  { id: 'rough', min: 72, label: '粗糙', tone: 'orange', verdict: '勉强', hint: '可见像素格与锯齿，只宜远观或小图' },
  { id: 'blurry', min: -Infinity, label: '糊', tone: 'red', verdict: '不建议', hint: '马赛克感明显，需换大图或缩小尺寸' }
]

function qualityGradeOf(actualDpi) {
  if (!isPosNum(actualDpi)) return null
  return QUALITY_GRADES.find((g) => actualDpi >= g.min) || null
}

// 铺满相纸时的实际 DPI：允许横竖旋转，两方向各折算后取较小（短边取严）
function bestPrintDpiOf(w, h, cmW, cmH) {
  if (!isPosNum(w) || !isPosNum(h) || !isPosNum(cmW) || !isPosNum(cmH)) return null
  const inW = cmW / CM_PER_INCH
  const inH = cmH / CM_PER_INCH
  const straight = Math.min(w / inW, h / inH)
  const rotated = Math.min(h / inW, w / inH)
  return roundTo(Math.max(straight, rotated), 1)
}

// 比例匹配：imgRatio / paperRatio = 宽 ÷ 高，返回铺满需裁剪的百分比与文案
function ratioMatchOf(imgRatio, paperRatio) {
  if (!isPosNum(imgRatio) || !isPosNum(paperRatio)) return null
  const diff = Math.abs(imgRatio - paperRatio) / Math.max(imgRatio, paperRatio)
  if (diff < 0.005) {
    return { cropPercent: 0, axis: null, rotated: false, text: '照片比例与相纸一致，铺满即冲，无需裁剪。' }
  }
  // 图相对更宽 → 裁宽（左右）；图相对更窄 → 裁高（上下）
  const axis = imgRatio > paperRatio ? 'width' : 'height'
  const crop = roundTo((1 - Math.min(imgRatio, paperRatio) / Math.max(imgRatio, paperRatio)) * 100, 1)
  const sideText = axis === 'width' ? '左右' : '上下'
  return {
    cropPercent: crop,
    axis,
    rotated: false,
    text: `照片比例 ${roundTo(imgRatio, 2)} 与目标比例 ${roundTo(paperRatio, 2)} 不一致：铺满需居中裁掉${sideText}约 ${crop}%（每边约 ${roundTo(crop / 2, 1)}%），或加白边 / 背景补齐不裁剪（画面仍占约 ${roundTo(100 - crop, 1)}% 面积）。`
  }
}

// 允许把成品转横 / 转竖后取裁剪更小的一种（与 bestPrintDpiOf 的旋转口径保持一致）
function bestRatioMatchOf(imgW, imgH, paperW, paperH) {
  if (!isPosNum(imgW) || !isPosNum(imgH) || !isPosNum(paperW) || !isPosNum(paperH)) return null
  const imgRatio = imgW / imgH
  const straight = ratioMatchOf(imgRatio, paperW / paperH)
  const rotated = ratioMatchOf(imgRatio, paperH / paperW)
  const pick = rotated.cropPercent < straight.cropPercent ? { ...rotated, rotated: true } : straight
  if (pick.cropPercent === 0) return pick
  return { ...pick, text: `${pick.rotated ? '成品按横竖互换后，' : ''}${pick.text}` }
}

// 相机像素是否够打印目标尺寸：够则给出余量倍数，不够则给出上限
function cameraVerdictOf(requiredW, requiredH, camMp, targetLabel, dpi) {
  const need = megapixelsOf(requiredW, requiredH)
  if (need === null || !isPosNum(camMp)) return null
  if (camMp >= need) {
    return {
      ok: true,
      neededMp: need,
      text: `${targetLabel} @ ${dpi} DPI 需要 ${requiredW} × ${requiredH} 像素（约 ${need} MP），你的 ${camMp} MP 相机达标，余量约 ${roundTo(camMp / need, 1)} 倍——即使构图时裁掉一边、或按 3:2 / 4:3 出片也仍然够用。`
    }
  }
  // 反查：按目标比例，这台相机最多印到多大尺寸（同 DPI）
  const ratio = requiredW / requiredH
  const availPx = camMp * 1000000
  const maxW = Math.round(Math.sqrt(availPx * ratio))
  const maxH = Math.round(maxW / ratio)
  const maxCmW = roundTo((maxW / dpi) * CM_PER_INCH, 1)
  const maxCmH = roundTo((maxH / dpi) * CM_PER_INCH, 1)
  return {
    ok: false,
    neededMp: need,
    text: `${targetLabel} @ ${dpi} DPI 需要 ${requiredW} × ${requiredH} 像素（约 ${need} MP），你的 ${camMp} MP 不足：同比例下按这个 DPI 最多只能印到 ${maxCmW} × ${maxCmH} cm。想保住成品尺寸，可把质量档降到 ${Math.round(dpi * Math.sqrt(availPx / (requiredW * requiredH)))} DPI 左右（${qualityGradeOf(dpi * Math.sqrt(availPx / (requiredW * requiredH))).label}），或改印小一档。`
  }
}

// 主流冲印规格（cm，长边 × 短边；寸数为国内冲印店长边叫法）
const PAPER_SIZES = [
  { id: '3R', name: '3R（L 版）', aka: '冲印店称 5 寸', w: 12.7, h: 8.9 },
  { id: '4R', name: '4R', aka: '冲印店称 6 寸 = 4R 系', w: 15.2, h: 10.2 },
  { id: '5R', name: '5R', aka: '冲印店称 7 寸', w: 17.8, h: 12.7 },
  { id: '6R', name: '6R', aka: '冲印店称 8 寸', w: 20.3, h: 15.2 },
  { id: '8R', name: '8R', aka: '冲印店称 10 寸', w: 25.4, h: 20.3 },
  { id: 'A4', name: 'A4', aka: '文件 / 照片打印', w: 21.0, h: 29.7 },
  { id: 'A3', name: 'A3', aka: '小海报 / 对折页', w: 29.7, h: 42.0 }
]

// 三档并排展示的 DPI 与观感备注
const DPI_TIERS = [
  { dpi: 300, note: '精修近看' },
  { dpi: 200, note: '相册书档' },
  { dpi: 150, note: '通用打印' }
]

// 反向模式的质量档（按观距分档）
const QUALITY_OPTIONS = [
  { dpi: 300, label: '300 DPI · 精修（收藏 / 杂志 / 近看）' },
  { dpi: 200, label: '200 DPI · 近看（相册书 / 摆台）' },
  { dpi: 150, label: '150 DPI · 通用（A4 照片 / 文档插图）' },
  { dpi: 100, label: '100 DPI · 远观海报（一米外 / 易拉宝）' },
  { dpi: 72, label: '72 DPI · 屏显（网页 / 朋友圈，不建议印）' }
]

const PRESETS = [
  { id: 'phone43', name: '手机横图', w: 4000, h: 3000 },
  { id: 'phone916', name: '手机竖图', w: 1080, h: 1920 }
]

const TONE_CLASS = {
  green: 'bg-green-500/10 text-green-600 border-green-500/20',
  blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  primary: 'bg-primary/10 text-primary border-primary/20',
  amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  orange: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  red: 'bg-red-500/10 text-red-600 border-red-500/20'
}

// 徽章文案：按相纸实际 DPI 生成「6 寸精修、A4 良好、A3 可接受」这类结论
function verdictTextOf(w, h, papers) {
  const pick = ['4R', 'A4', 'A3']
    .map((id) => papers.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => `${p.shortName} ${p.grade.label}`)
  const mp = megapixelsOf(w, h)
  return `这张 ${w}×${h}（约 ${mp} MP）的照片：${pick.join('、')}。近看要求越高，越要靠短边像素撑住；远观海报可以把档位放宽到 100 DPI。`
}

// ---------- 响应式状态 ----------
const mode = ref('toSize')          // toSize: 像素→尺寸；toPx: 尺寸→像素
const pxW = ref(4000)
const pxH = ref(3000)
const targetId = ref('A4')
const customW = ref(30)
const customH = ref(40)
const selectedDpi = ref(300)
const cameraMp = ref(12)
const seoContentVisible = ref(true)

const toneClass = TONE_CLASS
const presets = PRESETS
const qualityOptions = QUALITY_OPTIONS
const targetOptions = computed(() =>
  PAPER_SIZES.map((p) => ({ id: p.id, label: `${p.name}（${p.aka} ${p.w} × ${p.h} cm）` })).concat([{ id: 'custom', label: '自定义尺寸（cm × cm）' }])
)

const pixelsValid = computed(() => isPosNum(pxW.value) && isPosNum(pxH.value))
const pxN = computed(() => Math.round(pxW.value * pxH.value))
const mpText = computed(() => {
  const mp = megapixelsOf(pxW.value, pxH.value)
  return mp === null ? '—' : mp.toFixed(1)
})
const ratioText = computed(() => {
  if (!pixelsValid.value) return '—'
  return `${roundTo(pxW.value / pxH.value, 2)} : 1`
})

// 三档 DPI 并排结果
const tierResults = computed(() => {
  if (!pixelsValid.value) return []
  return DPI_TIERS.map((t) => {
    const size = printSizeOf(pxW.value, pxH.value, t.dpi)
    return {
      dpi: t.dpi,
      note: t.note,
      cmText: `${size.cm.w} × ${size.cm.h} cm`,
      inchText: `${size.inch.w} × ${size.inch.h} in`,
      grade: qualityGradeOf(t.dpi)
    }
  })
})

// 相纸档位判定表
const paperRows = computed(() => {
  if (!pixelsValid.value) return []
  return PAPER_SIZES.map((p) => {
    const dpi = bestPrintDpiOf(pxW.value, pxH.value, p.w, p.h)
    const match = bestRatioMatchOf(pxW.value, pxH.value, p.w, p.h)
    return {
      id: p.id,
      name: p.name,
      shortName: p.id === '4R' ? '6寸' : p.id === '5R' ? '7寸' : p.id === '6R' ? '8寸' : p.id === '8R' ? '10寸' : p.id === '3R' ? '5寸' : p.id,
      sizeText: `${p.w} × ${p.h} cm · ${p.aka}`,
      dpiNum: Math.round(dpi),
      dpiText: `${Math.round(dpi)} DPI`,
      grade: qualityGradeOf(dpi),
      cropPercent: match ? match.cropPercent : 0
    }
  })
})

const verdictChips = computed(() =>
  paperRows.value
    .filter((r) => ['4R', 'A4', 'A3'].includes(r.id))
    .map((r) => ({ id: r.id, tone: r.grade.tone, text: `${r.shortName} ${r.grade.label} · ${r.dpiNum} DPI` }))
)

const verdictText = computed(() => {
  if (!pixelsValid.value) return ''
  return verdictTextOf(Math.round(pxW.value), Math.round(pxH.value), paperRows.value)
})

// 反向模式：目标尺寸
const activeTarget = computed(() => {
  if (targetId.value === 'custom') return { id: 'custom', name: '自定义', w: customW.value, h: customH.value }
  const p = PAPER_SIZES.find((x) => x.id === targetId.value)
  return p ? { id: p.id, name: p.name, w: p.w, h: p.h } : null
})
const targetValid = computed(() => activeTarget.value && isPosNum(activeTarget.value.w) && isPosNum(activeTarget.value.h))
const targetLabel = computed(() => {
  if (!activeTarget.value) return '目标尺寸'
  if (activeTarget.value.id === 'custom') return `自定义 ${activeTarget.value.w} × ${activeTarget.value.h} cm`
  return `${activeTarget.value.name}（${activeTarget.value.w} × ${activeTarget.value.h} cm）`
})
const required = computed(() =>
  targetValid.value ? requiredPxOf(activeTarget.value.w, activeTarget.value.h, selectedDpi.value) : { w: 0, h: 0 }
)
const requiredMpText = computed(() => {
  const mp = required.value.w ? megapixelsOf(required.value.w, required.value.h) : null
  return mp === null ? '—' : mp.toFixed(1)
})
const requiredRoundedText = computed(() => `${Math.round(required.value.w / 10) * 10} × ${Math.round(required.value.h / 10) * 10}`)
const pxSizeText = computed(() => {
  if (!targetValid.value) return '—'
  const inchW = roundTo(activeTarget.value.w / CM_PER_INCH, 1)
  const inchH = roundTo(activeTarget.value.h / CM_PER_INCH, 1)
  return `成品 ${inchW} × ${inchH} 英寸 · ${activeTarget.value.w} × ${activeTarget.value.h} cm`
})
const cameraMpText = computed(() => (isPosNum(cameraMp.value) ? cameraMp.value : '—'))
const selectedGrade = computed(() => qualityGradeOf(selectedDpi.value) || qualityGradeOf(150))
const cameraVerdict = computed(() =>
  targetValid.value
    ? cameraVerdictOf(required.value.w, required.value.h, cameraMp.value, activeTarget.value.id === 'custom' ? '自定义尺寸' : activeTarget.value.name, selectedDpi.value)
    : null
)
const cameraOk = computed(() => (cameraVerdict.value ? cameraVerdict.value.ok : false))
const cameraVerdictText = computed(() => (cameraVerdict.value ? cameraVerdict.value.text : '请输入有效的相机百万像素数（例如 12）。'))

// 反向模式：与照片原图的比例匹配提醒（同样允许成品转方向）
const sourceMatch = computed(() => {
  if (!targetValid.value || !pixelsValid.value) return null
  return bestRatioMatchOf(pxW.value, pxH.value, activeTarget.value.w, activeTarget.value.h)
})

function fmtInt(v) {
  if (!Number.isFinite(v)) return '—'
  return Math.round(v).toLocaleString('en-US')
}

function applyPreset(p) {
  pxW.value = p.w
  pxH.value = p.h
}

function loadExample() {
  mode.value = 'toSize'
  pxW.value = 2400
  pxH.value = 1600
  targetId.value = 'A4'
  selectedDpi.value = 300
  cameraMp.value = 12
}

function resetInputs() {
  mode.value = 'toSize'
  pxW.value = 4000
  pxH.value = 3000
  targetId.value = 'A4'
  customW.value = 30
  customH.value = 40
  selectedDpi.value = 300
  cameraMp.value = 12
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('print-resolution-calculator')
})
</script>
