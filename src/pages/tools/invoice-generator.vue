<template>
  <div class="max-w-8xl mx-auto">
    <!-- ⚠️ 合规提示横幅（必须显眼） -->
    <div class="no-print mb-6 rounded-lg border border-yellow-500/50 bg-yellow-100 dark:bg-yellow-500/10 p-4 flex items-start gap-3" role="alert">
      <TriangleAlert class="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
      <p class="text-sm leading-relaxed text-yellow-800 dark:text-yellow-400">
        <span class="font-bold">重要提示：</span>
        本工具生成的是外贸商业/形式发票（Commercial / Proforma Invoice），<span class="font-bold underline decoration-yellow-600/60 underline-offset-2">不是中国增值税发票</span>，不能用于增值税抵扣；报关退税单证请以报关行/货代要求为准。
      </p>
    </div>

    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ReceiptText class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">商业发票生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">外贸 Commercial / Proforma Invoice 在线制作，金额自动转英文大写，打印或另存 PDF</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        填写出口方、进口方、多行货描与单价，自动计算小计、折扣、税费与总计，并把总金额转换为英文大写（SAY TOTAL IN WORDS），
        支持 USD / EUR / CNY / GBP / JPY / HKD 六种常用币种与 EXW / FOB / CIF 等贸易术语。填写内容自动保存为本机草稿，
        一键打印或另存 PDF，也可复制纯文本版粘贴到邮件。全部数据只在你的浏览器本地处理，不上传任何服务器。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：表单 -->
      <div class="no-print bg-card border border-border rounded-lg p-6 space-y-6 h-fit">
        <!-- 发票基本信息 -->
        <section class="space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Calendar class="w-5 h-5 mr-2 text-primary" /> 发票信息 Invoice Info
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">发票号码 Invoice No.</label>
              <div class="flex gap-2">
                <input
                  v-model="form.invoiceNo"
                  type="text"
                  :class="inputBase"
                  placeholder="如 INV20261029001"
                />
                <button
                  @click="form.invoiceNo = genInvoiceNo()"
                  class="px-3 py-2 text-xs rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition shrink-0"
                  title="按 INV+日期+3位随机 重新生成"
                >
                  换号
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">币种 Currency</label>
              <select v-model="form.currency" :class="inputBase">
                <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">{{ c.code }}（{{ c.symbol }}）</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">发票日期 Invoice Date</label>
              <input v-model="form.date" type="date" :class="inputBase" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">付款到期日 Due Date</label>
              <input v-model="form.dueDate" type="date" :class="inputBase" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-foreground mb-2">客户订单号 P.O. No.（选填）</label>
              <input v-model="form.poNo" type="text" :class="inputBase" placeholder="买方采购订单号，没有可留空" />
            </div>
          </div>
        </section>

        <!-- 出口方 / 进口方 -->
        <section class="space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Globe class="w-5 h-5 mr-2 text-primary" /> 交易双方 From / To
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <p class="text-xs font-semibold text-primary tracking-wide">出口方 FROM / SELLER</p>
              <input v-model="form.from.company" type="text" :class="inputBase" placeholder="公司名称 Company" />
              <input v-model="form.from.address" type="text" :class="inputBase" placeholder="地址 Address" />
              <input v-model="form.from.tel" type="text" :class="inputBase" placeholder="电话 Tel" />
              <input v-model="form.from.email" type="text" :class="inputBase" placeholder="邮箱 Email" />
            </div>
            <div class="space-y-2">
              <p class="text-xs font-semibold text-primary tracking-wide">进口方 TO / BUYER</p>
              <input v-model="form.to.company" type="text" :class="inputBase" placeholder="公司名称 Company" />
              <input v-model="form.to.address" type="text" :class="inputBase" placeholder="地址 Address" />
              <input v-model="form.to.tel" type="text" :class="inputBase" placeholder="电话 Tel" />
              <input v-model="form.to.email" type="text" :class="inputBase" placeholder="邮箱 Email" />
            </div>
          </div>
        </section>

        <!-- 行项目 -->
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <ReceiptText class="w-5 h-5 mr-2 text-primary" /> 行项目 Items
            </h2>
            <button
              @click="addItem"
              class="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition flex items-center gap-1"
            >
              <Plus class="w-3.5 h-3.5" /> 添加一行 Add Item
            </button>
          </div>
          <div class="overflow-x-auto">
            <div class="min-w-[620px] space-y-2">
              <div class="grid grid-cols-[minmax(0,1fr)_4.5rem_4rem_5.5rem_5.5rem_2.5rem] gap-2 px-1 text-[11px] text-muted-foreground">
                <span>货描 Description</span>
                <span>数量 Qty</span>
                <span>单位 Unit</span>
                <span class="text-right">单价 Unit Price</span>
                <span class="text-right">金额 Amount</span>
                <span></span>
              </div>
              <div
                v-for="(item, idx) in form.items"
                :key="item.id"
                class="grid grid-cols-[minmax(0,1fr)_4.5rem_4rem_5.5rem_5.5rem_2.5rem] gap-2 items-center"
              >
                <input
                  v-model="item.description"
                  type="text"
                  :class="inputBase"
                  :placeholder="idx === 0 ? '如 Ceramic Mug 咖啡杯' : '货品名称与规格'"
                />
                <input
                  v-model="item.qty"
                  type="number"
                  min="0"
                  step="any"
                  :class="isAmountValid(item.qty) ? inputBase : inputInvalid"
                  placeholder="0"
                />
                <input
                  v-model="item.unit"
                  type="text"
                  :class="inputBase"
                  placeholder="PCS"
                />
                <input
                  v-model="item.unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  :class="isAmountValid(item.unitPrice) ? inputBase : inputInvalid"
                  placeholder="0.00"
                />
                <span class="text-right text-xs font-mono text-muted-foreground truncate" :title="formatMoney(lineTotal(item))">
                  {{ currencyMeta.symbol }}{{ formatMoney(lineTotal(item)) }}
                </span>
                <button
                  @click="removeItem(idx)"
                  :disabled="form.items.length <= 1"
                  class="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition disabled:opacity-30 disabled:pointer-events-none"
                  title="删除该行"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <p class="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            数量与单价非法（负数或非数字）时会标红提示；金额列自动 = 数量 × 单价，四舍五入到两位小数。
          </p>
        </section>

        <!-- 汇总 -->
        <section class="space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <ReceiptText class="w-5 h-5 mr-2 text-primary" /> 汇总 Summary
          </h2>
          <div class="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">Subtotal 小计</span>
              <span class="font-mono font-medium">{{ currencyMeta.symbol }}{{ formatMoney(totals.subtotal) }}</span>
            </div>
            <div class="flex justify-between items-center gap-3">
              <span class="text-muted-foreground shrink-0">Discount 折扣（金额）</span>
              <input
                v-model="form.discount"
                type="number"
                min="0"
                step="0.01"
                :class="[isAmountValid(form.discount) ? inputBase : inputInvalid, 'w-28 text-right font-mono']"
                placeholder="0.00"
              />
            </div>
            <div class="flex justify-between items-center gap-3">
              <span class="text-muted-foreground shrink-0">Tax 税率（%）</span>
              <input
                v-model="form.taxRate"
                type="number"
                min="0"
                step="0.1"
                :class="[isAmountValid(form.taxRate) ? inputBase : inputInvalid, 'w-28 text-right font-mono']"
                placeholder="0"
              />
            </div>
            <div class="flex justify-between items-center border-t border-border pt-3">
              <span class="font-semibold text-foreground">TOTAL 总计</span>
              <span class="font-mono font-bold text-base text-primary">{{ currencyMeta.symbol }}{{ formatMoney(totals.total) }}</span>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed break-words">{{ sayTotalText }}</p>
          </div>
        </section>

        <!-- 贸易条款 -->
        <section class="space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 贸易条款 Terms
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">贸易术语 Incoterms</label>
              <select v-model="form.incoterm" :class="inputBase">
                <option v-for="t in INCOTERMS" :key="t.code" :value="t.code">{{ t.code }}</option>
              </select>
              <p class="text-xs text-muted-foreground mt-1.5">{{ incotermHint }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">产地 Country of Origin</label>
              <input v-model="form.origin" type="text" :class="inputBase" placeholder="如 China" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-foreground mb-2">付款方式 Payment Terms</label>
              <input v-model="form.paymentTerms" type="text" :class="inputBase" placeholder="如 T/T, L/C at sight" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">海关编码 HS Code（选填）</label>
              <input v-model="form.hsCode" type="text" :class="inputBase" placeholder="如 6912.0010" />
            </div>
          </div>
        </section>

        <p class="text-xs text-muted-foreground flex items-start gap-1.5 border-t border-border pt-4">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          填写内容会自动保存为本机浏览器草稿（localStorage，键名以 invoice-generator 开头），刷新页面不丢失；点击「清空重填」可删除草稿并恢复默认。
        </p>
      </div>

      <!-- 右：发票预览（打印区） -->
      <div class="print-area">
        <div class="no-print flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 发票预览
          </h2>
          <div class="flex flex-wrap gap-2">
            <button
              @click="printInvoice"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5"
            >
              <Printer class="w-4 h-4" /> 打印 / 另存 PDF
            </button>
            <button
              @click="copyInvoiceText"
              class="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center gap-1.5"
            >
              <Copy class="w-4 h-4" /> 复制文本版
            </button>
            <button
              @click="resetAll"
              class="px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-muted-foreground transition flex items-center gap-1.5"
              title="清空全部内容并重新生成发票号"
            >
              <RefreshCw class="w-4 h-4" /> 清空重填
            </button>
          </div>
        </div>

        <div
          class="bg-white text-black border border-gray-400 rounded-lg shadow-sm min-h-[700px]"
          style="font-family: 'Times New Roman', 'SimSun', serif;"
        >
          <div class="p-6 md:p-10 space-y-5">
            <!-- 卖方抬头 + 标题 -->
            <div class="flex justify-between items-end gap-4">
              <p class="text-2xl font-bold break-words">{{ form.from.company || 'YOUR COMPANY CO., LTD.' }}</p>
              <p class="text-[11px] text-gray-500 text-right shrink-0">EXPORT DOCUMENT<br />出口单证</p>
            </div>
            <h3 class="text-center text-2xl font-bold tracking-[0.25em] underline underline-offset-4">COMMERCIAL INVOICE</h3>

            <!-- 号码 / 日期一行 -->
            <div class="flex flex-wrap gap-x-6 gap-y-1 text-[13px] border-y border-gray-400 py-2">
              <span><b>Invoice No. 发票号:</b> {{ form.invoiceNo || '—' }}</span>
              <span><b>Date 日期:</b> {{ form.date || '—' }}</span>
              <span><b>Due Date 到期日:</b> {{ form.dueDate || '—' }}</span>
              <span v-if="form.poNo"><b>P.O. No.:</b> {{ form.poNo }}</span>
            </div>

            <!-- From / To -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 text-[13px]">
              <div>
                <p class="font-bold border-b border-gray-400 mb-1.5 pb-0.5">FROM / SELLER（出口方）</p>
                <p class="font-semibold">{{ form.from.company || '＿＿＿＿＿＿＿＿' }}</p>
                <p v-if="form.from.address" class="whitespace-pre-line">{{ form.from.address }}</p>
                <p v-if="form.from.tel">Tel: {{ form.from.tel }}</p>
                <p v-if="form.from.email">Email: {{ form.from.email }}</p>
              </div>
              <div>
                <p class="font-bold border-b border-gray-400 mb-1.5 pb-0.5">TO / BUYER（进口方）</p>
                <p class="font-semibold">{{ form.to.company || '＿＿＿＿＿＿＿＿' }}</p>
                <p v-if="form.to.address" class="whitespace-pre-line">{{ form.to.address }}</p>
                <p v-if="form.to.tel">Tel: {{ form.to.tel }}</p>
                <p v-if="form.to.email">Email: {{ form.to.email }}</p>
              </div>
            </div>

            <!-- 行项目表 -->
            <table class="w-full text-[13px] border-collapse">
              <thead>
                <tr class="border-y-2 border-gray-600">
                  <th class="py-1.5 px-1 text-left w-8">No.</th>
                  <th class="py-1.5 px-1 text-left">Description 品名</th>
                  <th class="py-1.5 px-1 text-right">Qty 数量</th>
                  <th class="py-1.5 px-1 text-left">Unit 单位</th>
                  <th class="py-1.5 px-1 text-right">Unit Price 单价</th>
                  <th class="py-1.5 px-1 text-right">Amount 金额</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(it, i) in visibleItems" :key="it.id" class="border-b border-gray-200 align-top">
                  <td class="py-1.5 px-1">{{ i + 1 }}</td>
                  <td class="py-1.5 px-1 break-words">{{ it.description }}</td>
                  <td class="py-1.5 px-1 text-right">{{ formatQty(it.qty) }}</td>
                  <td class="py-1.5 px-1">{{ it.unit }}</td>
                  <td class="py-1.5 px-1 text-right">{{ currencyMeta.symbol }}{{ formatMoney(it.unitPrice) }}</td>
                  <td class="py-1.5 px-1 text-right">{{ currencyMeta.symbol }}{{ formatMoney(lineTotal(it)) }}</td>
                </tr>
                <tr v-if="!visibleItems.length">
                  <td colspan="6" class="py-4 text-center text-gray-400 text-xs">（请至少填写一行货描 / 数量 / 单价）</td>
                </tr>
              </tbody>
            </table>

            <!-- 汇总（右对齐） -->
            <div class="flex justify-end">
              <div class="w-full sm:w-72 text-[13px] space-y-1">
                <div class="flex justify-between">
                  <span class="text-gray-600">Subtotal 小计</span>
                  <span class="font-mono">{{ currencyMeta.symbol }}{{ formatMoney(totals.subtotal) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Discount 折扣</span>
                  <span class="font-mono">-{{ currencyMeta.symbol }}{{ formatMoney(totals.discount) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Tax 税费（{{ displayTaxRate }}%）</span>
                  <span class="font-mono">{{ currencyMeta.symbol }}{{ formatMoney(totals.tax) }}</span>
                </div>
                <div class="flex justify-between border-t-2 border-gray-700 pt-1.5 text-base font-bold">
                  <span>TOTAL 合计</span>
                  <span class="font-mono">{{ currencyMeta.symbol }}{{ formatMoney(totals.total) }}</span>
                </div>
              </div>
            </div>
            <p class="text-[13px] font-semibold break-words">SAY TOTAL IN WORDS 大写金额: {{ sayTotalText }}</p>
            <p v-if="form.currency === 'JPY' && minorCents > 0" class="text-[10px] text-gray-500 -mt-3">
              Note: JPY has no minor unit; decimals shown for calculation reference only.（日元无辅币单位，小数部分仅作换算参考）
            </p>

            <!-- 条款区 -->
            <div class="text-[13px] space-y-1.5 border-t border-gray-300 pt-3">
              <p><b>Incoterms 贸易术语:</b> {{ form.incoterm }}<span class="text-gray-600">（{{ incotermHint }}）</span></p>
              <p><b>Payment Terms 付款方式:</b> {{ form.paymentTerms || '—' }}</p>
              <p><b>Country of Origin 产地:</b> {{ form.origin || '—' }}</p>
              <p v-if="form.hsCode"><b>HS Code 海关编码:</b> {{ form.hsCode }}</p>
            </div>

            <!-- 签署区 -->
            <div class="flex justify-between items-end pt-10 text-[13px]">
              <p>Signature / 盖章：<span class="inline-block min-w-[160px] border-b border-dotted border-gray-500 align-bottom">&nbsp;</span></p>
              <p>Date 日期：<span class="inline-block min-w-[120px] border-b border-dotted border-gray-500 align-bottom">&nbsp;</span></p>
            </div>
          </div>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印或另存 PDF 时只输出发票版式，表单与按钮自动隐藏。本发票为外贸自制单证，正式使用前请与报关行 / 收汇银行确认格式要求；
          需要形式发票（Proforma Invoice）时，可沿用本版式并把标题改为 PROFORMA INVOICE 后打印。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>商业发票（Commercial Invoice）是什么</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          商业发票是出口方开给进口方的正式结算单证，既是买方清关缴税、卖方收汇结汇的依据，也是全套外贸单证（发票、装箱单、提单、原产地证等）的核心。
          一份规范的商业发票通常包含：发票号码与日期、买卖双方信息、货描与数量单价、贸易术语（Incoterms）、付款方式、产地与海关编码，
          以及总金额的英文大写（SAY TOTAL IN WORDS）——大写金额用于防篡改，与数字金额不一致时以大写为准。本页生成的版式同时适用于报价阶段的
          形式发票（Proforma Invoice）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Commercial Invoice 与 Proforma Invoice 的区别</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          形式发票（PI）开在成交之前，本质是「正式报价单」：列明价格、数量、贸易术语与付款条件，供买方确认订单、申请进口许可证、
          外汇或开立信用证使用，不作为收款与记账凭证。商业发票（CI）开在成交之后、发货（或发货同时）出具，是买方报关缴税、
          卖方结汇收款的正式依据。两者内容结构几乎相同，主要区别在于出具时点与法律效力：PI 约定交易，CI 证明交易已经发生。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">商业发票和增值税发票有什么区别？（重要）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          中国增值税发票由税务机关监制、通过增值税发票管理系统开具，票面有发票代码 / 号码、购销双方税号与税率，是增值税进项抵扣和
          企业所得税税前扣除的法定凭证。而本页生成的商业发票是外贸交易中的自制商业单证，没有税务监制章，不能在国内税务系统中认证，
          <b>不能用于增值税抵扣</b>。简单记：对内购销、要抵扣，找增值税发票；对外贸易、要清关收款，用商业发票。涉及出口退税时，
          单证要求请以报关行 / 货代与主管税务机关的要求为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">发票编号规则建议</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>推荐格式「INV + YYYYMMDD + 3 位流水」，如 INV20261029001，本工具的默认编号即按此生成。</li>
          <li>编号必须连续唯一、不跳号不重号；作废发票保留号段并在票面标注 VOID，便于单证归档核查。</li>
          <li>多客户、多业务线可加前缀区分（如 INV-US-、INV-EU-），但避免使用中文与特殊字符，保证清关与银行系统兼容。</li>
          <li>合同号、P.O. 号与发票号宜互相呼应（或在票面并列展示），方便买方对单与银行审单。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">填写的数据保存在哪里？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          全部数据只保存在你当前浏览器的 localStorage（键名以 invoice-generator 开头），不发送到任何服务器。刷新或关闭浏览器后重新打开页面，
          草稿仍在；清除浏览器站点数据或更换设备后草稿会丢失，建议定期用「复制文本版」把发票内容粘贴到本地文件备份。涉及价格与客户信息的敏感内容，
          也请勿在公用电脑上填写。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">这张发票能当增值税发票用来抵扣吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不能。本页生成的是外贸商业/形式发票，属于自制商业单证，不是税务机关监制的增值税发票，无法认证抵扣；国内购销需要增值税发票请通过税控系统开具。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">商业发票和形式发票可以用同一个模板吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">可以。两者字段结构基本一致，区别主要是出具时点与用途：成交前发 Proforma Invoice 供确认与开证，成交后发 Commercial Invoice 用于清关与收汇，标题相应替换即可。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">发票号码怎么编比较好？</h3>
            <p class="text-sm text-muted-foreground mt-1">推荐 INV + 八位日期 + 三位流水（如 INV20261029001），保持连续唯一、不跳号；作废票保留号码并标注 VOID，多客户业务可加前缀区分。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">刷新页面后填的内容还在吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">在。草稿自动保存于本机浏览器 localStorage，刷新不丢失；清空浏览器数据或换设备会丢失，可用「复制文本版」导出备份。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'invoice-generator'" :category="'file'" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  ReceiptText, Globe, Printer, Copy, Plus, X, RefreshCw,
  ChevronUp, ChevronDown, TriangleAlert, Info, Calendar
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '商业发票生成器 - 外贸 Commercial/Proforma Invoice 在线制作打印',
  description: '免费在线外贸商业发票生成器：中英双语填写买卖双方、多行货描、六种币种、折扣税率自动汇总，总金额自动转英文大写（SAY TOTAL），支持 Incoterms 贸易术语与 T/T 付款条款，一键打印或另存 PDF，草稿本地保存不上传',
  keywords: '商业发票生成器,commercial invoice 模板,形式发票,proforma invoice,外贸发票制作,英文发票模板,发票金额大写,国际贸易单证,incoterms',
  author: '有条工具',
  ogTitle: '商业发票生成器 - 外贸 Commercial/Proforma Invoice 在线制作打印 | 有条工具',
  ogDescription: '中英双语填写，金额自动转英文大写，Incoterms 与付款条款一键生成，打印或另存 PDF。',
  ogUrl: 'https://www.util.cn/tools/invoice-generator',
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
          name: '商业发票生成器',
          url: 'https://www.util.cn/tools/invoice-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['外贸商业/形式发票版式', '中英双语字段与预览', '总金额自动转英文大写', 'USD/EUR/CNY/GBP/JPY/HKD 币种', '多行项目与折扣税率汇总', 'Incoterms 贸易术语释义', '打印或另存 PDF', '本地草稿自动保存']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '商业发票生成器', item: 'https://www.util.cn/tools/invoice-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '这张发票能当增值税发票用来抵扣吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。本工具生成的是外贸商业/形式发票（Commercial/Proforma Invoice），属于自制商业单证，不是税务机关监制的增值税发票，不能用于增值税抵扣；报关退税单证请以报关行/货代要求为准。' }
            },
            {
              '@type': 'Question',
              name: '商业发票和形式发票可以用同一个模板吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以。两者字段结构基本一致，区别主要是出具时点与用途：成交前发 Proforma Invoice 供买方确认订单与开证，成交后发 Commercial Invoice 用于清关与收汇，标题相应替换即可。' }
            },
            {
              '@type': 'Question',
              name: '发票号码怎么编比较好？',
              acceptedAnswer: { '@type': 'Answer', text: '推荐 INV+八位日期+三位流水（如 INV20261029001），保持连续唯一、不跳号；作废票保留号码并标注 VOID，多客户业务可加前缀区分。' }
            },
            {
              '@type': 'Question',
              name: '刷新页面后填的内容还在吗？',
              acceptedAnswer: { '@type': 'Answer', text: '在。草稿自动保存于本机浏览器 localStorage（键名以 invoice-generator 开头），刷新不丢失；清空浏览器数据或换设备会丢失，可用复制文本版导出备份。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 币种常量表：code 代码 / symbol 符号 / words 英文大写币名 / noMinor 无辅币单位（如日元无"分"）
const CURRENCIES = [
  { code: 'USD', symbol: '$', words: 'US DOLLARS', noMinor: false },
  { code: 'EUR', symbol: '€', words: 'EUROS', noMinor: false },
  { code: 'CNY', symbol: '¥', words: 'CHINESE YUAN', noMinor: false },
  { code: 'GBP', symbol: '£', words: 'POUNDS STERLING', noMinor: false },
  { code: 'JPY', symbol: '¥', words: 'JAPANESE YEN', noMinor: true },
  { code: 'HKD', symbol: 'HK$', words: 'HONG KONG DOLLARS', noMinor: false }
]

// Incoterms 贸易术语及中文一句释义
const INCOTERMS = [
  { code: 'EXW', zh: '工厂交货：买方上门自提，全程运费风险由买方承担' },
  { code: 'FOB', zh: '装运港船上交货：卖方负责把货送到装运港船上' },
  { code: 'CIF', zh: '成本加保险费加运费：卖方付至目的港的运费与保险费' },
  { code: 'CFR', zh: '成本加运费：卖方付运费，保险由买方自理' },
  { code: 'DAP', zh: '目的地交货：卖方运到指定目的地待卸货交付' },
  { code: 'DDP', zh: '完税后交货：卖方承担含进口关税的全部费用与风险' }
]

const EN_ONES = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN']
const EN_TENS = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY']
const EN_SCALES = [
  { value: 1000000000, word: 'BILLION' },
  { value: 1000000, word: 'MILLION' },
  { value: 1000, word: 'THOUSAND' }
]

// 0-999 整数转英文单词（如 105 → ONE HUNDRED FIVE）
function threeDigitsToWords(n) {
  let out = ''
  const h = Math.floor(n / 100)
  const rest = n % 100
  if (h > 0) out += EN_ONES[h] + ' HUNDRED'
  if (rest > 0) {
    if (out) out += ' '
    if (rest < 20) out += EN_ONES[rest]
    else out += EN_TENS[Math.floor(rest / 10)] + (rest % 10 ? '-' + EN_ONES[rest % 10] : '')
  }
  return out
}

// 非负整数转英文单词，支持到 billion（< 1e12）
function intToEnglishWords(n) {
  if (n === 0) return 'ZERO'
  let out = ''
  let rest = n
  for (const s of EN_SCALES) {
    if (rest >= s.value) {
      const q = Math.floor(rest / s.value)
      out += (out ? ' ' : '') + threeDigitsToWords(q) + ' ' + s.word
      rest %= s.value
    }
  }
  if (rest > 0) out += (out ? ' ' : '') + threeDigitsToWords(rest)
  return out
}

// 金额转英文大写："1234.56" → ONE THOUSAND TWO HUNDRED THIRTY-FOUR AND CENTS FIFTY-SIX ONLY
// 统一按两位小数处理（JPY 等无辅币单位币种同样处理，由界面另行注明）；支持到 billion
function amountToEnglishWords(amount) {
  const num = Number(amount)
  if (!Number.isFinite(num) || Math.abs(num) >= 1e12) return 'AMOUNT TOO LARGE'
  const sign = num < 0 ? 'MINUS ' : ''
  const totalCents = Math.round(Math.abs(num) * 100)
  const intPart = Math.floor(totalCents / 100)
  const centPart = totalCents % 100
  let out = sign + intToEnglishWords(intPart)
  if (centPart > 0) out += ' AND CENTS ' + threeDigitsToWords(centPart)
  return out + ' ONLY'
}

// 配合币种表拼成 "SAY TOTAL: US DOLLARS ... ONLY"
function sayTotalWords(currencyCode, amount) {
  const meta = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0]
  return 'SAY TOTAL: ' + meta.words + ' ' + amountToEnglishWords(amount)
}

// 金额的小数部分（分），用于判断是否需要"无辅币单位"注记
function minorCentsOf(amount) {
  return Math.round(Math.abs(Number(amount) || 0) * 100) % 100
}

// 两位小数四舍五入，规避浮点误差
function round2(x) {
  return Math.round(x * 100) / 100
}

// 单行金额 = 数量 × 单价（非法输入按 0 处理）
function lineAmount(qty, price) {
  const q = Number(qty)
  const p = Number(price)
  return round2((Number.isFinite(q) ? q : 0) * (Number.isFinite(p) ? p : 0))
}

// 汇总：先小计 → 减折扣（金额）→ 按税率计税 → 总计
function computeTotals(lines, discountInput, taxRate) {
  const subtotal = round2(lines.reduce((sum, l) => sum + lineAmount(l.qty, l.unitPrice), 0))
  const discRaw = Number(discountInput)
  const discount = round2(Number.isFinite(discRaw) && discRaw > 0 ? discRaw : 0)
  const afterDiscount = round2(subtotal - discount)
  const rateRaw = Number(taxRate)
  const rate = Number.isFinite(rateRaw) && rateRaw > 0 ? rateRaw : 0
  const tax = round2((afterDiscount * rate) / 100)
  const total = round2(afterDiscount + tax)
  return { subtotal, discount, afterDiscount, tax, total }
}

// 金额格式化：千分位 + 固定两位小数（非法输入按 0.00）
function formatMoney(v) {
  const n = Number(v)
  const safe = Number.isFinite(n) ? round2(Math.abs(n)) : 0
  const parts = safe.toFixed(2).split('.')
  const withCommas = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return (n < 0 ? '-' : '') + withCommas + '.' + parts[1]
}

// 数量格式化：数字则去掉多余小数尾零，非数字原样返回
function formatQty(v) {
  const s = String(v ?? '').trim()
  if (s === '') return ''
  const n = Number(s)
  return Number.isFinite(n) ? String(n) : s
}

// 金额合法性：允许留空；填了则必须是 ≥ 0 的有限数字
function isAmountValid(v) {
  const s = String(v ?? '').trim()
  if (s === '') return true
  const n = Number(s)
  return Number.isFinite(n) && n >= 0
}

// Date → "YYYY-MM-DD"（本地时区）
function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// "YYYY-MM-DD" 加减天数（跨月跨年由 Date 自动进位），非法输入返回空串
function addDaysISO(iso, days) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''))
  if (!m) return ''
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + Number(days))
  return toISODate(d)
}

