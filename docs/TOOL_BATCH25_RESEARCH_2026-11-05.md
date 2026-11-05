# 第二十五批选品调研：电子行业线第二批验证（2026-11-05）

> 方法：backlog 第二十节剩余 16 款候选逐个碰撞检测（24 个关键词全部零真撞车，4 个命中均为 bucket/WebAudio/NTC 描述误报）+ 三波 12 组 WebSearch 竞争验证（叠加第二十四批调研时已查的 6 项：555/TL431/线宽/Cpk/分压/波特率）+ 3 个新发现探针（保险丝/TVS/变压器重绕）。

## 一、竞争验证结论总表

| 候选 | 竞争现状 | 判定 |
|---|---|---|
| **GR&R 计算器** | 全网只有理论文章+Excel 模板（CSDN/百度文库/kknews），**在线交互工具中文为零**（搜索引擎自己都提示"需要在线计算器请搜英文"） | 🟢 强推 |
| **运放增益计算器** | 仅 Google Play App + ADI 品牌误差预算器（重工具），简体中文 Web 交互**真空** | 🟢 强推 |
| **MTBF/FIT 换算器** | onsemi/Diodes/Coilcraft 全是品牌专属（绑自家型号库），通用换算（FIT↔MTBF↔AFR/系统串联合成/Arrhenius 加速）无 | 🟢 强推 |
| **保险丝选型器** | 厂商全是选型指南+公式页（伊顿/松下/AEM/萨特/威可特），中文独立在线计算器**零** | 🟢 强推·新发现 |
| **74/4000 系列真值表速查** | 全是 PDF 手册/维基/CSDN 引脚图合集，**零交互工具** | 🟢 升格入选·新发现 |
| Cpk/Ppk | Super Engineer 一家 + SPSSAU 重平台（上轮已查） | 🟡 做，直方图+双口径差异化 |
| PCB 线宽载流 | DigiKey 强（IPC-2221）/tool-box，中文独立弱（上轮已查） | 🟡 做，加过孔载流+铜厚联动 |
| BUCK 电感选型 | MPS/Coilcraft/TDK 品牌选型器垄断（绑料号库），**通用公式版无** | 🟡 做，错位定位"公式教学+纹波率" |
| RC 时间常数 | miniwebtool 繁体 1 家 | 🟡 做，双向+充放电曲线 |
| TL431/LM317 | dwenzhao 个人站+EEWorld 老工具（上轮已查） | 🟡 做，三芯片合并页 |
| 铜厚换算 | pcb-tools.cn 只有单位换算；铜厚档位+基铜/成品铜+AWG+载流整合无 | 🟡 做 |
| 555 定时器 | 6+ 家老站（上轮已查，最多） | 🟡 做则必须差异化：SVG 电路图+反向求解+E12 吸附 |
| TVS 选型校验 | 应用笔记多，交互工具仅厂商参数搜索（数据库型） | ⚪ 保池（第二批候补） |
| 变压器重绕 | 理想换算 5 家饱和（miniwebtool/bchrt×2/23bei/element14）；**重绕特化**（每伏匝数=45/截面积、数原匝反推、压降补偿）无工具 | ⚪ 保池（做必须重绕差异化） |
| LC 谐振 | bchrt/hvtop/dianziaihaozhe/Pasternack/EEWorld/elecfans **6 家** | 🔴 弃（饱和） |
| 容抗/感抗 | DigiKey/elecfans/EEWorld/EET/Keysight/21ic **6 家** | 🔴 弃（饱和） |
| 电阻分压 | DigiKey/pcb-tools/eetree 3+ 家 | 🔴 弃（并入 TL431 页做联动） |
| ADC 分辨率 | ntc-thermistor-calculator 模式三已覆盖核心场景（分压+ADC 码值换算） | 🔴 弃（站内已实质覆盖） |

## 二、第二十五批建议组合（12 款，全部零新依赖）

