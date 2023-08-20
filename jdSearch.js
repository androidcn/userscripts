const url =$request.url;
if(!$response.body)
{
 $done({});
}
var body = JSON.parse($response.body); 
if (url.includes("search"))
{
var allSections =  body.wareInfo;
 allSections = allSections.filter((item) => { 
         return !item.hasOwnProperty("adIconDescribe");
 }) 
 body.wareInfo = allSections; 
 //body.data.feedsCount = allSections.length; 
 body = JSON.stringify(body); 
 console.log("已删除JD搜索广告");  
$done({ 
     body 
 });
}
else{
 $done({});
}
 
