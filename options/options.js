document.addEventListener('DOMContentLoaded', function () {
	chrome.storage.sync.get(['optarchived'], function (result) {
		document.getElementById('archived').checked = result.optarchived;
	});
	chrome.storage.sync.get(['optmodern'], function (result) {
		document.getElementById('modern').checked = result.optmodern;
	});

	chrome.storage.sync.get(['optpause'], function (result) {
		document.getElementById('pause').checked = result.optpause;
	});
});
document.getElementById('save').addEventListener('click', function save() {
	chrome.storage.sync.set({
		optarchived: document.getElementById('archived').checked
	}, function() {console.log('Option Saved')});
	chrome.storage.sync.set({
		optmodern: document.getElementById('modern').checked
	}, function() {console.log('Option Saved')});
	chrome.storage.sync.set({
		optpause: document.getElementById('pause').checked
	}, function() {console.log('Option Saved')});
	document.getElementById('saved').hidden = false;
});
