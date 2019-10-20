const annotationParser = new AnnotationParser();
let renderer;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log(request);
	if (request.type === "check_description_for_annotations") {
		getFirstValidDescriptionAnnotations().then(data => {
			startNewAnnotationRenderer(data.annotations);
			console.info(`Found ${data.type} annotation data in description`);
			sendResponse({
				foundAnnotations: true
			});
		}).catch(e => {
			console.info(e);
			sendResponse({
				foundAnnotations: false
			});
		});
		// return true so chrome knows we're responding asynchronously
		return true;
	} 
	else if (request.type === "annotations_received") {
		const annotationData = request.xml;
		if (annotationData) {
			console.info("Received annotation data from server");
			const annotationDom = annotationParser.xmlToDom(annotationData);
			const annotationElements = annotationDom.getElementsByTagName("annotation");

			const annotations = annotationParser.parseYoutubeAnnotationList(annotationElements);
			startNewAnnotationRenderer(annotations);
		}
	} 
	else if (request.type === "annotations_unavailable") {
		console.info("Annotation data for this video is unavailable");
	} 
	else if (request.type === "remove_renderer_annotations") {
		if (renderer) {
			renderer.stop();
			renderer.removeAnnotationElements();
		}
	}
	// popup annotation loading
	else if (request.type === "popup_load_youtube" && request.data) {
		console.info("loading youtube data");
		const annotationDom = annotationParser.xmlToDom(request.data);
		const annotationElements = annotationDom.getElementsByTagName("annotation");
		const annotations = annotationParser.parseYoutubeAnnotationList(annotationElements);
		if (!renderer) {
			startNewAnnotationRenderer(annotations);
		} 
		else {
			changeAnnotationData(annotations);
		}
	} 
	else if (request.type === "popup_load_converted" && request.data) {
		console.info("loading converted data");
		const annotations = annotationParser.deserializeAnnotationList(request.data);
		if (!renderer) {
			startNewAnnotationRenderer(annotations);
		} 
		else {
			changeAnnotationData(annotations);
		}
	}
});

function startNewAnnotationRenderer(annotations) {
	const videoContainer = document.getElementById("movie_player");
	const player = document.querySelector("video.video-stream.html5-main-video");

	const playerOptions = {
		getVideoTime() {
			return player.currentTime;
		},
		seekTo(seconds) {
			player.currentTime = seconds;
		},
		getOriginalVideoWidth() {
			return player.videoWidth;
		},
		getOriginalVideoHeight() {
			return player.videoHeight;
		}
	};

	renderer = new AnnotationRenderer(annotations, videoContainer, playerOptions, 200);
	renderer.start();
}

window.addEventListener("__ar_annotation_click", e => {
	const url = e.detail.url;
	// redirect to the url
	window.location.href = url;
});

function updateAnnotationSizes(delay = 0) {
	setTimeout(() => {
		if (renderer) {
			renderer.updateAllAnnotationSizes()
		}
	}, delay);
}

window.addEventListener("resize", () => {
	updateAnnotationSizes(250);
	updateAnnotationSizes(1000);
});

function changeAnnotationData(annotations) {
	renderer.stop();
	renderer.removeAnnotationElements();
	renderer.createAnnotationElements(annotations);
	renderer.updateAllAnnotationSizes();
	renderer.update();
	renderer.start();
}