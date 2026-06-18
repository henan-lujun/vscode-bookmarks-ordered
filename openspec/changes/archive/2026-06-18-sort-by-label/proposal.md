## Why

当前 Bookmarks 扩展仅支持按行号排序，书签在**跨文件**场景下无法按照用户自定义的顺序排列。用户经常使用带编号的标签（如 `01 funcA`、`02 funcB`）来组织书签，但由于缺乏按显示文本排序的能力，这些书签在侧边栏和导航中只能按文件+行号排列，导致用户精心编排的顺序被打乱。

本功能允许用户在**行号排序**和**显示文本排序**之间切换，并按显示顺序进行跨文件导航，大幅提升书签的组织和访问效率。

## What Changes

### 新增功能

- **按显示文本排序模式**：书签按其在 UI 上显示的内容（有标签时按标签名，无标签时按行内容）进行字母/Unicode 排序
- **跨文件全局排序**：在列表视图 + 标签排序模式下，所有文件的书签混合成一个全局有序列表
- **按排序顺序导航**：jumpToNext/Previous 遵循当前排序模式的顺序，支持跨文件跳转
- **多排序模式切换**：用户可在"按行号排序"和"按显示文本排序"之间切换
- **显示文本唯一性校验**：创建书签时检查显示文本是否重复，重复时给出提示

### 新增配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `bookmarks.sortByLocale` | string | `""` | 排序使用的 locale，空值 = 系统默认。例如 `"zh-CN"`、`"en"`、`"ja"` |

> **注意**：`bookmarks.sortBy` **不是** VS Code 配置项。排序模式通过 `globalState` 持久化（类似现有的 `viewAsList`），通过 VS Code 的 `when` context key `bookmarks.sortBy` 控制 UI 可见性。详见设计文档 Decision 3。

### 新增命令

| 命令 | 说明 |
|------|------|
| `bookmarks.sortByLine` | 切换到按行号排序 |
| `bookmarks.sortByLabel` | 切换到按显示文本排序 |
| `_bookmarks.sortByLine#sideBar` | 侧边栏按钮 |
| `_bookmarks.sortByLabel#sideBar` | 侧边栏按钮 |

### 修改的命令行为

| 命令 | 变更 |
|------|------|
| `bookmarks.jumpToNext` | 在标签排序模式下，按全局排序列表顺序导航 |
| `bookmarks.jumpToPrevious` | 同上 |
| `bookmarks.list` | 按当前排序模式显示 |
| `bookmarks.listFromAllFiles` | 按当前排序模式显示 |
| `bookmarks.toggle` | 创建书签时检查显示文本唯一性 |
| `bookmarks.toggleLabeled` | 同上 |

### 修改的 UI

- **"View & Sort" 子菜单**：增加"Sort by Line"和"Sort by Label"选项
- **侧边栏标题栏**：增加排序模式按钮（类似已有的 Tree/List 切换）
- **侧边栏列表视图**：标签排序模式下显示全局跨文件排序列表

## Capabilities

### New Capabilities

- `sort-by-label`: 按显示文本排序书签，支持跨文件全局排序和按排序顺序导航
- `sort-mode-switch`: 在行号排序和显示文本排序之间切换，不影响现有功能
- `display-text-uniqueness`: 创建书签时校验显示文本唯一性，避免重复

### Modified Capabilities

<!-- 无现有 specs 需要修改 -->

## Impact

### 受影响文件

| 文件 | 影响程度 | 说明 |
|------|---------|------|
| `src/core/constants.ts` | 小 | 新增 SortBy 枚举 |
| `src/core/operations.ts` | 中 | sortBookmarks() 支持多排序模式，新增全局排序函数 |
| `src/core/controller.ts` | 中 | 新增全局排序列表获取方法，addBookmark/updateLabel 新增唯一性校验 |
| `src/sidebar/bookmarkProvider.ts` | 大 | getChildren() 按排序模式显示 |
| `src/sidebar/nodes.ts` | 小 | 无变化或新增排序状态枚举 |
| `src/extension.ts` | 大 | 导航逻辑变更，新增排序切换命令，监听配置变化 |
| `src/commands/export.ts` | 中 | 导出排序遵循当前排序模式 |
| `package.json` | 中 | 新增命令、设置项、菜单项 |
| `package.nls.json` | 小 | 新增排序相关命令的本地化字符串 |

### 向后兼容

- 行号排序模式保持 100% 现有行为
- 新增的排序模式默认值为 `"line"`（行号排序），不影响现有用户
- 书签数据存储格式不变
