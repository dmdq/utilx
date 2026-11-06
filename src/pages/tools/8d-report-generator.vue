<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ClipboardCheck class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">8D报告生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">D0-D8 分步填写生成 8D 报告，A4 实时预览可打印，客诉整改模板</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        按全球通行的 8D（Eight Disciplines）问题解决流程逐步填写：报告头信息、D0 准备与紧急响应、D1 组建团队、
        D2 问题描述（5W2H）、D3 临时对策、D4 根因分析（5Why）、D5 永久对策、D6 对策实施与效果验证、D7 预防再发、
        D8 团队表彰与关闭。右侧 A4 纸张实时预览，未填写的空位以「____」显示，可打印/另存 PDF 或导出 HTML 文件，
        草稿自动保存在本机浏览器。全部内容仅在本地处理，不上传任何数据。
      </p>
    </div>

    <!-- 免责声明（显著） -->
    <div class="no-print mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3" role="alert">
      <TriangleAlert class="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
      <p class="text-sm text-foreground leading-relaxed">
        <strong>免责声明：</strong>本工具输出的 8D 模板为参考性质，字段与流程顺序按业界惯用口径简化整理，
        不替代组织正式的 8D 表单；流程判定与报告要求以组织质量体系（如 IATF 16949）及客户特殊要求为准。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：分步表单 -->
      <div class="no-print space-y-4">
        <!-- 报告头 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <ClipboardCheck class="w-5 h-5 mr-2 text-primary" /> 报告头信息
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">报告编号</label>
              <input v-model="form.reportNo" type="text" class="input-base" placeholder="如 8D-2026-015" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">产品名称</label>
              <input v-model="form.productName" type="text" class="input-base" placeholder="如 电动车控制器总成" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">客户</label>
              <input v-model="form.customer" type="text" class="input-base" placeholder="如 ××汽车有限公司" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">供应商</label>
              <input v-model="form.supplier" type="text" class="input-base" placeholder="如 ××零部件有限公司" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">负责人</label>
              <input v-model="form.owner" type="text" class="input-base" placeholder="如 王质量" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">开启日期</label>
              <input v-model="form.startDate" type="date" class="input-base" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-foreground mb-1">目标关闭日期</label>
              <input v-model="form.targetCloseDate" type="date" class="input-base" />
              <p class="text-xs text-muted-foreground mt-1">全部字段均可选填，未填写处预览以「____」留白，打印后可手工补填</p>
            </div>
          </div>
        </div>

        <!-- D0 准备与紧急响应（可折叠，可选） -->
        <details class="bg-card border border-border rounded-lg p-6 group">
          <summary class="text-base font-semibold flex items-center cursor-pointer select-none text-muted-foreground">
            <Info class="w-4 h-4 mr-2 text-primary" /> D0 准备与紧急响应<span class="text-xs font-normal ml-2">（可选，点击展开）</span>
          </summary>
          <div class="grid grid-cols-1 gap-3 mt-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">现象摘要（来自客诉/预警/内外部反馈）</label>
              <textarea v-model="form.d0Summary" rows="3" class="input-base" placeholder="如 客户装配线反馈控制器偶发无法上电，已暂停装配并隔离库存 320 件"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">紧急响应/围堵完成日期</label>
              <input v-model="form.d0ContainDate" type="date" class="input-base" />
            </div>
          </div>
        </details>

        <!-- D1 组建团队 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Users class="w-5 h-5 mr-2 text-primary" /> D1 组建团队
          </h2>
          <p class="text-xs text-muted-foreground mb-3">列出组长与跨职能成员（质量/工艺/生产/客户代表等），可留空后补</p>
          <div v-for="(m, i) in form.team" :key="i" class="flex flex-wrap gap-2 mb-2 items-start">
            <input v-model="m.name" type="text" class="input-base flex-1 min-w-[110px]" placeholder="姓名" :aria-label="`成员${i + 1} 姓名`" />
            <select v-model="m.role" class="input-base w-[110px]" :aria-label="`成员${i + 1} 角色`">
              <option v-for="r in TEAM_ROLES" :key="r" :value="r">{{ r }}</option>
            </select>
            <input v-model="m.duty" type="text" class="input-base flex-1 min-w-[140px]" placeholder="职责（如 根因分析/对策实施）" :aria-label="`成员${i + 1} 职责`" />
            <button type="button" @click="removeTeamRow(i)" class="p-2 text-muted-foreground hover:text-red-600 transition" aria-label="删除该成员">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
          <button type="button" @click="addTeamRow" class="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition flex items-center gap-1">
            <Plus class="w-3.5 h-3.5" /> 添加成员
          </button>
        </div>

        <!-- D2 问题描述 5W2H -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <FileText class="w-5 h-5 mr-2 text-primary" /> D2 问题描述（5W2H）
          </h2>
          <p class="text-xs text-muted-foreground mb-3">用「是什么—在哪里—什么时候—谁发现—多少—怎么发现」把问题说清楚</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">何物（What，对象/零件号）</label>
              <input v-model="form.d2What" type="text" class="input-base" placeholder="如 控制器总成 PN-88213" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">何地（Where，发生地点/工位）</label>
              <input v-model="form.d2Where" type="text" class="input-base" placeholder="如 客户总装线 3 工位" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">何时（When，发生时间）</label>
              <input v-model="form.d2When" type="text" class="input-base" placeholder="如 2026-10-28 白班 10:20" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">何人（Who，发现人/涉及人）</label>
              <input v-model="form.d2Who" type="text" class="input-base" placeholder="如 客户操作工/我司驻点质量员" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">程度（多少，数量/比例）</label>
              <input v-model="form.d2HowMuch" type="text" class="input-base" placeholder="如 3 件/320 件库存，批次 20261026" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">如何发现（How detected）</label>
              <input v-model="form.d2HowFound" type="text" class="input-base" placeholder="如 客户上电测试发现/终检抽检" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-foreground mb-1">附件说明（选填，照片/报告清单）</label>
              <textarea v-model="form.d2Attachments" rows="2" class="input-base" placeholder="每行一项，如：&#10;不良品照片 3 张&#10;客户投诉单 COM-2026-1101"></textarea>
            </div>
          </div>
        </div>

        <!-- D3 临时对策 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <ShieldCheck class="w-5 h-5 mr-2 text-primary" /> D3 临时对策（围堵）
          </h2>
          <p class="text-xs text-muted-foreground mb-3">先隔离可疑品、保护客户，再谈根因</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-foreground mb-1">围堵范围（在库/在途/客户现场）</label>
              <input v-model="form.d3Scope" type="text" class="input-base" placeholder="如 在库 320 件全数隔离，在途 800 件通知拦截，客户线边 50 件召回" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-foreground mb-1">临时措施（可多行，一条一行）</label>
              <textarea v-model="form.d3Actions" rows="3" class="input-base" placeholder="如：&#10;库存全数 100% 上电复测&#10;成品出库增加短接验证工位"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">负责人</label>
              <input v-model="form.d3Owner" type="text" class="input-base" placeholder="如 李生产" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">完成日期</label>
              <input v-model="form.d3Date" type="date" class="input-base" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-foreground mb-1">效果验证</label>
              <textarea v-model="form.d3Verify" rows="2" class="input-base" placeholder="如 复测 320 件发现 3 件同现象，其余合格；拦截在途 800 件待复测"></textarea>
            </div>
          </div>
        </div>

        <!-- D4 根因分析 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <SearchCheck class="w-5 h-5 mr-2 text-primary" /> D4 根因分析（5Why）
          </h2>
          <p class="text-xs text-muted-foreground mb-3">发生根因（为什么会坏）与流出根因（为什么没拦住）都要答</p>
          <div class="grid grid-cols-1 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">发生根因（5Why 逐层，一行一层）</label>
              <textarea v-model="form.d4OccurWhy" rows="4" class="input-base" placeholder="如：&#10;Why1 螺丝漏打扭矩 → Why2 打螺丝工位无防错 → Why3 新员工上岗未培训到位 → Why4 培训计划未覆盖新工位 → Why5 班组长变更管理流程缺失"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">流出根因（5Why 逐层，一行一层）</label>
              <textarea v-model="form.d4EscapeWhy" rows="4" class="input-base" placeholder="如：&#10;Why1 不良品流出 → Why2 终检未含上电测试项 → Why3 检验规范漏项 → Why4 检验规范未随设计变更更新"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">根因验证方法与结论</label>
              <textarea v-model="form.d4Verify" rows="2" class="input-base" placeholder="如 现场再现试验 5/5 复现；排查同批次 100% 确认漏打集中在 B 班新员工时段，与 5Why 推断一致"></textarea>
            </div>
          </div>
        </div>

        <!-- D5 永久对策 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Wrench class="w-5 h-5 mr-2 text-primary" /> D5 永久对策
          </h2>
          <p class="text-xs text-muted-foreground mb-3">每条对策注明针对哪条根因（发生/流出），一条对策对一条根因</p>
          <div v-for="(a, i) in form.d5Actions" :key="i" class="border border-border rounded-lg p-3 mb-2">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-muted-foreground">对策 {{ i + 1 }}</span>
              <button type="button" @click="removeD5Row(i)" class="p-1 text-muted-foreground hover:text-red-600 transition" aria-label="删除该对策">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input v-model="a.cause" type="text" class="input-base" placeholder="针对根因（如 发生根因-无防错）" />
              <input v-model="a.action" type="text" class="input-base" placeholder="永久措施（如 打螺丝工位增加扭矩防错）" />
              <input v-model="a.owner" type="text" class="input-base" placeholder="负责人" />
              <input v-model="a.planDate" type="date" class="input-base" aria-label="计划完成日" />
            </div>
          </div>
          <button type="button" @click="addD5Row" class="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition flex items-center gap-1">
            <Plus class="w-3.5 h-3.5" /> 添加对策
          </button>
        </div>

        <!-- D6 实施与验证 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <ClipboardCheck class="w-5 h-5 mr-2 text-primary" /> D6 对策实施与效果验证
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-foreground mb-1">实施记录</label>
              <textarea v-model="form.d6Record" rows="3" class="input-base" placeholder="如 10-30 完成防错夹具安装并试运行 3 个班次"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">效果数据（实施前）</label>
              <input v-model="form.d6Before" type="text" class="input-base" placeholder="如 漏打率 0.8%" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">效果数据（实施后）</label>
              <input v-model="form.d6After" type="text" class="input-base" placeholder="如 连续 5 批 0 漏打" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">完成日期</label>
              <input v-model="form.d6Date" type="date" class="input-base" />
            </div>
          </div>
        </div>

        <!-- D7 预防再发 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <FileCheck2 class="w-5 h-5 mr-2 text-primary" /> D7 预防再发与横向展开
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">FMEA 更新</label>
              <textarea v-model="form.d7Fmea" rows="2" class="input-base" placeholder="如 PFMEA 增加「漏打扭矩」失效模式并评定 S/O/D"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">控制计划更新</label>
              <textarea v-model="form.d7ControlPlan" rows="2" class="input-base" placeholder="如 控制计划增加上电测试 100% 检验项"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">SOP / 作业文件更新</label>
              <textarea v-model="form.d7Sop" rows="2" class="input-base" placeholder="如 更新装配 SOP 增加扭矩复核步骤"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">横向展开范围</label>
              <textarea v-model="form.d7Rollout" rows="2" class="input-base" placeholder="如 同类 4 条装配线全部排查，10-25 前完成"></textarea>
            </div>
          </div>
        </div>

        <!-- D8 表彰与关闭 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Trophy class="w-5 h-5 mr-2 text-primary" /> D8 团队表彰与关闭
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">关闭日期</label>
              <input v-model="form.d8CloseDate" type="date" class="input-base" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">经验教训</label>
              <textarea v-model="form.d8Lessons" rows="3" class="input-base" placeholder="如 新工位上岗培训与变更管理纳入流程；检验规范随设计变更同步更新"></textarea>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              @click="printReport"
              class="flex-1 min-w-[130px] px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
            >
              <Printer class="w-4 h-4" /> 打印 / 另存 PDF
            </button>
            <button
              type="button"
              @click="exportHtml"
              class="flex-1 min-w-[130px] px-4 py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition flex items-center justify-center gap-1.5"
            >
              <Download class="w-4 h-4" /> 导出 HTML
            </button>
            <button
              type="button"
              @click="saveDraftNow"
              class="flex-1 min-w-[110px] px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-muted-foreground transition flex items-center justify-center gap-1.5"
            >
              <Save class="w-4 h-4" /> 保存草稿
            </button>
            <button
              type="button"
              @click="clearDraft"
              class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-muted-foreground transition flex items-center justify-center gap-1.5"
            >
              <Eraser class="w-4 h-4" /> 清空草稿
            </button>
            <button
              type="button"
              @click="resetForm"
              class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-muted-foreground transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw class="w-4 h-4" /> 清空重填
            </button>
          </div>
          <p v-if="draftTip" class="text-xs text-success mt-3 flex items-center gap-1">
            <Check class="w-3.5 h-3.5" /> {{ draftTip }}
          </p>
        </div>
      </div>

      <!-- 右：A4 纸张预览（打印输出区） -->
      <div class="print-area">
        <div class="no-print flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 8D 报告预览（A4）
          </h2>
          <button
            type="button"
            @click="printReport"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5"
          >
            <Printer class="w-4 h-4" /> 打印
          </button>
        </div>

        <div class="bg-white text-black border border-border rounded-lg shadow-sm overflow-hidden a4-paper">
          <div class="px-[8%] py-[7%]" v-html="previewHtml"></div>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印或另存 PDF 时仅输出纸张内容；内容超过一页时打印会自动分页。「____」为待补填空位。
        </p>
      </div>
    </div>

    <!-- SEO 内容长尾区（可折叠） -->
    <div class="relative no-print">
      <button
        type="button"
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>8D报告生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          8D 报告生成器是一款在线 8D（Eight Disciplines，八步法）问题解决报告填写工具，面向客诉回复、内部质量整改与供应商辅导场景。
          工具按 D0 准备与紧急响应、D1 组建团队、D2 问题描述（5W2H）、D3 临时对策（围堵）、D4 根因分析（5Why）、
          D5 永久对策、D6 对策实施与效果验证、D7 预防再发与横向展开、D8 团队表彰与关闭的结构分步填写，
          右侧 A4 纸张实时预览完整报告版式，未填写的空位以「____」留白，方便打印后手工补填。
          支持一键打印/另存 PDF 与导出 HTML 文件，草稿保存在本机浏览器 localStorage，刷新、关闭页面后再次打开可继续编辑。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">D0-D8 各步骤写什么</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed">
          <li><strong>D0 准备与紧急响应</strong>：接到客诉或内部预警后的快速反应，概述现象并记录紧急围堵完成时间；症状已可明确定义时直接进入 D1。</li>
          <li><strong>D1 组建团队</strong>：由组长牵头组建跨职能团队，列出质量、工艺、生产、客户代表等成员与各自职责。</li>
          <li><strong>D2 问题描述（5W2H）</strong>：何物（哪个零件/批次）、何地（在哪发生）、何时、何人发现、程度（多少数量/比例）、如何发现（检验/客诉），把问题量化说清楚。</li>
          <li><strong>D3 临时对策（围堵）</strong>：先保护客户——隔离在库/在途/现场可疑品、全数复测、必要时换货，并验证围堵效果。</li>
          <li><strong>D4 根因分析（5Why）</strong>：发生根因（为什么会产生）与流出根因（为什么没拦住）分别逐层追问，并用再现试验、数据排查等手段验证结论。</li>
          <li><strong>D5 永久对策</strong>：针对每条根因制定永久措施（防错、设计变更、检验项补充等），明确负责人与计划完成日。</li>
          <li><strong>D6 实施与验证</strong>：记录对策实施过程，用实施前后对比数据（不良率、批次合格数）确认有效。</li>
          <li><strong>D7 预防再发</strong>：更新 FMEA、控制计划、SOP 等体系文件，并把措施横向展开到同类产线/产品。</li>
          <li><strong>D8 表彰与关闭</strong>：确认效果固化后关闭报告，总结经验教训并认可团队贡献。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">如何使用本工具</h3>
        <ol class="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-4 leading-relaxed">
          <li>填写报告头信息（编号、产品、客户、负责人与日期），展开可选的 D0 填写紧急响应摘要；</li>
          <li>按 D1-D8 各分区逐项填写，团队成员与永久对策支持多条增删；</li>
          <li>右侧 A4 预览实时更新，对照检查空位与表述；</li>
          <li>点击「打印 / 另存 PDF」输出纸质或 PDF 报告，或「导出 HTML」保存文件归档；</li>
          <li>草稿会自动保存在本机浏览器，下次打开继续填写；也可手动「保存草稿」或「清空草稿」。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">8D 与 CAPA、纠正预防措施的关系</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          8D 是结构化的问题解决方法论，天然覆盖 CAPA（纠正与预防措施）的核心链条：D3 对应纠正（围堵遏制），
          D4 对应根本原因分析，D5/D6 对应纠正措施的实施与验证，D7 对应预防措施（体系文件与横向展开）。
          很多主机厂要求供应商在收到客诉后 24 小时内提交 D1-D3、10 个工作日内提交完整 8D，
          使用本工具可以先把各步骤内容积累起来，再按客户模板整理提交。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见问题（FAQ）</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-foreground">8D 报告必须九个步骤都写吗？</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              视问题严重度与客户要求而定。简单问题可从 D1 直接开始、省略 D0；客户明确要求「D0-D8 齐全」时应完整填写。
              本工具默认渲染全部步骤，便于按最严格口径组织材料，未用到的步骤可写「不适用」。
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">发生根因和流出根因为什么要分开写？</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              发生根因回答「不良是怎么产生的」（人机料法环），流出根因回答「不良为什么没被探测系统拦住」。
              只写发生根因会导致探测控制缺失，同类问题换个渠道还会流出；两者都闭环才是完整的 8D。
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">导出的 HTML 文件怎么用？</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              导出的 HTML 是自带样式的独立文件，双击即可在浏览器打开查看、继续打印或另存 PDF，也可用 Word 打开后再编辑。
              文件保存在你选择的本地位置，不会上传到任何服务器。
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">填写的内容会被上传吗？</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              不会。所有填写、预览、导出都在当前浏览器本地完成，草稿仅保存在本机 localStorage；
              在公共电脑上使用后建议点击「清空草稿」再离开。
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :current-tool-id="'8d-report-generator'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  ClipboardCheck, Printer, Download, Save, Eraser, RefreshCw, Plus, Trash2,
  ChevronUp, ChevronDown, TriangleAlert, Info, Check,
  Users, FileText, ShieldCheck, SearchCheck, Wrench, FileCheck2, Trophy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '8D报告生成器 - 8D报告模板在线填写打印 | 有条工具',
  description: '在线8D报告生成器：按 D0-D8 八步法分步填写客诉整改报告，5W2H问题描述、5Why根因分析、临时围堵与永久对策全结构，A4实时预览可打印另存PDF，支持导出HTML与本地草稿，浏览器本地处理不上传',
  keywords: '8d报告生成器,8d报告模板,客诉整改报告,8d report template,根因分析5why,质量问题分析报告',
  author: '有条工具',
  ogTitle: '8D报告生成器 - D0-D8 八步法报告在线填写 | 有条工具',
  ogDescription: '按 8D 八步法分步填写客诉整改报告，A4 实时预览、打印另存 PDF、导出 HTML，本地处理不上传',
  ogUrl: 'https://www.util.cn/tools/8d-report-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '8D报告生成器 - 8D报告模板在线填写',
  twitterDescription: 'D0-D8 分步填写生成 8D 报告，实时预览可打印，草稿本地保存'
})

