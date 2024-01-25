/**************************************
@Name：达乐美披萨 优惠券抽奖
@Author：Sliverkiss
@Date：2023-10-18 08:43:44

2024.01.25 
- 更新活动接口，修复抽奖提示不匹配的问题


脚本兼容：Surge、QuantumultX、Loon、Shadowrocket、Node.js
只测试过loon和青龙，其它环境请自行尝试

使用方法：
青龙：
1.登录后抓包 https://game.dominos.com.cn/loong/game/gameDone接口的body,填写到dlm_data,多账号用 @ 分割
2.可选推送：将bark的key填写到bark_key，不填默认使用青龙自带的推送

Surge、QuantumultX、Loon、Shadowrocket: 
1.将获取Cookie脚本保存到本地
2.打开达乐美披萨公众号->优惠｜咨询->有奖游戏->手动完成一次游戏，若提示获取Cookie成功则可以使用该脚本
3.关闭获取ck脚本，避免产生不必要的mitm。

[Script]
cron "30 10 * * *" script-path=https://gist.githubusercontent.com/Sliverkiss/6b4da0d367d13790a9fd1d928c82bdf8/raw/dlm.js,timeout=300, tag=达乐美披萨
http-request ^https:\/\/game\.dominos\.com\.cn\/loong\/game\/gameDone script-path=https://gist.githubusercontent.com/Sliverkiss/6b4da0d367d13790a9fd1d928c82bdf8/raw/dlm.js,requires-body=true, timeout=10, tag=达乐美披萨获取token
[MITM]
hostname =game.dominos.com.cn

====================================
⚠️【免责声明】
------------------------------------------
1、此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
2、由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
3、请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
4、此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
5、本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
6、如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
7、所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明。本人保留随时更改或补充此声明的权利。一旦您使用或复制了此脚本，即视为您已接受此免责声明。
******************************************/

// env.js 全局
const $ = new Env("🍕达乐美披萨");
const ckName = "dlm_data";
$.host="loong";//活动名称
$.gameDate="2024.01.22-2024.02.29";
//-------------------- 一般不动变量区域 -------------------------------------
const SakuraUtils = creatUtils();
const Notify = 1;//0为关闭通知,1为打开通知,默认为1
const notify = $.isNode() ? require('./sendNotify') : '';
let envSplitor = ["@"]; //多账号分隔符
let userCookie = ($.isNode() ? process.env[ckName] : $.getdata(ckName)) || '';
let userList = [];
let userIdx = 0;
let userCount = 0;
// 为通知准备的空数组
$.notifyMsg = [];
//bark推送
$.barkKey = ($.isNode() ? process.env["bark_key"] : $.getdata("bark_key")) || '';
//---------------------- 自定义变量区域 -----------------------------------
const giftName = {
    "001": '一等奖 免费海参鲍鱼大虾手拍披萨券',
    "002": '二等奖 半价海参鲍鱼大虾手拍披萨券',
    "003": '三等奖 免费滋牟牟考牛肉券',
    "004": '四等奖 免费任意口味一对烤翅券',
    "005": "五等奖 免费招牌蛋挞券",
}
//脚本入口函数main()
async function main() {
    console.log('\n================== 任务 ==================\n');
    let taskall = [];
    for (let user of userList) {
        if (user.ckStatus) {
            //ck未过期，开始执行任务
            // DoubleLog(`🔷账号${user.index} >> Start work`)
            console.log(`随机延迟${user.getRandomTime()}ms`);
            taskall.push(await user.todoList());
            await $.wait(user.getRandomTime());
        } else {
            //将ck过期消息存入消息数组
            $.notifyMsg.push(`❌账号${user.index} >> Check ck error!`)
        }
    }
    await Promise.all(taskall);
}

