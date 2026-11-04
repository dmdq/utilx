<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Receipt class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">报价单生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">填买卖双方与多行明细，自动算折扣税额、金额转人民币大写，打印或另存 PDF 即用</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线报价单制作工具：自动生成报价单编号、报价日期与 30 天有效期，支持卖方 / 买方信息、多行商品明细（品名 / 规格型号 / 单位 / 数量 / 单价）、
        整体折扣与税率汇总，实时生成 A4 版式预览并自动换算人民币大写金额（防篡改）；一键打印或另存 PDF，草稿可保存续填。
        全部计算在浏览器本地完成，不上传任何数据，销售报价、采购询价、外包报价单都能用。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：表单 -->
      <div class="no-print bg-card border border-border rounded-lg p-6 space-y-5 h-fit">
        <h2 class="text-lg font-semibold flex items-center">
          <FileText class="w-5 h-5 mr-2 text-primary" /> 填写报价信息
        </h2>

        <!-- 单据信息 -->
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-foreground flex items-center">
            <Calendar class="w-4 h-4 mr-1.5 text-primary" /> 单据信息
          </h3>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">报价单编号</label>
            <div class="flex gap-2">
              <input
                v-model="quoteNo"
                type="text"
                class="flex-1 px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="如 QT20261029001"
              />
              <button
                @click="regenerateNo"
                class="px-3 py-2 text-xs rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition shrink-0 flex items-center gap-1"
                title="重新生成编号"
              >
                <RefreshCw class="w-3.5 h-3.5" /> 换一个
              </button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">报价日期</label>
              <input
                v-model="quoteDate"
                type="date"
                class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">报价有效期至</label>
              <input
                v-model="validUntil"
                type="date"
                class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <!-- 卖方信息 -->
        <div class="space-y-2">
          <h3 class="text-sm font-semibold text-foreground flex items-center">
            <Briefcase class="w-4 h-4 mr-1.5 text-primary" /> 卖方信息（供方）
          </h3>
          <div v-for="field in partyFields" :key="'s-' + field.key">
            <label class="block text-xs font-medium text-muted-foreground mb-1">{{ field.label }}</label>
            <input
              v-model="seller[field.key]"
              type="text"
              class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              :placeholder="field.placeholder"
            />
          </div>
        </div>

        <!-- 买方信息 -->
        <div class="space-y-2">
          <h3 class="text-sm font-semibold text-foreground flex items-center">
            <Briefcase class="w-4 h-4 mr-1.5 text-primary" /> 买方信息（需方）
          </h3>
          <div v-for="field in partyFields" :key="'b-' + field.key">
            <label class="block text-xs font-medium text-muted-foreground mb-1">{{ field.label }}</label>
            <input
              v-model="buyer[field.key]"
              type="text"
              class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              :placeholder="field.placeholder"
            />
          </div>
        </div>

        <!-- 行项目明细 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-foreground flex items-center">
              <Receipt class="w-4 h-4 mr-1.5 text-primary" /> 行项目明细
            </h3>
            <button
              @click="clearItems"
              class="text-xs text-muted-foreground hover:text-red-500 transition flex items-center gap-1"
            >
              <X class="w-3.5 h-3.5" /> 清空全部
            </button>
          </div>
          <div class="overflow-x-auto">
            <div class="min-w-[540px] space-y-1.5">
              <div class="grid grid-cols-[2fr_2fr_48px_58px_72px_80px_28px] gap-1.5 text-[10px] text-muted-foreground px-0.5">
                <span>品名</span>
                <span>规格型号</span>
                <span>单位</span>
                <span>数量</span>
                <span class="text-right">单价（元）</span>
                <span class="text-right">金额（元）</span>
                <span></span>
              </div>
              <div
                v-for="item in items"
                :key="item.id"
                class="grid grid-cols-[2fr_2fr_48px_58px_72px_80px_28px] gap-1.5 items-center"
              >
                <input
                  v-model="item.name"
                  type="text"
                  class="px-2 py-1.5 bg-background border border-border border-input rounded-md text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="如 工业风机"
                />
                <input
                  v-model="item.spec"
                  type="text"
                  class="px-2 py-1.5 bg-background border border-border border-input rounded-md text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="如 HT-200"
                />
                <input
                  v-model="item.unit"
                  type="text"
                  class="px-2 py-1.5 bg-background border border-border border-input rounded-md text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="台"
                />
                <input
                  v-model="item.qty"
                  type="number"
                  min="0"
                  step="1"
                  class="px-2 py-1.5 bg-background border border-border border-input rounded-md text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  :class="qtyInputClass(item.qty)"
                  placeholder="1"
                />
                <input
                  v-model="item.price"
                  type="number"
                  min="0"
                  step="0.01"
                  class="px-2 py-1.5 bg-background border border-border border-input rounded-md text-foreground text-xs text-right focus:outline-none focus:ring-2 focus:ring-ring"
                  :class="priceInputClass(item.price)"
                  placeholder="0.00"
                />
                <span class="text-xs text-right font-mono text-foreground">{{ lineAmountText(item) }}</span>
                <button
                  @click="removeItem(item.id)"
                  class="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition"
                  title="删除此行"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
          <button
            @click="addItem"
            class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <Plus class="w-4 h-4" /> 添加一行
          </button>
          <p v-if="itemsEmpty" class="text-xs text-amber-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>行项目为空：打印或导出前请至少填写一行明细（数量须为正数、单价不能为负）。</span>
          </p>
        </div>

        <!-- 汇总参数 -->
        <div class="space-y-2">
          <h3 class="text-sm font-semibold text-foreground">汇总参数</h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1">整体折扣金额（元）</label>
              <input
                v-model="discount"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                :class="discountIsValid(discount) ? '' : 'border-red-500 focus:ring-red-500/40'"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1">税率（%，0-13）</label>
              <input
                v-model="taxRate"
                type="number"
                min="0"
                max="13"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                :class="taxRateIsValid(taxRate) ? '' : 'border-red-500 focus:ring-red-500/40'"
              />
            </div>
          </div>
          <p v-if="discountOverSubtotal" class="text-xs text-red-500 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>折扣金额大于小计，合计将为负数，人民币大写会无法生成。</span>
          </p>
        </div>

        <!-- 备注条款 -->
        <div class="space-y-2">
          <h3 class="text-sm font-semibold text-foreground">备注条款</h3>
          <textarea
            v-model="terms"
            rows="6"
            class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
          ></textarea>
        </div>

        <!-- 汇总速览 -->
        <div class="bg-primary/10 rounded-lg p-3 space-y-1.5">
          <p class="flex justify-between text-sm">
            <span class="text-muted-foreground">小计 / 折后 / 税额</span>
            <span class="font-mono text-foreground">{{ quoteTotals.subtotal }} / {{ quoteTotals.discounted }} / {{ quoteTotals.tax }}</span>
          </p>
          <p class="flex justify-between text-sm">
            <span class="text-muted-foreground">含税总计</span>
            <span class="font-bold text-primary font-mono">￥{{ quoteTotals.grandTotal }}</span>
          </p>
          <p class="flex justify-between text-xs" :class="upperTotalInvalid ? 'text-red-500' : ''">
            <span class="text-muted-foreground">大写</span>
            <span class="font-bold tracking-wider">{{ upperTotalInvalid ? '金额异常' : upperTotal }}</span>
          </p>
        </div>

        <!-- 草稿操作 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="saveDraft"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <FileText class="w-4 h-4" /> 保存草稿
          </button>
          <button
            @click="restoreDraft"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw class="w-4 h-4" /> 恢复草稿
          </button>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
          <CheckCircle class="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
          <span>数据仅保存在当前浏览器本地，不上传服务器；草稿会记录卖方信息、行项目与条款，方便下次续填。</span>
        </p>
      </div>

      <!-- 右：报价单预览 -->
      <div class="print-area lg:col-span-2">
        <div class="no-print flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 报价单预览（A4）
          </h2>
          <div class="flex flex-wrap gap-2">
            <button
              @click="printQuote"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5"
            >
              <Printer class="w-4 h-4" /> 打印 / 另存 PDF
            </button>
            <button
              @click="copyPlainText"
              class="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center gap-1.5"
            >
              <Copy class="w-4 h-4" /> 复制文本版
            </button>
          </div>
        </div>

        <!-- A4 纸样式卡片（794px ≈ A4 @96dpi） -->
        <div
          class="a4-card bg-white text-black border border-gray-400 rounded-lg shadow-sm mx-auto w-full max-w-[794px]"
          style="font-family: 'SimSun', 'Songti SC', serif;"
        >
          <div class="p-6 md:p-10 text-[13px] leading-relaxed">
            <!-- 抬头 -->
            <div class="text-center mb-2">
              <p class="text-2xl font-bold">{{ seller.company || '（公司名称）' }}</p>
            </div>
            <p class="text-center text-3xl font-bold tracking-[0.8em] mb-5">报价单</p>

            <!-- 编号 / 日期 / 有效期 -->
            <div class="grid grid-cols-3 gap-2 mb-4 text-[12px]">
              <p>编号：{{ quoteNo || '—' }}</p>
              <p class="text-center">报价日期：{{ quoteDate || '____年__月__日' }}</p>
              <p class="text-right">有效期至：{{ validUntil || '____年__月__日' }}</p>
            </div>

            <!-- 卖方 / 买方 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 mb-4 text-[12px]">
              <div class="space-y-0.5">
                <p class="font-bold">供 方（卖方）</p>
                <p>公司名称：{{ seller.company || '—' }}</p>
                <p>联 系 人：{{ seller.contact || '—' }}</p>
                <p>电　　话：{{ seller.phone || '—' }}</p>
                <p>邮　　箱：{{ seller.email || '—' }}</p>
                <p>地　　址：{{ seller.address || '—' }}</p>
              </div>
              <div class="space-y-0.5">
                <p class="font-bold">需 方（买方）</p>
                <p>公司名称：{{ buyer.company || '—' }}</p>
                <p>联 系 人：{{ buyer.contact || '—' }}</p>
                <p>电　　话：{{ buyer.phone || '—' }}</p>
                <p>邮　　箱：{{ buyer.email || '—' }}</p>
                <p>地　　址：{{ buyer.address || '—' }}</p>
              </div>
            </div>

            <!-- 明细表 -->
            <table class="w-full border-collapse text-[12px] mb-3">
              <thead>
                <tr class="bg-gray-100">
                  <th class="border border-gray-400 px-1.5 py-1 w-10">序号</th>
                  <th class="border border-gray-400 px-1.5 py-1 text-left">品名</th>
                  <th class="border border-gray-400 px-1.5 py-1 text-left">规格型号</th>
                  <th class="border border-gray-400 px-1.5 py-1 w-12">单位</th>
                  <th class="border border-gray-400 px-1.5 py-1 w-16 text-right">数量</th>
                  <th class="border border-gray-400 px-1.5 py-1 w-20 text-right">单价（元）</th>
                  <th class="border border-gray-400 px-1.5 py-1 w-24 text-right">金额（元）</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="previewRows.length">
                  <tr v-for="(row, i) in previewRows" :key="i">
                    <td class="border border-gray-400 px-1.5 py-1 text-center">{{ i + 1 }}</td>
                    <td class="border border-gray-400 px-1.5 py-1">{{ row.name }}</td>
                    <td class="border border-gray-400 px-1.5 py-1">{{ row.spec || '—' }}</td>
                    <td class="border border-gray-400 px-1.5 py-1 text-center">{{ row.unit || '—' }}</td>
                    <td class="border border-gray-400 px-1.5 py-1 text-right">{{ row.qtyText }}</td>
                    <td class="border border-gray-400 px-1.5 py-1 text-right">{{ row.priceText }}</td>
                    <td class="border border-gray-400 px-1.5 py-1 text-right">{{ row.amountText }}</td>
                  </tr>
                </template>
                <tr v-else>
                  <td colspan="7" class="border border-gray-400 px-1.5 py-2 text-center text-gray-500">（请在左侧填写商品明细）</td>
                </tr>
              </tbody>
            </table>

            <!-- 大写异常提示 -->
            <p v-if="upperTotalInvalid" class="mb-3 flex items-start gap-1.5 text-[12px] text-red-600">
              <TriangleAlert class="w-4 h-4 shrink-0 mt-0.5" />
              <span>合计金额为负数或超出大写支持范围（0 ~ 9,999,999,999.99 元），请检查折扣金额与行项目后再打印。</span>
            </p>

            <!-- 汇总（右对齐） -->
            <div class="flex justify-end mb-4">
              <div class="w-72 space-y-0.5 text-[12px]">
                <p class="flex justify-between"><span>小计</span><span>￥{{ quoteTotals.subtotal }}</span></p>
                <p class="flex justify-between"><span>折扣</span><span>-￥{{ discountText }}</span></p>
                <p class="flex justify-between"><span>折后小计</span><span>￥{{ quoteTotals.discounted }}</span></p>
                <p class="flex justify-between"><span>税额（{{ taxRateShown }}%）</span><span>￥{{ quoteTotals.tax }}</span></p>
                <p class="flex justify-between" :class="upperTotalInvalid ? 'text-red-600' : ''">
                  <span>合计人民币（大写）</span>
                  <span class="text-right">{{ upperTotalInvalid ? '（金额异常）' : upperTotal }}</span>
                </p>
                <p class="flex justify-between font-bold border-t border-gray-400 pt-1 text-[13px]">
                  <span>含税总计</span><span>￥{{ quoteTotals.grandTotal }}</span>
                </p>
              </div>
            </div>

            <!-- 备注条款 -->
            <div v-if="terms && terms.trim()" class="mb-6 text-[12px]">
              <p class="font-bold mb-0.5">备注条款：</p>
              <p class="whitespace-pre-line leading-relaxed">{{ terms }}</p>
            </div>

            <!-- 双方签字栏 -->
            <div class="grid grid-cols-2 gap-8 text-[12px] mt-10">
              <div>
                <p>卖方（签字/盖章）：＿＿＿＿＿＿＿＿</p>
                <p class="mt-5">日　　　　期：＿＿＿＿＿＿＿＿</p>
              </div>
              <div>
                <p>买方（签字/盖章）：＿＿＿＿＿＿＿＿</p>
                <p class="mt-5">日　　　　期：＿＿＿＿＿＿＿＿</p>
              </div>
            </div>
          </div>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印时仅输出报价单本身（隐藏表单与页面其余部分）；金额按「分」为单位取整后汇总，大写金额自动生成，大小写不一致时以大写为准。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>报价单生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          报价单生成器是一款在线商务单据制作工具。填写卖方与买方信息、多行商品明细（品名、规格型号、单位、数量、单价）以及整体折扣与税率，
          页面实时汇总小计、折后小计、税额与含税总计，并自动生成人民币大写金额；预览区按 A4 纸版式排版，包含抬头、编号 / 日期 / 有效期、
          双方信息、明细表、汇总、备注条款与双方签字栏。点击打印即可输出纸质报价单或在打印对话框中选择「另存为 PDF」发送客户，
          也可以一键复制纯文本版用于微信、邮件等场景。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">报价单怎么写才规范</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          一份规范的报价单通常包含：公司抬头与「报价单」标题、唯一编号（便于双方对单与存档）、报价日期与报价有效期、
          卖方 / 买方双方的完整联系方式、逐项列明的商品明细（品名、规格型号、单位、数量、单价、金额）、
          汇总区（小计、折扣、税额、含税总计）、备注条款（有效期、付款方式、交货周期、运费归属、质保等）以及双方签字盖章栏。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed">
          金额建议同时给出小写与大写：大写数字（壹贰叁肆伍陆柒捌玖拾佰仟万亿）难以涂改，是财务单据防篡改的通行做法，
          规则上整数金额以「整」收尾（如 100 元写作「壹佰元整」），中间有零只写一个零（1005.50 元写作「壹仟零伍元伍角」），
          大小写不一致时以大写为准。本工具会按上述规范自动生成大写，无需手写。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">报价单与合同、发票的区别</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          报价单是卖方对外报出价格与交易条件的商业文件，本身一般不具有合同效力，主要用来询比价与确认意向；
          合同（或订单 / 销售确认书）是双方签署后产生法律约束力的文件，成交后通常由报价单内容转化为合同条款；
          发票则是税务机关监制的收付款与税务凭证，发生在实际开票环节。三者的常见流转顺序是：报价单 → 合同 / 订单 → 发票。
          因此报价单上写清有效期与条款，既方便客户决策，也能减少后续签约时的分歧。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">本工具数据保存在哪</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          所有填写内容与计算全部在你的浏览器本地完成，不向服务器上传任何数据。点「保存草稿」时，卖方信息、行项目与备注条款
          会写入当前浏览器的 localStorage（键名以 quotation-generator 开头），下次打开页面点「恢复草稿」即可续填；
          清除浏览器站点数据即可彻底删除草稿。换设备或使用无痕模式时草稿不会跟随，涉及商业报价的敏感信息建议打印 / 存 PDF 后及时清理。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">打印或另存 PDF 时只输出报价单本身吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">是的。打印样式会自动隐藏左侧表单、按钮与说明区，仅输出 A4 版式的报价单（含双方信息、明细表、汇总与签字栏）。在浏览器打印对话框中选择「另存为 PDF」即可存档或直接发给客户。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">税额和含税总计是怎么计算的？</h3>
            <p class="text-sm text-muted-foreground mt-1">先汇总所有行项目金额（数量 × 单价）得到小计，减去整体折扣得到折后小计，再乘以税率（支持 0–13%）得到税额，折后小计加税额即含税总计。全程以「分」为单位取整，避免浮点误差，结果统一保留两位小数。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">人民币大写支持多大金额？出错会怎样？</h3>
            <p class="text-sm text-muted-foreground mt-1">支持 0 ~ 9,999,999,999.99 元。若折扣大于小计导致合计为负，或金额超出支持范围，大写一栏会留空并以红字提示，请先修正折扣金额或行项目再打印；数量必须为正数、单价不能为负，非法输入会以红框标出。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'quotation-generator'" :category="'finance'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileText, Receipt, Plus, X, Printer, Copy, RefreshCw,
  ChevronUp, ChevronDown, TriangleAlert, CheckCircle, Calendar, Briefcase
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '报价单生成器 - 在线报价单模板制作、打印与PDF导出',
  description: '免费在线报价单生成器：自动生成报价单编号与有效期，填写买卖双方信息与多行商品明细，自动计算小计、折扣、税额与含税总计，金额自动转人民币大写，A4 版式打印或另存 PDF，支持本地草稿，纯浏览器运行不上传',
  keywords: '报价单模板,报价单生成器,报价单怎么写,报价单格式,销售报价单,报价单打印,人民币大写转换,报价单制作',
  author: '有条工具',
  ogTitle: '报价单生成器 - 在线报价单模板制作、打印与PDF导出 | 有条工具',
  ogDescription: '填买卖双方与多行明细自动生成规范报价单，折扣税额自动汇总、金额转人民币大写，打印或另存 PDF 即用。',
  ogUrl: 'https://www.util.cn/tools/quotation-generator',
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
          name: '报价单生成器',
          url: 'https://www.util.cn/tools/quotation-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['报价单编号自动生成', '买卖双方信息填写', '多行项目明细与金额自动计算', '折扣与税率汇总计算', '人民币大写金额自动转换', '浏览器打印 / 另存 PDF', '草稿本地保存与恢复']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '报价单生成器', item: 'https://www.util.cn/tools/quotation-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '打印或另存 PDF 时只输出报价单本身吗？',
              acceptedAnswer: { '@type': 'Answer', text: '是的。打印样式会自动隐藏左侧表单、按钮与说明区，仅输出 A4 版式的报价单（含双方信息、明细表、汇总与签字栏）。在浏览器打印对话框中选择「另存为 PDF」即可存档或直接发给客户。' }
            },
            {
              '@type': 'Question',
              name: '税额和含税总计是怎么计算的？',
              acceptedAnswer: { '@type': 'Answer', text: '先汇总所有行项目金额（数量×单价）得到小计，减去整体折扣得到折后小计，再乘以税率（支持 0–13%）得到税额，折后小计加税额即含税总计。全程以「分」为单位取整，避免浮点误差，结果统一保留两位小数。' }
            },
            {
              '@type': 'Question',
              name: '人民币大写支持多大金额？出错会怎样？',
              acceptedAnswer: { '@type': 'Answer', text: '支持 0 ~ 9,999,999,999.99 元。若折扣大于小计导致合计为负，或金额超出支持范围，大写一栏会留空并以红字提示，请先修正折扣金额或行项目再打印；数量必须为正数、单价不能为负，非法输入会以红框标出。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const RMB_MAX = 9999999999.99        // 人民币大写支持上限
const CN_DIGITS = '零壹贰叁肆伍陆柒捌玖'
const CN_POSITIONS = ['', '拾', '佰', '仟']
const CN_GROUPS = ['', '万', '亿']

// 整数部分转中文大写（1~9999999999）：连续零只写一个零，含万 / 亿分组
function intToRmbCn(n) {
  if (n <= 0) return ''
  const s = String(n)
  const len = s.length
  let result = ''
  let zeroSeen = false
  for (let i = 0; i < len; i++) {
    const d = Number(s[i])
    const pos = len - 1 - i
    if (d === 0) {
      zeroSeen = true
    } else {
      if (zeroSeen && result !== '') result += '零'
      result += CN_DIGITS[d] + CN_POSITIONS[pos % 4]
      zeroSeen = false
    }
    if (pos % 4 === 0) {
      const g = CN_GROUPS[pos / 4]
      const groupVal = Math.floor(n / Math.pow(10, pos)) % 10000
      if (g && groupVal > 0) result += g
    }
  }
  return result
}

// 金额转人民币大写；负数 / 超出 0~9999999999.99 / 非数字返回空串（由 UI 红字提示）
function rmbUpper(amount) {
  const num = Number(amount)
  if (!isFinite(num) || num < 0 || num > RMB_MAX) return ''
  const fenTotal = Math.round(num * 100)
  if (fenTotal === 0) return '零元整'
  const yuan = Math.floor(fenTotal / 100)
  const jiao = Math.floor(fenTotal / 10) % 10
  const fen = fenTotal % 10
  let out = yuan > 0 ? intToRmbCn(yuan) + '元' : '零元'
  if (jiao === 0 && fen === 0) {
    out += '整'
  } else {
    if (jiao === 0) out += '零' // 元下无角只有分：先补零（10.05 → 壹拾元零伍分）
    if (jiao > 0) out += CN_DIGITS[jiao] + '角'
    if (fen > 0) out += CN_DIGITS[fen] + '分'
  }
  return out
}

// 报价单编号：QT + YYYYMMDD + 3 位随机数字
function genQuoteNo(now = new Date()) {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `QT${y}${m}${d}${rand}`
}

// 基准日期起 n 天后的 YYYY-MM-DD（n=0 即今天）
function daysFromNow(n, base = new Date()) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  d.setDate(d.getDate() + (Number(n) || 0))
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dd}`
}

// 行金额 = 数量 × 单价，按分取整；数量 ≤ 0 / 非法 / 单价为负按 0 处理
function lineAmount(qty, price) {
  const q = Number(qty)
  const p = Number(price)
  if (!isFinite(q) || !isFinite(p) || q <= 0 || p < 0) return 0
  return Math.round(q * p * 100) / 100
}

// 数量校验：留空视为未填（合法），填写后必须为正数
function qtyIsValid(v) {
  if (v === '' || v === null || v === undefined) return true
  const n = Number(v)
  return isFinite(n) && n > 0
}

// 单价校验：留空视为未填（合法），填写后必须 ≥ 0
function priceIsValid(v) {
  if (v === '' || v === null || v === undefined) return true
  const n = Number(v)
  return isFinite(n) && n >= 0
}

// 折扣金额校验：留空合法，填写后必须 ≥ 0
function discountIsValid(v) {
  if (v === '' || v === null || v === undefined) return true
  const n = Number(v)
  return isFinite(n) && n >= 0
}

// 税率校验：留空合法，填写后必须在 0~13 之间
function taxRateIsValid(v) {
  if (v === '' || v === null || v === undefined) return true
  const n = Number(v)
  return isFinite(n) && n >= 0 && n <= 13
}

// 一行是否填写过任一内容
function isItemFilled(item) {
  if (!item) return false
  return (
    String(item.name || '').trim() !== '' ||
    String(item.spec || '').trim() !== '' ||
    String(item.unit || '').trim() !== '' ||
    String(item.qty || '').trim() !== '' ||
    String(item.price || '').trim() !== ''
  )
}

// 是否至少存在一行已填写的明细
function hasAnyItem(items) {
  return (items || []).some(isItemFilled)
}

// 汇总：小计 → 减折扣 → 乘税率 → 总计；全程按分取整，输出 toFixed(2) 字符串
function totals(items, discount, taxRate) {
  const rawSub = (items || []).reduce((s, it) => s + lineAmount(it.qty, it.price), 0)
  const subtotal = Math.round(rawSub * 100) / 100
  const disc = Math.max(0, Math.round((Number(discount) || 0) * 100) / 100)
  const discounted = Math.round((subtotal - disc) * 100) / 100
  const rate = Math.min(Math.max(Number(taxRate) || 0, 0), 13)
  const tax = Math.round(discounted * rate) / 100
  const grandTotal = Math.round((discounted + tax) * 100) / 100
  return {
    subtotal: subtotal.toFixed(2),
    discounted: discounted.toFixed(2),
    tax: tax.toFixed(2),
    grandTotal: grandTotal.toFixed(2)
  }
}

// 数量展示文本（非法 / 未填显示 —）
function formatQty(v) {
  if (v === '' || v === null || v === undefined) return '—'
  const n = Number(v)
  return isFinite(n) ? String(n) : '—'
}

// 金额展示文本（两位小数）
function formatMoney(v) {
  const n = Number(v)
  if (v === '' || v === null || v === undefined || !isFinite(n)) return '0.00'
  return n.toFixed(2)
}

// 联系方信息拼成一行（跳过空字段）
function partyLine(p) {
  if (!p) return '—'
  const parts = [
    p.company && `公司：${p.company}`,
    p.contact && `联系人：${p.contact}`,
    p.phone && `电话：${p.phone}`,
    p.email && `邮箱：${p.email}`,
    p.address && `地址：${p.address}`
  ].filter(Boolean)
  return parts.length ? parts.join('，') : '—'
}

// 可读纯文本版报价单（复制用）
function buildPlainTextQuote(d) {
  const lines = []
  lines.push('报 价 单')
  lines.push(`编号：${d.quoteNo || '—'}`)
  lines.push(`报价日期：${d.quoteDate || '—'}    有效期至：${d.validUntil || '—'}`)
  lines.push('')
  lines.push('【卖方】')
  lines.push(partyLine(d.seller))
  lines.push('【买方】')
  lines.push(partyLine(d.buyer))
  lines.push('')
  lines.push('【明细】')
  if (d.rows && d.rows.length) {
    d.rows.forEach((r, i) => {
      lines.push(`${i + 1}. ${r.name}｜规格：${r.spec || '—'}｜单位：${r.unit || '—'}｜数量：${r.qtyText}｜单价：${r.priceText} 元｜金额：${r.amountText} 元`)
    })
  } else {
    lines.push('（未填写明细）')
  }
  lines.push('')
  lines.push('【汇总】')
  lines.push(`小计：￥${d.totals.subtotal}`)
  lines.push(`折扣：￥${d.discount}`)
  lines.push(`折后小计：￥${d.totals.discounted}`)
  lines.push(`税额（${d.taxRate}%）：￥${d.totals.tax}`)
  lines.push(`合计人民币（大写）：${d.upper || '（金额异常）'}`)
  lines.push(`含税总计：￥${d.totals.grandTotal}`)
  if (d.terms && d.terms.trim()) {
    lines.push('')
    lines.push('【备注条款】')
    lines.push(d.terms.trim())
  }
  lines.push('')
  lines.push('卖方（签字/盖章）：____________    日期：____________')
  lines.push('买方（签字/盖章）：____________    日期：____________')
  return lines.join('\n')
}

// ---------- 页面状态 ----------
const DEFAULT_TERMS = '1. 本报价有效期为 30 天；\n2. 以上价格为含税价（税率见汇总）；\n3. 交货周期：收到预付款后 15 个工作日内；\n4. 运费另议。'
const DRAFT_KEY = 'quotation-generator:draft'

const partyFields = [
  { key: 'company', label: '公司名称', placeholder: '如 XX科技有限公司' },
  { key: 'contact', label: '联系人', placeholder: '如 张三' },
  { key: 'phone', label: '电话', placeholder: '如 138-0000-0000' },
  { key: 'email', label: '邮箱', placeholder: '如 sales@company.com' },
  { key: 'address', label: '地址', placeholder: '省 / 市 / 区 + 详细地址' }
]

const quoteNo = ref('')
const quoteDate = ref('')
const validUntil = ref('')
const seller = ref({ company: '', contact: '', phone: '', email: '', address: '' })
const buyer = ref({ company: '', contact: '', phone: '', email: '', address: '' })
let itemSeq = 0
const emptyItem = () => ({ id: ++itemSeq, name: '', spec: '', unit: '', qty: '', price: '' })
const items = ref([emptyItem(), emptyItem(), emptyItem()])
const discount = ref('0')
const taxRate = ref('0')
const terms = ref(DEFAULT_TERMS)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 计算属性 ----------
const quoteTotals = computed(() => totals(items.value, discount.value, taxRate.value))
const upperTotal = computed(() => rmbUpper(Number(quoteTotals.value.grandTotal)))
const upperTotalInvalid = computed(() => upperTotal.value === '')
const itemsEmpty = computed(() => !hasAnyItem(items.value))
const discountText = computed(() => formatMoney(Math.max(0, Number(discount.value) || 0)))
const taxRateShown = computed(() => Math.min(Math.max(Number(taxRate.value) || 0, 0), 13))
const discountOverSubtotal = computed(() => discountIsValid(discount.value) && Number(discount.value || 0) > Number(quoteTotals.value.subtotal))

// 预览明细：只展示已填写的行
const previewRows = computed(() =>
  items.value.filter(isItemFilled).map((it) => ({
    name: String(it.name || '').trim(),
    spec: String(it.spec || '').trim(),
    unit: String(it.unit || '').trim(),
    qtyText: formatQty(it.qty),
    priceText: formatMoney(it.price),
    amountText: lineAmount(it.qty, it.price).toFixed(2)
  }))
)

// ---------- 行操作 ----------
const addItem = () => { items.value.push(emptyItem()) }
const removeItem = (id) => {
  if (items.value.length <= 1) {
    items.value = [emptyItem()] // 至少保留 1 行
    return
  }
  items.value = items.value.filter((it) => it.id !== id)
}
const clearItems = () => { items.value = [emptyItem()] }
const regenerateNo = () => { quoteNo.value = genQuoteNo() }

// 输入红框样式（非法输入时标红）
const qtyInputClass = (v) => (qtyIsValid(v) ? '' : 'border-red-500 focus:ring-red-500/40')
const priceInputClass = (v) => (priceIsValid(v) ? '' : 'border-red-500 focus:ring-red-500/40')
const lineAmountText = (item) => lineAmount(item.qty, item.price).toFixed(2)

// ---------- 打印 / 复制 ----------
const printQuote = () => {
  if (itemsEmpty.value) {
    alert('行项目为空：请至少填写一行明细（品名 / 数量 / 单价）后再打印或另存 PDF')
    return
  }
  window.print()
}

const copyPlainText = async () => {
  const text = buildPlainTextQuote({
    quoteNo: quoteNo.value,
    quoteDate: quoteDate.value,
    validUntil: validUntil.value,
    seller: seller.value,
    buyer: buyer.value,
    rows: previewRows.value,
    totals: quoteTotals.value,
    upper: upperTotal.value,
    discount: discountText.value,
    taxRate: taxRateShown.value,
    terms: terms.value
  })
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
  } catch (e) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      alert(ok ? '已复制' : '复制失败，请手动选择预览内容复制')
    } catch (e2) {
      alert('复制失败，请手动选择预览内容复制')
    }
  }
}

// ---------- 草稿（localStorage 只在 onMounted 读取一次） ----------
let savedDraft = null

const saveDraft = () => {
  try {
    const payload = {
      savedAt: new Date().toISOString(),
      seller: { ...seller.value },
      items: items.value.map((it) => ({ name: it.name, spec: it.spec, unit: it.unit, qty: it.qty, price: it.price })),
      terms: terms.value
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
    savedDraft = payload
    alert('草稿已保存（卖方信息、行项目与条款）')
  } catch (e) {
    alert('草稿保存失败：浏览器本地存储不可用')
  }
}

const applyDraft = (d) => {
  if (!d || typeof d !== 'object') return
  if (d.seller && typeof d.seller === 'object') {
    seller.value = { company: '', contact: '', phone: '', email: '', address: '', ...d.seller }
  }
  if (Array.isArray(d.items) && d.items.length) {
    items.value = d.items.map((it) => ({
      id: ++itemSeq,
      name: '', spec: '', unit: '', qty: '', price: '',
      ...(it && typeof it === 'object' ? it : {})
    }))
  }
  if (typeof d.terms === 'string') terms.value = d.terms
}

const restoreDraft = () => {
  if (!savedDraft) {
    alert('暂无已保存的草稿')
    return
  }
  applyDraft(savedDraft)
  alert('已恢复草稿')
}

onMounted(() => {
  addRecentTool('quotation-generator')

  // 读取草稿（仅此处读 localStorage）
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') savedDraft = parsed
    }
  } catch (e) {
    savedDraft = null
  }

  // 默认单据信息
  if (!quoteNo.value) quoteNo.value = genQuoteNo()
  if (!quoteDate.value) quoteDate.value = daysFromNow(0)
  if (!validUntil.value) validUntil.value = daysFromNow(30)
})
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
  body {
    background: #fff !important;
  }
  .print-area {
    box-shadow: none;
  }
  .a4-card {
    border: none !important;
    box-shadow: none !important;
    max-width: 100% !important;
  }
}
</style>
