---
title: "质量统计与单位换算的 17 件速算器：从 t 检验到 Cpk"
slug: "quality-stats-unit-cheatsheet"
date: 2026-11-08T18:05:00+08:00
draft: false
tags: ['质量工具', '统计分析', '单位换算', 'SPC']
categories: ['效率工具']
author: '有条工具团队'
summary: '改个参数要不要做 t 检验、Cpk 到多少算达标、GR&R 怎么算——质量人的日常卡在这些数上。17 件速算器按统计检验、质量体系、单位换算三组清点，每件一句话，写报告与迎审前收藏这一篇。'
---

质量报告的难点从来不是算，是怕算错：显著性判错要返工验证，Cpk 算错一条产线的口径就歪了，单位混一个试机报告就被打回。统计答「有没有」，体系答「稳不稳」，换算答「对不对」，三组正好对应质量工作的三层。这一篇把站里的 17 件质量与统计速算器按三组清点，每件一句话，审核前对照自查。

## 统计检验四件

判断「有没有差异」是数据分析的第一步，改工艺之前先测显著性，能省掉很多无效验证。{{< tool id="t-test-calculator" >}}t检验计算器{{< /tool >}}判两组均值差异是否显著，工艺改进前后的对比常用；{{< tool id="chi-square-calculator" >}}卡方检验计算器{{< /tool >}}检计数数据的独立性，不良分类与缺陷分布分析用它；{{< tool id="linear-regression-calculator" >}}线性回归计算器{{< /tool >}}拟合参数与响应的关系，DOE 之后找趋势靠它；{{< tool id="anova-calculator" >}}方差分析计算器{{< /tool >}}比较三组以上均值，多产线或多批次对比一步到位。

## 质量体系

体系审核考的不是计算，是口径一致。这八件覆盖了从 MSA 到客诉回复的主要交付物。{{< tool id="measurement-uncertainty-calculator" >}}测量不确定度评定{{< /tool >}}按 A 类 B 类分量合成扩展不确定度，校准报告必备；{{< tool id="sigma-level-converter" >}}西格玛水平换算{{< /tool >}}在 DPMO 与西格玛等级之间互转，汇报口径统一；{{< tool id="significant-figure-rounder" >}}有效数字修约{{< /tool >}}按修约规则处理四舍六入五留双，报告数值不再被挑错；{{< tool id="pfmea-risk-assessor" >}}PFMEA风险评估{{< /tool >}}按严重度、频度、探测度算 RPN，失效模式排序有依据；{{< tool id="grr-msa-calculator" >}}GR&R测量系统分析{{< /tool >}}算量具重复性与再现性占比，MSA 审核前先自查；{{< tool id="cpk-process-capability" >}}Cpk过程能力计算器{{< /tool >}}按规格限与标准差算过程能力指数，客户问 Cpk 就出这个数；{{< tool id="mtbf-fit-reliability" >}}MTBF/FIT可靠性换算{{< /tool >}}在平均无故障时间与 FIT 率之间换算，可靠性指标对得上整机厂口径；{{< tool id="8d-report-generator" >}}8D报告生成器{{< /tool >}}按步骤生成 8D 框架，客诉回复从空白文档变成一路填空。

## 单位换算

图纸与报告来自不同体系，换算是最后一道关。{{< tool id="pressure-convert" >}}压力单位换算{{< /tool >}}在 MPa、bar 与 psi 之间互转，液压与气动图纸通用；{{< tool id="flow-convert" >}}流量单位换算{{< /tool >}}覆盖 m³/h、L/min 等常用口径，泵与风机选型不混单位；{{< tool id="energy-convert" >}}能量单位换算{{< /tool >}}在 J、kWh 与 cal 之间互算，能耗报告直接对表；{{< tool id="power-units" >}}功率单位换算{{< /tool >}}在 kW、马力与 BTU/h 之间互转，设备铭牌看得懂；{{< tool id="force-convert" >}}力单位换算{{< /tool >}}在 N、kgf 与 lbf 之间互查，试机报告不再混单位。

统计检验管判断、质量体系管口径、单位换算管一致，17 件串起质量报告的完整链路，全部本地计算。按场景归类的入口在[质量工具箱](/collections/quality-toolkit/)，审厂季收藏备查。
