<template>
  <div class="max-w-8xl mx-auto py-8">
    <div class="text-center mb-12">
      <h1 class="text-3xl font-bold text-foreground mb-4">下载 Util.cn 桌面版</h1>
      <p class="text-muted-foreground">享受离线使用和更多高级功能</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      <!-- Windows 版本 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-blue-500">
              <path d="M16 22h2a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v3"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <path d="M4 18.5V22h3.5"></path>
              <path d="M14 13.5V16h2.5"></path>
              <path d="M16 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
              <path d="M8 13.5V16h2.5"></path>
              <path d="M10 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold">Windows 版本</h2>
            <p class="text-sm text-muted-foreground">适用于 Windows 10/11</p>
          </div>
        </div>
        
        <div class="space-y-3">
          <a 
            href="#" 
            class="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
          >
            <div class="flex items-center gap-3">
              <Download class="w-5 h-5 text-primary" />
              <span>Windows Installer (.exe)</span>
            </div>
            <span class="text-sm text-muted-foreground">64-bit</span>
          </a>
          
          <a 
            href="#" 
            class="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
          >
            <div class="flex items-center gap-3">
              <Package class="w-5 h-5 text-primary" />
              <span>Portable Version (.zip)</span>
            </div>
            <span class="text-sm text-muted-foreground">64-bit</span>
          </a>
        </div>
        
        <div class="mt-6 pt-4 border-t border-border">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">版本:</span>
            <span>v1.0.0</span>
          </div>
          <div class="flex items-center justify-between text-sm mt-2">
            <span class="text-muted-foreground">大小:</span>
            <span>85 MB</span>
          </div>
          <div class="flex items-center justify-between text-sm mt-2">
            <span class="text-muted-foreground">更新时间:</span>
            <span>2024-01-15</span>
          </div>
        </div>
      </div>
      
      <!-- macOS 版本 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 bg-gray-500/10 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-gray-500">
              <path d="M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z"></path>
              <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path>
              <path d="M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z"></path>
              <path d="M10 12a2 2 0 1 1-4 0c0-1.1.9-2 2-2s2 .9 2 2z"></path>
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold">macOS 版本</h2>
            <p class="text-sm text-muted-foreground">适用于 macOS 10.15 及以上</p>
          </div>
        </div>
        
        <div class="space-y-3">
          <a 
            href="#" 
            class="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
          >
            <div class="flex items-center gap-3">
              <Download class="w-5 h-5 text-primary" />
              <span>Intel Chip (.dmg)</span>
            </div>
            <span class="text-sm text-muted-foreground">x64</span>
          </a>
          
          <a 
            href="#" 
            class="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
          >
            <div class="flex items-center gap-3">
              <Download class="w-5 h-5 text-primary" />
              <span>Apple Silicon (.dmg)</span>
            </div>
            <span class="text-sm text-muted-foreground">ARM64</span>
          </a>
        </div>
        
        <div class="mt-6 pt-4 border-t border-border">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">版本:</span>
            <span>v1.0.0</span>
          </div>
          <div class="flex items-center justify-between text-sm mt-2">
            <span class="text-muted-foreground">大小:</span>
            <span>Intel: 78 MB / Apple Silicon: 75 MB</span>
          </div>
          <div class="flex items-center justify-between text-sm mt-2">
            <span class="text-muted-foreground">更新时间:</span>
            <span>2024-01-15</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-card border border-border rounded-xl p-6">
      <h2 class="text-xl font-semibold mb-4">系统要求</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-medium mb-2 flex items-center gap-2">
            <Monitor class="w-5 h-5 text-primary" />
            Windows
          </h3>
          <ul class="text-sm text-muted-foreground space-y-1">
            <li>• Windows 10 或更高版本</li>
            <li>• 至少 2GB RAM</li>
            <li>• 至少 100MB 可用磁盘空间</li>
            <li>• 支持 SSE2 指令集</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2 flex items-center gap-2">
            <Monitor class="w-5 h-5 text-primary" />
            macOS
          </h3>
          <ul class="text-sm text-muted-foreground space-y-1">
            <li>• macOS 10.15 (Catalina) 或更高版本</li>
            <li>• 至少 2GB RAM</li>
            <li>• 至少 100MB 可用磁盘空间</li>
            <li>• Intel 或 Apple Silicon 处理器</li>
          </ul>
        </div>
      </div>
    </div>
    
    <div class="mt-8 text-center text-sm text-muted-foreground">
      <p>下载即表示您同意我们的 <NuxtLink to="/terms/" class="text-primary hover:underline">服务条款</NuxtLink> 和 <NuxtLink to="/privacy/" class="text-primary hover:underline">隐私政策</NuxtLink></p>
    </div>
    
   
  </div>
</template>

<script setup>
import { Download, Package, Monitor } from 'lucide-vue-next'
import Footer from '~/components/Footer.vue'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

// 使用SEO composable设置页面标题
const { setPageTitle } = useSEO()
setPageTitle('下载 Util.cn 桌面版')

</script>