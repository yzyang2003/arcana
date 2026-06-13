# Arcana 塔罗在线占卜 — 项目详细报告

> **生成时间：** 2026-06-02  
> **Git HEAD：** `09b93a6`  
> **在线地址：** https://arcana-hazel.vercel.app  
> **GitHub 仓库：** https://github.com/yzyang2003/arcana  
> **用途：** 交由 mimocode 进行项目优化和重构

---

## 1. 项目概述

Arcana 是一个基于 AI 的在线塔罗牌占卜 Web 应用。用户可以选择牌阵、输入问题、从虚拟牌堆中选牌，然后由 AI 生成个性化的塔罗解读。项目注重视觉体验和交互动画，采用电影级的暗色神秘主题设计。

### 核心功能

| 功能 | 描述 |
|------|------|
| 🏠 首页品牌展示 | 动态粒子背景 + 双CardBack鼠标跟随 + SplitText文字动画 |
| 🔮 占卜流程 | 选择牌阵 → 输入问题 → 洗牌动画 → 扇形选牌 → 翻牌揭示 → AI解读 |
| 🃏 每日一牌 | 基于日期的固定牌 + 翻牌仪式 + 星光绽放 + 详细解析 |
| 📚 牌库浏览 | 78张塔罗牌浏览 + 大图查看 + 正逆位含义 |
| 📜 历史记录 | 占卜历史持久化（localStorage）+ 详情回顾 |
| ⚙️ 设置 | 静音开关 + 深色主题 |

### 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 16.2.6 |
| UI | React | 19.2.4 |
| 动画 | GSAP + @gsap/react | 3.15.0 |
| 样式 | Tailwind CSS v4 | 4.x |
| 状态管理 | Zustand | 5.0.14 |
| 图标 | Lucide React | 1.17.0 |
| 语言 | TypeScript | 5.9.3 |
| 部署 | Vercel | — |
| AI | OpenAI 兼容 API (SSE 流式) | — |

### 环境变量

```
AI_API_KEY=xxx        # AI API 密钥
AI_BASE_URL=xxx       # AI API 地址 (兼容 OpenAI 格式)
AI_MODEL=xxx          # 模型名称
```

---

## 2. 项目结构

```
arcana/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 根布局（GsapProvider + Particles + Navbar）
│   ├── page.tsx                  # 首页（品牌展示）
│   ├── globals.css               # 全局样式 + 设计系统 (737行)
│   ├── providers/
│   │   └── GsapProvider.tsx      # GSAP 全局配置 + prefers-reduced-motion
│   ├── components/
│   │   ├── tarot/
│   │   │   ├── CardBack.tsx      # 牌背面 SVG 组件 (413行，最复杂)
│   │   │   ├── TarotCard.tsx     # 正反面翻牌组件 (211行)
│   │   │   ├── CardFanSelection.tsx  # 扇形双行选牌 (217行)
│   │   │   └── ShuffleDeck.tsx   # 洗牌散射动画 (127行)
│   │   ├── effects/
│   │   │   ├── Particles.tsx     # Canvas 粒子+星云+星座+流星 (228行)
│   │   │   ├── GlowingEffect.tsx # 鼠标跟随径向光效 (74行)
│   │   │   └── CelebrationParticles.tsx  # 庆祝粒子 (76行)
│   │   └── layout/
│   │       ├── Navbar.tsx        # 导航栏+滑动指示器 (150行)
│   │       ├── PageTransition.tsx # 页面过渡动画
│   │       └── FontLoader.tsx    # 字体加载检测
│   ├── api/
│   │   └── reading/route.ts      # AI 解读 API (SSE 流式)
│   ├── reading/
│   │   ├── page.tsx              # 牌阵选择页
│   │   └── [spreadId]/page.tsx   # 占卜主流程页 (398行)
│   ├── daily/page.tsx            # 每日一牌
│   ├── library/page.tsx          # 牌库浏览
│   ├── history/page.tsx          # 历史记录
│   └── settings/page.tsx         # 设置页
├── src/
│   ├── data/
│   │   ├── tarot-cards.ts        # 78张牌数据 (1678行)
│   │   └── spreads.ts            # 牌阵布局数据 (387行)
│   ├── store/
│   │   └── reading-store.ts      # Zustand 状态管理 (146行)
│   ├── lib/
│   │   ├── ai.ts                 # AI Prompt 构建 (73行)
│   │   └── sounds.ts             # Web Audio 音效合成 (133行)
│   └── types/
│       └── reading.ts            # TypeScript 类型定义 (29行)
├── .env.local                    # 环境变量（不入 git）
├── package.json
├── tsconfig.json
└── next.config.ts
```

