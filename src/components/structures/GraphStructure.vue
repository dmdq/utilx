<template>
  <g>
    <!-- 渲染边 - 无向图使用直线 -->
    <line
      v-for="edge in edges"
      :key="`${edge.from}-${edge.to}`"
      :x1="nodes.find(n => n.id === edge.from)?.x"
      :y1="nodes.find(n => n.id === edge.from)?.y"
      :x2="nodes.find(n => n.id === edge.to)?.x"
      :y2="nodes.find(n => n.id === edge.to)?.y"
      stroke="#94a3b8"
      stroke-width="2"
    />

    <!-- 渲染节点 -->
    <g
      v-for="node in nodes"
      :key="node.id"
      @click="$emit('node-select', node.id, $event)"
      :transform="`translate(${node.x}, ${node.y})`"
    >
      <!-- 节点圆形 -->
      <circle
        :r="node.size / 2"
        :fill="node.color"
        :stroke="selectedNodes.includes(node.id) ? '#059669' : '#64748b'"
        :stroke-width="selectedNodes.includes(node.id) ? 3 : 2"
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
  </g>
</template>

<script setup>
defineProps({
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
</script>