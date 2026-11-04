<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Smartphone class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">手机号归属地查询</h1>
          <p class="text-sm text-muted-foreground mt-1">按号段识别运营商与归属地省市，支持批量查询、脱敏显示与 CSV 导出，纯本地匹配</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入 11 位手机号，自动清洗 +86 / 空格 / 横线等分隔符，按前 3 位网号识别移动、联通、电信或虚拟运营商，再以 7 位→4 位最长前缀匹配内置归属地库给出省市。
        归属地以号段首次放号城市为口径，支持每行一号的批量查询（自动去重）与结果导出。全部查询在浏览器本地完成，号码不上传。
      </p>
    </div>

    <!-- 数据口径说明条（诚实口径，请保留） -->
    <div class="mb-6 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-foreground">
        内置号段库为公开分配规则的常见号段收录（截至 2025 年），覆盖主流号段；<strong>归属地以号段首次放号城市为准，实际使用地与携号转网会改变真实归属</strong>——本工具结果仅供参考，精确实时查询请以运营商官方为准。查询在本地完成，号码不上传。
      </p>
    </div>

    <!-- 工具主体：左输入 + 右结果 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入面板 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Search class="w-5 h-5 mr-2 text-primary" /> 号码查询
          </h2>

          <!-- 模式切换 -->
          <div class="grid grid-cols-2 gap-1.5 mb-4">
            <button
              @click="mode = 'single'"
              :class="mode === 'single' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all"
            >
              单号查询
            </button>
            <button
              @click="mode = 'batch'"
              :class="mode === 'batch' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all"
            >
              批量模式
            </button>
          </div>

          <!-- 单号输入（实时清洗 + 校验） -->
          <div v-if="mode === 'single'" class="space-y-3">
            <input
              v-model="singleInput"
              type="text"
              inputmode="tel"
              placeholder="如 138 0013 8000 / +86 138-0013-8000"
              class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p
              v-if="singleInput.trim()"
              class="flex items-start gap-1.5 text-xs leading-relaxed"
              :class="singlePreview.valid ? 'text-green-600' : 'text-destructive'"
            >
              <CheckCircle v-if="singlePreview.valid" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <TriangleAlert v-else class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ singlePreview.valid ? `已识别：${singlePreview.phone}（11 位有效手机号）` : singlePreview.error }}</span>
            </p>
            <div>
              <p class="text-xs text-muted-foreground mb-1.5">示例号码（点击填入）：</p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="chip in sampleNumbers"
                  :key="chip.phone"
                  @click="singleInput = chip.phone"
                  class="px-2 py-1 rounded border border-border bg-muted/50 hover:bg-muted text-xs font-mono text-muted-foreground hover:text-foreground transition"
                  :title="chip.label"
                >
                  {{ chip.phone }}
                </button>
              </div>
            </div>
          </div>

          <!-- 批量输入 -->
          <div v-else class="space-y-3">
            <textarea
              v-model="batchInput"
              class="w-full h-36 px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="每行一个手机号，例如：&#10;13800138000&#10;186-0101-2345&#10;+86 13305311234"
              spellcheck="false"
            ></textarea>
            <p class="text-xs text-muted-foreground">
              已输入 {{ batchLineCount }} 行（上限 200 行，自动去重、自动清洗分隔符）。
            </p>
            <button
              @click="runBatch"
              class="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <Play class="w-4 h-4" /> 解析批量结果
            </button>
          </div>

          <!-- 显示选项 -->
          <div class="mt-5 pt-4 border-t border-border space-y-3">
            <p class="text-xs font-medium text-foreground">显示选项</p>
            <button
              @click="maskOn = !maskOn"
              role="switch"
              :aria-checked="maskOn"
              class="flex items-center gap-2.5 group"
            >
              <span
                class="relative inline-block h-5 w-9 rounded-full transition-colors flex-shrink-0"
                :class="maskOn ? 'bg-primary' : 'bg-muted border border-border'"
              >
                <span
                  class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                  :class="maskOn ? 'translate-x-4' : 'translate-x-0'"
                ></span>
              </span>
              <span class="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                脱敏显示（138****5678）
              </span>
            </button>
          </div>

          <button
            @click="clearAll"
            class="mt-4 w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 清空全部输入与结果
          </button>

          <p class="text-xs text-muted-foreground leading-relaxed mt-4">
            内置号段表 {{ operatorSegmentCount }} 个 3 位网号 · 归属地库 {{ regionPrefixCount }} 条前缀，查询在本地完成。
          </p>
        </div>
      </div>

      <!-- 右侧：结果面板 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 单号结果卡 -->
        <div v-if="mode === 'single'" class="bg-card border border-border rounded-lg p-6 min-h-[280px]">
          <template v-if="singleResult">
            <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
              <p class="text-xs text-muted-foreground">查询结果（本地号段库匹配）</p>
              <div class="flex items-center gap-1.5">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium"
                  :class="operatorBadge(singleResult.carrier.operator).badge"
                >
                  <i class="w-2 h-2 rounded-full inline-block" :class="operatorBadge(singleResult.carrier.operator).dot"></i>
                  {{ singleResult.carrier.operator }}
                </span>
                <span
                  v-if="singleResult.carrier.special"
                  class="inline-flex items-center px-2 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-600 text-[10px] font-medium"
                >
                  特殊号段
                </span>
              </div>
            </div>

            <p class="text-3xl font-bold font-mono tracking-wider text-foreground mb-5 break-all">
              {{ displayPhoneOf(singleResult.phone, maskOn) }}
            </p>

            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div class="flex items-center">
                <dt class="w-20 text-muted-foreground flex-shrink-0">归属地</dt>
                <dd class="font-medium text-foreground">{{ regionTextOf(singleResult.region) }}</dd>
              </div>
              <div class="flex items-center">
                <dt class="w-20 text-muted-foreground flex-shrink-0">收录级别</dt>
                <dd>
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium"
                    :class="statusBadgeClass(singleResult.region.level)"
                  >
                    {{ levelLabelOf(singleResult.region.level) }}
                  </span>
                </dd>
              </div>
              <div class="flex items-center">
                <dt class="w-20 text-muted-foreground flex-shrink-0">网号（3 位）</dt>
                <dd class="font-mono text-foreground">{{ singleResult.phone.slice(0, 3) }}</dd>
              </div>
              <div class="flex items-center">
                <dt class="w-20 text-muted-foreground flex-shrink-0">HLR（4 位）</dt>
                <dd class="font-mono text-foreground">{{ singleResult.phone.slice(3, 7) }}</dd>
              </div>
            </dl>

            <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5 mt-4">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>{{ singleResult.note }}</span>
            </p>

            <!-- 未收录 / 仅省级 降级提示 -->
            <div
              v-if="singleResult.region.level !== 'city'"
              class="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 flex items-start gap-2"
            >
              <TriangleAlert class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p class="text-xs leading-relaxed text-amber-700">
                <template v-if="singleResult.region.level === 'province'">
                  该号段命中「{{ singleResult.phone.slice(0, singleResult.region.matched) }}」前缀，仅收录到<strong>省级（{{ singleResult.region.province }}）</strong>，城市级号段未收录，归属地请以运营商官方渠道为准。
                </template>
                <template v-else>
                  该号码的号段<strong>未收录</strong>在内置号段库中，无法推断归属地；可能是新放号段或物联网 / 数据专用段，请以运营商官方渠道为准。
                </template>
              </p>
            </div>

            <p class="text-[11px] text-muted-foreground mt-4">
              归属地为号段放号时的数据口径；携号转网后实际运营商可能已变化，以运营商官方为准。
            </p>
          </template>

          <div v-else class="min-h-[240px] flex flex-col items-center justify-center text-center">
            <Search class="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p class="text-sm text-muted-foreground">在左侧输入 11 位手机号，结果实时显示</p>
            <p class="text-xs text-muted-foreground/70 mt-1">自动兼容 +86、空格、横线等写法；结果仅供参考</p>
          </div>
        </div>

        <!-- 批量结果表 -->
        <div v-else class="bg-card border border-border rounded-lg overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border flex-wrap gap-2">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Search class="w-5 h-5 mr-2 text-primary" /> 批量结果
            </h2>
            <div class="flex items-center gap-3">
              <span v-if="batchSummary" class="text-xs text-muted-foreground">
                输入 {{ batchSummary.totalLines }} 行 · 去重省略 {{ batchSummary.duplicates }} 行 · 结果 {{ batchRows.length }} 条
              </span>
              <button
                @click="exportCsv"
                :disabled="!batchRows.length"
                class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
              >
                <Download class="w-3.5 h-3.5" /> 导出 CSV
              </button>
            </div>
          </div>

          <p
            v-if="batchSummary && batchSummary.truncated > 0"
            class="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-700 flex items-center gap-1.5"
          >
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0" />
            输入超过 200 行上限，已截断 {{ batchSummary.truncated }} 行未解析。
          </p>

          <div class="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="bg-muted sticky top-0 z-10">
                <tr>
                  <th class="px-4 py-3 text-left font-medium text-foreground">号码{{ maskOn ? '（脱敏）' : '' }}</th>
                  <th class="px-4 py-3 text-left font-medium text-foreground w-32">运营商</th>
                  <th class="px-4 py-3 text-left font-medium text-foreground">归属地</th>
                  <th class="px-4 py-3 text-left font-medium text-foreground w-24">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, idx) in batchRows" :key="idx" class="border-t border-border hover:bg-muted/50 transition-colors">
                  <td class="px-4 py-2.5 font-mono text-xs text-foreground">
                    {{ r.valid ? displayPhoneOf(r.phone, maskOn) : r.raw }}
                  </td>
                  <td class="px-4 py-2.5">
                    <span
                      v-if="r.valid"
                      class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium"
                      :class="operatorBadge(r.operator).badge"
                    >
                      <i class="w-1.5 h-1.5 rounded-full inline-block" :class="operatorBadge(r.operator).dot"></i>
                      {{ r.operator }}
                    </span>
                    <span v-else class="text-xs text-muted-foreground">—</span>
                  </td>
                  <td class="px-4 py-2.5 text-xs" :class="r.valid && r.level !== 'none' ? 'text-foreground' : 'text-muted-foreground'">
                    {{ r.valid ? regionTextOf(r) : '—' }}
                  </td>
                  <td class="px-4 py-2.5">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium" :class="statusBadgeClass(r.statusKind)">
                      {{ r.status }}
                    </span>
                  </td>
                </tr>
                <tr v-if="batchRows.length === 0">
                  <td colspan="4" class="px-4 py-12 text-center">
                    <Search class="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p class="text-sm text-muted-foreground">左侧粘贴号码（每行一个），点击「解析批量结果」</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 号段科普静态卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-4 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 号段科普：11 位手机号的结构与特殊段
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-muted/40 border border-border rounded-lg p-3.5">
              <p class="text-xs font-semibold text-foreground mb-2">11 位结构</p>
              <ul class="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                <li>第 1-3 位：网号，决定运营商（如 138 属中国移动）</li>
                <li>第 4-7 位：HLR 编码，早期按放号城市分配，是归属地推断的依据</li>
                <li>第 8-11 位：同一 HLR 下的用户序号</li>
              </ul>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-3.5">
              <p class="text-xs font-semibold text-foreground mb-2">特殊号段</p>
              <ul class="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                <li><span class="font-mono text-foreground">1349</span>：卫星通信专用段（海事 / 应急），不按城市分配归属地</li>
                <li><span class="font-mono text-foreground">140-144</span> 等：物联网 / 数据专用段，不用于普通手机号</li>
                <li><span class="font-mono text-foreground">162 / 167 / 170 / 171</span>：虚拟运营商（移动转售）专用段</li>
              </ul>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-3.5">
              <p class="text-xs font-semibold text-foreground mb-2">携号转网的影响</p>
              <p class="text-xs text-muted-foreground leading-relaxed">
                2019 年 11 月携号转网全面推行后，号码可在三大运营商间转移而号段不变——「号段 → 运营商 → 归属地」的推断链从此只是数据口径，不再等于号码当前的运营商与实际使用地。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 页脚口径说明 -->
    <p class="text-xs text-muted-foreground leading-relaxed mb-8 px-1">
      号段收录以 2025 年公开分配为准，新号段可能未收录；内置城市级号段收录有限，查不到时给出省级或「未收录」降级。查询在本地浏览器完成，号码不上传、无网络请求。
    </p>

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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>手机号归属地查询原理与常见问题</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          手机号归属地查询的本质是「号段库匹配」：手机号前 3 位是运营商网号，第 4-7 位是早期按城市分配的 HLR 编码，把这两部分组合成前缀，即可对照号段表推断出号码放号时的省市与运营商。
          本工具内置运营商号段表与常见前缀的归属地库，采用最长前缀匹配（7 位→6 位→…→4 位逐级回退），全部计算在浏览器本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">手机号归属地怎么查（号段库原理）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          传统做法是向运营商或商业归属地接口发请求查询，结果来自他们维护的号段数据库。本页采用同样的原理但把库内置到页面里：先用前 3 位网号判断运营商（如 138/150/188 属移动，130/156/186 属联通，133/189/199 属电信，170/171 等为虚拟运营商），
          再用第 4-7 位做最长前缀匹配查归属地——先尝试 7 位前缀（城市级最精确），未命中则逐级回退到 6 位、5 位、4 位，命中省级条目时给出「省级推断」，全部未命中时标注「未收录」。
          这样查询零网络请求、零等待，但覆盖面取决于内置库的收录量。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">携号转网后归属地会变吗</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          携号转网 2019 年 11 月在全国全面推行后，用户可以带着号码在移动、联通、电信之间转移。号段前缀不会因转网而改变（138 开头仍然是移动段），所以任何号段库查出的运营商与归属地都是「放号时的数据归属」：
          转网后实际运营商已经变化，号码长期在异地使用后实际使用地也与数据归属不同。简单说：<strong>使用地会变，号段库里的数据归属不变</strong>。需要精确判断对方当前运营商或归属，请通过运营商官方渠道核实，本工具结果仅供参考。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">11 位手机号的构成</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          中国手机号固定 11 位：第 1-3 位是网号（决定运营商）；第 4-7 位是 HLR（归属位置寄存器）编码，早期网络用它在信令层路由到放号城市的交换机，因此与城市有稳定对应关系，这正是号段库能推断归属地的基础；
          第 8-11 位是同一 HLR 下的用户序号。此外还存在少量特殊段：1349 是卫星通信专用段（海事 / 应急通信），不按城市分配归属地；140-144 等多为物联网 / 数据专用段，不用于普通手机号。位数不是 11 位、或不是 1 开头的数字串，都不是有效的国内手机号。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">虚拟运营商号段是什么</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          162、167、170、171 等号段分配给移动转售业务（俗称虚拟运营商）：工信部把号段发放给转售企业，它们从三大运营商租用网络再面向用户放号，资费与套餐独立。
          由于虚商放号渠道分散、用户可跨省办理，其号段与归属地的对应关系比基础运营商松散，按前缀推断城市可能不准。虚商号段早期曾因实名制落实不到位被部分平台标记，目前均已要求实名入网。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">查询会泄露号码吗</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不会。本页的号段表与归属地库全部内置于页面代码中，查询在浏览器本地完成，不发送任何网络请求，号码不会上传到任何服务器；批量查询的结果也只保存在内存里，刷新或关闭页面即清空。
          另外提醒：查询他人手机号归属地时请遵守《个人信息保护法》等法规，仅用于正当用途。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">手机号归属地怎么查？</h3>
            <p class="text-sm text-muted-foreground mt-1">本工具按号段库原理本地查询：前 3 位网号定运营商，第 4-7 位 HLR 编码按 7 位→4 位最长前缀匹配内置归属地库，命中即给出省市；未命中时降级为「省级推断」或标注「未收录」，全程不发网络请求。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">携号转网后归属地会变吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">号段库里的数据归属不变（号段前缀不随转网改变），但 2019 年 11 月携号转网全面推行后，实际运营商与实际使用地都可能已经变化。本工具结果为放号口径，仅供参考，精确查询请以运营商官方为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">11 位手机号是怎么构成的？</h3>
            <p class="text-sm text-muted-foreground mt-1">前 3 位是网号（运营商），第 4-7 位是早期按城市分配的 HLR 编码（归属地推断依据），第 8-11 位是用户序号。1349 为卫星通信专用段，140-144 等多为物联网 / 数据段。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">虚拟运营商号段是什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">162、167、170、171 等是工信部分配给移动转售业务（虚拟运营商）的专用号段，虚商租用三大运营商网络放号；因放号渠道分散，其归属地分配较分散，按号段推断城市可能不准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">查询会泄露我的号码吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。号段库内置在页面中，查询在浏览器本地完成、不上传号码，批量结果仅存于内存，刷新即清空。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'phone-attribution-lookup'" :category="'network'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Smartphone, Search, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, Download
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '手机号归属地查询 - 号段查询·运营商查询工具',
  description: '在线手机号归属地查询工具，输入 11 位手机号按号段查归属地省市与运营商（移动/联通/电信/虚拟运营商），最长前缀匹配内置号段库，支持批量查询、脱敏显示与 CSV 导出，本地查询号码不上传，携号转网口径诚实说明',
  keywords: '手机号归属地查询,号段查询,运营商查询,手机号码归属地,号段分配',
  author: '有条工具',
  ogTitle: '手机号归属地查询 - 号段查询·运营商查询工具 | 有条工具',
  ogDescription: '按号段查手机归属地省市与运营商，支持批量、脱敏与 CSV 导出，本地查询不上传。',
  ogUrl: 'https://www.util.cn/tools/phone-attribution-lookup',
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
          name: '手机号归属地查询',
          url: 'https://www.util.cn/tools/phone-attribution-lookup',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['11 位手机号清洗与校验', '运营商号段识别（移动/联通/电信/虚拟运营商）', '最长前缀匹配归属地查询', '批量查询与自动去重', '脱敏显示与 CSV 导出', '本地查询号码不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '网络工具', item: 'https://www.util.cn/network/' },
            { '@type': 'ListItem', position: 3, name: '手机号归属地查询', item: 'https://www.util.cn/tools/phone-attribution-lookup/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '手机号归属地怎么查？',
              acceptedAnswer: { '@type': 'Answer', text: '本工具按号段库原理本地查询：前 3 位网号定运营商，第 4-7 位 HLR 编码按 7 位到 4 位最长前缀匹配内置归属地库，命中即给出省市；未命中时降级为省级推断或标注未收录，全程不发网络请求。' }
            },
            {
              '@type': 'Question',
              name: '携号转网后归属地会变吗？',
              acceptedAnswer: { '@type': 'Answer', text: '号段库里的数据归属不变（号段前缀不随转网改变），但 2019 年 11 月携号转网全面推行后，实际运营商与实际使用地都可能已经变化。本工具结果为放号口径，仅供参考，精确查询请以运营商官方为准。' }
            },
            {
              '@type': 'Question',
              name: '11 位手机号是怎么构成的？',
              acceptedAnswer: { '@type': 'Answer', text: '前 3 位是网号（运营商），第 4-7 位是早期按城市分配的 HLR 编码（归属地推断依据），第 8-11 位是用户序号。1349 为卫星通信专用段，140-144 等多为物联网或数据段。' }
            },
            {
              '@type': 'Question',
              name: '虚拟运营商号段是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '162、167、170、171 等是工信部分配给移动转售业务（虚拟运营商）的专用号段，虚商租用三大运营商网络放号；因放号渠道分散，其归属地分配较分散，按号段推断城市可能不准。' }
            },
            {
              '@type': 'Question',
              name: '查询会泄露我的号码吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。号段库内置在页面中，查询在浏览器本地完成、不上传号码，批量结果仅存于内存，刷新即清空。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MAX_BATCH_ROWS = 200 // 批量模式最多解析的行数

// 运营商号段表（3 位网号，[起始, 结束] 闭区间；按公开号段分配常识整理，截至 2025 年）
const OPERATOR_SEGMENT_RANGES = {
  '移动': [[134, 139], [147, 148], [150, 152], [157, 159], [165, 165], [172, 172], [178, 178], [182, 184], [187, 188], [195, 195], [197, 198]],
  '联通': [[130, 132], [145, 146], [155, 156], [166, 166], [175, 176], [185, 186], [196, 196]],
  '电信': [[133, 133], [149, 149], [153, 153], [173, 174], [177, 177], [180, 181], [189, 191], [193, 193], [199, 199]],
  '虚拟运营商': [[162, 162], [167, 167], [170, 171]]
}

// 展开为 { 网号: { name, virtual } } 查询表（区间互不重叠）
const OPERATOR_SEGMENTS = (() => {
  const map = {}
  for (const [name, ranges] of Object.entries(OPERATOR_SEGMENT_RANGES)) {
    for (const [a, b] of ranges) {
      for (let n = a; n <= b; n++) map[String(n)] = { name, virtual: name === '虚拟运营商' }
    }
  }
  return map
})()

// 特殊 4 位段：优先于 3 位网号判断（1349 为卫星通信专用，不按城市分配归属地）
const SPECIAL_SEGMENTS = {
  '1349': { name: '专用号段（卫星通信）', virtual: false, special: true }
}

// 号段说明（结果卡静态常识，一句一条）
const SEGMENT_NOTES = {
  '移动': '134-139 段为 1994-1997 年间最早放号的 GSM 号段，现由中国移动运营，150/157/178/188 等为后续扩容段',
  '联通': '130-132 段 1995 年前后最早放号，现由中国联通运营，156/186 等为 3G 时代扩容段',
  '电信': '133 段 1997 年最早放号，2008 年承接联通 CDMA 网后现由中国电信运营，189/199 等为后续扩容段',
  '虚拟运营商': '162/167/170/171 为工信部移动转售业务专用号段，由虚拟运营商租用基础运营商网络放号，归属地分配较分散',
  '专用号段（卫星通信）': '1349 为卫星通信专用号段（海事 / 应急通信），不按普通手机号段分配城市归属地',
  '未知': '该网号未收录在内置号段表中，可能是新放号段或物联网 / 数据专用段，请以运营商官方信息为准'
}

// 归属地前缀表：[前缀(4-7 位), 省份, 城市]，城市为空字符串表示仅收录到省级。
// 条目按早期放号规律（1390/1380 + 城市区号）与公开资料整理的常见段抽样，非完整库；7 位条目可比 5/6 位条目更精确（最长前缀匹配）。
const REGION_PREFIX_ROWS = [
  // 北京（区号 010）：13800138000 为经典测试号码，段 1380013 归北京
  ['1380010', '北京', '北京'], ['1390010', '北京', '北京'], ['1380013', '北京', '北京'],
  ['139010', '北京', '北京'], ['139011', '北京', '北京'], ['139012', '北京', '北京'], ['139013', '北京', '北京'],
  ['138010', '北京', '北京'], ['138011', '北京', '北京'], ['136010', '北京', '北京'],
  ['133010', '北京', '北京'], ['186010', '北京', '北京'], ['188010', '北京', '北京'],
  // 上海（021）：1380014 为经典上海段
  ['1380014', '上海', '上海'], ['1390021', '上海', '上海'], ['1380021', '上海', '上海'],
  ['139021', '上海', '上海'], ['138021', '上海', '上海'], ['136021', '上海', '上海'],
  ['133021', '上海', '上海'], ['186021', '上海', '上海'], ['158021', '上海', '上海'],
  // 天津（022）
  ['1390022', '天津', '天津'], ['139022', '天津', '天津'], ['138022', '天津', '天津'],
  ['136022', '天津', '天津'], ['133022', '天津', '天津'], ['186022', '天津', '天津'],
  // 重庆（023）
  ['1390023', '重庆', '重庆'], ['139023', '重庆', '重庆'], ['138023', '重庆', '重庆'],
  ['136023', '重庆', '重庆'], ['133023', '重庆', '重庆'], ['186023', '重庆', '重庆'],
  // 广东
  ['1390020', '广东', '广州'], ['1380020', '广东', '广州'], ['139020', '广东', '广州'], ['138020', '广东', '广州'], ['186020', '广东', '广州'], ['133020', '广东', '广州'],
  ['1390755', '广东', '深圳'], ['1380755', '广东', '深圳'], ['1360755', '广东', '深圳'], ['1330755', '广东', '深圳'], ['1860755', '广东', '深圳'], ['1580755', '广东', '深圳'],
  ['1390756', '广东', '珠海'], ['1380756', '广东', '珠海'],
  ['1390757', '广东', '佛山'], ['1380757', '广东', '佛山'],
  ['1390769', '广东', '东莞'], ['1380769', '广东', '东莞'],
  ['1390760', '广东', '中山'], ['1380760', '广东', '中山'],
  ['13800', '广东', ''], ['13902', '广东', ''], ['13802', '广东', ''],
  // 河北（省级回退 + 地市）
  ['13900', '河北', ''], ['13903', '河北', ''], ['13803', '河北', ''],
  ['1390311', '河北', '石家庄'], ['1380311', '河北', '石家庄'],
  ['1390312', '河北', '保定'],
  ['1390315', '河北', '唐山'], ['1380315', '河北', '唐山'],
  // 山西
  ['1390351', '山西', '太原'], ['1380351', '山西', '太原'], ['1390352', '山西', '大同'],
  // 内蒙古
  ['1390471', '内蒙古', '呼和浩特'], ['1380471', '内蒙古', '呼和浩特'], ['1390472', '内蒙古', '包头'], ['1390477', '内蒙古', '鄂尔多斯'],
  // 辽宁
  ['1390024', '辽宁', '沈阳'], ['139024', '辽宁', '沈阳'], ['138024', '辽宁', '沈阳'], ['186024', '辽宁', '沈阳'],
  ['1390411', '辽宁', '大连'], ['1380411', '辽宁', '大连'], ['1390412', '辽宁', '鞍山'],
  // 吉林
  ['1390431', '吉林', '长春'], ['1380431', '吉林', '长春'], ['1390432', '吉林', '吉林'],
  // 黑龙江
  ['1390451', '黑龙江', '哈尔滨'], ['1380451', '黑龙江', '哈尔滨'], ['1390452', '黑龙江', '齐齐哈尔'], ['1390459', '黑龙江', '大庆'],
  // 江苏
  ['1390025', '江苏', '南京'], ['139025', '江苏', '南京'], ['138025', '江苏', '南京'], ['133025', '江苏', '南京'], ['186025', '江苏', '南京'],
  ['1390512', '江苏', '苏州'], ['1380512', '江苏', '苏州'],
  ['1390510', '江苏', '无锡'], ['1380510', '江苏', '无锡'],
  ['1390519', '江苏', '常州'], ['1390513', '江苏', '南通'], ['1390516', '江苏', '徐州'],
  // 浙江
  ['1390571', '浙江', '杭州'], ['1380571', '浙江', '杭州'], ['1360571', '浙江', '杭州'], ['1860571', '浙江', '杭州'],
  ['1390574', '浙江', '宁波'], ['1380574', '浙江', '宁波'],
  ['1390577', '浙江', '温州'], ['1380577', '浙江', '温州'],
  ['1390573', '浙江', '嘉兴'], ['1390579', '浙江', '金华'],
  // 安徽
  ['1390551', '安徽', '合肥'], ['1380551', '安徽', '合肥'], ['1360551', '安徽', '合肥'], ['1390553', '安徽', '芜湖'],
  // 福建
  ['1390591', '福建', '福州'], ['1380591', '福建', '福州'], ['1360591', '福建', '福州'],
  ['1390592', '福建', '厦门'], ['1380592', '福建', '厦门'], ['1390595', '福建', '泉州'],
  // 江西
  ['1390791', '江西', '南昌'], ['1380791', '江西', '南昌'], ['1390792', '江西', '九江'], ['1390797', '江西', '赣州'],
  // 山东
  ['1390531', '山东', '济南'], ['1380531', '山东', '济南'], ['1360531', '山东', '济南'], ['1860531', '山东', '济南'],
  ['1390532', '山东', '青岛'], ['1380532', '山东', '青岛'], ['1360532', '山东', '青岛'], ['1860532', '山东', '青岛'],
  ['1390535', '山东', '烟台'], ['1380535', '山东', '烟台'],
  ['1390536', '山东', '潍坊'], ['1390539', '山东', '临沂'],
  // 河南
  ['1390371', '河南', '郑州'], ['1380371', '河南', '郑州'], ['1360371', '河南', '郑州'], ['1860371', '河南', '郑州'],
  ['1390379', '河南', '洛阳'], ['1380379', '河南', '洛阳'], ['1390377', '河南', '南阳'],
  // 湖北
  ['1390027', '湖北', '武汉'], ['139027', '湖北', '武汉'], ['138027', '湖北', '武汉'], ['136027', '湖北', '武汉'], ['186027', '湖北', '武汉'],
  ['1390717', '湖北', '宜昌'], ['1390710', '湖北', '襄阳'],
  // 湖南
  ['1390731', '湖南', '长沙'], ['1380731', '湖南', '长沙'], ['1360731', '湖南', '长沙'], ['1860731', '湖南', '长沙'], ['1390734', '湖南', '衡阳'],
  // 广西
  ['1390771', '广西', '南宁'], ['1380771', '广西', '南宁'], ['1390772', '广西', '柳州'], ['1390773', '广西', '桂林'], ['1390779', '广西', '北海'],
  // 海南（全省 0898）
  ['1390898', '海南', '海口'], ['1380898', '海南', '海口'],
  // 四川
  ['1390028', '四川', '成都'], ['139028', '四川', '成都'], ['138028', '四川', '成都'], ['136028', '四川', '成都'], ['186028', '四川', '成都'],
  ['1390816', '四川', '绵阳'], ['1390831', '四川', '宜宾'],
  // 贵州
  ['1390851', '贵州', '贵阳'], ['1380851', '贵州', '贵阳'], ['1390852', '贵州', '遵义'],
  // 云南
  ['1390871', '云南', '昆明'], ['1380871', '云南', '昆明'], ['1390872', '云南', '大理'], ['1390874', '云南', '曲靖'],
  // 西藏
  ['1390891', '西藏', '拉萨'], ['1380891', '西藏', '拉萨'],
  // 陕西
  ['1390029', '陕西', '西安'], ['139029', '陕西', '西安'], ['138029', '陕西', '西安'], ['136029', '陕西', '西安'],
  ['133029', '陕西', '西安'], ['186029', '陕西', '西安'],
  ['1390910', '陕西', '咸阳'], ['1390917', '陕西', '宝鸡'],
  // 甘肃
  ['1390931', '甘肃', '兰州'], ['1380931', '甘肃', '兰州'], ['1390938', '甘肃', '天水'],
  // 青海
  ['1390971', '青海', '西宁'], ['1380971', '青海', '西宁'],
  // 宁夏
  ['1390951', '宁夏', '银川'], ['1380951', '宁夏', '银川'],
  // 新疆
  ['1390991', '新疆', '乌鲁木齐'], ['1380991', '新疆', '乌鲁木齐'], ['1390998', '新疆', '喀什']
]

// 展开为 { 前缀: { province, city } } 查询表
const REGION_PREFIXES = Object.fromEntries(
  REGION_PREFIX_ROWS.map(([prefix, province, city]) => [prefix, { province, city }])
)
const PREFIX_MAX_LEN = 7 // 最长前缀（城市级）
const PREFIX_MIN_LEN = 4 // 最短回退前缀

// 分隔符清洗：去空格 / 横线 / 点 / 括号 / 加号，兼容 +86、86、0086 前缀
function cleanPhoneText(raw) {
  let s = String(raw).replace(/[\s\u3000\-－—–_+().·（）]/g, '')
  if (/^86\d{11}$/.test(s)) s = s.slice(2)
  else if (/^0086\d{11}$/.test(s)) s = s.slice(4)
  return s
}

// 校验：清洗后需为 1 开头的 11 位数字
function validatePhoneOf(input) {
  const phone = cleanPhoneText(input)
  if (!phone) return { valid: false, phone: '', error: '输入为空' }
  if (!/^\d+$/.test(phone)) return { valid: false, phone, error: '包含无法识别的字符（已自动去除空格与分隔符）' }
  if (!phone.startsWith('1')) return { valid: false, phone, error: '手机号需以 1 开头' }
  if (phone.length !== 11) return { valid: false, phone, error: `长度为 ${phone.length} 位（应为 11 位）` }
  return { valid: true, phone, error: '' }
}

// 运营商识别：先查 4 位特殊段（1349），再按前 3 位查号段表；未收录 → '未知'
function carrierOf(phone) {
  const d = String(phone)
  const special = SPECIAL_SEGMENTS[d.slice(0, 4)]
  if (special) return { operator: special.name, virtual: special.virtual, special: true }
  const hit = OPERATOR_SEGMENTS[d.slice(0, 3)]
  if (!hit) return { operator: '未知', virtual: false, special: false }
  return { operator: hit.name, virtual: hit.virtual, special: false }
}

// 归属地识别：最长前缀匹配，7 位 → 6 位 → … → 4 位逐级回退
function regionOf(phone) {
  const d = String(phone)
  for (let len = PREFIX_MAX_LEN; len >= PREFIX_MIN_LEN; len--) {
    const hit = REGION_PREFIXES[d.slice(0, len)]
    if (hit) {
      return { province: hit.province, city: hit.city, level: hit.city ? 'city' : 'province', matched: len }
    }
  }
  return { province: '', city: '', level: 'none', matched: 0 }
}

// 脱敏：138****5678（非 11 位原样返回）
function maskPhoneOf(phone) {
  const d = String(phone)
  if (!/^\d{11}$/.test(d)) return d
  return d.slice(0, 3) + '****' + d.slice(7)
}

// 按开关决定显示完整号或脱敏号
function displayPhoneOf(phone, mask) {
  return mask ? maskPhoneOf(phone) : String(phone)
}

// 批量解析：按行清洗校验、去重（清洗后同号算重复）、截断到 200 行
function parseBatchPhones(text) {
  const lines = String(text).split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)
  const seen = new Set()
  const rows = []
  let processed = 0
  let duplicates = 0
  for (const line of lines) {
    if (rows.length >= MAX_BATCH_ROWS) break
    processed += 1
    const v = validatePhoneOf(line)
    const key = v.phone || line
    if (seen.has(key)) {
      duplicates += 1
      continue
    }
    seen.add(key)
    rows.push({ raw: line, valid: v.valid, phone: v.phone, error: v.error })
  }
  return { rows, totalLines: lines.length, duplicates, truncated: lines.length - processed }
}

// 单条批量结果 → 展示行（运营商 + 归属地 + 状态）
function analyzeRow(row) {
  if (!row.valid) {
    return { ...row, operator: '—', virtual: false, special: false, province: '', city: '', level: 'none', status: '格式无效', statusKind: 'invalid' }
  }
  const carrier = carrierOf(row.phone)
  const region = regionOf(row.phone)
  const status = region.level === 'city' ? '市级收录' : region.level === 'province' ? '省级推断' : '未收录'
  return { ...row, ...carrier, province: region.province, city: region.city, level: region.level, status, statusKind: region.level }
}

// 单号完整分析（校验 + 运营商 + 归属地 + 号段说明）
function analyzePhone(input) {
  const v = validatePhoneOf(input)
  if (!v.valid) return { valid: false, phone: v.phone, error: v.error, carrier: null, region: null, note: '' }
  const carrier = carrierOf(v.phone)
  const region = regionOf(v.phone)
  return { valid: true, phone: v.phone, error: '', carrier, region, note: SEGMENT_NOTES[carrier.operator] || SEGMENT_NOTES['未知'] }
}

// CSV 转义：含逗号 / 引号 / 换行的字段加引号
function csvEscape(field) {
  const s = String(field)
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

// 批量结果 → CSV 文本（不含 BOM，导出时统一加）
function buildBatchCsv(rows) {
  const lines = [['号码', '运营商', '省份', '城市', '状态'].join(',')]
  for (const r of rows) {
    lines.push([r.phone || r.raw, r.operator, r.province || '', r.city || '', r.status].map(csvEscape).join(','))
  }
  return lines.join('\r\n')
}

// 归属地展示文本
function regionTextOf(region) {
  if (region.level === 'city') return `${region.province} · ${region.city}`
  if (region.level === 'province') return region.province
  return '未收录'
}

// 收录级别文案
function levelLabelOf(level) {
  return level === 'city' ? '市级收录' : level === 'province' ? '省级推断' : '未收录'
}

// 状态徽章样式（市级绿 / 省级与未收录黄 / 无效红）
function statusBadgeClass(level) {
  if (level === 'city') return 'bg-green-500/10 text-green-600 border-green-500/20'
  if (level === 'province' || level === 'none') return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
  return 'bg-red-500/10 text-red-600 border-red-500/20'
}

// 运营商徽章（品牌近似色：移动蓝 / 联通红 / 电信绿 / 虚商灰）
function operatorBadge(operator) {
  const map = {
    '移动': { badge: 'bg-sky-500/10 text-sky-600 border-sky-500/20', dot: 'bg-sky-500' },
    '联通': { badge: 'bg-red-500/10 text-red-600 border-red-500/20', dot: 'bg-red-500' },
    '电信': { badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', dot: 'bg-emerald-500' },
    '虚拟运营商': { badge: 'bg-slate-500/10 text-slate-600 border-slate-500/20', dot: 'bg-slate-500' },
    '专用号段（卫星通信）': { badge: 'bg-violet-500/10 text-violet-600 border-violet-500/20', dot: 'bg-violet-500' },
    '未知': { badge: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' }
  }
  return map[operator] || map['未知']
}

// 示例号码（覆盖经典段 / 地市级 / 虚商未收录 / 未收录网号）
const sampleNumbers = [
  { phone: '13800138000', label: '北京 · 移动（经典测试号）' },
  { phone: '13905311234', label: '山东济南 · 移动' },
  { phone: '17000000000', label: '虚拟运营商 · 归属地未收录' },
  { phone: '15400000000', label: '网号未收录' }
]

// ---------- 页面状态与交互 ----------
const mode = ref('single')
const singleInput = ref('')
const batchInput = ref('')
const maskOn = ref(true)
const batchParsed = ref(null)
const seoContentVisible = ref(true)

const operatorSegmentCount = Object.keys(OPERATOR_SEGMENTS).length
const regionPrefixCount = REGION_PREFIX_ROWS.length

// 单号：实时清洗校验 + 实时结果
const singlePreview = computed(() => validatePhoneOf(singleInput.value))
const singleResult = computed(() => (singlePreview.value.valid ? analyzePhone(singleInput.value) : null))

// 批量：点击解析后出结果表
const batchLineCount = computed(() => batchInput.value.split(/\r?\n/).filter((l) => l.trim().length > 0).length)
const batchRows = computed(() => (batchParsed.value ? batchParsed.value.rows.map((r) => analyzeRow(r)) : []))
const batchSummary = computed(() =>
  batchParsed.value
    ? { totalLines: batchParsed.value.totalLines, duplicates: batchParsed.value.duplicates, truncated: batchParsed.value.truncated }
    : null
)

function runBatch() {
  batchParsed.value = parseBatchPhones(batchInput.value)
}

function clearAll() {
  singleInput.value = ''
  batchInput.value = ''
  batchParsed.value = null
}

// 导出 CSV（含 BOM，浏览器回调内执行，SSR 安全）
function exportCsv() {
  if (!batchRows.value.length) return
  const csv = '\ufeff' + buildBatchCsv(batchRows.value)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '手机号归属地查询结果.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 生命周期 ----------
onMounted(() => {
  addRecentTool('phone-attribution-lookup')
})
</script>