### 代码量统计

| 文件类型 | 行数 |
|----------|------|
| TSX 组件 | ~3,200 行 |
| TS 逻辑 | ~1,100 行 |
| CSS 样式 | 737 行 |
| 数据文件 | ~2,065 行 |
| **合计** | **~6,400 行** |

---

## 3. 架构设计

### 3.1 状态管理 (Zustand)

使用 Zustand + persist 中间件管理占卜状态，仅持久化历史记录到 localStorage。

```
状态机流程：
idle → shuffling → selecting → revealing → interpreting → complete
                                         ↘ error
```

**ReadingStore 核心状态：**
- `status`: 当前状态（idle/shuffling/selecting/revealing/interpreting/complete/error）
- `spread`: 当前选择的牌阵
- `deck`: 剩余可选的牌ID数组
- `drawnCards`: 已抽取的牌（含位置、正逆位、是否揭示）
- `aiResult`: AI 解读文本
- `history`: 历史记录数组（最多50条，localStorage 持久化）

**关键函数：**
- `startReading()`: 洗牌（Fisher-Yates shuffle）
- `selectCard(deckIndex)`: 从扇形选牌到下一个牌阵位置
- `revealCard(positionIndex)`: 翻开指定位置的牌
- `setAIResult()`: 设置解读结果，自动保存到历史

### 3.2 AI 解读 (SSE 流式)

**API 路由：** `POST /api/reading`

- 使用 OpenAI 兼容的 Chat Completions API
- `stream: true` 启用 SSE 流式响应
- 温度 0.8，最大 2000 tokens
- 前端通过 `ReadableStream` 逐块读取并拼接
- SSE 缓冲处理：手动解析 `data: ` 前缀和 `[DONE]` 标记

**Prompt 结构：**
- System: 资深塔罗解读师人设（温暖、启发式、不绝对化）
- User: 牌阵类型 + 各牌信息（牌名、位置、正逆位）+ 用户问题

### 3.3 动画系统 (GSAP)

GSAP 是项目的核心动画引擎，用于：

| 场景 | 技术 |
|------|------|
| 页面过渡 | `useGSAP` + `usePathname` 依赖 |
| SplitText 文字动画 | `SplitText.create()` + `from({autoAlpha:0})` |
| 鼠标跟随 | `gsap.quickTo()` — 零渲染 |
| 3D 翻牌 | `gsap.timeline()` + `rotateY: 180` |
| 扇形选牌 | `gsap.set()` + `gsap.to()` per card |
| 洗牌散射 | `gsap.timeline()` 三段式（散射→悬浮→回归）|
| 全息折射 | CSS `conic-gradient` + `@property` + `requestAnimationFrame` |
| ScrambleText | `gsap/ScrambleTextPlugin` |
| 磁性按钮 | `gsap.to()` + `elastic.out` |

**全局配置（GsapProvider）：**
- 注册 `useGSAP` 和 `SplitText` 插件
- `prefers-reduced-motion` 支持：`gsap.globalTimeline.timeScale(100)`

### 3.4 Canvas 粒子系统

`Particles.tsx` 是一个统一的 Canvas 绘制组件，包含：

1. **星云层** — 3个大型径向渐变（紫/蓝/暗紫），缓慢飘移
2. **粒子** — 80个点，15% 金色 85% 紫色，鼠标交互（近距离排斥+远距离吸引）
3. **星座线** — 距离 < 130px 的粒子间连线
4. **流星** — 随机生成，对角线移动，渐变尾迹

**性能优化：**
- 单 `requestAnimationFrame` 循环
- `visibilitychange` 事件暂停/恢复
- DPI 适配（`devicePixelRatio` + `setTransform`）

### 3.5 CardBack SVG 设计

CardBack 是项目中最复杂的组件（413行），包含 8 层 SVG：

1. 背景渐变（深紫→黑）
2. 噪点纹理（SVG feTurbulence）
3. 同心圆 + 十字线 + 对角线
4. 三层装饰圆点（慢速旋转）
5. 新月 + 星星（呼吸动画）
6. 四角装饰（菱形 + 射线）
7. 全息折射层（conic-gradient 覆盖）
8. 暗角 + 边框高光

