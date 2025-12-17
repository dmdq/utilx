<template>
  <g>
    <!-- 栈容器 -->
    <rect
      :x="containerX - 60"
      :y="containerY - 60"
      width="120"
      :height="Math.max(120, sortedNodes.length * 50 + 20)"
      fill="none"
      stroke="#cbd5e1"
      stroke-width="2"
      stroke-dasharray="4,2"
    />

    <!-- 栈标签 -->
    <text
      :x="containerX + 70"
      :y="containerY - 40"
      fill="#64748b"
      font-size="14"
      font-weight="bold"
    >
      STACK
    </text>

    <!-- Top 标记 -->
    <text
      :x="containerX - 70"
      :y="containerY - 40"
      fill="#059669"
      font-size="12"
      font-weight="bold"
    >
      TOP
    </text>

    <!-- 渲染栈节点 -->
    <g
      v-for="(node, index) in sortedNodes"
      :key="node.id"
      @click="$emit('node-select', node.id, $event)"
      :transform="`translate(${node.x}, ${node.y})`"
    >
      <!-- 节点矩形 -->
      <rect
        :x="-40"
        :y="-20"
        :width="80"
        :height="40"
        :fill="node.color"
        :stroke="selectedNodes.includes(node.id) ? '#7c3aed' : '#64748b'"
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
    </g>

    <!-- Push/Pop 箭头 -->
    <g v-if="sortedNodes.length > 0">
      <!-- Push 箭头 -->
      <defs>
        <marker
          id="pushArrow"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 5, 0 10, 3 5"
            fill="#10b981"
          />
        </marker>
      </defs>

      <line
        :x1="containerX"
        :y1="containerY - 80"
        :x2="containerX"
        :y2="containerY - sortedNodes.length * 25 - 10"
        stroke="#10b981"
        stroke-width="2"
        marker-end="url(#pushArrow)"
      />

      <text
        :x="containerX + 15"
        :y="containerY - 60"
        fill="#10b981"
        font-size="12"
      >
        push
      </text>
    </g>
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

// 栈容器位置
const containerX = 200
const containerY = 200

// 按y坐标倒序排序，栈顶在前
const sortedNodes = computed(() => {
  return [...props.nodes].sort((a, b) => a.y - b.y)
})
</script>