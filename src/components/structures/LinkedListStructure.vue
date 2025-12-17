<template>
  <g>
    <!-- 渲染连接箭头 -->
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon
          points="0 0, 10 3.5, 0 7"
          fill="#64748b"
        />
      </marker>
    </defs>

    <!-- 渲染节点和连接 -->
    <g
      v-for="(node, index) in sortedNodes"
      :key="node.id"
    >
      <!-- 连接线 -->
      <line
        v-if="index < sortedNodes.length - 1"
        :x1="node.x + node.size / 2"
        :y1="node.y"
        :x2="sortedNodes[index + 1].x - sortedNodes[index + 1].size / 2"
        :y2="sortedNodes[index + 1].y"
        stroke="#64748b"
        stroke-width="2"
        marker-end="url(#arrowhead)"
      />

      <!-- 节点组 -->
      <g
        @click="$emit('node-select', node.id, $event)"
        :transform="`translate(${node.x}, ${node.y})`"
      >
        <!-- 节点矩形 -->
        <rect
          :x="-node.size / 2"
          :y="-node.size / 2"
          :width="node.size"
          :height="node.size"
          :fill="node.color"
          :stroke="selectedNodes.includes(node.id) ? '#ea580c' : '#64748b'"
          :stroke-width="selectedNodes.includes(node.id) ? 3 : 2"
          rx="4"
          class="hover:opacity-80 transition-opacity cursor-pointer"
        />

        <!-- 节点文本 -->
        <text
          text-anchor="middle"
          dy="0.3em"
          fill="white"
          font-size="12"
          font-weight="bold"
          pointer-events="none"
        >
          {{ node.value }}
        </text>

        <!-- Next指针标签 -->
        <text
          :x="node.size / 2 - 5"
          :y="-5"
          fill="#64748b"
          font-size="10"
          pointer-events="none"
        >
          next
        </text>
      </g>

      <!-- NULL 标记 -->
      <g v-if="index === sortedNodes.length - 1">
        <line
          :x1="node.x + node.size / 2"
          :y1="node.y"
          :x2="node.x + node.size / 2 + 30"
          :y2="node.y"
          stroke="#64748b"
          stroke-width="2"
          marker-end="url(#arrowhead)"
        />
        <text
          :x="node.x + node.size / 2 + 35"
          :y="node.y + 5"
          fill="#ef4444"
          font-size="14"
          font-weight="bold"
        >
          NULL
        </text>
      </g>
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

// 按x坐标排序节点
const sortedNodes = computed(() => {
  return [...props.nodes].sort((a, b) => a.x - b.x)
})
</script>