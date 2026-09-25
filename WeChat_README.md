# 微信 Loon 插件与 AdGuard Home 白名单

## 安装

基础插件：https://raw.githubusercontent.com/IMAiCool/Loon/main/WeChat_Safety.plugin

扩展插件：https://raw.githubusercontent.com/IMAiCool/Loon/main/WeChat_Compatibility.plugin

Loon → 配置 → 插件 → 添加 URL。先启用基础插件；旧清单中的共用域名在扩展插件中，需要完整旧清单覆盖时同时启用。两个插件独立开关，不需要脚本或安装 MitM 证书。本文件只配置 DIRECT 分流。

## 范围与新增内容

基础插件包含 weixin110.qq.com、旧清单的登录域名 apd-pcdnwxlogin.teg.tencent-cloud.net、wx.tenpay.com，以及 weixin.qq.com、weixin.com、wechat.com、servicewechat.com、wx.qq.com、wxs.qq.com、qlogo.cn、qpic.cn、wx.gtimg.com 后缀。

扩展插件保留旧清单中的 btrace.qq.com、dldir1.qq.com、slife.xy-asia.com、soup.v.qq.com、vweixinf.tc.qq.com、wup.imtt.qq.com、lbs.gtimg.com、vweixinthumb.tc.qq.com、up-hl.3g.qq.com、yun-hl.3g.qq.com，并将 wxapp.tc.qq.com 扩为后缀匹配。

新增社区分类中的 map.qq.com、tenpay.com、wechatpay.com、wechatlegal.net、wechatos.net、weixinbridge.com、weixinsxy.com、iot-tencent.com 后缀。它们是社区 WeChat 分流分类条目，不能据此认定为微信官方安全接口。slife.xy-asia.com 的实际归属和当前必要性未核实，仅在扩展插件保留。

## 边界与冲突处理

- Loon 的 DIRECT 是连接直连策略，不是广告过滤引擎的强制放行。没有使用 AdGuard 的 $important 修饰符。
- 在 Loon 请求日志中确认目标请求实际命中 DIRECT。若命中更早的 REJECT 或其他策略，调整冲突规则的位置或停用该规则；不要假设插件名称或放在列表顶部必然覆盖所有本地规则。
- Loon Rewrite 在分流规则前执行。其他插件的 reject、重定向或响应脚本仍可能影响微信；停用对应的冲突条目。本插件不会修改其他插件或当前配置。
- 若使用 AdGuard Home、私人 DNS 或路由器过滤，还需在那个过滤器中单独放行。上游返回 0.0.0.0、NXDOMAIN 等结果时，DIRECT 不会恢复正确 DNS。
- 若微信已被加入其他插件的 MitM 域名范围，检查并移除不必要的解密匹配；本插件不添加也不自动排除 MitM 主机。
- 域名规则无法覆盖无法识别域名的纯 IP 连接。没有加入整个腾讯 ASN 或 qq.com、tencent.com、gtimg.com 全域直连，以控制影响范围。
- 扩展插件会影响同域名下其他应用与统计请求；开关仅控制本插件，无法取消主配置中已经存在的 DIRECT。
- 不保证解除微信风控、环境异常或账号限制；不会伪造安全检测结果。清单不可能证明覆盖微信所有内部接口。

## 验证方式

开启后检查登录、安全中心、收发消息、图片、小程序、支付页面和语音视频是否正常。排障时记录时间、失败域名、命中规则和连接错误；不要公开 Cookie、Token、支付数据及完整账户请求。只有拿到实际失败域名后，才能继续有依据地补充。

## 来源与验证状态

- Loon 插件：https://nsloon.app/docs/Plugin/
- Loon 复写：https://nsloon.app/docs/Rewrite/
- 社区域名原始清单：https://github.com/blackmatrix7/ios_rule_script/blob/master/rule/Clash/WeChat/WeChat.list
- 制作日期：2026-09-26。核对了规则格式、重复项与旧清单覆盖；未在用户 iPhone 上实测。

## AdGuard Home 使用

基础列表：https://raw.githubusercontent.com/IMAiCool/Loon/main/WeChat_Safety_AdGuard.txt

扩展列表：https://raw.githubusercontent.com/IMAiCool/Loon/main/WeChat_Compatibility_AdGuard.txt

打开列表，将内容粘贴到 AdGuard Home 的「过滤器 → 自定义过滤规则」并应用。基础 12 条、扩展 19 条；需要完整覆盖原清单时使用两份。两种格式作用不同，可同时使用。

- 每条规则均使用 `@@` 放行及 `$important`，提高 AdGuard 规则优先级。
- `@@|domain^$important` 仅匹配该域名；`@@||domain^$important` 同时匹配子域名，与 Loon DOMAIN / DOMAIN-SUFFIX 对应。此列表面向 DNS 过滤，不作为浏览器 URL 过滤列表使用。
- `$important` 不修复上游 DNS 拦截、网络故障、Loon Rewrite 拒绝或微信账号限制；DNS 重写等特殊规则仍需单独检查。
- 在 AdGuard Home 查询日志中确认命中放行规则。已做格式与两种格式域名映射核对，未在你的设备上实测。
- 官方语法：https://adguard-dns.io/kb/general/dns-filtering-syntax/

## 插件图标

两个 Loon 插件均通过 `#!icon` 使用微信图标，基础与扩展由名称区分。图标来自 https://github.com/shindgewongxj/WHATSINStash/blob/main/icon/wechat.png ，需能够访问该远程地址；图标加载失败不影响规则。
