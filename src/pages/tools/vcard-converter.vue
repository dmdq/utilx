<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Contact class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">vCard联系人转换</h1>
          <p class="text-sm text-muted-foreground mt-1">CSV/TSV 与 vCard(.vcf) 双向转换，通讯录批量导入手机免手输，纯本地转换</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 vCard 转换工具：CSV / TSV 联系人表自动识别逗号 / 制表符分隔，表头按常见字段名自动映射（可手动调整），生成 vCard 3.0 (.vcf) 直接导入手机通讯录；
        反向解析 vCard（自动合并折行、反转义）导出带 UTF-8 BOM 的 CSV，Excel 双击直开。姓名按中文惯例启发式拆分姓 / 名，
        多电话按分隔符拆成多条 TEL，全部转换在你的浏览器本地完成，数据不上传。
      </p>
      <div class="mt-3 flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2.5">
        <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p class="text-xs text-primary leading-relaxed">通讯录属于最敏感的个人数据：本工具解析与生成全部在浏览器内完成，不上传任何服务器。</p>
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h2 class="text-lg font-semibold flex items-center">
            <FileUp class="w-5 h-5 mr-2 text-primary" /> 输入联系人数据
          </h2>
          <!-- 方向切换 -->
          <div class="flex items-center gap-1">
            <button
              @click="setDirection('c2v')"
              :class="direction === 'c2v' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            >CSV → vCard</button>
            <button
              @click="setDirection('v2c')"
              :class="direction === 'v2c' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            >vCard → CSV</button>
          </div>
        </div>

        <!-- 上传区 -->
        <div
          class="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
          :class="{ 'border-primary/60 bg-primary/5': isDragging }"
          @click="triggerFileSelect"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <input
            ref="fileInput"
            type="file"
            :accept="direction === 'c2v' ? '.csv,.tsv,.txt,text/csv,text/plain' : '.vcf,.txt,text/vcard,text/plain'"
            class="hidden"
            @change="handleFileChange"
          />
          <FileCheck v-if="fileName" class="w-6 h-6 mx-auto mb-1.5 text-primary" />
          <FileUp v-else class="w-6 h-6 mx-auto mb-1.5 text-muted-foreground" />
          <p v-if="fileName" class="text-xs font-medium text-foreground truncate">{{ fileName }}（{{ formatSize(fileSize) }}）</p>
          <p v-else class="text-xs text-muted-foreground">
            点击选择或拖入 {{ direction === 'c2v' ? '.csv / .tsv' : '.vcf' }} 文件，或在下方粘贴
          </p>
        </div>

        <!-- 编码告警 -->
        <div v-if="mojibakeCount > 0" class="mt-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5">
          <TriangleAlert class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            检测到 {{ mojibakeCount.toLocaleString() }} 个替换符（U+FFFD）：数据很可能是 GBK / GB2312 编码（Excel 导出的 CSV 常见这种情况）。
            请先用 <NuxtLink to="/tools/file-encoding-converter" class="underline font-medium">文件编码转换</NuxtLink> 工具转为 UTF-8 再转换，否则姓名电话会变成乱码。
          </p>
        </div>

        <textarea
          v-model="inputText"
          class="mt-3 w-full h-44 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          :placeholder="direction === 'c2v'
            ? '粘贴 CSV / TSV 数据，例如：\n姓名,电话,邮箱,组织,备注\n张三,13800138000/13900139000,zhang@example.com,示例公司,同事'
            : '粘贴 vCard 文本，例如：\nBEGIN:VCARD\nVERSION:3.0\nN:张;三;;;\nFN:张三\nTEL;TYPE=CELL:13800138000\nEND:VCARD'"
          spellcheck="false"
        ></textarea>

        <!-- CSV→vCard：表头映射 -->
        <div v-if="direction === 'c2v' && csvHeaders.length" class="mt-4 bg-muted/40 border border-border rounded-lg p-3">
          <h3 class="text-xs font-semibold text-foreground mb-1 flex items-center justify-between">
            <span class="flex items-center"><Settings2 class="w-3.5 h-3.5 mr-1 text-primary" /> 列映射（已按常见表头名自动猜列，可手动调整）</span>
            <span class="text-[10px] font-normal text-muted-foreground">分隔符：{{ detectedDelimiterLabel }}</span>
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <label v-for="t in mappingTargets" :key="t.key" class="flex items-center gap-2">
              <span class="text-xs text-foreground w-14 flex-shrink-0 flex items-center gap-1">
                <component :is="t.icon" class="w-3.5 h-3.5 text-muted-foreground" />{{ t.label }}
              </span>
              <select
                v-model="mapping[t.key]"
                class="flex-1 min-w-0 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option :value="-1">不使用</option>
                <option v-for="(h, idx) in csvHeaders" :key="idx" :value="idx">{{ columnLetter(idx) }}. {{ h || '(空列名)' }}</option>
              </select>
            </label>
          </div>
          <p class="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            姓 / 名拆分按中文惯例启发式：含空格或「·」按分隔拆，≥3 字中文名取第一字为姓（复姓如「欧阳」会被拆开，导入后可在手机里微调）；
            单元格内多个电话用 / 或 ；分隔会拆成多条 TEL。
          </p>
        </div>

        <div class="mt-4 flex gap-2">
          <button
            @click="clearAll"
            :disabled="!inputText && !fileName"
            class="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5"
          >
            <Trash2 class="w-3.5 h-3.5" /> 清空
          </button>
          <button
            v-if="direction === 'c2v' && csvHeaders.length"
            @click="autoGuessMapping"
            class="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <Replace class="w-3.5 h-3.5" /> 重新自动猜列
          </button>
        </div>

        <!-- 解析规则说明 -->
        <div class="mt-4 bg-muted/40 border border-border rounded-lg p-3">
          <h3 class="text-xs font-semibold text-foreground mb-1.5 flex items-center">
            <Settings2 class="w-3.5 h-3.5 mr-1 text-primary" /> 转换规则
          </h3>
          <ul class="text-[11px] text-muted-foreground space-y-1 leading-relaxed">
            <li v-if="direction === 'c2v'">• 输出 vCard 3.0：N（姓;名）、FN、TEL;TYPE=CELL（多电话多行）、EMAIL、ORG、NOTE，空字段跳过</li>
            <li v-if="direction === 'c2v'">• 值中的 \ ; , 按规范转义（\、\;、\,），换行转 \n，导入手机后原样还原</li>
            <li v-if="direction === 'c2v'">• 全空的行自动跳过；姓名为空时以电话 / 邮箱占位 FN，保证 vCard 合法</li>
            <li v-if="direction === 'v2c'">• 兼容 vCard 2.1 / 3.0 / 4.0 与 iPhone 导出的 item1.TEL 分组写法，自动合并按规范折行（CRLF + 空格）的长行</li>
            <li v-if="direction === 'v2c'">• 多条 TEL / EMAIL 合并到同一单元格（用 ；分隔），导出 CSV 再转回 vCard 不丢电话</li>
            <li v-if="direction === 'v2c'">• 导出 CSV 全字段引号包裹（内部引号双写）并带 UTF-8 BOM，Excel 双击直开不乱码</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：结果 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 转换结果
          </h2>
          <div v-if="hasResult && !resultError" class="flex items-center gap-1.5 flex-wrap">
            <button
              @click="copyOutput"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition-colors"
            >
              <Copy class="w-3.5 h-3.5" /> 复制
            </button>
            <button
              @click="downloadOutput"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Download class="w-3.5 h-3.5" /> 下载 {{ direction === 'c2v' ? '.vcf' : '.csv' }}
            </button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!hasInput" class="py-14 text-center text-muted-foreground">
          <Contact class="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p class="text-sm">{{ direction === 'c2v' ? '粘贴或上传 CSV / TSV 后这里生成 vCard' : '粘贴或上传 .vcf 后这里生成 CSV' }}</p>
          <p class="text-xs mt-1">微信通讯录、QQ 同步助手导出的表格均可直接转换</p>
        </div>

        <!-- 错误 -->
        <div v-else-if="resultError" class="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2.5">
          <TriangleAlert class="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p class="text-xs text-destructive leading-relaxed">{{ resultError }}</p>
        </div>

        <!-- 结果：CSV→vCard 文本预览 -->
        <div v-else-if="direction === 'c2v'" class="space-y-3">
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">联系人</p>
              <p class="text-lg font-bold text-foreground">{{ c2vResult.stats.contacts }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">电话</p>
              <p class="text-lg font-bold text-foreground">{{ c2vResult.stats.phones }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">数据行</p>
              <p class="text-lg font-bold text-foreground">{{ csvDataRowCount }}</p>
            </div>
          </div>
          <div v-if="c2vResult.stats.skippedRows > 0" class="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">有 {{ c2vResult.stats.skippedRows }} 行全空或无有效字段，已自动跳过。</p>
          </div>
          <div class="bg-muted/30 border border-border rounded-lg p-4">
            <pre class="text-[11px] text-foreground whitespace-pre-wrap break-all leading-relaxed max-h-[420px] overflow-y-auto font-mono">{{ c2vResult.vcards }}</pre>
          </div>
        </div>

        <!-- 结果：vCard→CSV 表格预览 -->
        <div v-else class="space-y-3">
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">联系人</p>
              <p class="text-lg font-bold text-foreground">{{ v2cResult.contacts.length }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">电话</p>
              <p class="text-lg font-bold text-foreground">{{ v2cResult.stats.phoneCount }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">多电话联系人</p>
              <p class="text-lg font-bold text-foreground">{{ v2cResult.stats.multiPhoneContacts }}</p>
            </div>
          </div>
          <div class="bg-muted/30 border border-border rounded-lg overflow-x-auto max-h-[420px] overflow-y-auto">
            <table class="w-full text-xs">
              <thead class="bg-muted/60 sticky top-0">
                <tr>
                  <th class="px-2.5 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">#</th>
                  <th v-for="col in csvPreviewColumns" :key="col" class="px-2.5 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">{{ col }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="(c, i) in csvPreviewRows" :key="i" class="hover:bg-muted/40">
                  <td class="px-2.5 py-1.5 text-muted-foreground">{{ i + 1 }}</td>
                  <td class="px-2.5 py-1.5 text-foreground whitespace-nowrap">{{ c.displayName }}</td>
                  <td class="px-2.5 py-1.5 text-foreground">{{ c.tels.join('；') }}</td>
                  <td class="px-2.5 py-1.5 text-foreground">{{ c.emails.join('；') }}</td>
                  <td class="px-2.5 py-1.5 text-foreground">{{ c.org }}</td>
                  <td class="px-2.5 py-1.5 text-muted-foreground max-w-[160px] truncate" :title="c.note">{{ c.note }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[10px] text-muted-foreground text-right">仅预览前 {{ csvPreviewRows.length }} 条，共 {{ v2cResult.contacts.length }} 条联系人</p>
        </div>

        <!-- 编码诚实说明 -->
        <div v-if="hasResult && !resultError" class="mt-4 flex items-start gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2.5">
          <Info class="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            编码说明：Excel 导出的 CSV 通常是 GBK 编码，直接喂给本工具会出现乱码（上方会告警）；本工具导出的 CSV 已带 UTF-8 BOM，Excel 双击可直开。
            如遇乱码，请先用 <NuxtLink to="/tools/file-encoding-converter" class="text-primary hover:underline">文件编码转换</NuxtLink> 工具统一为 UTF-8。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 vCard 联系人转换</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            vCard（.vcf）是手机通讯录的通用交换格式，iOS / Android / 微信导入联系人时都认它；而大多数人手里的联系人数据是 Excel 或表格软件导出的 CSV。
            本工具打通两个方向：CSV / TSV 表格按表头映射生成 vCard 3.0（含 N 姓 / 名拆分、多电话拆成多条 TEL、按 vCard 规范转义特殊字符），
            反向把 vCard（自动处理 RFC 规定的 CRLF + 空格折行、反转义）解析后导出带 UTF-8 BOM 的 CSV，Excel 双击直开不乱码。
            全部解析与生成都在浏览器本地完成，通讯录数据不出设备。
          </p>

          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>把 Excel 客户名单 / 班级联系表批量导入手机通讯录，免去几百个联系人手输</li>
            <li>从微信、QQ 同步助手、旧手机导出的 vcf 提取到表格，整理后再导回新手机</li>
            <li>换机、双卡、工作号分离场景下的通讯录搬运与清洗</li>
            <li>把 CRM / 邮件列表导出的 CSV 转成 vcf 给同事一键导入</li>
          </ul>

          <h3 class="text-lg font-semibold text-foreground">姓名的姓 / 名是怎么拆的？</h3>
          <p>
            vCard 的 N 字段要求「姓;名」分开，而 CSV 里通常只有一列姓名。本工具按中文命名惯例启发式拆分：
            含空格或间隔号「·」时按分隔符拆；不含空格且 ≥3 个汉字的中文名取第一个字为姓、其余为名；两字名各取一字；
            纯英文名按西方惯例取最后一个单词为姓。这是惯例近似——复姓（欧阳、司马等）会被拆错，页面在映射区已注明，导入后在手机里微调即可。
          </p>

          <h3 class="text-lg font-semibold text-foreground">Excel 打开 CSV 乱码怎么办？</h3>
          <p>
            中文 Windows 的 Excel 导出 CSV 默认是 GBK / ANSI 编码，按 UTF-8 读取就会出现替换符（U+FFFD），本工具检测到时会在输入区明确告警。
            解决办法：先用站内 <NuxtLink to="/tools/file-encoding-converter" class="text-primary hover:underline">文件编码转换</NuxtLink>
            工具把 CSV 转成 UTF-8 再上传。反方向本工具已做好：导出的 CSV 带UTF-8 BOM，Excel 直接双击打开即可正确显示中文。
          </p>

          <h3 class="text-lg font-semibold text-foreground">本地处理和在线转换网站有什么区别？</h3>
          <p>
            通讯录是个人数据里最敏感的一类：姓名、手机号、邮箱、公司、备注。在线转换服务需要把整份数据上传到对方服务器，存在被存储、转卖或泄露的风险。
            本工具从文件读取、解析到 vCard / CSV 生成全部发生在你的浏览器里，数据不出本地设备，断网也能用。
          </p>

          <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
          <div class="space-y-4">
            <div>
              <h3 class="text-base font-semibold text-foreground">生成的 vcf 能导入哪些手机？</h3>
              <p class="text-sm text-muted-foreground mt-1">生成的是 vCard 3.0 标准格式，iPhone（邮件 / 文件发送后打开）、Android（通讯录导入）、微信（收藏后用其他应用打开）均可导入。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">一个单元格里存了多个电话怎么办？</h3>
              <p class="text-sm text-muted-foreground mt-1">CSV → vCard 方向会把以 / 或 ；（含半角 ;）分隔的多个号码拆成多条 TEL 行；vCard → CSV 方向把多条 TEL 合并回同一单元格（；分隔），再转回 vCard 不会丢电话。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">表头列名不规范能转换吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">能。工具先按常见表头名（姓名 / name、电话 / 手机 / phone / mobile、邮箱 / email、公司 / 组织 / org、备注 / note 等）自动猜列，猜错或没猜到时用下拉框手动指定任意列。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">名字里带「欧阳」等复姓会拆错吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">会按「第一个字是姓」的惯例拆成 欧 / 阳，这是启发式的已知局限。可以先在表格里用空格写开（如「欧阳 锋」）再转换，或导入手机后手动微调。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">联系人数据会被上传吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">不会。解析、转义、生成全部在浏览器本地完成，通讯录数据不出你的设备，断网状态下也可以正常使用。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'vcard-converter'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Contact, FileUp, FileCheck, Download, Copy, Trash2, TriangleAlert, ChevronUp,
  ChevronDown, Info, Settings2, CheckCircle, UsersRound, Phone, Mail, Building2,
  StickyNote, Replace
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'vCard联系人转换 - CSV转vcf/vcf转CSV通讯录转换器',
  description: '在线 vCard 转换工具，CSV/TSV 表格按表头映射生成 vCard 3.0 (vcf) 批量导入手机通讯录，支持 vcf 转 CSV 导出 Excel 直开（UTF-8 BOM），姓名姓/名拆分与多电话拆分，纯本地处理不上传',
  keywords: 'vcard转换,csv转vcf,vcf转csv,通讯录导入,联系人转换,vcf文件制作,微信通讯录导入,手机通讯录批量导入',
  author: '有条工具',
  ogTitle: 'vCard联系人转换 - 有条工具',
  ogDescription: 'CSV/TSV 与 vCard 双向转换，通讯录批量导入手机免手输，数据不上传',
  ogUrl: 'https://www.util.cn/tools/vcard-converter',
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
          name: 'vCard联系人转换',
          url: 'https://www.util.cn/tools/vcard-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['CSV/TSV 转 vCard 3.0', 'vCard 转 CSV（UTF-8 BOM，Excel 直开）', '表头自动猜列与手动映射', '姓/名中文惯例启发式拆分', '多电话拆分为多条 TEL', 'vCard 折行合并与反转义', '纯本地转换不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'vCard联系人转换', item: 'https://www.util.cn/tools/vcard-converter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '生成的 vcf 能导入哪些手机？',
              acceptedAnswer: { '@type': 'Answer', text: '生成的是 vCard 3.0 标准格式，iPhone（邮件 / 文件发送后打开）、Android（通讯录导入）、微信均可导入。' }
            },
            {
              '@type': 'Question',
              name: '一个单元格里存了多个电话怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: 'CSV → vCard 方向会把以 / 或 ；（含半角 ;）分隔的多个号码拆成多条 TEL 行；vCard → CSV 方向把多条 TEL 合并回同一单元格（；分隔），再转回 vCard 不会丢电话。' }
            },
            {
              '@type': 'Question',
              name: '表头列名不规范能转换吗？',
              acceptedAnswer: { '@type': 'Answer', text: '能。工具先按常见表头名（姓名 / name、电话 / 手机 / phone / mobile、邮箱 / email、公司 / 组织 / org、备注 / note 等）自动猜列，猜错时用下拉框手动指定任意列。' }
            },
            {
              '@type': 'Question',
              name: '名字里带「欧阳」等复姓会拆错吗？',
              acceptedAnswer: { '@type': 'Answer', text: '会按「第一个字是姓」的惯例拆开，这是启发式的已知局限；可以先在表格里用空格写开（如「欧阳 锋」）再转换，或导入手机后手动微调。' }
            },
            {
              '@type': 'Question',
              name: '联系人数据会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。解析、转义、生成全部在浏览器本地完成，通讯录数据不出你的设备，断网状态下也可以正常使用。' }
            }
          ]
        }
      ]
    })
  }]
})

