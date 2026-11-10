---
title: "浏览器视频处理管线：MediaRecorder 的能力与妥协"
slug: "browser-video-pipeline-mediarecorder"
date: 2026-11-09T06:40:00+08:00
draft: false
tags: ['MediaRecorder', 'WebCodecs', '浏览器', '视频处理']
categories: ['技术笔记']
author: '有条工具团队'
summary: '不装 ffmpeg、不上传云端，浏览器也能旋转、变速、拼接视频——代价是理解三个约束：录制实时进行、编码器可用性因浏览器而异、变速的音调需要专门兜底。拆解从 video 解码到 MediaRecorder 出片的完整管线，以及本地管线的适用边界。'
---

## 不装 ffmpeg，浏览器能对视频做什么

在浏览器里把竖拍视频转成横屏、把一小时录屏压成二倍速回放、把三段素材拼成一条——不需要 ffmpeg，不需要上传云端，现代浏览器的媒体 API 拼起来恰好够用。但「够用」是有代价的：这条管线天生带着三个约束——实时、编码器可用性、音调处理。理解了它们，才能明白这类工具哪些做得快、哪些必须等、哪些功能在某些浏览器里是置灰的。

## 管线全景：从 video 元素到一个 Blob

整条管线的起点是一个看不见的 `<video>` 元素，浏览器用它把压缩视频解码成可以逐帧取用的画面；用 requestVideoFrameCallback 在每一帧就绪时把它画到 canvas 上——旋转、缩放、裁剪都在这一步顺手完成；canvas.captureStream(30) 把画布变成一条 30fps 采样的视频轨；音轨从同一个 video 元素经 WebAudio 分路：MediaElementAudioSourceNode 把元素的音频抽出来，MediaStreamAudioDestinationNode 把它变成一条能并进 MediaStream 的音轨；两条轨汇合后交给 MediaRecorder 压回视频流，结束时吐出一个 Blob。

```js
const stream = canvas.captureStream(30)            // 画面轨：30fps 采样
const ctx = new AudioContext()
const src = ctx.createMediaElementSource(video)    // 从 video 元素抽出音轨
const dest = ctx.createMediaStreamDestination()
src.connect(dest)
dest.stream.getAudioTracks().forEach(t => stream.addTrack(t))
const rec = new MediaRecorder(stream, { mimeType: pickMime() })
rec.start()
video.play()                                       // 播放即录制
// 每帧经 requestVideoFrameCallback 回调 drawImage 到 canvas
```

这套组合的妙处在于每一环都可以加工程：画布上是你的地盘，画什么录什么——旋转、加水印、拼画面都发生在绘制这一步；WebAudio 图里可以插增益节点控制音量；MediaRecorder 的参数决定输出格式与码率。逐帧回调选 requestVideoFrameCallback 而不是定时器，是因为它只在「新的一帧真的解码出来了」时触发——解码器吐帧的节奏就是绘制的节奏，不漏帧也不画重复帧；captureStream(30) 里的 30 则是采样频率，浏览器按这个节奏从画布取帧组成视频轨。

## 约束一：录制是实时的

MediaRecorder 录的不是「文件」，是「正在播放的画面」。这条管线没有离线模式——不能像 ffmpeg 那样以十倍吞吐处理数据，只能让素材按播放速度走一遍，录制跟着墙钟走。30 分钟的素材拼在一起，就要老老实实等 30 分钟，中途还不敢切走标签页——浏览器会节流后台画布，帧一丢，成片就缺斤短两。{{< tool id="video-merger" >}}视频拼接合并{{< /tool >}}把「合成耗时约等于素材总时长」直接写进按钮文案和进度条，录制中明确提示请勿切换标签页，就是这条约束的诚实标注：界面不假装它很快。

想快，唯一通道是把播放本身变快。playbackRate 设为 2，100 秒的视频 50 秒就录完，输出的正好是一段 2 倍速视频——速度即时间。{{< tool id="video-speed" >}}视频变速{{< /tool >}}就是这么工作的：预览区以设定倍率实时播放，导出走同一条录制管线，倍率多高、时间就省多少。

