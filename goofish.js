var body = JSON.parse($response.body);
var allSections =  body.data.sections;


//console.log("广告前"+allSections.length);
allSections = allSections.filter((item) => {
	return item.data.bizType == "item";
})
body.data.sections = allSections;
body.data.feedsCount = allSections.length;
//console.log("广告后"+body.data.feedsCount);


/*
allSections.forEach(sec => {
    if (sec.data.bizType == "AD") {
        
        sec.data.adExpoUrl = "";
        sec.data.hotPoint.text = "不看广告";
        sec.data.mainPicInfo.url = "";
        sec.data.targetUrl = "";
        sec.data.user.avatar = "";
        sec.data.user.userNick = "";
        sec.data.priceInfo.priceUnitInfos.forEach(fuckInfo =>{
            fuckInfo.text = "";
        });
        sec.data.richTitle.forEach(fuckrich =>{
            fuckrich.data.text ="";
        });
        if(sec.data.fishTags.r2 != null){
            sec.data.fishTags.r2.tagList[0].data.content = "";
        }
        if(sec.data.fishTags.r3 != null){
            sec.data.fishTags.r3.tagList[0].data.content = "";
        }
        if(sec.data.fishTags.r4 != null){
            sec.data.fishTags.r4.tagList[0].data.content = "";

        }
     
        sec.data.titleSpan.content = "";
        //console.log("处理广告内容");
    }else if(sec.data.bizType == "homepage"){
        //console.log(sec.data.bizType);
        
        if (sec.data.datalist != null){
             
        sec.data.datalist.forEach(fuckdatalist =>{
            fuckdatalist.adIfsUrl = "";
            fuckdatalist.img = "";
            fuckdatalist.targetUrl = "";
        });
        
        }
       
        sec.data.avatar = "";
        sec.data.hasVideo = "false";
        sec.data.imageHeight = "0";
        sec.data.imageWidth = "0";
        sec.data.mainImage = "";
        sec.data.targetUrl = "";
        sec.data.title = "不看广告";
        //sec.data.titleSpan.content = "";
        //console.log("处理主页内容");
    }
});
*/
body = JSON.stringify(body);
console.log("已删除咸鱼广告");
$done({
    body
});
