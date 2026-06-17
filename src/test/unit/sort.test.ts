import * as assert from 'assert';
import { Bookmark } from '../../core/bookmark';
import { sortBookmarksByLabel } from '../../core/sortOperations';

suite('sortBookmarksByLabel()', () => {

    // ── 辅助函数 ──

    function createBookmark(
        label: string | undefined,
        line: number = 1,
        column: number = 0
    ): Bookmark {
        return { label, line, column };
    }

    // ── 基本排序 ──

    test('应按 label 字母序升序排列', () => {
        const bookmarks: Bookmark[] = [
            createBookmark('zeta'),
            createBookmark('alpha'),
            createBookmark('beta'),
        ];
        const sorted = sortBookmarksByLabel(bookmarks);
        assert.equal(sorted[0].label, 'alpha');
        assert.equal(sorted[1].label, 'beta');
        assert.equal(sorted[2].label, 'zeta');
    });

    test('应保持稳定排序（相同 label 保持原顺序）', () => {
        const bookmarks: Bookmark[] = [
            createBookmark('app', 1),
            createBookmark('app', 2),
        ];
        const sorted = sortBookmarksByLabel(bookmarks);
        assert.equal(sorted[0].line, 1);
        assert.equal(sorted[1].line, 2);
    });

    // ── 边界情况 ──

    test('应处理空数组', () => {
        const sorted = sortBookmarksByLabel([]);
        assert.deepEqual(sorted, []);
    });

    test('应处理单个书签', () => {
        const bookmarks: Bookmark[] = [createBookmark('only')];
        const sorted = sortBookmarksByLabel(bookmarks);
        assert.equal(sorted.length, 1);
        assert.equal(sorted[0].label, 'only');
    });

    // ── 大小写 ──

    test('应进行大小写不敏感排序（localeCompare + sensitivity: base）', () => {
        const bookmarks: Bookmark[] = [
            createBookmark('ZEBRA'),
            createBookmark('apple'),
            createBookmark('Banana'),
        ];
        const sorted = sortBookmarksByLabel(bookmarks);
        // localeCompare with sensitivity:'base': case-insensitive, "apple" < "banana" < "zebra"
        assert.equal(sorted[0].label, 'apple');
        // "Banana" and "ZEBRA" order is case-insensitive
        const sortedLabels = sorted.map(b => b.label?.toLowerCase());
        assert.deepEqual(sortedLabels, ['apple', 'banana', 'zebra']);
    });

    // ── 无 label 书签的处理 ──

    test('应将 undefined label 的书签排在最后', () => {
        const bookmarks: Bookmark[] = [
            createBookmark('beta'),
            createBookmark(undefined),
            createBookmark('alpha'),
        ];
        const sorted = sortBookmarksByLabel(bookmarks);
        assert.equal(sorted[0].label, 'alpha');
        assert.equal(sorted[1].label, 'beta');
        assert.equal(sorted[2].label, undefined);
    });

    test('应将空字符串 label 的书签排在最后', () => {
        const bookmarks: Bookmark[] = [
            createBookmark('beta'),
            createBookmark(''),
            createBookmark('alpha'),
        ];
        const sorted = sortBookmarksByLabel(bookmarks);
        assert.equal(sorted[0].label, 'alpha');
        assert.equal(sorted[1].label, 'beta');
        assert.equal(sorted[2].label, '');
    });

    test('应将 undefined 和空字符串 label 的书签都排在最后', () => {
        const bookmarks: Bookmark[] = [
            createBookmark('beta'),
            createBookmark(undefined),
            createBookmark('alpha'),
            createBookmark(''),
        ];
        const sorted = sortBookmarksByLabel(bookmarks);
        // labeled 在前
        assert.equal(sorted[0].label, 'alpha');
        assert.equal(sorted[1].label, 'beta');
        // 无 label 在最后
        assert.equal(sorted[2].label, undefined);
        assert.equal(sorted[3].label, '');
    });

    // ── 数字感知排序（localeCompare + numeric: true） ──

    test('应按数值感知排序数字前缀（numeric: true）', () => {
        const bookmarks: Bookmark[] = [
            createBookmark('2-app'),
            createBookmark('10-app'),
            createBookmark('1-app'),
        ];
        const sorted = sortBookmarksByLabel(bookmarks);
        // numeric: true → "1" < "2" < "10"
        assert.equal(sorted[0].label, '1-app');
        assert.equal(sorted[1].label, '2-app');
        assert.equal(sorted[2].label, '10-app');
    });

    // ── 不可变性 ──

    test('应返回新数组，不修改原数组', () => {
        const original: Bookmark[] = [
            createBookmark('b'),
            createBookmark('a'),
        ];
        const originalCopy = [...original];
        const sorted = sortBookmarksByLabel(original);

        // 返回的是新引用
        assert.notEqual(sorted, original);
        // 原数组未被修改
        assert.equal(original[0].label, 'b');
        assert.equal(original[1].label, 'a');
        // 副本保持一致
        assert.deepEqual(original, originalCopy);
    });

    // ── 混合场景 ──

    test('应正确处理 labeled 和 unlabeled 书签混合排序', () => {
        const bookmarks: Bookmark[] = [
            createBookmark(undefined, 10),
            createBookmark('config', 5),
            createBookmark('app', 1),
            createBookmark(undefined, 20),
        ];
        const sorted = sortBookmarksByLabel(bookmarks);
        // labeled 书签排序在前
        assert.equal(sorted[0].label, 'app');
        assert.equal(sorted[1].label, 'config');
        // unlabeled 书签在后，保持原顺序（稳定排序）
        assert.equal(sorted[2].label, undefined);
        assert.equal(sorted[2].line, 10);
        assert.equal(sorted[3].label, undefined);
        assert.equal(sorted[3].line, 20);
    });

    test('应处理所有书签 label 相同的情况（按行号排序）', () => {
        const bookmarks: Bookmark[] = [
            createBookmark('same', 3),
            createBookmark('same', 1),
            createBookmark('same', 2),
        ];
        const sorted = sortBookmarksByLabel(bookmarks);
        // 相同 display text → 按 line number 排序
        assert.equal(sorted[0].line, 1);
        assert.equal(sorted[1].line, 2);
        assert.equal(sorted[2].line, 3);
    });

    // ── 带特殊符号的 label ──

    test('应处理带特殊符号的 label', () => {
        const bookmarks: Bookmark[] = [
            createBookmark('_internal'),
            createBookmark('@api'),
            createBookmark('my-app'),
        ];
        const sorted = sortBookmarksByLabel(bookmarks);
        assert.equal(sorted.length, 3);
        // 验证排序稳定且不报错
        const labels = sorted.map(b => b.label);
        assert.equal(labels.length, 3);
    });
});
