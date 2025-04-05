/**
 * @fileoverview 提取 cloud.189.cn 登录后的 Cookie
 * @supported Surge & Loon
 * @version 1.1
 */

let cookie = $request.headers['Cookie'] || $request.headers['cookie'];

if (cookie) {
  const saved = $persistentStore.write(cookie, "cloud189_cookie");

  if ($httpAPI) {
    // Surge：写入剪贴板
    $httpAPI("POST", "/v1/device/clipboard", { text: cookie }, (resp) => {
      if (saved) {
        $notification.post("cloud.189.cn 登录成功", "", "Cookie 已保存并复制到剪贴板");
      } else {
        $notification.post("Cookie 保存失败", "", "写入本地失败");
      }
    });
  } else {
    // Loon：通知 + 手动复制
    if (saved) {
      $notification.post("cloud.189.cn 登录成功", "", "Cookie 已保存，请手动复制：\n" + cookie);
    } else {
      $notification.post("Cookie 保存失败", "", "写入本地失败");
    }
  }
} else {
  $notification.post("Cookie 获取失败", "", "请求未包含 Cookie 头");
}

$done({});
