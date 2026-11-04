/**
 * 工具徽章规则（全站唯一来源）
 *
 * 为什么不显示 NEW：
 * - tools.js 里 `new: true` 占 97.5%（729/748），已失去区分度，等于"每张卡都挂标"。
 * - 若改用「N 天内新增」的时间窗，SSG 构建期与客户端 hydration 的 Date.now()
 *   可能跨天不一致；Tauri 离线包长期不更新后徽章还会自行消失，行为不可预期。
 *
 * 因此徽章只保留数据里真实标注的 hot（107/748，约 14%）。
 * "最近更新"应作为有序列表区块呈现，而不是给每张卡打标。
 *
 * @param {object} tool tools.js 中的工具条目
 * @returns {{ label: string, class: string } | null}
 */
export function getToolBadge(tool) {
  if (!tool || tool.hot !== true) return null
  return {
    label: 'HOT',
    class: 'bg-red-500/20 text-red-400'
  }
}
