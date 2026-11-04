<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">ASCII 码表</h1>
      <p class="text-muted-foreground">完整的 ASCII 字符集参考表，包含十进制、十六进制、八进制和二进制表示</p>
    </div>

    <!-- 搜索和筛选 -->
    <div class="bg-card   rounded-lg p-6 mb-6">
      <div class="flex flex-wrap gap-4 mb-4">
        <div class="flex-1 min-w-[200px]">
          <label class="text-sm font-medium mb-2 block">搜索字符</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="输入字符、十进制或十六进制..."
            class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label class="text-sm font-medium mb-2 block">字符分类</label>
          <select v-model="selectedCategory" class="px-3 py-2 border border-border rounded-md min-w-[150px]">
            <option value="all">全部</option>
            <option value="control">控制字符</option>
            <option value="printable">可打印字符</option>
            <option value="number">数字</option>
            <option value="letter">字母</option>
            <option value="punctuation">标点符号</option>
            <option value="space">空格字符</option>
          </select>
        </div>
        <div class="flex items-end gap-2">
          <button
            @click="showHexInput = !showHexInput"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            查找字符
          </button>
        </div>
      </div>

      <!-- ASCII 查找器 -->
      <div v-if="showHexInput" class="bg-muted p-4 rounded-lg">
        <h3 class="font-medium mb-3">快速查找</h3>
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="text-sm text-muted-foreground mb-1 block">十进制</label>
            <input
              v-model="decimalInput"
              @input="findCharByDecimal"
              type="number"
              min="0"
              max="127"
              class="w-full px-3 py-1.5 border border-border rounded-md text-sm"
            />
          </div>
          <div class="flex-1">
            <label class="text-sm text-muted-foreground mb-1 block">十六进制</label>
            <input
              v-model="hexInput"
              @input="findCharByHex"
              type="text"
              placeholder="0-7F"
              class="w-full px-3 py-1.5 border border-border rounded-md text-sm font-mono"
            />
          </div>
          <div class="flex-1">
            <label class="text-sm text-muted-foreground mb-1 block">八进制</label>
            <input
              v-model="octalInput"
              @input="findCharByOctal"
              type="text"
              placeholder="0-177"
              class="w-full px-3 py-1.5 border border-border rounded-md text-sm font-mono"
            />
          </div>
          <div class="flex-1">
            <label class="text-sm text-muted-foreground mb-1 block">二进制</label>
            <input
              v-model="binaryInput"
              @input="findCharByBinary"
              type="text"
              placeholder="7位二进制"
              class="w-full px-3 py-1.5 border border-border rounded-md text-sm font-mono"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ASCII 表格 -->
    <div class="bg-card  rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-muted">
            <tr>
              <th class="px-4 py-3 text-left font-medium">十进制</th>
              <th class="px-4 py-3 text-left font-medium">十六进制</th>
              <th class="px-4 py-3 text-left font-medium">八进制</th>
              <th class="px-4 py-3 text-left font-medium">二进制</th>
              <th class="px-4 py-3 text-left font-medium">字符</th>
              <th class="px-4 py-3 text-left font-medium">HTML 实体</th>
              <th class="px-4 py-3 text-left font-medium">名称/描述</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="char in filteredAscii"
              :key="char.decimal"
              class="hover:bg-muted/50 transition-colors"
              :class="{ 'bg-primary/5': highlightedChar === char.decimal }"
            >
              <td class="px-4 py-3 font-mono">{{ char.decimal }}</td>
              <td class="px-4 py-3 font-mono">{{ char.hexadecimal.toUpperCase() }}</td>
              <td class="px-4 py-3 font-mono">{{ char.octal }}</td>
              <td class="px-4 py-3 font-mono">{{ char.binary }}</td>
              <td class="px-4 py-3">
                <span v-if="char.isControl" class="text-muted-foreground">
                  {{ char.controlKey || '-' }}
                </span>
                <span v-else class="text-lg">{{ char.character }}</span>
              </td>
              <td class="px-4 py-3 font-mono text-xs">{{ char.htmlEntity || '-' }}</td>
              <td class="px-4 py-3 text-xs text-muted-foreground">{{ char.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 扩展 ASCII 表 -->
    <div class="mt-8 bg-card   rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">扩展 ASCII 表 (128-255)</h2>
      <div class="text-sm text-muted-foreground mb-4">
        <p>扩展 ASCII 字符集（根据不同的代码页可能有所不同）</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        <div
          v-for="char in extendedAscii"
          :key="char.decimal"
          class="bg-muted p-3 rounded text-center hover:bg-primary/10 transition-colors cursor-pointer"
          @click="copyToClipboard(char.character)"
        >
          <div class="text-lg mb-1">{{ char.character }}</div>
          <div class="text-xs font-mono">{{ char.decimal }}</div>
          <div class="text-xs font-mono text-muted-foreground">{{ char.hexadecimal.toUpperCase() }}</div>
        </div>
      </div>
    </div>

    <!-- 参考信息 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          关于 ASCII
        </h3>
        <div class="space-y-4 text-sm">
          <div>
            <h4 class="font-medium mb-2">什么是 ASCII？</h4>
            <p class="text-muted-foreground">
              ASCII（American Standard Code for Information Interchange，美国信息交换标准代码）是基于拉丁字母的一套电脑编码系统。
              它使用7位二进制数来表示128个不同的字符，包括控制字符、数字、字母和标点符号。
            </p>
          </div>
          <div>
            <h4 class="font-medium mb-2">字符分类</h4>
            <ul class="text-muted-foreground space-y-1 ml-4">
              <li>• 0-31: 控制字符（非打印字符）</li>
              <li>• 32: 空格字符</li>
              <li>• 48-57: 数字 0-9</li>
              <li>• 65-90: 大写字母 A-Z</li>
              <li>• 97-122: 小写字母 a-z</li>
              <li>• 33-47, 58-64, 91-96, 123-126: 标点符号</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium mb-2">常用控制字符</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground">
              <div>• NUL (0) - 空字符</div>
              <div>• BEL (7) - 响铃</div>
              <div>• BS (8) - 退格</div>
              <div>• HT (9) - 水平制表符</div>
              <div>• LF (10) - 换行</div>
              <div>• VT (11) - 垂直制表符</div>
              <div>• FF (12) - 换页</div>
              <div>• CR (13) - 回车</div>
              <div>• ESC (27) - 转义</div>
              <div>• DEL (127) - 删除</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/hex-convert"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">十六进制转换</p>
              <p class="text-xs text-muted-foreground">文本与十六进制互转</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/binary-convert"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Type class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">二进制转换</p>
              <p class="text-xs text-muted-foreground">文本与二进制互转</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/unicode-convert"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Unicode 转换</p>
              <p class="text-xs text-muted-foreground">Unicode 编码转换</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Info, Hash, Type, FileText, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'encode', name: '编码解码', description: '编码解码工具集合' }

// 状态管理
const searchQuery = ref('')
const selectedCategory = ref('all')
const showHexInput = ref(false)
const decimalInput = ref('')
const hexInput = ref('')
const octalInput = ref('')
const binaryInput = ref('')
const highlightedChar = ref(null)

// ASCII 字符数据
const asciiData = [
  // 控制字符
  { decimal: 0, hexadecimal: '0x00', octal: '000', binary: '0000000', character: '', controlKey: 'NUL', description: '空字符', isControl: true, category: 'control' },
  { decimal: 1, hexadecimal: '0x01', octal: '001', binary: '0000001', character: '', controlKey: 'SOH', description: '标题开始', isControl: true, category: 'control' },
  { decimal: 2, hexadecimal: '0x02', octal: '002', binary: '0000010', character: '', controlKey: 'STX', description: '正文开始', isControl: true, category: 'control' },
  { decimal: 3, hexadecimal: '0x03', octal: '003', binary: '0000011', character: '', controlKey: 'ETX', description: '正文结束', isControl: true, category: 'control' },
  { decimal: 4, hexadecimal: '0x04', octal: '004', binary: '0000100', character: '', controlKey: 'EOT', description: '传输结束', isControl: true, category: 'control' },
  { decimal: 5, hexadecimal: '0x05', octal: '005', binary: '0000101', character: '', controlKey: 'ENQ', description: '询问', isControl: true, category: 'control' },
  { decimal: 6, hexadecimal: '0x06', octal: '006', binary: '0000110', character: '', controlKey: 'ACK', description: '确认', isControl: true, category: 'control' },
  { decimal: 7, hexadecimal: '0x07', octal: '007', binary: '0000111', character: '', controlKey: 'BEL', description: '响铃', isControl: true, category: 'control' },
  { decimal: 8, hexadecimal: '0x08', octal: '010', binary: '0001000', character: '', controlKey: 'BS', description: '退格', isControl: true, category: 'control' },
  { decimal: 9, hexadecimal: '0x09', octal: '011', binary: '0001001', character: '\t', controlKey: 'HT', description: '水平制表符', isControl: false, category: 'space' },
  { decimal: 10, hexadecimal: '0x0A', octal: '012', binary: '0001010', character: '\n', controlKey: 'LF', description: '换行', isControl: false, category: 'control' },
  { decimal: 11, hexadecimal: '0x0B', octal: '013', binary: '0001011', character: '', controlKey: 'VT', description: '垂直制表符', isControl: true, category: 'control' },
  { decimal: 12, hexadecimal: '0x0C', octal: '014', binary: '0001100', character: '', controlKey: 'FF', description: '换页', isControl: true, category: 'control' },
  { decimal: 13, hexadecimal: '0x0D', octal: '015', binary: '0001101', character: '\r', controlKey: 'CR', description: '回车', isControl: false, category: 'control' },
  { decimal: 14, hexadecimal: '0x0E', octal: '016', binary: '0001110', character: '', controlKey: 'SO', description: '移出', isControl: true, category: 'control' },
  { decimal: 15, hexadecimal: '0x0F', octal: '017', binary: '0001111', character: '', controlKey: 'SI', description: '移入', isControl: true, category: 'control' },
  { decimal: 16, hexadecimal: '0x10', octal: '020', binary: '0010000', character: '', controlKey: 'DLE', description: '数据链路转义', isControl: true, category: 'control' },
  { decimal: 17, hexadecimal: '0x11', octal: '021', binary: '0010001', character: '', controlKey: 'DC1', description: '设备控制1', isControl: true, category: 'control' },
  { decimal: 18, hexadecimal: '0x12', octal: '022', binary: '0010010', character: '', controlKey: 'DC2', description: '设备控制2', isControl: true, category: 'control' },
  { decimal: 19, hexadecimal: '0x13', octal: '023', binary: '0010011', character: '', controlKey: 'DC3', description: '设备控制3', isControl: true, category: 'control' },
  { decimal: 20, hexadecimal: '0x14', octal: '024', binary: '0010100', character: '', controlKey: 'DC4', description: '设备控制4', isControl: true, category: 'control' },
  { decimal: 21, hexadecimal: '0x15', octal: '025', binary: '0010101', character: '', controlKey: 'NAK', description: '否定确认', isControl: true, category: 'control' },
  { decimal: 22, hexadecimal: '0x16', octal: '026', binary: '0010110', character: '', controlKey: 'SYN', description: '同步空闲', isControl: true, category: 'control' },
  { decimal: 23, hexadecimal: '0x17', octal: '027', binary: '0010111', character: '', controlKey: 'ETB', description: '传输块结束', isControl: true, category: 'control' },
  { decimal: 24, hexadecimal: '0x18', octal: '030', binary: '0011000', character: '', controlKey: 'CAN', description: '取消', isControl: true, category: 'control' },
  { decimal: 25, hexadecimal: '0x19', octal: '031', binary: '0011001', character: '', controlKey: 'EM', description: '介质结束', isControl: true, category: 'control' },
  { decimal: 26, hexadecimal: '0x1A', octal: '032', binary: '0011010', character: '', controlKey: 'SUB', description: '替换', isControl: true, category: 'control' },
  { decimal: 27, hexadecimal: '0x1B', octal: '033', binary: '0011011', character: '', controlKey: 'ESC', description: '转义', isControl: true, category: 'control' },
  { decimal: 28, hexadecimal: '0x1C', octal: '034', binary: '0011100', character: '', controlKey: 'FS', description: '文件分隔符', isControl: true, category: 'control' },
  { decimal: 29, hexadecimal: '0x1D', octal: '035', binary: '0011101', character: '', controlKey: 'GS', description: '组分隔符', isControl: true, category: 'control' },
  { decimal: 30, hexadecimal: '0x1E', octal: '036', binary: '0011110', character: '', controlKey: 'RS', description: '记录分隔符', isControl: true, category: 'control' },
  { decimal: 31, hexadecimal: '0x1F', octal: '037', binary: '0011111', character: '', controlKey: 'US', description: '单元分隔符', isControl: true, category: 'control' },

  // 可打印字符
  { decimal: 32, hexadecimal: '0x20', octal: '040', binary: '0100000', character: ' ', description: '空格', isControl: false, category: 'space' },
  { decimal: 33, hexadecimal: '0x21', octal: '041', binary: '0100001', character: '!', description: '感叹号', isControl: false, category: 'punctuation', htmlEntity: '&#33;' },
  { decimal: 34, hexadecimal: '0x22', octal: '042', binary: '0100010', character: '"', description: '双引号', isControl: false, category: 'punctuation', htmlEntity: '&quot;' },
  { decimal: 35, hexadecimal: '0x23', octal: '043', binary: '0100011', character: '#', description: '井号', isControl: false, category: 'punctuation', htmlEntity: '&#35;' },
  { decimal: 36, hexadecimal: '0x24', octal: '044', binary: '0100100', character: '$', description: '美元符号', isControl: false, category: 'punctuation', htmlEntity: '&#36;' },
  { decimal: 37, hexadecimal: '0x25', octal: '045', binary: '0100101', character: '%', description: '百分号', isControl: false, category: 'punctuation', htmlEntity: '&#37;' },
  { decimal: 38, hexadecimal: '0x26', octal: '046', binary: '0100110', character: '&', description: '和号', isControl: false, category: 'punctuation', htmlEntity: '&amp;' },
  { decimal: 39, hexadecimal: '0x27', octal: '047', binary: '0100111', character: "'", description: '单引号', isControl: false, category: 'punctuation', htmlEntity: '&#39;' },
  { decimal: 40, hexadecimal: '0x28', octal: '050', binary: '0101000', character: '(', description: '左圆括号', isControl: false, category: 'punctuation', htmlEntity: '&#40;' },
  { decimal: 41, hexadecimal: '0x29', octal: '051', binary: '0101001', character: ')', description: '右圆括号', isControl: false, category: 'punctuation', htmlEntity: '&#41;' },
  { decimal: 42, hexadecimal: '0x2A', octal: '052', binary: '0101010', character: '*', description: '星号', isControl: false, category: 'punctuation', htmlEntity: '&#42;' },
  { decimal: 43, hexadecimal: '0x2B', octal: '053', binary: '0101011', character: '+', description: '加号', isControl: false, category: 'punctuation', htmlEntity: '&#43;' },
  { decimal: 44, hexadecimal: '0x2C', octal: '054', binary: '0101100', character: ',', description: '逗号', isControl: false, category: 'punctuation', htmlEntity: '&#44;' },
  { decimal: 45, hexadecimal: '0x2D', octal: '055', binary: '0101101', character: '-', description: '减号', isControl: false, category: 'punctuation', htmlEntity: '&#45;' },
  { decimal: 46, hexadecimal: '0x2E', octal: '056', binary: '0101110', character: '.', description: '句号', isControl: false, category: 'punctuation', htmlEntity: '&#46;' },
  { decimal: 47, hexadecimal: '0x2F', octal: '057', binary: '0101111', character: '/', description: '斜杠', isControl: false, category: 'punctuation', htmlEntity: '&#47;' },
  { decimal: 48, hexadecimal: '0x30', octal: '060', binary: '0110000', character: '0', description: '数字零', isControl: false, category: 'number', htmlEntity: '&#48;' },
  { decimal: 49, hexadecimal: '0x31', octal: '061', binary: '0110001', character: '1', description: '数字一', isControl: false, category: 'number', htmlEntity: '&#49;' },
  { decimal: 50, hexadecimal: '0x32', octal: '062', binary: '0110010', character: '2', description: '数字二', isControl: false, category: 'number', htmlEntity: '&#50;' },
  { decimal: 51, hexadecimal: '0x33', octal: '063', binary: '0110011', character: '3', description: '数字三', isControl: false, category: 'number', htmlEntity: '&#51;' },
  { decimal: 52, hexadecimal: '0x34', octal: '064', binary: '0110100', character: '4', description: '数字四', isControl: false, category: 'number', htmlEntity: '&#52;' },
  { decimal: 53, hexadecimal: '0x35', octal: '065', binary: '0110101', character: '5', description: '数字五', isControl: false, category: 'number', htmlEntity: '&#53;' },
  { decimal: 54, hexadecimal: '0x36', octal: '066', binary: '0110110', character: '6', description: '数字六', isControl: false, category: 'number', htmlEntity: '&#54;' },
  { decimal: 55, hexadecimal: '0x37', octal: '067', binary: '0110111', character: '7', description: '数字七', isControl: false, category: 'number', htmlEntity: '&#55;' },
  { decimal: 56, hexadecimal: '0x38', octal: '070', binary: '0111000', character: '8', description: '数字八', isControl: false, category: 'number', htmlEntity: '&#56;' },
  { decimal: 57, hexadecimal: '0x39', octal: '071', binary: '0111001', character: '9', description: '数字九', isControl: false, category: 'number', htmlEntity: '&#57;' },
  { decimal: 58, hexadecimal: '0x3A', octal: '072', binary: '0111010', character: ':', description: '冒号', isControl: false, category: 'punctuation', htmlEntity: '&#58;' },
  { decimal: 59, hexadecimal: '0x3B', octal: '073', binary: '0111011', character: ';', description: '分号', isControl: false, category: 'punctuation', htmlEntity: '&#59;' },
  { decimal: 60, hexadecimal: '0x3C', octal: '074', binary: '0111100', character: '<', description: '小于号', isControl: false, category: 'punctuation', htmlEntity: '&lt;' },
  { decimal: 61, hexadecimal: '0x3D', octal: '075', binary: '0111101', character: '=', description: '等号', isControl: false, category: 'punctuation', htmlEntity: '&#61;' },
  { decimal: 62, hexadecimal: '0x3E', octal: '076', binary: '0111110', character: '>', description: '大于号', isControl: false, category: 'punctuation', htmlEntity: '&gt;' },
  { decimal: 63, hexadecimal: '0x3F', octal: '077', binary: '0111111', character: '?', description: '问号', isControl: false, category: 'punctuation', htmlEntity: '&#63;' },
  { decimal: 64, hexadecimal: '0x40', octal: '100', binary: '1000000', character: '@', description: 'At符号', isControl: false, category: 'punctuation', htmlEntity: '&#64;' },
  { decimal: 65, hexadecimal: '0x41', octal: '101', binary: '1000001', character: 'A', description: '大写字母A', isControl: false, category: 'letter', htmlEntity: '&#65;' },
  { decimal: 66, hexadecimal: '0x42', octal: '102', binary: '1000010', character: 'B', description: '大写字母B', isControl: false, category: 'letter', htmlEntity: '&#66;' },
  { decimal: 67, hexadecimal: '0x43', octal: '103', binary: '1000011', character: 'C', description: '大写字母C', isControl: false, category: 'letter', htmlEntity: '&#67;' },
  { decimal: 68, hexadecimal: '0x44', octal: '104', binary: '1000100', character: 'D', description: '大写字母D', isControl: false, category: 'letter', htmlEntity: '&#68;' },
  { decimal: 69, hexadecimal: '0x45', octal: '105', binary: '1000101', character: 'E', description: '大写字母E', isControl: false, category: 'letter', htmlEntity: '&#69;' },
  { decimal: 70, hexadecimal: '0x46', octal: '106', binary: '1000110', character: 'F', description: '大写字母F', isControl: false, category: 'letter', htmlEntity: '&#70;' },
  { decimal: 71, hexadecimal: '0x47', octal: '107', binary: '1000111', character: 'G', description: '大写字母G', isControl: false, category: 'letter', htmlEntity: '&#71;' },
  { decimal: 72, hexadecimal: '0x48', octal: '110', binary: '1001000', character: 'H', description: '大写字母H', isControl: false, category: 'letter', htmlEntity: '&#72;' },
  { decimal: 73, hexadecimal: '0x49', octal: '111', binary: '1001001', character: 'I', description: '大写字母I', isControl: false, category: 'letter', htmlEntity: '&#73;' },
  { decimal: 74, hexadecimal: '0x4A', octal: '112', binary: '1001010', character: 'J', description: '大写字母J', isControl: false, category: 'letter', htmlEntity: '&#74;' },
  { decimal: 75, hexadecimal: '0x4B', octal: '113', binary: '1001011', character: 'K', description: '大写字母K', isControl: false, category: 'letter', htmlEntity: '&#75;' },
  { decimal: 76, hexadecimal: '0x4C', octal: '114', binary: '1001100', character: 'L', description: '大写字母L', isControl: false, category: 'letter', htmlEntity: '&#76;' },
  { decimal: 77, hexadecimal: '0x4D', octal: '115', binary: '1001101', character: 'M', description: '大写字母M', isControl: false, category: 'letter', htmlEntity: '&#77;' },
  { decimal: 78, hexadecimal: '0x4E', octal: '116', binary: '1001110', character: 'N', description: '大写字母N', isControl: false, category: 'letter', htmlEntity: '&#78;' },
  { decimal: 79, hexadecimal: '0x4F', octal: '117', binary: '1001111', character: 'O', description: '大写字母O', isControl: false, category: 'letter', htmlEntity: '&#79;' },
  { decimal: 80, hexadecimal: '0x50', octal: '120', binary: '1010000', character: 'P', description: '大写字母P', isControl: false, category: 'letter', htmlEntity: '&#80;' },
  { decimal: 81, hexadecimal: '0x51', octal: '121', binary: '1010001', character: 'Q', description: '大写字母Q', isControl: false, category: 'letter', htmlEntity: '&#81;' },
  { decimal: 82, hexadecimal: '0x52', octal: '122', binary: '1010010', character: 'R', description: '大写字母R', isControl: false, category: 'letter', htmlEntity: '&#82;' },
  { decimal: 83, hexadecimal: '0x53', octal: '123', binary: '1010011', character: 'S', description: '大写字母S', isControl: false, category: 'letter', htmlEntity: '&#83;' },
  { decimal: 84, hexadecimal: '0x54', octal: '124', binary: '1010100', character: 'T', description: '大写字母T', isControl: false, category: 'letter', htmlEntity: '&#84;' },
  { decimal: 85, hexadecimal: '0x55', octal: '125', binary: '1010101', character: 'U', description: '大写字母U', isControl: false, category: 'letter', htmlEntity: '&#85;' },
  { decimal: 86, hexadecimal: '0x56', octal: '126', binary: '1010110', character: 'V', description: '大写字母V', isControl: false, category: 'letter', htmlEntity: '&#86;' },
  { decimal: 87, hexadecimal: '0x57', octal: '127', binary: '1010111', character: 'W', description: '大写字母W', isControl: false, category: 'letter', htmlEntity: '&#87;' },
  { decimal: 88, hexadecimal: '0x58', octal: '130', binary: '1011000', character: 'X', description: '大写字母X', isControl: false, category: 'letter', htmlEntity: '&#88;' },
  { decimal: 89, hexadecimal: '0x59', octal: '131', binary: '1011001', character: 'Y', description: '大写字母Y', isControl: false, category: 'letter', htmlEntity: '&#89;' },
  { decimal: 90, hexadecimal: '0x5A', octal: '132', binary: '1011010', character: 'Z', description: '大写字母Z', isControl: false, category: 'letter', htmlEntity: '&#90;' },
  { decimal: 91, hexadecimal: '0x5B', octal: '133', binary: '1011011', character: '[', description: '左方括号', isControl: false, category: 'punctuation', htmlEntity: '&#91;' },
  { decimal: 92, hexadecimal: '0x5C', octal: '134', binary: '1011100', character: '\\', description: '反斜杠', isControl: false, category: 'punctuation', htmlEntity: '&#92;' },
  { decimal: 93, hexadecimal: '0x5D', octal: '135', binary: '1011101', character: ']', description: '右方括号', isControl: false, category: 'punctuation', htmlEntity: '&#93;' },
  { decimal: 94, hexadecimal: '0x5E', octal: '136', binary: '1011110', character: '^', description: '脱字符', isControl: false, category: 'punctuation', htmlEntity: '&#94;' },
  { decimal: 95, hexadecimal: '0x5F', octal: '137', binary: '1011111', character: '_', description: '下划线', isControl: false, category: 'punctuation', htmlEntity: '&#95;' },
  { decimal: 96, hexadecimal: '0x60', octal: '140', binary: '1100000', character: '`', description: '重音符', isControl: false, category: 'punctuation', htmlEntity: '&#96;' },
  { decimal: 97, hexadecimal: '0x61', octal: '141', binary: '1100001', character: 'a', description: '小写字母a', isControl: false, category: 'letter', htmlEntity: '&#97;' },
  { decimal: 98, hexadecimal: '0x62', octal: '142', binary: '1100010', character: 'b', description: '小写字母b', isControl: false, category: 'letter', htmlEntity: '&#98;' },
  { decimal: 99, hexadecimal: '0x63', octal: '143', binary: '1100011', character: 'c', description: '小写字母c', isControl: false, category: 'letter', htmlEntity: '&#99;' },
  { decimal: 100, hexadecimal: '0x64', octal: '144', binary: '1100100', character: 'd', description: '小写字母d', isControl: false, category: 'letter', htmlEntity: '&#100;' },
  { decimal: 101, hexadecimal: '0x65', octal: '145', binary: '1100101', character: 'e', description: '小写字母e', isControl: false, category: 'letter', htmlEntity: '&#101;' },
  { decimal: 102, hexadecimal: '0x66', octal: '146', binary: '1100110', character: 'f', description: '小写字母f', isControl: false, category: 'letter', htmlEntity: '&#102;' },
  { decimal: 103, hexadecimal: '0x67', octal: '147', binary: '1100111', character: 'g', description: '小写字母g', isControl: false, category: 'letter', htmlEntity: '&#103;' },
  { decimal: 104, hexadecimal: '0x68', octal: '150', binary: '1101000', character: 'h', description: '小写字母h', isControl: false, category: 'letter', htmlEntity: '&#104;' },
  { decimal: 105, hexadecimal: '0x69', octal: '151', binary: '1101001', character: 'i', description: '小写字母i', isControl: false, category: 'letter', htmlEntity: '&#105;' },
  { decimal: 106, hexadecimal: '0x6A', octal: '152', binary: '1101010', character: 'j', description: '小写字母j', isControl: false, category: 'letter', htmlEntity: '&#106;' },
  { decimal: 107, hexadecimal: '0x6B', octal: '153', binary: '1101011', character: 'k', description: '小写字母k', isControl: false, category: 'letter', htmlEntity: '&#107;' },
  { decimal: 108, hexadecimal: '0x6C', octal: '154', binary: '1101100', character: 'l', description: '小写字母l', isControl: false, category: 'letter', htmlEntity: '&#108;' },
  { decimal: 109, hexadecimal: '0x6D', octal: '155', binary: '1101101', character: 'm', description: '小写字母m', isControl: false, category: 'letter', htmlEntity: '&#109;' },
  { decimal: 110, hexadecimal: '0x6E', octal: '156', binary: '1101110', character: 'n', description: '小写字母n', isControl: false, category: 'letter', htmlEntity: '&#110;' },
  { decimal: 111, hexadecimal: '0x6F', octal: '157', binary: '1101111', character: 'o', description: '小写字母o', isControl: false, category: 'letter', htmlEntity: '&#111;' },
  { decimal: 112, hexadecimal: '0x70', octal: '160', binary: '1110000', character: 'p', description: '小写字母p', isControl: false, category: 'letter', htmlEntity: '&#112;' },
  { decimal: 113, hexadecimal: '0x71', octal: '161', binary: '1110001', character: 'q', description: '小写字母q', isControl: false, category: 'letter', htmlEntity: '&#113;' },
  { decimal: 114, hexadecimal: '0x72', octal: '162', binary: '1110010', character: 'r', description: '小写字母r', isControl: false, category: 'letter', htmlEntity: '&#114;' },
  { decimal: 115, hexadecimal: '0x73', octal: '163', binary: '1110011', character: 's', description: '小写字母s', isControl: false, category: 'letter', htmlEntity: '&#115;' },
  { decimal: 116, hexadecimal: '0x74', octal: '164', binary: '1110100', character: 't', description: '小写字母t', isControl: false, category: 'letter', htmlEntity: '&#116;' },
  { decimal: 117, hexadecimal: '0x75', octal: '165', binary: '1110101', character: 'u', description: '小写字母u', isControl: false, category: 'letter', htmlEntity: '&#117;' },
  { decimal: 118, hexadecimal: '0x76', octal: '166', binary: '1110110', character: 'v', description: '小写字母v', isControl: false, category: 'letter', htmlEntity: '&#118;' },
  { decimal: 119, hexadecimal: '0x77', octal: '167', binary: '1110111', character: 'w', description: '小写字母w', isControl: false, category: 'letter', htmlEntity: '&#119;' },
  { decimal: 120, hexadecimal: '0x78', octal: '170', binary: '1111000', character: 'x', description: '小写字母x', isControl: false, category: 'letter', htmlEntity: '&#120;' },
  { decimal: 121, hexadecimal: '0x79', octal: '171', binary: '1111001', character: 'y', description: '小写字母y', isControl: false, category: 'letter', htmlEntity: '&#121;' },
  { decimal: 122, hexadecimal: '0x7A', octal: '172', binary: '1111010', character: 'z', description: '小写字母z', isControl: false, category: 'letter', htmlEntity: '&#122;' },
  { decimal: 123, hexadecimal: '0x7B', octal: '173', binary: '1111011', character: '{', description: '左花括号', isControl: false, category: 'punctuation', htmlEntity: '&#123;' },
  { decimal: 124, hexadecimal: '0x7C', octal: '174', binary: '1111100', character: '|', description: '竖线', isControl: false, category: 'punctuation', htmlEntity: '&#124;' },
  { decimal: 125, hexadecimal: '0x7D', octal: '175', binary: '1111101', character: '}', description: '右花括号', isControl: false, category: 'punctuation', htmlEntity: '&#125;' },
  { decimal: 126, hexadecimal: '0x7E', octal: '176', binary: '1111110', character: '~', description: '波浪号', isControl: false, category: 'punctuation', htmlEntity: '&#126;' },
  { decimal: 127, hexadecimal: '0x7F', octal: '177', binary: '1111111', character: '', controlKey: 'DEL', description: '删除', isControl: true, category: 'control' }
]

// 扩展 ASCII (128-255) - 使用 ISO-8859-1 (Latin-1)
const extendedAscii = computed(() => {
  const extended = []
  for (let i = 128; i <= 255; i++) {
    extended.push({
      decimal: i,
      hexadecimal: '0x' + i.toString(16),
      character: String.fromCharCode(i)
    })
  }
  return extended
})

// 过滤后的 ASCII 数据
const filteredAscii = computed(() => {
  let result = asciiData

  // 按分类筛选
  if (selectedCategory.value !== 'all') {
    result = result.filter(char => char.category === selectedCategory.value)
  }

  // 按搜索查询筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(char => {
      if (char.character && char.character.toLowerCase() === query) return true
      if (char.decimal.toString().includes(query)) return true
      if (char.hexadecimal.toLowerCase().includes(query)) return true
      if (char.octal.includes(query)) return true
      if (char.binary.includes(query)) return true
      if (char.description && char.description.toLowerCase().includes(query)) return true
      if (char.controlKey && char.controlKey.toLowerCase().includes(query)) return true
      return false
    })
  }

  return result
})

