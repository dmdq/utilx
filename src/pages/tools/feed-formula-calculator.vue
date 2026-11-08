<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Wheat class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">饲料配比计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">皮尔逊方两原料蛋白配平——玉米豆粕怎么配、各称多少公斤，输入目标粗蛋白即时出</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线饲料配比计算器：用皮尔逊方（Pearson Square）把一低一高两种原料配平到目标粗蛋白（CP）——
        高蛋白原料占比 = (目标 CP − 低原料 CP) ÷ (高原料 CP − 低原料 CP) × 100%，页面同时给出两种原料的配比百分比、
        按配料总量折算的投料公斤数，以及用配比回算混合后 CP 的闭环验算；内置玉米 8.7%、豆粕 43.5%、麦麸 15.7%、
        鱼粉 62.5% 等常见书值预设，可改可换。工具只解决两原料蛋白配平，三原料的可行做法（两两配平或线性规划）在页面如实说明、不做假装支持；
        CP 不等于可消化蛋白、钙磷比与预混料需另行添加等科普一并写清。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <p class="flex items-start gap-2 text-xs leading-relaxed bg-primary/10 border border-primary/20 text-foreground rounded-lg p-3 mb-6">
      <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      <span>预设粗蛋白为常见书值，实际以原料检测报告为准；结果为蛋白配平参考，不能替代饲养标准与兽医指导。计算只在浏览器本地进行。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左栏：输入 -->
      <div class="space-y-6">
        <!-- 原料 A -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Wheat class="w-5 h-5 mr-2 text-primary" /> 原料 A（低蛋白，如玉米）
          </h2>

          <div>
            <label for="feed-name-a" class="block text-sm font-medium text-foreground mb-1.5">名称</label>
            <input
              id="feed-name-a"
              v-model="nameA"
              type="text"
              maxlength="20"
              placeholder="如：玉米"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">常用原料预设（粗蛋白 %）</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="preset in INGREDIENT_PRESETS"
                :key="'a-' + preset.name"
                @click="applyPresetA(preset)"
                class="px-2.5 py-1.5 rounded-lg border border-border text-xs transition"
                :class="nameA === preset.name && Number(cpA) === preset.cp ? 'bg-primary/10 border-primary/40 text-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted'"
              >{{ preset.name }} {{ preset.cp }}%</button>
            </div>
          </div>

          <div>
            <label for="feed-cp-a" class="block text-sm font-medium text-foreground mb-1.5">粗蛋白含量（%）</label>
            <input
              id="feed-cp-a"
              v-model.number="cpA"
              type="number"
              min="0"
              max="100"
              step="0.1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p class="text-xs text-muted-foreground mt-1.5">预设为常见书值，请按实际检测报告修改。</p>
          </div>
        </div>

        <!-- 原料 B -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Wheat class="w-5 h-5 mr-2 text-primary" /> 原料 B（高蛋白，如豆粕）
          </h2>

          <div>
            <label for="feed-name-b" class="block text-sm font-medium text-foreground mb-1.5">名称</label>
            <input
              id="feed-name-b"
              v-model="nameB"
              type="text"
              maxlength="20"
              placeholder="如：豆粕"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">常用原料预设（粗蛋白 %）</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="preset in INGREDIENT_PRESETS"
                :key="'b-' + preset.name"
                @click="applyPresetB(preset)"
                class="px-2.5 py-1.5 rounded-lg border border-border text-xs transition"
                :class="nameB === preset.name && Number(cpB) === preset.cp ? 'bg-primary/10 border-primary/40 text-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted'"
              >{{ preset.name }} {{ preset.cp }}%</button>
            </div>
          </div>

          <div>
            <label for="feed-cp-b" class="block text-sm font-medium text-foreground mb-1.5">粗蛋白含量（%）</label>
            <input
              id="feed-cp-b"
              v-model.number="cpB"
              type="number"
              min="0"
              max="100"
              step="0.1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p class="text-xs text-muted-foreground mt-1.5">豆粕常见书值在 43-46 之间波动，以检测报告为准。</p>
          </div>
        </div>

        <!-- 目标与批量 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Scale class="w-5 h-5 mr-2 text-primary" /> 目标与配料量
          </h2>

          <div>
            <label for="feed-target" class="block text-sm font-medium text-foreground mb-1.5">目标粗蛋白 CP（%）</label>
            <input
              id="feed-target"
              v-model.number="targetCp"
              type="number"
              min="0"
              max="100"
              step="0.1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div class="flex flex-wrap gap-2 mt-2">
              <button
                v-for="t in TARGET_PRESETS"
                :key="t.value"
                @click="targetCp = t.value"
                class="px-2.5 py-1 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs text-muted-foreground transition"
              >{{ t.label }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-2">目标必须严格介于两种原料的粗蛋白之间，否则无法配平。</p>
          </div>

          <div>
            <label for="feed-batch" class="block text-sm font-medium text-foreground mb-1.5">配料总量（kg）</label>
            <input
              id="feed-batch"
              v-model.number="batchKg"
              type="number"
              min="0"
              step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p class="text-xs text-muted-foreground mt-1.5">结果按此总量折算各原料投料公斤数，默认 100 kg 便于换算。</p>
          </div>
        </div>
      </div>

      <!-- 右栏：结果 -->
      <div class="space-y-6">
        <!-- 配比结果 -->
        <div class="bg-muted/40 border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Scale class="w-5 h-5 mr-2 text-primary" /> 皮尔逊方配比结果
          </h2>

          <!-- 输入无效 / 目标超界提示 -->
          <div v-if="errorMsg" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p class="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 leading-relaxed">
              <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{{ errorMsg }}</span>
            </p>
            <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
              皮尔逊方的边界：一低一高两种原料，目标粗蛋白严格落在两者之间——目标等于或超出某一边时不需要（也无法）配平。
            </p>
          </div>

          <template v-else>
            <!-- 配比 -->
            <div class="p-4 bg-background border border-border rounded-lg">
              <p class="text-sm text-muted-foreground mb-2">混合到 {{ fmt(targetCp, 2) }}% CP，两种原料占比</p>
              <p class="text-3xl font-bold text-primary">
                {{ fmt(result.ratioB, 2) }}% <span class="text-base font-medium text-foreground">{{ nameB || '原料 B' }}</span>
              </p>
              <p class="text-lg font-semibold text-foreground mt-1">
                {{ fmt(result.ratioA, 2) }}% <span class="text-sm font-medium text-muted-foreground">{{ nameA || '原料 A' }}</span>
              </p>
              <!-- 配比条 -->
              <div class="flex h-3 rounded-full overflow-hidden border border-border mt-3">
                <div class="bg-primary" :style="{ width: result.ratioA + '%' }"></div>
                <div class="bg-muted-foreground/40" :style="{ width: result.ratioB + '%' }"></div>
              </div>
              <div class="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{{ nameA || 'A' }} {{ fmt(result.ratioA, 2) }}%</span>
                <span>{{ nameB || 'B' }} {{ fmt(result.ratioB, 2) }}%</span>
              </div>
            </div>

            <!-- 投料量 -->
            <div class="border border-border rounded-lg overflow-hidden" v-if="batchValid">
              <p class="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/60 border-b border-border">
                按 {{ fmt(batchNum, 2) }} kg 配料总量投料
              </p>
              <div class="flex justify-between items-center px-3 py-2 text-sm border-b border-border">
                <span class="text-muted-foreground">{{ nameA || '原料 A' }}</span>
                <span class="font-semibold text-foreground">{{ fmt(kgA, 2) }} kg</span>
              </div>
              <div class="flex justify-between items-center px-3 py-2 text-sm">
                <span class="text-muted-foreground">{{ nameB || '原料 B' }}</span>
                <span class="font-semibold text-foreground">{{ fmt(kgB, 2) }} kg</span>
              </div>
            </div>

            <!-- 闭环验算 -->
            <div v-if="mixedCheck !== null" class="p-4 bg-background border border-border rounded-lg">
              <p class="flex items-center gap-2 text-sm" :class="mixedCheck.pass ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'">
                <CheckCircle v-if="mixedCheck.pass" class="w-4 h-4 flex-shrink-0" />
                <TriangleAlert v-else class="w-4 h-4 flex-shrink-0" />
                <span>
                  闭环验算：按 {{ mixedCheck.pass ? '2 位小数配比' : '精确配比' }}回算混合 CP = {{ fmt(mixedCheck.value, 2) }}%（目标 {{ fmt(targetCp, 2) }}%）
                </span>
              </p>
              <p class="text-xs text-muted-foreground mt-1.5">
                验算 = 配比 × 各原料 CP 加权求和；{{ mixedCheck.pass ? '与目标一致（偏差 ≤ 0.01 来自配比保留 2 位小数）。' : '请检查输入数值。' }}
              </p>
            </div>
          </template>
        </div>

        <!-- 边界说明 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 工具边界：只做两原料配平
          </h2>
          <p class="text-sm text-muted-foreground leading-relaxed">
            皮尔逊方在数学上只适用两种原料：本页不会假装支持三种原料。要用三种原料配平，常见的可行做法是
            先把两种「角色相近」的原料按固定比例合并、算出它们混合后的加权 CP，再当成一个原料与第三种做皮尔逊方；
            或者直接用线性规划（Excel 规划求解、专业配方软件）在能量、氨基酸、成本等多约束下求解。
          </p>
          <p class="text-sm text-muted-foreground leading-relaxed">
            另外，本工具算出的是两种原料之间 100% 混合的占比（混合物 CP 即目标值）。实际全价料往往还要加预混料、
            钙磷盐等几乎不含蛋白的组分，它们会稀释混合 CP——可先按占比缩小两种原料的份额、把腾出的比例留给预混料，再复核最终 CP。
          </p>
        </div>

        <!-- 营养科普 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Wheat class="w-5 h-5 mr-2 text-primary" /> 配平之后还要知道的
          </h2>
          <div>
            <p class="text-sm font-medium text-foreground">CP ≠ 可消化蛋白</p>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              粗蛋白用凯氏定氮法测「含氮量 × 6.25」折算而来，包含动物难以利用的部分（如角质蛋白、抗营养因子结合的蛋白）。
              看配方好坏，可消化蛋白和氨基酸平衡（赖氨酸、蛋氨酸等限制性氨基酸）比笼统的 CP 更有意义；同一目标 CP 下，
              豆粕与鱼粉的饲养效果并不等价。
            </p>
          </div>
          <div>
            <p class="text-sm font-medium text-foreground">钙磷比与预混料另加</p>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              本工具只配平粗蛋白。钙、有效磷（常见钙磷比约 1.2-1.5 : 1 的口径）、食盐、维生素与微量元素由预混料承担，
              需按饲养标准另行添加；能量指标（如消化能、代谢能）本页也未涉及，能量不足时蛋白会先被「烧掉当柴火」。
              配方落地请对照饲养标准并咨询兽医或营养师。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative mb-8">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是饲料配比计算器（皮尔逊方）？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          饲料配比计算器是一款用皮尔逊方（Pearson Square，对角线法）做两原料粗蛋白配平的在线工具。
          你提供一低一高两种原料的粗蛋白（CP）含量和一个目标 CP，工具算出两种原料各占多少百分比、
          按配料总量折算各称多少公斤，并用配比回算混合后 CP 做闭环验算——混合后 CP 恰好等于目标值，
          数学上严格成立。内置玉米 8.7%、豆粕 43.5%、麦麸 15.7%、鱼粉 62.5% 等常见书值预设方便起手；
          页面同时如实说明工具边界（只适用两原料）与配套知识（CP ≠ 可消化蛋白、钙磷比与预混料另加）。
          全部计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">皮尔逊方公式与手算示例</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          高蛋白原料 B 占比 = (目标 CP − 低原料 A 的 CP) ÷ (B 的 CP − A 的 CP) × 100%；原料 A 占比 = 100% − B 占比。
        </p>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          <li>玉米 8.7%、豆粕 43%，目标 16%：豆粕占比 = (16 − 8.7) ÷ (43 − 8.7) × 100% = 7.3 ÷ 34.3 = 21.28%，玉米 78.72%</li>
          <li>同一对原料目标 18%：豆粕 = 9.3 ÷ 34.3 = 27.11%，玉米 72.89%</li>
          <li>每 100 kg 配料：目标 16% 时称豆粕 21.28 kg、玉米 78.72 kg；按其他总量等比例换算</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">使用场景</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          <li>家庭自配料：玉米 + 豆粕配到猪、鸡对应阶段的参考蛋白水平，先算后称</li>
          <li>小型养殖场：核算自购原料混合后的 CP 是否达到配方设计值，或反推豆粕用量</li>
          <li>采购比价：比较不同蛋白含量的豆粕批次需要多少用量变化，辅助决策</li>
          <li>饲料配方教学：皮尔逊方是配方课的经典入门算法，示例即算即验</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">三种原料怎么办？工具的诚实边界</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          皮尔逊方在数学上只适用两种原料，这不是实现限制而是方法本身的边界——三个未知数两条方程，解不唯一。
          常见的可行做法有两条：一是「先并后配」，把两种角色相近的原料（如玉米和小麦）按固定比例合并，
          算出加权 CP 后当作一个原料，再与第三种做皮尔逊方；二是直接用线性规划（Excel 规划求解或专业配方软件），
          在蛋白、能量、氨基酸、成本等多约束下求最优解。本工具刻意不做三原料的「假装支持」。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">CP ≠ 可消化蛋白；钙磷与预混料另加</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          粗蛋白（CP）由凯氏定氮「含氮量 × 6.25」折算，包含动物无法利用的氮，所以配平 CP 不等于配平了营养——
          可消化蛋白、氨基酸平衡（赖氨酸、蛋氨酸）才是更接近效果的指标。此外皮尔逊方只管蛋白：
          钙、有效磷（钙磷比常见约 1.2-1.5 : 1）、食盐、维生素与微量元素靠预混料另行添加，
          能量（消化能/代谢能）也需要单独核算——能量不够时蛋白会先被当能量消耗掉。配方落地请对照饲养标准并咨询专业人士。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">皮尔逊方能同时配三种原料吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不能——这是方法本身的数学边界，不是本工具实现不到位：两个方程解不出唯一的三原料配比。
              可行的替代做法：把两种相近原料按固定比例合并（算加权 CP）后再与第三种配平，或用线性规划 / 专业配方软件做多约束求解。
              本工具不做假装支持。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">目标粗蛋白设多少合适？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              按饲养阶段参考：育肥猪常见 14-16%，仔猪 18-20%，蛋鸡 16-17%，肉鸡 19-21%——具体以对应饲养标准为准，
              不同品种、季节、日粮结构都会调整。本页的快捷按钮只是常见参考值，不是饲养依据。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">预设的粗蛋白数值准不准？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              预设（玉米 8.7%、豆粕 43.5%、麦麸 15.7%、鱼粉 62.5% 等）来自常见饲料成分书值，用于快速起手；
              同名原料的 CP 因产地、等级、批次差异很大（豆粕常见在 43-46 之间波动），正式配方请以自家原料的检测报告为准，
              在输入框直接修改数值即可。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么结果里没有钙、磷、维生素和预混料？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              本工具只做粗蛋白配平。钙磷比、食盐、维生素与微量元素预混料需按饲养标准另行添加——它们几乎不含蛋白，
              加入后会稀释混合 CP，可先按占比缩小两种原料的份额、把腾出的比例留给预混料，再复核最终 CP。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">配好 CP 就等于配好了饲料吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不等于。CP 是含氮量折算，不区分可利用与否；配方还要看可消化蛋白、氨基酸平衡、能量（消化能/代谢能）、
              钙磷比与预混料。能量不足时蛋白会先被当能量消耗掉。皮尔逊方只是配方工作的第一步——蛋白骨架，不是全部。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'feed-formula-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Wheat, Scale, Info, TriangleAlert,
  ChevronUp, ChevronDown, CheckCircle
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '饲料配比计算器 - 皮尔逊方两原料蛋白配平与投料量计算 | 有条工具',
  description: '免费在线饲料配比计算器：皮尔逊方把玉米、豆粕等一低一高两种原料配平到目标粗蛋白 CP，给出配比百分比与每批投料公斤数，混合后 CP 闭环验算，内置玉米8.7/豆粕43.5/麦麸15.7/鱼粉62.5等常见书值预设，三原料边界如实说明，纯浏览器本地运行不上传',
  keywords: '饲料配比计算,皮尔逊方,玉米豆粕配比,饲料蛋白配平,粗蛋白计算,自配料计算,养殖配方',
  author: '有条工具',
  ogTitle: '饲料配比计算器 - 皮尔逊方蛋白配平在线计算 | 有条工具',
  ogDescription: '玉米豆粕配到目标粗蛋白：皮尔逊方算配比与投料公斤数，混合后 CP 闭环验算，预设为常见书值可改。',
  ogUrl: 'https://www.util.cn/tools/feed-formula-calculator',
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
          name: '饲料配比计算器',
          url: 'https://www.util.cn/tools/feed-formula-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '皮尔逊方两原料粗蛋白配平：B占比=(目标−A)÷(B−A)×100%',
            '配比百分比与按配料总量折算的投料公斤数',
            '混合后 CP 闭环验算（配比加权回算等于目标）',
            '玉米8.7/豆粕43.5/麦麸15.7/鱼粉62.5等常见书值预设',
            '目标超界提示：目标须严格介于两原料之间',
            '三原料边界诚实说明与替代做法',
            'CP≠可消化蛋白、钙磷比与预混料另加科普',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '饲料配比计算器', item: 'https://www.util.cn/tools/feed-formula-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '皮尔逊方能同时配三种原料吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能——这是方法本身的数学边界：两个方程解不出唯一的三原料配比。可行替代：把两种相近原料按固定比例合并（算加权 CP）后再与第三种配平，或用线性规划、专业配方软件做多约束求解。' }
            },
            {
              '@type': 'Question',
              name: '目标粗蛋白设多少合适？',
              acceptedAnswer: { '@type': 'Answer', text: '按饲养阶段参考：育肥猪常见 14-16%，仔猪 18-20%，蛋鸡 16-17%，肉鸡 19-21%；具体以对应饲养标准为准，不同品种、季节与日粮结构都会调整。' }
            },
            {
              '@type': 'Question',
              name: '预设的粗蛋白数值准不准？',
              acceptedAnswer: { '@type': 'Answer', text: '预设（玉米 8.7%、豆粕 43.5%、麦麸 15.7%、鱼粉 62.5% 等）来自常见饲料成分书值，用于快速起手；同名原料 CP 因产地批次差异大，正式配方请以原料检测报告为准并在输入框修改。' }
            },
            {
              '@type': 'Question',
              name: '为什么结果里没有钙、磷、维生素和预混料？',
              acceptedAnswer: { '@type': 'Answer', text: '本工具只做粗蛋白配平。钙磷比、食盐、维生素与微量元素预混料需按饲养标准另行添加；它们几乎不含蛋白，加入后会稀释混合 CP，可先缩小原料份额腾出比例，再复核最终 CP。' }
            },
            {
              '@type': 'Question',
              name: '配好 CP 就等于配好了饲料吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不等于。CP 是含氮量折算，不区分可利用与否；配方还要看可消化蛋白、氨基酸平衡、能量、钙磷比与预混料。能量不足时蛋白会先被当能量消耗掉，皮尔逊方只是蛋白骨架第一步。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 常用原料粗蛋白（CP，%）预设：常见书值，实际以原料检测报告为准
const INGREDIENT_PRESETS = [
  { name: '玉米', cp: 8.7 },
  { name: '小麦', cp: 13.9 },
  { name: '麦麸', cp: 15.7 },
  { name: '米糠', cp: 12.8 },
  { name: '豆粕', cp: 43.5 },
  { name: '菜籽粕', cp: 37.7 },
  { name: '棉籽粕', cp: 44.3 },
  { name: '花生仁粕', cp: 46.9 },
  { name: '鱼粉（进口）', cp: 62.5 }
]

// 常见饲养阶段目标 CP 参考快捷值（仅为常见参考，以饲养标准为准）
const TARGET_PRESETS = [
  { label: '育肥猪 14%', value: 14 },
  { label: '育肥猪 16%', value: 16 },
  { label: '蛋鸡 16.5%', value: 16.5 },
  { label: '仔猪 18%', value: 18 },
  { label: '肉鸡 20%', value: 20 }
]

// 皮尔逊方两原料配平：B 占比 = (目标 − A_cp) / (B_cp − A_cp) × 100%
// 要求 0 < cpA < cpB，且目标严格介于两者之间；否则返回 null（由页面给出超界提示）
function pearsonSquare(cpA, cpB, target) {
  const a = Number(cpA), b = Number(cpB), t = Number(target)
  if (![a, b, t].every(Number.isFinite)) return null
  if (a <= 0 || b <= 0 || a >= b) return null
  if (t <= a || t >= b) return null
  const ratioB = ((t - a) / (b - a)) * 100
  return { ratioA: 100 - ratioB, ratioB }
}

// 闭环验算：按配比加权回算混合后 CP（%）
function mixedCpOf(cpA, cpB, ratioA, ratioB) {
  const a = Number(cpA), b = Number(cpB)
  const ra = Number(ratioA) / 100, rb = Number(ratioB) / 100
  if (![a, b, ra, rb].every(Number.isFinite)) return null
  return ra * a + rb * b
}

// 配比换算投料量（kg）：总量 × 占比；输入非法返回 null
function kgOf(batchKg, ratioPercent) {
  const b = Number(batchKg), r = Number(ratioPercent)
  if (![b, r].every(Number.isFinite) || b <= 0 || r < 0 || r > 100) return null
  return (b * r) / 100
}

// 数字显示（非法返回 —）
function fmt(n, digits = 2) {
  return Number.isFinite(n) ? n.toFixed(digits) : '—'
}

// ---------- 页面状态与交互 ----------
const nameA = ref('玉米')
const cpA = ref(8.7)
const nameB = ref('豆粕')
const cpB = ref(43) // 默认取豆粕常见书值下限 43，与「目标 16% → 豆粕 21.28%」示例一致
const targetCp = ref(16)
const batchKg = ref(100)

const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

function applyPresetA(preset) {
  nameA.value = preset.name
  cpA.value = preset.cp
}

function applyPresetB(preset) {
  nameB.value = preset.name
  cpB.value = preset.cp
}

const batchNum = computed(() => Number(batchKg.value))
const batchValid = computed(() => Number.isFinite(batchNum.value) && batchNum.value > 0)

// 皮尔逊方结果与超界提示
const result = computed(() => pearsonSquare(cpA.value, cpB.value, targetCp.value))
const errorMsg = computed(() => {
  if (result.value) return ''
  const a = Number(cpA.value), b = Number(cpB.value), t = Number(targetCp.value)
  if (![a, b, t].every(Number.isFinite) || a <= 0 || b <= 0) return '请填写有效的粗蛋白数值（大于 0）'
  if (a >= b) return `原料 A（${fmt(Math.min(a, b), 1)}%）应为低蛋白、原料 B（${fmt(Math.max(a, b), 1)}%）应为高蛋白：皮尔逊方要求一低一高`
  return `目标 CP（${fmt(t, 1)}%）必须严格介于两种原料之间（${fmt(a, 1)}% ~ ${fmt(b, 1)}%）；等于或超出边界时无需配平`
})

// 投料量
const kgA = computed(() => (result.value && batchValid.value ? kgOf(batchNum.value, result.value.ratioA) : null))
const kgB = computed(() => (result.value && batchValid.value ? kgOf(batchNum.value, result.value.ratioB) : null))

// 闭环验算：先用 2 位小数配比回算（与展示值一致），偏差超过 0.01 再用精确配比兜底
const mixedCheck = computed(() => {
  if (!result.value) return null
  const target = Number(targetCp.value)
  const rounded = mixedCpOf(cpA.value, cpB.value, Number(result.value.ratioA.toFixed(2)), Number(result.value.ratioB.toFixed(2)))
  if (rounded === null || !Number.isFinite(target)) return null
  if (Math.abs(rounded - target) <= 0.01) return { pass: true, value: rounded }
  const exact = mixedCpOf(cpA.value, cpB.value, result.value.ratioA, result.value.ratioB)
  return { pass: false, value: exact }
})

onMounted(() => {
  addRecentTool('feed-formula-calculator')
})
</script>