// ================== 纯逻辑（SENTINEL: VCARD_PURE_BEGIN） ==================
// 说明：本区块不依赖 Vue 与任何浏览器 API，可被 node 脚本整段提取后独立单测。

// ---------- CSV / TSV 解析（引号字段、双写引号、字段内换行） ----------
function parseDelimited(text, delim) {
  const s = String(text == null ? '' : text).replace(/^\uFEFF/, '')
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { field += '"'; i += 2; continue }
        inQuotes = false; i++; continue
      }
      field += ch; i++; continue
    }
    if (ch === '"' && field === '') { inQuotes = true; i++; continue }
    if (ch === delim) { row.push(field); field = ''; i++; continue }
    if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && s[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''; i++; continue
    }
    field += ch; i++
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows.filter(r => r.length > 1 || (r.length === 1 && String(r[0]).trim() !== ''))
}

// 自动识别逗号 / 制表符分隔（看前 3 行哪种出现更多）
function detectDelimiter(text) {
  const head = String(text == null ? '' : text).split('\n').slice(0, 3).join('\n')
  const commas = (head.match(/,/g) || []).length
  const tabs = (head.match(/\t/g) || []).length
  return tabs > commas ? '\t' : ','
}

// 表头别名表（精确匹配优先，其次包含匹配）
const HEADER_ALIASES = {
  name: ['姓名', '名字', '联系人', 'name', 'full name', 'fullname', 'contact'],
  phone: ['电话', '手机', '手机号', '电话号码', '号码', '联系方式', 'phone', 'mobile', 'tel', 'telephone', 'cell'],
  email: ['邮箱', '电子邮件', '电子邮箱', '邮件', 'email', 'e-mail', 'mail'],
  org: ['组织', '公司', '单位', 'organization', 'org', 'company', 'employer'],
  note: ['备注', '说明', '注释', 'note', 'notes', 'remark', 'memo', 'comment']
}

