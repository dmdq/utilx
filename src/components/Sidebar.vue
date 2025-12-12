<template>
  <div class="flex flex-col h-full bg-sidebar" :class="{ 'lg:w-20': collapsed }">
    <!-- Logo -->
    <div class="logo h-16 flex items-center px-6 border-b border-sidebar-border">
      <div class="flex items-center gap-2.5">
        <div 
          class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20 cursor-pointer"
          @click="$router.push('/')"
        >
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="32" 
            height="24" 
            viewBox="0 0 32 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            class="lucide lucide-terminal w-5 h-5 "
          >
            <!-- 原有结构 (完全保留，坐标不变) -->
            <!-- 下划线光标 -->
            <path d="M12 19h8"></path>
            <!-- 左侧箭头 -->
            <path d="m4 17 6-6-6-6"></path>

            <!-- 新增部分：右侧扩展的 T -->
            <!-- 逻辑：在 x=20 (下划线终点) 右侧留出 2px 间隙，从 x=22 开始绘制 T -->
            <!-- T 的头部 (Hammer Head) -->
            <path d="M22 12h6"></path>
            <!-- T 的柄 (Handle)，底部与下划线对齐 -->
            <path d="M25 12v7"></path>
          </svg>
          <!-- <Terminal class="w-5 h-5" /> -->
        </div>
        <div :class="{ 'lg:hidden': collapsed }">
          <h1 
            class="font-bold text-lg tracking-tight cursor-pointer"
            @click="$router.push('/')"
          >Util.cn</h1>
          <div class="flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span class="text-[10px] text-muted-foreground uppercase font-mono">System Online v1.0.0</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 导航菜单 -->
    <div class="flex-1 overflow-y-auto no-scrollbar px-3 py-2 space-y-6">
      <!-- 主要页面导航 -->
      <div>
        <nav class="space-y-0.5">
          <NuxtLink 
            to="/" 
            class="nav-item w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="[
              $route.path === '/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              { 'lg:justify-center lg:px-0 lg:gap-0': collapsed }
            ]"
            exact
          >
            <Home class="w-4 h-4" />
            <span :class="{ 'lg:hidden': collapsed }">首页</span>
          </NuxtLink>
          
          <NuxtLink 
            to="/explore/" 
            class="nav-item w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="[
              $route.path === '/explore/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              { 'lg:justify-center lg:px-0 lg:gap-0': collapsed }
            ]"
          >
            <Compass class="w-4 h-4" />
            <span :class="{ 'lg:hidden': collapsed }">探索</span>
          </NuxtLink>
          
          <NuxtLink
            to="/recent/"
            class="nav-item w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="[
              $route.path === '/recent/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              { 'lg:justify-center lg:px-0 lg:gap-0': collapsed }
            ]"
          >
            <Clock class="w-4 h-4" />
            <span :class="{ 'lg:hidden': collapsed }">最近使用</span>
          </NuxtLink>

          <NuxtLink
            to="/favorites/"
            class="nav-item w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="[
              $route.path === '/favorites/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              { 'lg:justify-center lg:px-0 lg:gap-0': collapsed }
            ]"
          >
            <Heart class="w-4 h-4 text-red-500" />
            <span :class="{ 'lg:hidden': collapsed }">我的收藏</span>
          </NuxtLink>

          <NuxtLink
            to="/sitemap/"
            class="nav-item w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="[
              $route.path === '/sitemap/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              { 'lg:justify-center lg:px-0 lg:gap-0': collapsed }
            ]"
          >
            <Map class="w-4 h-4" />
            <span :class="{ 'lg:hidden': collapsed }">站点地图</span>
          </NuxtLink>

          <NuxtLink
            to="/ai/"
            class="nav-item w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="[
              $route.path === '/ai/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              { 'lg:justify-center lg:px-0 lg:gap-0': collapsed }
            ]"
          >
            <Sparkles class="w-4 h-4 text-purple-500" />
            <span :class="{ 'lg:hidden': collapsed }">AI 导航</span>
          </NuxtLink>

          </nav>
      </div>

      <!-- 分割线 -->
      <div class="border-t border-sidebar-border my-2"></div>

      <!-- 分类导航 -->
      <div>
        <h3 class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2" :class="{ 'lg:hidden': collapsed }">工具箱</h3>
        <nav class="space-y-0.5" id="categoryNav">
          <NuxtLink
            to="/all/"
            class="nav-item w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="[
              $route.path === '/all/' || (currentCategory === 'all' && $route.path !== '/') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              { 'lg:justify-center lg:px-0 lg:gap-0': collapsed }
            ]"
          >
            <LayoutGrid class="w-4 h-4" />
            <span :class="{ 'lg:hidden': collapsed }">全部工具</span>
          </NuxtLink>
          <NuxtLink
            v-for="category in categoriesWithIcons"
            :key="category.id"
            :to="`/${category.id}/`"
            class="nav-item w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="[
              $route.path === `/${category.id}/` || currentCategory === category.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              { 'lg:justify-center lg:px-0 lg:gap-0': collapsed }
            ]"
          >
            <component :is="category.iconComponent" class="w-4 h-4" />
            <span :class="{ 'lg:hidden': collapsed }">{{ category.name }}</span>
          </NuxtLink>
        </nav>
      </div>

      </div>

    <!-- 底部用户/反馈区 -->
    <div class="p-4 border-t border-sidebar-border bg-sidebar" :class="{ 'lg:hidden': collapsed }">
      <NuxtLink to="/feedback/" class="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/50 transition-colors group">
        <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
          Dev
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate group-hover:text-primary transition-colors">提交反馈</p>
          <p class="text-xs text-muted-foreground truncate">问题反馈 & 功能建议</p>
        </div>
        <MessageSquarePlus class="w-4 h-4 text-muted-foreground group-hover:text-primary" />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue'
import {
  Terminal, LayoutGrid, Code2, ShieldCheck, Server, ImageIcon,
  FileJson, Clock, ArrowRight, MessageSquarePlus, FileText, Lock,
  Shield, Type, Wifi, Code, Image, Home, Compass, Sparkles, ChevronRight, Heart, Map
} from 'lucide-vue-next'
import { categories } from '~/data/categories'
import { useRoute } from 'vue-router'

// 创建图标映射
const iconMap = {
  FileText,
  Lock,
  Shield,
  Clock,
  Type,
  Wifi,
  ImageIcon,
  Code,
  Image,
  LayoutGrid
}

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  },
  currentCategory: {
    type: String,
    default: 'all'
  }
})

const route = useRoute()

// 为每个分类添加图标组件
const categoriesWithIcons = computed(() => {
  return categories.map(category => ({
    ...category,
    iconComponent: iconMap[category.icon] || FileText
  }))
})
</script>
