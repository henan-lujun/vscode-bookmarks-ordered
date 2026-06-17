/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';

const timeout = async (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

suite('Extension Test Suite', () => {
    let extension: vscode.Extension<any>;
    vscode.window.showInformationMessage('Start all tests.');

    suiteSetup(() => {
        extension = vscode.extensions.getExtension('alefragnani.Bookmarks') as vscode.Extension<any>;
    });

    test('Sample test', () => {
        assert.equal(-1, [ 1, 2, 3 ].indexOf(5));
        assert.equal(-1, [ 1, 2, 3 ].indexOf(0));
    });

    test('Activation test', async () => {
        await extension.activate();
        assert.equal(extension.isActive, true);
    });

    test('Extension loads in VSCode and is active', async () => {
        await timeout(1500);
        assert.equal(extension.isActive, true);
    });

    // ── Regression tests for sort-by-label (task 9.8) ──

    test('Sort by line command is registered', async () => {
        await extension.activate();
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('bookmarks.sortByLine'), 'bookmarks.sortByLine command should be registered');
    });

    test('Sort by label command is registered', async () => {
        await extension.activate();
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('bookmarks.sortByLabel'), 'bookmarks.sortByLabel command should be registered');
    });

    test('Existing jumpToNext command is registered (regression)', async () => {
        await extension.activate();
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('bookmarks.jumpToNext'), 'bookmarks.jumpToNext command should still be registered');
    });

    test('Existing list command is registered (regression)', async () => {
        await extension.activate();
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('bookmarks.list'), 'bookmarks.list command should still be registered');
    });

    test('Existing listFromAllFiles command is registered (regression)', async () => {
        await extension.activate();
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('bookmarks.listFromAllFiles'), 'bookmarks.listFromAllFiles command should still be registered');
    });
});
