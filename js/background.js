// testing endpoint until an actual api with all the annotation data is available
const annotationsEndpoint = "https://invidio.us/api/v1/annotations/";

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	// if the user navigates to a new page on youtube
	// youtube dynamically updates page instead of changing paths (usually)
	if (changeInfo.status === "complete" && tab.url.startsWith("https://www.youtube.com/watch?")) {
		const url = new URL(tab.url);
		// extract the videoId from the url
		const videoId = url.searchParams.get("v");
		// clear the renderer of annotations when a new video is played
		chrome.tabs.sendMessage(tab.id, {
			type: "remove_renderer_annotations"
		});

		if (videoId) {
			chrome.tabs.sendMessage(tab.id, {type: "check_description_for_annotations"}, response => {
				if (!response || !response.foundAnnotations) {
					console.log(response);
					const requestUrl = annotationsEndpoint + videoId;
					console.info(`Loading annotations for '${videoId}' from '${requestUrl}'`);

					fetch(requestUrl)
					.then(response => response.text())
					.then(text => {
						if (text) {
							chrome.tabs.sendMessage(tab.id, {
								type: "annotations_received",
								xml: text
							});
						} 
						else {
							// if the id exists in the api, but there is no annotation data
							// the video was probably archived but had no annotations
							console.info("Annotation data is unavailable for this video");
							chrome.tabs.sendMessage(tab.id, {
								type: "annotations_unavailable"
							});
						}
					}).catch(e => {
						console.info("Annotation data is unavailable for this video");
						chrome.tabs.sendMessage(tab.id, {
							type: "annotations_unavailable"
						});
					});
				}
				else {
					console.info("Annotations found in description..");
				}
			})
		};

	}
});