// 按常见表头名猜列映射：{ name: idx|-1, phone, email, org, note }
function guessColumnMapping(headers) {
  const hs = Array.isArray(headers) ? headers : []
  const norm = h => String(h || '').trim().toLowerCase()
  const map = {}
  for (const key of Object.keys(HEADER_ALIASES)) {
    let idx = -1
    for (let i = 0; i < hs.length; i++) {
      if (HEADER_ALIASES[key].indexOf(norm(hs[i])) !== -1) { idx = i; break }
    }
    if (idx === -1) {
      for (let i = 0; i < hs.length; i++) {
        const h = norm(hs[i])
        if (h && HEADER_ALIASES[key].some(a => a.length >= 2 && h.indexOf(a) !== -1)) { idx = i; break }
      }
    }
    map[key] = idx
  }
  return map
}

// 多值电话拆分：以 / 、；; 、（顿号）分隔，去掉空段
function splitPhoneCell(value) {
  return String(value == null ? '' : value)
    .split(/[\/；;、]/)
    .map(p => p.trim())
    .filter(Boolean)
}

// 姓 / 名拆分启发式（惯例近似，页面注明可改）：
// 含空格或「·」→ 按分隔拆（CJK 段姓在前，纯西文名姓在后）；无分隔的 ≥2 字中文名取第一字为姓
function splitNameHeuristic(fullName) {
  const raw = String(fullName == null ? '' : fullName).trim().replace(/\s+/g, ' ')
  if (!raw) return { family: '', given: '' }
  const hasCJK = /[\u3400-\u4dbf\u4e00-\u9fff]/.test(raw)
  if (/[\s·]/.test(raw)) {
    const tokens = raw.split(/[\s·]+/).filter(Boolean)
    if (tokens.length >= 2) {
      if (tokens.some(t => /[\u3400-\u4dbf\u4e00-\u9fff]/.test(t))) {
        return { family: tokens[0], given: tokens.slice(1).join('') }
      }
      return { family: tokens[tokens.length - 1], given: tokens.slice(0, -1).join(' ') }
    }
    return { family: raw, given: '' }
  }
  if (hasCJK && raw.length >= 2) return { family: raw.charAt(0), given: raw.slice(1) }
  return { family: raw, given: '' }
}

