<template>
  <g>
    <!-- 渲染数组元素 -->
    <g
      v-for="(node, index) in sortedNodes"
      :key="node.id"
      @click="$emit('node-select', node.id, $event)"
      :transform="`translate(${node.x}, ${node.y})`"
    >
      <!-- 数组方框 -->
      <rect
        :x="-30"
        :y="-20"
        :width="60"
        :height="40"
        :fill="node.color"
        :stroke="selectedNodes.includes(node.id) ? '#dc2626' : '#64748b'"
        :stroke-width="selectedNodes.includes(node.id) ? 3 : 2"
        rx="4"
        class="hover:opacity-80 transition-opacity cursor-pointer"
      />

      <!-- 节点文本 -->
      <text
        text-anchor="middle"
        dy="0.3em"
        fill="white"
        font-size="14"
        font-weight="bold"
        pointer-events="none"
      >
        {{ node.value }}
      </text>

      <!-- 索引标签 -->
      <text
        text-anchor="middle"
        :y="-25"
        fill="#64748b"
        font-size="12"
        pointer-events="none"
      >
        [{{ index }}]
      </text>
    </g>

    <!-- 连接线表示数组顺序 -->
    <path
      v-if="sortedNodes.length > 1"
      :d="createPath()"
      fill="none"
      stroke="#cbd5e1"
      stroke-width="1"
      stroke-dasharray="4,2"
    />
  </g>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  nodes: {
    type: Array,
    default: () => []
  },
  edges: {
    type: Array,
    default: () => []
  },
  selectedNodes: {
    type: Array,
    default: () => []
  }
})

defineEmits(['node-select'])

// 按x坐标排序节点，形成数组顺序
const sortedNodes = computed(() => {
  return [...props.nodes].sort((a, b) => a.x - b.x)
})

// 创建连接路径
const createPath = () => {
  const sorted = sortedNodes.value
  if (sorted.length < 2) return ''

  let path = `M ${sorted[0].x} ${sorted[0].y + 20}`
  for (let i = 1; i < sorted.length; i++) {
    path += ` L ${sorted[i].x} ${sorted[i].y + 20}`
  }

  return path
}
</script>