---
title: "视频拼接的音频图：GainNode 防串音、MediaElementSource 的一对一铁律与重编码账本"
slug: "video-concat-gain-graph"
date: 2026-11-18T08:40:00+08:00
draft: false
tags: ['MediaRecorder', 'WebAudio', '视频拼接', 'canvas']
categories: ['技术笔记']
author: '有条工具团队'
summary: '在浏览器里把几段视频首尾接成一段，路线是「播放 + 重录」：视频侧 canvas.captureStream 逐帧采集画面，音频侧每段视频各接一个 GainNode 组成混音矩阵——当前段增益 1、其余段增益 0，从物理上杜绝两段声音同时进入输出；全部汇入 MediaRecorder 重编码。这篇拆解 GainNode 矩阵防串音的原理、MediaElementSource 与 video 元素一对一绑定不可复用的坑、mp4/webm 的能力协商，以及「拼接必重编码」的码率账。'
---

## 拼接不是粘文件

直觉上「把两段 MP4 接起来」像是文本拼接，实际上视频容器的时间戳、参数集、索引结构都要求重整（[MP4 box 树](/blog/articles/mp4-box-structure-anatomy/)里见过那套结构）。命令行工具的 `concat` 协议有捷径（同编码参数时 mdat 原样搬运只重排索引），浏览器没有这层文件级操作能力——Web API 的路线是**播放 + 重录**：按顺序播放源视频，画面逐帧采集到 canvas，声音汇入音频图，MediaRecorder 把「正在播放的时间线」重新编码成新文件。代价是耗时等于片长、画质经过一代重编码；换来的是零依赖、纯本地、任意参数的片段都能接。

## 音频图：一个 GainNode 矩阵管住串音

朴素做法是「播 A 时静音 B 的 video 元素」——可行但脆：元素静音、音量、自动播放策略互相纠缠，浏览器一升级行为就变。工程化做法是把每段视频的音频都接进 WebAudio，用一个**增益矩阵**控制谁在说话：

```text
每段 video → MediaElementSource → 各自 GainNode ─┬→ MediaStreamDestination（进录制）
当前段 gain = 1，其余段 gain = 0                └→ 扬声器（监听支路）
```

同一时刻只有一段的增益开着，两段声音物理上不可能同时进入录制流——串音问题被图结构本身消灭，而不是靠时序祈祷。GainNode 到扬声器再分一路监听支路，用户拼接时听到的与录到的严格同源。视频侧同步走 `canvas.captureStream(30)`：canvas 上每画一帧（当前段 letterbox 适配绘制），采集流就多一帧，画布尺寸统一成目标规格，各段按宽高比信箱式（letterbox）居中——`computeFit` 算缩放比取 min 而非拉伸，避免变形。

**MediaElementSource 的一对一铁律**是这条链最阴的坑：一个 `<video>` 元素被 `createMediaElementSource` 接入音频图后，它的声音从此**只走图**、不再走元素默认输出；且一个元素只能被接一次、一个 source 也绑死一个元素。试图复用或重接（比如「重录一遍」再建一次 source）会静音或报错——正确做法是每段视频建独立元素与独立 source，用完整链释放。

## 格式协商与码率账

输出格式靠能力协商：优先 MP4（`MediaRecorder` 的 mp4 支持 Chrome 126+/Safari 才有），不支持则降级 WebM——先 `isTypeSupported` 探测再录，别让用户录完才发现下不了。码率从源文件推导：`源体积 ÷ 源时长` 得平均码率，作为新片的目标基准——重编码若盲目用默认码率，几段高清源接出来可能体积翻倍或糊成一团；沿用源码率量级是「画质近似守恒」的实用锚。音频同样汇入 MediaStreamDestination 的音轨与画面轨合并成 MediaStream 交给录制器。

这套「播放-采集-重录」的流水线与[浏览器视频处理管线](/blog/articles/browser-video-pipeline-mediarecorder/)一文是同一地基：{{< tool id="video-merger" >}}视频拼接{{< /tool >}}做顺序合成，{{< tool id="video-trimmer" >}}视频裁剪{{< /tool >}}做时间线剪辑，{{< tool id="mp4-inspector" >}}MP4信息查看器{{< /tool >}}负责拼接前先看清参数。录制完想压体积，交 {{< tool id="video-compressor" >}}视频压缩{{< /tool >}}。整条视频工具线收在[视频创作工具箱](/collections/video-creator-kit/)专题里，全程本地，素材不上传。