// 无 FN 时由 N 组成显示名：中文姓在前，西文名在前
function composeDisplayName(family, given) {
  const f = String(family == null ? '' : family).trim()
  const g = String(given == null ? '' : given).trim()
  if (f && g) return /[\u3400-\u4dbf\u4e00-\u9fff]/.test(f) ? f + g : g + ' ' + f
  return f || g
}

// vCard 值转义（RFC 6350）：\ → \\，换行 → \n，; → \;，, → \,（反斜杠必须最先处理）
function vcardEscape(value) {
  return String(value == null ? '' : value)
    .replace(/\\/g, '\\\\')
    .replace(/\r\n/g, '\\n')
    .replace(/\r/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

// vCard 值反转义：逐字符扫描，\n/\N → 换行，\, \; \\ 还原，未知转义保留原样
function vcardUnescape(value) {
  const s = String(value == null ? '' : value)
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '\\' && i + 1 < s.length) {
      const nxt = s[i + 1]
      if (nxt === 'n' || nxt === 'N') { out += '\n'; i++ }
      else if (nxt === ',' || nxt === ';' || nxt === '\\') { out += nxt; i++ }
      else { out += ch }
    } else {
      out += ch
    }
  }
  return out
}

// 合并折行（RFC 2426 / 6350）：折行 = CRLF + 单个空白字符，展开时移除 CRLF 并保留该空白
// （若把空白一并吞掉，'hello\r\n world' 会错变成 'helloworld'）
function unfoldLines(text) {
  return String(text == null ? '' : text)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n(?=[ \t])/g, '')
}

