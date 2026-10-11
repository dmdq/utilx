<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Scissors class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Excel地址姓名拆列</h1>
          <p class="text-sm text-muted-foreground mt-1">地址智能拆省市区、姓名拆姓/名（识别复姓），批量回填新列，杂乱地址也能拆</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传 xlsx / csv，选中地址列可拆出省、市、区、详细地址（内置 34 个省级行政区全称简称与 160+ 城市前缀，支持"内蒙古""新疆维吾尔自治区"等简称与全称混写）；选中姓名列可拆出姓、名（内置 18 个复姓表，自动处理空格分隔与少数民族姓名）。拆分结果可预览并导出 xlsx，全部在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 设置区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <FileSpreadsheet class="w-5 h-5 mr-2 text-primary" /> 数据与拆分设置
        </h2>

        <label class="block border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:bg-muted/50 transition">
          <Upload class="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          <span class="text-sm text-muted-foreground">{{ table ? table.fileName : '点击选择 xlsx / csv 文件' }}</span>
          <input type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="onFile" />
        </label>

        <template v-if="table">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">要拆分的列</label>
            <select v-model.number="targetCol" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option v-for="(h, i) in table.headers" :key="i" :value="i">{{ h }}</option>
            </select>
            <p class="text-xs text-muted-foreground mt-1.5">共 {{ table.totalRows }} 行数据，{{ table.headers.length }} 列</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">拆分模式</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="splitMode = 'address'"
                :class="splitMode === 'address' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >地址拆省市区</button>
              <button
                @click="splitMode = 'name'"
                :class="splitMode === 'name' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >姓名拆姓/名</button>
            </div>
            <p class="text-xs text-muted-foreground mt-2">
              {{ splitMode === 'address' ? '新增列：省、市、区、详细地址；拆不出市/区时对应列留空，剩余部分归入详细地址' : '新增列：姓、名、备注；复姓自动识别，含间隔号的少数民族姓名整串保留并提示' }}
            </p>
          </div>

          <button
            @click="exportXlsx"
            :disabled="!result || !result.rows.length"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download class="w-4 h-4" /> 导出含新列的 xlsx
          </button>
        </template>
      </div>

      <!-- 预览区 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center mb-4">
          <Eye class="w-5 h-5 mr-2 text-primary" />
          拆分预览
          <span v-if="result" class="ml-2 text-sm text-muted-foreground font-normal">（前 {{ Math.min(10, result.rows.length) }} 行，共 {{ result.rows.length }} 行）</span>
        </h2>

        <div v-if="result && result.rows.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground border-b border-border">
                <th class="py-2 pr-4 font-medium whitespace-nowrap">原内容</th>
                <th v-for="(h, i) in result.newCols" :key="i" class="py-2 pr-4 font-medium whitespace-nowrap text-primary">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, r) in result.rows.slice(0, 10)" :key="r" class="border-b border-border/50">
                <td class="py-2 pr-4 text-muted-foreground whitespace-nowrap">{{ row.raw === '' ? '—' : row.raw }}</td>
                <td v-for="(cell, c) in row.cells" :key="c" class="py-2 pr-4 text-foreground whitespace-nowrap">{{ cell === '' ? '—' : cell }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground text-sm">
          <template v-if="table">该列没有可拆分的数据行</template>
          <template v-else>上传文件并选择要拆分的列后，这里会显示拆分预览</template>
        </div>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        说明：地址拆分基于内置行政区划词库（34 个省级行政区 + 主要地级市前缀），无法识别的地级市、自治州或县级市会被归入"详细地址"；姓名拆分按复姓表与空格规则处理，少数民族姓名等特殊结构会整串保留并给出备注。数据只在浏览器本地解析，不会上传。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于地址与姓名拆列</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            电商收货地址、客户登记表中经常出现"浙江省杭州市西湖区文三路100号"这类连写地址，做分省统计、物流分仓时必须先拆出省市区；花名册里的"欧阳修"式姓名要拆姓/名做称呼与排序，又得防着复姓误拆。本工具把这两类高频清洗需求做成一键批量处理，输出新列并回填导出。
          </p>
          <h3 class="text-lg font-semibold text-foreground">地址是怎么拆出省市区的</h3>
          <p>
            内置 34 个省级行政区的全称与简称词库（如"内蒙古/内蒙古自治区""广西壮族自治区/广西""香港特别行政区/香港"），按最长匹配从字符串头部逐级消耗：先匹配省，再在剩余部分匹配地级市（160+ 主要城市前缀，直辖市的"市辖区"按市本身处理），再取到区/县/旗为止的前缀作为区，剩下的全部归入"详细地址"；拆不出市时市、区留空，保证每行都有确定输出。
          </p>
          <h3 class="text-lg font-semibold text-foreground">姓名拆分与复姓识别</h3>
          <p>
            内置欧阳、司马、上官、诸葛、东方、夏侯、皇甫、尉迟、公孙、长孙、慕容、司徒、端木、宇文、西门、南宫、百里、令狐共 18 个复姓，命中则姓取 2 字，否则取 1 字；含空格的姓名按空格分段取姓；含间隔号"·"的少数民族姓名结构特殊，整串保留在姓名列并在备注中提示无法拆分。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">县级市会拆到哪一列？</span>如"昆山市"不在地级市词库中，会按"区"级处理拆入"区"列，或随剩余文本进入"详细地址"列。</li>
            <li><span class="text-foreground font-medium">地址缺少省份开头能拆吗？</span>可以，省列会留空，从城市开始继续拆，例如"杭州市西湖区文二路8号"可拆出杭州市与西湖区。</li>
            <li><span class="text-foreground font-medium">数据会泄露吗？</span>不会，解析与拆分全部在浏览器内存中完成，没有任何网络请求。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'excel-column-splitter'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Scissors, FileSpreadsheet, Upload, Download, Eye, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Excel地址姓名拆列 - 地址拆省市区、姓名拆姓/名',
  description: '上传 xlsx/csv 一键把地址列拆出省市区与详细地址（34 省级区划+160城市词库），姓名列智能识别 18 个复姓拆姓/名，批量回填新列并导出，浏览器本地处理',
  keywords: '地址拆分省市区, excel拆列, 姓名拆姓, 地址提取省市, 数据清洗工具',
  author: 'Util工具箱',
  ogTitle: 'Excel地址姓名拆列 - 有条工具',
  ogDescription: '地址智能拆省市区、姓名拆姓/名（识别复姓），批量回填新列，杂乱地址也能拆',
  ogUrl: 'https://www.util.cn/tools/excel-column-splitter',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'Excel地址姓名拆列',
          url: 'https://www.util.cn/tools/excel-column-splitter',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['地址拆省市区', '34省级行政区词库', '160+城市前缀', '复姓识别', '少数民族姓名保护', 'xlsx导出']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'Excel地址姓名拆列', item: 'https://www.util.cn/tools/excel-column-splitter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '地址是怎么拆出省市区的？',
              acceptedAnswer: { '@type': 'Answer', text: '按内置行政区划词库从字符串头部最长匹配逐级消耗：省（全称/简称）→ 地级市 → 区县旗，剩余部分归入详细地址；拆不出市时市、区留空。' }
            },
            {
              '@type': 'Question',
              name: '复姓会拆错吗？',
              acceptedAnswer: { '@type': 'Answer', text: '内置欧阳、司马、上官、诸葛等 18 个复姓表，命中则姓取 2 字；含间隔号的少数民族姓名整串保留并提示无法拆分。' }
            },
            {
              '@type': 'Question',
              name: '地址缺少省份开头能拆吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以，省列留空后从城市继续拆，如"杭州市西湖区文二路8号"可拆出杭州市与西湖区。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'excel-column-splitter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 行政区划词库 ----------
const PROVINCES = [
  ['北京市', '北京'], ['天津市', '天津'], ['上海市', '上海'], ['重庆市', '重庆'],
  ['河北省', '河北'], ['山西省', '山西'], ['辽宁省', '辽宁'], ['吉林省', '吉林'],
  ['黑龙江省', '黑龙江'], ['江苏省', '江苏'], ['浙江省', '浙江'], ['安徽省', '安徽'],
  ['福建省', '福建'], ['江西省', '江西'], ['山东省', '山东'], ['河南省', '河南'],
  ['湖北省', '湖北'], ['湖南省', '湖南'], ['广东省', '广东'], ['海南省', '海南'],
  ['四川省', '四川'], ['贵州省', '贵州'], ['云南省', '云南'], ['陕西省', '陕西'],
  ['甘肃省', '甘肃'], ['青海省', '青海'],
  ['内蒙古自治区', '内蒙古'], ['广西壮族自治区', '广西'], ['西藏自治区', '西藏'],
  ['宁夏回族自治区', '宁夏'], ['新疆维吾尔自治区', '新疆'],
  ['香港特别行政区', '香港'], ['澳门特别行政区', '澳门'], ['台湾省', '台湾']
].flatMap(([full, ...aliases]) => [full, ...aliases].map(a => ({ alias: a, full })))
  .sort((a, b) => b.alias.length - a.alias.length)

const MUNICIPALITIES = ['北京市', '天津市', '上海市', '重庆市']

const CITY_NAMES = [
  '石家庄', '太原', '呼和浩特', '包头', '沈阳', '大连', '鞍山', '抚顺', '锦州', '长春', '吉林', '哈尔滨', '齐齐哈尔', '大庆',
  '南京', '无锡', '徐州', '常州', '苏州', '南通', '连云港', '淮安', '盐城', '扬州', '镇江', '泰州', '宿迁',
  '杭州', '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '衢州', '舟山', '台州', '丽水',
  '合肥', '芜湖', '蚌埠', '淮南', '马鞍山', '安庆', '福州', '厦门', '莆田', '三明', '泉州', '漳州', '南平', '龙岩', '宁德',
  '南昌', '九江', '赣州', '上饶', '宜春',
  '济南', '青岛', '淄博', '枣庄', '东营', '烟台', '潍坊', '济宁', '泰安', '威海', '日照', '临沂', '德州', '聊城', '滨州', '菏泽',
  '郑州', '开封', '洛阳', '平顶山', '安阳', '新乡', '焦作', '许昌', '南阳', '商丘',
  '武汉', '宜昌', '襄阳', '荆州', '黄石', '十堰',
  '长沙', '株洲', '湘潭', '衡阳', '岳阳', '常德', '益阳', '郴州', '怀化',
  '广州', '深圳', '珠海', '汕头', '佛山', '韶关', '湛江', '肇庆', '江门', '茂名', '惠州', '梅州', '清远', '东莞', '中山', '潮州', '揭阳',
  '南宁', '柳州', '桂林', '北海', '玉林',
  '海口', '三亚',
  '成都', '绵阳', '德阳', '自贡', '泸州', '南充', '宜宾', '乐山', '达州',
  '贵阳', '六盘水', '遵义', '安顺',
  '昆明', '曲靖', '玉溪', '大理', '丽江',
  '拉萨', '日喀则',
  '西安', '宝鸡', '咸阳', '渭南', '延安', '汉中',
  '兰州', '天水', '酒泉',
  '西宁', '海东',
  '银川', '石嘴山', '吴忠',
  '乌鲁木齐', '克拉玛依', '喀什', '吐鲁番', '哈密'
]
const CITY_ALIASES = [...new Set(CITY_NAMES)].sort((a, b) => b.length - a.length)

// ---------- 复姓表 ----------
const COMPOUND_SURNAMES = ['欧阳', '司马', '上官', '诸葛', '东方', '夏侯', '皇甫', '尉迟', '公孙', '长孙', '慕容', '司徒', '端木', '宇文', '西门', '南宫', '百里', '令狐']

// ---------- 状态 ----------
// 表结构：{ aoa, headers, totalRows, fileName }
const table = ref(null)
const targetCol = ref(0)
const splitMode = ref('address')

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 解析（xlsx 动态加载，仅取第一个 sheet） ----------
const onFile = async (e) => {
  const f = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!f) return
  try {
    const XLSX = await import('xlsx')
    const buffer = await f.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const sheetName = wb.SheetNames[0]
    if (!sheetName) throw new Error('空工作簿')
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: false, defval: '' })
    if (!aoa.length) throw new Error('空工作表')
    table.value = {
      aoa,
      headers: aoa[0].map((h, i) => String(h === '' ? `列${i + 1}` : h)),
      totalRows: aoa.length - 1,
      fileName: f.name
    }
    targetCol.value = 0
  } catch (err) {
    alert(`无法解析「${f.name}」，请确认是有效的 xlsx / xls / csv 文件且第一行为表头。`)
  }
}

