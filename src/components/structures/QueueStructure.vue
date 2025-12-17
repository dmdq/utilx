<template>
  <g>
    <!-- 队列容器 -->
    <rect
      :x="containerX - 60"
      :y="containerY - 40"
      :width="Math.max(200, sortedNodes.length * 70 + 40)"
      height="80"
      fill="none"
      stroke="#cbd5e1"
      stroke-width="2"
      stroke-dasharray="4,2"
    />

    <!-- Front 和 Rear 标记 -->
    <text
      :x="containerX - 70"
      :y="containerY"
      fill="#dc2626"
      font-size="12"
      font-weight="bold"
      text-anchor="end"
    >
      Front
    </text>

    <text
      :x="containerX + sortedNodes.length * 70 + 50"
      :y="containerY"
      fill="#2563eb"
      font-size="12"
      font-weight="bold"
    >
      Rear
    </text>

    <!-- 队列标签 -->
    <text
      :x="containerX + Math.max(200, sortedNodes.length * 70 + 40) / 2"
      :y="containerY - 50"
      fill="#64748b"
      font-size="14"
      font-weight="bold"
      text-anchor="middle"
    >
      QUEUE
    </text>

    <!-- 渲染队列节点 -->
    <g
      v-for="(node, index) in sortedNodes"
      :key="node.id"
      @click="$emit('node-select', node.id, $event)"
      :transform="`translate(${node.x}, ${node.y})`"
    >
      <!-- 节点矩形 -->
      <rect
        :x="-30"
        :y="-20"
        :width="60"
        :height="40"
        :fill="node.color"
        :stroke="selectedNodes.includes(node.id) ? '#2563eb' : '#64748b'"
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

    <!-- Enqueue/Dequeue 箭头 -->
    <g>
      <defs>
        <marker
          id="enqueueArrow"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 5, 0 10, 3 5"
            fill="#2563eb"
          />
        </marker>

        <marker
          id="dequeueArrow"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 5, 0 10, 3 5"
            fill="#dc2626"
          />
        </marker>
      </defs>

      <!-- Enqueue 箭头 -->
      <line
        :x1="containerX + sortedNodes.length * 70 + 60"
        :y1="containerY - 30"
        :x2="containerX + sortedNodes.length * 70 + 20"
        :y2="containerY"
        stroke="#2563eb"
        stroke-width="2"
        marker-end="url(#enqueueArrow)"
      />

      <text
        :x="containerX + sortedNodes.length * 70 + 65"
        :y="containerY - 35"
        fill="#2563eb"
        font-size="12"
      >
        enqueue
      </text>

      <!-- Dequeue 箭头 -->
      <line
        v-if="sortedNodes.length > 0"
        :x1="containerX - 50"
        :y1="containerY + 30"
        :x2="containerX - 20"
        :y2="containerY"
        stroke="#dc2626"
        stroke-width="2"
        marker-end="url(#dequeueArrow)"
      />

      <text
        :x="containerX - 55"
        :y="containerY + 35"
        fill="#dc2626"
        font-size="12"
        text-anchor="end"
      >
        dequeue
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

// 队列容器位置
const containerX = 100
const containerY = 200

// 按x坐标排序节点
const sortedNodes = computed(() => {
  return [...props.nodes].sort((a, b) => a.x - b.x)
})
</script>