// 发票号：INV + YYYYMMDD + 3 位随机数字（now/rand 可注入以便单测）
function genInvoiceNo(now, rand) {
  const d = now instanceof Date ? now : new Date()
  const r = rand === undefined || rand === null ? Math.random() : rand
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `INV${stamp}${String(Math.floor(r * 1000)).padStart(3, '0')}`
}

// 文本版发票（复制用），入参为纯数据快照
function buildInvoiceText(d) {
  const meta = CURRENCIES.find((c) => c.code === d.currency) || CURRENCIES[0]
  const line = '-'.repeat(52)
  const L = []
  L.push('COMMERCIAL INVOICE')
  L.push(line)
  L.push(`Invoice No.: ${d.invoiceNo || '-'}`)
  L.push(`Invoice Date: ${d.date || '-'}    Due Date: ${d.dueDate || '-'}${d.poNo ? '    P.O. No.: ' + d.poNo : ''}`)
  L.push('')
  L.push(`FROM / SELLER: ${d.from.company || '-'}`)
  if (d.from.address) L.push(`  Address: ${d.from.address}`)
  if (d.from.tel) L.push(`  Tel: ${d.from.tel}`)
  if (d.from.email) L.push(`  Email: ${d.from.email}`)
  L.push(`TO / BUYER: ${d.to.company || '-'}`)
  if (d.to.address) L.push(`  Address: ${d.to.address}`)
  if (d.to.tel) L.push(`  Tel: ${d.to.tel}`)
  if (d.to.email) L.push(`  Email: ${d.to.email}`)
  L.push('')
  L.push('No. Description                Qty        Unit       Unit Price         Amount')
  d.items.forEach((it, i) => {
    const desc = String(it.description || '-').padEnd(22, ' ').slice(0, 22)
    const qty = formatQty(it.qty).padStart(8, ' ')
    const unit = String(it.unit || '').padEnd(9, ' ').slice(0, 9)
    const price = formatMoney(it.unitPrice).padStart(13, ' ')
    const amt = formatMoney(lineAmount(it.qty, it.unitPrice)).padStart(14, ' ')
    L.push(`${String(i + 1).padStart(2, '0')} ${desc} ${qty} ${unit}${price} ${meta.symbol}${amt}`)
  })
  L.push(line)
  L.push(`Subtotal: ${meta.symbol}${formatMoney(d.totals.subtotal)}`)
  L.push(`Discount: -${meta.symbol}${formatMoney(d.totals.discount)}`)
  L.push(`Tax: ${meta.symbol}${formatMoney(d.totals.tax)}`)
  L.push(`TOTAL: ${meta.symbol}${formatMoney(d.totals.total)}`)
  L.push(`SAY TOTAL IN WORDS: ${d.sayTotal}`)
  L.push('')
  L.push(`Incoterms: ${d.incoterm}`)
  L.push(`Payment Terms: ${d.paymentTerms || '-'}`)
  L.push(`Country of Origin: ${d.origin || '-'}`)
  if (d.hsCode) L.push(`HS Code: ${d.hsCode}`)
  L.push(line)
  L.push('Signature / 盖章: ____________________    Date: ____________')
  return L.join('\n')
}
// ---------- 纯逻辑结束 ----------