| # | id（拟） | 名称 | 关键规格锚点 |
|---|---|---|---|
| 1 | grr-msa-calculator | GR&R 测量系统分析 | 均值极差法（AIAG MSA 第四版）：10 件×3 人×3 次表单输入→EV/AV/GRR%/P/T%/NDC；%GRR 三档判定 <10/10-30/>30；K1/K2/K3 系数表内置（**以 AIAG 手册自核**）；NDC≥5 提示 |
| 2 | cpk-process-capability | Cpk 过程能力计算器 | Cp/Cpk（σ=R̄/d₂ 短期）+ Pp/Ppk（长期 σ）双口径；直方图 SVG+规格线；1.0/1.33/1.67 判定档；d₂/D2 系数表 |
| 3 | mtbf-fit-reliability | MTBF/FIT 可靠性换算器 | FIT=10⁹/MTBF、AFR=8760/MTBF 双向；系统串联合成 MTBF=1/Σλ；Arrhenius 加速因子 AF=exp(Ea/k·(1/T1−1/T2))，Ea 预设 0.7eV；60%/90% 置信 χ² 上限（复用 dppm 页不完全伽马思路） |
| 4 | opamp-gain-calculator | 运放增益计算器 | 五拓扑：反相 −Rf/Ri、同相 1+Rf/Rg、差分、仪表放大（RG 式）、电压跟随器；增益 dB/V 倍双显示；**E 系列吸附联动**（互链 eseries-resistor-finder）；输入输出电压摆幅校验位 |
| 5 | buck-inductor-calculator | BUCK 电感选型计算器 | L=(Vin−Vout)×D/(fs×ΔI_L)，纹波率 r=ΔI/IL 取 20-40%；CCM/DCM 判定；峰值电流 Ipk=IL+ΔI/2（饱和电流校验）；输出电容纹波估算附注；定位"公式教学"，页尾注明品牌选型器可查现货料号 |
| 6 | pcb-trace-width-calculator | PCB 线宽载流计算器 | IPC-2221 显式式 I=k·ΔT^0.44·A^0.725（外层 k=0.048/内层 0.024）；线宽↔载流↔温升三向；**过孔载流**（等效铜面积折算）；注明 IPC-2152 更保守；铜厚联动（互链 7 号） |
| 7 | copper-thickness-converter | 铜厚与线规换算器 | 铜厚档位表 0.5/1/2/3oz↔mil↔mm↔µm（1oz≈35µm）；**基铜/成品铜区别**（HAL 喷锡 +15-20µm 之类口径以工艺资料为准）；AWG 4/0-40 号线规表（直径/截面积/裸铜载流经验值）；1oz/40mil≈1A 经验注记 |
| 8 | tl431-feedback-calculator | 稳压反馈电阻计算器 | TL431（Vref=2.495V，Vout=Vref(1+R1/R2)）/LM317（1.25V）/稳压管限流（R=(Vin−Vz)/(Iz+Iload)）三模式 Tab；E 系列吸附+实际输出回验；分压场景就是本页联动（吸收 voltage-divider 弃选位） |
| 9 | rc-time-constant | RC 时间常数计算器 | τ=RC 双向；充电 V(t)=Vs(1−e^(−t/τ)) 达 63.2%/99.3%(5τ) 表；**充放电曲线 SVG**（可拖时间游标）；上下拉延时应用注记 |
| 10 | fuse-selector | 保险丝选型计算器 | UL 口径 In≥I工作/0.75、IEC 直接选；环境温度降额曲线表（常见 25℃ 基准）；I²t 校验流程（浪涌 I²t < 公称熔化 I²t 的 70-80% 裕量）；快断/慢断场景选择指引；**公式多版本口径并列注明**（蓝宝/AEM 各家系数） |
| 11 | logic-ic-truth-table | 74/4000 系列速查 | 30-40 常用型号（7400/02/04/08/32/74/86/138/139/153/161/164/165/244/245/273/373/374/393/4017/4040/4060/4066/4069/4093/4511 等）；DIP-14/16 参数化 SVG 引脚图+交互真值表+功能一句话+代换提示（HC/LS/HCT/F 后缀区别表）；**数据以各型号 datasheet 为准自核**（查表类 SSR 完整性探测必做） |
| 12 | timer-555-calculator | 555 定时器计算器 | 无稳态 f=1.44/((R1+2R2)C)、D=(R1+R2)/(R1+2R2)；单稳态 T=1.1RC；**差异化三板斧**：SVG 电路图随参数重绘、反向求解（目标 f/D→R1R2C 组合吸附 E12）、D<50% 需二极管的提示 |

**弃选 4**：lc-resonance、impedance-reactance（各 6 家饱和）、voltage-divider（并入 TL431）、adc-resolution（NTC 页已覆盖）。
**保池 3**：tvs-selector（四条件校验器）、transformer-rewind（重绕特化：每伏匝数+数原匝反推）、uart-baud-error。

## 三、内容层与底账配套

- **personas 任务增补**（不加新画像，electronics 两画像加任务）：hardware-engineer +4（运放增益核算/BUCK 电感选型/线宽铜厚核查/反馈电阻计算）、+1（74 系列真值表查询）；electronics-repairer +2（保险丝换件选型/RC 延时排故）；
- **collections 扩容**：电子工程师设计台 +5（#4/5/6/8/9/12 里挑）、IC 测试质量台 +2（#1/3）、电子维修工作台 +2（#10 + 555）；传感器信号链不动；
- **wiki 词条 4**：运放、MTBF/FIT、保险丝 I²t、555 定时器（Cpk/GR&R 概念词条已有可互链）；
- **推文 4 篇**：①测试线第二篇（GR&R 实操+Cpk 直方图）②运放选型五拓扑一篇 ③保护器件一篇（保险丝+TVS 概念）④打样前线宽铜厚一篇；
- date 用构建时刻已过时段；{{< tool >}} 成对式；构建后 grep 产物。

## 四、工作量与风险

- 12 款全零新依赖；最重的是 **logic-ic-truth-table**（30-40 型号数据表+参数化 SVG 引脚图，建议单独一个 agent 专做并要求逐型号双源自核）；grr/cpk 系数表（K1/K2/K3、d₂）属查表类，**规格书一律写"以 AIAG 手册为准自核"**；
- IPC-2221 系数 k=0.048/0.024 是外部层保守式，规格里注明与 IPC-2152 的关系防"发明标准"质疑；
- 555 差异化是本批唯一"红海求存"项，若 agent 交付时差异化不足（无 SVG/无反向求解）宁可砍掉留池，不做第 7 家同质页。

---

*本报告锚定第二十五批；落地后更新 backlog 批次记录。检索：WebSearch 12 组（三波）。*
