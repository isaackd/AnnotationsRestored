const annotationParser = new AnnotationParser();

function setupExternalScript() {
	// must be done this way due to the "x-ray" mode the content scripts are run in
	// removing all non-standard functions from the player, such as getCurrentTime :/
	const code = `
		const player = document.getElementById("movie_player");
		let rendererUpdateIntervalId;

		window.addEventListener("message", e => {
			const data = e.data;
			const type = data.type;
			if (type === "__annotations_restored_renderer_start") {
				rendererUpdateIntervalId = setInterval(() => {
					const videoTime = player.getCurrentTime();
					const updateEvent = new CustomEvent("__annotations_restored_renderer_update", {
						detail: {videoTime}
					});
					window.dispatchEvent(updateEvent)
				}, data.updateInterval);
			}
			else if (type === "__annotations_restored_renderer_stop") {
				clearInterval(rendererUpdateIntervalId);
				rendererUpdateIntervalId = null;
			}
			else if (type === "__annotations_restored_renderer_seek_to") {
				player.seekTo(data.seconds);
				const videoTime = player.getCurrentTime();
				const updateEvent = new CustomEvent("__annotations_restored_renderer_update", {
					detail: {videoTime}
				});
				window.dispatchEvent(updateEvent)
			}
		});
	`;

	const script = document.createElement("script");
	script.setAttribute("type", "text/javascript");
	script.textContent = code;
	document.body.append(script);
}

function getAnnotationsFromDescription() {
	return new Promise((resolve, reject) => {
		let intervalCount = 0;
		const interval = setInterval(() => {
			if (intervalCount === 6) {
				reject();
				clearInterval(inverval);
				return;
			} 
			const descriptionContainer = document.getElementById("description");
			if (!descriptionContainer) return false;
			const formattedString = descriptionContainer.getElementsByTagName("yt-formatted-string")[0];
			if (!formattedString) return false;
			const description = formattedString.textContent;

			if (description) {
				const startFlag = description.indexOf("[ar_start]");
				const endFlag = description.indexOf("[ar_end]");

				if (startFlag === -1 || endFlag === -1) {
					reject("Couldn\'t find either a start or end flag");
					clearInterval(interval);
					return;
				}

				try {
					const startFlagText = "[ar_start]";
					const serializedAnnotations = description.substring(startFlag + startFlagText.length, endFlag);
					const annotations = annotationParser.deserializeAnnotationList(serializedAnnotations);

					resolve(annotations);
					clearInterval(interval);
					return;
				}
				catch(e) {
					reject("Possibly malformed annotation data");
					clearInterval(interval);
					return;
				}
			}
			else {
				reject("No description text");
				clearInterval(interval);
				return;
			}
			intervalCount++;
		}, 500);
	});
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.type === "check_description_for_annotations") {
		getAnnotationsFromDescription().then(annotations => {
			setupExternalScript();
			const videoContainer = document.getElementById("movie_player");
			renderer = new AnnotationRenderer(annotations, videoContainer, videoContainer);
			renderer.start();
			console.info("Found annotation data in description");
			sendResponse({requestAnnotations: false});
		}).catch(e => {
			console.info("No annotation data in description, checking server...");
			sendResponse({requestAnnotations: true});
		});
		return true;
	}
	else if (request.type === "annotations_received") {
		const annotationData = request.xml;
		if (annotationData) {
			console.info("Received annotation data from server");
			setupExternalScript();
			const annotationDom = annotationParser.xmlToDom(annotationData);
			const annotationElements = annotationDom.getElementsByTagName("annotation");

			const annotations = annotationParser.parseYoutubeFormat(annotationElements);

			const videoContainer = document.getElementById("movie_player");
			renderer = new AnnotationRenderer(annotations, videoContainer, videoContainer);
			renderer.start();
		}
	}
	else if (request.type === "annotations_unavailable") {
		console.info("Annotation data for this video is unavailable");
	}
});