// ---------- 输入框样式（语义 token；非法金额替换为红色边框版） ----------
const inputBase = 'w-full px-2.5 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'
const inputInvalid = 'w-full px-2.5 py-2 bg-background border border-red-500 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500'

// ---------- 状态 ----------
const DEFAULT_PAYMENT_TERMS = 'T/T, 30% deposit in advance, 70% balance against copy of B/L'
const DRAFT_KEY = 'invoice-generator-draft'
let itemSeed = 0

function createItem(desc = '', qty = '', unit = '', price = '') {
  itemSeed += 1
  return { id: itemSeed, description: desc, qty, unit, unitPrice: price }
}

const blankParty = () => ({ company: '', address: '', tel: '', email: '' })

const form = reactive({
  invoiceNo: '',
  date: '',
  dueDate: '',
  poNo: '',
  currency: 'USD',
  from: blankParty(),
  to: blankParty(),
  items: [createItem(), createItem(), createItem()],
  discount: '',
  taxRate: '',
  incoterm: 'FOB',
  paymentTerms: DEFAULT_PAYMENT_TERMS,
  origin: 'China',
  hsCode: ''
})

const seoContentVisible = ref(true)

// ---------- 计算属性 ----------
const currencyMeta = computed(() => CURRENCIES.find((c) => c.code === form.currency) || CURRENCIES[0])
const totals = computed(() => computeTotals(form.items, form.discount, form.taxRate))
const sayTotalText = computed(() => sayTotalWords(form.currency, totals.value.total))
const minorCents = computed(() => minorCentsOf(totals.value.total))
const incotermHint = computed(() => {
  const found = INCOTERMS.find((t) => t.code === form.incoterm)
  return found ? found.zh : ''
})
const displayTaxRate = computed(() => formatQty(form.taxRate) || '0')

