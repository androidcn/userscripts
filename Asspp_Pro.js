const url = $request.url;
if(!$response.body) {
    $done({});
}
var body = JSON.parse($response.body);
// 遍历对象并将 external_identifier 转换为字符串
body = body.map(item => {
    return {
        created_at: String(item.created_at),
        external_identifier: String(item.external_identifier), // 将 int 转换为 string
        bundle_version: String(item.bundle_version)
    };
});
body = JSON.stringify(body);
console.log("已处理");
$done({ 
    body 
});