// ---------- 地址拆分 ----------
const stripLead = (t) => t.replace(/^[,,。、;;\s-]+/, '')

const splitAddress = (raw) => {
  let s = String(raw == null ? '' : raw).replace(/\s+/g, '')
  let province = ''
  for (const p of PROVINCES) {
    if (s.startsWith(p.alias)) {
      const next = s[p.alias.length]
      if (next === '市' && !p.alias.endsWith('市')) continue // “吉林市”不应命中“吉林”省级
      province = p.full
      s = stripLead(s.slice(p.alias.length).replace(/^(省|自治区|特别行政区)/, ''))
      break
    }
  }
  let city = ''
  if (!province || !MUNICIPALITIES.includes(province)) {
    for (const c of CITY_ALIASES) {
      if (s.startsWith(c)) {
        city = c + '市'
        s = stripLead(s.slice(c.length).replace(/^市/, ''))
        break
      }
    }
  } else {
    city = province
    if (s.startsWith('市辖区')) s = s.slice(3)
  }
  let district = ''
  if (city) {
    if (s.startsWith('市辖区')) s = s.slice(3)
    for (let i = 2; i <= Math.min(12, s.length); i++) {
      const ch = s[i - 1]
      if (ch === '区' || ch === '县' || ch === '旗' || ch === '市') {
        district = s.slice(0, i)
        s = s.slice(i)
        break
      }
    }
  }
  const detail = stripLead(s)
  return { province, city, district, detail }
}

