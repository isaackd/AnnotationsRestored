function getAnnotationsFromDescription(description) {
	return new Promise((resolve, reject) => {
		const startFlagText = "[ar_start]";
		const startFlag = description.indexOf(startFlagText);
		const endFlag = description.indexOf("[ar_end]");

		if (startFlag === -1 || endFlag === -1) {
			reject("Couldn\'t find either a start or end flag");
			return;
		}

		try {
			const serializedAnnotations = description.substring(startFlag + startFlagText.length, endFlag);
			const annotations = annotationParser.deserializeAnnotationList(serializedAnnotations);

			resolve(annotations);
		} 
		catch (e) {
			reject(`Possibly malformed annotation data: ${e}`);
		}
	});
}

function getDescription(retries = 6, retryInterval = 500) {
	return new Promise((resolve, reject) => {
		let intervalCount = 0;
		const interval = setInterval(() => {
			intervalCount++;

			if (intervalCount === retries) {
				reject(`Unable to find description after ${retries} retries...`);
				clearInterval(interval);
				return;
			}
			const descriptionContainer = document.getElementById("description");
			if (!descriptionContainer) {
				return false;
			}
			const formattedString = descriptionContainer.getElementsByTagName("yt-formatted-string")[0];
			if (!formattedString) {
				return false;
			}
			const description = formattedString.textContent;

			if (description) {
				resolve(description);
				clearInterval(interval);
			} 
			else {
				reject("No description text");
				clearInterval(interval);
			}
		}, retryInterval);
	});
}

function getFirstValidDescriptionAnnotations() {
	return new Promise((resolve, reject) => {
		getDescription().then(async description => {
			const embedded = await getAnnotationsFromDescription(description).catch(() => {
				/* Discard the error and check the next source */
			});
			if (embedded) { 
				resolve({annotations: embedded, type: "embedded"}); return; 
			}

			const gist = await getAnnotationsGistFromDescription(description).catch(() => {
				// Discard the error and check the next source
			});
			if (gist) { 
				resolve({annotations: gist, type: "gist"}); 
				return; 
			}

			const pastebin = await getAnnotationsPastebinFromDescription(description).catch(() => {
				// Discard the error and check the next source
			});
			if (pastebin) { 
				resolve({annotations: pastebin, type: "pastebin"}); return; 
			}

			reject(`Couldn\'t find embedded, gist, or pastebin annotations`);
		}).catch(e => {
			reject(`Couldn\'t find description: ${e}`);
		});
	});
}