// JSON-LD 结构化数据（WebPage + FAQPage，规格指定口径）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          name: '8D报告生成器',
          url: 'https://www.util.cn/tools/8d-report-generator',
          description: '按 D0-D8 八步法分步填写生成 8D 报告：5W2H 问题描述、5Why 根因分析、临时围堵与永久对策，A4 实时预览可打印、可导出 HTML，草稿本地保存。',
          isPartOf: { '@type': 'WebSite', name: '有条工具', url: 'https://www.util.cn/' }
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '8D 报告必须九个步骤都写吗？',
              acceptedAnswer: { '@type': 'Answer', text: '视问题严重度与客户要求而定。简单问题可从 D1 直接开始、省略 D0；客户明确要求 D0-D8 齐全时应完整填写，未用到的步骤可写「不适用」。' }
            },
            {
              '@type': 'Question',
              name: '发生根因和流出根因为什么要分开写？',
              acceptedAnswer: { '@type': 'Answer', text: '发生根因回答不良是怎么产生的（人机料法环），流出根因回答不良为什么没被探测系统拦住；只写发生根因会导致探测控制缺失，两者都闭环才是完整的 8D。' }
            },
            {
              '@type': 'Question',
              name: '导出的 HTML 文件怎么用？',
              acceptedAnswer: { '@type': 'Answer', text: '导出的 HTML 是自带样式的独立文件，双击即可在浏览器打开查看、继续打印或另存 PDF，也可用 Word 打开后编辑，文件保存在本地不上传。' }
            },
            {
              '@type': 'Question',
              name: '填写的内容会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有填写、预览、导出都在当前浏览器本地完成，草稿仅保存在本机 localStorage；公共电脑使用后建议清空草稿再离开。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== PURE-FUNCTIONS-START（可独立 node 单测：不依赖浏览器/Vue） =====
const PLACEHOLDER = '____'
const TEAM_ROLES = ['组长', '质量', '工艺', '生产', '客户代表', '其他']

function escapeHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 文本：空 → 占位下划线，非空 → 转义
function txt(raw) {
  const s = String(raw ?? '').trim()
  return s ? escapeHtml(s) : PLACEHOLDER
}

// 日期：'YYYY-MM-DD' → 'YYYY年M月D日'，空/非法 → 占位
function fmtDate(raw) {
  const m = String(raw || '').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!m) return PLACEHOLDER
  return `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日`
}

