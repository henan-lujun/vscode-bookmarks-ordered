/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Bookmark } from "./bookmark";

/**
 * Get the display text for a bookmark.
 * - If the bookmark has a non-empty label, returns the label
 * - Otherwise returns the line content (trimmed), or empty string
 */
export function getDisplayText(bookmark: Bookmark, lineContent?: string): string {
    if (bookmark.label && bookmark.label.trim() !== "") {
        return bookmark.label;
    }
    return lineContent?.trim() || "";
}

/**
 * Compare two display texts using localeCompare with numeric: true and sensitivity: 'base'.
 * @param locale - BCP 47 locale string or undefined for system default
 */
export function compareByDisplayText(a: string, b: string, locale?: string): number {
    return a.localeCompare(b, locale, {
        numeric: true,
        sensitivity: 'base',
    });
}

/**
 * Check if a bookmark has a label (non-empty).
 */
export function hasLabel(bookmark: Bookmark): boolean {
    return !!(bookmark.label && bookmark.label.trim() !== "");
}

/**
 * Sort bookmarks by label (display text) using localeCompare.
 *
 * Sorting rules:
 * - Labeled bookmarks before unlabeled
 * - Within labeled: localeCompare(numeric, sensitivity: 'base')
 * - Within unlabeled: localeCompare(numeric, sensitivity: 'base')
 * - Same display text: secondary sort by line number
 *
 * @param bookmarks - the bookmarks to sort
 * @param locale - BCP 47 locale string or undefined for system default
 * @param lineContents - optional map of line number → content for unlabeled bookmarks
 */
export function sortBookmarksByLabel(
    bookmarks: Bookmark[],
    locale?: string,
    lineContents?: Map<number, string>
): Bookmark[] {
    return [...bookmarks].sort((a, b) => {
        const aLabeled = hasLabel(a);
        const bLabeled = hasLabel(b);

        // Labeled before unlabeled
        if (aLabeled && !bLabeled) { return -1; }
        if (!aLabeled && bLabeled) { return 1; }

        // Both labeled or both unlabeled — use localeCompare
        const displayA = aLabeled ? (a.label || "") : (lineContents?.get(a.line) || "");
        const displayB = bLabeled ? (b.label || "") : (lineContents?.get(b.line) || "");

        const cmp = compareByDisplayText(displayA, displayB, locale);
        if (cmp !== 0) { return cmp; }

        // Same display text — secondary sort by line number
        return a.line - b.line;
    });
}
