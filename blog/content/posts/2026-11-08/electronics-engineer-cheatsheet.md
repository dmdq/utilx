---
title: "电子工程师的 30 件速算器：从测温到射频的一次性清点"
slug: "electronics-engineer-cheatsheet"
date: 2026-11-08T17:05:00+08:00
draft: false
tags: ['电子设计', '速算器', '电源设计', '射频', 'PCB']
categories: ['效率工具']
author: '有条工具团队'
summary: '画板调机最贵的不是仪器，是停下来翻资料的时间。30 件电子速算器按传感测温、电源稳压、信号链、PCB 结构、射频天线五条战线清点，每件一句话说清使用场景，收藏这一篇按图索骥。'
---

调机现场最贵的不是仪器，是停下来翻资料的时间。配电感、定线宽、算 B 值，这些算式都不难，难的是每次现查公式还怕单位错一位。这一篇按五条战线清点站里的 30 件电子速算器，每件一句话，按图索骥即可。

## 传感与测温

热敏与热电偶是测控板的前端。{{< tool id="ntc-thermistor-calculator" >}}NTC热敏电阻计算器{{< /tool >}}算 B 值分压与温度对照，做温控先过这步；{{< tool id="rtd-thermocouple-lookup" >}}PT100热电偶换算器{{< /tool >}}管铂电阻与热电偶的毫伏、温度互查，接工业探头用；{{< tool id="signal-loop-converter" >}}4-20mA信号换算器{{< /tool >}}把变送器环路电流换回物理量，调 PLC 模拟量必配。

## 电源与稳压

电源是翻车重灾区。{{< tool id="buck-inductor-calculator" >}}BUCK电感选型计算器{{< /tool >}}按纹波电流定感量与饱和电流，换芯片先算它；{{< tool id="tl431-feedback-calculator" >}}稳压反馈电阻计算器{{< /tool >}}解 TL431 与 FB 的分压网络，输出电压一锤定音；{{< tool id="ldo-dropout" >}}LDO压差与功耗{{< /tool >}}校验最小压差与发热，别让稳压器烫手；{{< tool id="rc-time-constant" >}}RC时间常数计算器{{< /tool >}}算软启动与延时的充放电节奏；{{< tool id="fuse-selector" >}}保险丝选型计算器{{< /tool >}}按额定电流与熔断特性挑规格；{{< tool id="tvs-selector" >}}TVS选型校验器{{< /tool >}}核对钳位电压护不护得住后级；{{< tool id="decoupling-cap" >}}去耦电容配置{{< /tool >}}给出各容值的数量与摆放建议；{{< tool id="ups-runtime" >}}UPS续航估算{{< /tool >}}按负载与电池容量估停电支撑时间，机房规划用。

## 信号链

模拟与数字的交界最容易出错。{{< tool id="opamp-gain-calculator" >}}运放增益计算器{{< /tool >}}解同相、反相与差分放大倍数；{{< tool id="sallen-key-filter" >}}Sallen-Key滤波器{{< /tool >}}算截止频率与 Q 值，有源滤波不翻表；{{< tool id="attenuator-pad" >}}衰减器计算{{< /tool >}}算 π 型与 T 型网络的电阻值，射频音频都通用；{{< tool id="timer-555-calculator" >}}555定时器计算器{{< /tool >}}给振荡与单稳态配阻容；{{< tool id="crystal-load-calculator" >}}晶振负载电容计算器{{< /tool >}}按 CL 反推外挂电容，不起振先查它；{{< tool id="uart-baud-error" >}}波特率误差计算{{< /tool >}}核对时钟分频下的实际偏差，串口乱码先查它；{{< tool id="q-format-converter" >}}Q格式定点数转换器{{< /tool >}}做浮点与定点互转，写 DSP 代码必备；{{< tool id="i2c-pullup-calculator" >}}I2C上拉电阻计算器{{< /tool >}}按速率与线电容定上拉阻值，挂多设备时有用。

## PCB 与结构

板子画完，物理层才算开始。{{< tool id="pcb-trace-width-calculator" >}}PCB线宽载流计算器{{< /tool >}}按电流与温升定线宽，电源走线必查；{{< tool id="copper-thickness-converter" >}}铜厚与线规换算器{{< /tool >}}在盎司铜厚与 mil、毫米之间互转；{{< tool id="heatsink-calculator" >}}散热热阻计算器{{< /tool >}}算结到环境热阻与所需散热器，功率器件标配；{{< tool id="air-core-inductor" >}}空芯电感计算{{< /tool >}}按骨架尺寸算匝数，绕电感不试凑；{{< tool id="led-array-planner" >}}LED串并联规划{{< /tool >}}按限流与均流定串并结构；{{< tool id="transformer-rewind" >}}变压器重绕计算{{< /tool >}}按匝比与窗口面积算重绕参数，修电源用；{{< tool id="electrolytic-cap-life" >}}电解电容寿命估算器{{< /tool >}}按纹波电流与温度推寿命，评电源可靠性；{{< tool id="motor-capacitor-sizer" >}}电机电容选型器{{< /tool >}}给单相电机的移相电容配容量。

## 射频与天线

天线是玄学，但长度与功率的换算是实学。{{< tool id="antenna-length" >}}天线长度计算{{< /tool >}}按频率算 λ/4 与 λ/2 的导线长度；{{< tool id="swr-calculator" >}}驻波比换算{{< /tool >}}在反射系数、回波损耗与 SWR 之间互查，调天线就看它；{{< tool id="dbm-watts" >}}dBm瓦特换算{{< /tool >}}做功率单位互转，看懂功放手册靠它。

这 30 件覆盖了从传感器到天线的常用换算，全部在浏览器本地完成，没网也能用。顺手收藏[电子设计工作台](/collections/electronics-design-bench/)，画板调机按目录取用，比现场翻资料快得多。