// 多行文本（5Why/措施/结论）：保留换行，空 → 占位
function multi(raw) {
  const s = String(raw ?? '').trim()
  return s ? `<span style="white-space:pre-wrap;">${escapeHtml(s)}</span>` : PLACEHOLDER
}

// 草稿规范化：任意输入 → 结构完整的表单对象（供读写草稿与渲染共用）
function normalizeDraft(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const str = (v) => String(v ?? '').slice(0, 4000)
  const rows = (v, mk, max) => (Array.isArray(v) ? v.slice(0, max).map(mk) : [])
  return {
    reportNo: str(r.reportNo),
    productName: str(r.productName),
    customer: str(r.customer),
    supplier: str(r.supplier),
    owner: str(r.owner),
    startDate: str(r.startDate),
    targetCloseDate: str(r.targetCloseDate),
    d0Summary: str(r.d0Summary),
    d0ContainDate: str(r.d0ContainDate),
    team: rows(
      r.team,
      (m) => {
        const o = m && typeof m === 'object' ? m : {}
        const role = TEAM_ROLES.includes(o.role) ? o.role : String(o.role ?? '').trim() ? '其他' : '组长'
        return { name: str(o.name), role, duty: str(o.duty) }
      },
      30
    ),
    d2What: str(r.d2What),
    d2Where: str(r.d2Where),
    d2When: str(r.d2When),
    d2Who: str(r.d2Who),
    d2HowMuch: str(r.d2HowMuch),
    d2HowFound: str(r.d2HowFound),
    d2Attachments: str(r.d2Attachments),
    d3Scope: str(r.d3Scope),
    d3Actions: str(r.d3Actions),
    d3Owner: str(r.d3Owner),
    d3Date: str(r.d3Date),
    d3Verify: str(r.d3Verify),
    d4OccurWhy: str(r.d4OccurWhy),
    d4EscapeWhy: str(r.d4EscapeWhy),
    d4Verify: str(r.d4Verify),
    d5Actions: rows(
      r.d5Actions,
      (a) => {
        const o = a && typeof a === 'object' ? a : {}
        return { cause: str(o.cause), action: str(o.action), owner: str(o.owner), planDate: str(o.planDate) }
      },
      30
    ),
    d6Record: str(r.d6Record),
    d6Before: str(r.d6Before),
    d6After: str(r.d6After),
    d6Date: str(r.d6Date),
    d7Fmea: str(r.d7Fmea),
    d7ControlPlan: str(r.d7ControlPlan),
    d7Sop: str(r.d7Sop),
    d7Rollout: str(r.d7Rollout),
    d8CloseDate: str(r.d8CloseDate),
    d8Lessons: str(r.d8Lessons)
  }
}

