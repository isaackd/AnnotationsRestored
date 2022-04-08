const mainElement = document.getElementById("main");

const videoIdElement = document.getElementById("video-id");
const annotationTableBodyElement = document.getElementById("annotations-table-body");

const annotationCountElement = document.getElementById("annotation-count");
const annotationDownloadButton = document.getElementById("download-button");

let lastStateChangeTime = 0;
let stateChangeTimeout = null;

function changePopupState(state) {
	clearTimeout(stateChangeTimeout);

	if (performance.now() - lastStateChangeTime > 250 || !lastStateChangeTime) {
		mainElement.setAttribute("data-state", state);
		lastStateChangeTime = performance.now();
	}
	else {
		stateChangeTimeout = setTimeout(() => {
			changePopupState(state);
		}, 250);
	}
}

function extractAnnotationMeta(annotations) {
	return annotations
		.filter(an => an && an.hasOwnProperty("timeStart"))
		.sort((a, b) => a.timeStart - b.timeStart)
		.map(an => {
			let type = an.type;
			let style = an.style;

			type = type ? type : "???";
			style = style ? style : type;
			const text = an.text;

			const startTime = an.timeStart;
			const startTimeText = formatSeconds(startTime);

			return { type, style, text, startTime, startTimeText };
		});
}

function getCurrentTab() {
	return new Promise(resolve => {
		let queryOptions = { active: true, currentWindow: true };
		chrome.tabs.query(queryOptions, result => {
			resolve(result[0]);
		});
	});
}

function getPopupData() {
	return new Promise((resolve, reject) => {

		getCurrentTab().then(tab => {
			chrome.tabs.sendMessage(tab.id, { type: "get_popup_data" }, data => {
				if (data) {
					resolve(data);
				}
				else {
					reject();
				}
			});
		});

	});
}


function updatePopupData(updateRequest) {
	const popupData = updateRequest.data;

	if (updateRequest.status === "no_video") {
		changePopupState("no-video");
	}
	else if (updateRequest.status === "no_annotations") {
		videoIdElement.textContent = popupData.videoId;
		changePopupState("no-annotations");
	}
	else if (updateRequest.status === "checking_for_annotations") {
		changePopupState("checking-annotations");
	}
	else if (updateRequest.status === "annotations_loaded") {
		videoIdElement.textContent = popupData.videoId;
		clearTable();

		const annotationCount = popupData.annotations.length;
		const plural = annotationCount === 1 ? "Annotation" : "Annotations";
		annotationCountElement.textContent = `${annotationCount} ${plural}`;

		const annotations = extractAnnotationMeta(popupData.annotations);

		for (const annotation of annotations) {
			addAnnotationTableRow(
				annotation.style,
				annotation.text,
				annotation.startTimeText,
				annotation.startTime
			);
		}

		changePopupState("video");
	}
}

function formatSeconds(sec) {
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);

    const minPadding = minutes < 10 ? "0" : "";
    const secPadding = seconds < 10 ? "0" : "";

    return `${minPadding}${minutes}:${secPadding}${seconds}`;
}

function clearTable() {
	while (annotationTableBodyElement.firstChild) {
		annotationTableBodyElement.firstChild.remove();
	}
}

function addAnnotationTableRow(type, text, time, seconds) {
	const rowElement = document.createElement("tr");

	const typeColumn = document.createElement("td");
	typeColumn.textContent = type;
	typeColumn.classList.add("annotation-type");
	typeColumn.setAttribute("title", "Annotation Type");

	const textColumn = document.createElement("td");
	textColumn.classList.add("annotation-text");

	const textSpan = document.createElement("span");
	if (text) {
		textSpan.textContent = text;
		textSpan.setAttribute("title", text);
	}
	else {
		textSpan.textContent = "No text";
		textColumn.classList.add("no-text", "secondary-text");
	}

	textColumn.append(textSpan);

	const timeSpan = document.createElement("span");
	timeSpan.textContent = time;

	const timeColumn = document.createElement("td");
	timeColumn.append(timeSpan);
	timeColumn.classList.add("annotation-time", "secondary-text");
	timeColumn.startTime = seconds;
	timeColumn.setAttribute("title", `Skip to ${time}`);

	rowElement.append(typeColumn, textColumn, timeColumn);

	annotationTableBodyElement.append(rowElement);
}

annotationTableBodyElement.addEventListener("click", e => {
	const timeElement = e.target.closest(".annotation-time");
	if (timeElement) {
		const seconds = timeElement.startTime;
		getCurrentTab().then(tab => {
			chrome.tabs.sendMessage(tab.id, { type: "seek_to", seconds });
		});
	}
});

chrome.runtime.onMessage.addListener(request => {
	if (request.type !== "content_status") {
		return;
	}

	updatePopupData(request);
});

getPopupData()
	.then(updatePopupData)
	.catch(e => {
		// May not be any content scripts running
		void e;
	});
