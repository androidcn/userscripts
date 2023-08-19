var body = JSON.parse($response.body); 
 var allSections =  body.data.itemArrays;
 allSections = allSections.filter((item) => { 
         return !item.utLogMap.hasOwnProperty("ad_slot");
 }) 
 body.data.itemArrays = allSections; 
 //body.data.feedsCount = allSections.length; 
 body = JSON.stringify(body); 
 console.log("已删除TB搜索广告"); 
 $done({ 
     body 
 });
