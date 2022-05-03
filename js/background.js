// "browser" namespace in Firefox, "chrome" namespace in Chrome
if (typeof globalThis.browser === "undefined") {
	globalThis.browser = chrome;
}

const annotationsEndpoint = "https://storage.googleapis.com/biggest_bucket/annotations";

function getVideoPath(videoId) {
	// Temporary fix for a GCS mistake
	let annotationFileDirectory = videoId[0];

	if (annotationFileDirectory === "-") {
		annotationFileDirectory = "-/ar-"
	}

	return `${annotationsEndpoint}/${annotationFileDirectory}/${videoId.substring(0, 3)}/${videoId}.xml.gz`;
}

function fetchVideoAnnotations(videoId) {
	if (videoId.length !== 11) { 
		throw new Error("Video ID must be exactly 11 characters long"); 
	}

	const requestUrl = getVideoPath(videoId);
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


async function getAnnotationsFromCache(videoId) {
	return new Promise(async (resolve, reject) => {
		const result = await browser.storage.local.get(videoId);

		if (result[videoId]) {
			resolve(result[videoId]);
		}
		else {
			reject("video not in cache");
		}
	});
}

async function handleVideoUpdate(tabId, videoId) {
	browser.tabs.sendMessage(tabId, {
		type: "remove_renderer_annotations"
	});

	const cachedAnnotations = await getAnnotationsFromCache(videoId)
		.catch(e => void e);

	if (cachedAnnotations) {
		console.info(`Received annotations for ${videoId} from cache..`);

		browser.tabs.sendMessage(tabId, {
			type: "annotations_received",
			xml: cachedAnnotations
		});
	}
	else {
		console.info(`Fetching from server.. (${videoId})`);

		fetchVideoAnnotations(videoId).then(async (xml) => {
			console.info(`Received annotations for ${videoId} from server..`);

			await browser.storage.local.set({ [videoId]: xml });

			browser.tabs.sendMessage(tabId, {
				type: "annotations_received",
				xml
			});
		}).catch(e => {
			console.info(`Annotation data is unavailable for this video (${videoId})\n (${e})`);
			browser.tabs.sendMessage(tabId, {
				type: "annotations_unavailable"
			});
		});
	}
}

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
	if (changeInfo.status === "complete") {	
		browser.tabs.sendMessage(tabId, {
			type: "video_change"
		}, videoId => {
			if (videoId) {
				handleVideoUpdate(tabId, videoId);
			}
		});
	}

	return true;
});
