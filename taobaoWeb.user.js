// ==UserScript==
// @name         淘宝折叠屏强制网页版
// @namespace    @androidcn
// @version      1.0.0
// @author       @androidcn
// @license      MIT
// @description  解决在折叠屏Firefox打开taobao链接时不能完全显示的问题，访问移动版taobao页面时会自动帮你跳转到对应的淘宝网页版本，更加方便查看信息。
// @match        https://h5.m.taobao.com/*
// @grant        none
// @icon         https://img.alicdn.com/tps/i3/TB1eW1eGXXXXXXAXFXXBS8UGFXX-41-22.png

// @downloadURL https://github.com/androidcn/userscripts/raw/main/taobaoWeb.user.js
// @updateURL https://github.com/androidcn/userscripts/raw/main/taobaoWeb.user.js
// ==/UserScript==

(function() {
    'use strict';

    const currentUrl = window.location.href; // get the current URL
    const regex = /https:\/\/h5\.m\.taobao\.com\/awp\/core\/detail\.htm\?.*?id=(\d+).*/; // 
    const match = regex.exec(currentUrl); // 

    if (match !== null) {
        const itemId = match[1]; // get the item ID number from the regex match
        const newUrl = `https://item.taobao.com/item.htm?id=${itemId}`; // create the new Taobao URL
        window.location.href = newUrl; // redirect to the new Taobao URL
    }
})();
