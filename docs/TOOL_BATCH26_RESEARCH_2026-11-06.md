# 第二十六批选品调研：51 款大批次（2026-11-06，✅ 当日全部落地，全站 855 款）

> 方法：110 个候选 idea 碰撞检测（52 个真空白 + 定性后保留 6 个误报）+ 保池 3 款回收 + WebSearch 抽查 6 项。弃选 8：楼梯踏步（UnitJuggler/FloorScan/chippy 等 5+ 家饱和）、等效焦距（miniwebtool/腾讯/佳能/bchrt 4 家）、油耗（fuel-calculator 已有）、攻丝底孔（thread-reference-table 已覆盖）、咖啡（coffee-brewing 已有）、HTTP 状态码/DNS 记录/年龄（站内已有）。**螺栓拧紧扭矩表确认真空**（全网只有 PDF 与文章，无交互工具，VDI 2230 口径可差异化）。

## 一、51 款清单（九条线）

**电子·保护与驱动 6**：tvs-selector（TVS 四条件校验）/ relay-driver-calc（继电器线圈电流→晶体管基极电阻）/ optocoupler-resistor（光耦 CTR/限流/上拉）/ rc-snubber（RC 吸收电路）/ decoupling-cap（去耦电容配置：频段→容值组合）/ ldo-dropout（LDO 压差功耗与简算结温）
**电子·无源与数字 7**：capacitor-energy（储能与放电时间）/ duty-cycle-converter（PWM 占空比↔平均电压）/ led-array-planner（LED 串并联：Vf/限流/串数并数）/ air-core-inductor（Wheeler 空芯电感）/ sallen-key-filter（Sallen-Key fc 与 Q）/ transformer-rewind（重绕：每伏匝数 45/截面积+数原匝反推）/ uart-baud-error（分频误差表）
**射频 5**：antenna-length（λ/4、λ/2 振子）/ swr-calculator（SWR↔反射系数↔失配损耗）/ dbm-watts（dBm↔W↔Vpp 三向）/ attenuator-pad（π/T 型衰减器电阻）/ capacitor-energy 归上
**离网电源 3**：solar-panel-sizer（负载 Wh→板/电池/控制器）/ ups-runtime（VA/W/Ah→分钟）/ battery-runtime（容量×电流→小时，Peukert 注记）
**汽车 3**：tire-pressure-convert（kPa/bar/psi+冷热胎压修正）/ obd-dtc-lookup（P0xxx 常见故障码速查）/ headlight-bulb（H1/H4/H7/9005 等型号对照）
**机械 7**：bolt-torque-table（M3-M24 × 8.8/10.9/12.9 级预紧扭矩，**VDI 2230 摩擦系数口径自核**）/ spring-rate（刚度串并联）/ pneumatic-cylinder（缸径×压力→推拉力）/ hydraulic-force（P=F/A 帕斯卡）/ gear-ratio-reducer（齿数比→速比/扭矩/级联）/ chain-sprocket（链条节数：中心距/节距）/ sandpaper-grit（P 目数↔用途工序对照）
**建筑庭院 5**：roof-pitch（角度↔百分比↔x:12）/ greenhouse-heating（体积×温差→W）/ gravel-sand-coverage（面积×厚度→吨/袋）/ potting-soil（花盆尺寸→土量升数）/ knitting-gauge（编织密度→起针数）
**影音 5**：macro-magnification（放大率/曝光补偿/有效光圈）/ shutter-angle（180° 法则 fps↔快门）/ timelapse-interval（目标时长↔间隔）/ spl-distance（逆平方衰减）/ delay-time-ms（BPM↔ms 全音符表）
**生活与实验 5**：solution-prep（质量/摩尔浓度配制与稀释）/ dog-chocolate（可可碱 mg/kg 分级）/ hiking-water（距离/温度/负重→L）/ cycling-gear-ratio（牙盘飞轮→速比/发展米数）/ sound-dose（LAeq×时长→日允许剂量）
**单位换算 6**：pressure-convert（Pa/bar/psi/atm/mmHg/inHg）/ flow-convert（L/min、m³/h、GPM、CFM）/ energy-convert（J/cal/kWh/BTU/Wh）/ power-units（kW/hp/PS/BTU/h）/ force-convert（N/kgf/lbf）/ paper-weight-convert（gsm↔lb 磅纸）

## 二、抽查结论（WebSearch 3+6 组）

真空强推：**螺栓扭矩表**（全 PDF）、TVS/重绕/波特率（保池回收）、机械七件（气缸/液压/弹簧/减速比/链条/砂纸全站内无同类）、碎石/花土/温室（庭院三件全空）。
中竞争可做：SWR/天线（射频老工具站多为英文或计算器合集页）、OBD 故障码（多为 APP，Web 速查弱）。
维持弃选：见页首。

## 三、实施安排

- 注册：52→实际 51 款（capacitor-energy 归电子无源组），全零新依赖；图标新增 Lightbulb/Mountain/Bike（候选，落地时按 lucide 实际存在微调）
- personas +8 画像任务增补；collections 扩容 3 处 + 新专题「车主随车速查」；wiki +6
- agent 17 组（每组 3-4 页）× 2 并发 ≈ 9 波；推文 11 篇覆盖 51 款
- 复杂度注记：obd-dtc-lookup 与 headlight-bulb 是数据表型（宁删勿错+显著免责）；bolt-torque 是查表型（SSR 全参数探测必做）

*报告：2026-11-06。锚定第二十六批；backlog 新增第二十一节。*
