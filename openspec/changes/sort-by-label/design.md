## Context

当前 Bookmarks 扩展仅支持按行号排序（`sortBookmarks()` 硬编码为 `n1.line - n2.line`）。用户希望按书签在 UI 上显示的内容（标签名或行内容）进行排序，并支持跨文件全局排序和按排序顺序导航。

### 现有架构回顾

- 核心数据：`Controller.files: File[]`，每个 `File` 包含 `bookmarks: Bookmark[]`
- 存储：始终按行号顺序保存（`sortBookmarks()` 在每次添加后调用）
- 导航：`nextBookmark()` 依赖行号顺序在文件内查找下一个书签
- 显示：侧边栏 `getChildren()` 从 `Controller.files` 读取，按行号顺序展示
- 显示文本：有标签时 = `label`，无标签时 = 从文档读取的 `lineText`

### 关键设计原则

1. **存储与显示分离**：底层 `file.bookmarks` 数组始终按行号维护，不影响现有导航
2. **按需排序**：在显示层和导航层按当前排序模式生成有序副本
3. **向后兼容**：行号排序模式保持 100% 现有行为

## Goals / Non-Goals

**Goals:**
- 按显示文本排序（标签优先，无标签用行内容）
- 跨文件全局排序（列表视图下）
- 导航遵循排序顺序（跨文件跳转）
- 排序模式可切换（行号/标签）
- 显示文本唯一性校验
- 行号排序模式下 100% 保持现有行为

**Non-Goals:**
- 改变书签的数据存储格式（JSON 结构不变）
- 改变现有的行号排序模式行为
- 支持自定义排序规则（用户不可编程排序）
- 排序性能优化（书签数量通常 < 1000，无需索引）

## Decisions

### Decision 1: 全局排序列表的实现策略

**方案**：在 `Controller` 中新增 `getGlobalSortedBookmarks()` 方法，返回跨文件全局排序列表。

```
方案 A（选中）: Controller 层生成全局列表
  Controller.getGlobalSortedBookmarks(sortBy: SortBy): SortedBookmark[]
  返回一个扁平数组，每个元素包含 { file, bookmark, displayText, controller }
  
  优点：
  - 单一数据源，侧边栏和导航共享
  - 导航可以直接用数组索引定位
  - Controller 已经持有所有文件和书签数据

方案 B: 在侧边栏层排序
  在 BookmarkProvider.getChildren() 中排序
  
  缺点：
  - 导航逻辑无法复用
  - 数据和视图耦合
```

**选择方案 A**，因为导航也需要全局排序列表。

### Decision 2: 导航适配策略

**方案**：标签排序模式下，导航基于全局排序列表。

```
当前导航（行号模式）:
  file.bookmarks（按行号排序）
    → nextBookmark() 在当前文件找下一个行号更大的
    → 无更多 → nextDocumentWithBookmarks() 跨文件找

新导航（标签模式）:
  getGlobalSortedBookmarks()（全局排序列表）
    → 确定当前位置的全局索引
    → 下一个/上一个 = 索引 +1/-1
    → 跨文件自动处理

如何确定"当前位置"的全局索引:
  1. 获取当前文件 + 当前行号
  2. 在全局排序列表中找到最近的匹配
     - 优先匹配同一文件且行号最近的
     - 或匹配完全相同的 displayText
```

**选择**：在 `nextBookmark()` 中判断当前排序模式，路由到不同的导航逻辑。

### Decision 3: SortBy 枚举和配置存储

```typescript
// src/core/constants.ts
export enum SortBy {
    Line = "line",
    Label = "label"
}
```

存储位置：
- 使用 `Container.context.globalState` 存储（与 `viewAsList` 同级）
- 同时暴露为 VS Code 配置 `bookmarks.sortBy`（优先级低于 globalState）
- 两者不同步时，以 globalState 为准（允许命令面板快速切换）

**理由**：排序模式是用户偏好，应该跨工作区持久化，且切换频繁，不适合放在 project 配置中。

### Decision 4: 显示文本生成与国际化排序

#### 显示文本生成

```typescript
function getDisplayText(bookmark: Bookmark, lineContent?: string): string {
    if (bookmark.label && bookmark.label.trim() !== "") {
        return bookmark.label;  // 有标签 → 使用标签
    }
    return lineContent?.trim() || "";  // 无标签 → 使用行内容
}
```

#### 国际化排序策略

这是最关键的决策。排序算法必须同时处理英文、中文、日文、数字前缀等混合场景。