**Props：**
- `size`: sm/md/lg
- `animated`: 是否启用动画
- `minimal`: 简化模式（堆叠场景用，减少 DOM）
- `parallax`: 鼠标跟随倾斜

### 3.6 音效系统

`sounds.ts` 使用 Web Audio API 合成音效（无需外部文件）：

- `playWhoosh()` — 噪声爆发 + 带通滤波（洗牌/入场）
- `playFlip()` — 短促点击（翻牌）
- `playClick()` — 高频点击（按钮）
- `playReveal()` — 闪烁音效（揭示）

支持静音模式。

---

## 4. 设计系统

### 4.1 色彩

```css
--void: #050505           /* 主背景 */
--surface: #0f1115         /* 面板背景 */
--mystic: #1b1830          /* 神秘紫色 */
--accent: #9b8cff           /* 主强调色（紫） */
--accent-soft: #d4ccff      /* 柔和紫 */
--gold: #d4af37             /* 金色 */
--frost: #e8e6f0            /* 主文字 */
--muted: #8b8798            /* 弱化文字 */
--glass: rgba(18,14,32,0.65) /* 毛玻璃（紫色调） */
```

### 4.2 字体

- **Display:** Cinzel Decorative（Google Fonts CDN）
- **Display Alt:** Palatino Linotype
- **Body:** Inter
- **Mono:** JetBrains Mono

### 4.3 CSS 特性

- `@property --border-angle` — 动态渐变边框动画
- `mask-composite: exclude` — 纯边框动画
- `backdrop-filter: blur(16px) saturate(1.4)` — 毛玻璃
- `conic-gradient` — 全息折射 + 动态边框
- `mix-blend-mode: screen` — 光效叠加
- CSS `color-scheme: dark` — 原生控件暗色

---

## 5. 已完成的视觉优化（20项 + 5项Bug修复）

### Phase 1 — 立竿见影
1. **页面过渡动画** — `PageTransition.tsx`，usePathname 监听，淡入+上浮
2. **AI打字机效果** — 逐行 blur→clear 揭示 + 闪烁光标
3. **金色shimmer** — GSAP 控制颜色循环（不兼容 CSS animation）
4. **color-scheme: dark** — 原生控件自动暗色
5. **字体FOUT防护** — `FontLoader.tsx`，3秒超时保底

### Phase 2 — 核心体验
6. **CardBack全息折射** — conic-gradient + `--holo-angle` + 鼠标跟随
7. **翻牌光爆发** — 4条光线射线 + 金色边框描边
8. **ScrambleText** — 牌名从乱码解码为真实名字
9. **玻璃面板进化** — `@property` 动态渐变边框 + 紫色调
10. **扇形呼吸微动画** — 入场后 ±2px 浮动

### Phase 3 — 氛围打磨
11. **星云粒子** — 3层星云 + 鼠标先吸引再弹开
12. **每日星光绽放** — 12颗粒子径向辐射
13. **庆祝粒子** — 24个金紫粒子从底部升起
14. **导航滑动指示器** — GSAP 动画 absolute pill
15. **洗牌运动模糊** — `blur(2px)` 散射 → 清晰化

### Phase 4 — 细节极致
16. **磁性按钮** — 鼠标磁吸 + `elastic.out` 回弹
17. **偷看光效** — 悬停时金色边缘渐变
18. **正面全息** — `mix-blend-mode: screen` 光泽
19. **页面专属氛围** — 各页面不同渐变背景
20. **色散边缘** — 4色 box-shadow 模拟棱镜

### Bug修复
- setTimeout 清理（useRef + useEffect cleanup）
- FontLoader 超时保底（3秒）
- CelebrationParticles GSAP cleanup
- Navbar 指示器 `overwrite: true`
- CardFanSelection 呼吸动画 cleanup

---

## 6. 已知问题 & 优化建议

### 🔴 高优先级

| 问题 | 描述 | 建议 |
|------|------|------|
| **API Key 暴露风险** | Vercel 上的 API Key 被截图泄露 | 考虑加 rate limiting + API Key 轮换 |
| **无认证系统** | 任何人都可以无限调用 AI 接口 | 加 IP 限流或简单的访问控制 |
| **CardBack 组件过重** | 413行，8层SVG，每张牌一个实例 | 考虑拆分 + 用 Canvas 替代 SVG |
| **无错误边界** | API 失败时用户体验差 | 加 React Error Boundary + 重试机制 |

