var body = JSON.parse($response.body); 
 var allSections =  body.data.resultList;
 allSections = allSections.filter((item) => { 
         return item.data.item.main.clickParam.args.item_type == "goods"; 
 }) 
 body.data.resultList = allSections; 
 //body.data.feedsCount = allSections.length; 
 body = JSON.stringify(body); 
 console.log("已删除咸鱼搜索广告"); 
 $done({ 
     body 
 });