## 约束二：编码器可用性因浏览器而异

MediaRecorder 能输出什么格式，取决于浏览器内置了哪些编码器，标准并没有强制清单。工程上的做法是能力检测链：按优先级列一组 mimeType，逐个问 MediaRecorder.isTypeSupported，命中哪个用哪个。

```js
const CANDIDATES = [
  'video/mp4;codecs=avc1,mp4a.40.2',   // MP4（H.264 + AAC）
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm'
]
const mime = CANDIDATES.find(m => MediaRecorder.isTypeSupported(m))
```

现实是分裂的：支持录制成 video/mp4 的目前只有较新的 Chrome 和 Safari，Firefox 只认 WebM——这就是为什么同一批视频工具在 Firefox 里导出格式不同、部分选项置灰。检测链不是防御性编程的摆设，而是产品诚实度：命中什么就明示什么，而不是导出一个扩展名是 .mp4、内容却是 webm 的四不像，让用户的播放器莫名其妙。顺带一提，这也是能力检测比 user-agent 嗅探可靠的原因：问的是浏览器「现在能做什么」，而不是「自称是谁」——浏览器版本一更新，嗅探表就过期，能力检测永远不会。

## 约束三：变速之后，音调怎么办

playbackRate 一改，音频跟着变速，直接后果是音调整体平移——2 倍速下人声变成「花栗鼠声」。preservePitch 属性可以让播放器在变速时做音调补偿，但它一度是三家各写各的：标准属性 preservesPitch 之外，旧版 Firefox 挂在 mozPreservesPitch，Safari 挂在 webkitPreservesPitch，三个前缀逐一兜底才算跨浏览器。

```js
if ('preservesPitch' in el) el.preservesPitch = true
else if ('mozPreservesPitch' in el) el.mozPreservesPitch = true
else if ('webkitPreservesPitch' in el) el.webkitPreservesPitch = true
```

保音调与变调没有谁对谁错：课程、口播、会议回放默认保音调，听感自然；「磁带快进」式的变调反而是刻意的复古效果。关键是把选择权摆给用户，把兜底代码写进实现——两条路都得真的通。还有一个容易忽略的细节：音调补偿发生在播放侧的实时处理里，元素的声音进入音频图之前就已经是补偿后的结果，MediaRecorder 录到的直接就是变速不变调的声音，导出文件不需要任何二次处理。

## 绕不开时长时，绕开逐帧解码

实时这一环绕不开，但管线的另一半——逐帧解码——有时可以整段省掉。画面是静态的时候（比如给音频配一张封面图生成视频），首帧画一次就足够，captureStream 会自动持续捕捉画布的当前状态，不需要任何逐帧回调：{{< tool id="audio-to-video" >}}音频转视频{{< /tool >}}走的就是这条路，省下视频解码的全部开销——录制时长仍随音频长度走，但算力负担轻了一个数量级。画面是 GIF 的时候，甚至可以不用 video 元素：WebCodecs 的 ImageDecoder 把 GIF 逐帧解成位图，按每帧延时画上画布再录制，{{< tool id="gif-to-video" >}}GIF转视频{{< /tool >}}依赖的就是这个 API——也因此它对浏览器版本有明确要求，不支持的页面直接置灰并说明原因，而不是让用户录出一个空文件。

## 本地管线的适用边界

这条管线的甜蜜区很清楚：素材敏感、处理轻量——旋转、变速、拼接、压缩、转格式。全程不发网络请求、文件不出本机，隐私素材可以放心处理；轻量操作的画质与速度，也足以覆盖日常需求。但它不是剪辑软件的替代品：精确到帧的修剪、多轨时间线、复杂转场与调色，仍然应该交给专业工具——浏览器管线解决的是「随手就要」的那一段需求。理解了实时、编码器与音调这三个约束，也就理解了这类工具的每一条提示语为什么那样写。从信息查看到拼接压缩，这些能力都收在[视频创作工具箱](/collections/video-creator-kit/)专题里。
