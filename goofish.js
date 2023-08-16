var body = JSON.parse($response.body);
var allSections =  body.data.sections;
allSections = allSections.filter((item) => {
	return item.data.bizType == "item";
})
body.data.sections = allSections;
body.data.feedsCount = allSections.length;
body = JSON.stringify(body);
console.log("已删除咸鱼广告");
$done({
    body
});