class UserInfo {
    constructor(str) {
        this.index = ++userIdx;
        this.ckInfo = str.split("&");
        this.openid = this.ckInfo[0];;
        this.body = str;
        this.ckStatus = true;
        this.drawStatus = true;
        this.sharingStatus = true;
        this.headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.42(0x18002a2c) NetType/WIFI Language/zh_CN",
            "Content-Type": "application/x-www-form-urlencoded"
        };
    }
    getRandomTime() {
        return randomInt(1000, 3000)
    }

    //抽奖函数
    async gameDone() {
        try {
            const options = {
                //签到任务调用签到接口
                url: `https://game.dominos.com.cn/${$.host}/game/gameDone`,
                //请求头, 所有接口通用
                headers: this.headers,
                body: this.body
            };
            //post方法
            let result = await httpRequest(options);
            console.log(result)
            if (result?.statusCode == 0) {
                //obj.error是0代表完成
                console.log(`✅抽奖成功!获得${result?.content?.name},剩余分享次数:${result?.extra?.sharingNum},当前奖券总数:${result?.extra?.doneNum}`);
            } else {
                console.log(`❌${result?.errorMessage}`)
                this.drawStatus = false;
            }
        } catch (e) {
            console.log(e);
        }
    }
    //分享函数
    async sharingDone() {
        try {
            const options = {
                //签到任务调用签到接口
                url: `https://game.dominos.com.cn/${$.host}/game/sharingDone`,
                //请求头, 所有接口通用
                headers: this.headers,
                body: `${this.openid}&from=1&target=0`
            };
            //post方法
            let result = await httpRequest(options);
            console.log(result)
            if (result?.statusCode == 0) {
                //obj.error是0代表完成
                console.log(`✅分享成功,抽奖次数+${result?.content?.gameNum}`);
            } else {
                console.log(`❌${result?.errorMessage}`)
                this.sharingStatus = false;
            }
        } catch (e) {
            console.log(e);
        }
    }
    //任务列表
    async todoList() {
        //执行分享，将抽奖次数最大化
        do{
            await this.sharingDone();
            await $.wait(this.getRandomTime());
        }while(this.sharingStatus);
        //循环抽奖，直到使用全部次数
        do{
            await this.gameDone();
            await $.wait(this.getRandomTime());
        }while(this.drawStatus);
        //最后打印奖品信息
        await this.point();
    }
    //查询用户信息
    async point() {
        try {
            const options = {
                //签到任务调用签到接口
                url: `https://game.dominos.com.cn/${$.host}/game/myPrize?${this.openid}&pageSize=1000&pageNum=1`,
                //请求头, 所有接口通用
                headers: this.headers,
            };
            //post方法
            let result = await httpRequest(options);
            if (result?.statusCode == 0) {
                //obj.error是0代表完成
                let total = getTotal(result?.content);
                DoubleLog(`账号[${SakuraUtils.phone_num(result?.extra)}] 奖品:`)
                for (let item of total) {
                    DoubleLog(`${giftName[item.name]}x${item.value}`)   
                }
            } else {
                console.log(`❌${result?.errorMessage}`)
                //console.log(result);
            }
        } catch (e) {
            console.log(e);
        }
    }
}
//获取Cookie
async function getCookie() {
    if ($request && $request.method != 'OPTIONS') {
        const tokenValue = $request.body;
        if (tokenValue) {
            $.setdata(tokenValue, ckName);
            $.msg($.name, "", `获取签到Cookie成功🎉\n${tokenValue}`);
        } else {
            $.msg($.name, "", "错误获取签到Cookie失败");
        }
    }
}


//主程序执行入口
!(async () => {
    //没有设置变量,执行Cookie获取
    if (typeof $request != "undefined") {
        await getCookie();
        return;
    }
    //未检测到ck，退出
    if (!(await checkEnv())) { throw new Error(`❌未检测到ck，请添加环境变量`) };
    if (userList.length > 0) {
        await main();
    }
    if ($.barkKey) { //如果已填写Bark Key
        await BarkNotify($, $.barkKey, $.name, $.notifyMsg.join('\n')); //推送Bark通知
    };
})()
    .catch((e) => $.notifyMsg.push(e.message || e))//捕获登录函数等抛出的异常, 并把原因添加到全局变量(通知)
    .finally(async () => {
        await SendMsg($.notifyMsg.join('\n'))//带上总结推送通知
        $.done(); //调用Surge、QX内部特有的函数, 用于退出脚本执行
    });

/** --------------------------------辅助函数区域------------------------------------------- */

// 双平台log输出
function DoubleLog(data) {
    if ($.isNode()) {
        if (data) {
            console.log(`${data}`);
            $.notifyMsg.push(`${data}`);
        }
    } else {
        console.log(`${data}`);
        $.notifyMsg.push(`${data}`);
    }
}

//统计奖品数量
function getTotal(data) {
    let dataContainer = {}; //存分组的
    data.map((item) => {
        //对数据进行遍历
        dataContainer[item.id] = dataContainer[item.id] || [];
        dataContainer[item.id].push(item);
    });
    // console.log(dataContainer);
    let total = [];
    let dataName = Object.keys(dataContainer);
    dataName.map((nameItem) => {
        let count = 0;
        dataContainer[nameItem].map((item) => {
            count++;
        });
        total.push({ name: nameItem, value: count });
    });
    return total;
}

