# 番茄小说 Loon 插件

插件地址：https://raw.githubusercontent.com/IMAiCool/Loon/main/FanQieNovel.plugin

## 安装

1. 在 Loon 的「插件」中通过 URL 添加上述插件地址并启用；如已安装旧版同名插件，更新它，避免两版规则同时运行。
2. 打开 Loon 的复写和 MitM，安装并在 iOS 设置中信任 Loon 证书。插件通过绝对 Raw URL 加载本仓库的 `fanqie_ad_filter.js`，不需要单独安装脚本。
3. 默认开启基础去广告、内嵌垃圾清理、营销垃圾清理和广告追踪清理；加强广告拦截默认关闭。登录异常时先关闭「内嵌垃圾清理」，重新打开番茄验证；再按需要检查基础规则。
4. 修改仓库文件后在 Loon 更新插件和脚本缓存；如果规则未生效，检查 Loon 的日志及 MitM 状态。

## 文件

- `FanQieNovel.plugin`：Loon 插件和开关。
- `fanqie_ad_filter.js`：JSON 清理脚本，插件内以绝对 URL 引用。

脚本对登录等 URL 原样放行，并跳过普通 JSON 中常见的账户身份字段。广告和营销字段仍会在其他 JSON 中处理；接口结构未经实际响应逐一验证，不能保证所有功能或登录状态都不受影响。遇到异常先关闭对应开关。

## 抖音 Loon 广告净化插件

插件地址：https://raw.githubusercontent.com/IMAiCool/Loon/main/Douyin/Douyin_Clean.plugin

在 Loon 插件页面通过上述 URL 安装并启用，开启 MitM 并信任证书。推荐、关注、同城、搜索可单独开关；开屏实验功能默认关闭。使用说明见 [`Douyin/README.md`](Douyin/README.md)。
