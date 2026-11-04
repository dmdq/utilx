<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Film class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">视频码率计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">码率 × 时长 → 文件体积、目标体积反算平均码率、OBS 推流与上传平台推荐码率速查</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线视频码率计算器：录屏、直播推流、投稿上传前先把体积和码率算清楚。正向按「码率(Mbps) × 时长(s) × 0.125」即时估算文件大小（MB / GB 双显，音频码率可选叠加）；
        反向按目标文件大小和时长反推平均码率；再对照录屏 / 直播 / 上传三套场景的推荐码率速查表（含 YouTube 官方上传推荐、B 站投稿码率说明、Twitch 推流上限）与 OBS 推流场景卡，
        把「该给多少码率、录下来多大、传上去会不会被二压」一次算明白。全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：参数与模式 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Film class="w-5 h-5 mr-2 text-primary" /> 计算参数
        </h2>

        <!-- 模式切换 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">计算方向</label>
          <div class="flex rounded-lg border border-border overflow-hidden w-fit">
            <button
              type="button"
              @click="mode = 'forward'"
              class="px-4 py-1.5 text-xs font-medium"
              :class="mode === 'forward' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'"
            >码率 → 文件大小</button>
            <button
              type="button"
              @click="mode = 'reverse'"
              class="px-4 py-1.5 text-xs font-medium"
              :class="mode === 'reverse' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'"
            >文件大小 → 码率</button>
          </div>
        </div>

        <!-- 分辨率预设（两种模式都可用于选推荐码率） -->
        <div>
          <label for="bc-res" class="block text-sm font-medium text-foreground mb-1.5">分辨率预设</label>
          <select id="bc-res" v-model="resChoice" class="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option v-for="r in RES_PRESETS" :key="r.id" :value="r.id">{{ r.label }}</option>
          </select>
          <div v-if="isCustomRes" class="flex items-center gap-2 mt-2">
            <input v-model.number="customWidth" type="number" min="16" step="2" class="flex-1 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="宽" />
            <span class="text-xs text-muted-foreground">×</span>
            <input v-model.number="customHeight" type="number" min="16" step="2" class="flex-1 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="高" />
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">
            分辨率与帧率不直接进体积公式（体积只由码率 × 时长决定），它们决定你<b class="text-foreground">该选多大码率</b>——见下方推荐表，可一键填入。
          </p>
        </div>

        <!-- 帧率 -->
        <div>
          <label for="bc-fps" class="block text-sm font-medium text-foreground mb-1.5">帧率 fps</label>
          <div class="flex items-center gap-2">
            <input id="bc-fps" v-model.number="fps" type="number" min="1" step="1" class="w-28 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="f in FPS_CHIPS"
                :key="f"
                type="button"
                @click="fps = f"
                class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
                :class="fps === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              >{{ f }}</button>
            </div>
          </div>
        </div>

        <!-- 正算：码率 + 时长 -->
        <div v-if="mode === 'forward'" class="space-y-4">
          <div>
            <label for="bc-bitrate" class="block text-sm font-medium text-foreground mb-1.5">视频码率</label>
            <div class="flex items-center gap-2">
              <input id="bc-bitrate" v-model.number="videoBitrate" type="number" min="0" step="0.5" class="flex-1 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <span class="text-xs text-muted-foreground whitespace-nowrap">Mbps（兆比特/秒）</span>
            </div>
          </div>
          <div>
            <label for="bc-dur" class="block text-sm font-medium text-foreground mb-1.5">时长</label>
            <div class="flex items-center gap-2">
              <input id="bc-dur" v-model.number="duration" type="number" min="0" step="1" class="flex-1 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <div class="flex rounded-lg border border-border overflow-hidden">
                <button
                  v-for="u in DUR_UNITS"
                  :key="u.id"
                  type="button"
                  @click="durUnit = u.id"
                  class="px-3 py-1.5 text-xs font-medium"
                  :class="durUnit === u.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'"
                >{{ u.label }}</button>
              </div>
            </div>
            <div class="flex flex-wrap gap-1.5 mt-2">
              <button
                v-for="d in DUR_CHIPS"
                :key="d.label"
                type="button"
                @click="applyDurChip(d)"
                class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
                :class="duration === d.value && durUnit === 'min' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              >{{ d.label }}</button>
            </div>
          </div>
        </div>

        <!-- 反算：目标大小 + 时长 -->
        <div v-else class="space-y-4">
          <div>
            <label for="bc-size" class="block text-sm font-medium text-foreground mb-1.5">目标文件大小</label>
            <div class="flex items-center gap-2">
              <input id="bc-size" v-model.number="targetSize" type="number" min="0" step="1" class="flex-1 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <div class="flex rounded-lg border border-border overflow-hidden">
                <button
                  v-for="u in SIZE_UNITS"
                  :key="u.id"
                  type="button"
                  @click="sizeUnit = u.id"
                  class="px-3 py-1.5 text-xs font-medium"
                  :class="sizeUnit === u.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'"
                >{{ u.label }}</button>
              </div>
            </div>
          </div>
          <div>
            <label for="bc-rdur" class="block text-sm font-medium text-foreground mb-1.5">时长</label>
            <div class="flex items-center gap-2">
              <input id="bc-rdur" v-model.number="duration" type="number" min="0" step="1" class="flex-1 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <div class="flex rounded-lg border border-border overflow-hidden">
                <button
                  v-for="u in DUR_UNITS"
                  :key="'r-' + u.id"
                  type="button"
                  @click="durUnit = u.id"
                  class="px-3 py-1.5 text-xs font-medium"
                  :class="durUnit === u.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'"
                >{{ u.label }}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 音频码率叠加 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">音频码率叠加（计入总大小 / 总码率）</label>
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="a in AUDIO_CHIPS"
              :key="a.value"
              type="button"
              @click="applyAudio(a.value)"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="audioKbps === a.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >{{ a.label }}</button>
            <input v-model.number="audioKbps" type="number" min="0" step="8" class="w-24 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <span class="text-xs text-muted-foreground">kbps 自定义</span>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">选 0 表示不叠加；双声道 AAC 常用 128 ~ 320 kbps，直播推流多取 128 ~ 160 kbps。</p>
        </div>

        <button type="button" @click="resetAll" class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition">
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认参数
        </button>

        <div v-if="validationIssues.length" class="space-y-1.5">
          <p v-for="issue in validationIssues" :key="issue" class="text-xs leading-relaxed p-2 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ issue }}</span>
          </p>
        </div>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-6">
        <!-- 正算结果 -->
        <div v-if="mode === 'forward'" class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <HardDrive class="w-5 h-5 mr-2 text-primary" /> 文件大小估算
          </h2>
          <div v-if="forwardResult" class="space-y-3">
            <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono">
              <span class="text-sm text-muted-foreground">{{ videoBitrate }} Mbps × {{ durationSecText }}</span>
              <span class="text-2xl text-primary">→</span>
              <span class="text-4xl lg:text-5xl font-bold text-primary break-all">{{ forwardResult.mbText }}</span>
              <span class="text-sm text-muted-foreground">= {{ forwardResult.gbText }}</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[11px] text-muted-foreground mb-1">视频流</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ forwardResult.videoMbText }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[11px] text-muted-foreground mb-1">音频流（{{ audioKbps }} kbps）</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ forwardResult.audioMbText }}</p>
              </div>
              <div class="bg-primary/10 rounded-lg p-3">
                <p class="text-[11px] text-muted-foreground mb-1">合计（含音频）</p>
                <p class="text-lg font-bold text-primary font-mono">{{ forwardResult.totalGbText }}</p>
              </div>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 border border-border text-foreground flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>口径：大小(MB) = 码率(Mbps) × 时长(s) × 0.125，1 MB = 10⁶ 字节；GB 按 MB ÷ 1024 显示。实际封装还有少量容器开销（通常 &lt;1%），编码器瞬时码率波动以平均码率为准。</span>
            </p>
          </div>
          <p v-else class="p-8 text-center text-sm text-muted-foreground">填入码率和时长开始计算</p>
        </div>

        <!-- 反算结果 -->
        <div v-else class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> 平均码率反算
          </h2>
          <div v-if="reverseResult" class="space-y-3">
            <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono">
              <span class="text-sm text-muted-foreground">{{ reverseResult.sizeMbText }} ÷ {{ durationSecText }}</span>
              <span class="text-2xl text-primary">→</span>
              <span class="text-4xl lg:text-5xl font-bold text-primary break-all">{{ reverseResult.totalText }}</span>
              <span class="text-sm text-muted-foreground">总码率</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">总平均码率（含音频）</p>
                <p class="text-2xl lg:text-3xl font-bold text-primary font-mono break-all">{{ reverseResult.totalText }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">建议视频码率（预留 {{ audioKbps }} kbps 音频后）</p>
                <p class="text-2xl lg:text-3xl font-bold text-foreground font-mono break-all">{{ reverseResult.videoText }}</p>
              </div>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 border border-border text-foreground flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>口径：码率(Mbps) = 大小(MB) ÷ [时长(s) × 0.125]。按此码率用 CBR / 平均码率模式压制或录制，成品体积即接近目标值；VBR 波动大时建议留 5% ~ 10% 余量。</span>
            </p>
          </div>
          <p v-else class="p-8 text-center text-sm text-muted-foreground">填入目标大小和时长开始计算</p>
        </div>

        <!-- 当前分辨率/帧率对应的推荐码率提示 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <ListChecks class="w-5 h-5 mr-2 text-primary" /> 当前参数的推荐码率
          </h2>
          <p class="text-xs text-muted-foreground mb-3 leading-relaxed">
            按左侧分辨率 {{ resMeta.label }} + {{ fps }} fps 匹配推荐表（帧率按 48 ~ 60 fps 高帧率档判定）。
          </p>
          <div v-if="matchedRecommendRows.length" class="space-y-2">
            <div v-for="row in matchedRecommendRows" :key="row.label + row.value" class="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/40">
              <div class="min-w-0">
                <p class="text-sm font-medium text-foreground">{{ row.label }}</p>
                <p class="text-[11px] text-muted-foreground mt-0.5">{{ row.source }}</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="text-sm font-mono font-semibold text-primary whitespace-nowrap">{{ row.value }}</span>
                <button
                  v-if="row.fill !== undefined"
                  type="button"
                  @click="fillBitrate(row.fill)"
                  class="px-2.5 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition"
                >填入</button>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground">该分辨率未收录推荐档位，可参考下方速查表按相邻档位取值。</p>
          <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            来源与口径：YouTube 官方《推荐上传编码设置》、B 站创作中心《视频码率说明》、Twitch 官方 Broadcasting Guidelines，均于 2026-11 核证；平台随时可能调整，以平台官方页面实时口径为准。标注「经验值」的档位为社区通行经验，非官方数字。
          </p>
        </div>
      </div>
    </div>

    <!-- 推荐码率速查表 + OBS 推流场景卡 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 推荐码率速查表 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center mb-1">
          <Table2 class="w-5 h-5 mr-2 text-primary" /> 推荐码率速查表
        </h2>
        <p class="text-xs text-muted-foreground mb-3 leading-relaxed">
          分录屏 / 直播 / 上传三组场景；SDR 画质口径，HDR 需约 1.3 ~ 1.5 倍。数字均标注来源，无法确证的一律标「经验值」。
        </p>
        <div class="space-y-4">
          <div v-for="group in RECOMMEND_TABLE" :key="group.group" class="overflow-x-auto">
            <p class="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>{{ group.group }}
            </p>
            <table class="w-full text-xs border-collapse">
              <thead>
                <tr class="text-left text-muted-foreground border-b border-border">
                  <th class="py-1.5 pr-2 font-medium">档位</th>
                  <th class="py-1.5 pr-2 font-medium">推荐码率</th>
                  <th class="py-1.5 font-medium">来源</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in group.rows" :key="row.label + row.value" class="border-b border-border/60">
                  <td class="py-1.5 pr-2 text-foreground">{{ row.label }}</td>
                  <td class="py-1.5 pr-2 font-mono text-primary whitespace-nowrap">{{ row.value }}</td>
                  <td class="py-1.5 text-muted-foreground leading-relaxed">{{ row.source }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p class="text-[11px] text-muted-foreground mt-4 leading-relaxed p-2.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400">
          <TriangleAlert class="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
          以上为 2026-11 核证口径。平台码率策略随时调整（尤其二压规则），投稿 / 推流前请以平台官方页面实时口径为准。
        </p>
      </div>

      <!-- OBS 推流场景卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <MonitorPlay class="w-5 h-5 mr-2 text-primary" /> OBS 推流场景参考
        </h2>
        <div class="space-y-2">
          <div v-for="p in OBS_PLATFORMS" :key="p.name" class="p-3 rounded-lg border border-border bg-muted/40">
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-medium text-foreground">{{ p.name }}</p>
              <span class="text-sm font-mono font-semibold text-primary whitespace-nowrap">{{ p.value }}</span>
            </div>
            <p class="text-[11px] text-muted-foreground mt-1 leading-relaxed">{{ p.note }}</p>
          </div>
        </div>
        <div class="p-3 rounded-lg bg-muted/60 border border-border">
          <p class="text-xs font-medium text-foreground mb-1.5">推流参数通用建议</p>
          <ul class="list-disc list-inside space-y-1 text-xs text-muted-foreground leading-relaxed">
            <li>码率控制选 CBR（恒定码率），推流稳定性优先于画质波动。</li>
            <li>关键帧间隔 2 s 是 Twitch 的官方要求，其他平台也普遍按 2 s 处理。</li>
            <li>上行带宽留余量：建议推流码率 ≤ 上行带宽实测值的 70% ~ 75%。</li>
            <li>音频 128 ~ 160 kbps AAC 足够直播；采样率与平台要求保持一致（常见 48 kHz）。</li>
          </ul>
        </div>
        <p class="text-[11px] text-muted-foreground leading-relaxed">
          注：B 站直播官方未公开统一的硬性码率上限，「8000 kbps」为直播姬官方教程中 1080P 的推荐档（即「蓝光 8M」画质档）；YouTube 直播未设统一硬上限、按分辨率给推荐区间，均以平台官方页面实时口径为准。
        </p>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="relative mb-12">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>视频码率计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一款面向录屏、直播推流与视频投稿场景的在线码率换算工具。核心只有一条换算：码率是「每秒多少比特」，
          体积是「总共多少比特」，所以文件大小(MB) = 码率(Mbps) × 时长(s) × 0.125（比特换字节除以 8，兆比特换兆字节即 ×0.125）。
          本页把这条换算做成两个方向：知道码率和时长，算成品体积；知道目标体积和时长，反算平均码率。
          再配上录屏 / 直播 / 上传三套场景的推荐码率速查表与 OBS 推流平台上限参考，全部在浏览器本地计算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">分辨率和帧率影响文件大小吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不直接影响。同样的码率下，4K 和 720p 录 10 分钟体积一样——分辨率与帧率决定的是「这些比特摊到多少像素上」，
          也就是画质清晰度：像素越多、画面运动越剧烈，要维持同等清晰度就需要越高的码率。
          所以正确用法是先用本页推荐表按「分辨率 + 帧率」查出该给的码率，再用码率 × 时长算体积。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">视频码率怎么选？三个场景一张表</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed mb-4">
          <li><strong>录屏存档</strong>：画质优先，可给足码率或用 CQP/CRF 恒定质量模式；1080p60 常用 12 ~ 15 Mbps、4K60 40 ~ 60 Mbps（经验值）。</li>
          <li><strong>直播推流</strong>：受上行带宽与平台上限双重约束，Twitch 官方上限 6000 kbps；B 站直播姬 1080P 推荐 5000 ~ 8000 kbps。</li>
          <li><strong>投稿上传</strong>：按平台官方推荐给足码率避免二压——YouTube 官方推荐 1080p60 用 12 Mbps、4K60 用 53 ~ 68 Mbps；B 站码率说明要求 1080p &gt; 6000 kbps、4K &gt; 20000 kbps。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么传上去画质变差了？聊聊「二压」</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          平台转码为控制带宽成本，会把上传视频再压一遍（俗称二压）。若上传码率低于平台该清晰度的分发码率，二压后画质必然劣化；
          B 站社区经验是当视频码率达到官方说明的建议值（如 1080p &gt; 6000 kbps）且编码参数合规时，有机会以接近原画质量转码。
          通用策略：按官方推荐码率或略高于分发码率上传、高帧率视频保持帧率一致、避免非标准分辨率（如 B 站无 2K 档位，1080P 或 4K 二选一）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">音频码率要算进去吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          要。封装成品 = 视频流 + 音频流。AAC 双声道常用 128 ~ 320 kbps：128 kbps 够语音与普通游戏声，320 kbps 适合音乐向内容。
          1 小时 128 kbps 音频约 57.6 MB，对总量影响不大，但精确对盘 / 反算码率时应计入——本页默认叠加 128 kbps，可切换 256 / 320 或自定义，选 0 则不计。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">10 Mbps 录 1 小时多大？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              10 Mbps × 3600 s × 0.125 = 4500 MB ≈ 4.39 GB（纯视频流）。叠加 128 kbps 音频再加约 57.6 MB。
              本工具正算模式输入 10 + 3600 s 即得，无需手算。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">想控制视频不超过某个体积，码率该给多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              用反算模式：目标大小 ÷ 时长换算平均码率。例如目标 2 GB（2048 MB）录 60 分钟，
              总平均码率约 2048 ÷ (3600 × 0.125) ≈ 4.55 Mbps，再减去音频预留（128 kbps 后视频约 4.42 Mbps）。
              VBR 编码建议再留 5% ~ 10% 余量。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">OBS 直播码率给多少合适？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              先看平台上限：Twitch 上限 6000 kbps（官方 Broadcasting Guidelines，1080p60 即打满）；B 站直播姬 1080P 推荐 5000 或 8000 kbps；
              YouTube 直播无统一硬上限。再看上行带宽：码率不超过上行实测的 70% ~ 75%。1080p60 游戏直播在 6000 ~ 8000 kbps 区间是通行选择（以平台官方页面实时口径为准）。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">MB 和 GB 按 1000 还是 1024 换算？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              本工具 MB = 码率(Mbps) × 时长(s) × 0.125，即 1 MB = 10⁶ 字节的十进口径（操作系统资源管理器对文件大小的显示口径）；
              GB 一栏按 MB ÷ 1024 显示，对应「1 GB = 1024 MB」的日常习惯。两种口径差异约 2.4%，对估算体积足够。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不会。体积估算、码率反算与推荐表全部在你的浏览器内用纯算术即时完成，无网络请求，参数不被保存或上传。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'bitrate-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Film, HardDrive, Gauge, Info, RefreshCw, TriangleAlert,
  ChevronUp, ChevronDown, ListChecks, Table2, MonitorPlay
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '视频码率计算器 - 码率与文件大小互算、OBS 推流推荐码率 | 有条工具',
  description: '免费在线视频码率计算器：码率×时长即时估算文件大小（MB/GB 双显），目标体积反算平均码率，音频码率叠加；附录屏/直播/上传推荐码率速查表（YouTube 官方、B 站码率说明、Twitch 上限）与 OBS 推流场景参考，纯浏览器本地计算不上传',
  keywords: '视频码率计算器,bitrate calculator,OBS 推流码率,录像文件大小计算,视频体积估算',
  author: '有条工具',
  ogTitle: '视频码率计算器 - 码率与文件大小互算 | 有条工具',
  ogDescription: '码率×时长即时估算视频体积，目标大小反算平均码率，附 OBS 推流与各平台推荐码率速查表。',
  ogUrl: 'https://www.util.cn/tools/bitrate-calculator',
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
          name: '视频码率计算器',
          url: 'https://www.util.cn/tools/bitrate-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '码率×时长正算文件大小（MB/GB 双显）',
            '目标文件大小反算平均码率',
            '音频码率叠加计入总大小（128/256/320 可自定义）',
            '分辨率预设 720p/1080p/2K/4K 与自定义宽高',
            '帧率匹配高帧率档推荐码率并可一键填入',
            '录屏/直播/上传推荐码率速查表（标注来源）',
            'OBS 推流平台码率上限参考',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '视频码率计算器', item: 'https://www.util.cn/tools/bitrate-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '10 Mbps 录 1 小时多大？',
              acceptedAnswer: { '@type': 'Answer', text: '10 Mbps × 3600 秒 × 0.125 = 4500 MB，约 4.39 GB（纯视频流）；叠加 128 kbps 音频再加约 57.6 MB。文件大小(MB) = 码率(Mbps) × 时长(s) × 0.125。' }
            },
            {
              '@type': 'Question',
              name: '想控制视频不超过某个体积，码率该给多少？',
              acceptedAnswer: { '@type': 'Answer', text: '用反算模式：目标大小(MB) ÷ [时长(s) × 0.125] 得总平均码率，再减去音频预留码率。例如目标 2 GB 录 60 分钟，总码率约 4.55 Mbps，预留 128 kbps 音频后视频约 4.42 Mbps，VBR 建议再留 5%~10% 余量。' }
            },
            {
              '@type': 'Question',
              name: 'OBS 直播码率给多少合适？',
              acceptedAnswer: { '@type': 'Answer', text: '先看平台上限（Twitch 官方上限 6000 kbps、B 站直播姬 1080P 推荐 5000~8000 kbps、YouTube 直播无统一硬上限），再看上行带宽（码率不超过上行实测的 70%~75%）。1080p60 游戏直播常用 6000~8000 kbps，以平台官方页面实时口径为准。' }
            },
            {
              '@type': 'Question',
              name: '分辨率和帧率影响文件大小吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不直接影响。体积只由码率×时长决定；分辨率与帧率决定的是同等清晰度下需要多高的码率，因此先用推荐表按分辨率+帧率查出码率，再算体积。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 单位约定：码率用 Mbps（兆比特/秒），时长一律换算成秒，体积 MB 按 1 MB = 10^6 字节。
// 核心公式：大小(MB) = 码率(Mbps) × 时长(s) × 0.125；反算 码率(Mbps) = 大小(MB) ÷ [时长(s) × 0.125]。
// GB 显示按 MB ÷ 1024 的日常习惯口径；音频 kbps = 1/1000 Mbps。

// 正算：视频码率(Mbps) + 时长(s) + 音频(kbps) → { videoMb, audioMb, totalMb }；非法输入返回 null
function fileSizeOf(bitrateMbps, durationSec, audioKbps) {
  const b = Number(bitrateMbps)
  const t = Number(durationSec)
  const a = Number(audioKbps)
  if (!Number.isFinite(b) || !Number.isFinite(t) || t <= 0 || b < 0) return null
  const videoMb = b * t * 0.125
  const audioMb = Number.isFinite(a) && a > 0 ? (a / 1000) * t * 0.125 : 0
  return { videoMb, audioMb, totalMb: videoMb + audioMb }
}

// 反算：目标大小(MB) + 时长(s) → 总平均码率(Mbps) 与预留音频后的视频码率；非法输入返回 null
function bitrateOf(sizeMb, durationSec, audioKbps) {
  const s = Number(sizeMb)
  const t = Number(durationSec)
  const a = Number(audioKbps)
  if (!Number.isFinite(s) || !Number.isFinite(t) || t <= 0 || s < 0) return null
  const total = s / (t * 0.125)
  const video = Number.isFinite(a) && a > 0 ? Math.max(0, total - a / 1000) : total
  return { total, video }
}

// 体积格式化：MB 数值 + 按 ÷1024 的 GB 显示文本
function formatMb(mb) {
  if (!Number.isFinite(mb)) return '—'
  return `${+(mb.toFixed(1))} MB`
}

function formatGb(mb) {
  if (!Number.isFinite(mb)) return '—'
  return `${+(mb / 1024).toFixed(2)} GB`
}

// 时长输入 + 单位（s/min/h）→ 秒；非法返回 null
function durationToSec(value, unit) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  const factor = unit === 'min' ? 60 : unit === 'h' ? 3600 : 1
  return n * factor
}

// 目标大小输入 + 单位（MB/GB）→ MB；非法返回 null
function sizeToMb(value, unit) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return unit === 'gb' ? n * 1024 : n
}

