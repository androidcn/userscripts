var body = JSON.parse($response.body); 
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
