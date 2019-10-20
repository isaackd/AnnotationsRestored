// get from pastebin
function getAnnotationsPastebinFromDescription(description) {
	return new Promise((resolve, reject) => {
		// Gist annotations
		const startPasteFlagText = "[ar_pastebin_start]";
		const startPasteFlag = description.indexOf(startPasteFlagText);
		const endPasteFlag = description.indexOf("[ar_pastebin_end]");

		if (startPasteFlag === -1 || endPasteFlag === -1) {
			reject("Couldn\'t find either a start or end flag");
			return;
		}

		try {
			const pasteUrlPrefix = "https://pastebin.com/raw/";

			const startPasteFlagText = "[ar_pastebin_start]";
			const pasteUrl = description.substring(startPasteFlag + startPasteFlagText.length, endPasteFlag);
			const endpoint = `${pasteUrlPrefix}${pasteUrl}`;

			fetch(endpoint)
			.then(response => response.text())
			.then(text => {
				const annotations = annotationParser.deserializeAnnotationList(text);
				resolve(annotations);
			})
			.catch(e => {
				reject(`Possibly malformed annotation data: ${e}`);
			});
		} 
		catch (e) {
			reject(`Possibly malformed annotation data: ${e}`);
		}
	});
}
