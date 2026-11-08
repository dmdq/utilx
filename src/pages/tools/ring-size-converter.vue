<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Circle class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">戒指圈口换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">港码 / 内径 mm / 周长 mm / 美码 US / 欧码 EU 五维互查，查表 + 相邻插值</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线戒指圈口对照换算工具：任一维度输入（港码圈号、戒指内径毫米、纸条量得的指围周长、美码 US、欧码 EU），其余四项即刻换算。
        内置港码 8-24 号完整对照表（大陆珠宝行通用口径，经香港珠宝行与周大福官方口径查证），输入值落在两档之间时按「宁大勿小」惯例提示取偏大一档；
        附纸条量周长反查、借现有戒指量内径、傍晚测量建议与惊喜送礼拿圈号小贴士。全部换算在浏览器本地完成，不上传任何数据。
      </p>
      <!-- 诚实说明条 -->
      <div class="mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-foreground">
        <Info class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <span>圈口无世界统一标准：不同品牌圈模可差半号，网上个别对照表把港码 14 号标成内径 17.7mm——那是港码 16 号的值，本表以查证口径为准（港 14 = 16.9mm），见下方口径说明。</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左列：换算卡 + 测量方法引导 -->
      <div class="space-y-4">
        <!-- 交互换算卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <RefreshCw class="w-5 h-5 mr-2 text-primary" /> 圈口换算（任输一项，其余自动换算）
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="field in fields" :key="field.key" :class="field.key === 'eu' ? 'sm:col-span-2' : ''">
              <label :for="`ring-${field.key}`" class="block text-sm font-medium text-foreground mb-1.5">
                {{ field.label }}
                <span v-if="field.key === sourceKey" class="ml-1 px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-medium align-middle">输入项</span>
              </label>
              <input
                :id="`ring-${field.key}`"
                :value="displayFor(field.key)"
                type="text"
                inputmode="decimal"
                :placeholder="field.placeholder"
                class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                @input="onFieldInput(field.key, $event)"
              />
              <p class="text-[11px] text-muted-foreground mt-1">{{ field.tip }}</p>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="fillExample"
              class="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-sm font-medium text-primary transition"
            >
              <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 试个例子
            </button>
            <button
              @click="resetInput"
              class="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >
              <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 清空重置
            </button>
          </div>

          <!-- 非法输入 / 超范围提示 -->
          <div v-if="error" class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
            {{ error }}
          </div>

          <!-- 换算结果瓦片 -->
          <div v-if="result" class="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div
              v-for="tile in resultTiles"
              :key="tile.key"
              class="bg-muted/40 border rounded-lg p-3 text-center space-y-1"
              :class="tile.input ? 'border-primary/40 bg-primary/10' : 'border-border'"
            >
              <p class="text-[10px] text-muted-foreground">{{ tile.label }}</p>
              <p class="text-2xl font-bold" :class="tile.input ? 'text-primary' : 'text-foreground'">{{ tile.value }}</p>
              <p v-if="tile.input" class="text-[10px] text-primary font-medium">← 输入维度</p>
              <p v-else class="text-[10px] text-transparent select-none">&nbsp;</p>
            </div>
          </div>
          <p v-if="result" class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-foreground flex items-start gap-1.5">
            <CheckCircle class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{{ result.hint }}</span>
          </p>
          <p v-if="result && result.clampHint" class="text-xs text-primary bg-primary/5 border border-primary/20 rounded px-2.5 py-1.5 leading-relaxed">
            {{ result.clampHint }}
          </p>
          <div v-if="!result && !error" class="p-4 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
            在任一维度输入数值（圈号 / 内径 / 指围周长 / 美码 / 欧码），其余四项即刻换算
          </div>
        </div>

        <!-- 测量方法引导卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 怎么量圈口（三种方法）
          </h2>

          <div class="space-y-3">
            <!-- 方法一：纸条量周长（含反查） -->
            <div class="bg-muted/40 border border-border rounded-lg p-4">
              <p class="text-sm font-semibold text-foreground mb-1.5">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold mr-1.5 align-middle">1</span>
                纸条 / 细绳绕指量周长（没戒指时用这个）
              </p>
              <p class="text-xs text-muted-foreground leading-relaxed mb-3">
                剪一条约 5mm 宽的纸条（或用细绳），贴着指根绕一圈（皮肤贴合但能转动、不勒紧），在交叠处画标记后摊平，用直尺量「起点到标记」的长度即为指围周长（mm）。
                量出来的数值直接在下面反查圈号：
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <input
                  v-model="measureCirc"
                  type="text"
                  inputmode="decimal"
                  placeholder="如 53.1"
                  class="w-32 px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span class="text-xs text-muted-foreground">mm 指围 →</span>
                <span v-if="measureResult && measureResult.ok" class="text-sm font-semibold text-primary">
                  港码 {{ measureResult.display.hk }} 号 · 美码 {{ measureResult.display.us }} · 内径 {{ measureResult.display.dia }} mm
                </span>
                <button
                  v-if="measureResult && measureResult.ok"
                  @click="fillFromMeasure"
                  class="px-3 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-primary/10 hover:border-primary/40 text-xs font-medium text-muted-foreground hover:text-primary transition"
                >
                  填入上方换算卡
                </button>
              </div>
              <p v-if="measureCirc.trim() && measureResult && measureResult.ok" class="text-xs text-muted-foreground mt-2">{{ measureResult.hint }}</p>
              <p v-else-if="measureCirc.trim() && measureResult && !measureResult.ok" class="text-xs text-amber-700 dark:text-amber-400 mt-2">{{ measureResult.error }}</p>
            </div>

            <!-- 方法二：借现有戒指量内径 -->
            <div class="bg-muted/40 border border-border rounded-lg p-4">
              <p class="text-sm font-semibold text-foreground mb-1.5">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold mr-1.5 align-middle">2</span>
                借一枚现有戒指量内径
              </p>
              <p class="text-xs text-muted-foreground leading-relaxed">
                拿对方（或自己）平时戴在目标手指上的戒指，量「内圈最远两点」的直线距离即内径（mm）：有游标卡尺直接卡；只有直尺就把戒指立在纸上沿内圈画圆，量圆的横向宽度。
                常戴戒指内圈还有个偷懒读法——不少品牌（如周大福）会把圈号刻在指圈内，翻过来看一眼就知道港码几号。量得内径后在上面的「内径 mm」输入即可。
              </p>
            </div>

            <!-- 方法三：傍晚量 -->
            <div class="bg-muted/40 border border-border rounded-lg p-4">
              <p class="text-sm font-semibold text-foreground mb-1.5">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold mr-1.5 align-middle">3</span>
                傍晚量更准（手指一天内会胀缩）
              </p>
              <p class="text-xs text-muted-foreground leading-relaxed">
                手指从早到晚逐渐偏肿：清晨最细、傍晚最粗，差幅可达半号；运动后、天热、吃咸了、生理期或孕期肿胀更明显。
                建议「傍晚再量一次、早晚各一次取中间值」；戒指要能顺利穿过指关节，量周长时按指根量、试戴按关节过，两者兼顾。
              </p>
            </div>
          </div>
        </div>

        <!-- 送礼 + 左右手季节 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Gift class="w-5 h-5 mr-2 text-primary" /> 惊喜送礼怎么偷偷拿到圈号
          </h2>
          <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
            <li>借戒指描内径：趁对方洗澡、睡觉时把 TA 的戒指按在纸上沿内圈描个圆，量圆的横向宽度就是内径，回来填进本页换算。</li>
            <li>找「内线」：偷偷问 TA 的闺蜜、姐妹或妈妈——她们大概率知道，或者手里就有同手指的戒指尺寸。</li>
            <li>翻旧戒指内圈：不少品牌把圈号刻在指圈内壁（如「14」或「#14」），找个理由借来擦一擦就能看到。</li>
            <li>实在拿不到就按人群经验猜：女戒常见港码 10-15 号（女性平均约 12-14 号），男戒常见 16-22 号；拿不准时选偏大一档并选支持免费改圈的渠道，收到礼物后改圈半号是珠宝店常规服务。</li>
          </ul>
          <div class="border-t border-border pt-3 space-y-2">
            <p class="flex items-start gap-2 text-sm text-muted-foreground">
              <Hand class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="font-medium text-foreground">左右手不同：</span>惯用手的指根肌肉更发达，右手通常比左手粗约半号——左手量出的号不能直接套右手，按佩戴那只手量。</span>
            </p>
            <p class="flex items-start gap-2 text-sm text-muted-foreground">
              <Sun class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="font-medium text-foreground">夏天偏胀：</span>高温使血管扩张、手指变粗，夏天量出的圈号更接近戴着的真实状态。</span>
            </p>
            <p class="flex items-start gap-2 text-sm text-muted-foreground">
              <Snowflake class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="font-medium text-foreground">冬天偏缩：</span>冷天手指收缩，量出来会偏小半号左右；冬天测的号建议加半号复核，两季都戴的戒指取偏大一档。</span>
            </p>
          </div>
        </div>
      </div>

      <!-- 右列：对照表 + 速查 + 口径说明 -->
      <div class="space-y-4">
        <!-- 完整对照表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Circle class="w-5 h-5 mr-2 text-primary" /> 港码圈口完整对照表（8-24 号）
          </h2>
          <p class="text-xs text-muted-foreground mb-4">
            大陆珠宝行通用港码口径，已经香港珠宝行与周大福官方尺寸口径查证；输入值所在档自动高亮
          </p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium whitespace-nowrap">港码（圈号）</th>
                  <th class="py-2 pr-3 font-medium whitespace-nowrap">内径 mm</th>
                  <th class="py-2 pr-3 font-medium whitespace-nowrap">周长 mm</th>
                  <th class="py-2 pr-3 font-medium whitespace-nowrap">美码 US</th>
                  <th class="py-2 pr-3 font-medium whitespace-nowrap">欧码 EU</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in RING_TABLE"
                  :key="row.hk"
                  class="border-b border-border/50 hover:bg-muted/50 transition-colors"
                  :class="i === highlightIndex ? 'bg-primary/10' : ''"
                >
                  <td class="py-2.5 pr-3 whitespace-nowrap font-medium text-foreground">
                    {{ row.hk }}
                    <span v-if="i === highlightIndex" class="ml-1 px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-medium align-middle">最近档</span>
                  </td>
                  <td class="py-2.5 pr-3 whitespace-nowrap text-muted-foreground">{{ fmtMm(row.dia, 1) }}</td>
                  <td class="py-2.5 pr-3 whitespace-nowrap text-muted-foreground">{{ fmtMm(row.circ, 1) }}</td>
                  <td class="py-2.5 pr-3 whitespace-nowrap text-muted-foreground">{{ fmtMm(row.us, 1) }}</td>
                  <td class="py-2.5 pr-3 whitespace-nowrap text-muted-foreground">{{ row.eu }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 常用锚点速查 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Play class="w-5 h-5 mr-2 text-primary" /> 常用圈号速查
          </h2>
          <p class="text-xs text-muted-foreground">点击任意锚点自动填入左侧换算卡：</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="pick in quickPicks"
              :key="pick.label"
              @click="applyPick(pick)"
              class="px-3 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-primary/10 hover:border-primary/40 text-xs font-medium text-muted-foreground hover:text-primary transition"
            >
              {{ pick.label }}
            </button>
          </div>
        </div>

        <!-- 口径说明 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-2.5">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Info class="w-5 h-5 mr-2 text-primary" /> 对照口径说明（以查证表为准）
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">港码（圈号）是大陆珠宝行与香港珠宝行通用标法：1 号约对应周长 1.0-1.2mm。本表锚点：港码 14 号 = 内径 16.9mm / 周长 53.1mm，港码 15 号 = 内径 17.3mm / 周长 54.3mm。</p>
          <p class="text-xs text-muted-foreground leading-relaxed">分歧处置：网上部分对照表把「港码 14 = 内径 17.7mm」与「港码 14 = 美码 7.5」混在一起流传——17.7mm 实为港码 16 号。本表按香港珠宝行对照表与周大福官方口径（港 13=16.5 / 14=16.9 / 15=17.3 / 16=17.7 / 17=18.0mm）取值。</p>
          <p class="text-xs text-muted-foreground leading-relaxed">美码 US 7 的标准内径约 17.3mm、周长约 54.4mm，对应港码 15 号；港码与美码刻度不等长（美码每半号 ≈ 周长 1.28mm，港码每号 ≈ 1.0-1.2mm），不存在固定加减关系，交界号上不同珠宝行可能差半码，本表美码列按内圈周长就近归到整号/半号。</p>
          <p class="text-xs text-muted-foreground leading-relaxed">欧码 EU（欧洲口径）数值即内圈周长毫米数（如 EU 53 = 周长 53mm），与港码换算关系为「欧码 ≈ 周长 mm」；相邻港号的欧码偶尔跳 2（港 15→EU 54、港 16→EU 56）属正常取整。</p>
          <p class="text-xs text-muted-foreground leading-relaxed">表值取常用档（半号/整号），输入值落在两档之间时其余维度按相邻两档线性插值并就近归档，同时提示「建议取偏大一档」；各品牌圈模差异可达半号，精确定制请以品牌官方圈口为准。</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>戒指圈口换算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          戒指圈口换算器是一款在线戒指尺寸换算工具。「圈口」指戒指内圈的松紧档位，大陆与香港珠宝行用「港码」（整数圈号）标注，
          海淘常见美码 US，欧洲品牌多用欧码 EU，另外两个物理量是内圈直径（mm）与内圈周长（mm）。
          本工具内置经查证的港码 8-24 号对照表，每行给出港码、内径 mm、周长 mm、美码 US、欧码 EU 五列；
          任一维度输入数值，其余四项按「查表 + 相邻插值」即刻换算：恰好命中档位直接给值，落在两档之间时按相邻档线性插值、
          就近归档并提示「宁大勿小取偏大一档」。全部换算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">指围怎么量才准？</h3>
        <ol class="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>纸条绕指一圈：约 5mm 宽的纸条贴指根绕一圈，交叠处画标记，摊平量「起点到标记」的长度（mm），就是内圈周长，直接在本页反查圈号。</li>
          <li>松紧拿捏：贴合皮肤但能轻微转动、不勒出印；绕得太松会偏大半号、勒太紧会偏小。</li>
          <li>量两遍取平均：早晚各量一次（手指早细晚粗，差幅可达半号），取中间值；运动后、天热、生理期肿胀时缓量。</li>
          <li>有旧戒量内径：借常戴戒指量内圈最远两点距离（或内圈刻字直接读圈号），按目标手同一根手指的戒指为准。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">港码 14 号内径到底是多少？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          以查证表为准：港码 14 号 = 内径 16.9mm、周长 53.1mm，约合美码 US 6.5、欧码 EU 53。
          网络上有不少对照表把港码 14 号标成内径 17.7mm、美码 7.5——那实际是港码 16 号的数值，属于流传中被串行的错误。
          判别方法很简单：内径 × 3.1416 应约等于周长（16.9 × 3.1416 ≈ 53.1 ✓）。香港珠宝行对照表与周大福官方口径一致给出
          港 13 = 16.5、港 14 = 16.9、港 15 = 17.3、港 16 = 17.7、港 17 = 18.0mm，本表采用这一口径。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">美码 7 对应港码几号？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          美码 US 7 的标准内径约 17.3mm、内圈周长约 54.4mm，对应港码 15 号（周长 54.3mm）、欧码 EU 54。
          港码与美码不是固定加减关系：美码每半号约加 1.28mm 周长，港码每号约加 1.0-1.2mm，两条刻度只有在个别点重合，
          所以跨制换算请查表而不是口算。同理美码 US 8 ≈ 港码 17 号、US 9 ≈ 港码 20 号附近（交界号不同珠宝行可能差半码）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">量出来介于两个圈号之间怎么办？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          按「宁大勿小」取偏大一档：松了可以缠透明指圈垫 / 打磨改小，紧了摘不下还可能卡关节。三个常见加号场景：
          宽版戒指（戒臂 ≥ 6mm）比窄版佩戴感更紧，取大半号；指关节明显比指根粗的人按「关节能过、指根不晃」选；
          冬天测的号夏天戴会显紧，加半号复核。多数珠宝店提供改圈服务（一般可改 ±2 号内，镂空/密镶款除外），收礼后微调半号很常见。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">惊喜送戒指怎么拿到 TA 的圈号？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>描内径：趁洗澡、睡觉借 TA 常戴的戒指按在纸上描内圈，量横向宽度得到内径，回本页换算圈号。</li>
          <li>问内线：闺蜜、姐妹、妈妈往往知道，甚至直接持有同手指的戒指。</li>
          <li>读刻字：不少品牌在指圈内壁刻圈号（如「14」），借口清洁/拍照翻看一眼即可。</li>
          <li>按人群猜档：女戒常见港码 10-15 号、男戒常见 16-22 号，拿不准取偏大一档并选可免费改圈的渠道。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">港码 14 号内径多少 mm？是多少号？</h3>
            <p class="text-sm text-muted-foreground mt-1">按查证口径：港码 14 号 = 内径 16.9mm、周长 53.1mm ≈ 美码 US 6.5、欧码 EU 53。网上流传的「港 14 = 17.7mm」是港码 16 号的值，属于串行错误。在本页输入港码 14 即可看到全部维度换算。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">美码 7 是港码几号？戒指尺寸美码港码怎么换算？</h3>
            <p class="text-sm text-muted-foreground mt-1">美码 US 7 内径约 17.3mm、周长约 54.4mm，对应港码 15 号。两套刻度步长不等（美码半号 ≈ 1.28mm 周长，港码一号 ≈ 1.0-1.2mm），没有固定加减关系，交界号可能差半码，请以对照表为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">手指周长量出来 54mm 是几号？</h3>
            <p class="text-sm text-muted-foreground mt-1">周长 54mm 介于港码 15 号（54.3mm）与港码 14 号（53.1mm）之间、更接近 15 号：按「宁大勿小」取港码 15 号（内径 17.3mm ≈ 美码 7、欧码 54）。在本页「周长 mm」输入 54 即可看到插值结果与建议。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">欧码为什么和周长数字一样？</h3>
            <p class="text-sm text-muted-foreground mt-1">欧洲口径（含 ISO 标准）直接用「内圈周长毫米数」作为尺码数值：EU 53 = 周长 53mm。所以量出指围后，欧码基本就是那个毫米数取整，再反查港码/美码即可。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">左右手、冬夏季节对圈口影响多大？</h3>
            <p class="text-sm text-muted-foreground mt-1">惯用手（多为右手）比另一只手粗约半号；同一根手指夏天偏胀、冬天偏缩，早晚差幅也可达半号。按「佩戴那只手 + 傍晚测量 + 两季都戴取偏大」的原则选号，±半号的浮动属正常范围。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ring-size-converter'" :category="'design'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Circle, CheckCircle, ChevronUp, ChevronDown, Info,
  RefreshCw, Play, Ruler, Gift, Hand, Sun, Snowflake
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '戒指圈口换算器 - 戒指尺寸对照表 | 港码美码欧码换算工具',
  description: '在线戒指圈口换算工具，港码圈号、内径 mm、指围周长 mm、美码 US、欧码 EU 五维互查，内置港码 8-24 号查证对照表，查表+相邻插值换算、宁大勿小取档提示，附纸条量周长反查、借戒指量内径与惊喜送礼拿圈号指南，纯浏览器本地运行',
  keywords: '戒指圈口对照表,戒指尺寸换算,港码美码对照,戒指内径,指围对照表,ring size',
  author: '有条工具',
  ogTitle: '戒指圈口换算器 - 戒指尺寸对照表 | 港码美码欧码换算 | 有条工具',
  ogDescription: '港码/内径/周长/美码/欧码五维互查，港码 8-24 号查证对照表，量周长反查圈号，惊喜送礼必备。',
  ogUrl: 'https://www.util.cn/tools/ring-size-converter',
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
          name: '戒指圈口换算器',
          url: 'https://www.util.cn/tools/ring-size-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['港码/内径 mm/周长 mm/美码 US/欧码 EU 五维互查', '港码 8-24 号查证对照表（香港珠宝行与周大福口径）', '查表 + 相邻插值换算，两档之间提示取偏大一档', '纸条量周长反查圈号', '借现有戒指量内径引导', '左右手与冬夏季节差异提示', '惊喜送礼拿圈号指南', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '设计工具', item: 'https://www.util.cn/design/' },
            { '@type': 'ListItem', position: 3, name: '戒指圈口换算器', item: 'https://www.util.cn/tools/ring-size-converter' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '港码14号内径多少mm？是多少号？',
              acceptedAnswer: { '@type': 'Answer', text: '按查证口径：港码14号=内径16.9mm、周长53.1mm，约等于美码US 6.5、欧码EU 53。网上流传的「港14=17.7mm」实为港码16号的数值，属于串行错误。' }
            },
            {
              '@type': 'Question',
              name: '美码7是港码几号？美码港码怎么换算？',
              acceptedAnswer: { '@type': 'Answer', text: '美码US 7内径约17.3mm、周长约54.4mm，对应港码15号。港码与美码步长不等（美码半号约1.28mm周长，港码一号约1.0-1.2mm），没有固定加减关系，交界号可能差半码，请以对照表为准。' }
            },
            {
              '@type': 'Question',
              name: '手指周长量出来54mm是几号？',
              acceptedAnswer: { '@type': 'Answer', text: '周长54mm介于港码14号（53.1mm）与15号（54.3mm）之间、更接近15号，按「宁大勿小」取港码15号（内径17.3mm，约美码7、欧码54）。' }
            },
            {
              '@type': 'Question',
              name: '欧码为什么和周长数字一样？',
              acceptedAnswer: { '@type': 'Answer', text: '欧洲口径直接用内圈周长毫米数作为尺码数值：EU 53即周长53mm。量出指围后欧码基本就是该毫米数取整，再反查港码与美码即可。' }
            },
            {
              '@type': 'Question',
              name: '左右手、冬夏季节对圈口影响多大？',
              acceptedAnswer: { '@type': 'Answer', text: '惯用手比另一只手粗约半号；同一根手指夏天偏胀、冬天偏缩，早晚差幅也可达半号。按佩戴那只手、傍晚测量、两季都戴取偏大的原则选号，±半号浮动属正常。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 圈口对照表：港码 8-24 号（大陆珠宝行通用口径）。
// 查证来源（2026-11-08）：Wills HK 香港珠宝行国际对照表（港 8 = 14.8/46.5 … 港 24 = 20.4/64.1）
// 与周大福官方口径（港 13=16.5、14=16.9、15=17.3、16=17.7、17=18.0mm）交叉一致；
// 每行满足 内径 × π ≈ 周长（±0.1mm）。欧码 EU = 内圈周长毫米数取整；美码列按内圈周长
// 就近归到整号/半号（标准美码刻度：内径 mm = 11.63 + 0.8128 × 美码号）。
const RING_TABLE = [
  { hk: 8,  dia: 14.8, circ: 46.5, us: 4,    eu: 47 },
  { hk: 9,  dia: 15.2, circ: 47.7, us: 4.5,  eu: 48 },
  { hk: 10, dia: 15.5, circ: 48.7, us: 5,    eu: 49 },
  { hk: 11, dia: 15.9, circ: 49.9, us: 5,    eu: 50 },
  { hk: 12, dia: 16.2, circ: 50.9, us: 5.5,  eu: 51 },
  { hk: 13, dia: 16.6, circ: 52.1, us: 6,    eu: 52 },
  { hk: 14, dia: 16.9, circ: 53.1, us: 6.5,  eu: 53 },
  { hk: 15, dia: 17.3, circ: 54.3, us: 7,    eu: 54 },
  { hk: 16, dia: 17.7, circ: 55.6, us: 7.5,  eu: 56 },
  { hk: 17, dia: 18.0, circ: 56.5, us: 8,    eu: 57 },
  { hk: 18, dia: 18.3, circ: 57.5, us: 8,    eu: 58 },
  { hk: 19, dia: 18.7, circ: 58.7, us: 8.5,  eu: 59 },
  { hk: 20, dia: 19.0, circ: 59.7, us: 9,    eu: 60 },
  { hk: 21, dia: 19.4, circ: 60.9, us: 9.5,  eu: 61 },
  { hk: 22, dia: 19.7, circ: 61.9, us: 10,   eu: 62 },
  { hk: 23, dia: 20.1, circ: 63.1, us: 10.5, eu: 63 },
  { hk: 24, dia: 20.4, circ: 64.1, us: 11,   eu: 64 }
]

const CIRC_MIN = RING_TABLE[0].circ                    // 46.5
const CIRC_MAX = RING_TABLE[RING_TABLE.length - 1].circ // 64.1
const HK_MIN = RING_TABLE[0].hk                         // 8
const HK_MAX = RING_TABLE[RING_TABLE.length - 1].hk     // 24
const CLAMP_TOL = 0.6 // 距表端 0.6mm 以内的输入按边界档处理（美码 11 = 周长 64.6 略超表端）
const EPS = 1e-9

// 标准美码刻度：内径 mm = 11.63 + 0.8128 × 美码号，周长 = 内径 × π
function usToCirc(us) {
  return Math.PI * (11.63 + 0.8128 * us)
}

// 就近归半号（0.5 步进，四舍五入）；就近归整数
function snapHalf(v) {
  return Math.round(v * 2) / 2
}
function snapInt(v) {
  return Math.round(v)
}

// 数值展示：去掉小数尾巴（17.30 → 17.3），digits 位小数
function fmtMm(v, digits = 2) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  const r = Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits)
  return String(r)
}

// 港码（可为小数）→ 周长 mm：查表 + 相邻插值；超出表端时贴边
function circFromHk(hk) {
  const first = RING_TABLE[0]
  const last = RING_TABLE[RING_TABLE.length - 1]
  if (hk <= first.hk + EPS) return { circ: first.circ, exact: Math.abs(hk - first.hk) < EPS }
  if (hk >= last.hk - EPS) return { circ: last.circ, exact: Math.abs(hk - last.hk) < EPS }
  for (let i = 0; i < RING_TABLE.length - 1; i++) {
    const a = RING_TABLE[i]
    const b = RING_TABLE[i + 1]
    if (hk >= a.hk - EPS && hk <= b.hk + EPS) {
      const t = (hk - a.hk) / (b.hk - a.hk)
      return { circ: a.circ + t * (b.circ - a.circ), exact: false }
    }
  }
  return null
}

// 周长 mm → 全部维度：查表 + 相邻插值；距表端 0.6mm 以内贴边（clamped），再远返回 null
function convertFromCirc(circ) {
  if (!Number.isFinite(circ)) return null
  const first = RING_TABLE[0]
  const last = RING_TABLE[RING_TABLE.length - 1]
  if (circ < first.circ - CLAMP_TOL || circ > last.circ + CLAMP_TOL) return null
  let c = circ
  let clamped = null
  if (c < first.circ) { clamped = 'down'; c = first.circ }
  if (c > last.circ) { clamped = 'up'; c = last.circ }
  for (let i = 0; i < RING_TABLE.length - 1; i++) {
    const a = RING_TABLE[i]
    const b = RING_TABLE[i + 1]
    if (c >= a.circ - EPS && c <= b.circ + EPS) {
      const t = (c - a.circ) / (b.circ - a.circ)
      const exact = Math.abs(t) < EPS || Math.abs(1 - t) < EPS
      const row = t < 0.5 ? a : b
      const diaF = a.dia + t * (b.dia - a.dia)
      const hkF = a.hk + t * (b.hk - a.hk)
      const usF = a.us + t * (b.us - a.us)
      const euF = a.eu + t * (b.eu - a.eu)
      return {
        circ: c,
        dia: exact ? row.dia : diaF,
        hk: snapInt(hkF), hkFrac: hkF,
        us: snapHalf(usF), usFrac: usF,
        eu: snapInt(euF), euFrac: euF,
        exact,
        index: exact ? (t < 0.5 ? i : i + 1) : (t < 0.5 ? i : i + 1),
        between: !exact,
        clamped,
        hint: exact
          ? '该数值恰好命中对照表档位，可直接按本档选号。'
          : `该数值介于港码 ${a.hk} 与 ${b.hk} 号之间（约 ${fmtMm(hkF, 1)} 号），按「宁大勿小」惯例建议取偏大一档（港码 ${b.hk} 号）。`
      }
    }
  }
  return null
}

// 任一维度 → 周长 → 全部维度；system = 'hk' | 'dia' | 'circ' | 'us' | 'eu'
// 返回 { ok, display, hint, clampHint, index, exact, ... } 或 { ok: false, error }
function convertRing(value, system) {
  const raw = String(value == null ? '' : value).trim()
  const meta = SYSTEM_META[system] || { label: '数值', range: '' }
  if (!raw) return { ok: false, error: `请输入${meta.label}（${meta.range}）` }
  const n = Number(raw)
  if (!Number.isFinite(n)) return { ok: false, error: `「${raw}」不是有效数字：请输入${meta.label}，范围 ${meta.range}` }

  let circ
  if (system === 'hk') {
    if (n < HK_MIN || n > HK_MAX) return { ok: false, error: `港码请输入 ${HK_MIN}-${HK_MAX} 的圈号（可含半号），超出对照表覆盖范围。` }
    const hit = circFromHk(n)
    circ = hit ? hit.circ : null
  } else if (system === 'us') {
    if (n < 4 || n > 11) return { ok: false, error: '美码请输入 4-11 号（本对照表覆盖范围，海淘请以品牌官方圈口表复核）。' }
    circ = usToCirc(n)
  } else if (system === 'eu') {
    if (n < 46 || n > 65) return { ok: false, error: '欧码请输入 47-64 号（欧码数值≈内圈周长毫米数）。' }
    circ = n
  } else if (system === 'dia') {
    if (n <= 0 || n < 14 || n > 21) return { ok: false, error: '内径请输入约 14.8-20.4 mm（对照表覆盖范围，用现有戒指内圈量得）。' }
    circ = n * Math.PI
  } else {
    if (n <= 0 || n > 70) return { ok: false, error: '周长请输入 46.5-64.1 mm（纸条绕指量得的指围）。' }
    circ = n
  }

  const res = convertFromCirc(circ)
  if (!res) {
    return { ok: false, error: `数值超出对照表覆盖范围：本表覆盖周长 ${fmtMm(CIRC_MIN, 1)}-${fmtMm(CIRC_MAX, 1)} mm（港码 ${HK_MIN}-${HK_MAX} 号），请检查输入。` }
  }
  res.ok = true
  const nearHk = Math.abs(res.hkFrac - res.hk) < 0.05
  const nearUs = Math.abs(res.usFrac - res.us) < 0.05
  const nearEu = Math.abs(res.euFrac - res.eu) < 0.05
  res.clampHint = res.clamped === 'up'
    ? `该数值略超表内最大档，已按最大档（港码 ${HK_MAX} 号）处理。`
    : res.clamped === 'down'
      ? `该数值略低于表内最小档，已按最小档（港码 ${HK_MIN} 号）处理。`
      : null
  res.display = {
    hk: nearHk ? String(res.hk) : `≈ ${res.hk}`,
    dia: fmtMm(res.dia, 1),
    circ: fmtMm(res.circ, 1),
    us: nearUs ? fmtMm(res.us, 1) : `≈ ${fmtMm(res.us, 1)}`,
    eu: nearEu ? String(res.eu) : `≈ ${res.eu}`
  }
  return res
}

const SYSTEM_META = {
  hk: { label: '港码（圈号）', range: '8-24 号' },
  dia: { label: '内径（mm）', range: '约 14.8-20.4' },
  circ: { label: '周长（mm）', range: '约 46.5-64.1' },
  us: { label: '美码（US）', range: '4-11 号' },
  eu: { label: '欧码（EU）', range: '47-64 号' }
}

// ---------- 页面状态 ----------
const fields = [
  { key: 'hk', label: '港码（圈号）', placeholder: '如 14', tip: '大陆珠宝行通用整数圈号' },
  { key: 'dia', label: '内径（mm）', placeholder: '如 16.9', tip: '现有戒指内圈直径' },
  { key: 'circ', label: '周长（mm）', placeholder: '如 53.1', tip: '纸条绕指量得的指围' },
  { key: 'us', label: '美码（US）', placeholder: '如 6.5', tip: '美国海淘常用（整号/半号）' },
  { key: 'eu', label: '欧码（EU）', placeholder: '如 53', tip: '数值≈内圈周长毫米数，欧洲品牌常用' }
]

const values = ref({ hk: '14', dia: '', circ: '', us: '', eu: '' })
const sourceKey = ref('hk')
const seoContentVisible = ref(true)
const measureCirc = ref('')

function onFieldInput(key, event) {
  sourceKey.value = key
  values.value[key] = event.target.value
}

// 当前输入的换算结果（SSR 安全：纯 computed，无浏览器 API）
const parsed = computed(() => convertRing(values.value[sourceKey.value], sourceKey.value))
const result = computed(() => (parsed.value && parsed.value.ok ? parsed.value : null))
const error = computed(() => {
  const raw = String(values.value[sourceKey.value] || '').trim()
  if (!raw) return ''
  return parsed.value && !parsed.value.ok ? parsed.value.error : ''
})

// 非输入维度的回填展示
function displayFor(key) {
  if (key === sourceKey.value) return values.value[key]
  return result.value ? result.value.display[key] : ''
}

// 结果瓦片（输入维度高亮）
const resultTiles = computed(() => {
  if (!result.value) return []
  const labels = { hk: '港码（圈号）', dia: '内径 mm', circ: '周长 mm', us: '美码 US', eu: '欧码 EU' }
  return ['hk', 'dia', 'circ', 'us', 'eu'].map((key) => ({
    key,
    label: labels[key],
    value: result.value.display[key],
    input: key === sourceKey.value
  }))
})

// 对照表高亮行（最近档）
const highlightIndex = computed(() => (result.value ? result.value.index : -1))

// 测量卡：周长反查（SSR 安全）
const measureResult = computed(() => {
  const raw = String(measureCirc.value || '').trim()
  if (!raw) return null
  return convertRing(raw, 'circ')
})

function fillFromMeasure() {
  if (measureResult.value && measureResult.value.ok) {
    sourceKey.value = 'circ'
    values.value.circ = String(measureCirc.value).trim()
  }
}

// 常用锚点速查（点击自动填入）
const quickPicks = [
  { key: 'hk', value: '14', label: '港码 14（女戒常见）' },
  { key: 'hk', value: '15', label: '港码 15' },
  { key: 'hk', value: '18', label: '港码 18（男戒常见）' },
  { key: 'us', value: '7', label: '美码 US 7' },
  { key: 'us', value: '8', label: '美码 US 8' },
  { key: 'circ', value: '53.1', label: '指围 53.1mm' },
  { key: 'dia', value: '17.3', label: '内径 17.3mm' },
  { key: 'eu', value: '54', label: '欧码 54' }
]

function applyPick(pick) {
  sourceKey.value = pick.key
  values.value = { hk: '', dia: '', circ: '', us: '', eu: '' }
  values.value[pick.key] = pick.value
}

function fillExample() {
  sourceKey.value = 'circ'
  values.value = { hk: '', dia: '', circ: '53.1', us: '', eu: '' }
}

function resetInput() {
  sourceKey.value = 'hk'
  values.value = { hk: '', dia: '', circ: '', us: '', eu: '' }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('ring-size-converter')
})
</script>
