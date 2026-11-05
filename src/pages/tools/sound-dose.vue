<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Ear class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">噪声暴露剂量计算器（LAeq）</h1>
          <p class="text-sm text-muted-foreground mt-1">3dB 交换率 · 允许时间 T 与日剂量 % · 多段暴露合计 · 护耳建议与 NRR 折算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线噪声日暴露剂量计算工具：输入等效声级 LAeq（dBA）与计划暴露时长，按 NIOSH 3dB 交换率口径 T = 8/2^((L−85)/3) 求允许暴露时间与日剂量百分比，
        支持多段暴露（如车间 2h@95 + 办公 4h@75）动态合计、折算 8h 等效声级 TWA，并给出分级护耳建议与耳塞 NRR 简化折算。
        适用于车间职业健康自查、演唱会 / KTV / 耳机使用等生活场景评估；全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条（口径注明） -->
    <div class="flex items-start gap-2 bg-muted/60 border border-border rounded-lg p-3 mb-6 text-xs text-muted-foreground leading-relaxed">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>
        口径注明：本工具按 <strong class="text-foreground">NIOSH 3dB 交换率</strong>（T = 8/2^((L−85)/3)，85dBA→8h、88→4h、91→2h、94→1h、97→30min、100→15min）；
        中国 GBZ 2.2「8h 接触 85dB(A)（A 计权）」限值表与之相同；欧盟采用 80/85 双行动值注记（见底部口径卡）。本工具为科普自查，不替代职业健康法定检测。
      </span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：输入面板（侧栏） -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 暴露输入
        </h2>

        <!-- 计算模式 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">暴露模式</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="m in MODES" :key="m.id"
              @click="setMode(m.id)"
              class="px-3 py-2 rounded-lg border text-sm font-medium transition"
              :class="mode === m.id ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'"
            >{{ m.name }}</button>
          </div>
        </div>

        <!-- 单段输入 -->
        <div v-if="mode === 'single'">
          <p class="text-sm font-medium text-foreground mb-2">当前 LAeq（dBA，等效声级）</p>
          <input v-model="laeqIn" type="number" step="0.1" min="30" max="140" @change="saveState" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 95" />
          <p class="text-sm font-medium text-foreground mb-2 mt-4">计划暴露时长（h）</p>
          <input v-model="hoursIn" type="number" step="0.25" min="0.01" max="24" @change="saveState" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 2" />
          <p v-if="singleError" class="text-xs text-red-500 mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {{ singleError }}
          </p>
          <div class="flex flex-wrap gap-2 mt-2">
            <button
              v-for="p in LAEQ_PRESETS" :key="p.value"
              @click="applyLaeq(p.value)"
              class="px-2.5 py-1 rounded-lg border text-xs font-medium transition bg-muted/40 border-border text-muted-foreground hover:text-foreground"
            >{{ p.label }}</button>
          </div>
        </div>

        <!-- 多段动态行 -->
        <div v-else>
          <p class="text-sm font-medium text-foreground mb-1">多段暴露（同一天累计）</p>
          <p class="text-[10px] text-muted-foreground mb-2">逐段填「场景 + 时长 + LAeq」，剂量按 Σ(t/T) 累加</p>
          <div class="space-y-2">
            <div v-for="(row, idx) in segmentRows" :key="row.key" class="p-2.5 bg-muted/40 border border-border rounded-lg space-y-2">
              <div class="flex items-center gap-1.5">
                <input v-model="row.label" type="text" maxlength="12" placeholder="场景（如车间）" class="flex-1 min-w-0 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <button @click="removeRow(idx)" class="px-1.5 py-1 text-[10px] border border-border rounded text-muted-foreground hover:text-red-500 hover:border-red-500/40 flex-shrink-0">删</button>
              </div>
              <div class="flex items-center gap-1.5">
                <input v-model="row.hours" type="number" step="0.25" min="0.01" max="24" placeholder="时长 h" @change="saveState" class="w-20 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <span class="text-[10px] text-muted-foreground flex-shrink-0">h @</span>
                <input v-model="row.laeq" type="number" step="0.1" min="30" max="140" placeholder="dBA" @change="saveState" class="w-20 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <span class="text-[10px] text-muted-foreground flex-shrink-0">dBA</span>
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="addRow" class="flex-1 py-1.5 text-sm text-primary border border-dashed border-primary/40 rounded-lg hover:bg-primary/5 transition">+ 添加暴露段</button>
              <button @click="applyExample" class="px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition bg-muted/40">示例：车间2h@95+办公4h@75</button>
            </div>
          </div>
          <p v-if="multiError" class="text-xs text-amber-600 mt-2 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {{ multiError }}
          </p>
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
        <!-- 结论卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Timer class="w-5 h-5 mr-2 text-primary" /> 日暴露剂量
          </h2>
          <div v-if="dose !== null" class="bg-muted/40 border border-border rounded-lg p-5">
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-card border border-border rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">日剂量合计</p>
                <p class="text-4xl font-bold" :class="verdictClass.text">{{ fmt(dose, 1) }}<span class="text-lg font-semibold text-muted-foreground">%</span></p>
                <p class="text-[10px] text-muted-foreground mt-1 font-mono">D = 100 × Σ(tᵢ/Tᵢ)</p>
              </div>
              <div class="bg-card border border-border rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">折算 8h 等效声级（TWA）</p>
                <p class="text-4xl font-bold text-primary">{{ fmt(twa, 1) }}<span class="text-lg font-semibold text-muted-foreground">dBA</span></p>
                <p class="text-[10px] text-muted-foreground mt-1 font-mono">85 + 9.97·log₁₀(D/100)</p>
              </div>
              <div class="bg-card border border-border rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">暴露判定</p>
                <p class="mt-2">
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium" :class="verdictClass.badge">
                    <ShieldCheck v-if="verdict === '相对安全'" class="w-3.5 h-3.5" />
                    <TriangleAlert v-else class="w-3.5 h-3.5" />
                    {{ verdict }}
                  </span>
                </p>
                <p class="text-[10px] text-muted-foreground mt-2">合计暴露 {{ fmt(totalHours, 2) }} h</p>
              </div>
            </div>
          </div>
          <div v-else class="p-8 text-center text-sm text-muted-foreground bg-muted/40 border border-border rounded-lg">
            请填写有效的 LAeq（30–140 dBA）与暴露时长（0.01–24 h）
          </div>
        </div>

        <!-- 分段明细表 -->
        <div v-if="detailRows.length" class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <ListOrdered class="w-5 h-5 mr-2 text-primary" /> 分段明细与允许时间
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-[10px] text-muted-foreground">
                <tr class="border-b border-border">
                  <th class="text-left py-1.5 font-medium">段落</th>
                  <th class="text-right py-1.5 font-medium">时长</th>
                  <th class="text-right py-1.5 font-medium">LAeq</th>
                  <th class="text-right py-1.5 font-medium">允许时间 Tᵢ</th>
                  <th class="text-right py-1.5 font-medium">剂量贡献</th>
                  <th class="text-left py-1.5 font-medium pl-3 w-28">占比</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in detailRows" :key="row.key" class="border-b border-border/50 last:border-0">
                  <td class="py-1.5 text-foreground">{{ row.label }}</td>
                  <td class="py-1.5 text-right font-mono text-foreground">{{ fmt(row.hours, 2) }} h</td>
                  <td class="py-1.5 text-right font-mono text-foreground">{{ fmt(row.laeq, 1) }}</td>
                  <td class="py-1.5 text-right font-mono text-primary font-semibold">{{ fmtHours(row.allowed) }}</td>
                  <td class="py-1.5 text-right font-mono" :class="row.over ? 'text-red-500 font-semibold' : 'text-foreground'">{{ fmt(row.contribPct, 1) }}%</td>
                  <td class="py-1.5 pl-3">
                    <div class="flex items-center gap-1.5">
                      <div class="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                        <div class="h-full rounded-full bg-primary" :style="{ width: row.barWidth }"></div>
                      </div>
                      <span class="text-[10px] text-muted-foreground font-mono w-10 text-right">{{ fmt(row.sharePct, 0) }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[10px] text-muted-foreground leading-relaxed">
            单段「剂量贡献 = 100 × tᵢ/Tᵢ」超过 100% 表示仅该段已超日允许量；低声级段（如 75dBA 办公）Tᵢ 很长，贡献通常可忽略。
          </p>
        </div>

        <!-- 允许时间速查表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Clock3 class="w-5 h-5 mr-2 text-primary" /> 允许暴露时间速查（3dB 交换率）
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            <div
              v-for="lvl in refRows" :key="lvl.level"
              class="p-2.5 rounded-lg border text-center"
              :class="lvl.active ? 'bg-primary/10 border-primary/40' : 'bg-muted/50 border-border'"
            >
              <p class="text-xs text-muted-foreground font-mono">{{ lvl.level }} dBA</p>
              <p class="text-sm font-bold text-foreground mt-0.5">{{ lvl.text }}</p>
            </div>
          </div>
          <p class="text-[10px] text-muted-foreground leading-relaxed">
            每升高 3dB（能量翻倍），允许时间减半：85dBA→8h、88→4h、91→2h、94→1h、97→30min、100→15min。高亮为与当前输入最接近的档位。
          </p>
        </div>

        <!-- 护耳建议卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck class="w-5 h-5 text-primary" /> 护耳建议
          </h2>
          <div class="p-3 rounded-lg border text-sm leading-relaxed" :class="advice.toneClass">
            {{ advice.text }}
          </div>
          <!-- NRR 折算 -->
          <div class="p-3 bg-muted/50 border border-border rounded-lg space-y-2">
            <p class="text-sm font-medium text-foreground">耳塞 NRR 简化折算（可选）</p>
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground flex-shrink-0">NRR</span>
              <input v-model="nrrIn" type="number" step="1" min="0" max="40" @change="saveState" class="w-20 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 30" />
              <span class="text-xs text-muted-foreground">dB</span>
              <span v-if="nrrDose !== null" class="text-xs text-muted-foreground ml-auto">
                佩戴后等效声级 ≈ <strong class="text-foreground font-mono">{{ fmt(protectedLaeqLevel, 1) }} dBA</strong> · 剂量降至 <strong class="text-green-600 dark:text-green-400 font-mono">{{ fmt(nrrDose, 1) }}%</strong>
              </span>
            </div>
            <p class="text-[10px] text-muted-foreground leading-relaxed">
              口径简化注记：有效声级 ≈ LAeq − (NRR − 7) ÷ 2（先减 7dB 校正佩戴与频谱差异，再取一半）。密合度对实际保护影响巨大，佩戴不当保护可能远低于标称；
              高噪声（&gt;100dBA）建议耳塞 + 耳罩叠加，两种护耳器 NRR 不可直接相加。
            </p>
          </div>
        </div>

        <!-- 限值口径对比卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Scale class="w-5 h-5 mr-2 text-primary" /> 职业噪声限值口径对比
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-[10px] text-muted-foreground">
                <tr class="border-b border-border">
                  <th class="text-left py-1.5 font-medium">口径</th>
                  <th class="text-right py-1.5 font-medium">8h 限值</th>
                  <th class="text-right py-1.5 font-medium">交换率</th>
                  <th class="text-left py-1.5 font-medium pl-3">要点</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in LIMIT_STANDARDS" :key="s.name" class="border-b border-border/50 last:border-0">
                  <td class="py-1.5 text-foreground whitespace-nowrap">{{ s.name }}</td>
                  <td class="py-1.5 text-right font-mono text-primary font-semibold whitespace-nowrap">{{ s.limit }}</td>
                  <td class="py-1.5 text-right font-mono text-muted-foreground">{{ s.exchange }}</td>
                  <td class="py-1.5 pl-3 text-xs text-muted-foreground">{{ s.note }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[10px] text-muted-foreground leading-relaxed">
            本工具的 T 与剂量按 NIOSH / GBZ 口径计算；OSHA 5dB 口径允许时间更长（95dBA→4h），偏宽松，自护耳评估不建议采用。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>噪声暴露剂量是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          听力损伤取决于「声级 × 时间」的累计声能，而不是某一刻的峰值。日暴露剂量 D 把一天的各段暴露折算成「用掉了多少份额」：
          <strong class="text-foreground">D = 100 × Σ(tᵢ/Tᵢ)</strong>，其中 Tᵢ 是该声级下一天允许暴露的时间。D = 100% 表示刚好用完一天的「声能预算」；
          D = 200% 表示透支一倍。多段暴露直接累加——车间 2h@95 加办公室 4h@75，两段各自贡献再求和。
          剂量与声级、时长都是非线性关系：每升高 3dB，允许时间就减半，这就是 3dB 交换率。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">3dB 交换率是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          声级每升高 3dB，声能量恰好翻倍（3dB ≈ 10·log₁₀2）。等能量原则下，能量翻倍就要把暴露时间减半：
          85dBA 允许 8h，88dBA 只允许 4h，91dBA 2h，94dBA 1h，97dBA 30min，100dBA 15min——数学表达即
          <strong class="text-foreground">T = 8 / 2^((L−85)/3)</strong>（NIOSH 与中国 GBZ 2.2 口径）。
          美国 OSHA 用的是 5dB 交换率（每 +5dB 才减半，95dBA 仍允许 4h），对噪声的危害假设更宽松；
          听力学与 WHO 立场认为 3dB 更接近等能量损伤模型，自查护耳建议一律按 3dB 口径从严。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">A 计权（dBA）是什么？为什么不用普通 dB？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          人耳对 1–5kHz（语音频段）最敏感，对低频很不敏感。A 计权就是在测量时按人耳敏感度曲线对频谱加权（低频大幅衰减、
          2–4kHz 略微提升），得到「听起来多响」的声级，单位 dBA。同一台机器用 C 计权（接近真实声能）和 A 计权测可能差十几 dB，
          而噪声性听力损伤的剂量评估、职业限值（GBZ 2.2 的 85dB(A)）都用 A 计权口径，本工具输入的 LAeq 即「A 计权等效连续声级」。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">职业噪声限值对比：NIOSH / OSHA / GBZ / 欧盟</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          <strong class="text-foreground">NIOSH（美国职业安全与卫生研究所）</strong>：REL 为 85dBA / 8h，3dB 交换率，听力学口径最严格；
          <strong class="text-foreground">OSHA（美国法定）</strong>：PEL 为 90dBA / 8h，5dB 交换率，行动值 85dBA；
          <strong class="text-foreground">中国 GBZ 2.2</strong>：8h 接触限值 LEX,8h = 85dB(A)（A 计权等效声级），3dB 交换率，与 NIOSH 的允许时间表相同，超过 85dB(A) 的作业属噪声作业需职业健康监护；
          <strong class="text-foreground">欧盟 2003/10/EC 指令</strong>：双行动值注记——下行动值 80dBA（暴露即须告知并提供护耳器）、上行动值 85dBA（强制佩戴），暴露限值 87dBA（佩戴护耳器后耳内不得超过）。
          各口径差异巨大（95dBA 在 OSHA 下可待 4h，NIOSH 下只有约 48min），护耳自查请从严执行。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">普通耳塞 NRR 怎么看？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          NRR（Noise Reduction Rate）是护耳器包装上标称的降噪值，美国标注体系下实验室理想值普遍虚高。工程常用简化折算：
          <strong class="text-foreground">有效降噪 ≈ (NRR − 7) ÷ 2</strong>——先减 7dB 校正实耳与实验室差异（A 计权场景），再取一半留安全余量。
          例如 NRR 30 的泡沫耳塞，实际按约 11.5dB 估算。真正决定保护水平的是<strong class="text-foreground">密合度</strong>：泡沫耳塞要搓细插入待回弹，
          头戴耳罩要贴紧无发丝眼镜干扰；佩戴不到位时实际保护可能只有标称的零头。高噪声环境（&gt;100dBA）建议耳塞 + 耳罩双保护，
          但两者 NRR 不能简单相加，叠加后一般只多 5–10dB。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">95dBA 环境一天能待多久？</h3>
            <p class="text-sm text-muted-foreground mt-1">按 NIOSH / GBZ 的 3dB 口径：T = 8/2^((95−85)/3) ≈ 0.79 小时，约 48 分钟。OSHA 的 5dB 口径下则约 4 小时——口径差异巨大，护耳自查建议按 3dB 从严执行。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">剂量 100% 是什么意思？超过会怎样？</h3>
            <p class="text-sm text-muted-foreground mt-1">100% 表示一天内该噪声的累计声能刚好达到职业限值对应的「预算」。≥100% 必须佩戴护耳器并缩短暴露；剂量每翻一倍，等效暴露强度翻一倍，永久性听阈偏移风险随之上升。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">车间 2h@95 加办公 4h@75 会不会超标？</h3>
            <p class="text-sm text-muted-foreground mt-1">车间段：95dBA 允许约 0.79h，2h 已贡献约 252%；办公段 75dBA 允许时间极长（约 80h），4h 只贡献约 5%，合计约 257%。主要矛盾在高声级段——把车间段压到 45min 以内或佩戴有效耳塞才是关键。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">演唱会、耳机听歌也算进日剂量吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">算。听力只认累计声能：白天车间 + 晚上演唱会 + 通勤耳机音量会叠加在同一天的预算里。演唱会前排常见 100–110dBA，按 3dB 口径 15 分钟上下即用完全天剂量，建议戴耳塞并控制时长。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有公式都在浏览器本地计算，不记录、不发送任何输入内容，参数仅保存在本机浏览器中用于下次恢复。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'sound-dose'" :category="'health'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Ear, Calculator, RefreshCw, Info, TriangleAlert,
  ChevronUp, ChevronDown, Timer, ShieldCheck, Clock3, ListOrdered, Scale
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '噪声暴露剂量计算器 - LAeq 允许时间与护耳建议在线工具',
  description: '免费在线噪声暴露剂量计算：输入 LAeq 与暴露时长，按 NIOSH 3dB 交换率求允许暴露时间与日剂量百分比，支持多段暴露合计、8h 等效声级 TWA、耳塞 NRR 简化折算与分级护耳建议，附 NIOSH/OSHA/GBZ/欧盟限值对比，纯浏览器本地运行不上传',
  keywords: '噪声暴露剂量,LAeq,3dB交换率,允许暴露时间,听力保护,NRR',
  author: '有条工具',
  ogTitle: '噪声暴露剂量计算器 - LAeq 允许时间与护耳建议在线工具 | 有条工具',
  ogDescription: '3dB 交换率日剂量计算、多段暴露合计、TWA 折算、NRR 折算与 NIOSH/GBZ/欧盟限值对比。',
  ogUrl: 'https://www.util.cn/tools/sound-dose',
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
          name: '噪声暴露剂量计算器',
          url: 'https://www.util.cn/tools/sound-dose',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['NIOSH 3dB 交换率允许时间 T 计算', '日剂量百分比 D = 100×Σ(t/T)', '多段暴露动态行合计', '8h 等效声级 TWA 折算', '分级护耳建议（≥100% / 50–100% / <50%）', '耳塞 NRR 简化折算', 'NIOSH/OSHA/GBZ/欧盟限值对比', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '健康工具', item: 'https://www.util.cn/health/' },
            { '@type': 'ListItem', position: 3, name: '噪声暴露剂量计算器', item: 'https://www.util.cn/tools/sound-dose' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '95dBA 环境一天能待多久？',
              acceptedAnswer: { '@type': 'Answer', text: '按 NIOSH / GBZ 的 3dB 口径：T = 8/2^((95−85)/3) ≈ 0.79 小时，约 48 分钟。OSHA 的 5dB 口径下则约 4 小时，护耳自查建议按 3dB 从严执行。' }
            },
            {
              '@type': 'Question',
              name: '剂量 100% 是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '表示一天内累计声能刚好达到职业限值预算。≥100% 必须佩戴护耳器并缩短暴露时间。' }
            },
            {
              '@type': 'Question',
              name: '车间 2h@95 加办公 4h@75 会不会超标？',
              acceptedAnswer: { '@type': 'Answer', text: '会。车间段 95dBA 允许约 0.79h，2h 已贡献约 252%；办公段 75dBA 允许约 80h，4h 仅贡献约 5%，合计约 257%，主要矛盾在车间段。' }
            },
            {
              '@type': 'Question',
              name: '普通耳塞 NRR 怎么看？',
              acceptedAnswer: { '@type': 'Answer', text: '简化口径：有效降噪 ≈ (NRR−7)÷2。NRR30 的泡沫耳塞按约 11.5dB 估算；密合度决定实际保护，高噪声建议耳塞+耳罩叠加但不可直接相加 NRR。' }
            },
            {
              '@type': 'Question',
              name: '计算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有公式都在浏览器本地计算，不记录、不发送任何输入内容，参数仅保存在本机浏览器中用于下次恢复。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const CRITERION = 85      // 基准声级 dBA（8h 日剂量预算的锚点）
const EXCHANGE = 3        // 交换率 dB（NIOSH / GBZ 2.2 口径，OSHA 为 5dB 不采用）
const TWA_K = 9.9658      // TWA 折算常数 ≈ 3 / log₁₀2
const LAEQ_MIN = 30       // LAeq 输入下限 dBA
const LAEQ_MAX = 140      // LAeq 输入上限 dBA
const HOURS_MIN = 0.01    // 时长输入下限 h
const HOURS_MAX = 24      // 时长输入上限 h
const NRR_MAX = 40        // NRR 输入上限 dB

// 数值解析：字符串/数字 → 有限数或 null
function toNum(v) {
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

// 允许暴露时间 T（小时）：T = 8 / 2^((L−85)/3)，NIOSH 3dB 交换率口径
// 注：85dBA→8h、88→4h、91→2h、94→1h、97→30min、100→15min。
// 验证：allowedHours(85)=8、allowedHours(88)=4、allowedHours(94)=1、allowedHours(100)=0.25；
//       allowedHours(95)=8/2^(10/3)≈0.7937（约 47.6 分钟——3dB 口径下 95dBA 介于 94dBA 的 1h
//       与 97dBA 的 30min 之间，且必须小于 1h，故不可能出现更大值）
function allowedHours(laeq) {
  if (!Number.isFinite(laeq) || laeq <= 0) return null
  return 8 / Math.pow(2, (laeq - CRITERION) / EXCHANGE)
}

// 日剂量百分比：D = 100 × Σ(tᵢ/Tᵢ)；segments 为 [{hours, laeq}]，跳过无效段，全部无效返回 null
// 验证：dosePercent([{hours:2, laeq:95}]) ≈ 251.98%（T≈0.7937h，2h 超标逾一倍）；
//       dosePercent([{hours:8, laeq:85}]) = 100；
//       dosePercent([{hours:2,laeq:95},{hours:4,laeq:75}]) ≈ 256.94（办公段贡献约 5%）
function dosePercent(segments) {
  if (!Array.isArray(segments) || segments.length === 0) return null
  let sum = 0
  let valid = false
  for (const s of segments) {
    if (!s || !Number.isFinite(s.hours) || !(s.hours > 0)) continue
    const t = allowedHours(s.laeq)
    if (t === null || !(t > 0)) continue
    sum += s.hours / t
    valid = true
  }
  if (!valid) return null
  return sum * 100
}

// 折算 8h 等效声级（TWA）：TWA = 85 + (3/log₁₀2)·log₁₀(D/100)，D 为百分比剂量
// 验证：doseTwa(100) = 85；doseTwa(251.98) ≈ 89.0（2h@95 的 8h 等效）；无暴露（D≤0）返回 null
function doseTwa(dosePct) {
  if (!Number.isFinite(dosePct) || dosePct <= 0) return null
  return CRITERION + TWA_K * Math.log10(dosePct / 100)
}

// 耳塞 NRR 简化折算：佩戴后等效声级 ≈ LAeq − (NRR−7)/2
// 验证：protectedLaeq(95, 30) = 95 − 11.5 = 83.5
function protectedLaeq(laeq, nrr) {
  const l = Number.isFinite(laeq) ? laeq : null
  const n = Number.isFinite(nrr) ? nrr : null
  if (l === null || n === null || n <= 0) return null
  return l - (n - 7) / 2
}

// 判定三态：D≥100 必须防护；50≤D<100 需要关注（轮换/限时段）；D<50 相对安全
function verdictOf(dosePct) {
  if (!Number.isFinite(dosePct)) return ''
  if (dosePct >= 100) return '必须防护'
  if (dosePct >= 50) return '需要关注'
  return '相对安全'
}

// 允许时间人性化显示：h（≥1h，0.1h 精度）→ min → s
// 验证：fmtHours(8)='8 h'、fmtHours(0.7937)='47.6 min'、fmtHours(0.25)='15 min'、fmtHours(25.4)='25.4 h'
function fmtHours(T) {
  if (T === null || T === undefined || !Number.isFinite(T)) return '—'
  if (T >= 1) {
    const r = Math.round(T * 10) / 10
    return Number.isInteger(r) ? `${r} h` : `${r.toFixed(1)} h`
  }
  const min = T * 60
  if (min >= 1) {
    return Number.isInteger(min) ? `${min} min` : `${min.toFixed(1)} min`
  }
  return `${Math.round(min * 60)} s`
}

// 显示格式化：null / 非数值 → '—'
function fmt(v, digits) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  return v.toFixed(digits)
}

// ---------- 常量与基础数据 ----------
const MODES = [
  { id: 'single', name: '单段暴露' },
  { id: 'multi', name: '多段合计' }
]

const LAEQ_PRESETS = [
  { value: 85, label: '85 限值线' },
  { value: 90, label: '90 车间' },
  { value: 95, label: '95 风镐' },
  { value: 100, label: '100 电锯' },
  { value: 105, label: '105 演唱会' }
]

// 允许时间速查档位（按 allowedHours 计算）
const REF_LEVELS = [80, 82, 85, 88, 91, 94, 97, 100, 103, 106, 109]

// 职业限值口径对比
const LIMIT_STANDARDS = [
  { name: 'NIOSH（美，研究口径）', limit: '85 dBA / 8h', exchange: '3 dB', note: 'REL 最严格，听力保护设计建议采用' },
  { name: '中国 GBZ 2.2（法定）', limit: '85 dB(A) LEX,8h', exchange: '3 dB', note: '与 NIOSH 允许时间表相同，超限属噪声作业' },
  { name: 'OSHA（美，法定）', limit: '90 dBA / 8h', exchange: '5 dB', note: '行动值 85dBA；口径偏宽松，自查不建议采用' },
  { name: '欧盟 2003/10/EC', limit: '80/85 双行动值', exchange: '3 dB', note: '80 需告知配发护耳器、85 强制佩戴，耳内上限 87dBA' }
]

const DEFAULTS = { mode: 'single', laeq: '95', hours: '2', nrr: '' }
const EXAMPLE_SEGMENTS = [
  { label: '车间', hours: '2', laeq: '95' },
  { label: '办公', hours: '4', laeq: '75' }
]
const STORAGE_PREFIX = 'sound-dose'

// ---------- UI 状态 ----------
let rowKeySeq = 0
const makeRow = (label = '', hours = '', laeq = '') => ({ key: ++rowKeySeq, label, hours, laeq })

const mode = ref(DEFAULTS.mode)
const laeqIn = ref(DEFAULTS.laeq)
const hoursIn = ref(DEFAULTS.hours)
const segmentRows = ref(EXAMPLE_SEGMENTS.map((s) => makeRow(s.label, s.hours, s.laeq)))
const nrrIn = ref(DEFAULTS.nrr)
const seoContentVisible = ref(true)

// 校验
const laeq = computed(() => toNum(laeqIn.value))
const hours = computed(() => toNum(hoursIn.value))
const laeqValid = (v) => v !== null && v >= LAEQ_MIN && v <= LAEQ_MAX
const hoursValid = (v) => v !== null && v >= HOURS_MIN && v <= HOURS_MAX
const singleError = computed(() => {
  if (mode.value !== 'single') return ''
  if (!laeqValid(laeq.value)) return `LAeq 需在 ${LAEQ_MIN}–${LAEQ_MAX} dBA 之间`
  if (!hoursValid(hours.value)) return `时长需在 ${HOURS_MIN}–${HOURS_MAX} h 之间`
  return ''
})
const multiError = computed(() => {
  if (mode.value !== 'multi') return ''
  const ok = activeSegments.value.length > 0
  if (!ok && segmentRows.value.length > 0) return '已填段落中缺少有效的「时长 + LAeq」组合，请检查'
  return ''
})

// 当前生效的暴露段：单段 → 单条；多段 → 解析动态行（跳过空行）
const activeSegments = computed(() => {
  if (mode.value === 'single') {
    if (!laeqValid(laeq.value) || !hoursValid(hours.value)) return []
    return [{ key: 0, label: '当前暴露', hours: hours.value, laeq: laeq.value }]
  }
  const rows = []
  segmentRows.value.forEach((r, i) => {
    const h = toNum(r.hours)
    const l = toNum(r.laeq)
    if (hoursValid(h) && laeqValid(l)) {
      rows.push({ key: r.key, label: r.label.trim() || `段落 ${i + 1}`, hours: h, laeq: l })
    }
  })
  return rows
})

// 剂量与 TWA
const dose = computed(() => (activeSegments.value.length ? dosePercent(activeSegments.value) : null))
const twa = computed(() => (dose.value !== null ? doseTwa(dose.value) : null))
const totalHours = computed(() => (activeSegments.value.length ? activeSegments.value.reduce((s, x) => s + x.hours, 0) : null))

// 判定与建议
const verdict = computed(() => verdictOf(dose.value))
const verdictMeta = {
  必须防护: { text: 'text-red-600', badge: 'bg-red-500/10 text-red-600 border-red-500/30', tone: 'bg-red-500/10 border-red-500/30 text-red-600' },
  需要关注: { text: 'text-amber-600', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/30', tone: 'bg-amber-500/10 border-amber-500/30 text-amber-600' },
  相对安全: { text: 'text-green-600', badge: 'bg-green-500/10 text-green-600 border-green-500/20', tone: 'bg-green-500/10 border-green-500/20 text-green-600' }
}
const verdictClass = computed(() => (verdictMeta[verdict.value] || { text: '', badge: '' }))
const advice = computed(() => {
  const d = dose.value
  if (d === null) return { toneClass: 'bg-muted/50 border-border text-muted-foreground', text: '填写 LAeq 与暴露时长后给出分级建议。' }
  if (d >= 100) {
    return {
      toneClass: verdictMeta['必须防护'].tone,
      text: `日剂量 ${fmt(d, 1)}%（≥100%）：必须防护。全天佩戴护耳器（耳塞或耳罩）并优先降低声源声级、缩短暴露时间；当日剂量已超一倍以上，等效于把一天的预算用透，长期如此将造成不可逆的噪声性听力损失。`
    }
  }
  if (d >= 50) {
    return {
      toneClass: verdictMeta['需要关注'].tone,
      text: `日剂量 ${fmt(d, 1)}%（50–100%）：需要管理。建议轮换岗位 / 限时段暴露、中途离开高噪声区休息，并留意其余声源（耳机、通勤、娱乐噪声）同样计入当天预算；佩戴护耳器可立即把剂量降下来。`
    }
  }
  return {
    toneClass: verdictMeta['相对安全'].tone,
    text: `日剂量 ${fmt(d, 1)}%（<50%）：相对安全。仍建议对不确定声级的场景保持监测——耳机大音量、KTV、演唱会等娱乐暴露同样消耗当天预算，日积月累不可忽视。`
  }
})

// 分段明细（含 Tᵢ、剂量贡献与占比条）
const detailRows = computed(() => {
  const d = dose.value
  return activeSegments.value.map((s) => {
    const allowed = allowedHours(s.laeq)
    const contribPct = allowed !== null ? (s.hours / allowed) * 100 : null
    const sharePct = d !== null && d > 0 && contribPct !== null ? Math.min(100, (contribPct / d) * 100) : 0
    return {
      key: s.key,
      label: s.label,
      hours: s.hours,
      laeq: s.laeq,
      allowed,
      contribPct,
      sharePct,
      over: contribPct !== null && contribPct >= 100,
      barWidth: `${sharePct.toFixed(0)}%`
    }
  })
})

// 允许时间速查（高亮与当前最高声级段最近的档位）
const maxLaeqLevel = computed(() => {
  const rows = activeSegments.value
  if (!rows.length) return null
  return rows.reduce((mx, x) => (x.laeq > mx ? x.laeq : mx), rows[0].laeq)
})
const refRows = computed(() => {
  let activeLevel = null
  if (maxLaeqLevel.value !== null) {
    activeLevel = REF_LEVELS.reduce((best, lvl) =>
      (best === null || Math.abs(lvl - maxLaeqLevel.value) < Math.abs(best - maxLaeqLevel.value) ? lvl : best), null)
  }
  return REF_LEVELS.map((lvl) => ({
    level: lvl,
    text: fmtHours(allowedHours(lvl)),
    active: activeLevel === lvl
  }))
})

// NRR 折算（对所有生效段统一折算后重算剂量）
const nrr = computed(() => toNum(nrrIn.value))
const protectedLaeqLevel = computed(() => {
  if (nrr.value === null || nrr.value <= 0 || nrr.value > NRR_MAX) return null
  const top = activeSegments.value
  if (!top.length) return null
  const mx = top.reduce((m, x) => (x.laeq > m ? x.laeq : m), top[0].laeq)
  return protectedLaeq(mx, nrr.value)
})
const nrrDose = computed(() => {
  if (nrr.value === null || nrr.value <= 0 || nrr.value > NRR_MAX) return null
  const rows = activeSegments.value
  if (!rows.length) return null
  const masked = rows.map((s) => ({ hours: s.hours, laeq: protectedLaeq(s.laeq, nrr.value) }))
  return dosePercent(masked)
})

// ---------- 交互 ----------
function setMode(id) {
  mode.value = id
  if (id === 'multi' && !segmentRows.value.length) {
    segmentRows.value = EXAMPLE_SEGMENTS.map((s) => makeRow(s.label, s.hours, s.laeq))
  }
  saveState()
}

function addRow() {
  segmentRows.value = segmentRows.value.concat([makeRow()])
}

function removeRow(idx) {
  segmentRows.value = segmentRows.value.filter((_, i) => i !== idx)
  saveState()
}

function applyLaeq(v) {
  laeqIn.value = String(v)
  saveState()
}

function applyExample() {
  segmentRows.value = EXAMPLE_SEGMENTS.map((s) => makeRow(s.label, s.hours, s.laeq))
  saveState()
}

function resetAll() {
  mode.value = DEFAULTS.mode
  laeqIn.value = DEFAULTS.laeq
  hoursIn.value = DEFAULTS.hours
  segmentRows.value = EXAMPLE_SEGMENTS.map((s) => makeRow(s.label, s.hours, s.laeq))
  nrrIn.value = DEFAULTS.nrr
  saveState()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 本地持久化：键前缀 = 工具 id；仅在交互回调与 onMounted 中读写
function saveState() {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}.mode`, mode.value)
    localStorage.setItem(`${STORAGE_PREFIX}.laeq`, laeqIn.value)
    localStorage.setItem(`${STORAGE_PREFIX}.hours`, hoursIn.value)
    localStorage.setItem(`${STORAGE_PREFIX}.segments`, JSON.stringify(
      segmentRows.value.map((r) => ({ label: r.label, hours: r.hours, laeq: r.laeq }))
    ))
    localStorage.setItem(`${STORAGE_PREFIX}.nrr`, nrrIn.value)
  } catch (e) { /* 隐私模式等场景静默降级 */ }
}

function restoreState() {
  try {
    const modeSaved = localStorage.getItem(`${STORAGE_PREFIX}.mode`)
    if (modeSaved === 'single' || modeSaved === 'multi') mode.value = modeSaved
    const laeqSaved = localStorage.getItem(`${STORAGE_PREFIX}.laeq`)
    if (laeqSaved !== null && laeqValid(toNum(laeqSaved))) laeqIn.value = laeqSaved
    const hoursSaved = localStorage.getItem(`${STORAGE_PREFIX}.hours`)
    if (hoursSaved !== null && hoursValid(toNum(hoursSaved))) hoursIn.value = hoursSaved
    const segSaved = localStorage.getItem(`${STORAGE_PREFIX}.segments`)
    if (segSaved !== null) {
      const arr = JSON.parse(segSaved)
      if (Array.isArray(arr) && arr.length > 0) {
        segmentRows.value = arr.slice(0, 10).map((s) => makeRow(
          typeof s.label === 'string' ? s.label : '',
          s.hours === undefined || s.hours === null ? '' : String(s.hours),
          s.laeq === undefined || s.laeq === null ? '' : String(s.laeq)
        ))
      }
    }
    const nrrSaved = localStorage.getItem(`${STORAGE_PREFIX}.nrr`)
    if (nrrSaved !== null && toNum(nrrSaved) !== null && toNum(nrrSaved) >= 0 && toNum(nrrSaved) <= NRR_MAX) nrrIn.value = nrrSaved
  } catch (e) { /* 静默降级 */ }
}

onMounted(() => {
  addRecentTool('sound-dose')
  restoreState()
})
</script>
