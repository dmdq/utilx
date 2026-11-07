<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- A4 打印页边距 -->
    <component :is="'style'" v-html="printPageCss"></component>

    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ListChecks class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">离职交接清单生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">通用 / 研发 / 销售 / 运营 / 财务五套岗位模板，事项+位置+状态+备注逐行填写，Markdown 导出与 A4 表格打印，本地草稿自动保存</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线离职交接清单生成工具：按「工作职责与在途事项 / 账号与资产 / 文档与知识库 / 关键联系人 / 待办与风险提示」五大分区组织交接要素，
        勾选岗位模板（通用 + 研发、销售、运营、财务）一键预填清单行，每行可填事项、位置（存放 / 载体）、移交状态（已移交 / 待移交）、
        接收人与备注；顶部记录移交人、接收人、交接日期，底部留三方签字栏。已移交进度条实时联动；支持导出 Markdown（复制到剪贴板）
        与 A4 表格版式打印。草稿自动保存在浏览器本地（localStorage），不上传任何数据。
      </p>
    </div>

    <div class="print-grid grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：设置 -->
      <div class="no-print space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ListChecks class="w-5 h-5 mr-2 text-primary" /> 岗位模板
          </h2>

          <!-- 通用模板固定包含 -->
          <label class="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm bg-primary/10 border-primary/40 text-primary font-medium">
            <input type="checkbox" checked disabled class="accent-primary w-4 h-4" />
            通用（固定包含）
          </label>

          <!-- 岗位模板多选 -->
          <div class="space-y-2">
            <label
              v-for="role in ROLE_OPTIONS"
              :key="role.id"
              class="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition"
              :class="selectedRoles.includes(role.id) ? 'bg-primary/10 border-primary/40 text-primary font-medium' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'"
            >
              <input
                type="checkbox"
                class="accent-primary w-4 h-4"
                :checked="selectedRoles.includes(role.id)"
                @change="toggleRole(role.id, $event)"
              />
              {{ role.label }}
              <span class="text-xs text-muted-foreground ml-auto">+{{ role.count }} 行</span>
            </label>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>模板要素按通行离职交接实践整理（职责与在途、账号权限、文档、客户 / 对接人、财务与风险），为通用参考而非法律意见，请结合公司制度与双方约定增删。</span>
          </p>
        </div>

        <!-- 表头三栏 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold">交接信息</h2>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-muted-foreground mb-1">移交人</label>
              <input v-model="header.from" type="text" :class="SEL_CLS" placeholder="姓名" />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">接收人</label>
              <input v-model="header.to" type="text" :class="SEL_CLS" placeholder="姓名" />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">部门 / 岗位</label>
              <input v-model="header.dept" type="text" :class="SEL_CLS" placeholder="如：研发部 / 后端" />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">交接日期</label>
              <input v-model="header.date" type="date" :class="SEL_CLS" />
            </div>
          </div>
        </div>

        <!-- 导出与打印 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold">导出</h2>
          <div class="grid grid-cols-1 gap-2">
            <button
              @click="copyMarkdown"
              class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
            >
              <Copy class="w-4 h-4" /> 复制 Markdown 交接单
            </button>
            <button
              @click="printSheet"
              class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
            >
              <Printer class="w-4 h-4" /> A4 打印 / 另存 PDF
            </button>
            <button
              @click="resetDraft"
              class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs text-muted-foreground transition flex items-center justify-center gap-1.5"
            >
              <Trash2 class="w-3.5 h-3.5" /> 清空草稿并恢复默认模板
            </button>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Markdown 可直接粘贴进飞书 / 语雀 / Notion / GitHub Issue；打印为 A4 竖版表格，行内未填写的「接收人」列留空供手写签字。
          </p>
        </div>
      </div>

      <!-- 右：清单编辑区 -->
      <div class="lg:col-span-2">
        <!-- 进度条 -->
        <div class="bg-card border border-border rounded-lg p-4 mb-4 no-print">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-foreground">移交进度</span>
            <span class="text-sm text-muted-foreground">已移交 {{ doneCount }} / {{ rows.length }} 项（{{ progressPct }}%）</span>
          </div>
          <div class="h-2.5 bg-muted rounded-full overflow-hidden">
            <div class="h-full bg-primary rounded-full transition-all" :style="{ width: progressPct + '%' }"></div>
          </div>
        </div>

        <!-- 分区清单 -->
        <div class="space-y-4 no-print">
          <div v-for="sec in SECTIONS" :key="sec.id" class="bg-card border border-border rounded-lg overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
              <h3 class="font-semibold text-foreground text-sm">{{ sec.no }} {{ sec.name }}</h3>
              <button
                type="button"
                class="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground flex items-center gap-1"
                @click="addRow(sec.id)"
              >
                <Plus class="w-3.5 h-3.5" /> 添加行
              </button>
            </div>
            <div class="divide-y divide-border">
              <div
                v-for="row in rowsBySection[sec.id]"
                :key="row.id"
                class="p-3 space-y-2"
                :class="row.status === 'done' ? 'bg-primary/5' : ''"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="shrink-0 w-[74px] px-2 py-1.5 rounded-lg text-xs font-medium border transition"
                    :class="row.status === 'done' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'"
                    @click="setRow(row.id, 'status', row.status === 'done' ? 'pending' : 'done')"
                  >
                    <CheckCircle v-if="row.status === 'done'" class="w-3.5 h-3.5 inline mr-0.5 -mt-0.5" />
                    {{ row.status === 'done' ? '已移交' : '待移交' }}
                  </button>
                  <input
                    :value="row.text"
                    type="text"
                    class="flex-1 min-w-[160px] px-2 py-1.5 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="交接事项"
                    @input="setRow(row.id, 'text', $event.target.value)"
                  />
                  <button
                    v-if="row.custom"
                    type="button"
                    class="shrink-0 p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    title="删除本行"
                    @click="removeRow(row.id)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <input
                    :value="row.place"
                    type="text"
                    class="flex-1 min-w-[120px] px-2 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="位置 / 载体（如：GitLab · ops-docs 仓库）"
                    @input="setRow(row.id, 'place', $event.target.value)"
                  />
                  <input
                    :value="row.signee"
                    type="text"
                    class="w-[110px] px-2 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="接收人（可手签）"
                    @input="setRow(row.id, 'signee', $event.target.value)"
                  />
                  <input
                    :value="row.note"
                    type="text"
                    class="flex-1 min-w-[120px] px-2 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="备注"
                    @input="setRow(row.id, 'note', $event.target.value)"
                  />
                </div>
              </div>
              <p v-if="!rowsBySection[sec.id] || rowsBySection[sec.id].length === 0" class="text-xs text-muted-foreground px-4 py-3">
                本分区暂无条目，点右上「添加行」补充。
              </p>
            </div>
          </div>
        </div>

        <!-- 签字栏（屏幕预览） -->
        <div class="bg-card border border-border rounded-lg p-4 mt-4 no-print flex flex-wrap gap-6 text-sm text-muted-foreground">
          <span>移交人签字：{{ header.from || '________' }}</span>
          <span>接收人签字：{{ header.to || '________' }}</span>
          <span>日期：{{ header.date || '____年__月__日' }}</span>
        </div>
      </div>
    </div>

    <!-- A4 打印版式（仅打印时显示） -->
    <div class="print-sheet">
      <p class="ps-title">工作交接清单</p>
      <p class="ps-meta">
        移交人：{{ header.from || '________' }}　　接收人：{{ header.to || '________' }}　　部门 / 岗位：{{ header.dept || '________' }}　　交接日期：{{ header.date || '____年__月__日' }}
      </p>
      <div v-for="sec in SECTIONS" :key="'p' + sec.id">
        <p class="ps-sec">{{ sec.no }} {{ sec.name }}</p>
        <table class="ps-table">
          <thead>
            <tr>
              <th class="w-item">交接事项</th>
              <th class="w-place">位置 / 载体</th>
              <th class="w-status">状态</th>
              <th class="w-sign">接收人</th>
              <th class="w-note">备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rowsBySection[sec.id]" :key="'p' + row.id">
              <td>{{ row.text }}</td>
              <td>{{ row.place }}</td>
              <td>{{ row.status === 'done' ? '已移交' : '待移交' }}</td>
              <td>{{ row.signee }}</td>
              <td>{{ row.note }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="ps-sign">
        移交人签字：________________　　接收人签字：________________　　部门负责人确认：________________　　日期：____________
      </p>
      <p class="ps-foot">
        说明：本清单为通用参考模板，交接义务依据《劳动合同法》第五十条「劳动者应当按照双方约定，办理工作交接」；
        账号类交接通过公司密码管理工具或管理员改密完成，不在本表填写任何密码明文。
      </p>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="no-print group bg-card border border-border rounded-lg mb-12">
      <summary class="cursor-pointer select-none px-6 py-4 text-lg font-semibold text-foreground flex items-center justify-between">
        <span><span class="text-primary mr-2">#</span>离职交接清单为什么重要？应该包含哪些内容？</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div class="px-6 pb-6">
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          离职交接清单是离职流程中移交人、接收人与公司三方对齐的书面凭据：它把「哪些事、哪些账号资产、哪些文档、哪些人脉关系、哪些风险」逐行列出，
          逐项标注移交状态并签字确认。对移交人而言，一份签认完毕的交接单是「已履行交接义务」的证明；对接收人而言，它是快速接手的地图；
          对公司而言，它降低了账号悬空、在途事项断档、客户关系流失的风险。
          本工具把通行交接要素整理为五大分区——① 工作职责与在途事项、② 账号与资产（含位置 / 载体与接收人栏）、③ 文档与知识库、
          ④ 关键联系人、⑤ 待办与风险提示——并预置研发、销售、运营、财务四套岗位模板，可自由勾选叠加。模板为通用参考，请按公司制度增删。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">交接义务的法律依据</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          《中华人民共和国劳动合同法》第五十条规定：「用人单位应当在解除或者终止劳动合同时出具解除或者终止劳动合同的证明，并在十五日内为劳动者办理档案和社会保险关系转移手续。
          <strong>劳动者应当按照双方约定，办理工作交接。</strong>用人单位依照本法有关规定应当向劳动者支付经济补偿的，在办结工作交接时支付。」
          也就是说：交接义务以「双方约定」为基础，且经济补偿的支付与办结工作交接相关联——按时、完整地完成交接，对移交人和公司都是保护。
          本页内容为通用参考，不构成法律意见，具体以劳动合同、公司制度与当地规定为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">五大分区怎么用？</h3>
        <div class="overflow-x-auto mb-4">
          <table class="w-full border-collapse border border-border text-sm">
            <thead>
              <tr class="bg-muted">
                <th class="border border-border px-3 py-2 text-left">分区</th>
                <th class="border border-border px-3 py-2 text-left">要点</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-border px-3 py-2">① 工作职责与在途事项</td>
                <td class="border border-border px-3 py-2">列明日常工作职责、进行中项目 / 商机 / 活动的进度与截止时间，标注接手优先级</td>
              </tr>
              <tr>
                <td class="border border-border px-3 py-2">② 账号与资产</td>
                <td class="border border-border px-3 py-2">逐项写清名称与位置（系统 / 仓库 / 存放处），账号走管理员改密或密码管理工具移交，<strong>不要在任何清单里写密码明文</strong>；设备、门禁卡、UKey 等实物归还留签字栏</td>
              </tr>
              <tr>
                <td class="border border-border px-3 py-2">③ 文档与知识库</td>
                <td class="border border-border px-3 py-2">文档归档到团队共享空间并更新目录 / 权限，重要流程写操作手册而不是口头交待</td>
              </tr>
              <tr>
                <td class="border border-border px-3 py-2">④ 关键联系人</td>
                <td class="border border-border px-3 py-2">内部接口人、外部客户 / 供应商 / 渠道对接人移交，注明合作背景与注意事项</td>
              </tr>
              <tr>
                <td class="border border-border px-3 py-2">⑤ 待办与风险提示</td>
                <td class="border border-border px-3 py-2">未完成事项、回款 / 未核销票据、舆情与线上风险等，书面说明避免口头遗漏</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Markdown 和打印版式怎么选？</h3>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          需要进协作工具流转（飞书 / 语雀 / Notion / 邮件归档）时，用「复制 Markdown」直接粘贴，表格结构自动保留；
          需要三方签字归档（HR 存档、纸质流程）时，用 A4 打印版式——每分区一张表，行内未填写的「接收人」列留空供手写签字，页尾含移交人 / 接收人 / 部门负责人三方签字栏。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">账号密码应该写在交接清单里吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不应该。清单里只写「账号名称 + 位置 + 移交状态」，密码通过公司密码管理工具共享、或由管理员统一改密后分发，避免明文扩散带来安全与合规风险。本工具的模板也刻意不设密码栏。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">交接清单需要谁签字？</h3>
            <p class="text-sm text-muted-foreground mt-1">通行做法是三方签字：移交人、接收人、部门负责人（或 HR）确认。打印版式页尾已预留三方签字栏与日期栏；签认后的清单建议移交人、接收人、HR 各留一份。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">不办交接会有什么后果？</h3>
            <p class="text-sm text-muted-foreground mt-1">依据《劳动合同法》第五十条，劳动者应当按照双方约定办理工作交接，且经济补偿在办结工作交接时支付；拒绝交接可能影响补偿支付节奏，也可能因给公司造成损失而承担赔偿责任。对公司而言，未及时安排交接导致的风险同样需要管理层承担。具体以劳动合同约定与司法实践为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">请假单等其他单据在哪生成？</h3>
            <p class="text-sm text-muted-foreground mt-1">站内<a href="/tools/leave-note-generator/" class="text-primary underline">请假申请单打印</a>工具可生成 A4 请假条，配合本页交接清单一起走完离职 / 长假前的流程单据。</p>
          </div>
        </div>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :currentToolId="'handover-checklist-generator'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  ListChecks, Printer, Copy, CheckCircle, Trash2, Plus, Info, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '离职交接清单生成器 - 工作交接模板（研发/销售/运营/财务）Markdown 导出与 A4 打印',
  description: '免费在线离职交接清单生成工具：五大分区（职责与在途事项/账号与资产/文档知识库/关键联系人/待办风险）+ 通用研发销售运营财务岗位模板，逐行填写事项、位置、移交状态与备注，进度条实时联动，支持 Markdown 复制导出与 A4 表格打印，草稿本地自动保存，不上传数据',
  keywords: '离职交接清单,工作交接模板,交接清单生成,研发交接,销售交接,财务交接,离职流程,交接单打印',
  author: '有条工具',
  ogTitle: '离职交接清单生成器 - 五套岗位模板一键生成 | 有条工具',
  ogDescription: '五大分区 + 岗位模板勾选适配，Markdown 导出与 A4 打印，草稿本地保存。交接义务依据劳动合同法第五十条。',
  ogUrl: 'https://www.util.cn/tools/handover-checklist-generator',
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
          name: '离职交接清单生成器',
          url: 'https://www.util.cn/tools/handover-checklist-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '五大分区：职责与在途/账号与资产/文档知识库/关键联系人/待办与风险',
            '通用与研发、销售、运营、财务岗位模板勾选叠加',
            '逐行填写事项、位置、移交状态、接收人与备注',
            '已移交进度条实时联动',
            'Markdown 复制导出与 A4 表格打印（含三方签字栏）',
            'localStorage 草稿本地保存，不上传数据'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '离职交接清单生成器', item: 'https://www.util.cn/tools/handover-checklist-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '账号密码应该写在交接清单里吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不应该。清单只写账号名称、位置与移交状态，密码通过密码管理工具共享或由管理员改密后分发，避免明文扩散的安全与合规风险。' }
            },
            {
              '@type': 'Question',
              name: '交接清单需要谁签字？',
              acceptedAnswer: { '@type': 'Answer', text: '通行做法是三方签字：移交人、接收人、部门负责人或 HR 确认，签认后各方各留一份存档。打印版式已预留三方签字栏。' }
            },
            {
              '@type': 'Question',
              name: '交接义务的法律依据是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '劳动合同法第五十条规定：劳动者应当按照双方约定，办理工作交接；用人单位应当向劳动者支付经济补偿的，在办结工作交接时支付。本工具模板为通用参考，不构成法律意见。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 五大分区定义
const SECTIONS = [
  { id: 1, no: '①', name: '工作职责与在途事项' },
  { id: 2, no: '②', name: '账号与资产' },
  { id: 3, no: '③', name: '文档与知识库' },
  { id: 4, no: '④', name: '关键联系人' },
  { id: 5, no: '⑤', name: '待办与风险提示' }
]

// 岗位模板：通用固定包含，其余按需勾选（s=分区号；不涉及任何密码明文）
const ROLE_TEMPLATES = {
  general: [
    { s: 1, text: '日常工作职责与分工说明' },
    { s: 1, text: '在途工作事项清单（事项 / 进度 / 接手建议）' },
    { s: 1, text: '进行中项目的关键节点与截止日期' },
    { s: 2, text: '企业邮箱账号与邮件归档移交' },
    { s: 2, text: 'OA / 办公系统账号移交或注销' },
    { s: 2, text: '门禁卡 / 工牌 / 工位钥匙归还' },
    { s: 2, text: '办公电脑及外设归还（含序列号）' },
    { s: 2, text: '借用的图书 / 设备 / 资料归还' },
    { s: 3, text: '工作文档归档至团队知识库' },
    { s: 3, text: '本地文件与共享盘目录移交' },
    { s: 4, text: '内部协作接口人清单（对接部门 / 事项）' },
    { s: 4, text: '外部合作方联系人移交' },
    { s: 5, text: '未完成待办及风险点书面说明' },
    { s: 5, text: '保密义务与资料带出确认' }
  ],
  dev: [
    { s: 1, text: '代码仓库权限与维护模块移交' },
    { s: 1, text: '在途分支与未合并 MR / PR 清单' },
    { s: 1, text: '线上服务与告警值班交接' },
    { s: 2, text: '开发 / 测试环境账号移交' },
    { s: 2, text: '服务器（生产 / 测试）登录权限移交' },
    { s: 2, text: 'VPN 与堡垒机权限回收' },
    { s: 2, text: '内部工具平台账号移交' },
    { s: 3, text: '技术设计文档与架构说明归档' },
    { s: 3, text: '接口文档与部署手册更新' },
    { s: 4, text: '跨团队技术对接人移交' },
    { s: 5, text: '线上已知问题与 backlog 风险说明' }
  ],
  sales: [
    { s: 1, text: '在途商机与跟进计划移交' },
    { s: 1, text: '本期销售目标完成进度说明' },
    { s: 2, text: 'CRM 客户数据与客户名单移交' },
    { s: 2, text: '客户合同台账移交' },
    { s: 2, text: '样品机 / 演示设备归还' },
    { s: 3, text: '客户拜访记录与沟通纪要归档' },
    { s: 3, text: '报价单与方案模板移交' },
    { s: 4, text: '重点客户对接人信息移交' },
    { s: 4, text: '渠道伙伴与供应商联系人移交' },
    { s: 5, text: '回款进度与应收风险提示' },
    { s: 5, text: '未决客户投诉与售后事项说明' }
  ],
  ops: [
    { s: 1, text: '在途活动与排期表移交' },
    { s: 1, text: '内容发布计划与更新频率说明' },
    { s: 2, text: '各平台账号移交（经管理员改密，不走明文）' },
    { s: 2, text: '素材库与图库版权资料移交' },
    { s: 2, text: '社群与用户组管理权移交' },
    { s: 3, text: '运营数据看板与周报模板移交' },
    { s: 3, text: '活动复盘文档归档' },
    { s: 4, text: '合作方 / 达人 / 媒体资源联系人移交' },
    { s: 5, text: '舆情风险与用户投诉跟进说明' }
  ],
  finance: [
    { s: 1, text: '在途账务处理事项移交（凭证 / 对账）' },
    { s: 1, text: '月结 / 报税日历与申报进度说明' },
    { s: 2, text: '财务系统（账套）权限与操作员移交' },
    { s: 2, text: '网银 UKey / 数字证书归还' },
    { s: 2, text: '发票与开票设备移交' },
    { s: 2, text: '银行回单与对账单归档移交' },
    { s: 2, text: '印鉴 / 网银盾保管移交' },
    { s: 3, text: '会计凭证与账簿归档移交' },
    { s: 3, text: '财务制度与报销流程文档移交' },
    { s: 4, text: '银行 / 税务 / 审计对接人移交' },
    { s: 5, text: '未核销票据与员工借款清理说明' },
    { s: 5, text: '税务与合规风险提示' }
  ]
}

// 勾选角色集合 → 清单行（含编号 id 与自定义标记）。rows 按 分区 → 模板顺序 排列
function buildRows(selectedRoles, customRows) {
  const roles = Array.isArray(selectedRoles) ? selectedRoles : []
  const order = ['general', 'dev', 'sales', 'ops', 'finance'].filter((r) => roles.includes(r))
  const rows = []
  for (const role of order) {
    const tpl = ROLE_TEMPLATES[role] || []
    tpl.forEach((item, idx) => {
      rows.push({
        id: role + ':' + item.s + ':' + idx,
        section: item.s,
        text: item.text,
        place: '',
        status: 'pending',
        signee: '',
        note: '',
        custom: false
      })
    })
  }
  for (const c of Array.isArray(customRows) ? customRows : []) {
    rows.push({
      id: c.id,
      section: c.section,
      text: c.text || '',
      place: c.place || '',
      status: c.status === 'done' ? 'done' : 'pending',
      signee: c.signee || '',
      note: c.note || '',
      custom: true
    })
  }
  return rows
}

// 应用用户覆盖（编辑内容 / 状态切换），仅覆盖存在的字段与行
function applyOverrides(rows, overrides) {
  const ov = overrides && typeof overrides === 'object' ? overrides : {}
  return rows.map((r) => {
    const o = ov[r.id]
    if (!o || typeof o !== 'object') return r
    return {
      ...r,
      text: typeof o.text === 'string' ? o.text : r.text,
      place: typeof o.place === 'string' ? o.place : r.place,
      status: o.status === 'done' ? 'done' : 'pending',
      signee: typeof o.signee === 'string' ? o.signee : r.signee,
      note: typeof o.note === 'string' ? o.note : r.note
    }
  })
}

// 进度统计：已移交数 / 总数
function progressOf(rows) {
  const list = Array.isArray(rows) ? rows : []
  const done = list.filter((r) => r.status === 'done').length
  return { done, total: list.length, pct: list.length === 0 ? 0 : Math.round((done / list.length) * 100) }
}

// Markdown 导出：标题 + 交接信息 + 五分区表格
function buildMarkdown(title, header, sections, rows) {
  const list = Array.isArray(rows) ? rows : []
  const secs = Array.isArray(sections) ? sections : []
  const h = header && typeof header === 'object' ? header : {}
  const lines = []
  lines.push('# ' + String(title || '工作交接清单'))
  lines.push('')
  lines.push('- 移交人：' + (h.from || '________'))
  lines.push('- 接收人：' + (h.to || '________'))
  lines.push('- 部门 / 岗位：' + (h.dept || '________'))
  lines.push('- 交接日期：' + (h.date || '____年__月__日'))
  for (const sec of secs) {
    lines.push('')
    lines.push('## ' + sec.no + ' ' + sec.name)
    lines.push('')
    lines.push('| 交接事项 | 位置 / 载体 | 状态 | 接收人 | 备注 |')
    lines.push('| --- | --- | --- | --- | --- |')
    const secRows = list.filter((r) => r.section === sec.id)
    if (secRows.length === 0) {
      lines.push('| （无） | | | | |')
    }
    for (const r of secRows) {
      const esc = (v) => String(v || '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
      lines.push('| ' + esc(r.text) + ' | ' + esc(r.place) + ' | ' + (r.status === 'done' ? '已移交' : '待移交') + ' | ' + esc(r.signee) + ' | ' + esc(r.note) + ' |')
    }
  }
  lines.push('')
  lines.push('> 交接义务依据《劳动合同法》第五十条：劳动者应当按照双方约定，办理工作交接。账号密码通过密码管理工具或管理员改密移交，不写入本清单。')
  return lines.join('\n')
}

// 草稿反序列化（localStorage JSON → 状态），非法输入回退默认
function parseDraft(raw) {
  try {
    const d = JSON.parse(String(raw))
    if (!d || typeof d !== 'object') return null
    return {
      selectedRoles: Array.isArray(d.selectedRoles) ? d.selectedRoles.filter((r) => ['dev', 'sales', 'ops', 'finance'].includes(r)) : [],
      overrides: d.overrides && typeof d.overrides === 'object' ? d.overrides : {},
      customRows: Array.isArray(d.customRows) ? d.customRows : [],
      header: d.header && typeof d.header === 'object'
        ? {
            from: String(d.header.from || ''),
            to: String(d.header.to || ''),
            dept: String(d.header.dept || ''),
            date: String(d.header.date || '')
          }
        : { from: '', to: '', dept: '', date: '' }
    }
  } catch (e) {
    return null
  }
}

// ---------- 页面状态与交互 ----------
const ROLE_OPTIONS = [
  { id: 'dev', label: '研发', count: ROLE_TEMPLATES.dev.length },
  { id: 'sales', label: '销售', count: ROLE_TEMPLATES.sales.length },
  { id: 'ops', label: '运营', count: ROLE_TEMPLATES.ops.length },
  { id: 'finance', label: '财务', count: ROLE_TEMPLATES.finance.length }
]

const SEL_CLS = 'w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'
const DRAFT_KEY = 'handover-checklist-draft-v1'

const selectedRoles = ref(['general']) // 通用固定包含
const overrides = ref({})
const customRows = ref([])
const header = ref({ from: '', to: '', dept: '', date: '' })
const draftLoaded = ref(false)

// rows：模板行（按勾选角色）+ 自定义行，再叠加用户编辑
const rows = computed(() => applyOverrides(buildRows(selectedRoles.value, customRows.value), overrides.value))

const rowsBySection = computed(() => {
  const map = {}
  for (const sec of SECTIONS) map[sec.id] = []
  for (const r of rows.value) {
    if (!map[r.section]) map[r.section] = []
    map[r.section].push(r)
  }
  return map
})

const progress = computed(() => progressOf(rows.value))
const doneCount = computed(() => progress.value.done)
const progressPct = computed(() => progress.value.pct)

// 勾选 / 取消岗位模板：保留已编辑内容（overrides 按 id 记忆）
function toggleRole(id, e) {
  const checked = e.target.checked
  const next = checked ? [...selectedRoles.value, id] : selectedRoles.value.filter((r) => r !== id)
  selectedRoles.value = ['general', 'dev', 'sales', 'ops', 'finance'].filter((r) => next.includes(r) || r === 'general')
}

function setRow(rowId, field, value) {
  const cur = overrides.value[rowId] || {}
  overrides.value = { ...overrides.value, [rowId]: { ...cur, [field]: value } }
}

let customSeq = 0
function addRow(sectionId) {
  customSeq += 1
  customRows.value = [
    ...customRows.value,
    { id: 'custom:' + sectionId + ':' + Date.now() + ':' + customSeq, section: sectionId, text: '', place: '', status: 'pending', signee: '', note: '' }
  ]
}

function removeRow(rowId) {
  customRows.value = customRows.value.filter((r) => r.id !== rowId)
  const next = { ...overrides.value }
  delete next[rowId]
  overrides.value = next
}

function printSheet() {
  window.print()
}

async function copyMarkdown() {
  const md = buildMarkdown('工作交接清单', header.value, SECTIONS, rows.value)
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(md)
    } else {
      const ta = document.createElement('textarea')
      ta.value = md
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    window.alert('已复制')
  } catch (err) {
    window.alert('复制失败，请手动选择内容复制')
  }
}

// 草稿：localStorage 本地保存（仅客户端）
function saveDraft() {
  if (!draftLoaded.value) return
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      selectedRoles: selectedRoles.value,
      overrides: overrides.value,
      customRows: customRows.value,
      header: header.value
    }))
  } catch (e) { /* 存储失败（如隐私模式）静默忽略 */ }
}