```typescript
function compareDisplayText(a: string, b: string): number {
    return a.localeCompare(b, getSortLocale(), {
        numeric: true,          // 数字感知: "2" < "10" < "100"
        sensitivity: 'base',    // 忽略大小写和重音: "abc" == "ABC", "é" == "e"
    });
}

function getSortLocale(): string | undefined {
    // 从配置读取，空字符串 = undefined = 系统默认 locale
    const configuredLocale = vscode.workspace.getConfiguration("bookmarks")
        .get<string>("sortByLocale", "");
    return configuredLocale || undefined;
}
```

**为什么 `locale` 不指定而是用系统默认？**

```
locale = undefined 的行为：
  macOS 中文系统 → localeCompare 使用 zh-CN → 拼音排序
  macOS 英文系统 → localeCompare 使用 en-US → 字母排序
  Windows 日文系统 → 五十音排序
  Linux 系统 → 取决于 LANG 环境变量

用户 VS Code 的界面语言不影响排序，只有操作系统 locale 影响。
这保证了用户在操作系统级别就能获得符合预期的排序行为。
```

**不同排序方式对比**：

| 排序方式 | "功能A" vs "接口B" | "abc" vs "功能" | "02" vs "10" |
|----------|-------------------|----------------|--------------|
| Unicode 码点（原生 sort） | 码点顺序（不符合人类预期） | 'a' < '功' ✓ | '0'='0' 继续比较 ✓ |
| localeCompare zh-CN | 拼音 gōng < jiē ✓ | 'a' < '功' ✓ | '0'='0' 继续比较 ✓ |
| localeCompare + numeric | 同上 ✓ | 同上 ✓ | 2 < 10 ✓ |
| localeCompare + numeric + base | 同上 ✓ | 同上 ✓ + 忽略大小写 ✓ | 2 < 10 ✓ |

**使用 `sensitivity: 'base'` 的效果**：

```
"abc"  == "ABC"   → 忽略大小写差异，排序时视为相等
"é"    == "e"     → 忽略重音
"straße" == "strasse" → 德语 ß 的特殊处理

唯一性校验时也使用同样的比较方式，避免 "TODO" 和 "todo" 同时存在。
```

**使用 `numeric: true` 的效果**：

```
没有 numeric:     "1" < "10" < "2"  ✗ (字符顺序)
有 numeric:       "1" < "2" < "10" ✓ (数值顺序)

这对 "01 funcA" 类型的标签至关重要！
```

**配置项 `bookmarks.sortByLocale`**：

```json
{
    "bookmarks.sortByLocale": {
        "type": "string",
        "default": "",
        "description": "Locale for display text sorting. Empty = use system default. Examples: 'zh-CN', 'en', 'ja', 'de'"
    }
}
```

该配置为高级选项，默认空字符串 = 使用系统 locale。仅在用户明确需要覆盖系统 locale 时才设置。

#### 排序优先级规则

```
完整的排序比较逻辑:

1. 分组: 有标签的书签 vs 无标签的书签
   - 有标签的书签始终排前面
   - 无标签的书签排后面

2. 同组内排序:
   - 使用 localeCompare(undefined, { numeric: true, sensitivity: 'base' })
   - 数字前缀正确处理: "01" < "02" < "10"
   - 忽略大小写: "abc" == "ABC"
   - 中文按拼音（系统是中文 locale 时）
   - 英文按字母（系统是英文 locale 时）

3. 完全相同时:
   - 使用行号作为第二排序条件（确保稳定性）
   - 行号小的排前面
```

### Decision 5: 显示文本唯一性校验位置

校验在 `Controller.addBookmark()` 和 `Controller.updateLabel()` 中进行：

```
addBookmark(position, label?, book?):
  1. 计算新书签的 displayText
  2. 遍历所有 controller 的所有文件的所有书签
  3. 如果 displayText 已存在 → 返回冲突错误
  4. 不存在 → 正常添加

updateLabel(index, position, newLabel):
  1. 计算新 label 的 displayText（排除自身）
  2. 如果已存在 → 返回冲突错误
  3. 不存在 → 正常更新
```

校验不阻止**无标签书签**的创建（因为用户无法控制行内容），但给予警告。

### Decision 6: 侧边栏适配

