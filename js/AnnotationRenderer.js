class AnnotationRenderer {
	constructor(annotations, container, postMessageOrigin, updateInterval = 1000) {
		if (!annotations) throw new Error("Annotation objects must be provided");
		if (!container) throw new Error("An element to contain the annotations must be provided");
		if (!postMessageOrigin) throw new Error("A postMessageOrigin must be provided");

		this.annotations = annotations;
		this.container = container;
		this.postMessageOrigin = postMessageOrigin;

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
	changeAnnotationData(annotations) {
		this.stop();
		this.removeAnnotationElements();
		this.annotations = annotations;
		this.createAnnotationElements();
		this.start();
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
	removeAnnotationElements() {
		for (const annotation of this.annotations) {
			annotation.__element.remove();
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
	hideAll() {
		for (const annotation of this.annotations) {
			annotation.__element.setAttribute("hidden", "");
		}
	}
	start() {
		window.postMessage({type: "__annotations_restored_renderer_start", updateInterval: this.updateInterval}, this.postMessageOrigin);
	}
	stop() {
		window.postMessage({type: "__annotations_restored_renderer_stop"}, this.postMessageOrigin);
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
			window.postMessage({type: "__annotations_restored_renderer_urlclick", url: annotationData.actionUrl});
		}
	}

	setVideoTime(seconds) {
		window.postMessage({type: "__annotations_restored_renderer_seek_to", seconds}, this.postMessageOrigin);
	}

	setUpdateInterval(ms) {
		this.updateInterval = ms;
		this.stop();
		this.start();
	}
}
