---
title: "测速、DNSSEC、子网划分：16 件网络诊断工具清单"
slug: "network-diagnostics-roundup"
date: 2026-11-08T21:25:00+08:00
draft: false
tags: ['网络诊断', 'DNS', 'IP地址', '开发者工具']
categories: ['效率工具']
author: '有条工具团队'
summary: '用户说网页打不开、改了解析半天不生效、划子网借位借到头晕——网络问题难在定位。这篇把站点 16 件网络诊断工具分成连通与测速、DNS 与解析、地址与规划、配套四组，按排查顺序对号入座。'
---

「网页打不开了」——是用户家断网、运营商绕路、解析出错，还是自己的服务挂了？网络排障难就难在先定位，定位错了后面全是白折腾。站点的网络诊断工具攒到 16 件，这篇按排查路径分成「连通与测速、DNS 与解析、地址与规划、配套」四组，从外到内一层一层往下查。

## 连通与测速：先判断通不通

用户抱怨页面卡，先跑{{< tool id="network-speed-test" >}}网络速度测试{{< /tool >}}，分清是带宽不够还是延迟抖动，别一上来就重启服务器。想知道中途哪一跳开始变慢，{{< tool id="route-tracer" >}}路由追踪工具{{< /tool >}}把沿途节点逐个点名，和运营商沟通前先留证据。长连接莫名掉线，{{< tool id="websocket-test" >}}WebSocket测试{{< /tool >}}在本地模拟握手和收发，前后端的责任立刻分清。视频会议卡成幻灯片，{{< tool id="webrtc-diagnostics" >}}WebRTC诊断工具{{< /tool >}}看 NAT 类型和候选链路，打洞不通就得走中转。

## DNS 与解析：名字指对了没

改了解析记录半天不生效，{{< tool id="dns-cache-flusher" >}}DNS缓存刷新{{< /tool >}}先清本地缓存再验证，八成是缓存没过期。怀疑域名被劫持，{{< tool id="dns-sec-verifier" >}}DNSSEC验证工具{{< /tool >}}核对签名链完不完整，验不过就别信这个解析结果。配置邮件防伪的 SPF、DKIM，{{< tool id="txt-record-editor" >}}TXT记录编辑器{{< /tool >}}帮你把记录拼对，发出去的信少进垃圾箱。服务连不上先核对端口，{{< tool id="port-lookup" >}}常用端口速查表{{< /tool >}}把 22、80、443 这些号一页列全，防火墙规则照着配。日志里冒出陌生 IP，{{< tool id="ip-info" >}}IP信息查询{{< /tool >}}先看归属地和运营商再决定封不封，境外高频扫描直接拉黑。

## 地址与规划：把网络划清楚

划 VLAN 借位借到头晕，{{< tool id="subnet-calculator" >}}子网计算器{{< /tool >}}把掩码、网段和可用主机数一次算全，广播地址也标出来。老设备只认完整写法，{{< tool id="ipv6-address-converter" >}}IPv6地址转换器{{< /tool >}}在缩写和全称之间互转，配置文件里不再对不上。拿到前缀要算地址段大小，{{< tool id="ipv6-scope-calculator" >}}IPv6范围计算器{{< /tool >}}把起止地址列出来，分配方案直接抄。静态资源加载异常，{{< tool id="mime-types" >}}MIME类型查询{{< /tool >}}确认服务器该登记哪个类型，字体文件报错多半是它。同一个页面在统计里被记成五种写法，{{< tool id="url-canonicalizer" >}}URL规范化工具{{< /tool >}}先统一再统计，转化数据不再翻倍。接口偶发超时难定位，{{< tool id="request-analysis" >}}请求分析器{{< /tool >}}把头部和耗时拆开看，是排队慢还是传输慢一目了然。

## 配套：一张二维码收尾

客人到店总在问 Wi-Fi 密码，{{< tool id="wifi-qrcode-generator" >}}Wi-Fi二维码生成器{{< /tool >}}把账号密码做成二维码，扫一下就连上，贴在收银台正合适。

16 件网络工具全部在浏览器本地运行，诊断过程不留痕。从测速到解析的整套排查工具，收录在[网络排障套装](/collections/network-troubleshoot-kit/)专题里，下次断网按单点查，别再凭感觉重启。
