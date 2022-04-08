const annotationsEndpoint = "https://storage.googleapis.com/biggest_bucket/annotations";

function fetchVideoAnnotations(videoId) {
	if (videoId.length !== 11) { 
		throw new Error("Video ID must be exactly 11 characters long"); 
	}

	// Temporary fix for a GCS mistake
	let annotationFileDirectory = videoId[0];

	if (annotationFileDirectory === "-") {
		annotationFileDirectory = "-/ar-"
	}

	const requestUrl = `${annotationsEndpoint}/${annotationFileDirectory}/${videoId.substring(0, 3)}/${videoId}.xml.gz`;
	console.info(`Retrieving annotations for '${videoId}' from '${requestUrl}'`);

	return new Promise((resolve, reject) => {
		fetch(requestUrl)
		.then(response => {
			if (response.ok) {
				response.text()
					.then(resolve)
					.catch(reject);
			}
			else {
				reject("annotations_unavailable"); 
			}
		}).catch(reject);
	});
}

function handleVideoUpdate(tabId, videoId) {
	chrome.tabs.sendMessage(tabId, {
		type: "remove_renderer_annotations"
	});

	console.info(`Fetching from server.. (${videoId})`);
	fetchVideoAnnotations(videoId).then(text => {
		console.info(`Received annotations for ${videoId} from server..`);
		chrome.tabs.sendMessage(tabId, {
			type: "annotations_received",
			xml: text
		});
	}).catch(e => {
		console.info(`Annotation data is unavailable for this video (${videoId})\n (${e})`);
		chrome.tabs.sendMessage(tabId, {
			type: "annotations_unavailable"
		});
	});
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
	if (changeInfo.status === "complete") {	
		chrome.tabs.sendMessage(tabId, {
			type: "video_change"
		}, videoId => {
			if (videoId) {
				handleVideoUpdate(tabId, videoId);
			}
		});
	}

	return true;
});
