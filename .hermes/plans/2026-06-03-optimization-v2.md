# Arcana 塔罗项目优化计划 v2

> **执行方式：** 自行执行，分三批实施，每批 build 验证

**目标：** 修复已验证的 20 项问题（P0×5 + P1×4 + P2×7 + P3×4）

---

## 第一批：独立小改动（16项，互不依赖）

### Task 1-2: 删除死代码
- 删除 `src/lib/audio.ts`（零 import，与 sounds.ts 重复）
- 删除 `app/components/effects/ShootingStars.tsx`（零 import，Particles.tsx 已含流星）

### Task 3: gsap.set 值函数 bug
- 文件: `CardFanSelection.tsx:62-67`
- 改动: `tl.set(cards, { rotation: () => random })` → `cards.forEach` + `gsap.set` 逐张设置
- 原因: `gsap.set` 不支持值函数，所有牌得到相同旋转值

### Task 4: 问题输入 maxLength
- 文件: `reading/page.tsx:131-137`
- 改动: input 加 `maxLength={200}` + 字数显示

### Task 5-6: API 安全
- 文件: `api/reading/route.ts`
- Task 5: 删除第35行 `console.log` 打印 API key 前缀
- Task 6: 第54-60行错误响应脱敏，不泄露上游 errorText

### Task 7: SSE 解析缓冲
- 文件: `reading/[spreadId]/page.tsx:178-189`
- 改动: 加 `sseBuffer` 变量，跨 chunk 保留不完整行

### Task 8: SSE/AI 超时
- 文件: `reading/[spreadId]/page.tsx:163-168`
- 改动: fetch 加 `AbortController` + 60s `setTimeout`

### Task 9-10: Store 小修
- 文件: `reading-store.ts`
- Task 9: selectCard 加 `deckIndex >= 0 && < deck.length` 检查
- Task 10: saveToHistory 加 `.slice(0, 50)` 上限

### Task 11: 每日一牌 setTimeout 清理
- 文件: `daily/page.tsx:52`
- 改动: 用 useRef 存 timer，useEffect cleanup clearTimeout

### Task 12: History lazy loading
- 文件: `history/page.tsx:111,133`
- 改动: `<img>` 加 `loading="lazy" decoding="async"`

### Task 13: prefers-reduced-motion
- 文件: `globals.css` 末尾
- 改动: 加 `@media (prefers-reduced-motion: reduce)` 禁用动画

### Task 14: Modal z-index
- 文件: `history/page.tsx:171` + `library/page.tsx:108`
- 改动: backdrop `z-50` → `z-[60]`（高于 Navbar z-50）

### Task 15: Modal Escape + focus
- 文件: `history/page.tsx` + `library/page.tsx`
- 改动: useEffect 监听 keydown Escape + panelRef 自动聚焦按钮

### Task 16: tsconfig target
- 文件: `tsconfig.json:3`
- 改动: `"ES2017"` → `"ES2022"`

### Task 17: 死 CSS 清理
- 文件: `globals.css:472-502`
- 改动: 删除 `.nav`/`.nav-link`/`.nav-link:hover`/`.nav-link.active`（Navbar 用 Tailwind 类）

**→ 第一批完成后 `npx next build` 验证**

---

## 第二批：需要联动改动（2项）

### Task 18: any 类型修复
- 文件: `daily/page.tsx:90` — `card: any` → `card: (typeof TAROT_CARDS)[number]`
- 文件: `library/page.tsx:95` — `detail: any` → `detail: TarotCard`（需处理组件/类型同名冲突）
  - 方案: 组件 import 改名 `TarotCardComponent`，类型 import `import type { TarotCard }`

### Task 19: Store error 状态 + 重试
**三处必须同时改：**
1. `types/reading.ts` — ReadingStatus 加 `'error'`
2. `reading-store.ts` — 加 `error: string` 字段 + `setError` action
3. `reading/[spreadId]/page.tsx`:
   - 解构加 `error, setError`
   - catch 块用 `setError()` 替代 `setAIResult()`
   - 面板条件加 `status === 'error'`
   - **关键**: 外层条件 `(status === 'revealing' || ... || status === 'error')` 必须包含 error，否则 TS 类型收窄报错
   - error 状态显示错误消息 + 重试按钮

**→ 第二批完成后 `npx next build` 验证**

---

## 第三批：性能大招（2项）

### Task 20: ShuffleDeck MiniCard 占位符
- 文件: `ShuffleDeck.tsx`
- 改动:
  1. 删除 `import CardBack`，新增内联 `MiniCard` 函数组件（~10行，纯 div + 渐变 + 小 SVG 圆圈）
  2. JSX 中 `<CardBack size="sm" animated={false} minimal />` → `<MiniCard />`
  3. 移除 78 个元素的 `willChange: 'transform'`（浪费 GPU 合成层）

### Task 21: CardBack SVG ID 唯一化
- 文件: `CardBack.tsx`
- 改动:
  1. 组件内加 `const uid = React.useId()`
  2. 6 个 `<defs>` ID: `id="bg-grad"` → `id={`${uid}-bg-grad`}`
  3. 所有 `url(#xxx)` 引用: `fill="url(#bg-grad)"` → `fill={`url(#${uid}-bg-grad)`}`
  4. mask 引用同理

**→ 第三批完成后 `npx next build` 验证**

---

## 最终验证
- `npx next build` 全量构建
- `git add -A && git commit -m "优化：20项修复（性能+安全+健壮性+代码质量）"`