```
getChildren() 逻辑扩展:

根节点 (element === undefined):
  ├── viewAsList && sortBy === "label":
  │   → 全局排序列表 → 扁平 BookmarkNode[]（跨文件混合）
  │
  ├── viewAsList && sortBy === "line":
  │   → 现有行为：扁平列表，按文件分组
  │
  ├── !viewAsList && controllers.length > 1:
  │   → 现有行为：WorkspaceNode[]
  │
  └── !viewAsList && controllers.length === 1:
      → 现有行为：FileNode[]

FileNode 展开 (element.kind === NODE_FILE):
  ├── sortBy === "line":
  │   → 现有行为：按行号排序
  │
  └── sortBy === "label":
      → 按 displayText 排序
```

### Decision 7: 多根工作区（multi-root）全局排序策略

**方案**：标签排序模式下，不同 workspace folder 的书签**混合排序**（不做 workspace 层级分组）。

```
理由：
- 用户切换标签排序的目的是按内容组织书签，而非按文件位置
- 如果先按 workspace 分组再排序，相当于在 workspace 层级打断了排序
- 侧边栏的 workspace 分组在 Tree view 下依然保留（通过 WorkspaceNode），
  而 List view + 标签排序本来就是扁平视图，混合排序更符合直觉
- 与 Decision 1（全局排序列表）一致，Controller.getGlobalSortedBookmarks()
  已经遍历所有 controllers，天然是跨 workspace 的
```

**影响**：
- Tree view 下：按 WorkspaceNode → FileNode 分组，组内按 displayText 排序（各 workspace 独立排序）
- List view 下：所有 workspace 的书签在同一个扁平列表中全局排序

### Decision 8: 侧边栏排序切换按钮

利用现有的 `View & Sort` 子菜单和标题栏按钮模式：

```
View & Sort 子菜单:
  ├── View as Tree          (已有)
  ├── View as List          (已有)
  ├── ──────────────────
  ├── Sort by Line    ★    (新增，当前激活)
  └── Sort by Label         (新增)

类似现有的 viewAsTree/viewAsList 切换模式：
- 两个按钮互斥
- 使用 context `bookmarks.sortBy` 控制可见性
- enablement 条件：sortBy === "line" / sortBy === "label"
```

### Decision 9: QuickPick (list / listFromAllFiles) 适配

