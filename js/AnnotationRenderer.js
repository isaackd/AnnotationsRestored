class AnnotationRenderer {
	constructor(annotations, video, container, updateInterval = 1000) {
		if (!annotations) throw new Error("Annotation Objects must be provided");
		if (!video) throw new Error("A Video must be provided");
		if (!container) throw new Error("An Annotation Container must be provided");
		this.annotations = annotations;
		this.video = video;
		this.container = container;

		this.annotationsContainer = document.createElement("div");
		this.annotationsContainer.classList.add("__cxt-ar-annotations-container__");
		this.annotationsContainer.setAttribute("data-layer", "4");
		this.annotationsContainer.addEventListener("click", e => {
			this.annotationClickHandler(e);
		});
		this.container.prepend(this.annotationsContainer);
		this.createAnnotationElements();

		window.addEventListener("__annotations_restored_renderer_update", e => {
			this.update(e.detail.videoTime);
		});

		this.updateInterval = updateInterval;

	}
	createAnnotationElements() {
		for (const annotation of this.annotations) {
			const el = document.createElement("div");
			el.classList.add("__cxt-ar-annotation__");

			el.style.left = `${annotation.x}%`;
			el.style.top = `${annotation.y}%`;

			el.style.width = `${annotation.width}%`;
			el.style.height = `${annotation.height}%`;

			el.setAttribute("data-ar-type", annotation.type);

			if (annotation.text) {
				el.textContent = annotation.text;
				el.setAttribute("data-has-text", "");
			}

			el.setAttribute("hidden", "");

			annotation.__element = el;
			el.__anotation = annotation;
			this.annotationsContainer.append(el);
		}
	}
	update(videoTime) {
		for (const annotation of this.annotations) {
			const el = annotation.__element;
			const start = annotation.timeStart;
			const end = annotation.timeEnd;

			if (el.hasAttribute("hidden") && (videoTime >= start && videoTime < end)) {
				el.removeAttribute("hidden");
			}
			else if (!el.hasAttribute("hidden") && (videoTime < start || videoTime > end)) {
				el.setAttribute("hidden", "");
			}
		}
	}
	start() {
		window.postMessage({type: "__annotations_restored_renderer_start", updateInterval: this.updateInterval}, "https://www.youtube.com");
	}
	stop() {
		window.postMessage({type: "__annotations_restored_renderer_stop"}, "https://www.youtube.com");
	}

	annotationClickHandler(e) {
		const annotationElement = e.target;
		const annotationData = annotationElement.__anotation;

		if (!annotationElement || !annotationData) return;

		if (annotationData.actionType === "time") {
			const seconds = annotationData.actionSeconds;
			this.setVideoTime(seconds);
		}
		else if (annotationData.actionType === "url") {
			window.location.href = annotationData.actionUrl;
		}
	}

	setVideoTime(seconds) {
		window.postMessage({type: "__annotations_restored_renderer_seek_to", seconds}, "https://www.youtube.com");
	}

	setUpdateInterval(ms) {
		this.updateInterval = ms;
		this.stop();
		this.start();
	}
}