function resetDraft() {
  if (typeof localStorage !== 'undefined') {
    try { localStorage.removeItem(DRAFT_KEY) } catch (e) { /* 忽略 */ }
  }
  selectedRoles.value = ['general']
  overrides.value = {}
  customRows.value = []
  header.value = { from: '', to: '', dept: '', date: '' }
  window.alert('已清空草稿并恢复默认模板')
}

watch([selectedRoles, overrides, customRows, header], saveDraft, { deep: true })

const printPageCss = '@page { size: A4 portrait; margin: 12mm; }'

onMounted(() => {
  // 恢复本地草稿（SSR 阶段不执行）
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const d = parseDraft(raw)
        if (d) {
          selectedRoles.value = ['general', ...d.selectedRoles]
          overrides.value = d.overrides
          customRows.value = d.customRows
          header.value = d.header
        }
      }
    } catch (e) { /* 忽略损坏草稿 */ }
  }
  draftLoaded.value = true
  addRecentTool('handover-checklist-generator')
})
</script>

<style scoped>
/* A4 打印版式：屏幕隐藏，打印显示 */
.print-sheet {
  display: none;
}
.ps-title {
  font-size: 18pt;
  font-weight: 700;
  text-align: center;
  margin-bottom: 4mm;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.ps-meta {
  font-size: 9pt;
  color: #374151;
  border-bottom: 1.5px solid #d1d5db;
  padding-bottom: 3mm;
  margin-bottom: 5mm;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.ps-sec {
  font-size: 11pt;
  font-weight: 700;
  margin: 4mm 0 2mm;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.ps-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5pt;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.ps-table th,
.ps-table td {
  border: 0.5px solid #9ca3af;
  padding: 1.6mm 2mm;
  text-align: left;
  vertical-align: top;
  word-break: break-all;
}
.ps-table th {
  background: #f3f4f6;
  font-weight: 600;
}
.w-item { width: 34%; }
.w-place { width: 20%; }
.w-status { width: 10%; }
.w-sign { width: 14%; }
.w-note { width: 22%; }
.ps-sign {
  margin-top: 8mm;
  font-size: 9.5pt;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.ps-foot {
  margin-top: 5mm;
  font-size: 7.5pt;
  color: #6b7280;
  line-height: 1.6;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

@media print {
  .no-print {
    display: none !important;
  }
  .print-grid {
    display: block !important;
  }
  :global(main) {
    overflow: visible !important;
    height: auto !important;
  }
  .print-sheet {
    display: block !important;
  }
  .ps-table {
    break-inside: auto;
  }
  .ps-table tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
</style>
