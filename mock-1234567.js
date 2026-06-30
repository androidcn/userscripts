const mockResponse = {
    status: 200,
    headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*" // 应对可能的 RN 跨域校验
    },
    // 直接返回空 JSON，如果 App 报错，可以尝试改为 JSON.stringify({"code": 0, "data": {}})
    body: JSON.stringify({}) 
};

// 强行阻断请求并返回伪造数据
$done({ response: mockResponse });