// 有实际内容的行（货描 / 数量 / 单价任一非空），用于预览与打印校验
const visibleItems = computed(() =>
  form.items.filter((it) =>
    String(it.description).trim() !== '' || String(it.qty).trim() !== '' || String(it.unitPrice).trim() !== ''
  )
)

const lineTotal = (item) => lineAmount(item.qty, item.unitPrice)

// ---------- 草稿（localStorage，前缀 invoice-generator） ----------
function draftSnapshot() {
  return {
    invoiceNo: form.invoiceNo,
    date: form.date,
    dueDate: form.dueDate,
    poNo: form.poNo,
    currency: form.currency,
    from: { ...form.from },
    to: { ...form.to },
    items: form.items.map((it) => ({ description: it.description, qty: it.qty, unit: it.unit, unitPrice: it.unitPrice })),
    discount: form.discount,
    taxRate: form.taxRate,
    incoterm: form.incoterm,
    paymentTerms: form.paymentTerms,
    origin: form.origin,
    hsCode: form.hsCode
  }
}

function saveDraft() {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftSnapshot()))
  } catch (e) { /* 隐私模式 / 配额不足时忽略 */ }
}

function restoreDraft() {
  try {
    if (typeof localStorage === 'undefined') return false
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return false
    const d = JSON.parse(raw)
    if (!d || typeof d !== 'object') return false
    form.invoiceNo = String(d.invoiceNo || '')
    form.date = String(d.date || '')
    form.dueDate = String(d.dueDate || '')
    form.poNo = String(d.poNo || '')
    form.currency = CURRENCIES.some((c) => c.code === d.currency) ? d.currency : 'USD'
    form.from = { company: String(d.from?.company || ''), address: String(d.from?.address || ''), tel: String(d.from?.tel || ''), email: String(d.from?.email || '') }
    form.to = { company: String(d.to?.company || ''), address: String(d.to?.address || ''), tel: String(d.to?.tel || ''), email: String(d.to?.email || '') }
    if (Array.isArray(d.items) && d.items.length) {
      form.items = d.items.map((it) => createItem(
        String(it?.description || ''),
        String(it?.qty ?? ''),
        String(it?.unit || ''),
        String(it?.unitPrice ?? '')
      ))
    }
    form.discount = String(d.discount ?? '')
    form.taxRate = String(d.taxRate ?? '')
    form.incoterm = INCOTERMS.some((t) => t.code === d.incoterm) ? d.incoterm : 'FOB'
    form.paymentTerms = String(d.paymentTerms ?? DEFAULT_PAYMENT_TERMS)
    form.origin = String(d.origin ?? 'China')
    form.hsCode = String(d.hsCode || '')
    return true
  } catch (e) {
    return false
  }
}

