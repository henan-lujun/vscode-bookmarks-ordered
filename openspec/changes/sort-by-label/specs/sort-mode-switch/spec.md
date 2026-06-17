## ADDED Requirements

### Requirement: Sort mode configuration

The system SHALL provide a persistent configuration `bookmarks.sortBy` that controls the active sort mode.

| Value | Behavior |
|-------|----------|
| `"line"` | Sort bookmarks by line number (existing behavior) |
| `"label"` | Sort bookmarks by display text (new behavior) |

The configuration SHALL default to `"line"` to preserve existing behavior for all users.

#### Scenario: Default sort mode
- **WHEN** a user installs the extension for the first time
- **THEN** `bookmarks.sortBy` SHALL default to `"line"`

#### Scenario: Sort mode persists across sessions
- **WHEN** user changes sort mode to `"label"`
- **AND** restarts VS Code
- **THEN** the sort mode SHALL remain `"label"`

### Requirement: Sort mode switching UI

The system SHALL provide multiple ways for the user to switch sort modes:

1. **Command Palette**: `Bookmarks: Sort by Line` and `Bookmarks: Sort by Label` commands
2. **Sidebar title menu**: Options in the existing "View & Sort" submenu
3. **Sidebar title bar**: Toggle button (similar to existing Tree/List toggle)

The currently active sort mode SHALL be visually indicated (e.g., the button appears highlighted or checked).

#### Scenario: Switch sort mode via command
- **WHEN** user runs command `Bookmarks: Sort by Label`
- **THEN** the sort mode SHALL change to `"label"`
- **AND** the sidebar SHALL refresh to display bookmarks sorted by label

#### Scenario: Switch sort mode via View & Sort menu
- **WHEN** user opens the "View & Sort" submenu and selects "Sort by Label"
- **THEN** the sort mode SHALL change to `"label"`

#### Scenario: Sidebar button reflects active mode
- **WHEN** sort mode is `"line"`
- **THEN** the "Sort by Line" button SHALL appear enabled/active
- **AND** the "Sort by Label" button SHALL appear inactive

### Requirement: Sort mode changes refresh sidebar immediately

The system SHALL refresh the sidebar TreeView immediately when the sort mode changes, without requiring a manual refresh.

#### Scenario: Immediate sidebar refresh on sort mode change
- **WHEN** user switches from "line" to "label" sort mode
- **THEN** the sidebar SHALL update within the same VS Code event cycle

### Requirement: Line sort mode preserves exact existing behavior

When sort mode is `"line"`, ALL aspects of the extension SHALL behave exactly as before this change:
- Sidebar display (Tree and List views)
- QuickPick list display (list, listFromAllFiles)
- Navigation (jumpToNext, jumpToPrevious)
- Export sorting

#### Scenario: Line sort mode is backward compatible
- **WHEN** sort mode is `"line"`
- **THEN** `listFromAllFiles` SHALL sort active file first, then same workspace files, then other workspace files (existing behavior)
- **AND** `jumpToNext` SHALL search current file first, then cross-file (existing behavior)

### Requirement: Sort locale configuration

The system SHALL provide a configuration `bookmarks.sortByLocale` that controls the locale used for display text sorting.

| Value | Behavior |
|-------|----------|
| `""` (empty) | Use system default locale (recommended, auto-adapts to user's OS language) |
| `"zh-CN"` | Sort Chinese characters by pinyin |
| `"en"` | Sort by English alphabet |
| `"ja"` | Sort Japanese by kana order |

The configuration SHALL default to `""` (empty string) to automatically adapt to the user's operating system locale.

#### Scenario: Default sort locale
- **WHEN** user installs the extension
- **THEN** `bookmarks.sortByLocale` SHALL default to `""` (system default)

#### Scenario: Custom locale overrides system default
- **WHEN** user sets `bookmarks.sortByLocale` to `"zh-CN"`
- **THEN** display text sorting SHALL use Chinese pinyin ordering regardless of the system's OS language

### Requirement: Configuration changes refresh sorting immediately

The system SHALL refresh the sidebar and all cached sorted views when `bookmarks.sortBy` or `bookmarks.sortByLocale` configuration changes, similar to how `gutterIconFillColor` changes trigger decoration refresh.

#### Scenario: Sort locale change triggers refresh
- **WHEN** user changes `bookmarks.sortByLocale` in settings
- **THEN** the sidebar SHALL immediately refresh with the new locale's sort order
- **AND** no VS Code restart or manual refresh SHALL be required