// 草稿序列化（localStorage 存什么）
function serializeDraft(form) {
  return JSON.stringify(normalizeDraft(form))
}

// ---------- 预览 HTML 生成器（内联样式：预览与导出共用同一份代码） ----------
const SEC_H = 'font-size:15px;font-weight:bold;margin:16px 0 6px;padding:4px 8px;background:#efefef;border-left:4px solid #333;'
const TBL = 'width:100%;border-collapse:collapse;font-size:12px;'
const TD = 'border:1px solid #888;padding:5px 7px;vertical-align:top;line-height:1.6;'
const THK = TD + 'background:#f5f5f5;width:130px;font-weight:bold;white-space:nowrap;'
const THH = TD + 'background:#f5f5f5;text-align:left;font-weight:bold;'

function kvRow(label, valueHtml) {
  return `<tr><th style="${THK}">${label}</th><td style="${TD}">${valueHtml}</td></tr>`
}
function secHead(no, title) {
  return `<h2 style="${SEC_H}">${no} ${title}</h2>`
}

// 表单 model → 8D 报告主体 HTML（空字段渲染占位下划线；D0-D8 全步骤恒渲染）
function buildReportHtml(form) {
  const f = normalizeDraft(form)
  const team = f.team.length ? f.team : [{ name: '', role: '', duty: '' }]
  const d5 = f.d5Actions.length ? f.d5Actions : [{ cause: '', action: '', owner: '', planDate: '' }]
  const teamRows = team
    .map((m, i) => `<tr><td style="${TD}">${i + 1}</td><td style="${TD}">${txt(m.name)}</td><td style="${TD}">${txt(m.role)}</td><td style="${TD}">${txt(m.duty)}</td></tr>`)
    .join('')
  const d5Rows = d5
    .map(
      (a, i) =>
        `<tr><td style="${TD}">${i + 1}</td><td style="${TD}">${txt(a.cause)}</td><td style="${TD}">${txt(a.action)}</td><td style="${TD}">${txt(a.owner)}</td><td style="${TD}">${fmtDate(a.planDate)}</td></tr>`
    )
    .join('')
  return [
    `<h1 style="text-align:center;font-size:22px;font-weight:bold;margin:0 0 4px;letter-spacing:0.15em;">8D 问题解决报告</h1>`,
    `<p style="text-align:center;font-size:11px;color:#555;margin:0 0 14px;">Eight Disciplines Problem Solving Report（模板参考，流程判定以组织质量体系为准）</p>`,
    `<table style="${TBL}">`,
    `<tr><th style="${THK}">报告编号</th><td style="${TD}">${txt(f.reportNo)}</td><th style="${THK}">产品名称</th><td style="${TD}">${txt(f.productName)}</td></tr>`,
    `<tr><th style="${THK}">客户</th><td style="${TD}">${txt(f.customer)}</td><th style="${THK}">供应商</th><td style="${TD}">${txt(f.supplier)}</td></tr>`,
    `<tr><th style="${THK}">负责人</th><td style="${TD}">${txt(f.owner)}</td><th style="${THK}">开启日期</th><td style="${TD}">${fmtDate(f.startDate)}</td></tr>`,
    `<tr><th style="${THK}">目标关闭日期</th><td style="${TD}">${fmtDate(f.targetCloseDate)}</td><th style="${THK}">实际关闭日期</th><td style="${TD}">${fmtDate(f.d8CloseDate)}</td></tr>`,
    `</table>`,
    secHead('D0', '准备与紧急响应（Emergency Response）'),
    `<table style="${TBL}">${kvRow('现象摘要', multi(f.d0Summary))}${kvRow('紧急响应完成日期', fmtDate(f.d0ContainDate))}</table>`,
    secHead('D1', '组建团队（Team）'),
    `<table style="${TBL}"><tr><th style="${THH}">序号</th><th style="${THH}">姓名</th><th style="${THH}">角色</th><th style="${THH}">职责</th></tr>${teamRows}</table>`,
    secHead('D2', '问题描述（Problem Description · 5W2H）'),
    `<table style="${TBL}">`,
    kvRow('何物 What', txt(f.d2What)),
    kvRow('何地 Where', txt(f.d2Where)),
    kvRow('何时 When', txt(f.d2When)),
    kvRow('何人 Who', txt(f.d2Who)),
    kvRow('程度（多少）', txt(f.d2HowMuch)),
    kvRow('如何发现', txt(f.d2HowFound)),
    kvRow('附件说明', multi(f.d2Attachments)),
    `</table>`,
    secHead('D3', '临时对策（Interim Containment Actions）'),
    `<table style="${TBL}">`,
    kvRow('围堵范围', txt(f.d3Scope)),
    kvRow('临时措施', multi(f.d3Actions)),
    kvRow('负责人', txt(f.d3Owner)),
    kvRow('完成日期', fmtDate(f.d3Date)),
    kvRow('效果验证', multi(f.d3Verify)),
    `</table>`,
    secHead('D4', '根因分析（Root Cause Analysis · 5Why）'),
    `<table style="${TBL}">`,
    kvRow('发生根因（5Why）', multi(f.d4OccurWhy)),
    kvRow('流出根因（5Why）', multi(f.d4EscapeWhy)),
    kvRow('根因验证方法与结论', multi(f.d4Verify)),
    `</table>`,
    secHead('D5', '永久对策（Permanent Corrective Actions）'),
    `<table style="${TBL}"><tr><th style="${THH}">序号</th><th style="${THH}">针对根因</th><th style="${THH}">永久措施</th><th style="${THH}">负责人</th><th style="${THH}">计划完成日</th></tr>${d5Rows}</table>`,
    secHead('D6', '对策实施与效果验证（Implementation & Validation）'),
    `<table style="${TBL}">`,
    kvRow('实施记录', multi(f.d6Record)),
    kvRow('效果数据（实施前）', txt(f.d6Before)),
    kvRow('效果数据（实施后）', txt(f.d6After)),
    kvRow('完成日期', fmtDate(f.d6Date)),
    `</table>`,
    secHead('D7', '预防再发与横向展开（Prevention）'),
    `<table style="${TBL}">`,
    kvRow('FMEA 更新', multi(f.d7Fmea)),
    kvRow('控制计划更新', multi(f.d7ControlPlan)),
    kvRow('SOP / 作业文件更新', multi(f.d7Sop)),
    kvRow('横向展开范围', multi(f.d7Rollout)),
    `</table>`,
    secHead('D8', '团队表彰与关闭（Closure）'),
    `<table style="${TBL}">${kvRow('关闭日期', fmtDate(f.d8CloseDate))}${kvRow('经验教训', multi(f.d8Lessons))}</table>`,
    `<p style="font-size:10px;color:#666;margin-top:14px;text-align:center;">本报告由有条工具 8D 报告生成器生成，模板参考性质；流程判定以组织质量体系（如 IATF 16949）及客户特殊要求为准。</p>`
  ].join('')
}

