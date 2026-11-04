<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Disc class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">房间混响计算器（RT60）</h1>
          <p class="text-sm text-muted-foreground mt-1">赛宾 / 艾雷恩双公式估算 · 材料清单 · 吸音板用量反推 · 听音房装修决策</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线房间混响时间（RT60）计算工具：输入长宽自动算出体积 V 与总表面积 S，选「装修档次」快速模式或逐条列出材料（窗帘、地毯、吸音板、观众席……）自定义精算，
        同时给出赛宾公式与艾雷恩公式两个 RT60 值，按语音 / 听音 / 影院 / 琴房 / 会议场景判定「偏长 / 合适 / 偏短」，并反推需要再加多少 m² 吸音板。
        适用于影音室、录音房、直播间、琴房的声学设计与装修下单；全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <div class="flex items-start gap-2 bg-muted/60 border border-border rounded-lg p-3 mb-6 text-xs text-muted-foreground leading-relaxed">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>赛宾公式为低频近似（吸声量小、房间不太大时误差 10-20%），艾雷恩公式修正了大吸声场景；本工具两者并列出结果，装修决策请按保守值执行。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 房间参数
        </h2>

        <!-- 房间尺寸 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">房间尺寸（m，0.1–100）</p>
          <div class="grid grid-cols-3 gap-2">
            <label class="block">
              <span class="text-[10px] text-muted-foreground">长</span>
              <input v-model="lengthIn" type="number" min="0.1" max="100" step="0.1" class="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </label>
            <label class="block">
              <span class="text-[10px] text-muted-foreground">宽</span>
              <input v-model="widthIn" type="number" min="0.1" max="100" step="0.1" class="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </label>
            <label class="block">
              <span class="text-[10px] text-muted-foreground">高</span>
              <input v-model="heightIn" type="number" min="0.1" max="100" step="0.1" class="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </label>
          </div>
          <div v-if="geometry" class="grid grid-cols-2 gap-2 text-center mt-2.5">
            <div class="bg-muted/50 rounded-lg p-2.5">
              <p class="text-[10px] text-muted-foreground mb-0.5">体积 V</p>
              <p class="text-sm font-bold text-foreground">{{ volumeText }} m³</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-2.5">
              <p class="text-[10px] text-muted-foreground mb-0.5">总表面积 S</p>
              <p class="text-sm font-bold text-foreground">{{ surfaceText }} m²</p>
            </div>
          </div>
          <p v-else-if="dimError" class="text-xs text-red-500 flex items-start gap-1.5 mt-2">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {{ dimError }}
          </p>
        </div>

        <!-- 计算模式 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">计算模式</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="m in MODES" :key="m.id"
              @click="setMode(m.id)"
              class="px-3 py-2 rounded-lg border text-sm font-medium transition"
              :class="mode === m.id ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'"
            >{{ m.name }}</button>
          </div>
        </div>

        <!-- 装修档次快速模式 -->
        <div v-show="mode === 'quick'">
          <p class="text-sm font-medium text-foreground mb-1">装修档次</p>
          <p class="text-[10px] text-muted-foreground mb-2">括号内为平均吸声系数经验值（@500Hz）</p>
          <div class="space-y-1.5">
            <label v-for="lv in DECOR_LEVELS" :key="lv.id" class="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" :value="lv.id" v-model="levelId" class="accent-primary" />
              <span class="text-foreground">{{ lv.name }}</span>
              <span class="text-[10px] text-muted-foreground ml-auto font-mono">α {{ lv.alpha.toFixed(2) }}</span>
            </label>
          </div>
        </div>

        <!-- 自定义材料模式 -->
        <div v-show="mode === 'custom'">
          <p class="text-sm font-medium text-foreground mb-1">材料清单</p>
          <p class="text-[10px] text-muted-foreground mb-2">吸声系数表为 500 Hz 实测均值（典型产品），逐条填「材料 + 面积」</p>
          <div class="space-y-2">
            <div v-for="(row, idx) in materialRows" :key="row.key" class="flex items-center gap-1.5">
              <select v-model="row.id" class="flex-1 min-w-0 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="" disabled>选择材料</option>
                <option v-for="mat in MATERIALS" :key="mat.id" :value="mat.id">{{ mat.name }}（α {{ mat.alpha.toFixed(2) }}）</option>
              </select>
              <input v-model="row.area" type="number" min="0" step="0.5" placeholder="面积" class="w-[72px] px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <span class="text-[10px] text-muted-foreground flex-shrink-0">m²</span>
              <button @click="removeRow(idx)" class="px-1.5 py-1 text-[10px] border border-border rounded text-muted-foreground hover:text-red-500 hover:border-red-500/40 flex-shrink-0">删</button>
            </div>
            <button @click="addRow" class="w-full py-1.5 text-sm text-primary border border-dashed border-primary/40 rounded-lg hover:bg-primary/5 transition">+ 添加材料</button>
          </div>
          <p v-if="overCoverage" class="text-xs text-amber-600 flex items-start gap-1.5 mt-2">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> 超过房间表面积，请核对
          </p>
          <p v-else-if="geometry" class="text-[10px] text-muted-foreground mt-2">已覆盖 {{ coverageText }} m² · 覆盖率 {{ coveragePctText }}%</p>
        </div>

        <!-- 频率场景 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">频率场景（口径提示）</p>
          <select v-model="freq" class="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option v-for="f in FREQ_OPTIONS" :key="f.value" :value="f.value">{{ f.label }}</option>
          </select>
          <div v-if="isLowFreq" class="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 mt-2 leading-relaxed">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>系数表按 500 Hz 取值。低频吸声普遍下降 30-50%，结果偏乐观。</span>
          </div>
          <table class="w-full text-[11px] mt-2 border border-border rounded-lg overflow-hidden">
            <thead class="bg-muted/50 text-muted-foreground">
              <tr>
                <th class="text-left px-2 py-1 font-medium">低频参考示范</th>
                <th class="text-right px-2 py-1 font-medium">α @500Hz</th>
                <th class="text-right px-2 py-1 font-medium">α @250Hz</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in LOW_FREQ_DEMO" :key="row.name" class="border-t border-border">
                <td class="px-2 py-1 text-foreground">{{ row.name }}</td>
                <td class="px-2 py-1 text-right font-mono text-muted-foreground">{{ row.at500 }}</td>
                <td class="px-2 py-1 text-right font-mono text-foreground">{{ row.at250 }}</td>
              </tr>
            </tbody>
          </table>
          <p class="text-[10px] text-muted-foreground mt-1">250 Hz 为典型产品参考值；本工具不做全频段硬编码系数，低频请按乐观值打折看待。</p>
        </div>

        <!-- 目标场景 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">目标 RT60 场景</p>
          <select v-model="scenarioId" class="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option v-for="sc in RT_SCENARIOS" :key="sc.id" :value="sc.id">{{ sc.name }}（{{ sc.min }}–{{ sc.max }}s）</option>
          </select>
        </div>

        <button
          @click="resetAll"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置全部参数
        </button>
      </div>

      <!-- 右：结果面板（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Volume2 class="w-5 h-5 mr-2 text-primary" /> 计算结果
          </h2>

          <!-- 结论卡：双公式并排 -->
          <div class="bg-muted/40 border border-border rounded-lg p-5">
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-card border border-border rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">赛宾公式 RT60</p>
                <p class="text-4xl font-bold text-primary">{{ fmt(rtSab, 2) }}<span class="text-lg font-semibold text-muted-foreground">s</span></p>
                <p class="text-[10px] text-muted-foreground mt-1 font-mono">RT = 0.161·V / A</p>
              </div>
              <div class="bg-card border border-border rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">艾雷恩公式 RT60</p>
                <p class="text-4xl font-bold text-primary">{{ fmt(rtEyr, 2) }}<span class="text-lg font-semibold text-muted-foreground">s</span></p>
                <p class="text-[10px] text-muted-foreground mt-1 font-mono">RT = 0.161·V / (−S·ln(1−α̅))</p>
              </div>
            </div>
            <p v-if="eyringDominant" class="text-xs text-amber-600 flex items-start gap-1.5 mt-3 justify-center">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>吸声较大以艾雷恩为准（两式偏差 {{ deviationText }}%，判定已按艾雷恩值）</span>
            </p>
            <div class="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span class="text-xs text-muted-foreground">目标「{{ scenario.name }} {{ scenario.min }}–{{ scenario.max }}s」</span>
              <span v-if="hasResult" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium" :class="verdictClass">
                <CheckCircle v-if="verdict === '合适'" class="w-3.5 h-3.5" />
                <TriangleAlert v-else-if="verdict === '偏长'" class="w-3.5 h-3.5" />
                <Info v-else class="w-3.5 h-3.5" />
                {{ verdict }}
              </span>
              <span v-else class="px-2.5 py-1 rounded-full border border-border bg-muted/50 text-xs text-muted-foreground">待计算</span>
            </div>
          </div>

          <!-- 材料明细表（自定义模式） -->
          <div v-if="mode === 'custom' && detailRows.length">
            <h3 class="text-sm font-semibold text-foreground mb-2">材料明细与吸声量贡献</h3>
            <table class="w-full text-sm">
              <thead class="text-[10px] text-muted-foreground">
                <tr class="border-b border-border">
                  <th class="text-left py-1.5 font-medium">材料</th>
                  <th class="text-right py-1.5 font-medium">面积 m²</th>
                  <th class="text-right py-1.5 font-medium">α</th>
                  <th class="text-right py-1.5 font-medium">吸声量 m²</th>
                  <th class="text-left py-1.5 font-medium pl-3 w-28">占比</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in detailRows" :key="row.name + row.area" class="border-b border-border/50 last:border-0">
                  <td class="py-1.5 text-foreground">{{ row.name }}</td>
                  <td class="py-1.5 text-right font-mono text-foreground">{{ row.areaText }}</td>
                  <td class="py-1.5 text-right font-mono text-muted-foreground">{{ row.alpha.toFixed(2) }}</td>
                  <td class="py-1.5 text-right font-mono text-primary font-semibold">{{ row.absText }}</td>
                  <td class="py-1.5 pl-3">
                    <div class="flex items-center gap-1.5">
                      <div class="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                        <div class="h-full rounded-full bg-primary" :style="{ width: row.pctText }"></div>
                      </div>
                      <span class="text-[10px] text-muted-foreground font-mono w-8 text-right">{{ row.pctText }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <p class="text-[10px] text-muted-foreground mt-1.5">总吸声量 A = {{ absorptionText }} m²（赛宾单位）。未铺材料的墙面 / 顶面不计入吸声，反推卡按毛坯 α 0.05 保守估算。</p>
          </div>
        </div>

        <!-- 反推卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 吸音板用量反推
          </h2>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs text-muted-foreground">选定板材：</span>
            <select v-model="boardId" class="px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option v-for="b in BOARD_OPTIONS" :key="b.id" :value="b.id">{{ b.name }}（α {{ b.alpha.toFixed(2) }}）</option>
            </select>
            <span class="text-[10px] text-muted-foreground">按 {{ scenario.name }} 目标区间 {{ scenario.min }}–{{ scenario.max }}s 反推</span>
          </div>
          <p class="text-sm leading-relaxed" :class="boardAdvice.tone === 'ok' ? 'text-green-600' : boardAdvice.tone === 'long' ? 'text-foreground' : 'text-amber-600'">
            {{ boardAdvice.text }}
          </p>
          <button
            v-if="boardAdvice.tone === 'long' && boardAdvice.m2 > 0"
            @click="addAdviceToMaterials"
            class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >+ 把 {{ boardAdvice.m2 }} m² {{ board.name }} 加进材料清单</button>
          <p class="text-[10px] text-muted-foreground leading-relaxed">
            口径：所需吸声量 A = 0.161·V ÷ 目标RT，扣除当前吸声（自定义模式下未铺墙面按毛坯 α 0.05 折算补入基面吸声），再除以板材 500 Hz 系数——忽略板材本身替换掉的基面吸声，结果略偏多，属保守方向。
          </p>
        </div>

        <!-- 场景预设 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold">场景预设</h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              v-for="p in PRESETS" :key="p.name"
              @click="applyPreset(p)"
              class="text-left px-3 py-2.5 bg-muted/40 hover:bg-muted/70 border border-border rounded-lg transition"
            >
              <span class="flex items-center gap-1.5 text-sm font-medium text-foreground"><Play class="w-3.5 h-3.5 text-primary" /> {{ p.name }}</span>
              <span class="block text-[10px] text-muted-foreground mt-1">{{ p.dims.join('×') }} m · {{ p.hint }}</span>
            </button>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>RT60 是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          RT60 是混响时间：声源停止发声后，室内声能衰减 60 dB（约衰减到百万分之一）所需的时间，单位秒。混响来自墙面、天花、地面、家具的成千上万次反射叠加，
          它决定房间听起来是「清晰」还是「浑浊」。常见参考值：语音 / 播客与家庭影院 0.3–0.5s，听音室 0.4–0.7s，琴房练习 0.6–0.9s，会议室 0.5–0.8s——
          同一个房间对不同用途可能「过干」或「过湿」，所以本工具按你选的用途判定偏长 / 合适 / 偏短。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">赛宾和艾雷恩的差别：为什么大吸声房间赛宾失真？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          赛宾公式 RT = 0.161·V/A 假设声能在每次反射中被「均匀、微弱」地吸收，平均吸声系数越接近 0 越准。但当房间里铺满地毯、软包、吸音板（平均 α 超过约 0.3）时，
          反射声几乎是「擦着吸声面飞过」，赛宾会系统性高估剩余混响——α = 0.5 时理论偏差约 +39%。艾雷恩公式把吸收项换成热力学形式的 −S·ln(1−α)：
          α 很小时 ln(1−α) ≈ −α，两式收敛到同一结果；α 接近 1 时吸收率发散、RT 迅速趋零，符合「满软包房间几乎没有混响」的直觉。本工具并排给出两式，
          偏差超过 30% 即提示以艾雷恩为准，装修决策请按保守值（更差的那个方向）执行。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么低频最难治？（尺寸与波长）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          声速约 343 m/s，波长 = 343 ÷ 频率：500 Hz 的波长只有 0.69 m，厚窗帘（几毫米到一厘米绒层）相对它是「厚」的，能吸收；
          而 100 Hz 波长 3.4 m，同样窗帘相对波长薄如蝉翼，声波直接穿过——这就是「低频吸声普遍下降 30-50%」的物理根源。
          同时低频会在两个平行墙面之间形成驻波（轴向简正模式 f = 343 ÷ 2L），例如 5 m 长房间在 34.3 Hz、68.6 Hz、103 Hz… 逐次叠加，
          某些位置轰隆、某些位置抵消。治低频要靠厚度接近 λ/4 的吸声体、薄膜 / 穿孔共振吸声结构或低频陷阱塞墙角，普通鸡蛋棉基本无效。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">吸音板和隔音的区别（一句话版）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          吸音板解决「自己房间里的回声」：多孔软材料把反射声能转成热；隔音解决「声音穿墙到邻居家」：靠质量定律（面密度每翻倍约 +6 dB）、
          减振龙骨、双层错缝与缝隙密封。贴满鸡蛋棉挡不住隔壁听你的鼓声——要的是重、密、封，而不是松、软、多孔。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">家用最简单的三步（不动工也能听见差别）</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>满铺带垫地毯：吸掉地面反射，最先消灭高频颤动回声（flutter echo），对琴房、直播间立竿见影。</li>
          <li>窗墙挂厚窗帘：褶皱率 2:1 以上（布宽是窗宽两倍），落地封顶；玻璃是房间里最大的硬反射面之一。</li>
          <li>布艺沙发 + 满书书架：沙发宽带吸声，书架是天然扩散体，打断「音箱—硬墙—音箱」的对称反射。</li>
        </ul>
        <p class="text-sm text-muted-foreground leading-relaxed mt-2">
          摆放注记：第一反射点尽量「非对称」处理——左墙窗帘、右墙书架即可。两面侧墙用完全相同的做法与距离，会让左右反射在听音位移上重叠成梳状滤波，高频听起来发「金属味」。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">RT60 多少算合适？</h3>
            <p class="text-sm text-muted-foreground mt-1">取决于用途：语音 / 播客与家庭影院 0.3–0.5 秒，听音室 0.4–0.7 秒，琴房练习 0.6–0.9 秒，会议室 0.5–0.8 秒。本工具按你选的目标区间给出偏长 / 合适 / 偏短判定。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">赛宾和艾雷恩结果不一样，信哪个？</h3>
            <p class="text-sm text-muted-foreground mt-1">赛宾假设弱吸收，在大吸声房间会系统性高估混响；艾雷恩用 −S·ln(1−α) 修正，吸声越好越贴近实测。两值偏差超过 30% 说明房间吸声较大，应以艾雷恩为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">吸音板用量怎么反推？</h3>
            <p class="text-sm text-muted-foreground mt-1">按所需吸声量 A = 0.161·V ÷ 目标RT，减去当前房间吸声（未铺墙面按毛坯 α 0.05 估算），缺口除以所选板材 500 Hz 吸声系数即得大约多少平方米，建议向上取整并预留 20% 余量。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">贴吸音板能挡住吵到邻居吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不能。吸音处理的是自己房间内的回声与混响，隔音遵循质量定律，靠重墙体、密封缝隙与减振结构，两者目标与做法完全不同。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有公式都在浏览器本地计算，不记录、不发送任何输入内容，刷新页面即恢复默认参数。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'room-reverb-calculator'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Disc, Volume2, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Calculator
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '房间混响计算器 RT60 - 赛宾公式混响时间与吸音板用量在线估算',
  description: '免费在线房间混响时间 RT60 计算器：输入长宽高与装修档次或自定义材料清单，赛宾与艾雷恩双公式并排出结果，按语音/播客、听音室、家庭影院、琴房、会议目标区间判定偏长/合适/偏短，反推吸音板用量，纯浏览器本地运行不上传',
  keywords: 'RT60 计算,混响时间计算器,赛宾公式,吸音板用量,听音房设计',
  author: '有条工具',
  ogTitle: '房间混响计算器 RT60 - 赛宾公式混响时间与吸音板用量在线估算 | 有条工具',
  ogDescription: '赛宾 + 艾雷恩双公式 RT60 估算，材料清单与吸音板用量反推，影音室 / 录音房 / 直播间 / 琴房装修决策工具。',
  ogUrl: 'https://www.util.cn/tools/room-reverb-calculator',
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
          name: '房间混响计算器 RT60',
          url: 'https://www.util.cn/tools/room-reverb-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['房间体积与总表面积自动计算', '装修档次快速模式与自定义材料清单', '赛宾与艾雷恩双公式 RT60 并列', '目标场景偏长/合适/偏短判定', '吸音板用量 m² 反推并可一键加入清单', '低频口径差异提示', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '房间混响计算器 RT60', item: 'https://www.util.cn/tools/room-reverb-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'RT60 多少算合适？',
              acceptedAnswer: { '@type': 'Answer', text: '取决于用途：语音/播客与家庭影院 0.3–0.5 秒，听音室 0.4–0.7 秒，琴房练习 0.6–0.9 秒，会议室 0.5–0.8 秒。本工具按所选目标区间给出偏长/合适/偏短判定。' }
            },
            {
              '@type': 'Question',
              name: '赛宾和艾雷恩结果不一样，信哪个？',
              acceptedAnswer: { '@type': 'Answer', text: '赛宾假设弱吸收，在大吸声房间会系统性高估混响；艾雷恩用 −S·ln(1−α) 修正，吸声越好越贴近实测。两值偏差超过 30% 说明房间吸声较大，应以艾雷恩为准。' }
            },
            {
              '@type': 'Question',
              name: '吸音板用量怎么反推？',
              acceptedAnswer: { '@type': 'Answer', text: '按所需吸声量 A = 0.161·V ÷ 目标RT，减去当前房间吸声（未铺墙面按毛坯 α 0.05 估算），缺口除以所选板材 500Hz 吸声系数即得大约多少平方米，建议向上取整并预留 20% 余量。' }
            },
            {
              '@type': 'Question',
              name: '贴吸音板能挡住吵到邻居吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。吸音处理的是自己房间内的回声与混响，隔音遵循质量定律，靠重墙体、密封缝隙与减振结构，两者目标与做法完全不同。' }
            },
            {
              '@type': 'Question',
              name: '计算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有公式都在浏览器本地计算，不记录、不发送任何输入内容，刷新页面即恢复默认参数。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const SABINE_K = 0.161     // 赛宾常数（20°C 干燥空气，单位 s·m²/m³ 量纲归一）
const BASE_ALPHA = 0.05    // 未铺材料墙面/顶面的经验平均吸声系数（石膏板/涂料量级）
const ALPHA_CEIL = 0.999   // 艾雷恩退化保护：α̅ 钳制上限
const ALPHA_MIN = 0.001    // 艾雷恩退化保护：α̅ 钳制下限（避免除零）

// 房间几何：三边均须在 0.1–100 m 内，否则返回 null
// 验证：geometryOf(4,5,2.7) → volume 54 m³，surface 2(20+10.8+13.5)=88.6 m²
function geometryOf(L, W, H) {
  const ok = [L, W, H].every((d) => Number.isFinite(d) && d >= 0.1 && d <= 100)
  if (!ok) return null
  return {
    volume: L * W * H,
    surface: 2 * (L * W + L * H + W * H)
  }
}

// 赛宾公式：RT60 = 0.161·V / A（A 为总吸声量，m² 赛宾单位）；无体积或零吸声返回 null
function sabineOf(V, totalAbsorption) {
  if (!(V > 0) || !(totalAbsorption > 0)) return null
  return (SABINE_K * V) / totalAbsorption
}

// 艾雷恩公式：RT60 = 0.161·V / (−S·ln(1−α̅))
// 退化保护：α̅→1 时 −ln(1−α̅)→∞、RT 理论趋 0，钳制到 0.999 后返回 0 附近小值，避免除零/Inf
function eyringOf(V, surface, alphaAvg) {
  if (!(V > 0) || !(surface > 0) || !Number.isFinite(alphaAvg) || alphaAvg <= 0) return null
  const a = Math.min(Math.max(alphaAvg, ALPHA_MIN), ALPHA_CEIL)
  return (SABINE_K * V) / (-surface * Math.log(1 - a))
}

// 总吸声量：
// 自定义模式——materials 为 [{name, alpha, area}]，A = Σαᵢ·Sᵢ，coveragePct 为材料面积合计 ÷ 房间表面积（>100 即超铺，UI 黄字提示）
// 快速模式——materials 传空数组，用 fallbackAlpha（平均吸声系数经验值）：A = α̅·S，覆盖率恒 100%
function totalAbsorptionOf(materials, fallbackAlpha, surface) {
  if (!(surface > 0)) return null
  if (Array.isArray(materials) && materials.length > 0) {
    let A = 0
    let area = 0
    for (const m of materials) {
      const s = Number.isFinite(m.area) && m.area > 0 ? m.area : 0
      A += m.alpha * s
      area += s
    }
    return { A, coveragePct: (area / surface) * 100 }
  }
  const a = Number.isFinite(fallbackAlpha) ? Math.max(0, fallbackAlpha) : 0
  return { A: a * surface, coveragePct: 100 }
}

// 达到目标 RT60 所需吸声量：A_req = 0.161·V / RT_target
function requiredAbsorptionOf(V, targetRT) {
  if (!(V > 0) || !(targetRT > 0)) return null
  return (SABINE_K * V) / targetRT
}

// 吸音板用量反推：neededS = (A_req − A_base) / α_板
// 口径注释：A_base 为当前吸声（自定义模式下未铺墙面已按毛坯 BASE_ALPHA 0.05 折算补入）；
// 除以 α_板 而非 (α_板 − 0.05)，忽略板材替换掉的原墙面微弱吸声，结果略偏多，属保守方向。
function boardAreaOf(Areq, Abase, alphaBoard) {
  if (Areq === null || !Number.isFinite(Areq) || Abase === null || !Number.isFinite(Abase)) return null
  if (!(alphaBoard > 0)) return null
  return Math.max(0, (Areq - Abase) / alphaBoard)
}

// 判定三态：rt 落在 [min, max] 为合适（闭区间边界算合适）；超上限/无解（null、Inf）算偏长；低于下限算偏短
function judgeOf(rt, range) {
  if (!range || !(range.min >= 0) || !(range.max >= range.min)) return '合适'
  if (rt === null || !Number.isFinite(rt)) return '偏长'
  if (rt > range.max) return '偏长'
  if (rt < range.min) return '偏短'
  return '合适'
}

// 显示格式化：null / 非数值 → '—'
function fmt(v, digits) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  return v.toFixed(digits)
}

