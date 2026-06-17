/**
 * Helper utilities for unit tests.
 *
 * These helpers create minimal mock objects for testing sort-related functions
 * without requiring VS Code API or the full Controller class.
 */

import { Bookmark, BookmarkQuickPickItem } from "../../core/bookmark";
import { File, createFile } from "../../core/file";
import { Controller } from "../../core/controller";

// ---- Interfaces ----

export interface MockBookmarkData {
    line: number;
    column: number;
    label?: string;
}

export interface MockFileData {
    path: string;
    bookmarks: MockBookmarkData[];
}

// ---- Factory Functions ----

/**
 * Create a minimal File object with the given bookmarks.
 */
export function createMockFile(path: string, bookmarks: MockBookmarkData[]): File {
    const file = createFile(path);
    file.bookmarks = bookmarks.map(b => ({
        line: b.line,
        column: b.column,
        label: b.label ?? "",
    }));
    return file;
}

/**
 * Create a Controller with mock files for testing.
 * The Controller constructor is called with `undefined` workspaceFolder
 * to avoid VS Code API dependencies.
 */
export function createMockController(files: MockFileData[]): Controller {
    const ctrl = new Controller(undefined as any);
    for (const f of files) {
        const file = createMockFile(f.path, f.bookmarks);
        ctrl.files.push(file);
    }
    return ctrl;
}

/**
 * Create multiple Controllers (simulating multi-root workspace).
 */
export function createMockControllers(filesets: MockFileData[]): Controller[] {
    return filesets.map(files => createMockController([files]));
}

// ---- SortedBookmarkItem (matching planned interface) ----

export interface SortedBookmarkItem {
    bookmark: Bookmark;
    file: File;
    controller: Controller;
    displayText: string;
    lineContent?: string;
    hasLabel: boolean;
}

/**
 * Create a SortedBookmarkItem from raw data for testing comparison functions.
 */
export function createSortedItem(
    data: {
        line: number;
        column?: number;
        label?: string;
        displayText: string;
        filePath?: string;
    }
): SortedBookmarkItem {
    const file = createFile(data.filePath ?? "test.ts");
    return {
        bookmark: {
            line: data.line,
            column: data.column ?? 0,
            label: data.label ?? "",
        },
        file,
        controller: undefined as any,
        displayText: data.displayText,
        hasLabel: !!(data.label && data.label.trim() !== ""),
    };
}