// 查找字符
const findCharByDecimal = () => {
  const value = parseInt(decimalInput.value)
  if (value >= 0 && value <= 127) {
    highlightedChar.value = value
    scrollToChar(value)
  }
}

const findCharByHex = () => {
  const value = parseInt(hexInput.value, 16)
  if (value >= 0 && value <= 127) {
    highlightedChar.value = value
    scrollToChar(value)
  }
}

const findCharByOctal = () => {
  const value = parseInt(octalInput.value, 8)
  if (value >= 0 && value <= 127) {
    highlightedChar.value = value
    scrollToChar(value)
  }
}

const findCharByBinary = () => {
  const value = parseInt(binaryInput.value, 2)
  if (value >= 0 && value <= 127) {
    highlightedChar.value = value
    scrollToChar(value)
  }
}

// 滚动到字符
const scrollToChar = (decimal) => {
  // 清除之前的高亮
  setTimeout(() => {
    const element = document.querySelector(`[data-decimal="${decimal}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 100)
}

// 复制到剪贴板
const copyToClipboard = async (char) => {
  try {
    await navigator.clipboard.writeText(char)
    // 可以添加提示消息
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = char
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

// SEO配置
useSeoMeta({
  title: 'ASCII码表 - 在线ASCII字符集查询工具',
  description: '完整的ASCII码表查询工具，支持十进制、十六进制、八进制和二进制表示，包含控制字符和可打印字符。',
  keywords: ['ascii', '码表', '字符集', '编码', '十进制', '十六进制', '在线工具', 'ascii table']
})


</script>

<style scoped>
select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}
</style>