import { defineNuxtPlugin } from '#app'
import tagManager from '~/utils/tagManager'

export default defineNuxtPlugin(async (nuxtApp) => {
  // 在服务端和客户端都初始化
  if (process.server || process.client) {
    await tagManager.init()
  }

  // 将实例注入到应用上下文
  nuxtApp.provide('tagManager', tagManager)

  console.log('TagManager plugin initialized:', tagManager)
})