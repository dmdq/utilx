<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Git 命令生成器</h1>
      <p class="text-muted-foreground">可视化生成 Git 命令，支持常用 Git 操作和命令组合</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：配置区域 -->
      <div class="space-y-4">
        <!-- 操作类型选择 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">操作类型</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="category in commandCategories"
              :key="category.value"
              @click="selectedCategory = category.value"
              :class="[
                'px-4 py-3 rounded-md transition-colors text-left',
                selectedCategory === category.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              ]"
            >
              <div class="font-medium">{{ category.name }}</div>
              <div class="text-xs opacity-80">{{ category.description }}</div>
            </button>
          </div>
        </div>

        <!-- 具体操作配置 -->
        <div v-if="selectedCategory" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">配置选项</h2>

          <!-- 初始化配置 -->
          <div v-if="selectedCategory === 'init'" class="space-y-4">
            <div>
              <label class="text-sm font-medium">仓库名称</label>
              <input
                v-model="config.repoName"
                type="text"
                placeholder="my-project"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="config.bare"
                type="checkbox"
                id="bare"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="bare" class="text-sm">创建裸仓库</label>
            </div>
          </div>

          <!-- 克隆配置 -->
          <div v-if="selectedCategory === 'clone'" class="space-y-4">
            <div>
              <label class="text-sm font-medium">仓库 URL</label>
              <input
                v-model="config.repoUrl"
                type="text"
                placeholder="https://github.com/user/repo.git"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label class="text-sm font-medium">目标目录（可选）</label>
              <input
                v-model="config.targetDir"
                type="text"
                placeholder="my-project"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="config.depth"
                type="checkbox"
                id="depth"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="depth" class="text-sm">浅克隆（仅最新提交）</label>
            </div>
          </div>

          <!-- 提交配置 -->
          <div v-if="selectedCategory === 'commit'" class="space-y-4">
            <div>
              <label class="text-sm font-medium">提交消息</label>
              <textarea
                v-model="config.commitMessage"
                placeholder="Fix bug in user authentication"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm h-24 resize-none"
              ></textarea>
            </div>
            <div>
              <label class="text-sm font-medium">添加的文件</label>
              <select v-model="config.addOption" class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm">
                <option value="all">添加所有更改 (git add .)</option>
                <option value="staged">仅暂存的文件</option>
                <option value="specific">指定文件</option>
              </select>
            </div>
            <div v-if="config.addOption === 'specific'">
              <input
                v-model="config.specificFiles"
                type="text"
                placeholder="file1.js file2.css"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="config.amend"
                type="checkbox"
                id="amend"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="amend" class="text-sm">修改最后一次提交</label>
            </div>
          </div>

          <!-- 分支配置 -->
          <div v-if="selectedCategory === 'branch'" class="space-y-4">
            <div>
              <label class="text-sm font-medium">操作</label>
              <select v-model="config.branchAction" class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm">
                <option value="create">创建新分支</option>
                <option value="switch">切换分支</option>
                <option value="create-switch">创建并切换</option>
                <option value="delete">删除分支</option>
                <option value="list">列出所有分支</option>
              </select>
            </div>
            <div v-if="config.branchAction !== 'list'">
              <label class="text-sm font-medium">分支名称</label>
              <input
                v-model="config.branchName"
                type="text"
                placeholder="feature/new-feature"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div v-if="config.branchAction === 'delete'" class="flex items-center gap-3">
              <input
                v-model="config.forceDelete"
                type="checkbox"
                id="forceDelete"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="forceDelete" class="text-sm">强制删除</label>
            </div>
          </div>

          <!-- 推送配置 -->
          <div v-if="selectedCategory === 'push'" class="space-y-4">
            <div>
              <label class="text-sm font-medium">远程仓库</label>
              <input
                v-model="config.remote"
                type="text"
                placeholder="origin"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label class="text-sm font-medium">分支</label>
              <input
                v-model="config.branch"
                type="text"
                placeholder="main"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="config.setUpstream"
                type="checkbox"
                id="setUpstream"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="setUpstream" class="text-sm">设置上游分支</label>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="config.force"
                type="checkbox"
                id="force"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="force" class="text-sm">强制推送</label>
            </div>
          </div>

          <!-- 拉取配置 -->
          <div v-if="selectedCategory === 'pull'" class="space-y-4">
            <div>
              <label class="text-sm font-medium">远程仓库</label>
              <input
                v-model="config.remote"
                type="text"
                placeholder="origin"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label class="text-sm font-medium">分支</label>
              <input
                v-model="config.branch"
                type="text"
                placeholder="main"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="config.rebase"
                type="checkbox"
                id="rebase"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="rebase" class="text-sm">使用 rebase</label>
            </div>
          </div>

          <!-- 合并配置 -->
          <div v-if="selectedCategory === 'merge'" class="space-y-4">
            <div>
              <label class="text-sm font-medium">源分支</label>
              <input
                v-model="config.sourceBranch"
                type="text"
                placeholder="feature-branch"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="config.noCommit"
                type="checkbox"
                id="noCommit"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="noCommit" class="text-sm">不自动提交</label>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="config.squash"
                type="checkbox"
                id="squash"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="squash" class="text-sm">压缩合并</label>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：命令预览和说明 -->
      <div class="space-y-4">
        <!-- 生成的命令 -->
        <div class="bg-card   rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">生成的命令</h2>
            <button
              @click="copyCommand"
              :disabled="!generatedCommand"
              class="px-3 py-1 text-sm border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ copied ? '已复制' : '复制' }}
            </button>
          </div>

          <div class="bg-muted/30 rounded-lg p-4">
            <code v-if="generatedCommand" class="text-sm whitespace-pre-wrap break-all">{{ generatedCommand }}</code>
            <div v-else class="text-center text-muted-foreground py-8">
              <Terminal class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>请选择操作类型并配置选项</p>
            </div>
          </div>
        </div>

        <!-- 命令说明 -->
        <div v-if="generatedCommand" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">命令说明</h2>
          <div class="space-y-3 text-sm text-muted-foreground">
            <div v-for="desc in commandDescription" :key="desc" class="flex gap-2">
              <span class="text-primary">•</span>
              <span>{{ desc }}</span>
            </div>
          </div>
        </div>

        <!-- 常用命令示例 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">常用命令示例</h2>
          <div class="space-y-3">
            <div
              v-for="example in commandExamples"
              :key="example.title"
              class="p-3 bg-muted rounded-lg"
            >
              <h4 class="font-medium text-sm mb-1">{{ example.title }}</h4>
              <code class="text-xs text-muted-foreground">{{ example.command }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Git 流程指南 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          Git 工作流程指南
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium text-foreground mb-2">基础工作流程</h4>
            <ol class="space-y-2 text-sm text-muted-foreground">
              <li>1. <code>git init</code> - 初始化仓库</li>
              <li>2. <code>git add .</code> - 添加文件到暂存区</li>
              <li>3. <code>git commit -m "message"</code> - 提交更改</li>
              <li>4. <code>git remote add origin url</code> - 添加远程仓库</li>
              <li>5. <code>git push -u origin main</code> - 推送到远程</li>
            </ol>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">分支工作流程</h4>
            <ol class="space-y-2 text-sm text-muted-foreground">
              <li>1. <code>git checkout -b feature</code> - 创建功能分支</li>
              <li>2. 开发和提交更改</li>
              <li>3. <code>git checkout main</code> - 切回主分支</li>
              <li>4. <code>git merge feature</code> - 合并分支</li>
              <li>5. <code>git push origin main</code> - 推送主分支</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Info, Terminal } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'dev', name: '开发辅助', description: '开发辅助工具集合' }