// ---------- 操作 ----------
function addItem() {
  form.items.push(createItem())
}

function removeItem(idx) {
  if (form.items.length > 1) form.items.splice(idx, 1)
}

function applyDefaults() {
  const today = toISODate(new Date())
  form.invoiceNo = genInvoiceNo()
  form.date = today
  form.dueDate = addDaysISO(today, 15)
  form.poNo = ''
  form.currency = 'USD'
  form.from = blankParty()
  form.to = blankParty()
  form.items = [createItem(), createItem(), createItem()]
  form.discount = ''
  form.taxRate = ''
  form.incoterm = 'FOB'
  form.paymentTerms = DEFAULT_PAYMENT_TERMS
  form.origin = 'China'
  form.hsCode = ''
}

function resetAll() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(DRAFT_KEY)
  } catch (e) { /* 忽略 */ }
  applyDefaults()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

function printInvoice() {
  if (!visibleItems.value.length) {
    alert('行项目全部为空：请至少填写一行货描 / 数量 / 单价后再打印。')
    return
  }
  window.print()
}

async function copyInvoiceText() {
  const text = buildInvoiceText({
    invoiceNo: form.invoiceNo,
    date: form.date,
    dueDate: form.dueDate,
    poNo: form.poNo,
    currency: form.currency,
    from: { ...form.from },
    to: { ...form.to },
    items: visibleItems.value.map((it) => ({ description: it.description, qty: it.qty, unit: it.unit, unitPrice: it.unitPrice })),
    totals: totals.value,
    sayTotal: sayTotalText.value,
    incoterm: form.incoterm,
    paymentTerms: form.paymentTerms,
    origin: form.origin,
    hsCode: form.hsCode
  })
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
    alert('已复制发票文本版，可直接粘贴到邮件或聊天窗口。')
  } catch (e) {
    alert('复制失败，请手动选择预览区内容复制。')
  }
}

// 内容变化自动保存草稿
watch(form, saveDraft, { deep: true })

onMounted(() => {
  addRecentTool('invoice-generator')
  if (!restoreDraft()) applyDefaults()
})
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
  .print-area {
    box-shadow: none;
  }
  .bg-white {
    border: none !important;
    box-shadow: none !important;
  }
}
</style>