// 时长的人类可读文本（用于结果行回显）
function formatDuration(sec) {
  if (!Number.isFinite(sec)) return '—'
  if (sec >= 3600) return `${+(sec / 3600).toFixed(2)} 小时`
  if (sec >= 60) return `${+(sec / 60).toFixed(1)} 分钟`
  return `${+sec.toFixed(1)} 秒`
}

// ---------- 静态数据（来源均于 2026-11 核证，以平台官方页面实时口径为准） ----------
// 分辨率预设（自定义走宽 × 高输入）
const RES_PRESETS = [
  { id: '720p', label: '720p（1280 × 720）', width: 1280, height: 720 },
  { id: '1080p', label: '1080p（1920 × 1080）', width: 1920, height: 1080 },
  { id: '2k', label: '2K / 1440p（2560 × 1440）', width: 2560, height: 1440 },
  { id: '4k', label: '4K / 2160p（3840 × 2160）', width: 3840, height: 2160 },
  { id: 'custom', label: '自定义宽 × 高…', custom: true }
]

// 推荐码率速查表：三组场景。source 必标；无法确证的档位标「经验值」。
// 来源：YouTube 官方《推荐上传编码设置》（SDR 表）；B 站创作中心《视频码率说明》；
// Twitch 官方 Broadcasting Guidelines；B 站直播姬官方教程；录屏档为社区通行经验值。
const RECOMMEND_TABLE = [
  {
    group: '录屏 / 本地录制（OBS 录制，画质优先）',
    rows: [
      { label: '1080p60 录屏', value: '12 ~ 15 Mbps', source: '经验值（社区通行口径，非官方）', fill: 13.5, match: { res: '1080p', hiFps: true } },
      { label: '1080p30 录屏', value: '8 ~ 10 Mbps', source: '经验值（社区通行口径，非官方）', fill: 9, match: { res: '1080p', hiFps: false } },
      { label: '4K60 录屏', value: '40 ~ 60 Mbps', source: '经验值（社区通行口径，非官方）', fill: 50, match: { res: '4k', hiFps: true } },
      { label: '4K30 录屏', value: '30 ~ 45 Mbps', source: '经验值（社区通行口径，非官方）', fill: 37.5, match: { res: '4k', hiFps: false } }
    ]
  },
  {
    group: '直播推流（受平台上限与上行带宽约束）',
    rows: [
      { label: 'Twitch 1080p60', value: '上限 6000 kbps', source: 'Twitch 官方 Broadcasting Guidelines（2026-11 核证）', fill: 6, match: { res: '1080p', hiFps: true, platform: 'twitch' } },
      { label: 'B 站直播 1080P', value: '5000 ~ 8000 kbps', source: 'B 站直播姬官方教程推荐档（蓝光8M = 8000 kbps）', fill: 8, match: { res: '1080p', hiFps: true, platform: 'bilibili' } },
      { label: 'YouTube 直播', value: '无统一硬上限', source: '官方未公布统一上限，按分辨率给推荐区间', match: null }
    ]
  },
  {
    group: '投稿上传（给足码率避免二压）',
    rows: [
      { label: 'YouTube 720p（30 / 60fps）', value: '5 / 7.5 Mbps', source: 'YouTube 官方《推荐上传编码设置》SDR 表', fill: 5, match: { res: '720p', hiFps: false, platform: 'youtube' } },
      { label: 'YouTube 720p60', value: '7.5 Mbps', source: 'YouTube 官方《推荐上传编码设置》SDR 表', fill: 7.5, match: { res: '720p', hiFps: true, platform: 'youtube' } },
      { label: 'YouTube 1080p（30 / 60fps）', value: '8 / 12 Mbps', source: 'YouTube 官方《推荐上传编码设置》SDR 表', fill: 8, match: { res: '1080p', hiFps: false, platform: 'youtube' } },
      { label: 'YouTube 1080p60', value: '12 Mbps', source: 'YouTube 官方《推荐上传编码设置》SDR 表', fill: 12, match: { res: '1080p', hiFps: true, platform: 'youtube' } },
      { label: 'YouTube 2K（30 / 60fps）', value: '16 / 24 Mbps', source: 'YouTube 官方《推荐上传编码设置》SDR 表', fill: 16, match: { res: '2k', hiFps: false, platform: 'youtube' } },
      { label: 'YouTube 2K60', value: '24 Mbps', source: 'YouTube 官方《推荐上传编码设置》SDR 表', fill: 24, match: { res: '2k', hiFps: true, platform: 'youtube' } },
      { label: 'YouTube 4K（30 / 60fps）', value: '35 ~ 45 / 53 ~ 68 Mbps', source: 'YouTube 官方《推荐上传编码设置》SDR 表', fill: 40, match: { res: '4k', hiFps: false, platform: 'youtube' } },
      { label: 'YouTube 4K60', value: '53 ~ 68 Mbps', source: 'YouTube 官方《推荐上传编码设置》SDR 表', fill: 60, match: { res: '4k', hiFps: true, platform: 'youtube' } },
      { label: 'B 站投稿 1080p', value: '> 6000 kbps（6 Mbps）', source: 'B 站创作中心《视频码率说明》（2026-11 核证）', fill: 6.5, match: { res: '1080p', hiFps: null, platform: 'bilibili-upload' } },
      { label: 'B 站投稿 4K', value: '> 20000 kbps（20 Mbps）', source: 'B 站创作中心《视频码率说明》（2026-11 核证）', fill: 20, match: { res: '4k', hiFps: null, platform: 'bilibili-upload' } },
      { label: 'B 站投稿 8K', value: '> 40000 kbps（40 Mbps）', source: 'B 站创作中心《视频码率说明》（2026-11 核证）', match: null }
    ]
  }
]