// 按「不在双引号内的第一个冒号」拆属性名与值（兼容 TYPE="a:b" 这类带引号参数）
function splitPropertyLine(line) {
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') inQuotes = !inQuotes
    else if (ch === ':' && !inQuotes) return { head: line.slice(0, i), value: line.slice(i + 1) }
  }
  return null
}

// 按未转义的 ; 拆 N / ORG 的值组件（先保 \x 原样，再逐段反转义）
function splitValueComponents(value) {
  const s = String(value == null ? '' : value)
  const parts = []
  let cur = ''
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '\\' && i + 1 < s.length) { cur += ch + s[i + 1]; i++; continue }
    if (ch === ';') { parts.push(cur); cur = ''; continue }
    cur += ch
  }
  parts.push(cur)
  return parts.map(p => vcardUnescape(p))
}

// 解析 vCard 文本 → 联系人数组
function parseVcard(text) {
  const lines = unfoldLines(text).split('\n')
  const contacts = []
  let cur = null
  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, '')
    const trimmed = line.trim()
    if (/^BEGIN:VCARD$/i.test(trimmed)) {
      cur = { nFamily: '', nGiven: '', fn: '', tels: [], emails: [], org: '', note: '' }
      continue
    }
    if (/^END:VCARD$/i.test(trimmed)) {
      if (cur) pushContact(contacts, cur)
      cur = null
      continue
    }
    if (!cur || !trimmed) continue
    const split = splitPropertyLine(line)
    if (!split) continue
    // 去掉 iPhone 导出的 item1. 分组前缀
    const propName = split.head.split(';')[0].trim().replace(/^item\d+\./i, '').toUpperCase()
    const value = split.value
    if (propName === 'FN') {
      cur.fn = vcardUnescape(value).trim()
    } else if (propName === 'N') {
      const comps = splitValueComponents(value)
      cur.nFamily = String(comps[0] || '').trim()
      cur.nGiven = String(comps[1] || '').trim()
    } else if (propName === 'TEL') {
      const tel = vcardUnescape(value).trim()
      if (tel) cur.tels.push(tel)
    } else if (propName === 'EMAIL') {
      const mail = vcardUnescape(value).trim()
      if (mail) cur.emails.push(mail)
    } else if (propName === 'ORG') {
      cur.org = splitValueComponents(value).join(';')
    } else if (propName === 'NOTE') {
      const note = vcardUnescape(value)
      cur.note = cur.note ? cur.note + '\n' + note : note
    }
  }
  if (cur) pushContact(contacts, cur) // 缺 END 的宽容处理
  return { ok: true, contacts, error: '' }
}