//检查变量
async function checkEnv() {
    if (userCookie) {
        // console.log(userCookie);
        let e = envSplitor[0];
        for (let o of envSplitor)
            if (userCookie.indexOf(o) > -1) {
                e = o;
                break;
            }
        for (let n of userCookie.split(e)) n && userList.push(new UserInfo(n));
        userCount = userList.length;
    } else {
        console.log("未找到CK");
        return;
    }
    return console.log(`共找到${userCount}个账号`), true;//true == !0
}

/**
 * 随机整数生成
 */
function randomInt(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}
// 发送消息
async function SendMsg(message) {
    if (!message) return;
    if (Notify > 0) {
        if ($.isNode()) {
            await notify.sendNotify($.name, message)
        } else {
            $.msg($.name, `活动时间:${$.gameDate}`,message)
        }
    } else {
        console.log(message)
    }
}

/** ---------------------------------固定不动区域----------------------------------------- */
// prettier-ignore
//Sakura工具包
function creatUtils(){return new(class{MD5_Encrypt(a){function b(a,b){return(a<<b)|(a>>>(32-b));}function c(a,b){var c,d,e,f,g;return((e=2147483648&a),(f=2147483648&b),(c=1073741824&a),(d=1073741824&b),(g=(1073741823&a)+(1073741823&b)),c&d?2147483648^g^e^f:c|d?1073741824&g?3221225472^g^e^f:1073741824^g^e^f:g^e^f);}function d(a,b,c){return(a&b)|(~a&c);}function e(a,b,c){return(a&c)|(b&~c);}function f(a,b,c){return a^b^c;}function g(a,b,c){return b^(a|~c);}function h(a,e,f,g,h,i,j){return(a=c(a,c(c(d(e,f,g),h),j))),c(b(a,i),e);}function i(a,d,f,g,h,i,j){return(a=c(a,c(c(e(d,f,g),h),j))),c(b(a,i),d);}function j(a,d,e,g,h,i,j){return(a=c(a,c(c(f(d,e,g),h),j))),c(b(a,i),d);}function k(a,d,e,f,h,i,j){return(a=c(a,c(c(g(d,e,f),h),j))),c(b(a,i),d);}function l(a){for(var b,c=a.length,d=c+8,e=(d-(d%64))/64,f=16*(e+1),g=new Array(f-1),h=0,i=0;c>i;)(b=(i-(i%4))/4),(h=(i%4)*8),(g[b]=g[b]|(a.charCodeAt(i)<<h)),i++;return((b=(i-(i%4))/4),(h=(i%4)*8),(g[b]=g[b]|(128<<h)),(g[f-2]=c<<3),(g[f-1]=c>>>29),g);}function m(a){var b,c,d="",e="";for(c=0;3>=c;c++)(b=(a>>>(8*c))&255),(e="0"+b.toString(16)),(d+=e.substr(e.length-2,2));return d;}function n(a){a=a.replace(/\r\n/g,"\n");for(var b="",c=0;c<a.length;c++){var d=a.charCodeAt(c);128>d?(b+=String.fromCharCode(d)):d>127&&2048>d?((b+=String.fromCharCode((d>>6)|192)),(b+=String.fromCharCode((63&d)|128))):((b+=String.fromCharCode((d>>12)|224)),(b+=String.fromCharCode(((d>>6)&63)|128)),(b+=String.fromCharCode((63&d)|128)));}return b;}var o,p,q,r,s,t,u,v,w,x=[],y=7,z=12,A=17,B=22,C=5,D=9,E=14,F=20,G=4,H=11,I=16,J=23,K=6,L=10,M=15,N=21;for(a=n(a),x=l(a),t=1732584193,u=4023233417,v=2562383102,w=271733878,o=0;o<x.length;o+=16)(p=t),(q=u),(r=v),(s=w),(t=h(t,u,v,w,x[o+0],y,3614090360)),(w=h(w,t,u,v,x[o+1],z,3905402710)),(v=h(v,w,t,u,x[o+2],A,606105819)),(u=h(u,v,w,t,x[o+3],B,3250441966)),(t=h(t,u,v,w,x[o+4],y,4118548399)),(w=h(w,t,u,v,x[o+5],z,1200080426)),(v=h(v,w,t,u,x[o+6],A,2821735955)),(u=h(u,v,w,t,x[o+7],B,4249261313)),(t=h(t,u,v,w,x[o+8],y,1770035416)),(w=h(w,t,u,v,x[o+9],z,2336552879)),(v=h(v,w,t,u,x[o+10],A,4294925233)),(u=h(u,v,w,t,x[o+11],B,2304563134)),(t=h(t,u,v,w,x[o+12],y,1804603682)),(w=h(w,t,u,v,x[o+13],z,4254626195)),(v=h(v,w,t,u,x[o+14],A,2792965006)),(u=h(u,v,w,t,x[o+15],B,1236535329)),(t=i(t,u,v,w,x[o+1],C,4129170786)),(w=i(w,t,u,v,x[o+6],D,3225465664)),(v=i(v,w,t,u,x[o+11],E,643717713)),(u=i(u,v,w,t,x[o+0],F,3921069994)),(t=i(t,u,v,w,x[o+5],C,3593408605)),(w=i(w,t,u,v,x[o+10],D,38016083)),(v=i(v,w,t,u,x[o+15],E,3634488961)),(u=i(u,v,w,t,x[o+4],F,3889429448)),(t=i(t,u,v,w,x[o+9],C,568446438)),(w=i(w,t,u,v,x[o+14],D,3275163606)),(v=i(v,w,t,u,x[o+3],E,4107603335)),(u=i(u,v,w,t,x[o+8],F,1163531501)),(t=i(t,u,v,w,x[o+13],C,2850285829)),(w=i(w,t,u,v,x[o+2],D,4243563512)),(v=i(v,w,t,u,x[o+7],E,1735328473)),(u=i(u,v,w,t,x[o+12],F,2368359562)),(t=j(t,u,v,w,x[o+5],G,4294588738)),(w=j(w,t,u,v,x[o+8],H,2272392833)),(v=j(v,w,t,u,x[o+11],I,1839030562)),(u=j(u,v,w,t,x[o+14],J,4259657740)),(t=j(t,u,v,w,x[o+1],G,2763975236)),(w=j(w,t,u,v,x[o+4],H,1272893353)),(v=j(v,w,t,u,x[o+7],I,4139469664)),(u=j(u,v,w,t,x[o+10],J,3200236656)),(t=j(t,u,v,w,x[o+13],G,681279174)),(w=j(w,t,u,v,x[o+0],H,3936430074)),(v=j(v,w,t,u,x[o+3],I,3572445317)),(u=j(u,v,w,t,x[o+6],J,76029189)),(t=j(t,u,v,w,x[o+9],G,3654602809)),(w=j(w,t,u,v,x[o+12],H,3873151461)),(v=j(v,w,t,u,x[o+15],I,530742520)),(u=j(u,v,w,t,x[o+2],J,3299628645)),(t=k(t,u,v,w,x[o+0],K,4096336452)),(w=k(w,t,u,v,x[o+7],L,1126891415)),(v=k(v,w,t,u,x[o+14],M,2878612391)),(u=k(u,v,w,t,x[o+5],N,4237533241)),(t=k(t,u,v,w,x[o+12],K,1700485571)),(w=k(w,t,u,v,x[o+3],L,2399980690)),(v=k(v,w,t,u,x[o+10],M,4293915773)),(u=k(u,v,w,t,x[o+1],N,2240044497)),(t=k(t,u,v,w,x[o+8],K,1873313359)),(w=k(w,t,u,v,x[o+15],L,4264355552)),(v=k(v,w,t,u,x[o+6],M,2734768916)),(u=k(u,v,w,t,x[o+13],N,1309151649)),(t=k(t,u,v,w,x[o+4],K,4149444226)),(w=k(w,t,u,v,x[o+11],L,3174756917)),(v=k(v,w,t,u,x[o+2],M,718787259)),(u=k(u,v,w,t,x[o+9],N,3951481745)),(t=c(t,p)),(u=c(u,q)),(v=c(v,r)),(w=c(w,s));var O=m(t)+m(u)+m(v)+m(w);return O.toLowerCase();}
SHA1_Encrypt(s){var data=new Uint8Array(encodeUTF8(s))
var i,j,t;var l=((data.length+8)>>>6<<4)+16,s=new Uint8Array(l<<2);s.set(new Uint8Array(data.buffer)),s=new Uint32Array(s.buffer);for(t=new DataView(s.buffer),i=0;i<l;i++)s[i]=t.getUint32(i<<2);s[data.length>>2]|=0x80<<(24-(data.length&3)*8);s[l-1]=data.length<<3;var w=[],f=[function(){return m[1]&m[2]|~m[1]&m[3];},function(){return m[1]^m[2]^m[3];},function(){return m[1]&m[2]|m[1]&m[3]|m[2]&m[3];},function(){return m[1]^m[2]^m[3];}],rol=function(n,c){return n<<c|n>>>(32-c);},k=[1518500249,1859775393,-1894007588,-899497514],m=[1732584193,-271733879,null,null,-1009589776];m[2]=~m[0],m[3]=~m[1];for(i=0;i<s.length;i+=16){var o=m.slice(0);for(j=0;j<80;j++)
w[j]=j<16?s[i+j]:rol(w[j-3]^w[j-8]^w[j-14]^w[j-16],1),t=rol(m[0],5)+f[j/20|0]()+m[4]+w[j]+k[j/20|0]|0,m[1]=rol(m[1],30),m.pop(),m.unshift(t);for(j=0;j<5;j++)m[j]=m[j]+o[j]|0;};t=new DataView(new Uint32Array(m).buffer);for(var i=0;i<5;i++)m[i]=t.getUint32(i<<2);var hex=Array.prototype.map.call(new Uint8Array(new Uint32Array(m).buffer),function(e){return(e<16?"0":"")+e.toString(16);}).join("");return hex;}
encodeUTF8(s){var i,r=[],c,x;for(i=0;i<s.length;i++)
if((c=s.charCodeAt(i))<0x80)r.push(c);else if(c<0x800)r.push(0xC0+(c>>6&0x1F),0x80+(c&0x3F));else{if((x=c^0xD800)>>10==0)
c=(x<<10)+(s.charCodeAt(++i)^0xDC00)+0x10000,r.push(0xF0+(c>>18&0x7),0x80+(c>>12&0x3F));else r.push(0xE0+(c>>12&0xF));r.push(0x80+(c>>6&0x3F),0x80+(c&0x3F));};return r;}
randomMac(){return"XX:XX:XX:XX:XX:XX".replace(/X/g,function(){return"0123456789ABCDEF".charAt(Math.floor(Math.random()*16))});}
guid(){function S4(){return(((1+Math.random())*0x10000)|0).toString(16).substring(1);}
return(S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());}
phone_num(phone_num){if(phone_num.length==11){let data=phone_num.replace(/(\d{3})\d{4}(\d{4})/,"$1****$2");return data;}else{return phone_num;}}
randomszdx(e){e=e||32;var t="QWERTYUIOPASDFGHJKLZXCVBNM1234567890",a=t.length,n="";for(i=0;i<e;i++)n+=t.charAt(Math.floor(Math.random()*a));return n;}
randomszxx(e){e=e||32;var t="qwertyuioplkjhgfdsazxcvbnm1234567890",a=t.length,n="";for(i=0;i<e;i++)n+=t.charAt(Math.floor(Math.random()*a));return n;}
randomInt(min,max){return Math.round(Math.random()*(max-min)+min);}
ts13(){return Math.round(new Date().getTime()).toString();}
ts10(){return Math.round(new Date().getTime()/1000).toString();}
tmtoDate(time=+new Date()){if(time.toString().length==13){var date=new Date(time+8*3600*1000);return date.toJSON().substr(0,19).replace("T"," ");}else if(time.toString().length==10){time=time*1000;var date=new Date(time+8*3600*1000);return date.toJSON().substr(0,19).replace("T"," ");}}
local_hours(){let myDate=new Date();let h=myDate.getHours();return h;}
local_minutes(){let myDate=new Date();let m=myDate.getMinutes();return m;}
local_year(){let myDate=new Date();y=myDate.getFullYear();return y;}
local_month(){let myDate=new Date();let m=myDate.getMonth();return m;}
local_month_two(){let myDate=new Date();let m=myDate.getMonth();if(m.toString().length==1){m=`0${m}`;}
return m;}
local_day(){let myDate=new Date();let d=myDate.getDate();return d;}
local_day_two(){let myDate=new Date();let d=myDate.getDate();if(d.toString().length==1){d=`0${d}`;}
return d;}
base64_encode(data){let a=Buffer.from(data,'utf-8').toString('base64')
return a}
base64_decode(data){let a=Buffer.from(data,'base64').toString('utf8')
return a}})();}
//请求函数函数二次封装
function httpRequest(options, method) { typeof (method) === 'undefined' ? ('body' in options ? method = 'post' : method = 'get') : method = method; return new Promise((resolve) => { $[method](options, (err, resp, data) => { try { if (err) { console.log(`${method}请求失败`); $.logErr(err) } else { if (data) { typeof JSON.parse(data) == 'object' ? data = JSON.parse(data) : data = data; resolve(data) } else { console.log(`请求api返回数据为空，请检查自身原因`) } } } catch (e) { $.logErr(e, resp) } finally { resolve() } }) }) }
//Bark APP notify
async function BarkNotify(c, k, t, b) { for (let i = 0; i < 3; i++) { console.log(`🔷Bark notify >> Start push (${i + 1})`); const s = await new Promise((n) => { c.post({ url: 'https://api.day.app/push', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t, body: b, device_key: k, ext_params: { group: t } }) }, (e, r, d) => r && r.status == 200 ? n(1) : n(d || e)) }); if (s === 1) { console.log('✅Push success!'); break } else { console.log(`❌Push failed! >> ${s.message || s}`) } } };
//From chavyleung's Env.js
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, a) => { s.call(this, t, (t, s, r) => { t ? a(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const a = this.getdata(t); if (a) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, a) => e(a)) }) } runScript(t, e) { return new Promise(s => { let a = this.getdata("@chavy_boxjs_userCfgs.httpapi"); a = a ? a.replace(/\n/g, "").trim() : a; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [i, o] = a.split("@"), n = { url: `http://${o}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": i, Accept: "*/*" }, timeout: r }; this.post(n, (t, e, a) => s(a)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), a = !s && this.fs.existsSync(e); if (!s && !a) return {}; { const a = s ? t : e; try { return JSON.parse(this.fs.readFileSync(a)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), a = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : a ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const a = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of a) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, a) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[a + 1]) >> 0 == +e[a + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, a] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, a, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, a, r] = /^@(.*?)\.(.*?)$/.exec(e), i = this.getval(a), o = a ? "null" === i ? null : i || "{}" : "{}"; try { const e = JSON.parse(o); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), a) } catch (e) { const i = {}; this.lodash_set(i, r, t), s = this.setval(JSON.stringify(i), a) } } else s = this.setval(t, e); return s } getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return this.data = this.loaddata(), this.data[t]; default: return this.data && this.data[t] || null } } setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0; default: return this.data && this.data[e] || null } } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), t.params && (t.url += "?" + this.queryStr(t.params)), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, a) => { !t && s && (s.body = a, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, a) }); break; case "Quantumult X": this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: a, headers: r, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: a, headers: r, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: a, statusCode: r, headers: i, rawBody: o } = t, n = s.decode(o, this.encoding); e(null, { status: a, statusCode: r, headers: i, rawBody: o, body: n }, n) }, t => { const { message: a, response: r } = t; e(a, r, r && s.decode(r.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, a) => { !t && s && (s.body = a, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, a) }); break; case "Quantumult X": t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: a, headers: r, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: a, headers: r, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let a = require("iconv-lite"); this.initGotEnv(t); const { url: r, ...i } = t; this.got[s](r, i).then(t => { const { statusCode: s, statusCode: r, headers: i, rawBody: o } = t, n = a.decode(o, this.encoding); e(null, { status: s, statusCode: r, headers: i, rawBody: o, body: n }, n) }, t => { const { message: s, response: r } = t; e(s, r, r && a.decode(r.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let a = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in a) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? a[e] : ("00" + a[e]).substr(("" + a[e]).length))); return t } queryStr(t) { let e = ""; for (const s in t) { let a = t[s]; null != a && "" !== a && ("object" == typeof a && (a = JSON.stringify(a)), e += `${s}=${a}&`) } return e = e.substring(0, e.length - 1), e } msg(e = t, s = "", a = "", r) { const i = t => { switch (typeof t) { case void 0: return t; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: t }; case "Loon": case "Shadowrocket": return t; case "Quantumult X": return { "open-url": t }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } case "Loon": { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } case "Quantumult X": { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, a = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": a } } case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(e, s, a, i(r)); break; case "Quantumult X": $notify(e, s, a, i(r)); break; case "Node.js": }if (!this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), a && t.push(a), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `❗️${this.name}, 错误!`, t); break; case "Node.js": this.log("", `❗️${this.name}, 错误!`, t.stack) } } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; switch (this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(t); break; case "Node.js": process.exit(1) } } }(t, e) }