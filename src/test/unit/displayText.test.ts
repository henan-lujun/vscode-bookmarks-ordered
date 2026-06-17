import * as assert from 'assert';
import { Bookmark } from '../../core/bookmark';
import { getDisplayText, compareByDisplayText } from '../../core/sortOperations';

suite('getDisplayText()', () => {

    test('应返回 label（非空）', () => {
        const bm: Bookmark = { line: 1, column: 0, label: 'my label' };
        assert.equal(getDisplayText(bm, 'const x = 1'), 'my label');
    });

    test('应返回 label（即使有 lineContent）', () => {
        const bm: Bookmark = { line: 1, column: 0, label: 'important' };
        assert.equal(getDisplayText(bm, 'function foo()'), 'important');
    });

    test('应返回 line content（无 label）', () => {
        const bm: Bookmark = { line: 1, column: 0, label: '' };
        assert.equal(getDisplayText(bm, 'function foo()'), 'function foo()');
    });

    test('应返回 line content（undefined label）', () => {
        const bm: Bookmark = { line: 1, column: 0 };
        assert.equal(getDisplayText(bm, 'const bar = 1'), 'const bar = 1');
    });

    test('应返回空字符串（无 label 且无 lineContent）', () => {
        const bm: Bookmark = { line: 1, column: 0, label: '' };
        assert.equal(getDisplayText(bm, undefined), '');
    });

    test('应 trim line content 的空白', () => {
        const bm: Bookmark = { line: 1, column: 0, label: '' };
        assert.equal(getDisplayText(bm, '   hello world   '), 'hello world');
    });

    test('应返回空字符串（label 为空且 lineContent 为纯空白）', () => {
        const bm: Bookmark = { line: 1, column: 0, label: '' };
        assert.equal(getDisplayText(bm, '     '), '');
    });
});

suite('compareByDisplayText()', () => {

    test('应返回负数（a < b）', () => {
        assert.ok(compareByDisplayText('alpha', 'beta') < 0);
    });

    test('应返回正数（a > b）', () => {
        assert.ok(compareByDisplayText('zeta', 'alpha') > 0);
    });

    test('应返回 0（相等）', () => {
        assert.equal(compareByDisplayText('same', 'same'), 0);
    });

    test('应大小写不敏感（sensitivity: base）', () => {
        assert.equal(compareByDisplayText('ABC', 'abc'), 0);
        assert.equal(compareByDisplayText('Todo', 'TODO'), 0);
    });

    test('应忽略重音（sensitivity: base）', () => {
        assert.equal(compareByDisplayText('café', 'cafe'), 0);
    });

    test('应数值感知排序（numeric: true）', () => {
        assert.ok(compareByDisplayText('1-func', '2-func') < 0);
        assert.ok(compareByDisplayText('2-func', '10-func') < 0);
        assert.ok(compareByDisplayText('01', '02') < 0);
    });

    test('应正确处理空字符串', () => {
        // empty string should sort before non-empty
        assert.ok(compareByDisplayText('', 'a') < 0);
        assert.equal(compareByDisplayText('', ''), 0);
    });
});