// OBS 推流平台参考：不确定的口径不写死，正文说明。
const OBS_PLATFORMS = [
  {
    name: 'Twitch',
    value: '上限 6000 kbps',
    note: '官方 Broadcasting Guidelines：1080p60 即 6000 kbps 上限，关键帧间隔 2 s，码率控制 CBR。'
  },
  {
    name: 'YouTube（直播 / 上传）',
    value: '无统一硬性上限',
    note: '官方未公布统一推流上限，直播编码器按分辨率给推荐区间；上传侧另有《推荐上传编码设置》码率表，以官方页面为准。'
  },
  {
    name: 'B 站直播',
    value: '1080P 推荐 5000 ~ 8000 kbps',
    note: '直播姬官方教程 1080P 推荐 5000 或 8000 kbps（「蓝光 8M」画质档即 8000 kbps）；官方未公开统一硬性上限，实际可用码率受线路与直播间权限影响。'
  }
]

const FPS_CHIPS = [24, 30, 60]
const DUR_UNITS = [
  { id: 's', label: '秒' },
  { id: 'min', label: '分' },
  { id: 'h', label: '时' }
]
const SIZE_UNITS = [
  { id: 'mb', label: 'MB' },
  { id: 'gb', label: 'GB' }
]
const DUR_CHIPS = [
  { label: '5 分钟', value: 5 },
  { label: '10 分钟', value: 10 },
  { label: '30 分钟', value: 30 },
  { label: '60 分钟', value: 60 }
]
const AUDIO_CHIPS = [
  { label: '不叠加', value: 0 },
  { label: '128 kbps', value: 128 },
  { label: '256 kbps', value: 256 },
  { label: '320 kbps', value: 320 }
]

