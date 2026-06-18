## ADDED Requirements

### Requirement: Display text uniqueness validation on bookmark creation

When creating or editing a bookmark (`toggle`, `toggleLabeled`, `addBookmark#sideBar`, `editLabel`), the system SHALL validate that the resulting display text is unique among all bookmarks across all files and workspace folders.

**Display text calculation**:
- If the bookmark has a non-empty `label`, display text = the label value
- If the bookmark has an empty label, display text = the trimmed line content from the editor

**Uniqueness comparison**:
- The uniqueness check SHALL use `localeCompare(undefined, { sensitivity: 'base' })` for comparison
- This means `"TODO"` and `"todo"` are considered duplicate (case-insensitive)
- This means `"é"` and `"e"` are considered duplicate (accent-insensitive)
- This is consistent with the sorting strategy — if two display texts would sort as equal, they SHALL be considered duplicates

**Uniqueness scope**: All bookmarks in all controllers (all workspace folders).

**Validation timing**: Validation SHALL occur after the user confirms the label input (for labeled bookmarks) or immediately (for unlabeled bookmarks based on line content).

#### Scenario: Reject duplicate labeled bookmark
- **WHEN** a bookmark with label `"01 funcA"` already exists
- **AND** user tries to create another bookmark with label `"01 funcA"`
- **THEN** the system SHALL show a warning message: `"A bookmark with the same display text already exists"`
- **AND** the new bookmark SHALL NOT be created

#### Scenario: Allow creation with unique label
- **WHEN** no bookmark has label `"API endpoint"`
- **AND** user creates a bookmark with label `"API endpoint"`
- **THEN** the bookmark SHALL be created successfully

#### Scenario: Allow editing label to a unique value
- **WHEN** a bookmark with label `"TODO"` exists
- **AND** user edits another bookmark's label from `"FIXME"` to `"TODO"`
- **THEN** the system SHALL show a warning: `"A bookmark with the same display text already exists"`
- **AND** the edit SHALL NOT be applied

#### Scenario: Unlabeled bookmarks with duplicate line content
- **WHEN** two bookmarks exist on lines with identical content `"const x = 1"` (both unlabeled)
- **AND** both have no labels
- **THEN** the first one SHALL be created without warning
- **AND** when creating the second, the system SHALL show a warning: `"Another bookmark at this line content already exists. Consider adding a label to distinguish them."`
- **BUT** the second bookmark SHALL still be created (warning only, not blocking)

#### Scenario: Duplicate check after label edit
- **WHEN** editing a bookmark's label via `editLabel` command
- **AND** the new label matches an existing bookmark's display text
- **THEN** the system SHALL reject the edit and show a warning

#### Scenario: Case-insensitive duplicate detection
- **WHEN** a bookmark with label `"TODO"` already exists
- **AND** user tries to create a bookmark with label `"todo"`
- **THEN** the system SHALL treat these as duplicates (case-insensitive via `sensitivity: 'base'`)
- **AND** show a warning and reject the creation

#### Scenario: Accent-insensitive duplicate detection
- **WHEN** a bookmark with label `"café"` already exists
- **AND** user tries to create a bookmark with label `"cafe"`
- **THEN** the system SHALL treat these as duplicates (accent-insensitive via `sensitivity: 'base'`)
- **AND** show a warning and reject the creation