// 表单 model → 自包含 HTML 文档（导出用，双击即可打开/打印）
function buildExportDocument(form) {
  const inner = buildReportHtml(form)
  return [
    '<!DOCTYPE html>',
    '<html lang="zh-CN">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>8D 问题解决报告</title>',
    '<style>',
    'body{margin:0;padding:24px 12px;background:#f0f0f0;font-family:"SimSun","Songti SC","STSong",serif;color:#111;}',
    '.a4{max-width:210mm;margin:0 auto;background:#fff;padding:14mm 12mm;box-shadow:0 1px 6px rgba(0,0,0,.18);}',
    '@page{size:A4 portrait;margin:0;}',
    '@media print{body{background:#fff;padding:0;}.a4{box-shadow:none;max-width:none;padding:12mm;}}',
    '</style>',
    '</head>',
    '<body><div class="a4">',
    inner,
    '</div></body>',
    '</html>'
  ].join('\n')
}
// ===== PURE-FUNCTIONS-END =====

// ---------- 表单状态 ----------
const EMPTY_FORM = {
  reportNo: '', productName: '', customer: '', supplier: '', owner: '', startDate: '', targetCloseDate: '',
  d0Summary: '', d0ContainDate: '',
  d2What: '', d2Where: '', d2When: '', d2Who: '', d2HowMuch: '', d2HowFound: '', d2Attachments: '',
  d3Scope: '', d3Actions: '', d3Owner: '', d3Date: '', d3Verify: '',
  d4OccurWhy: '', d4EscapeWhy: '', d4Verify: '',
  d6Record: '', d6Before: '', d6After: '', d6Date: '',
  d7Fmea: '', d7ControlPlan: '', d7Sop: '', d7Rollout: '',
  d8CloseDate: '', d8Lessons: ''
}

