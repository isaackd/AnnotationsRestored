const annotationParser = new AnnotationParser();
let renderer;

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
				if (!rendererUpdateIntervalId) {
					rendererUpdateIntervalId = setInterval(() => {
						const videoTime = player.getCurrentTime();
						const updateEvent = new CustomEvent("__annotations_restored_renderer_update", {
							detail: {videoTime}
						});
						window.dispatchEvent(updateEvent)
					}, data.updateInterval);
				}
			}
			else if (type === "__annotations_restored_renderer_stop") {
				if (rendererUpdateIntervalId) {
					clearInterval(rendererUpdateIntervalId);
					rendererUpdateIntervalId = null;
				}
			}
			else if (type === "__annotations_restored_renderer_seek_to") {
				player.seekTo(data.seconds);
				const videoTime = player.getCurrentTime();
				const updateEvent = new CustomEvent("__annotations_restored_renderer_update", {
					detail: {videoTime}
				});
				window.dispatchEvent(updateEvent)
			}
			else if (type === "__annotations_restored_renderer_urlclick") {
				window.location.href = data.url;
			}
		});
	`;

	const script = document.createElement("script");
	script.setAttribute("type", "text/javascript");
	script.textContent = code;
	document.body.append(script);
}

setupExternalScript();

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
	console.log(request);
	if (request.type === "check_description_for_annotations") {
		getAnnotationsFromDescription().then(annotations => {
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
			const annotationDom = annotationParser.xmlToDom(annotationData);
			const annotationElements = annotationDom.getElementsByTagName("annotation");

			const annotations = annotationParser.parseYoutubeFormat(annotationElements);

			const videoContainer = document.getElementById("movie_player");
			renderer = new AnnotationRenderer(annotations, videoContainer, "https://www.youtube.com/");
			renderer.start();
		}
	}
	else if (request.type === "annotations_unavailable") {
		console.info("Annotation data for this video is unavailable");
	}
	// popup annotation loading
	else if (request.type === "popup_load_youtube" && request.data) {
		console.info("loading youtube data");
		const annotationDom = annotationParser.xmlToDom(request.data);
		const annotationElements = annotationDom.getElementsByTagName("annotation");
		const annotations = annotationParser.parseYoutubeFormat(annotationElements);
		if (!renderer) {
			const videoContainer = document.getElementById("movie_player");
			renderer = new AnnotationRenderer(annotations, videoContainer, "https://www.youtube.com/");
			renderer.start();
		}
		else {
			renderer.changeAnnotationData(annotations);
		}
	}
	else if (request.type === "popup_load_converted" && request.data) {
		console.info("loading converted data");
		const annotations = annotationParser.deserializeAnnotationList(request.data);
		if (!renderer) {
			const videoContainer = document.getElementById("movie_player");
			renderer = new AnnotationRenderer(annotations, videoContainer, "https://www.youtube.com/");
			renderer.start();
		}
		else {
			renderer.changeAnnotationData(annotations);
		}
	}
});