// ---------- 基础数据（经验系数表） ----------
// 平均吸声系数经验值 @500Hz（典型产品/典型工况，赛宾单位）
const MATERIALS = [
  { id: 'concrete', name: '水泥墙', alpha: 0.03 },
  { id: 'brick', name: '砖墙', alpha: 0.04 },
  { id: 'plasterboard', name: '石膏板', alpha: 0.05 },
  { id: 'curtain', name: '厚窗帘', alpha: 0.30 },
  { id: 'carpet', name: '地毯', alpha: 0.35 },
  { id: 'sofa', name: '沙发（布艺）', alpha: 0.30 },
  { id: 'audience', name: '人（观众）', alpha: 0.40 },
  { id: 'glass', name: '玻璃窗', alpha: 0.03 },
  { id: 'wooddoor', name: '木门', alpha: 0.15 },
  { id: 'mineral', name: '矿棉板吊顶', alpha: 0.50 },
  { id: 'polyester', name: '聚酯纤维吸音板', alpha: 0.80 },
  { id: 'perforated', name: '穿孔吸音板', alpha: 0.60 },
  { id: 'bookshelf', name: '书架满书', alpha: 0.40 },
  { id: 'foam', name: '泡沫吸音棉', alpha: 0.70 }
]

// 装修档次 → 平均吸声系数经验值（量级 0.05/0.15/0.30/0.50）
const DECOR_LEVELS = [
  { id: 'raw', name: '毛坯水泥房', alpha: 0.05 },
  { id: 'normal', name: '普通装修（窗帘地毯少量）', alpha: 0.15 },
  { id: 'good', name: '吸声较好（大量软包地毯）', alpha: 0.3 },
  { id: 'pro', name: '专业听音房', alpha: 0.5 }
]