function pushContact(contacts, cur) {
  const displayName = cur.fn || composeDisplayName(cur.nFamily, cur.nGiven) || cur.tels[0] || cur.emails[0] || '未命名'
  contacts.push({
    displayName,
    nFamily: cur.nFamily,
    nGiven: cur.nGiven,
    tels: cur.tels,
    emails: cur.emails,
    org: cur.org,
    note: cur.note
  })
}

// CSV 字段输出：全字段引号包裹、内部引号双写
function csvEscapeField(value) {
  return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"'
}

// 联系人 → CSV（UTF-8 BOM + \r\n 行尾，Excel 直开）
function contactsToCsv(contacts) {
  const list = Array.isArray(contacts) ? contacts : []
  const rows = [['姓名', '电话', '邮箱', '组织', '备注']]
  for (const c of list) {
    rows.push([
      c.displayName || '',
      (c.tels || []).join('；'),
      (c.emails || []).join('；'),
      c.org || '',
      c.note || ''
    ])
  }
  return '\uFEFF' + rows.map(r => r.map(csvEscapeField).join(',')).join('\r\n')
}

// CSV/TSV → vCard 3.0 文本
function csvToVcard(text, mapping) {
  const delim = detectDelimiter(text)
  const rows = parseDelimited(text, delim)
  if (!rows.length) {
    return { ok: false, vcards: '', stats: { contacts: 0, phones: 0, skippedRows: 0 }, error: '没有解析到任何数据行，请检查内容与分隔符。' }
  }
  const mapped = Object.keys(mapping).some(k => Number(mapping[k]) >= 0)
  if (!mapped) {
    return { ok: false, vcards: '', stats: { contacts: 0, phones: 0, skippedRows: 0 }, error: '请至少为「姓名 / 电话 / 邮箱 / 组织 / 备注」指定一列映射。' }
  }
  const dataRows = rows.slice(1)
  const get = (row, key) => {
    const idx = Number(mapping[key])
    if (!(idx >= 0) || idx >= row.length) return ''
    return String(row[idx] == null ? '' : row[idx]).trim()
  }
  const cards = []
  let phoneCount = 0
  let skipped = 0
  for (const row of dataRows) {
    const name = get(row, 'name')
    const phones = splitPhoneCell(get(row, 'phone'))
    const email = get(row, 'email')
    const org = get(row, 'org')
    const note = get(row, 'note')
    if (!name && !phones.length && !email && !org && !note) { skipped++; continue }
    const { family, given } = splitNameHeuristic(name)
    const fn = name || phones[0] || email || org || '未命名'
    let v = 'BEGIN:VCARD\r\nVERSION:3.0\r\n'
    v += 'N:' + vcardEscape(family) + ';' + vcardEscape(given) + ';;;\r\n'
    v += 'FN:' + vcardEscape(fn) + '\r\n'
    for (const p of phones) v += 'TEL;TYPE=CELL:' + vcardEscape(p) + '\r\n'
    phoneCount += phones.length
    if (email) v += 'EMAIL:' + vcardEscape(email) + '\r\n'
    if (org) v += 'ORG:' + vcardEscape(org) + '\r\n'
    if (note) v += 'NOTE:' + vcardEscape(note) + '\r\n'
    v += 'END:VCARD'
    cards.push(v)
  }
  return {
    ok: true,
    vcards: cards.length ? cards.join('\r\n') + '\r\n' : '',
    stats: { contacts: cards.length, phones: phoneCount, skippedRows: skipped },
    error: ''
  }
}
// ================== 纯逻辑（SENTINEL: VCARD_PURE_END） ====================

