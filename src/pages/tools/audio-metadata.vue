<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Tags class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">MP3标签编辑</h1>
          <p class="text-sm text-muted-foreground mt-1">查看与编辑 ID3 标签（标题/歌手/专辑/封面），字节级重建标签、音频数据原字节保留，本地完成</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        上传 MP3 后按 ID3v2.3 / ID3v2.4 官方规范逐帧解析标签：标题、艺术家、专辑、音轨、年份、流派、作曲、注释与内嵌封面图，
        支持四种文本编码（ISO-8859-1 / UTF-16 / UTF-16BE / UTF-8）。编辑后重建 ID3v2.3 标签写回文件——
        只替换标签字节，音频帧数据一个字节都不动，无转码无音质损失；无标签的 MP3 也能直接添加。
        纯 JavaScript 解析与写回，全部在浏览器本地完成。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：解析与写回全部在本机内存完成，不会上传到任何服务器。
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左：文件选择 + 编辑表单 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <FileAudio class="w-5 h-5 mr-2 text-primary" /> 选择 MP3 文件
          </h2>
        </div>

        <input ref="fileInput" type="file" accept=".mp3,audio/mpeg" class="hidden" @change="onFileChange" />
        <input ref="coverInput" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" class="hidden" @change="onCoverChange" />

        <div v-if="!fileInfo">
          <button
            @click="triggerPick"
            class="w-full py-12 border-2 border-dashed border-border rounded-lg hover:bg-muted/60 transition-colors flex flex-col items-center gap-3 text-muted-foreground"
          >
            <Upload class="w-8 h-8 text-primary" />
            <span class="text-sm font-medium text-foreground">点击选择 MP3 文件</span>
            <span class="text-xs">按文件头识别 ID3 标签，文件仅在本地解析</span>
          </button>
        </div>
        <div v-else class="flex items-center gap-3 bg-muted/50 border border-border rounded-lg px-3 py-2.5">
          <Music class="w-5 h-5 text-primary flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-foreground truncate" :title="fileInfo.name">{{ fileInfo.name }}</p>
            <p class="text-xs text-muted-foreground">{{ formatSize(fileInfo.size) }}</p>
          </div>
          <button @click="triggerPick" class="text-xs text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
            重新选择
          </button>
        </div>
        <p v-if="loadError" class="text-sm text-red-500">{{ loadError }}</p>

        <template v-if="fileInfo">
          <div class="border-t border-border pt-4 space-y-4">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <PenLine class="w-5 h-5 mr-2 text-primary" /> 编辑标签（保存后重建为 ID3v2.3）
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="sm:col-span-2">
                <label class="block text-xs font-medium text-muted-foreground mb-1" for="f-title">标题 (TIT2)</label>
                <input id="f-title" v-model="form.title" type="text" class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="歌曲名" />
              </div>
              <div>
                <label class="block text-xs font-medium text-muted-foreground mb-1" for="f-artist">艺术家 (TPE1)</label>
                <input id="f-artist" v-model="form.artist" type="text" class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="歌手名" />
              </div>
              <div>
                <label class="block text-xs font-medium text-muted-foreground mb-1" for="f-album">专辑 (TALB)</label>
                <input id="f-album" v-model="form.album" type="text" class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="专辑名" />
              </div>
              <div>
                <label class="block text-xs font-medium text-muted-foreground mb-1" for="f-album-artist">专辑艺术家 (TPE2)</label>
                <input id="f-album-artist" v-model="form.albumArtist" type="text" class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="合集/原声作者" />
              </div>
              <div>
                <label class="block text-xs font-medium text-muted-foreground mb-1" for="f-genre">流派 (TCON)</label>
                <input id="f-genre" v-model="form.genre" type="text" class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="如 Pop" />
              </div>
              <div>
                <label class="block text-xs font-medium text-muted-foreground mb-1" for="f-track">音轨 (TRCK)</label>
                <input id="f-track" v-model="form.track" type="text" class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="如 3/12" />
              </div>
              <div>
                <label class="block text-xs font-medium text-muted-foreground mb-1" for="f-year">年份 (TYER)</label>
                <input id="f-year" v-model="form.year" type="text" class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="如 2024" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs font-medium text-muted-foreground mb-1" for="f-composer">作曲 (TCOM)</label>
                <input id="f-composer" v-model="form.composer" type="text" class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="作曲者" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs font-medium text-muted-foreground mb-1" for="f-comment">注释 (COMM)</label>
                <textarea id="f-comment" v-model="form.comment" rows="2" class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y" placeholder="备注信息（可选）"></textarea>
              </div>
            </div>

            <!-- 封面图 -->
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1.5">封面图 (APIC，写入 picture type 3 front cover)</label>
              <div v-if="coverPreviewUrl" class="flex items-center gap-3 bg-muted/40 border border-border rounded-lg p-3">
                <img :src="coverPreviewUrl" alt="封面预览" class="w-16 h-16 object-cover rounded border border-border" />
                <div class="flex-1 min-w-0 text-xs text-muted-foreground">
                  <p class="text-foreground font-medium">{{ coverLabel }}</p>
                  <p class="mt-0.5">{{ coverSizeLabel }}</p>
                  <div class="flex flex-wrap gap-2 mt-2">
                    <button @click="triggerCoverPick" class="px-2 py-1 rounded border border-border bg-background text-foreground hover:bg-muted/60 transition-colors">更换封面</button>
                    <button v-if="coverState === 'removed' && hasTagCover" @click="restoreTagCover" class="px-2 py-1 rounded border border-border bg-background text-foreground hover:bg-muted/60 transition-colors">恢复原封面</button>
                    <button v-if="coverState !== 'removed'" @click="removeCover" class="px-2 py-1 rounded border border-border bg-background text-muted-foreground hover:text-red-500 transition-colors">移除封面</button>
                  </div>
                </div>
              </div>
              <button
                v-else
                @click="triggerCoverPick"
                class="w-full py-5 border-2 border-dashed border-border rounded-lg hover:bg-muted/60 transition-colors flex flex-col items-center gap-1.5 text-muted-foreground"
              >
                <ImagePlus class="w-5 h-5 text-primary" />
                <span class="text-xs">{{ hasTagCover ? '原封面已标记移除，点击重新上传' : '上传封面图（JPEG / PNG，可选）' }}</span>
              </button>
            </div>

            <!-- 文本编码 -->
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1.5">写回文本编码</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  v-for="e in encOptions"
                  :key="e.id"
                  @click="textEnc = e.id"
                  :class="textEnc === e.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-md text-xs font-medium transition-all"
                >{{ e.label }}</button>
              </div>
              <p class="text-xs text-muted-foreground mt-1.5">ID3v2.3 标准编码为 ISO-8859-1 与 UTF-16；UTF-8 是 ID3v2.4 引入的编码，主流播放器/手机/车机均支持（默认），个别老设备不识别时可选 UTF-16。</p>
            </div>

            <button
              @click="saveTags"
              :disabled="isSaving"
              class="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
              <Download v-else class="w-4 h-4" />
              {{ isSaving ? '正在重建标签...' : '重建 ID3v2.3 标签并生成新文件' }}
            </button>
            <p v-if="saveError" class="text-sm text-red-500">{{ saveError }}</p>
            <p class="text-xs text-muted-foreground">保存只替换文件头部的标签字节，音频帧原字节保留；旧 ID3v1 标签（若有）原样保留在文件末尾。</p>
          </div>
        </template>
      </div>

      <!-- 右：原标签信息 + 未知帧 + 校验结果 -->
      <div class="space-y-6">
        <div v-if="!fileInfo" class="bg-card border border-dashed border-border rounded-lg p-10">
          <div class="text-center">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Tags class="w-8 h-8 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-foreground mb-2">标签是音乐的「身份证」</h3>
            <p class="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              播放器列表里显示的歌名、歌手、专辑封面全部来自 ID3 标签。下载或转录的 MP3 常出现乱码、
              占位符或空封面——本工具按官方规范逐帧解析、字节级写回，不用重新转码。
            </p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
              <div class="bg-muted/50 rounded-lg p-3">
                <Search class="w-4 h-4 text-primary mb-1.5" />
                <p class="text-xs font-medium text-foreground">逐帧解析 v2.3/v2.4</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <ShieldCheck class="w-4 h-4 text-primary mb-1.5" />
                <p class="text-xs font-medium text-foreground">音频字节零改动</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <ImagePlus class="w-4 h-4 text-primary mb-1.5" />
                <p class="text-xs font-medium text-foreground">封面可换可删</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 解析结果卡 -->
        <div v-if="parsed" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground flex items-center mb-4">
            <Search class="w-5 h-5 mr-2 text-primary" /> 原始标签解析（当前文件）
          </h2>
          <div class="flex flex-wrap gap-2 mb-4">
            <span class="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">ID3v2.{{ parsed.major }}.{{ parsed.revision }}</span>
            <span class="text-xs px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border">标签体 {{ parsed.tagSize }} 字节</span>
            <span v-if="parsed.unsync" class="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">已做反同步解码</span>
            <span v-if="parsed.hasExt" class="text-xs px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border">含扩展头（已跳过）</span>
            <span class="text-xs px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border">共 {{ parsed.frames.length }} 帧</span>
          </div>

          <p v-if="!parsed.supported" class="text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mb-3">
            该文件为 ID3v2.2 标签（帧头 6 字节的旧版结构），本工具仅识别不解析其内容；保存后将用表单内容重建为 ID3v2.3 标签替换它。
          </p>

          <template v-if="parsed.supported">
            <div v-if="originalCoverUrl" class="mb-4">
              <p class="text-xs font-medium text-muted-foreground mb-1.5">内嵌封面（{{ parsed.cover ? parsed.cover.mime : '' }}，picture type {{ parsed.cover ? parsed.cover.type : '—' }}）</p>
              <div class="border border-border rounded-lg bg-muted/30 p-2 inline-flex">
                <img :src="originalCoverUrl" alt="原标签封面" class="max-h-32 max-w-full object-contain rounded" />
              </div>
            </div>

            <div class="border border-border rounded-lg overflow-hidden">
              <table class="w-full text-sm">
                <tbody>
                  <tr v-for="row in fieldRows" :key="row.label" class="border-t border-border first:border-t-0" :class="row.value ? '' : 'opacity-60'">
                    <td class="px-3 py-2 text-muted-foreground whitespace-nowrap w-28">{{ row.label }}</td>
                    <td class="px-3 py-2 text-foreground break-all">{{ row.value || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="parsed.unknownFrames.length" class="mt-4">
              <p class="text-xs font-semibold text-foreground mb-1.5">
                未解析帧 {{ parsed.unknownFrames.length }} 个（仅列出，不参与编辑）
              </p>
              <div class="max-h-40 overflow-y-auto border border-border rounded-lg">
                <table class="w-full text-xs">
                  <tbody>
                    <tr v-for="(f, i) in parsed.unknownFrames" :key="f.id + '-' + i" class="border-t border-border first:border-t-0">
                      <td class="px-3 py-1.5 font-mono text-foreground">{{ f.id }}</td>
                      <td class="px-3 py-1.5 text-muted-foreground">{{ f.size }} 字节</td>
                      <td class="px-3 py-1.5 text-muted-foreground">{{ f.note || '非编辑目标的帧' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
                <AlertTriangle class="w-3 h-3 flex-shrink-0 mt-0.5" />
                保存重建标签时仅写入表单中的常用字段，以上未解析帧不会带入新文件（如需完整保留请用专业标签工具）。
              </p>
            </div>
          </template>
        </div>

        <!-- 无 v2 标签 / ID3v1 -->
        <div v-if="fileInfo && !parsed" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground flex items-center mb-3">
            <Info class="w-5 h-5 mr-2 text-primary" /> 未发现 ID3v2 标签
          </h2>
          <p class="text-sm text-muted-foreground">文件头部没有 ID3v2 标签，保存时将新建一个 ID3v2.3 标签写入表单内容。</p>
        </div>

        <div v-if="v1Info" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground flex items-center mb-3">
            <Info class="w-5 h-5 mr-2 text-primary" /> ID3v1 标签（文件尾 128 字节，只读）
          </h2>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="bg-muted/50 rounded px-3 py-1.5"><span class="text-muted-foreground text-xs">标题</span> {{ v1Info.title || '—' }}</div>
            <div class="bg-muted/50 rounded px-3 py-1.5"><span class="text-muted-foreground text-xs">艺术家</span> {{ v1Info.artist || '—' }}</div>
            <div class="bg-muted/50 rounded px-3 py-1.5"><span class="text-muted-foreground text-xs">专辑</span> {{ v1Info.album || '—' }}</div>
            <div class="bg-muted/50 rounded px-3 py-1.5"><span class="text-muted-foreground text-xs">年份</span> {{ v1Info.year || '—' }}</div>
            <div class="bg-muted/50 rounded px-3 py-1.5 col-span-2"><span class="text-muted-foreground text-xs">注释</span> {{ v1Info.comment || '—' }}<span v-if="v1Info.track !== null"> · 音轨 {{ v1Info.track }}</span><span v-if="v1Info.genreLabel"> · 流派 {{ v1Info.genreLabel }}</span></div>
          </div>
          <p class="text-xs text-muted-foreground mt-2">多数播放器优先读取 ID3v2；保存时 v1 标签原样保留、不做更新。</p>
        </div>

        <!-- 保存结果与回读校验 -->
        <div v-if="saveResult" class="bg-card border border-green-500/40 rounded-lg p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 class="w-5 h-5" :class="saveResult.verifyOk ? 'text-green-500' : 'text-amber-500'" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-foreground">标签写回完成 · 二次解析回读校验</h2>
              <p class="text-xs text-muted-foreground">{{ saveResult.filename }} · {{ formatSize(saveResult.beforeSize) }} → {{ formatSize(saveResult.afterSize) }}</p>
            </div>
          </div>
          <div class="border border-border rounded-lg overflow-hidden mb-4">
            <table class="w-full text-sm">
              <tbody>
                <tr v-for="(c, i) in saveResult.checks" :key="i" class="border-t border-border first:border-t-0">
                  <td class="px-3 py-2 text-muted-foreground w-44">{{ c.label }}</td>
                  <td class="px-3 py-2 text-foreground break-all">{{ c.got }}</td>
                  <td class="px-3 py-2 w-14 text-right">
                    <span :class="c.ok ? 'text-green-600 dark:text-green-400' : 'text-red-500'" class="text-xs font-medium">{{ c.ok ? '通过' : '异常' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button
            @click="downloadResult"
            class="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Download class="w-4 h-4" /> 保存到本地（{{ formatSize(saveResult.afterSize) }}）
          </button>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="seoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <div v-show="seoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          在线 MP3 标签编辑工具
        </h2>
        <p class="text-muted-foreground mb-6">
          ID3 标签是写在 MP3 音频数据前面（ID3v2）或末尾（ID3v1）的一段元数据，播放器据此显示歌名、歌手、
          专辑与封面。本工具用纯 JavaScript 按 ID3v2.3 / ID3v2.4 官方规范逐帧解析：读出标签头（版本、标志位、
          synchsafe 尺寸）、遍历帧（TIT2/TPE1/TALB/TRCK/TYER/TDRC/TCON/TCOM/COMM/APIC 等），处理四种文本编码
          与反同步（unsynchronisation）。保存时按 v2.3 规范重建标签——帧长为普通 32 位大端、标签总长为 synchsafe
          编码，跳过旧标签字节后原样拼接音频数据，最后在页面内对新文件做二次解析回读校验。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">典型使用场景</h3>
        <ul class="list-disc pl-5 space-y-1.5 text-muted-foreground mb-6">
          <li>整理音乐库：批量下载的 MP3 歌名是乱码或「Track01」，逐个改回正确信息后车载/手机播放器列表立刻清爽</li>
          <li>播客与有声书：给自录音频补上标题、作者与专辑名，投稿平台与订阅器才能正确归档</li>
          <li>换封面：把专辑封面换成自己的图，导入手机音乐 App 后显示自定义封面</li>
          <li>修乱码：老文件常用 GBK/ISO-8859-1 写中文导致乱码，重建为 UTF-8 或 UTF-16 后各平台显示正常</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">保存后音质会受损吗？文件会变大吗？</h3>
            <p class="text-muted-foreground mt-1">
              不会受损。工具只重建文件头部的标签字节，后面的音频帧数据逐字节原样保留，不做任何转码。
              文件大小变化 = 新旧标签的长度差（封面图通常会占大头），音频部分大小不变。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么保存后原来的某些字段没了？</h3>
            <p class="text-muted-foreground mt-1">
              保存是「按表单重建标签」：只写入本工具支持编辑的常用帧（标题/艺术家/专辑/音轨/年份/流派/作曲/注释/封面），
              原文件里的私有帧、评级、歌词等未解析帧不会带入新文件，页面会在「未解析帧」列表如实列出，可先确认再保存。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">文本编码选 UTF-8 还是 UTF-16？</h3>
            <p class="text-muted-foreground mt-1">
              ID3v2.3 标准只定义 ISO-8859-1 与 UTF-16（带 BOM）两种编码，UTF-8 是 ID3v2.4 才引入的——但当前主流
              软件对「v2.3 + UTF-8」普遍兼容，中文场景默认 UTF-8 即可；若目标设备是很老的车机/播放器出现乱码，
              换 UTF-16（v2.3 标准编码）重存一次。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">旧的 ID3v1 标签怎么处理？</h3>
            <p class="text-muted-foreground mt-1">
              若文件末尾有 128 字节的 ID3v1 标签，保存时原样保留（本工具只读展示其内容）。绝大多数播放器优先读取
              ID3v2，两者不一致时以 v2 为准；如需彻底更新 v1，可用其他工具删除后重存。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持哪些文件？会上传吗？</h3>
            <p class="text-muted-foreground mt-1">
              支持 MP3（ID3v2.3 / v2.4 完整解析编辑，v2.2 仅识别版本；无标签也能直接添加）。全部解析与写回在浏览器
              内存中按字节完成，文件不会上传服务器；封面图支持 JPEG / PNG，写入时按 picture type 3（front cover）记录。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :current-tool-id="'audio-metadata'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Tags, ShieldCheck, Upload, Download, Loader2, Music, FileAudio, PenLine,
  ImagePlus, Search, Info, AlertTriangle, CheckCircle2, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'MP3标签编辑 - ID3标签查看修改与封面替换，本地无损写回',
  description: '免费在线MP3标签编辑工具：按ID3v2.3/v2.4规范解析标题、歌手、专辑、音轨、封面等帧，支持UTF-8/UTF-16编码，编辑后字节级重建标签写回，音频数据原字节保留零音质损失，纯本地处理不上传',
  keywords: 'mp3标签编辑,id3标签修改,音乐标签,mp3封面更换,歌曲信息修改,音频元数据,id3v2',
  author: '有条工具',
  ogTitle: 'MP3标签编辑 - 有条工具',
  ogDescription: '按 ID3v2.3/v2.4 规范解析与编辑 MP3 标签、替换封面，音频字节零改动，本地完成不上传。',
  ogUrl: 'https://www.util.cn/tools/audio-metadata',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据（SoftwareApplication + BreadcrumbList + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'MP3标签编辑',
          url: 'https://www.util.cn/tools/audio-metadata',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['ID3v2.3/v2.4逐帧解析', '四种文本编码解码(ISO-8859-1/UTF-16/UTF-16BE/UTF-8)', '标题/歌手/专辑/音轨/年份/流派/作曲/注释编辑', '内嵌封面查看与JPEG/PNG替换', '字节级重建ID3v2.3标签', '音频帧数据原字节保留', '保存后二次解析回读校验', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: 'MP3标签编辑', item: 'https://www.util.cn/tools/audio-metadata/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '保存后音质会受损吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。工具只重建文件头部的标签字节，后面的音频帧数据逐字节原样保留，不做任何转码，文件大小变化等于新旧标签的长度差。' }
            },
            {
              '@type': 'Question',
              name: '为什么保存后原来的某些字段没了？',
              acceptedAnswer: { '@type': 'Answer', text: '保存是按表单重建标签，只写入常用编辑帧；评级、歌词等未解析帧不会带入新文件，页面会在未解析帧列表如实列出。' }
            },
            {
              '@type': 'Question',
              name: '文本编码选UTF-8还是UTF-16？',
              acceptedAnswer: { '@type': 'Answer', text: 'ID3v2.3标准只定义ISO-8859-1与UTF-16，UTF-8是v2.4引入的编码，主流软件普遍兼容，中文默认UTF-8即可；老设备乱码时换UTF-16。' }
            },
            {
              '@type': 'Question',
              name: '旧的ID3v1标签怎么处理？',
              acceptedAnswer: { '@type': 'Answer', text: '文件末尾的128字节ID3v1标签原样保留，本工具只读展示；播放器优先读取ID3v2，不一致时以v2为准。' }
            },
            {
              '@type': 'Question',
              name: '支持哪些文件？会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '支持MP3（ID3v2.3/v2.4完整解析编辑，v2.2仅识别，无标签可新建），全部在浏览器本地按字节完成，不上传服务器。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'audio-metadata')

/* ==== PURE:BEGIN ==== */
// ---------- 基础字节读写 ----------
function readU32be(b, o) {
  return (((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0)
}
function writeU32be(arr, o, v) {
  arr[o] = (v >>> 24) & 0xFF
  arr[o + 1] = (v >>> 16) & 0xFF
  arr[o + 2] = (v >>> 8) & 0xFF
  arr[o + 3] = v & 0xFF
}
// synchsafe：每字节只用低 7 位（ID3v2 标签头尺寸、v2.4 帧长、v2.4 数据长度指示均如此编码）
function readSyncsafe(b, o) {
  return (((b[o] & 0x7F) << 21) | ((b[o + 1] & 0x7F) << 14) | ((b[o + 2] & 0x7F) << 7) | (b[o + 3] & 0x7F)) >>> 0
}
function writeSyncsafe(arr, o, v) {
  arr[o] = (v >>> 21) & 0x7F
  arr[o + 1] = (v >>> 14) & 0x7F
  arr[o + 2] = (v >>> 7) & 0x7F
  arr[o + 3] = v & 0x7F
}
function bytesEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

// ---------- 反同步（unsynchronisation）：FF 111xxxxx → FF 00 111xxxxx，解码即 FF 00 → FF ----------
function deUnsync(bytes) {
  if (!bytes || !bytes.length) return bytes
  let n = 0
  for (let i = 0; i < bytes.length - 1; i++) {
    if (bytes[i] === 0xFF && bytes[i + 1] === 0x00) { n++; i++ }
  }
  if (!n) return bytes
  const out = new Uint8Array(bytes.length - n)
  let o = 0
  for (let i = 0; i < bytes.length; i++) {
    out[o++] = bytes[i]
    if (bytes[i] === 0xFF && i + 1 < bytes.length && bytes[i + 1] === 0x00) i++
  }
  return out
}

// ---------- 文本编码：解析（0=ISO-8859-1, 1=UTF-16带BOM, 2=UTF-16BE, 3=UTF-8） ----------
function latin1Decode(bytes) {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return s
}
function decodeUtf16(bytes, le) {
  let out = ''
  let pending = -1
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const u = le ? (bytes[i] | (bytes[i + 1] << 8)) : ((bytes[i] << 8) | bytes[i + 1])
    if (pending >= 0) {
      if (u >= 0xDC00 && u <= 0xDFFF) out += String.fromCodePoint(0x10000 + ((pending - 0xD800) << 10) + (u - 0xDC00))
      else { out += String.fromCodePoint(pending) + String.fromCodePoint(u) }
      pending = -1
    } else if (u >= 0xD800 && u <= 0xDBFF) {
      pending = u
    } else {
      out += String.fromCodePoint(u)
    }
  }
  return out
}
function utf8Decode(bytes) {
  try { return new TextDecoder('utf-8').decode(bytes) } catch (e) { return latin1Decode(bytes) }
}
// 返回去除终止符的多值合并文本（多值以 \u0000 分隔时用 " / " 连接）
function decodeId3Text(enc, bytes) {
  if (!bytes || !bytes.length) return ''
  let str = ''
  if (enc === 1) {
    let le = true
    let body = bytes
    if (bytes[0] === 0xFF && bytes[1] === 0xFE) { le = true; body = bytes.subarray(2) }
    else if (bytes[0] === 0xFE && bytes[1] === 0xFF) { le = false; body = bytes.subarray(2) }
    str = decodeUtf16(body, le)
  } else if (enc === 2) {
    str = decodeUtf16(bytes, false)
  } else if (enc === 3) {
    str = utf8Decode(bytes)
  } else {
    str = latin1Decode(bytes)
  }
  const parts = str.split('\u0000').map(s => s.trim()).filter(s => s.length)
  return parts.join(' / ')
}
// 读一个以终止符结尾的字符串（UTF-16 为 00 00，其余为 00），返回 { text, next }
function readTerminatedString(enc, bytes, start) {
  if (enc === 1 || enc === 2) {
    for (let i = start; i + 1 < bytes.length; i++) {
      if (bytes[i] === 0x00 && bytes[i + 1] === 0x00) {
        return { text: decodeId3Text(enc, bytes.subarray(start, i)), next: i + 2 }
      }
    }
    return { text: decodeId3Text(enc, bytes.subarray(start)), next: bytes.length }
  }
  for (let i = start; i < bytes.length; i++) {
    if (bytes[i] === 0x00) {
      return { text: decodeId3Text(enc, bytes.subarray(start, i)), next: i + 1 }
    }
  }
  return { text: decodeId3Text(enc, bytes.subarray(start)), next: bytes.length }
}

// ---------- 文本编码：写回（仅 1=UTF-16带BOM / 3=UTF-8，均含终止符选项） ----------
function encodeId3Text(enc, str) {
  const s = String(str == null ? '' : str)
  if (enc === 1) {
    const out = [0xFF, 0xFE] // BOM LE
    for (let i = 0; i < s.length; i++) {
      let cp = s.codePointAt(i)
      if (cp > 0xFFFF) i++ // 代理对占两个 code unit
      if (cp > 0xFFFF) {
        cp -= 0x10000
        const hi = 0xD800 + (cp >> 10)
        const lo = 0xDC00 + (cp & 0x3FF)
        out.push(hi & 0xFF, (hi >>> 8) & 0xFF, lo & 0xFF, (lo >>> 8) & 0xFF)
      } else {
        out.push(cp & 0xFF, (cp >>> 8) & 0xFF)
      }
    }
    return Uint8Array.from(out)
  }
  try { return new TextEncoder().encode(s) } catch (e) { return Uint8Array.from(s.split('').map(c => c.charCodeAt(0) & 0xFF)) }
}
function terminatorBytes(enc) {
  return enc === 1 ? Uint8Array.from([0x00, 0x00]) : Uint8Array.from([0x00])
}

// ---------- ID3v2 头部定位 ----------
// 返回 { major, revision, flags, tagSize, unsync, hasExt, footer, totalEnd }；非 ID3v2 返回 null
function findId3v2Header(bytes) {
  if (!bytes || bytes.length < 10) return null
  if (!(bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33)) return null // "ID3"
  const major = bytes[3]
  const revision = bytes[4]
  if (major < 2 || major > 4) return null
  const flags = bytes[5]
  const tagSize = readSyncsafe(bytes, 6) // 标签头尺寸字段在 v2.3/v2.4 均为 synchsafe
  const footer = major === 4 && !!(flags & 0x10)
  let totalEnd = 10 + tagSize + (footer ? 10 : 0)
  if (totalEnd > bytes.length) totalEnd = bytes.length
  return { major, revision, flags, tagSize, unsync: !!(flags & 0x80), hasExt: !!(flags & 0x40), footer, totalEnd }
}

// ---------- ID3v2 帧解析 ----------
// 支持的编辑目标帧与未知帧列表；cover 携带原始字节（调用方负责移出响应式状态）
function parseId3v2(bytes) {
  const h = findId3v2Header(bytes)
  if (!h) return null
  const info = {
    major: h.major,
    revision: h.revision,
    unsync: h.unsync,
    hasExt: h.hasExt,
    tagSize: h.tagSize,
    totalEnd: h.totalEnd,
    supported: h.major === 3 || h.major === 4,
    tags: { title: '', artist: '', album: '', albumArtist: '', track: '', year: '', genre: '', composer: '', comment: '' },
    cover: null,
    frames: [],
    unknownFrames: []
  }
  if (!info.supported) return info
  let body = bytes.subarray(10, Math.min(10 + h.tagSize, bytes.length))
  // v2.3 标签级 unsynchronisation：整段标签体先反同步再遍历帧（不可逐帧重复做）
  if (h.major === 3 && h.unsync) body = deUnsync(body)

  let o = 0
  if (h.hasExt) {
    // v2.3 扩展头尺寸为普通 32 位且不含自身（+4）；v2.4 为 synchsafe 且含自身
    if (h.major === 4) {
      const es = body.length >= 4 ? readSyncsafe(body, 0) : 0
      o += Math.max(6, es)
    } else {
      const es = body.length >= 4 ? readU32be(body, 0) : 0
      o += 4 + es
    }
    if (o > body.length) o = body.length
  }

  while (o + 10 <= body.length) {
    const id = String.fromCharCode(body[o], body[o + 1], body[o + 2], body[o + 3])
    if (!/^[A-Z0-9]{4}$/.test(id)) break // 帧 ID 非法 → padding 或损坏，停止遍历
    const size = h.major === 4 ? readSyncsafe(body, o + 4) : readU32be(body, o + 4) // v2.4 帧长 synchsafe；v2.3 普通 32 位大端
    if (size <= 0 || o + 10 + size > body.length) break
    const f1 = body[o + 8]
    const f2 = body[o + 9]
    let data = body.subarray(o + 10, o + 10 + size)
    let skip = null
    if (h.major === 3) {
      // v2.3 格式标志 %ijk00000：i=0x80 压缩 / j=0x40 加密 / k=0x20 分组
      if (f2 & 0x80) skip = 'zlib 压缩帧，未解压'
      else if (f2 & 0x40) skip = '加密帧，未解密'
      else if (f2 & 0x20) data = data.subarray(1) // 分组标识字节
    } else {
      // v2.4 格式标志 %0h00kmnp：h=0x40 分组 / k=0x08 压缩 / m=0x04 加密 / n=0x02 反同步 / p=0x01 数据长度指示
      if (f2 & 0x08) skip = 'zlib 压缩帧，未解压'
      else if (f2 & 0x04) skip = '加密帧，未解密'
      else {
        if (f2 & 0x02 || h.unsync) data = deUnsync(data) // 帧级反同步（v2.4 标签级标志作用于全部帧）
        if (f2 & 0x40) data = data.subarray(1) // 分组标识字节
        if (f2 & 0x01) data = data.subarray(4) // 4 字节 synchsafe 数据长度指示
      }
    }
    info.frames.push({ id, size })
    if (skip) {
      info.unknownFrames.push({ id, size, note: skip })
    } else {
      handleParsedFrame(info, id, data)
    }
    o += 10 + size
  }
  return info
}

function handleParsedFrame(info, id, data) {
  if (!data.length) { info.unknownFrames.push({ id, size: 0, note: '空帧' }); return }
  if (id[0] === 'T' && id !== 'TXXX') {
    const text = decodeId3Text(data[0], data.subarray(1))
    switch (id) {
      case 'TIT2': if (!info.tags.title) info.tags.title = text; break
      case 'TPE1': if (!info.tags.artist) info.tags.artist = text; break
      case 'TALB': if (!info.tags.album) info.tags.album = text; break
      case 'TPE2': if (!info.tags.albumArtist) info.tags.albumArtist = text; break
      case 'TRCK': if (!info.tags.track) info.tags.track = text; break
      case 'TYER': case 'TDRC': if (!info.tags.year) info.tags.year = text; break // v2.3 用 TYER，v2.4 用 TDRC
      case 'TCON': if (!info.tags.genre) info.tags.genre = text; break
      case 'TCOM': if (!info.tags.composer) info.tags.composer = text; break
      default: info.unknownFrames.push({ id, size: data.length, note: '文本帧（非编辑目标）' })
    }
    return
  }
  if (id === 'COMM') {
    // 编码 1 字节 + 语言 3 字节 + 短描述（终止符结尾）+ 正文
    if (data.length < 4) { info.unknownFrames.push({ id, size: data.length, note: '注释帧结构异常' }); return }
    const enc = data[0]
    const r = readTerminatedString(enc, data, 4)
    const text = decodeId3Text(enc, data.subarray(r.next))
    if (!info.tags.comment) info.tags.comment = text
    return
  }
  if (id === 'APIC') {
    // 编码 1 字节 + MIME（ISO-8859-1 终止符结尾）+ 图片类型 1 字节 + 描述（终止符结尾）+ 图片数据
    if (data.length < 4) { info.unknownFrames.push({ id, size: data.length, note: '封面帧结构异常' }); return }
    const enc = data[0]
    let p = 1
    let mEnd = p
    while (mEnd < data.length && data[mEnd] !== 0x00) mEnd++
    let mime = latin1Decode(data.subarray(p, mEnd)).trim()
    p = mEnd + 1
    if (p >= data.length) return
    const picType = data[p]; p++
    const desc = readTerminatedString(enc, data, p)
    const img = data.subarray(desc.next)
    if (!img.length || mime === '-->') return // --> 表示链接而非二进制图片
    if (!/^image\//.test(mime)) mime = 'image/' + mime
    // 多封面时优先 picture type 3（front cover）
    if (!info.cover || (info.cover.type !== 3 && picType === 3)) {
      info.cover = { mime, type: picType, description: desc.text, data: img, size: img.length }
    }
    return
  }
  info.unknownFrames.push({ id, size: data.length })
}

// ---------- ID3v1（文件尾 128 字节，只读） ----------
function parseId3v1(bytes) {
  if (!bytes || bytes.length < 128) return null
  const o = bytes.length - 128
  if (!(bytes[o] === 0x54 && bytes[o + 1] === 0x41 && bytes[o + 2] === 0x47)) return null // "TAG"
  // ID3v1 名义上是 ISO-8859-1，中文场景常见 GBK 写入：优先按 GBK 解码（不可用时回退 Latin-1）
  const dec = (off, len) => {
    const raw = bytes.subarray(off, off + len)
    let e = raw.length
    while (e > 0 && (raw[e - 1] === 0x00 || raw[e - 1] === 0x20)) e--
    const body = raw.subarray(0, e)
    try { return new TextDecoder('gbk').decode(body) } catch (err) { return latin1Decode(body) }
  }
  const tag = {
    title: dec(o + 3, 30),
    artist: dec(o + 33, 30),
    album: dec(o + 63, 30),
    year: dec(o + 93, 4),
    comment: '',
    track: null,
    genre: bytes[o + 127],
    genreLabel: ''
  }
  const cOff = o + 97
  // ID3v1.1：注释 28 字节 + 0x00 + 音轨号
  if (bytes[cOff + 28] === 0x00 && bytes[cOff + 29] !== 0x00) {
    tag.comment = dec(cOff, 28)
    tag.track = bytes[cOff + 29]
  } else {
    tag.comment = dec(cOff, 30)
  }
  tag.genreLabel = ID3V1_GENRES[tag.genre] || (tag.genre != null ? '代码 ' + tag.genre : '')
  return tag
}

// ---------- 写回：重建 ID3v2.3 标签 ----------
// v2.3 帧长为普通 32 位大端（非 synchsafe）；标签头尺寸为 synchsafe；无扩展头/压缩/加密
function makeFrame23(id, body) {
  const f = new Uint8Array(10 + body.length)
  for (let i = 0; i < 4; i++) f[i] = id.charCodeAt(i)
  writeU32be(f, 4, body.length)
  f[8] = 0
  f[9] = 0
  f.set(body, 10)
  return f
}
function buildTextFrame23(id, enc, value) {
  const textBytes = encodeId3Text(enc, value)
  const term = terminatorBytes(enc)
  const body = new Uint8Array(1 + textBytes.length + term.length)
  body[0] = enc
  body.set(textBytes, 1)
  body.set(term, 1 + textBytes.length)
  return makeFrame23(id, body)
}
function buildCommFrame23(enc, text) {
  const textBytes = encodeId3Text(enc, text)
  const term = terminatorBytes(enc)
  const body = new Uint8Array(1 + 3 + term.length + textBytes.length + term.length)
  body[0] = enc
  body[1] = 0x65; body[2] = 0x6E; body[3] = 0x67 // "eng"
  body.set(term, 4) // 空短描述 + 终止符
  body.set(textBytes, 4 + term.length)
  body.set(term, 4 + term.length + textBytes.length)
  return makeFrame23('COMM', body)
}
function buildApicFrame23(enc, mime, pictureType, description, imageData) {
  const mimeBytes = Uint8Array.from(String(mime).split('').map(c => c.charCodeAt(0) & 0xFF))
  const descBytes = encodeId3Text(enc, description || '')
  const term = terminatorBytes(enc)
  const body = new Uint8Array(1 + mimeBytes.length + 1 + 1 + descBytes.length + term.length + imageData.length)
  let o = 0
  body[o++] = enc
  body.set(mimeBytes, o); o += mimeBytes.length
  body[o++] = 0x00
  body[o++] = pictureType
  body.set(descBytes, o); o += descBytes.length
  body.set(term, o); o += term.length
  body.set(imageData, o)
  return makeFrame23('APIC', body)
}
// fields: { title, artist, album, albumArtist, track, year, genre, composer, comment }
// cover: { mime, data } | null；enc: 1(UTF-16) | 3(UTF-8)
function buildId3v23Tag(fields, cover, enc) {
  const safeEnc = enc === 1 ? 1 : 3
  const frames = []
  const addText = (id, v) => {
    const s = String(v == null ? '' : v).trim()
    if (s) frames.push(buildTextFrame23(id, safeEnc, s))
  }
  addText('TIT2', fields.title)
  addText('TPE1', fields.artist)
  addText('TALB', fields.album)
  addText('TPE2', fields.albumArtist)
  addText('TRCK', fields.track)
  addText('TYER', fields.year) // 写回目标为 v2.3，年份帧用 TYER
  addText('TCON', fields.genre)
  addText('TCOM', fields.composer)
  const comment = String(fields.comment == null ? '' : fields.comment).trim()
  if (comment) frames.push(buildCommFrame23(safeEnc, comment))
  if (cover && cover.data && cover.data.length) {
    frames.push(buildApicFrame23(safeEnc, cover.mime || 'image/jpeg', 3, cover.description || '', cover.data))
  }
  let tagSize = 0
  for (const f of frames) tagSize += f.length
  const out = new Uint8Array(10 + tagSize)
  out[0] = 0x49; out[1] = 0x44; out[2] = 0x33 // "ID3"
  out[3] = 3; out[4] = 0 // v2.3
  out[5] = 0 // 无标签级标志
  writeSyncsafe(out, 6, tagSize)
  let o = 10
  for (const f of frames) { out.set(f, o); o += f.length }
  return out
}
// 剥离旧 ID3v2（含 footer），前置新标签，音频数据与文件尾 ID3v1 原字节保留
function buildTaggedFile(bytes, fields, cover, enc) {
  const h = findId3v2Header(bytes)
  const rest = h ? bytes.subarray(h.totalEnd) : bytes
  const tag = buildId3v23Tag(fields, cover, enc)
  const out = new Uint8Array(tag.length + rest.length)
  out.set(tag, 0)
  out.set(rest, tag.length)
  return out
}

// ---------- 工具 ----------
function mapGenre(v) {
  const s = String(v || '').trim()
  let m = /^\((\d+)\)(.*)$/.exec(s)
  if (m) {
    const g = ID3V1_GENRES[Number(m[1])]
    const rest = m[2].trim()
    return g ? (rest ? g + ' / ' + rest : g + '（ID3v1 代码 ' + m[1] + '）') : s
  }
  if (/^\d+$/.test(s)) {
    const g = ID3V1_GENRES[Number(s)]
    return g ? g + '（ID3v1 代码 ' + s + '）' : s
  }
  return s
}

// ID3v1 标准流派表（0-79）
const ID3V1_GENRES = [
  'Blues', 'Classic Rock', 'Country', 'Dance', 'Disco', 'Funk', 'Grunge', 'Hip-Hop',
  'Jazz', 'Metal', 'New Age', 'Oldies', 'Other', 'Pop', 'R&B', 'Rap', 'Reggae', 'Rock',
  'Techno', 'Industrial', 'Alternative', 'Ska', 'Death Metal', 'Pranks', 'Soundtrack',
  'Euro-Techno', 'Ambient', 'Trip-Hop', 'Vocal', 'Jazz+Funk', 'Fusion', 'Trance',
  'Classical', 'Instrumental', 'Acid', 'House', 'Game', 'Sound Clip', 'Gospel', 'Noise',
  'AlternRock', 'Bass', 'Soul', 'Punk', 'Space', 'Meditative', 'Instrumental Pop',
  'Instrumental Rock', 'Ethnic', 'Gothic', 'Darkwave', 'Techno-Industrial', 'Electronic',
  'Pop-Folk', 'Eurodance', 'Dream', 'Southern Rock', 'Comedy', 'Cult', 'Gangsta',
  'Top 40', 'Christian Rap', 'Pop/Funk', 'Jungle', 'Native American', 'Cabaret',
  'New Wave', 'Psychadelic', 'Rave', 'Showtunes', 'Trailer', 'Lo-Fi', 'Tribal',
  'Acid Punk', 'Acid Jazz', 'Polka', 'Retro', 'Musical', 'Rock & Roll', 'Hard Rock'
]

function isJpegBytes(b) {
  return !!(b && b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF)
}
function isPngBytes(b) {
  return !!(b && b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 && b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A)
}
/* ==== PURE:END ==== */

// ---------- 状态 ----------
const fileInput = ref(null)
const coverInput = ref(null)
const fileInfo = ref(null)
const loadError = ref('')
const saveError = ref('')
const seoContentVisible = ref(true)
const textEnc = ref('utf8')
const encOptions = [
  { id: 'utf8', label: 'UTF-8（推荐）' },
  { id: 'utf16', label: 'UTF-16（v2.3 标准）' }
]

const form = reactive({
  title: '', artist: '', album: '', albumArtist: '',
  track: '', year: '', genre: '', composer: '', comment: ''
})

const parsed = ref(null) // 仅展示数据（不含封面字节）
const v1Info = ref(null)
const coverState = ref('none') // none | fromTag | user | removed
const coverPreviewUrl = ref('')
const originalCoverUrl = ref('')
const saveResult = ref(null)
const isSaving = ref(false)

// 非响应式大字节对象
let currentBytes = null
let coverFromTag = null // { mime, type, description, data }
let coverUser = null // { mime, data }

const hasTagCover = computed(() => !!coverFromTag)
const coverLabel = computed(() => {
  if (coverState.value === 'user') return '新封面（保存时写入）'
  if (coverState.value === 'fromTag') return '原标签封面（保留写入）'
  if (coverState.value === 'removed') return '已移除（保存后无封面帧）'
  return '封面'
})
const coverSizeLabel = computed(() => {
  const src = coverState.value === 'user' ? coverUser : coverFromTag
  return src ? (src.data.length + ' 字节' + (src.mime ? ' · ' + src.mime : '')) : ''
})

const fieldRows = computed(() => {
  const t = parsed.value && parsed.value.supported ? parsed.value.tags : null
  if (!t) return []
  return [
    { label: '标题', value: t.title },
    { label: '艺术家', value: t.artist },
    { label: '专辑', value: t.album },
    { label: '专辑艺术家', value: t.albumArtist },
    { label: '音轨', value: t.track },
    { label: '年份', value: t.year },
    { label: '流派', value: t.genre ? (t.genre + (mapGenre(t.genre) !== t.genre ? ' → ' + mapGenre(t.genre) : '')) : '' },
    { label: '作曲', value: t.composer },
    { label: '注释', value: t.comment }
  ]
})

onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

onBeforeUnmount(() => {
  if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value)
  if (originalCoverUrl.value) URL.revokeObjectURL(originalCoverUrl.value)
})

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
const triggerPick = () => { if (fileInput.value) fileInput.value.click() }
const triggerCoverPick = () => { if (coverInput.value) coverInput.value.click() }

const formatSize = (n) => {
  if (!n) return '0 B'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(2) + ' MB'
}

const resetAll = () => {
  if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value)
  if (originalCoverUrl.value) URL.revokeObjectURL(originalCoverUrl.value)
  coverPreviewUrl.value = ''
  originalCoverUrl.value = ''
  coverFromTag = null
  coverUser = null
  coverState.value = 'none'
  parsed.value = null
  v1Info.value = null
  saveResult.value = null
  saveError.value = ''
  currentBytes = null
  form.title = ''; form.artist = ''; form.album = ''; form.albumArtist = ''
  form.track = ''; form.year = ''; form.genre = ''; form.composer = ''; form.comment = ''
}

const fillFormFrom = (tags) => {
  if (!tags) return
  form.title = tags.title || ''
  form.artist = tags.artist || ''
  form.album = tags.album || ''
  form.albumArtist = tags.albumArtist || ''
  form.track = tags.track || ''
  form.year = tags.year || ''
  form.genre = tags.genre || ''
  form.composer = tags.composer || ''
  form.comment = tags.comment || ''
}

const onFileChange = async (e) => {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  loadError.value = ''
  saveError.value = ''
  try {
    const buf = new Uint8Array(await file.arrayBuffer())
    resetAll()
    currentBytes = buf
    fileInfo.value = { name: file.name, size: file.size }
    const info = parseId3v2(buf)
    if (info) {
      if (info.cover) {
        coverFromTag = info.cover
        info.cover = { mime: info.cover.mime, type: info.cover.type, description: info.cover.description, size: info.cover.size }
        originalCoverUrl.value = URL.createObjectURL(new Blob([coverFromTag.data], { type: coverFromTag.mime }))
        coverState.value = 'fromTag'
        coverPreviewUrl.value = originalCoverUrl.value
      }
      parsed.value = info
      if (info.supported) fillFormFrom(info.tags)
    }
    const v1 = parseId3v1(buf)
    v1Info.value = v1
    // 无 ID3v2 或 v2 版本不受支持（v2.2）时，回退用 ID3v1 内容预填表单
    if ((!parsed.value || !parsed.value.supported) && v1) {
      fillFormFrom({ title: v1.title, artist: v1.artist, album: v1.album, track: v1.track !== null ? String(v1.track) : '', year: v1.year, genre: v1.genreLabel || '', comment: v1.comment })
    }
  } catch (err) {
    loadError.value = '读取文件失败：' + (err && err.message ? err.message : '未知错误')
  }
}

const onCoverChange = async (e) => {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  saveError.value = ''
  try {
    const data = new Uint8Array(await file.arrayBuffer())
    let mime = ''
    if (isJpegBytes(data)) mime = 'image/jpeg'
    else if (isPngBytes(data)) mime = 'image/png'
    if (!mime) {
      saveError.value = '封面仅支持 JPEG / PNG（已按文件头识别），请转换后重试'
      return
    }
    coverUser = { mime, data }
    coverState.value = 'user'
    if (coverPreviewUrl.value && coverPreviewUrl.value !== originalCoverUrl.value) URL.revokeObjectURL(coverPreviewUrl.value)
    coverPreviewUrl.value = URL.createObjectURL(new Blob([data], { type: mime }))
  } catch (err) {
    saveError.value = '读取封面失败：' + (err && err.message ? err.message : '未知错误')
  }
}

const removeCover = () => {
  coverState.value = 'removed'
  if (coverPreviewUrl.value && coverPreviewUrl.value !== originalCoverUrl.value) URL.revokeObjectURL(coverPreviewUrl.value)
  coverPreviewUrl.value = ''
}

const restoreTagCover = () => {
  if (!coverFromTag) return
  coverState.value = 'fromTag'
  if (coverPreviewUrl.value && coverPreviewUrl.value !== originalCoverUrl.value) URL.revokeObjectURL(coverPreviewUrl.value)
  coverPreviewUrl.value = originalCoverUrl.value
}

const effectiveCover = () => {
  if (coverState.value === 'user' && coverUser) return { mime: coverUser.mime, description: '', data: coverUser.data }
  if (coverState.value === 'fromTag' && coverFromTag) return { mime: coverFromTag.mime, description: coverFromTag.description || '', data: coverFromTag.data }
  return null
}

// ---------- 保存：重建标签 + 二次解析回读校验 ----------
const saveTags = () => {
  if (!currentBytes || isSaving.value) return
  isSaving.value = true
  saveError.value = ''
  try {
    const fields = {
      title: form.title.trim(), artist: form.artist.trim(), album: form.album.trim(),
      albumArtist: form.albumArtist.trim(), track: form.track.trim(), year: form.year.trim(),
      genre: form.genre.trim(), composer: form.composer.trim(), comment: form.comment.trim()
    }
    const enc = textEnc.value === 'utf16' ? 1 : 3
    const cover = effectiveCover()
    const out = buildTaggedFile(currentBytes, fields, cover, enc)

    // 回读校验：重新解析输出文件
    const re = parseId3v2(out)
    const t = re && re.supported ? re.tags : null
    const oldHeader = findId3v2Header(currentBytes)
    const restStart = oldHeader ? oldHeader.totalEnd : 0
    const oldRest = currentBytes.subarray(restStart)
    const newRest = out.subarray(out.length - oldRest.length)
    const audioUnchanged = bytesEqual(oldRest, newRest)
    const v1Kept = bytesEqual(
      currentBytes.length >= 128 ? currentBytes.subarray(currentBytes.length - 128) : null,
      out.length >= 128 ? out.subarray(out.length - 128) : null
    )

    const eq = (a, b) => (a || '') === (b || '')
    const checks = [
      { label: '新标签版本回读', got: re && re.supported ? 'ID3v2.' + re.major : '解析失败', ok: !!(re && re.supported && re.major === 3) },
      { label: '标题回读', got: t ? (t.title || '（空）') : '—', ok: !!t && eq(t.title, fields.title) },
      { label: '艺术家回读', got: t ? (t.artist || '（空）') : '—', ok: !!t && eq(t.artist, fields.artist) },
      { label: '专辑回读', got: t ? (t.album || '（空）') : '—', ok: !!t && eq(t.album, fields.album) },
      { label: '音轨回读', got: t ? (t.track || '（空）') : '—', ok: !!t && eq(t.track, fields.track) },
      { label: '年份回读 (TYER)', got: t ? (t.year || '（空）') : '—', ok: !!t && eq(t.year, fields.year) },
      { label: '音频数据字节校验', got: audioUnchanged ? '与原文件逐字节一致' : '不一致', ok: audioUnchanged },
      { label: '文件尾 ID3v1 校验', got: v1Info.value ? (v1Kept ? '原样保留' : '不一致') : '原文件无 v1（未添加）', ok: v1Info.value ? v1Kept : true },
      {
        label: '封面帧校验',
        got: re ? (re.cover ? re.cover.mime + ' / ' + re.cover.size + ' 字节' : '无封面帧') : '—',
        ok: re ? (cover ? !!(re.cover && re.cover.size === cover.data.length) : !re.cover) : false
      }
    ]
    const verifyOk = checks.every(c => c.ok)

    const blob = new Blob([out], { type: 'audio/mpeg' })
    const base = (fileInfo.value && fileInfo.value.name ? fileInfo.value.name : 'audio').replace(/\.[^.]+$/, '') || 'audio'
    saveResult.value = {
      blob,
      filename: base + '-tagged.mp3',
      beforeSize: currentBytes.length,
      afterSize: out.length,
      checks,
      verifyOk
    }
    if (!verifyOk) saveError.value = '回读校验存在异常项，请检查后重试'
  } catch (err) {
    saveError.value = '保存失败：' + (err && err.message ? err.message : '未知错误')
  } finally {
    isSaving.value = false
  }
}

const downloadResult = () => {
  if (!saveResult.value) return
  const url = URL.createObjectURL(saveResult.value.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = saveResult.value.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
</script>