// 状态管理
const selectedCategory = ref('')
const copied = ref(false)

// 配置选项
const config = ref({
  // 初始化
  repoName: '',
  bare: false,
  // 克隆
  repoUrl: '',
  targetDir: '',
  depth: false,
  // 提交
  commitMessage: '',
  addOption: 'all',
  specificFiles: '',
  amend: false,
  // 分支
  branchAction: 'create',
  branchName: '',
  forceDelete: false,
  // 推送
  remote: 'origin',
  branch: 'main',
  setUpstream: false,
  force: false,
  // 拉取
  rebase: false,
  // 合并
  sourceBranch: '',
  noCommit: false,
  squash: false
})

// 命令类别
const commandCategories = [
  { value: 'init', name: '初始化', description: '创建新的 Git 仓库' },
  { value: 'clone', name: '克隆', description: '克隆远程仓库' },
  { value: 'commit', name: '提交', description: '提交更改到仓库' },
  { value: 'branch', name: '分支', description: '管理 Git 分支' },
  { value: 'push', name: '推送', description: '推送到远程仓库' },
  { value: 'pull', name: '拉取', description: '从远程仓库拉取' },
  { value: 'merge', name: '合并', description: '合并分支' }
]

// 生成命令
const generatedCommand = computed(() => {
  if (!selectedCategory.value) return ''

  let commands = []

  switch (selectedCategory.value) {
    case 'init':
      if (config.value.repoName) {
        commands.push(`mkdir ${config.value.repoName}`)
        commands.push(`cd ${config.value.repoName}`)
      }
      const initCmd = ['git init']
      if (config.value.bare) initCmd.push('--bare')
      commands.push(initCmd.join(' '))
      break

    case 'clone':
      const cloneCmd = ['git clone']
      if (config.value.depth) cloneCmd.push('--depth 1')
      cloneCmd.push(config.value.repoUrl || '<repository-url>')
      if (config.value.targetDir) cloneCmd.push(config.value.targetDir)
      commands.push(cloneCmd.join(' '))
      break

    case 'commit':
      if (config.value.addOption === 'all') {
        commands.push('git add .')
      } else if (config.value.addOption === 'specific' && config.value.specificFiles) {
        commands.push(`git add ${config.value.specificFiles}`)
      }

      const commitCmd = ['git commit']
      if (config.value.amend) commitCmd.push('--amend')
      if (config.value.commitMessage) {
        commitCmd.push(`-m "${config.value.commitMessage}"`)
      }
      commands.push(commitCmd.join(' '))
      break

    case 'branch':
      switch (config.value.branchAction) {
        case 'create':
          commands.push(`git branch ${config.value.branchName || '<branch-name>'}`)
          break
        case 'switch':
          commands.push(`git switch ${config.value.branchName || '<branch-name>'}`)
          break
        case 'create-switch':
          commands.push(`git switch -c ${config.value.branchName || '<branch-name>'}`)
          break
        case 'delete':
          const deleteCmd = ['git branch']
          if (config.value.forceDelete) deleteCmd.push('-D')
          else deleteCmd.push('-d')
          deleteCmd.push(config.value.branchName || '<branch-name>')
          commands.push(deleteCmd.join(' '))
          break
        case 'list':
          commands.push('git branch -a')
          break
      }
      break

    case 'push':
      const pushCmd = ['git push']
      if (config.value.setUpstream) pushCmd.push('-u')
      if (config.value.force) pushCmd.push('--force')
      pushCmd.push(config.value.remote || 'origin')
      pushCmd.push(config.value.branch || 'main')
      commands.push(pushCmd.join(' '))
      break

    case 'pull':
      const pullCmd = ['git pull']
      if (config.value.rebase) pullCmd.push('--rebase')
      pullCmd.push(config.value.remote || 'origin')
      pullCmd.push(config.value.branch || 'main')
      commands.push(pullCmd.join(' '))
      break

    case 'merge':
      const mergeCmd = ['git merge']
      if (config.value.noCommit) mergeCmd.push('--no-commit')
      if (config.value.squash) mergeCmd.push('--squash')
      mergeCmd.push(config.value.sourceBranch || '<source-branch>')
      commands.push(mergeCmd.join(' '))
      break
  }

  return commands.join('\n')
})

