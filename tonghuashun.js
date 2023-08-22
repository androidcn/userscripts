const url =$request.url;
if(!$response.body)
{
 $done({});
}
var body = JSON.parse($response.body); 
if (url.includes("recommend"))
{
var allSections =  body.data;
 allSections = allSections.filter((item) => { 
         return item.info.subject != "ad";
 }) 
 body.data = allSections; 
 body.total = allSections.length; 
 body = JSON.stringify(body); 
 console.log("已删除tonghuashun广告");  
$done({ 
     body 
 });
}
else{
 $done({});
}
 