### 🟡 中优先级

| 问题 | 描述 | 建议 |
|------|------|------|
| **tarot-cards.ts 过大** | 1678行硬编码数据 | 考虑 JSON 文件 + 动态导入 |
| **历史记录无上限** | localStorage 最多50条但无清理策略 | 加过期清理或迁移到后端 |
| **无 SEO** | 首页 meta 信息简单 | 加 OpenGraph + 结构化数据 |
| **无 PWA 支持** | 不能安装到手机桌面 | 加 manifest.json + Service Worker |
| **API 无缓存** | 每次占卜都调用 AI | 相同牌阵可缓存解读结果 |
| **无国际化** | 仅中文 | 如需英文用户可加 i18n |

### 🟢 低优先级 / 重构建议

| 问题 | 描述 | 建议 |
|------|------|------|
| **组件拆分** | `reading/[spreadId]/page.tsx` 398行混合了多个阶段 | 拆为 ShufflingView / SelectingView / RevealingView |
| **自定义 Hook** | 鼠标跟随、GSAP 动画等逻辑重复 | 提取 `useMouseTilt`、`useGSAPAnimation` |
| **TypeScript 严格度** | 部分 `any` 和类型断言 | 开启 strict mode |
| **测试** | 无任何测试 | 加 Vitest + React Testing Library |
| **Storybook** | 无组件文档 | 组件可视化 + 交互文档 |
| **性能监控** | 无 Lighthouse / Web Vitals | 加 Vercel Analytics |
| **CI/CD** | 无自动测试/检查 | 加 GitHub Actions |
| **CSS 架构** | globals.css 737行混合了多种关注点 | 拆为 tokens/components/utilities |
| **状态管理** | reading-store.ts 混合了业务逻辑和副作用 | 分离纯状态和 side effects |

---

## 7. 重构优先级建议

### 第一阶段：代码质量（1-2天）
1. 开启 TypeScript strict mode，修复所有类型错误
2. 拆分 `reading/[spreadId]/page.tsx` 为多个子组件
3. 提取自定义 Hook（useMouseTilt、useGSAPEntrance 等）
4. 拆分 globals.css 为模块化文件
5. 添加 ESLint + Prettier 配置

### 第二阶段：功能增强（2-3天）
1. 加 rate limiting（Vercel Edge Config 或 Redis）
2. 加 React Error Boundary
3. 加 OpenGraph / SEO 元数据
4. 加 PWA 支持（manifest + Service Worker）
5. 加占卜结果分享功能

### 第三阶段：性能优化（1-2天）
1. CardBack SVG → Canvas 渲染（减少 DOM）
2. 动态导入非首屏组件
3. 图片优化（Next.js Image + WebP）
4. Bundle 分析 + 代码分割

### 第四阶段：工程化（1-2天）
1. 加 Vitest 单元测试
2. 加 GitHub Actions CI
3. 加 Storybook 组件文档
4. 加 Lighthouse CI 性能检查

---

## 8. 部署信息

| 项目 | 值 |
|------|-----|
| 平台 | Vercel |
| URL | https://arcana-hazel.vercel.app |
| GitHub | https://github.com/yzyang2003/arcana |
| 自动部署 | push 到 main 分支自动触发 |
| 环境变量 | 在 Vercel Dashboard 配置 |

### 更新流程
```bash
# 本地修改后
git add -A
git commit -m "描述"
git push
# Vercel 自动部署（1-2分钟）
```

---

## 9. 本地开发

```bash
# 克隆
git clone https://github.com/yzyang2003/arcana.git
cd arcana

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 AI API 信息

# 启动开发服务器
npm run dev
# 访问 http://localhost:3000

# 构建
npm run build
```

---

## 10. 致谢

- [GSAP](https://gsap.com/) — 动画引擎
- [Next.js](https://nextjs.org/) — React 框架
- [Tailwind CSS](https://tailwindcss.com/) — 原子化 CSS
- [Zustand](https://github.com/pmndrs/zustand) — 状态管理
- [Vercel](https://vercel.com/) — 部署平台

---

*报告结束。如需进一步了解任何模块的实现细节，请参考对应源码文件。*