// ---------- 响应式参数 ----------
const mode = ref('forward')
const resChoice = ref('1080p')
const customWidth = ref(1920)
const customHeight = ref(1080)
const fps = ref(60)
const videoBitrate = ref(12)
const duration = ref(60)
const durUnit = ref('min')
const targetSize = ref(2)
const sizeUnit = ref('gb')
const audioKbps = ref(128)
const seoContentVisible = ref(true)

const isCustomRes = computed(() => {
  const meta = RES_PRESETS.find((r) => r.id === resChoice.value)
  return !!meta && !!meta.custom
})

const resMeta = computed(() => RES_PRESETS.find((r) => r.id === resChoice.value) || RES_PRESETS[1])

const durationSec = computed(() => durationToSec(duration.value, durUnit.value))
const durationSecText = computed(() => (durationSec.value === null ? '—' : formatDuration(durationSec.value)))

// ---------- 正算结果 ----------
const forwardResult = computed(() => {
  const sec = durationSec.value
  if (sec === null) return null
  const r = fileSizeOf(videoBitrate.value, sec, audioKbps.value)
  if (!r) return null
  return {
    mbText: formatMb(r.videoMb),
    gbText: formatGb(r.videoMb),
    videoMbText: formatMb(r.videoMb),
    audioMbText: r.audioMb > 0 ? formatMb(r.audioMb) : '不计',
    totalMb: r.totalMb,
    totalGbText: formatGb(r.totalMb)
  }
})

