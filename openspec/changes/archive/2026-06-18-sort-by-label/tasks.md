## 1. Core Data Model: SortBy 枚举与配置

- [x] 1.1 在 `src/core/constants.ts` 中新增 `SortBy` 枚举（`Line = "line"`, `Label = "label"`）
- [x] 1.2 在 `src/extension.ts` 中新增排序模式的 context 变量 `bookmarks.sortBy`，用 `globalState` 持久化
- [x] 1.3 实现排序模式切换函数 `toggleSortBy()`，更新 context 并刷新侧边栏
- [x] 1.4 注册命令 `bookmarks.sortByLine` 和 `bookmarks.sortByLabel`，绑定到切换函数
- [x] 1.5 在 `package.json` 中新增配置项 `bookmarks.sortByLocale`（string, default: ""），支持用户自定义排序 locale
- [x] 1.6 在 `extension.ts` 中监听 `bookmarks.sortByLocale` 配置变化，实时刷新排序

## 2. 显示文本生成与排序函数

- [x] 2.1 在 `src/core/operations.ts` 中实现 `getDisplayText(bookmark, lineContent?)` 函数
- [x] 2.2 实现 `compareByDisplayText(a, b)` 比较函数（使用 localeCompare，配置 `{ numeric: true, sensitivity: 'base' }`）
- [x] 2.3 修改 `sortBookmarksByLabel()` 的内部比较逻辑，从 `< >` 运算符委托给 `compareByDisplayText()`
- [x] 2.4 实现 `getSortLocale()` 函数，从 `bookmarks.sortByLocale` 配置读取 locale（空值 = undefined = 系统默认）
- [x] 2.5 实现 `getGlobalSortedBookmarks(controllers, sortBy)` 返回跨文件全局排序列表
- [x] 2.6 新增 `SortedBookmarkItem` 接口（包含 file, bookmark, displayText, controller, lineContent 字段）

## 3. 排序模式切换 UI

- [x] 3.1 在 `package.json` 中新增命令 `bookmarks.sortByLine` 和 `bookmarks.sortByLabel`
- [x] 3.2 在 `package.json` 的 "View & Sort" 子菜单下新增排序选项（类似 viewAsTree/viewAsList）
- [x] 3.3 在 `package.json` 中新增侧边栏标题栏排序切换按钮（使用现有 `view/title` 菜单模式）
- [x] 3.4 在 `package.json` 的 `commandPalette` 中隐藏内部排序命令
- [x] 3.5 在 `package.nls.json` 中添加排序相关命令的本地化字符串

## 4. 侧边栏适配

- [x] 4.1 修改 `BookmarkProvider.getChildren()` 根节点分支：列表视图 + 标签排序 → 全局扁平列表
- [x] 4.2 修改 `BookmarkProvider.getChildren()` 根节点分支：树视图 + 标签排序 → 组内按标签排序
- [x] 4.3 修改 `BookmarkProvider.getChildren()` 的 FileNode 展开分支：按排序模式排序
- [x] 4.4 确保侧边栏在排序模式切换时立即刷新（通过 `_onDidChangeTreeData.fire()`）

## 5. 导航适配

- [x] 5.1 修改 `nextBookmark()` 函数：根据当前排序模式路由到不同的导航逻辑
- [x] 5.2 实现标签排序模式的导航逻辑：基于全局排序列表，通过索引定位下一个/上一个
- [x] 5.3 实现"当前位置 → 全局索引"的映射算法
- [x] 5.4 适配 `Controller.nextDocumentWithBookmarks()`：标签排序模式下不使用（由全局列表处理跨文件跳转）
- [x] 5.5 确保 wrapNavigation 在标签排序模式下正常工作

## 6. QuickPick 适配

- [x] 6.1 修改 `extension.ts` 中的 `list()` 函数：标签排序模式按 displayText 排序
- [x] 6.2 修改 `extension.ts` 中的 `listFromAllFiles()` 函数：标签排序模式全局按 displayText 排序

## 7. 显示文本唯一性校验

- [x] 7.1 在 `Controller.addBookmark()` 中添加唯一性校验：遍历所有 controller 检查 displayText 是否重复
- [x] 7.2 在 `Controller.updateLabel()` 中添加唯一性校验（排除自身）
- [x] 7.3 实现冲突时的错误返回机制（Promise reject 或返回错误码）
- [x] 7.4 在 `extension.ts` 的 `toggle()`/`toggleLabeled()`/`askForBookmarkLabel()` 中处理校验失败，显示警告弹窗
- [x] 7.5 无标签书签重复时只警告不阻止（特殊处理）

## 8. 导出适配

- [x] 8.1 修改 `src/commands/export.ts` 中的 `collectBookmarks()` 排序逻辑：遵循当前排序模式

## 9. 测试

- [x] 9.1 更新 `src/test/unit/sort.test.ts`：将 `sortBookmarksByLabel()` 的测试预期从 `< >` 运算符行为调整为 `localeCompare` 行为（数字感知、重音忽略、中文拼音等）
- [x] 9.2 编写 `getDisplayText()` 的单元测试
- [x] 9.3 编写 `compareByDisplayText()` 的单元测试
- [x] 9.4 编写 `getSortLocale()` 的单元测试
- [x] 9.5 编写 `getGlobalSortedBookmarks()` 的单元测试
- [x] 9.6 编写标签排序模式下导航的集成测试
- [x] 9.7 编写显示文本唯一性校验的集成测试
- [x] 9.8 验证行号排序模式下 100% 行为不变（回归测试）
