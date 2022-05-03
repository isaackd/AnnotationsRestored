// "browser" namespace in Firefox, "chrome" namespace in Chrome
if (typeof globalThis.browser === "undefined") {
	globalThis.browser = chrome;
}

const totalSizeElement = document.getElementById("total-size");
const videoListElement = document.getElementById("video-list");

function updateTotalSize() {
	// browser.storage.local.getBytesInUse() isn't supported in Firefox...
	// https://bugzilla.mozilla.org/show_bug.cgi?id=1385832
	if (browser.storage.local.getBytesInUse) {
		browser.storage.local.getBytesInUse().then(bytes => {
			totalSizeElement.textContent = `Total Size: ${Math.floor(bytes / 1000)} KB`;
		});
	}
	else {
		browser.storage.local.get(result => {
			totalSizeElement.textContent = `Total Size: ${Math.floor(JSON.stringify(result).length / 1000)} KB`;
		});
	}
}

function updateVideosList() {

	while (videoListElement.lastChild) {
		videoListElement.removeChild(videoListElement.lastChild);
	}

	browser.storage.local.get(result => {
		for (const item in result) {
			if (item.length !== 11) {
				continue;
			}

			const listItemElement = document.createElement("li");
			const videoIdElement = document.createElement("span");
			videoIdElement.classList.add("video-id");
			videoIdElement.textContent = item;

			const openButtonElement = document.createElement("button");
			openButtonElement.textContent = "Open";
			openButtonElement.classList.add("open-button");

			openButtonElement.addEventListener("click", () => {
				const createData = {
					url: "https://youtube.com/watch?v=" + item
				};

				browser.tabs.create(createData);
			});

			const deleteButtonElement = document.createElement("button");

			const annotationsSize = new Blob([result[item]]).size;
			deleteButtonElement.textContent = `Delete (${Math.floor(annotationsSize / 1000)} KB)`;

			deleteButtonElement.addEventListener("click", () => {
				chrome.storage.local.remove(item);
				listItemElement.remove();
				updateTotalSize();
			});

			listItemElement.append(videoIdElement, openButtonElement, deleteButtonElement);
			videoListElement.append(listItemElement);
		}
	});
}

updateTotalSize();
updateVideosList();

chrome.runtime.onMessage.addListener(request => {
	if (request.type === "content_status" && request.status === "annotations_loaded") {
		updateTotalSize();
		updateVideosList();
	}
});
