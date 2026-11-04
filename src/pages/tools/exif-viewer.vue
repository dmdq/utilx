<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">EXIF 查看器</h1>
      <p class="text-muted-foreground">查看图片的 EXIF 元数据信息，包括拍摄参数、GPS 位置等</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：上传和图片信息 -->
      <div class="space-y-4">
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">上传图片</h2>

          <!-- 上传区域 -->
          <div
            class="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            @drop="handleDrop"
            @dragover.prevent
            @dragleave="handleDragLeave"
            @click="triggerFileInput"
          >
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept="image/*"
              @change="handleFileSelect"
            />
            <ImageIcon class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p class="text-lg font-medium mb-2">拖拽图片到这里</p>
            <p class="text-sm text-muted-foreground">支持 JPG、TIFF 等格式</p>
          </div>

          <!-- 图片预览 -->
          <div v-if="selectedImage" class="mt-4 space-y-4">
            <div class="relative">
              <img
                :src="selectedImage.url"
                :alt="selectedImage.name"
                class="w-full rounded-lg"
              />
              <button
                @click="clearImage"
                class="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
            <div class="text-sm text-muted-foreground">
              <p>文件名：{{ selectedImage.name }}</p>
              <p>文件大小：{{ formatFileSize(selectedImage.size) }}</p>
              <p>尺寸：{{ selectedImage.width }} × {{ selectedImage.height }} px</p>
            </div>
          </div>
        </div>

        <!-- 快速信息 -->
        <div v-if="exifData" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">快速信息</h2>
          <div class="space-y-3">
            <div v-if="exifData.DateTime" class="flex justify-between text-sm">
              <span class="text-muted-foreground">拍摄时间</span>
              <span class="font-mono">{{ formatDate(exifData.DateTime) }}</span>
            </div>
            <div v-if="exifData.Make && exifData.Model" class="flex justify-between text-sm">
              <span class="text-muted-foreground">相机型号</span>
              <span>{{ exifData.Make }} {{ exifData.Model }}</span>
            </div>
            <div v-if="exifData.FocalLength" class="flex justify-between text-sm">
              <span class="text-muted-foreground">焦距</span>
              <span>{{ exifData.FocalLength }}mm</span>
            </div>
            <div v-if="exifData.FNumber" class="flex justify-between text-sm">
              <span class="text-muted-foreground">光圈</span>
              <span>f/{{ exifData.FNumber }}</span>
            </div>
            <div v-if="exifData.ExposureTime" class="flex justify-between text-sm">
              <span class="text-muted-foreground">快门速度</span>
              <span>{{ formatExposureTime(exifData.ExposureTime) }}</span>
            </div>
            <div v-if="exifData.ISO" class="flex justify-between text-sm">
              <span class="text-muted-foreground">ISO</span>
              <span>{{ exifData.ISO }}</span>
            </div>
            <div v-if="exifData.Flash" class="flex justify-between text-sm">
              <span class="text-muted-foreground">闪光灯</span>
              <span>{{ getFlashDescription(exifData.Flash) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：详细信息 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- EXIF 数据标签页 -->
        <div v-if="exifData" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">EXIF 数据详情</h2>

          <!-- 标签页导航 -->
          <div class="flex gap-2 mb-6 border-b">
            <button
              v-for="tab in exifTabs"
              :key="tab.key"
              @click="activeTab = tab.key"
              :class="[
                'px-4 py-2 -mb-px border-b-2 transition-colors text-sm',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              ]"
            >
              {{ tab.name }}
            </button>
          </div>

          <!-- 相机信息 -->
          <div v-if="activeTab === 'camera'" class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="p-4 bg-muted rounded-lg">
                <h3 class="font-medium mb-3">基本信息</h3>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">制造商</span>
                    <span>{{ exifData.Make || '-' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">相机型号</span>
                    <span>{{ exifData.Model || '-' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">软件</span>
                    <span>{{ exifData.Software || '-' }}</span>
                  </div>
                </div>
              </div>

              <div class="p-4 bg-muted rounded-lg">
                <h3 class="font-medium mb-3">拍摄参数</h3>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">光圈值</span>
                    <span>f/{{ exifData.FNumber || '-' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">快门速度</span>
                    <span>{{ formatExposureTime(exifData.ExposureTime) || '-' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">ISO 感光度</span>
                    <span>{{ exifData.ISO || '-' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">焦距</span>
                    <span>{{ exifData.FocalLength ? exifData.FocalLength + 'mm' : '-' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">35mm等效焦距</span>
                    <span>{{ exifData.FocalLengthIn35mmFilm ? exifData.FocalLengthIn35mmFilm + 'mm' : '-' }}</span>
                  </div>
                </div>
              </div>

              <div class="p-4 bg-muted rounded-lg">
                <h3 class="font-medium mb-3">曝光信息</h3>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">曝光模式</span>
                    <span>{{ getExposureMode(exifData.ExposureMode) || '-' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">测光模式</span>
                    <span>{{ getMeteringMode(exifData.MeteringMode) || '-' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">曝光补偿</span>
                    <span>{{ exifData.ExposureBiasValue ? formatExposureBias(exifData.ExposureBiasValue) : '-' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">白平衡</span>
                    <span>{{ getWhiteBalance(exifData.WhiteBalance) || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- GPS 信息 -->
          <div v-if="activeTab === 'gps'" class="space-y-4">
            <div v-if="hasGPS" class="space-y-4">
              <div class="p-4 bg-muted rounded-lg">
                <h3 class="font-medium mb-3">位置信息</h3>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">纬度</span>
                    <span>{{ formatGPSLatitude(exifData.GPSLatitude, exifData.GPSLatitudeRef) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">经度</span>
                    <span>{{ formatGPSLongitude(exifData.GPSLongitude, exifData.GPSLongitudeRef) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">海拔</span>
                    <span>{{ formatGPSAltitude(exifData.GPSAltitude, exifData.GPSAltitudeRef) }}</span>
                  </div>
                </div>
              </div>

              <div class="p-4 bg-muted rounded-lg">
                <h3 class="font-medium mb-3">地图</h3>
                <div class="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p class="text-muted-foreground">地图功能需要在线服务支持</p>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-12 text-muted-foreground">
              <MapPin class="w-12 h-12 mx-auto mb-4" />
              <p>该图片不包含 GPS 信息</p>
            </div>
          </div>

          <!-- 其他信息 -->
          <div v-if="activeTab === 'other'" class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="p-4 bg-muted rounded-lg">
                <h3 class="font-medium mb-3">图像信息</h3>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">方向</span>
                    <span>{{ getOrientation(exifData.Orientation) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">分辨率单位</span>
                    <span>{{ exifData.ResolutionUnit || '-' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">X分辨率</span>
                    <span>{{ exifData.XResolution || '-' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Y分辨率</span>
                    <span>{{ exifData.YResolution || '-' }}</span>
                  </div>
                </div>
              </div>

              <div class="p-4 bg-muted rounded-lg">
                <h3 class="font-medium mb-3">版权信息</h3>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">版权</span>
                    <span>{{ exifData.Copyright || '-' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">艺术家</span>
                    <span>{{ exifData.Artist || '-' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">注释</span>
                    <span class="truncate max-w-xs">{{ exifData.ImageDescription || '-' }}</span>
                  </div>
                </div>
              </div>

              <div class="p-4 bg-muted rounded-lg">
                <h3 class="font-medium mb-3">原始数据</h3>
                <textarea
                  :value="JSON.stringify(exifData, null, 2)"
                  readonly
                  rows="10"
                  class="w-full px-3 py-2 border border-border rounded-md bg-background font-mono text-xs resize-none"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- 无 EXIF 数据 -->
        <div v-else class="bg-card border rounded-lg p-12 text-center">
          <ImageIcon class="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p class="text-muted-foreground">上传图片查看 EXIF 信息</p>
        </div>

        <!-- 导出功能 -->
        <div v-if="exifData" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">导出</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="exportJSON"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Download class="w-4 h-4" />
              导出 JSON
            </button>
            <button
              @click="exportCSV"
              class="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
            >
              <FileText class="w-4 h-4" />
              导出 CSV
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          关于 EXIF
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">什么是 EXIF？</h4>
            <p>EXIF（Exchangeable Image File Format）是一种可交换图像文件格式，是专门为数码相机照片设定的，可以记录数码照片的属性信息和拍摄数据。</p>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">包含信息</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>拍摄时间、日期</li>
              <li>相机制造商和型号</li>
              <li>拍摄参数（光圈、快门、ISO等）</li>
              <li>GPS 位置信息（经纬度、海拔）</li>
              <li>图像分辨率和方向</li>
              <li>版权和艺术家信息</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">注意事项</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>不是所有图片都包含 EXIF 数据</li>
              <li>JPG 和 TIFF 格式通常支持 EXIF</li>
              <li>PNG 格式通常不包含相机 EXIF</li>
              <li>社交媒体通常会删除 EXIF 信息</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NuxtLink
            to="/tools/image-watermark"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Droplet class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">图片水印</p>
              <p class="text-xs text-muted-foreground">添加文字/图片水印</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/qrcode-generate"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <QrCode class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">二维码生成器</p>
              <p class="text-xs text-muted-foreground">在线生成二维码</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Info, ImageIcon, X, Download, FileText, ArrowRight, MapPin, Droplet, QrCode } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'
import ExifReader from 'exifreader'

// 分类信息
const category = { id: 'image', name: '图片处理', description: '图片处理工具集合' }

// 状态管理
const selectedImage = ref(null)
const exifData = ref(null)
const activeTab = ref('camera')
const fileInput = ref(null)

// 标签页
const exifTabs = [
  { key: 'camera', name: '相机信息' },
  { key: 'gps', name: 'GPS 位置' },
  { key: 'other', name: '其他信息' }
]

// 计算属性
const hasGPS = computed(() => {
  return exifData.value && (
    exifData.value.GPSLatitude ||
    exifData.value.GPSLongitude ||
    exifData.value.GPSAltitude
  )
})

// 处理文件选择
const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file && file.type.startsWith('image/')) {
    processImageFile(file)
  }
}

// 处理拖拽
const handleDrop = (e) => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    processImageFile(file)
  }
}

// 处理拖拽离开
const handleDragLeave = () => {
  // 可以添加视觉反馈，例如恢复边框颜色
}

// 处理图片文件
const processImageFile = async (file) => {
  const reader = new FileReader()

  reader.onload = async (e) => {
    selectedImage.value = {
      name: file.name,
      size: file.size,
      url: e.target.result
    }

    // 获取图片尺寸
    const img = new Image()
    img.onload = () => {
      selectedImage.value.width = img.width
      selectedImage.value.height = img.height
    }
    img.src = e.target.result

    // 读取 EXIF 数据
    try {
      const buffer = await file.arrayBuffer()
      const exifDataResult = ExifReader.load(buffer)

      if (exifDataResult) {
        exifData.value = exifDataResult
      } else {
        exifData.value = null
      }
    } catch (error) {
      console.error('读取 EXIF 失败:', error)
      exifData.value = null
    }
  }

  reader.readAsDataURL(file)
}

// 清空图片
const clearImage = () => {
  selectedImage.value = null
  exifData.value = null
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN')
  } catch {
    return dateString
  }
}

// 格式化曝光时间
const formatExposureTime = (value) => {
  if (!value) return '-'

  if (value < 1) {
    return `1/${Math.round(1 / value)}s`
  }
  return `${value}s`
}

// 格式化曝光补偿
const formatExposureBias = (value) => {
  if (!value) return '-'
  const bias = value.Numerator / value.Denominator
  return `${bias > 0 ? '+' : ''}${bias} EV`
}

// 获取闪光灯描述
const getFlashDescription = (value) => {
  if (!value) return '未使用'

  const flashModes = {
    0: '未使用',
    1: '使用',
    5: '使用，未检测到回闪',
    7: '使用，检测到回闪',
    9: '强制开启',
    16: '强制关闭',
    24: '自动模式',
    25: '自动模式，未检测到回闪',
    29: '自动模式，检测到回闪'
  }

  return flashModes[value] || '未知'
}

// 获取曝光模式描述
const getExposureMode = (value) => {
  if (!value) return '-'

  const modes = {
    0: '未定义',
    1: '手动',
    2: '程序自动',
    3: '光圈优先',
    4: '快门优先',
    5: '创意程序',
    6: '动作模式',
    7: '人像模式',
    8: '风景模式'
  }

  return modes[value] || value
}

// 获取测光模式描述
const getMeteringMode = (value) => {
  if (!value) return '-'

  const modes = {
    0: '未知',
    1: '平均测光',
    2: '中央重点测光',
    3: '点测光',
    4: '多点测光',
    5: '模式测光',
    6: '部分测光'
  }

  return modes[value] || value
}

// 获取白平衡描述
const getWhiteBalance = (value) => {
  if (!value) return '-'

  const modes = {
    0: '自动',
    1: '手动',
    2: '日光',
    3: '阴天',
    4: '白炽灯',
    5: '荧光灯',
    6: '闪光灯'
  }

  return modes[value] || value
}

// 获取方向描述
const getOrientation = (value) => {
  if (!value) return '正常'

  const orientations = {
    1: '正常',
    2: '翻转',
    3: '旋转180°',
    4: '顺时针90°',
    5: '逆时针90°',
    6: '顺时针90°并翻转',
    7: '逆时针90°并翻转',
    8: '旋转270°'
  }

  return orientations[value] || value
}

// 格式化 GPS 纬度
const formatGPSLatitude = (latitude, ref) => {
  if (!latitude || !ref) return '-'

  const degrees = latitude.degrees
  const minutes = latitude.minutes
  const seconds = latitude.seconds

  const decimalDegrees = degrees + (minutes / 60) + (seconds / 3600)
  const direction = ref === 'N' ? 'N' : 'S'

  return `${Math.abs(decimalDegrees).toFixed(6)}° ${direction}`
}

// 格式化 GPS 经度
const formatGPSLongitude = (longitude, ref) => {
  if (!longitude || !ref) return '-'

  const degrees = longitude.degrees
  const minutes = longitude.minutes
  const seconds = longitude.seconds

  const decimalDegrees = degrees + (minutes / 60) + (seconds / 3600)
  const direction = ref === 'E' ? 'E' : 'W'

  return `${Math.abs(decimalDegrees).toFixed(6)}° ${direction}`
}

// 格式化 GPS 海拔
const formatGPSAltitude = (altitude, ref) => {
  if (!altitude) return '-'

  const alt = altitude
  const direction = ref === 0 ? '海平面' : '海平面下'

  return `${alt.toFixed(2)}m ${direction}`
}

// 导出 JSON
const exportJSON = () => {
  if (!exifData.value) return

  const data = JSON.stringify(exifData.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `exif_${selectedImage.value.name}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 导出 CSV
const exportCSV = () => {
  if (!exifData.value) return

  const flattenObj = (obj, prefix = '') => {
    const result = []
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        result.push(...flattenObj(obj[key], prefix + key + '.'))
      } else {
        result.push({
          key: prefix + key,
          value: obj[key]
        })
      }
    }
    return result
  }

  const flattened = flattenObj(exifData.value)
  const headers = ['属性', '值']
  const rows = flattened.map(item => [item.key, item.value])

  let csv = headers.join(',') + '\n'
  rows.forEach(row => {
    csv += row.map(cell => `"${cell}"`).join(',') + '\n'
  })

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `exif_${selectedImage.value.name}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// 触发文件输入
const triggerFileInput = () => {
  fileInput.value.click()
}

// SEO配置
useSeoMeta({
  title: 'EXIF查看器 - 在线查看图片EXIF信息工具',
  description: '免费在线EXIF查看工具，查看图片的拍摄参数、GPS位置、相机信息等元数据。',
  keywords: ['exif', 'exif查看器', '图片元数据', '拍摄参数', 'gps信息', '在线工具']
})


</script>