// ---------- 状态 ----------
const direction = ref('c2v') // c2v: CSV→vCard | v2c: vCard→CSV
const inputText = ref('')
const fileName = ref('')
const fileSize = ref(0)
const isDragging = ref(false)
const fileInput = ref(null)
const mapping = ref({ name: -1, phone: -1, email: -1, org: -1, note: -1 })

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const mappingTargets = [
  { key: 'name', label: '姓名', icon: UsersRound },
  { key: 'phone', label: '电话', icon: Phone },
  { key: 'email', label: '邮箱', icon: Mail },
  { key: 'org', label: '组织', icon: Building2 },
  { key: 'note', label: '备注', icon: StickyNote }
]

// ---------- 派生数据 ----------
const hasInput = computed(() => Boolean(inputText.value.trim()))

const mojibakeCount = computed(() => (inputText.value.match(/\uFFFD/g) || []).length)

// CSV→vCard 侧
const csvParsed = computed(() => {
  if (direction.value !== 'c2v' || !inputText.value.trim()) return null
  const delim = detectDelimiter(inputText.value)
  return { delim, rows: parseDelimited(inputText.value, delim) }
})

const csvHeaders = computed(() => {
  const p = csvParsed.value
  return p && p.rows.length ? p.rows[0].map(h => String(h || '').trim()) : []
})

