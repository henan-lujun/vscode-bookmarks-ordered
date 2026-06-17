//
// Unit Test Runner
// ---------------
// 单元测试的入口配置文件。
// 通过 `mocha --file out/test/unit/index.js` 在测试运行前加载。
// 可用于注册全局 hooks、测试 helper 等公共配置。
//
// 注意：此文件通过 mocha --file 参数加载，它会在所有测试文件之前执行，
// 但不会自动运行测试。测试文件通过 glob 模式发现。
//

/**
 * 在所有测试执行之前运行的全局 setup。
 * 可以在这里注册测试 helper、mock 等。
 */
export const mochaGlobalSetup = function (): void {
    // 全局测试配置可以在这里添加
    // 例如: 注册自定义 assert 方法、mock 全局对象等
};

/**
 * 在所有测试执行之后运行的全局 teardown。
 */
export const mochaGlobalTeardown = function (): void {
    // 清理全局资源
};
