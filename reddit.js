let modified;
let body;
try {
  body = JSON.parse($response.body.replace(/\"isNsfw\"/gi, '"_isNsfw"'));
  if (body?.data?.subredditInfoByName?.elements?.edges) {
    body.data.subredditInfoByName.elements.edges =
      body.data.subredditInfoByName.elements.edges.filter(
        i => i?.node?.__typename !== 'AdPost'
      );
    modified = true;
  } else if (body?.data?.home?.elements?.edges) {
    body.data.home.elements.edges = body.data.home.elements.edges.filter(
      i => i?.node?.__typename !== 'AdPost'
    );
    modified = true;
  } else if (body?.data?.homeV3?.elements?.edges) {
    body.data.homeV3.elements.edges = body.data.homeV3.elements.edges.filter(
      i => !i?.node?.cells?.some(j => j?.__typename === 'AdMetadataCell')
    );
    modified = true;
  } else if ($response.body.includes('"isNsfw"')) {
    modified = true;
  }
} catch (e) {
  console.log(e)
} finally {
  $done(modified ? { body: JSON.stringify(body) } : {});
}
