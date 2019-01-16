// testing endpoint until an actual api with all the annotation data is available
const annotationsEndpoint = "http://localhost:3000/annotations?id=";

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === "complete" && tab.url.startsWith("https://www.youtube.com/watch?")) {
		const url = new URL(tab.url);
		const videoId = url.searchParams.get("v");
		if (videoId) {

			chrome.tabs.sendMessage(tab.id, {type: "check_description_for_annotations"}, response => {
				if (response.requestAnnotations) {
					const requestUrl = annotationsEndpoint + videoId;
					console.log(`Loading annotations for '${videoId}' from '${requestUrl}'`);

					fetch(requestUrl)
					.then(response => response.text())
					.then(text => {
						if (text) {
							chrome.tabs.sendMessage(tab.id, {type: "annotations_received", xml: text});
						}
						else {
							chrome.tabs.sendMessage(tab.id, {type: "annotations_unavailable"});
						}
					}).catch(e => {
						throw e;
					});
				}
				else {
					console.info("Annotations found in description..");
				}
			});
		}
	}
});