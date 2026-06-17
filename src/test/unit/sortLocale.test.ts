import * as assert from 'assert';
import { compareByDisplayText } from '../../core/sortOperations';

suite('getSortLocale()', () => {

    test('locale=undefined 时使用系统默认 locale 排序', () => {
        // Without explicit locale, uses system default
        assert.ok(compareByDisplayText('alpha', 'beta') < 0);
    });

    test('locale="zh-CN" 时中文按拼音排序', () => {
        // In zh-CN locale: 功(gōng) < 接(jiē) < 配(pèi) < 数(shù)
        const labels = ['数据', '接口', '配置', '功能'];
        labels.sort((a, b) => compareByDisplayText(a, b, 'zh-CN'));
        assert.equal(labels[0], '功能');
        assert.equal(labels[1], '接口');
        assert.equal(labels[2], '配置');
        assert.equal(labels[3], '数据');
    });

    test('locale="en" 时英文按字母序', () => {
        const labels = ['Zebra', 'apple', 'Banana'];
        labels.sort((a, b) => compareByDisplayText(a, b, 'en'));
        // case+accent insensitive: apple < banana < zebra
        assert.equal(labels[0].toLowerCase(), 'apple');
        assert.equal(labels[1].toLowerCase(), 'banana');
        assert.equal(labels[2].toLowerCase(), 'zebra');
    });

    test('不同 locale 不影响数值感知', () => {
        // numeric: true works regardless of locale
        assert.ok(compareByDisplayText('2', '10', 'en') < 0);
        assert.ok(compareByDisplayText('2', '10', 'zh-CN') < 0);
        assert.ok(compareByDisplayText('2', '10', 'ja') < 0);
    });
});