// 目标 RT60 场景区间（s）
const RT_SCENARIOS = [
  { id: 'voice', name: '语音/播客', min: 0.3, max: 0.5 },
  { id: 'music', name: '听音室', min: 0.4, max: 0.7 },
  { id: 'cinema', name: '家庭影院', min: 0.3, max: 0.5 },
  { id: 'piano', name: '琴房练习', min: 0.6, max: 0.9 },
  { id: 'meeting', name: '会议室', min: 0.5, max: 0.8 }
]

// 频率场景：材料 α 表以 500Hz 为主频口径，仅做提示，不全频段硬编码
const FREQ_OPTIONS = [
  { value: '125', label: '125 Hz（低频）' },
  { value: '250', label: '250 Hz（低频）' },
  { value: '500', label: '500 Hz（主口径）' },
  { value: '1000', label: '1 kHz' },
  { value: '2000', label: '2 kHz' },
  { value: '4000', label: '4 kHz' }
]

// 低频参考示范小表（诚实简化：只给两项典型值，示意低频下降幅度）
const LOW_FREQ_DEMO = [
  { name: '厚窗帘', at500: 0.30, at250: 0.18 },
  { name: '矿棉板吊顶', at500: 0.50, at250: 0.30 }
]

// 反推用的板材候选
const BOARD_OPTIONS = MATERIALS.filter((m) => m.alpha >= 0.5)