const csvDataRowCount = computed(() => {
  const p = csvParsed.value
  return p ? Math.max(p.rows.length - 1, 0) : 0
})

const detectedDelimiterLabel = computed(() => {
  const p = csvParsed.value
  if (!p) return ''
  return p.delim === '\t' ? '制表符 Tab' : '逗号'
})

const c2vResult = computed(() => {
  const p = csvParsed.value
  if (!p) return { ok: false, vcards: '', stats: { contacts: 0, phones: 0, skippedRows: 0 }, error: '' }
  return csvToVcard(inputText.value, mapping.value)
})

// vCard→CSV 侧
const v2cResult = computed(() => {
  if (direction.value !== 'v2c' || !hasInput.value) {
    return { contacts: [], stats: { phoneCount: 0, multiPhoneContacts: 0 }, error: '' }
  }
  const parsed = parseVcard(inputText.value)
  const contacts = parsed.contacts
  const phoneCount = contacts.reduce((sum, c) => sum + c.tels.length, 0)
  const multiPhoneContacts = contacts.filter(c => c.tels.length > 1).length
  return { contacts, stats: { phoneCount, multiPhoneContacts }, error: '' }
})

const resultError = computed(() => {
  if (direction.value === 'c2v') return c2vResult.value.error
  return v2cResult.value.error
})

const hasResult = computed(() => {
  if (!hasInput.value) return false
  if (direction.value === 'c2v') return c2vResult.value.ok && c2vResult.value.stats.contacts > 0
  return v2cResult.value.contacts.length > 0
})

const csvPreviewColumns = ['姓名', '电话', '邮箱', '组织', '备注']
const csvPreviewRows = computed(() => v2cResult.value.contacts.slice(0, 10))

// 输入变化时重新自动猜列（手动改过映射后，输入内容变化也会重猜）
watch([inputText, direction], () => {
  if (direction.value === 'c2v') autoGuessMapping()
})

function autoGuessMapping() {
  mapping.value = guessColumnMapping(csvHeaders.value)
}

const columnLetter = (idx) => String.fromCharCode(65 + (idx % 26))

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 交互 ----------
const setDirection = (d) => {
  direction.value = d
  fileName.value = ''
  fileSize.value = 0
}

const clearAll = () => {
  inputText.value = ''
  fileName.value = ''
  fileSize.value = 0
  mapping.value = { name: -1, phone: -1, email: -1, org: -1, note: -1 }
}

const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const acceptFile = async (f) => {
  if (!f) return
  fileName.value = f.name
  fileSize.value = f.size
  try {
    inputText.value = await f.text()
  } catch (e) {
    inputText.value = ''
  }
}

const handleFileChange = (e) => {
  const files = e.target.files
  if (files && files.length > 0) acceptFile(files[0])
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer && e.dataTransfer.files
  if (files && files.length > 0) acceptFile(files[0])
}

const copyOutput = async () => {
  const text = direction.value === 'c2v' ? c2vResult.value.vcards : contactsToCsv(v2cResult.value.contacts).replace(/^\uFEFF/, '')
  if (!text) return
  let ok = false
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      ok = true
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      ok = document.execCommand('copy')
      document.body.removeChild(ta)
    }
  } catch (e) {
    ok = false
  }
  alert(ok ? '已复制到剪贴板（不含 BOM）' : '复制失败，请在预览区手动选中复制')
}

const downloadBaseName = computed(() => {
  const base = (fileName.value || '').replace(/\.[^.]+$/, '')
  return base || 'contacts'
})

const triggerDownload = (blob, name) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadOutput = () => {
  if (!hasResult.value) return
  if (direction.value === 'c2v') {
    triggerDownload(new Blob([c2vResult.value.vcards], { type: 'text/vcard;charset=utf-8' }), downloadBaseName.value + '.vcf')
  } else {
    // contactsToCsv 已带 UTF-8 BOM，Excel 双击直开
    triggerDownload(new Blob([contactsToCsv(v2cResult.value.contacts)], { type: 'text/csv;charset=utf-8' }), downloadBaseName.value + '.csv')
  }
}

onMounted(() => {
  addRecentTool('vcard-converter')
})
</script>
