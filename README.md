## Annotations Restored
**Brings annotation support back to YouTube**

\***If you are on a Firefox based browser and would like to view annotations as if they were never removed from YouTube at all (uses YouTube's own rendering code), you can instead download [AnnotationsReloaded](https://addons.mozilla.org/firefox/addon/annotationsreloaded/). It will however eventually stop working whenever YouTube decides to remove their annotation rendering code.**

![Demonstration of Annotations Restored](https://github.com/afrmtbl/AnnotationsRestored/blob/master/demo.gif)**

On January 15 2019, YouTube decided to discontinue annotations. While the feature was frequently abused, it did have many legitimate use cases, such as games, corrections, and a form of commentary that could be toggled on and off. The removal left many older videos obsolete. **Annotations Restored** aims to fix this.

## Installation
This extension will be published to the [Chrome Web Store](https://chrome.google.com/webstore) and [addons.mozilla.org](https://addons.mozilla.org/firefox/) once an Annotations API with the archived data becomes available. Until then, they can be loaded as temporary extensions in Chrome and Firefox.

**Google Chrome/Opera/Vivaldi/Chromium**

1. Download the [latest release of the extension](https://github.com/afrmtbl/AnnotationsRestored/releases) 
2. Go to [chrome://extensions](chrome://extensions), enable the "Developer Mode" option in the top right and reload the page.
4. Drag **ext.zip** onto the window to install it. 

**Firefox**

1. Download the [latest release of the extension](https://github.com/afrmtbl/AnnotationsRestored/releases)
2. Go to [about:debugging#addons](about:debugging#addons), click "Load Temporary Add-on"
3. Select **ext.zip**.


## Restoring annotations on old videos
If you were able to download your video's annotation data before it was removed, you can use the [conversion tool](https://afrmtbl.github.io/annotations-converter/) to convert it into a format the extension can understand. **The data put into the description must be in one of the following formats**: 
* `[ar_start]CONVERTED_ANNOTATION_DATA[ar_end]` ([example](https://imgur.com/1ubx6B8))
* `[ar_gist_start]username/gist_id[ar_gist_end]`
* `[ar_pastebin_start]pastebin_id[ar_pastebin_end]`

If you don't have access to the annotation data for your videos, you will need to wait for the data dumps from  projects such as the [YouTube Annotation Archive](https://www.reddit.com/r/DataHoarder/comments/aa6czg/youtube_annotation_archive/) to become available, then check if the annotations for your video were saved.

## Adding annotations to new videos
As I currently don't have access to a server to store new annotation data, it must be put into the video's description as described above, although **you will have to manually create the data in the extension's format**. If there is enough interest, an annotation creator can be made.

## Documentation of the Annotations Restored format
Annotations Restored uses a different format than YouTube used for annotations. The Annotations Restored format is generally more compact than the YouTube annotations format.

Each videos annotations consist of a list of annotations. Annotations are separated by the `;` character, with no spaces. Each annotation consists of a set of properties, separated by the `,` character, also with no spaces. Between each property and value is a `=` symbol. The properties for annotations are the following:
#### Required Properties.
* `x`: the x coordinate of the annotation in percent of the width of the video.
* `y`: the y coordinate of the annotation in percent of the height of the video.
* `w`: the width of the annotation in percent of the width of the video.
* `h`: the height of the annotation in percent of the height of the video.
* `ts`: the start of the time the annotation is displayed on screen in seconds.
* `te`: the end of the time the annotation is displayed on screen in seconds.
* `tp`: the type of the annotation. Possible values include `text` and `pause`.
* `s` : the style of the annotation. Possible values include `speech`, `popup`, `highlightText`, `anchored`, and `branding`.
* `t`: the text of the annotation. Note that text must be url-encoded (use `%20` for space).
#### Optional Properties
* `as`: the time in seconds to jump to within a video for an annotation with an in-video link.

A `;` character must appear after the final annotation.
