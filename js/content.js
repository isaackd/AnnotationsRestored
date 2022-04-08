let currentVideoId;

// statuses:
//   - no_video
//   - no_annotations
//   - checking_for_annotations
//   - annotations_loaded
let currentStatus = "no_video";

const annotationParser = new AnnotationParser();
let renderer;
let adPlaying = false;


function setCurrentStatus(status, data) {
	currentStatus = status;
	if (!data) {
		data = {};
	}

	chrome.runtime.sendMessage({
		type: "content_status",
		status: currentStatus,
		data,
	}, response => {
		// this prevents errors if the popup isn't open
		void response;
	});
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.type === "video_change") {
		const currentUrl = new URL(document.URL);
		const videoId = currentUrl.searchParams.get("v");

		const isYoutubeWatchUrl = document.URL.startsWith("https://www.youtube.com/watch?");

		if (videoId === currentVideoId) {
			sendResponse(false);
			return;
		}

		if (!videoId || videoId.length !== 11 || !isYoutubeWatchUrl) {
			currentVideoId = "";
			setCurrentStatus("no_video");
			sendResponse(false);
			return;
		}

		currentVideoId = videoId;

		setCurrentStatus("checking_for_annotations");
		sendResponse(videoId);

		if (renderer) {
			renderer.removeAnnotationElements();
			renderer.annotations = [];
		}

	}
	else if (request.type === "annotations_received") {
		const annotationData = request.xml;
		if (annotationData) {
			console.info("Received annotation data from server");

			const annotationDom = annotationParser.xmlToDom(annotationData);
			const annotationElements = annotationDom.getElementsByTagName("annotation");

			const annotations = annotationParser.parseYoutubeAnnotationList(annotationElements);
			startNewAnnotationRenderer(annotations);

			setCurrentStatus("annotations_loaded", {
				videoId: currentVideoId,
				annotations: renderer.annotations.map(an => an.data)
			});
		}
		else {
			setCurrentStatus("no_annotations", {
				videoId: currentVideoId
			});
		}

		sendResponse(false);
	} 
	else if (request.type === "annotations_unavailable") {
		console.info("Annotation data for this video is unavailable");

		setCurrentStatus("no_annotations", {
			videoId: currentVideoId
		});
		sendResponse(false);
	}
	else if (request.type === "get_popup_data") {
		if (renderer) {
			sendResponse({
				type: "content_status",
				status: currentStatus,
				data: {
					videoId: currentVideoId,
					annotations: renderer.annotations.map(an => an.data)
				}
			});
		}
		else {
			let data = currentVideoId ? { videoId: currentVideoId } : {};
			sendResponse({
				type: "content_status",
				status: currentStatus,
				data
			});
		}
	}
	else if (request.type === "remove_renderer_annotations") {
		if (renderer) {
			renderer.stop();
			renderer.removeAnnotationElements();
		}

		sendResponse(false);
	}
	// popup annotation loading
	else if (request.type === "popup_load_youtube" && request.data) {
		console.info("Loading youtube data");
		const annotationDom = annotationParser.xmlToDom(request.data);
		const annotationElements = annotationDom.getElementsByTagName("annotation");
		const annotations = annotationParser.parseYoutubeAnnotationList(annotationElements);
		if (!renderer) {
			startNewAnnotationRenderer(annotations);
		} 
		else {
			changeAnnotationData(annotations);
		}

		sendResponse(false);
	} 
	else if (request.type === "popup_load_converted" && request.data) {
		console.info("Loading converted data");
		const annotations = annotationParser.deserializeAnnotationList(request.data);
		if (!renderer) {
			startNewAnnotationRenderer(annotations);
		} 
		else {
			changeAnnotationData(annotations);
		}

		sendResponse(false);
	}
	else if (request.type === "seek_to") {
		if (renderer) {
			renderer.playerOptions.seekTo(request.seconds);
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

	if (videoContainer.classList.contains("ad-showing")) {
		adPlaying = true;
		renderer.annotationsContainer.style.display = "none";
	}
	else if (!player.classList.contains("ad-showing") && adPlaying) {
		adPlaying = false;
		renderer.annotationsContainer.style.display = "block";
	}

	hideAnnotationsDuringAds(videoContainer);
}

// https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
function hideAnnotationsDuringAds(player) {
	// Select the node that will be observed for mutations
	const targetNode = player;

	// Options for the observer (which mutations to observe)
	const config = { attributes: true, attributeFilter: ["class"]};

	// Callback function to execute when mutations are observed
	const callback = function(mutationsList) {
		for (let mutation of mutationsList) {
			// ad begins playing
			if (player.classList.contains("ad-showing") && !adPlaying) {
				adPlaying = true;
				renderer.annotationsContainer.style.display = "none";
			}
			// ad is done playing
			else if (!player.classList.contains("ad-showing") && adPlaying) {
				adPlaying = false;
				renderer.annotationsContainer.style.display = "block";
			}
		}
	};

	// Create an observer instance linked to the callback function
	const observer = new MutationObserver(callback);

	// Start observing the target node for configured mutations
	observer.observe(targetNode, config);
}

window.addEventListener("__ar_annotation_click", e => {
	const url = e.detail.url;
	// redirect to the url
	window.location.href = url;
});

function updateAnnotationSizes(delay = 0) {
	setTimeout(() => {
		if (renderer) {
			renderer.updateAllAnnotationSizes();
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

function waitForElement(selector, maxRetries=10, intervalAmount=200, intervalStep=200) {
	return new Promise((resolve, reject) => {
		let currentRetries = 0;

		const progInt = setInterval(() => {
			currentRetries++;
			intervalAmount += intervalStep;

			if (currentRetries > maxRetries) {
				reject();
				clearInterval(progInt);
				return;
			}

			const el = document.querySelector(selector);
			if (el) {
				resolve(el);
				clearInterval(progInt);
				return;
			}
		}, intervalAmount);
	});
}

// Adding annotation visibility switch to settings menu, just like in ye olden days
waitForElement(".ytp-panel-menu").then(el => {
	const annoSwitchPar = document.createElement("div");
	annoSwitchPar.className = "ytp-menuitem";
	annoSwitchPar.innerHTML = `
	<div class="ytp-menuitem-icon"></div>
	<div class="ytp-menuitem-label">Restore Annotations</div>
	<div class="ytp-menuitem-content">
		<div class="ytp-menuitem-toggle-checkbox">
		<input type="checkbox" id="annotation-sneaky-switch" aria-hidden="true" style="position: absolute; left: -100vw;">
		</div>
	</div>
	`;
	annoSwitchPar.setAttribute("role", "menuitemcheckbox");
	annoSwitchPar.setAttribute("aria-checked", "true");
	annoSwitchPar.setAttribute("tabindex", "0");

	el.prepend(annoSwitchPar);

	// a visually-hidden input checkbox (annoSneakySwitch) is used to store the state of annotation visibility.
	// the same thing could be done with some craftier JS but checkboxes are very certain and difficult to screw up */

	const annoSneakySwitch = document.querySelector("#annotation-sneaky-switch");
	annoSneakySwitch.checked = true;
	annoSwitchPar.addEventListener("click", () => {
		annoSneakySwitch.click();

		if (annoSneakySwitch.checked) {
			annoSwitchPar.setAttribute("aria-checked", "true");
			renderer.annotationsContainer.style.display = "block"
		}
		else {
			annoSwitchPar.setAttribute("aria-checked", "false");
			renderer.annotationsContainer.style.display = "none";
		}
	})
}).catch(() => {
	console.warn("Unable to find the video player settings menu, annotation switch not injected");
});