const MODES = [
  { id: 'quick', name: '装修档次（快速）' },
  { id: 'custom', name: '自定义材料' }
]

// 场景预设（手算期望见 hint 与下方说明）
const PRESETS = [
  {
    name: '毛坯长方房',
    dims: [4, 5, 2.7], mode: 'quick', levelId: 'raw', materials: null, scenario: 'voice', freq: '500',
    hint: '期望 ≈1.96s · 明显偏长'
  },
  {
    name: '地毯厚帘听音室',
    dims: [3, 4, 2.6], mode: 'custom', levelId: 'normal',
    materials: [
      { id: 'plasterboard', area: 38 },  // 未覆盖墙顶面 ≈ 60.4 − 12 − 10
      { id: 'carpet', area: 12 },
      { id: 'curtain', area: 10 }
    ],
    scenario: 'music', freq: '500',
    hint: 'A=9.1 · 期望 ≈0.55s · 合适'
  },
  {
    name: '满软包会议室',
    dims: [6, 8, 3], mode: 'quick', levelId: 'good', materials: null, scenario: 'meeting', freq: '500',
    hint: '期望 ≈0.43s · 偏短（过吸）'
  }
]

const DEFAULT_DIMS = [4, 5, 2.7]
const DEFAULT_MATERIAL_ROWS = [{ id: 'curtain', area: '8' }]

