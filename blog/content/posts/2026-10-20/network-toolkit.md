---
title: "网络排查工具箱：从 ping 到 TLS 的 30 款浏览器工具"
slug: "network-toolkit"
date: 2026-10-20T11:10:00+08:00
draft: false
tags: ['网络排查', 'DNS', 'HTTPS', 'API调试', '运维']
categories: ['效率工具']
author: '有条工具团队'
summary: '网站打不开、接口报跨域、证书快过期——网络问题层层有对应工具。站内网络工具箱已有三十余款，这篇挑 24 款串成完整排查链：WHOIS 与 DNS 查域名，路由追踪与测速看路径，子网和 IPv6 管规划，HTTP 客户端、cURL 转码、状态码表调接口，SSL 检查与 DNSSEC 守 TLS 这一环。解析与生成类全部在浏览器本地完成，敏感配置不出本机。'
---

## 排查网络问题，先定位"卡在哪一层"

网络故障最忌乱试。正确姿势是分层定位：**域名解析了吗？路径通吗？端口开着吗？证书有效吗？接口返回了什么？** 站内网络工具箱已凑齐三十余款，各守一层。这篇挑 24 款，从查域名一直讲到 TLS 和部署配置，按"该打开哪一层"的顺序排。

## 域名三连查：注册、解析、IP 指向

网站出问题的第一分钟，[WHOIS查询](https://www.util.cn/tools/whois-lookup/) 先看注册商、到期日和状态锁——"网站突然打不开"最乌龙也最常见的原因就是域名过期。确认没过期，[DNS查询](https://www.util.cn/tools/dns-lookup/) 查 A、AAAA、CNAME、MX、TXT 记录，解析指错了地方一目了然。拿到 IP 之后，[IP信息查询](https://www.util.cn/tools/ip-info/) 看归属地和运营商。自己机器上的 IP 也别猜，[私有IP检测器](https://www.util.cn/tools/private-ip-checker/) 判断它属于私网、CGNAT 还是保留段——"为什么同事的 10.x 和你家路由的 192.168 是一回事"，NAT 场景讲得明明白白。

## 路径与连通：跳数、速度、端口、实时连接

页面能解析但加载慢或断流，[路由追踪工具](https://www.util.cn/tools/route-tracer/) 逐跳走一遍，看在哪一跳开始丢包延迟飙升——运营商线路、机房出口的问题都藏在这张跳数表里。[网络速度测试](https://www.util.cn/tools/network-speed-test/) 测下载、上传、延迟和抖动，视频会议卡不卡，抖动比带宽更关键。服务连不上，[端口扫描器](https://www.util.cn/tools/port-checker/) 检查端口开放状态——**只测自己拥有或获得授权的服务器**。实时应用断线，[WebSocket测试](https://www.util.cn/tools/websocket-test/) 验证握手与连接保持；视频通话没声音没图像，[WebRTC诊断工具](https://www.util.cn/tools/webrtc-diagnostics/) 查 ICE 候选和媒体设备。

## 地址规划：子网与 IPv6

配网络绕不开 [子网计算器](https://www.util.cn/tools/subnet-calculator/)：给个 CIDR，网络地址、广播地址、可用主机范围直接算出。IPv6 的两款互补：[IPv6地址转换器](https://www.util.cn/tools/ipv6-address-converter/) 做压缩展开和格式转换，[IPv6范围计算器](https://www.util.cn/tools/ipv6-scope-calculator/) 算前缀范围和子网规划，连 SLAAC、EUI-64 地址生成都管。要在本机临时改域名指向或屏蔽广告域名，[hosts片段生成器](https://www.util.cn/tools/hosts-generator/) 生成规范片段并附各系统的应用方法。

## HTTP 与接口调试：从发请求到看懂返回

[HTTP客户端](https://www.util.cn/tools/http-client/) 在浏览器里直接构造发送请求，调接口不用再开 Postman。复制来的 cURL 命令看不懂？[cURL转代码](https://www.util.cn/tools/curl-to-code/) 一键转成各语言代码。排查请求头，[请求分析器](https://www.util.cn/tools/request-analysis/) 拆解分析 HTTP 请求头，[UserAgent解析](https://www.util.cn/tools/user-agent-parser/) 把浏览器 UA 串解析成人话，[MIME类型查询](https://www.util.cn/tools/mime-types/) 查文件类型对照。跨域报错先跑 [CORS测试工具](https://www.util.cn/tools/cors-tester/)，测完直接生成服务端配置代码。返回码看不懂，[HTTP状态码速查表](https://www.util.cn/tools/http-status-codes/) 收录 61 个状态码的含义、发生场景与排查建议——401 是没带凭证，403 是服务端拒了，404 先查路径，502 是上游挂了，按五大类分组检索。对接第三方前先查 [常用端口速查表](https://www.util.cn/tools/port-lookup/)：81 个端口的服务协议，还标注了公网暴露的安全风险。

## TLS 与部署：证书、签名链、配置文件

[SSL证书检查](https://www.util.cn/tools/ssl-checker/) 看目标站点证书的有效期、颁发链和协议支持，https 小锁背后的账一次查清。DNS 侧再加一道保险：[DNSSEC验证工具](https://www.util.cn/tools/dns-sec-verifier/) 检查签名链和安全状态，防解析结果被篡改。最后，改完站点要写服务器配置，[Nginx配置生成器](https://www.util.cn/tools/nginx-config-generator/) 按需求勾选生成配置文件——**全程在浏览器本地生成，内部域名和架构不经过任何服务器**。

## 症状对照：该开哪一款

| 症状 | 先开 | 再看 |
| --- | --- | --- |
| 网站突然全挂 | WHOIS查询（过期？） | DNS查询 |
| 解析对了但连不上 | 路由追踪工具 | 端口扫描器（授权范围内） |
| 时快时慢、视频卡 | 网络速度测试 | WebRTC诊断 / WebSocket测试 |
| 接口报跨域 | CORS测试工具 | HTTP状态码速查表 |
| 小锁报错、证书告警 | SSL证书检查 | DNSSEC验证工具 |

## 常见问题

### 端口扫描、批量请求会不会被当成攻击？

工具本身不越界，越界的是用法：**只对自有或书面授权的目标使用**，浏览器发起的检测能力也有限，不能替代授权渗透测试。对陌生公网地址乱扫，在国内和多数国家都可能触犯法律。

### 查询和分析会不会泄露我的环境信息？

解析与生成类（子网计算、IPv6 转换、UA 解析、请求头分析、Nginx 与 hosts 生成）全部在浏览器本地完成，不落日志；WHOIS、DNS、证书本来查询的就是公网注册信息。真正敏感的东西——内网地址、Cookie、带 token 的请求头——在这套工具里过一遍，不会从你的浏览器出去。

## 小结

排查链背下来就一句话：**域名查 WHOIS 和 DNS，路径看路由追踪和测速，接口靠 HTTP 客户端、CORS 和状态码表，最后一环 SSL 证书加 DNSSEC，配置生成交给 Nginx 工具**。三十款浏览器端网络工具串成一条链，从 ping 到 TLS 层层有落点——本地计算、不留痕迹，放心把排查数据留在自己机器上。