// ---------- 反算结果 ----------
const targetMb = computed(() => sizeToMb(targetSize.value, sizeUnit.value))

const reverseResult = computed(() => {
  const sec = durationSec.value
  if (sec === null || targetMb.value === null) return null
  const r = bitrateOf(targetMb.value, sec, audioKbps.value)
  if (!r) return null
  return {
    sizeMbText: formatMb(targetMb.value),
    totalText: `${+(r.total.toFixed(2))} Mbps`,
    videoText: `${+(r.video.toFixed(2))} Mbps`
  }
})

// ---------- 推荐码率匹配（按分辨率预设 + 48~60fps 高帧率档） ----------
const hiFps = computed(() => Number(fps.value) >= 48)
const matchedRecommendRows = computed(() => {
  if (isCustomRes.value) return []
  const rows = []
  for (const group of RECOMMEND_TABLE) {
    for (const row of group.rows) {
      if (!row.match) continue
      const m = row.match
      if (m.res !== resChoice.value) continue
      if (m.hiFps !== null && m.hiFps !== undefined && m.hiFps !== hiFps.value) continue
      rows.push(row)
    }
  }
  // 同档位去重（如 YouTube 1080p30 与 1080p60 各保留匹配项）
  const seen = new Set()
  return rows.filter((r) => {
    const key = r.label + '|' + r.value
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})

const validationIssues = computed(() => {
  const list = []
  if (durationSec.value === null) list.push('时长需为大于 0 的数值')
  if (mode.value === 'forward') {
    const b = Number(videoBitrate.value)
    if (!Number.isFinite(b) || b < 0) list.push('视频码率需为不小于 0 的数值')
    if (b > 500) list.push('码率超 500 Mbps，请确认单位是 Mbps 而非 kbps')
  } else {
    if (targetMb.value === null) list.push('目标文件大小需为大于 0 的数值')
  }
  return list
})

// ---------- 交互动作 ----------
function applyDurChip(chip) {
  duration.value = chip.value
  durUnit.value = 'min'
}

function applyAudio(value) {
  audioKbps.value = value
}

function fillBitrate(mbps) {
  mode.value = 'forward'
  videoBitrate.value = mbps
  // 交互动作登记最近使用（onMounted 已登记，此处幂等）
  addRecentTool('bitrate-calculator')
}

function resetAll() {
  mode.value = 'forward'
  resChoice.value = '1080p'
  customWidth.value = 1920
  customHeight.value = 1080
  fps.value = 60
  videoBitrate.value = 12
  duration.value = 60
  durUnit.value = 'min'
  targetSize.value = 2
  sizeUnit.value = 'gb'
  audioKbps.value = 128
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('bitrate-calculator')
})
</script>
