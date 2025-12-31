<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">.gitignore生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">根据项目类型和操作系统生成.gitignore文件</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="grid md:grid-cols-3 gap-6 mb-6">
        <!-- 项目类型 -->
        <div>
          <h2 class="text-lg font-semibold mb-3">项目类型</h2>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <label v-for="type in projectTypes" :key="type.id" class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="selectedTypes" :value="type.id" @change="generateGitignore" class="rounded">
              <span class="text-sm">{{ type.name }}</span>
            </label>
          </div>
        </div>

        <!-- 操作系统 -->
        <div>
          <h2 class="text-lg font-semibold mb-3">操作系统</h2>
          <div class="space-y-2">
            <label v-for="os in operatingSystems" :key="os.id" class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="selectedOS" :value="os.id" @change="generateGitignore" class="rounded">
              <span class="text-sm">{{ os.name }}</span>
            </label>
          </div>
        </div>

        <!-- IDE -->
        <div>
          <h2 class="text-lg font-semibold mb-3">IDE/编辑器</h2>
          <div class="space-y-2">
            <label v-for="ide in ides" :key="ide.id" class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="selectedIDEs" :value="ide.id" @change="generateGitignore" class="rounded">
              <span class="text-sm">{{ ide.name }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 快捷选择 -->
      <div class="mb-6 flex flex-wrap gap-2">
        <button @click="selectAll" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">全选</button>
        <button @click="clearAll" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">清空</button>
        <button @click="selectCommon" class="px-3 py-1 text-sm bg-blue-500 text-white rounded">常用配置</button>
      </div>
    </div>

    <!-- 预览和下载 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">.gitignore内容</h2>
        <div class="flex gap-2">
          <button @click="copyResult" class="px-3 py-1 text-sm bg-green-500 text-white rounded" :disabled="!gitignoreContent">复制</button>
          <button @click="downloadFile" class="px-3 py-1 text-sm bg-blue-500 text-white rounded" :disabled="!gitignoreContent">下载</button>
        </div>
      </div>
      <textarea
        v-model="gitignoreContent"
        class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
        readonly
      ></textarea>
    </div>

    <!-- 自定义规则 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">自定义规则</h2>
      <textarea
        v-model="customRules"
        @input="generateGitignore"
        class="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
        placeholder="添加自定义忽略规则，每行一个..."
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

useHead({
  title: '.gitignore生成器 - 在线Git忽略文件生成',
  meta: [{ name: 'description', content: '在线.gitignore文件生成工具，支持多种编程语言、操作系统和IDE的Git忽略规则。' }],
  keywords: ['.gitignore', 'git忽略', 'gitignore生成', 'git配置', '版本控制']
})

const selectedTypes = ref<string[]>(['node', 'vue'])
const selectedOS = ref<string[]>(['windows', 'macos'])
const selectedIDEs = ref<string[]>(['vscode'])
const customRules = ref('')
const gitignoreContent = ref('')

const projectTypes = [
  { id: 'node', name: 'Node.js' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'php', name: 'PHP' },
  { id: 'vue', name: 'Vue.js' },
  { id: 'react', name: 'React' },
  { id: 'angular', name: 'Angular' },
  { id: 'dotnet', name: '.NET' },
  { id: 'django', name: 'Django' },
  { id: 'laravel', name: 'Laravel' },
  { id: 'flutter', name: 'Flutter' },
  { id: 'swift', name: 'Swift/iOS' },
  { id: 'android', name: 'Android' }
]

const operatingSystems = [
  { id: 'windows', name: 'Windows' },
  { id: 'macos', name: 'macOS' },
  { id: 'linux', name: 'Linux' }
]

const ides = [
  { id: 'vscode', name: 'VS Code' },
  { id: 'jetbrains', name: 'JetBrains IDEs' },
  { id: 'sublime', name: 'Sublime Text' },
  { id: 'vim', name: 'Vim/Neovim' },
  { id: 'emacs', name: 'Emacs' }
]

const rules: Record<string, string[]> = {
  node: ['node_modules/', 'npm-debug.log*', 'yarn-debug.log*', 'yarn-error.log*', 'package-lock.json', 'yarn.lock', '.pnpm-store/'],
  python: ['__pycache__/', '*.py[cod]', '*$py.class', '*.so', 'Python/', 'build/', 'develop-eggs/', 'dist/', 'downloads/', 'eggs/', '.eggs/', 'lib/', 'lib64/', 'parts/', 'sdist/', 'var/', 'wheels/', '*.egg-info/', '.installed.cfg', '*.egg', 'MANIFEST', '.venv/', 'venv/', 'ENV/', 'env/', '.coverage', 'htmlcov/', '.pytest_cache/'],
  java: ['*.class', '.gradle/', 'build/', 'target/', '.idea/', '*.iml', '*.hprof', '.DS_Store'],
  go: ['*.exe', '*.exe~', '*.dll', '*.so', '*.dylib', '*.test', '*.out', 'go.work', 'vendor/'],
  rust: ['/target/', '**/*.rs.bk', '*.pdb', 'Cargo.lock'],
  ruby: ['*.gem', '*.rbc', '.config', 'coverage/', 'InstalledFiles', 'lib/bundler/man', 'pkg/', 'spec/reports/', 'spec/examples.txt', 'test/tmp/', 'test/version_tmp/', 'tmp/', '.bundle/', 'vendor/bundle'],
  php: ['vendor/', 'node_modules/', '.env', '.env.backup', '.phpunit.result.cache', 'composer.phar'],
  vue: ['dist-ssr/', '*.local'],
  react: ['build/', '.env.local', '.env.development.local', '.env.test.local', '.env.production.local'],
  angular: ['.angular/', 'dist/'],
  dotnet: ['bin/', 'obj/', '*.user', '*.suo', '*.userosscache', '*.sln.docstates'],
  django: ['*.log', 'local_settings.py', 'db.sqlite3', 'db.sqlite3-journal', 'media', 'staticfiles'],
  laravel: ['/node_modules', '/public/hot', '/public/storage', '/storage/*.key', '.env', '.env.backup', '.phpunit.result.cache', 'Homestead.json', 'Homestead.yaml', 'npm-debug.log', 'yarn-error.log'],
  flutter: ['**/doc/api/', '**/ios/Flutter/.last_build_id', '.dart_tool/', '.flutter-plugins', '.flutter-plugins-dependencies', '.packages', '.pub-cache/', '.pub/', '/build/', 'symbolication/*'],
  swift: ['*.xcodeproj/*/', '!*.xcodeproj/project.xcworkspace/', '*.xcworkspace/*/', '!*.xcworkspace/xcshareddata/', 'DerivedData/', '*.ipa', '*.dSYM.zip', '*.dSYM'],
  android: ['*.iml', '.gradle', '/local.properties', '/.idea', '.DS_Store', '/build', '/captures', '.externalNativeBuild', '.cxx'],
  windows: ['Thumbs.db', 'ehthumbs.db', 'Desktop.ini', '$RECYCLE.BIN/', '*.cab', '*.msi', '*.msix', '*.msm', '*.msp', '*.lnk'],
  macos: ['.DS_Store', '.AppleDouble', '.LSOverride', 'Icon', '._*', '.DocumentRevisions-V100', '.fseventsd', '.Spotlight-V100', '.TemporaryItems', '.Trashes', '.VolumeIcon.icns', '.com.apple.timemachine.donotpresent'],
  linux: ['*~','.nfs*'],
  vscode: ['.vscode/', '*.code-workspace'],
  jetbrains: ['.idea/', '*.iml', '*.iws', '*.ipr'],
  sublime: ['*.sublime-project', '*.sublime-workspace'],
  vim: ['.*.swp', '.netrwhist', '*~'],
  emacs: ['*~', '\#*\#', '/.emacs.desktop', '/.emacs.desktop.lock', 'auto-save-list', 'tramp', '.\#*']
}

function generateGitignore() {
  const allRules: string[] = []

  // 收集选中的规则
  for (const type of selectedTypes.value) {
    if (rules[type]) allRules.push(...rules[type])
  }
  for (const os of selectedOS.value) {
    if (rules[os]) allRules.push(...rules[os])
  }
  for (const ide of selectedIDEs.value) {
    if (rules[ide]) allRules.push(...rules[ide])
  }

  // 去重并排序
  const uniqueRules = [...new Set(allRules)].sort()

  // 添加注释头
  let content = '# Generated by .gitignore Generator\n\n'

  // 添加各部分
  if (selectedTypes.value.length > 0) {
    content += '# Project Types\n'
    for (const type of selectedTypes.value) {
      content += `# ${projectTypes.find(t => t.id === type)?.name}\n`
    }
    content += '\n'
  }

  if (selectedOS.value.length > 0) {
    content += '# Operating Systems\n'
    for (const os of selectedOS.value) {
      content += `# ${operatingSystems.find(o => o.id === os)?.name}\n`
    }
    content += '\n'
  }

  if (selectedIDEs.value.length > 0) {
    content += '# IDEs\n'
    for (const ide of selectedIDEs.value) {
      content += `# ${ides.find(i => i.id === ide)?.name}\n`
    }
    content += '\n'
  }

  // 添加规则
  content += uniqueRules.join('\n')

  // 添加自定义规则
  if (customRules.value.trim()) {
    content += '\n\n# Custom Rules\n'
    content += customRules.value.trim()
  }

  gitignoreContent.value = content
}

function selectAll() {
  selectedTypes.value = projectTypes.map(t => t.id)
  selectedOS.value = operatingSystems.map(o => o.id)
  selectedIDEs.value = ides.map(i => i.id)
  generateGitignore()
}

function clearAll() {
  selectedTypes.value = []
  selectedOS.value = []
  selectedIDEs.value = []
  customRules.value = ''
  generateGitignore()
}

function selectCommon() {
  selectedTypes.value = ['node', 'vue']
  selectedOS.value = ['macos', 'windows']
  selectedIDEs.value = ['vscode']
  generateGitignore()
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(gitignoreContent.value)
    alert('已复制')
  } catch {}
}

function downloadFile() {
  const blob = new Blob([gitignoreContent.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '.gitignore'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

onMounted(() => {
  generateGitignore()
})
</script>