// 命令说明
const commandDescription = computed(() => {
  if (!selectedCategory.value) return []

  const descriptions = {
    init: [
      'git init 用于在当前目录创建一个新的 Git 仓库',
      '使用 --bare 参数可以创建裸仓库，通常用于作为远程仓库',
      '裸仓库不包含工作目录，只包含 Git 版本控制数据'
    ],
    clone: [
      'git clone 用于从远程仓库复制到本地',
      '--depth 1 参数只克隆最新的一次提交，减少下载时间',
      '可以指定目标目录名，不指定则使用仓库名'
    ],
    commit: [
      'git add 将文件添加到暂存区，准备提交',
      'git commit 将暂存区的更改提交到本地仓库',
      '--amend 可以修改最后一次提交（谨慎使用）'
    ],
    branch: [
      'git branch 用于创建、列出、删除分支',
      'git switch 用于切换分支',
      '-D 强制删除未合并的分支（谨慎使用）'
    ],
    push: [
      'git push 将本地提交推送到远程仓库',
      '-u 参数设置上游分支，后续可以直接使用 git push',
      '--force 强制推送（可能覆盖远程更改，谨慎使用）'
    ],
    pull: [
      'git pull 从远程仓库获取最新更改并合并',
      '--rebase 使用 rebase 而不是 merge，保持线性历史',
      '相当于 git fetch + git merge'
    ],
    merge: [
      'git merge 将其他分支的更改合并到当前分支',
      '--no-commit 合并但不自动提交',
      '--squash 将多个提交压缩为一个'
    ]
  }

  return descriptions[selectedCategory.value] || []
})

// 常用命令示例
const commandExamples = [
  {
    title: '初始化新项目',
    command: 'git init && git add . && git commit -m "Initial commit"'
  },
  {
    title: '创建功能分支',
    command: 'git checkout -b feature/new-feature'
  },
  {
    title: '暂存当前工作',
    command: 'git stash push -m "Work in progress"'
  },
  {
    title: '查看提交历史',
    command: 'git log --oneline --graph --all'
  },
  {
    title: '撤销未提交的更改',
    command: 'git checkout -- file.js'
  },
  {
    title: '撤销最后一次提交',
    command: 'git reset --soft HEAD~1'
  }
]

// 复制命令
const copyCommand = async () => {
  try {
    await navigator.clipboard.writeText(generatedCommand.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败', error)
  }
}

// 监听类别变化
watch(selectedCategory, () => {
  // 重置配置
  config.value = {
    // 初始化
    repoName: '',
    bare: false,
    // 克隆
    repoUrl: '',
    targetDir: '',
    depth: false,
    // 提交
    commitMessage: '',
    addOption: 'all',
    specificFiles: '',
    amend: false,
    // 分支
    branchAction: 'create',
    branchName: '',
    forceDelete: false,
    // 推送
    remote: 'origin',
    branch: 'main',
    setUpstream: false,
    force: false,
    // 拉取
    rebase: false,
    // 合并
    sourceBranch: '',
    noCommit: false,
    squash: false
  }
})

// SEO配置
useSeoMeta({
  title: 'Git 命令生成器 - 可视化 Git 命令生成工具',
  description: '免费的在线 Git 命令生成器，可视化配置生成 Git 命令，支持初始化、克隆、提交、分支、推送、拉取、合并等常用 Git 操作。',
  keywords: ['git', '命令生成', '版本控制', 'git命令', '可视化', 'github', 'gitlab']
})


</script>