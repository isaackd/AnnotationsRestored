// get from github gists
function getAnnotationsGistFromDescription(description) {
	return new Promise((resolve, reject) => {
		// Gist annotations
		const startGistFlagText = "[ar_gist_start]";
		const startGistFlag = description.indexOf(startGistFlagText);
		const endGistFlag = description.indexOf("[ar_gist_end]");

		if (startGistFlag === -1 || endGistFlag === -1) {
			reject("Couldn\'t find either a start or end flag");
			return;
		}

		try {
			const gistUrlPrefix = "https://gist.githubusercontent.com/";
			const gistUrlSuffix = "/raw";

			const gistUrl = description.substring(startGistFlag + startGistFlagText.length, endGistFlag);
			const endpoint = `${gistUrlPrefix}${gistUrl}${gistUrlSuffix}`;

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
