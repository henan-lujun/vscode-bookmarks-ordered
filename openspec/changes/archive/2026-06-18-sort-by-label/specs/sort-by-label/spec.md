## ADDED Requirements

### Requirement: Bookmark sorting by display text

The system SHALL support sorting bookmarks by their display text, in addition to the existing line-number-based sorting.

**Display text rules**:
- If a bookmark has a non-empty `label`, the display text SHALL be the label value
- If a bookmark has an empty or undefined `label`, the display text SHALL be the line content (trimmed text of the bookmarked line)

**Sorting rules**:
- Sorting SHALL use `String.prototype.localeCompare()` with system default locale
- The localeCompare call SHALL use `{ numeric: true, sensitivity: 'base' }` options
- `numeric: true` ensures numeric prefix ordering: `"01"` < `"02"` < `"10"` < `"100"`
- `sensitivity: 'base'` treats `A` == `a` == `á` (case and accent insensitive)
- The locale SHALL default to the system locale (undefined), but MAY be overridden by the `bookmarks.sortByLocale` configuration
- When system locale is Chinese (`zh-CN`), Chinese characters SHALL be sorted by pinyin
- When system locale is Japanese (`ja`), Japanese characters SHALL be sorted by kana order
- Labeled bookmarks SHALL always be sorted before unlabeled bookmarks (grouped by "has label" first)
- When display texts are equal after localeCompare, line number SHALL be used as the secondary sort key (ascending)

#### Scenario: Sort labeled bookmarks alphabetically
- **WHEN** user has bookmarks with labels `"03 funcC"`, `"01 funcA"`, `"02 funcB"`
- **THEN** they SHALL be sorted as `"01 funcA"`, `"02 funcB"`, `"03 funcC"`

#### Scenario: Numeric prefix sorted correctly
- **WHEN** user has bookmarks with labels `"2 funcB"`, `"10 funcJ"`, `"1 funcA"`
- **THEN** they SHALL be sorted as `"1 funcA"`, `"2 funcB"`, `"10 funcJ"` (numeric-aware, not character order)

#### Scenario: Sort mixed labeled and unlabeled bookmarks
- **WHEN** user has labeled bookmarks (`"API"`, `"DB"`) and unlabeled bookmarks (line content: `function foo`, `const bar`)
- **THEN** labeled bookmarks SHALL be sorted first by their labels, followed by unlabeled bookmarks sorted by line content

#### Scenario: Sort unlabeled bookmarks by line content
- **WHEN** user has two unlabeled bookmarks on lines with content `"function foo()"` and `"const bar = 1"`
- **THEN** they SHALL be sorted as `"const bar = 1"`, `"function foo()"` (alphabetical by line content)

#### Scenario: Chinese characters sorted by pinyin (on zh-CN system)
- **WHEN** system locale is Chinese and user has labels `"功能A"`, `"接口B"`, `"配置D"`, `"数据C"`
- **THEN** they SHALL be sorted as `"功能A"` (gōng), `"接口B"` (jiē), `"配置D"` (pèi), `"数据C"` (shù) — by pinyin order

#### Scenario: Case-insensitive sorting
- **WHEN** user has labels `"ABC"`, `"abc"`, `"Abc"`
- **THEN** they SHALL be sorted as adjacent items (not split by case), and the relative order is implementation-defined

#### Scenario: Labeled bookmarks always before unlabeled
- **WHEN** user has labeled bookmark `"ZZZ"` and unlabeled bookmark `"AAA"` (line content)
- **THEN** `"ZZZ"` (labeled) SHALL appear before `"AAA"` (unlabeled), even though "AAA" < "ZZZ" alphabetically

#### Scenario: Secondary sort by line number
- **WHEN** two bookmarks have the same display text (e.g., both unlabeled with identical line content `"const x = 1"`)
- **THEN** the bookmark on the earlier line SHALL appear first

### Requirement: Global cross-file sorting in List view

When in List view (View As List) and sort mode is "label", the system SHALL display all bookmarks from all files as a single flat list sorted by display text across all files and workspace folders.

#### Scenario: Cross-file global sorting in List view
- **WHEN** user is in List view and sort mode is "label"
- **AND** there are bookmarks: `"01 funcA"` in `src/api.ts` (Ln 10), `"02 funcB"` in `src/utils.ts` (Ln 15), `"03 funcC"` in `src/api.ts` (Ln 30)
- **THEN** the sidebar SHALL display them as a single flat list in order: `"01 funcA"`, `"02 funcB"`, `"03 funcC"`

#### Scenario: Per-file sorting in Tree view
- **WHEN** user is in Tree view and sort mode is "label"
- **THEN** the sidebar SHALL still group bookmarks by file, but within each file group, bookmarks SHALL be sorted by display text

### Requirement: Navigation follows sort order

The system SHALL navigate (jumpToNext/jumpToPrevious) according to the current sort mode's ordering.

#### Scenario: Navigate by label order
- **WHEN** sort mode is "label" and global sorted list is `["01 funcA" (api.ts:10), "02 funcB" (utils.ts:15), "03 funcC" (api.ts:30)]`
- **AND** user executes `jumpToNext` while on `"01 funcA"`
- **THEN** cursor SHALL jump to `"02 funcB"` at `src/utils.ts` line 15

#### Scenario: Navigate previous by label order
- **WHEN** sort mode is "label" and user is on `"03 funcC"` and executes `jumpToPrevious`
- **THEN** cursor SHALL jump to `"02 funcB"`

#### Scenario: Navigate wraps around in label order
- **WHEN** sort mode is "label", `wrapNavigation` is `true`, and user is on the last item `"03 funcC"` and executes `jumpToNext`
- **THEN** cursor SHALL jump to the first item `"01 funcA"`

#### Scenario: Line sort mode navigation unchanged
- **WHEN** sort mode is "line"
- **THEN** navigation SHALL behave exactly as before this change (file-scoped then cross-file)