// ---------- 姓名拆分 ----------
const splitName = (raw) => {
  const name = String(raw == null ? '' : raw).trim().replace(/\s+/g, ' ')
  if (!name) return { surname: '', given: '', note: '' }
  if (name.includes('·')) {
    return { surname: name, given: '', note: '含间隔号的少数民族姓名，结构特殊，无法拆分' }
  }
  if (name.includes(' ')) {
    const parts = name.split(' ').filter(Boolean)
    return { surname: parts[0] || '', given: parts.slice(1).join(''), note: '' }
  }
  if (name.length >= 2 && COMPOUND_SURNAMES.includes(name.slice(0, 2))) {
    return { surname: name.slice(0, 2), given: name.slice(2), note: name.length === 2 ? '仅复姓，无名字部分' : '' }
  }
  return { surname: name.slice(0, 1), given: name.slice(1), note: '' }
}

// ---------- 结果 ----------
const NEW_COLS = {
  address: ['省', '市', '区', '详细地址'],
  name: ['姓', '名', '备注']
}

const result = computed(() => {
  if (!table.value || table.value.aoa.length < 2) return null
  const cols = NEW_COLS[splitMode.value]
  const rows = []
  for (let i = 1; i < table.value.aoa.length; i++) {
    const line = table.value.aoa[i]
    if (!line || line.every(c => c === '' || c == null)) continue
    const raw = line[targetCol.value] == null ? '' : String(line[targetCol.value])
    if (raw.trim() === '') continue
    let cells
    if (splitMode.value === 'address') {
      const r = splitAddress(raw)
      cells = [r.province, r.city, r.district, r.detail]
    } else {
      const r = splitName(raw)
      cells = [r.surname, r.given, r.note]
    }
    rows.push({ raw, cells })
  }
  return { newCols: cols, rows }
})

// ---------- 导出 ----------
const exportXlsx = async () => {
  if (!result.value || !result.value.rows.length || !table.value) return
  const XLSX = await import('xlsx')
  const headers = [...table.value.headers, ...result.value.newCols]
  const aoa = [headers]
  let r = 0
  for (let i = 1; i < table.value.aoa.length; i++) {
    const line = table.value.aoa[i]
    if (!line || line.every(c => c === '' || c == null)) continue
    const raw = line[targetCol.value] == null ? '' : String(line[targetCol.value])
    if (raw.trim() === '') { aoa.push([...line]); continue }
    aoa.push([...line, ...result.value.rows[r].cells])
    r++
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '拆分结果')
  XLSX.writeFile(wb, '拆列结果.xlsx')
}
</script>