```typescript
// list() - 当前文件列表
// 行号模式：按行号排序（现有）
// 标签模式：按 displayText 排序

// listFromAllFiles() - 跨文件列表
// 行号模式：现有排序（当前文件优先 → 同工作区 → 其他工作区）
// 标签模式：全局按 displayText 排序
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 行内容变化导致排序漂移 | 显示文本在显示时计算，始终反映最新行内容。排序在每次显示时重新计算。 |
| 大量书签时性能问题 | 书签数量通常 < 100，排序操作 O(n log n) 可忽略。如果 > 1000，可缓存排序结果。 |
| 导航时"当前位置"定位不准确 | 使用最近的行号匹配作为 fallback，确保导航不丢失。 |
| 唯一性校验可能误伤 | 无标签书签只警告不阻止；允许用户选择"仍然创建"。 |
| 与现有菜单冲突 | 使用已有的 "View & Sort" 子菜单，不增加新容器。 |

## Testing Strategy

### 1. 单元测试（Unit Tests）— 纯函数，无 VS Code 依赖

**目标目录**：`src/test/unit/`

| 测试对象 | 测试内容 | 关键场景 |
|----------|----------|----------|
| `sortBookmarksByLabel()` | 基础排序逻辑 | 字母序、大小写不敏感、稳定排序、undefined/空字符串排在最后、不可变性 |
| `getDisplayText()` | 显示文本生成规则 | 有 label → 返回 label；无 label → 返回 line content（trimmed）；空 label → 返回 line content |
| `compareByDisplayText()` | localeCompare 排序 | `numeric: true` 确保 `"2" < "10"`；`sensitivity: 'base'` 确保 `a == A == á`；labeled 永远在 unlabeled 之前；display text 相同时以 line number 为第二排序键 |
| `getSortLocale()` | locale 配置读取 | 空字符串 → undefined（系统默认）；`"zh-CN"` → `"zh-CN"`；`"ja"` → `"ja"` |

**特别关注点**：
- **中文 locale**（zh-CN）下按拼音排序：`功能` < `接口` < `配置` < `数据`
- **日文 locale**（ja）下按假名顺序排序
- 需要 mock `Intl.Collator` 或 `localeCompare` 的行为，或在 CI 环境确认 locale 可用

### 2. 集成测试（Integration Tests）— VS Code Extension Development Host

**目标目录**：`src/test/suite/`

| 测试模块 | 测试内容 |
|----------|----------|
| **Sort Mode 状态管理** | `toggleSortBy()` 切换后 `globalState` 是否正确持久化；启动时从 `globalState` 恢复排序模式 |
| **配置监听** | 修改 `bookmarks.sortByLocale` → 触发排序刷新；extension 重新加载后 locale 配置恢复 |
| **命令注册** | `bookmarks.sortByLine`、`bookmarks.sortByLabel` 命令存在且可触发 |
| **Sidebar Tree Provider** | List view + 标签排序 → 全局扁平列表按 display text 排序；Tree view + 标签排序 → 按文件分组，组内按 display text 排序；切换排序模式时 `_onDidChangeTreeData.fire()` 被调用 |
| **导航逻辑** | 标签排序模式下 `jumpToNext`/`jumpToPrevious` 按全局排序列表顺序跳转；`wrapNavigation` 在标签排序模式下从末尾跳转到开头；行排序模式下导航行为不变（回归测试） |
| **QuickPick 适配** | 标签排序模式下 QuickPick 列表按 display text 排序 |

**Mock 策略**：使用 `vscode.TreeView` 和 mock 的 `BookmarkProvider` 注入预定义书签数据，验证 `getChildren()` 的返回顺序。

### 3. 回归测试（Regression Tests）

| 回归点 | 重要性 |
|--------|--------|
| 行排序模式不受影响 | ⭐⭐⭐ |
| 原有导航逻辑不受影响 | ⭐⭐⭐ |
| 原有 QuickPick 行为不受影响 | ⭐⭐ |
| Tree view 原有分组逻辑不受影响 | ⭐⭐⭐ |

**关键原则**：在行排序模式（`sortBy === SortBy.Line`）下，所有分支走原有路径，不改动原有逻辑。

### 4. 边界条件测试

| 场景 | 预期行为 |
|------|----------|
| 所有书签均无 label | 全部按 line content 排序 |
| 所有书签 label 都相同 | 保持原顺序（稳定排序） |
| 跨 3+ 个 workspace folder 的全局排序 | 所有文件的书签统一排序 |
| 超大书签集合（1000+） | 排序在可接受时间内完成 |
| 书签所在行内容为纯空白 | `trim()` 后为空字符串，排在最后 |
| display text 完全相同的两个书签 | 以 line number 为第二排序键 |
| 特殊 Unicode 字符（emoji、零宽字符） | 不抛异常，按 locale 规则排序 |

### 5. 手动 / 端到端测试

| 测试步骤 | 验证点 |
|----------|--------|
| 打开多个文件，添加带 label 和不带 label 的书签 | 侧边栏显示正确 |
| 点击排序切换按钮（Line ↔ Label） | 视图立即刷新 |
| 修改 `bookmarks.sortByLocale` 为 `zh-CN` | 中文标签按拼音排序 |
| 设置 `wrapNavigation: false`，在末尾执行 `jumpToNext` | 不跳转 |
| 同时使用 View As List + Label 排序 | 全局扁平列表 |
| 同时使用 View As Tree + Label 排序 | 按文件分组，组内排序 |

### 6. 测试文件结构

```
src/test/
├── unit/
│   ├── sort.test.ts            # sortBookmarksByLabel 单元测试
│   ├── displayText.test.ts     # 新增 — getDisplayText, compareByDisplayText
│   └── sortLocale.test.ts      # 新增 — getSortLocale
├── suite/
│   ├── extension.test.ts       # 扩展现有 — sort mode 切换测试
│   ├── sidebar.sort.test.ts    # 新增 — sidebar 排序测试
│   └── navigation.sort.test.ts # 新增 — 排序导航测试
```

### 7. 实现与 Spec 的差异提示

当前 `sort.ts` 中的 `sortBookmarksByLabel()` 使用 `< >` 运算符做大小写不敏感比较。但 Spec 要求使用 `localeCompare` with `{ numeric: true, sensitivity: 'base' }`。两者行为差异如下：

| 场景 | `< >` 运算符 | `localeCompare` |
|------|--------------|-----------------|
| `"2-app"` vs `"10-app"` | `"10-app"` < `"2-app"`（字符序） | `"2-app"` < `"10-app"`（数值感知） |
| `"á"` vs `"a"` | `"a"` < `"á"`（码元值） | 相等（`sensitivity: 'base'`） |
| 中文拼音排序 | 按码元值 | 按拼音（zh-CN locale） |

最终的产品级函数应使用 `localeCompare` 替代 `< >` 运算符。测试需覆盖这两层的差异。

## Open Questions

<!-- 无待解决问题 -->
