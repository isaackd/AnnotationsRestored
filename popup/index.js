const youtubeFile = document.getElementById("youtube-file");
const youtubeTextArea = document.getElementById("youtube-data");

const convertedFile = document.getElementById("converted-file");
const convertedTextArea = document.getElementById("converted-data");

const loadYoutube = document.getElementById("load-youtube");
const loadConverted = document.getElementById("load-converted");

loadYoutube.addEventListener("click", e => {
	const data = youtubeTextArea.value;
	sendLoadMessage("popup_load_youtube", data);
});
loadConverted.addEventListener("click", e => {
	const data = convertedTextArea.value;
	sendLoadMessage("popup_load_converted", data);
});

youtubeFile.addEventListener("change", e => loadFileData(youtubeFile.files[0], youtubeTextArea));
convertedFile.addEventListener("change", e => loadFileData(convertedFile.files[0], convertedTextArea));

function loadFileData(file, textarea) {
	const reader = new FileReader();
	reader.addEventListener("load", e => {
		textarea.value = reader.result;
	});
	reader.readAsText(file);
}

function sendLoadMessage(type, data) {
	if (!type || !data) return;
	console.log("sending load message:", type);
	chrome.tabs.query({currentWindow: true, active: true}, tabs => {
		if (tabs[0]) {
			const tab = tabs[0];
			console.log(tab);
			chrome.tabs.sendMessage(tab.id, {type, data});
		}
	});
}