const form = reactive({
  ...EMPTY_FORM,
  team: [],
  d5Actions: []
})

const seoContentVisible = ref(true)
const draftTip = ref('')

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// 预览 HTML（纯函数生成，全部字段已转义）
const previewHtml = computed(() => buildReportHtml(form))

// ---------- 行操作 ----------
function addTeamRow() {
  form.team.push({ name: '', role: '组长', duty: '' })
}
function removeTeamRow(i) {
  form.team.splice(i, 1)
}
function addD5Row() {
  form.d5Actions.push({ cause: '', action: '', owner: '', planDate: '' })
}
function removeD5Row(i) {
  form.d5Actions.splice(i, 1)
}

// ---------- localStorage 草稿（key 前缀 8d-report-generator） ----------
const DRAFT_KEY = '8d-report-generator.draft-v1'

function saveDraftNow() {
  addRecentTool('8d-report-generator')
  try {
    localStorage.setItem(DRAFT_KEY, serializeDraft(form))
    draftTip.value = '草稿已保存到本机浏览器，下次打开自动载入。'
    trackEvent('工具使用', '保存草稿', '8d-report-generator')
  } catch (e) {
    draftTip.value = ''
    alert('草稿保存失败（浏览器隐私模式或存储空间不足），请手动复制预览内容备份。')
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
    draftTip.value = '已清空本机草稿。'
  } catch (e) {
    draftTip.value = ''
  }
}