// ---------- UI 状态 ----------
const toNum = (v) => {
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

let rowKeySeq = 0
const makeRow = (id = '', area = '') => ({ key: ++rowKeySeq, id, area })

const lengthIn = ref(String(DEFAULT_DIMS[0]))
const widthIn = ref(String(DEFAULT_DIMS[1]))
const heightIn = ref(String(DEFAULT_DIMS[2]))
const mode = ref('quick')
const levelId = ref('raw')
const materialRows = ref(DEFAULT_MATERIAL_ROWS.map((r) => makeRow(r.id, r.area)))
const freq = ref('500')
const scenarioId = ref('music')
const boardId = ref('polyester')
const seoContentVisible = ref(true)

// 尺寸校验：三项均在 0.1–100 m
const parsedDims = computed(() => [toNum(lengthIn.value), toNum(widthIn.value), toNum(heightIn.value)])
const dimsOk = computed(() => parsedDims.value.every((v) => v !== null && v >= 0.1 && v <= 100))
const dimError = computed(() => {
  if (dimsOk.value) return ''
  if (parsedDims.value.some((v) => v === null)) return '请填写完整的房间长、宽、高'
  return '尺寸需在 0.1–100 m 之间，请核对'
})
const geometry = computed(() => (dimsOk.value ? geometryOf(parsedDims.value[0], parsedDims.value[1], parsedDims.value[2]) : null))
const volumeText = computed(() => fmt(geometry.value ? geometry.value.volume : null, 1))
const surfaceText = computed(() => fmt(geometry.value ? geometry.value.surface : null, 1))

const level = computed(() => DECOR_LEVELS.find((l) => l.id === levelId.value) || DECOR_LEVELS[0])
const scenario = computed(() => RT_SCENARIOS.find((s) => s.id === scenarioId.value) || RT_SCENARIOS[1])
const board = computed(() => BOARD_OPTIONS.find((b) => b.id === boardId.value) || BOARD_OPTIONS[0])
const isLowFreq = computed(() => freq.value === '125' || freq.value === '250')

// 已解析的自定义材料行（跳过未选材料 / 非法面积的占位行）
const parsedMaterials = computed(() =>
  materialRows.value
    .map((r) => {
      const mat = MATERIALS.find((m) => m.id === r.id)
      const area = toNum(r.area)
      if (!mat || area === null || area <= 0) return null
      return { name: mat.name, alpha: mat.alpha, area }
    })
    .filter(Boolean)
)

const coveredArea = computed(() => parsedMaterials.value.reduce((s, m) => s + m.area, 0))

const absorption = computed(() => {
  if (!geometry.value) return null
  if (mode.value === 'custom') {
    if (!parsedMaterials.value.length) return null
    return totalAbsorptionOf(parsedMaterials.value, 0, geometry.value.surface)
  }
  return totalAbsorptionOf([], level.value.alpha, geometry.value.surface)
})

// 自定义模式：材料面积合计超过房间总表面积 → 黄字「超过房间表面积，请核对」
const overCoverage = computed(() => mode.value === 'custom' && !!absorption.value && absorption.value.coveragePct > 100)
const coverageText = computed(() => fmt(coveredArea.value, 1))
const coveragePctText = computed(() => fmt(absorption.value ? absorption.value.coveragePct : null, 0))
const absorptionText = computed(() => fmt(absorption.value ? absorption.value.A : null, 1))

// 双公式结果
const rtSab = computed(() => (geometry.value && absorption.value ? sabineOf(geometry.value.volume, absorption.value.A) : null))
const rtEyr = computed(() => {
  if (!geometry.value || !absorption.value) return null
  // 自定义模式的等效平均系数 α̅ = A/S（超铺时 >1，由 eyringOf 钳制退化保护）
  return eyringOf(geometry.value.volume, geometry.value.surface, absorption.value.A / geometry.value.surface)
})
const deviationPct = computed(() => {
  if (rtSab.value === null || rtEyr.value === null || rtSab.value <= 0) return 0
  return ((rtSab.value - rtEyr.value) / rtSab.value) * 100
})
const deviationText = computed(() => fmt(deviationPct.value, 0))
// 吸声较大（两式偏差 >30%）时判定与反推以艾雷恩（保守）为准
const eyringDominant = computed(() => rtSab.value !== null && rtEyr.value !== null && deviationPct.value > 30)
const rtForDecision = computed(() => (eyringDominant.value ? rtEyr.value : rtSab.value))
const hasResult = computed(() => rtForDecision.value !== null)
const verdict = computed(() => judgeOf(rtForDecision.value, scenario.value))

const verdictMeta = {
  合适: 'bg-green-500/10 text-green-600 border-green-500/20',
  偏长: 'bg-red-500/10 text-red-600 border-red-500/30',
  偏短: 'bg-amber-500/10 text-amber-600 border-amber-500/30'
}
const verdictClass = computed(() => verdictMeta[verdict.value] || '')

// 反推基线吸声：自定义模式把「未铺材料的剩余表面」按毛坯经验值 α0.05 折算补入（口径注释见纯逻辑区）
const baseAbsorption = computed(() => {
  if (!geometry.value || !absorption.value) return null
  if (mode.value === 'quick') return absorption.value.A
  const remain = Math.max(0, geometry.value.surface - coveredArea.value)
  return absorption.value.A + remain * BASE_ALPHA
})

const boardAdvice = computed(() => {
  const geo = geometry.value
  const sc = scenario.value
  const rt = rtForDecision.value
  if (!geo) return { tone: 'idle', m2: 0, text: '请先填写有效的房间长、宽、高。' }
  if (rt === null) return { tone: 'idle', m2: 0, text: mode.value === 'custom' ? '材料清单还没有有效行，请先添加至少一种吸声材料。' : '暂无结果。' }
  if (rt < sc.min) {
    return {
      tone: 'short', m2: 0,
      text: `当前 RT60 ≈ ${rt.toFixed(2)}s，比「${sc.name} ${sc.min}–${sc.max}s」下限还短：房间偏“干”、吸声过量，再加吸音材料只会更糟；考虑撤除部分软包或补回硬质反射面（玻璃、木板）。`
    }
  }
  if (rt <= sc.max) {
    return { tone: 'ok', m2: 0, text: `当前 RT60 已落在「${sc.name} ${sc.min}–${sc.max}s」目标区间内，无需再加吸音板。` }
  }
  const Areq = requiredAbsorptionOf(geo.volume, sc.max)
  const need = boardAreaOf(Areq, baseAbsorption.value, board.value.alpha)
  if (need === null) return { tone: 'idle', m2: 0, text: '反推不可用，请检查输入。' }
  if (need <= 0) return { tone: 'ok', m2: 0, text: `基线吸声估算已覆盖目标缺口，无需额外板材。` }
  const m2 = Math.max(1, Math.ceil(need))
  return {
    tone: 'long', m2,
    text: `想达到 ${sc.max.toFixed(2)}s（${sc.name}上限），需再加约 ${m2} m² ${board.value.name}（α ${board.value.alpha.toFixed(2)}）/ 或换 ${BOARD_OPTIONS.find((b) => b.id === 'mineral') ? '矿棉板吊顶' : '吸音天花板'}。`
  }
})

// 材料明细（含贡献占比条）
const detailRows = computed(() => {
  const totalA = absorption.value ? absorption.value.A : 0
  return parsedMaterials.value.map((m) => {
    const abs = m.alpha * m.area
    const pct = totalA > 0 ? (abs / totalA) * 100 : 0
    return { ...m, areaText: m.area.toFixed(1), absText: abs.toFixed(2), pctText: `${pct.toFixed(0)}%` }
  })
})

// ---------- 交互 ----------
function setMode(id) {
  mode.value = id
}

function addRow() {
  materialRows.value = materialRows.value.concat([makeRow()])
}

function removeRow(idx) {
  materialRows.value = materialRows.value.filter((_, i) => i !== idx)
}

function addAdviceToMaterials() {
  const advice = boardAdvice.value
  if (advice.tone !== 'long' || !advice.m2) return
  // 快速模式采纳建议时切到自定义模式，保留当前档次近似作为已列材料（清空由用户自行补）
  materialRows.value = materialRows.value.concat([makeRow(boardId.value, String(advice.m2))])
  if (mode.value !== 'custom') mode.value = 'custom'
}

function applyPreset(p) {
  lengthIn.value = String(p.dims[0])
  widthIn.value = String(p.dims[1])
  heightIn.value = String(p.dims[2])
  mode.value = p.mode
  if (p.levelId) levelId.value = p.levelId
  if (p.materials) {
    materialRows.value = p.materials.map((m) => makeRow(m.id, String(m.area)))
  } else {
    materialRows.value = DEFAULT_MATERIAL_ROWS.map((r) => makeRow(r.id, r.area))
  }
  scenarioId.value = p.scenario
  freq.value = p.freq
}

function resetAll() {
  lengthIn.value = String(DEFAULT_DIMS[0])
  widthIn.value = String(DEFAULT_DIMS[1])
  heightIn.value = String(DEFAULT_DIMS[2])
  mode.value = 'quick'
  levelId.value = 'raw'
  materialRows.value = DEFAULT_MATERIAL_ROWS.map((r) => makeRow(r.id, r.area))
  freq.value = '500'
  scenarioId.value = 'music'
  boardId.value = 'polyester'
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('room-reverb-calculator')
})
</script>