function resetForm() {
  Object.keys(EMPTY_FORM).forEach((k) => {
    form[k] = ''
  })
  form.team = []
  form.d5Actions = []
  draftTip.value = ''
}

// ---------- 打印与导出（浏览器 API 仅在用户交互回调内） ----------
function printReport() {
  addRecentTool('8d-report-generator')
  trackEvent('工具结果', '打印', '8d-report-generator')
  window.print()
}

function exportHtml() {
  addRecentTool('8d-report-generator')
  try {
    const doc = buildExportDocument(form)
    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const today = new Date().toISOString().slice(0, 10)
    const tag = String(form.reportNo || form.productName || '').trim() || '草稿'
    a.href = url
    a.download = `8D报告_${tag}_${today}.html`
    a.click()
    URL.revokeObjectURL(url)
    trackEvent('工具转化', '导出HTML', '8d-report-generator')
  } catch (e) {
    alert('导出失败，请使用浏览器「打印 → 另存 PDF」作为替代。')
  }
}

// ---------- 生命周期（localStorage 读写全部只在客户端） ----------
onMounted(() => {
  addRecentTool('8d-report-generator')
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) {
      const restored = normalizeDraft(JSON.parse(raw))
      Object.keys(EMPTY_FORM).forEach((k) => {
        form[k] = restored[k]
      })
      form.team = restored.team
      form.d5Actions = restored.d5Actions
      draftTip.value = '已载入本机草稿（上次填写内容）。'
    }
  } catch (e) {
    // 草稿损坏时静默忽略，使用空表单
  }
  // 自动保存：watcher 注册在 onMounted 内，SSR 阶段不会创建；防抖用 setTimeout 实现
  let saveTimer = null
  watch(
    () => serializeDraft(form),
    () => {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        try {
          localStorage.setItem(DRAFT_KEY, serializeDraft(form))
        } catch (e) {
          // 隐私模式 / 配额不足时静默
        }
      }, 800)
    }
  )
})
</script>

<style scoped>
.input-base {
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  color: hsl(var(--foreground));
  font-size: 0.875rem;
  outline: none;
}
.input-base:focus {
  box-shadow: 0 0 0 2px hsl(var(--ring));
}
details summary::-webkit-details-marker {
  display: none;
}
.a4-paper {
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
@media print {
  .no-print {
    display: none !important;
  }
  .print-area {
    box-shadow: none;
  }
  .a4-paper {
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  .bg-white {
    border: none !important;
    box-shadow: none !important;
  }
}
</style>

<style>
@media print {
  header {
    display: none !important;
  }
}
@page {
  size: A4 portrait;
  margin: 0;
}
</style>
