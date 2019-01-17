## Annotations Restored
**[Brings annotation support back to YouTube](https://github.com/afrmtbl/AnnotationsRestored/blob/master/demo.gif)**


\**Currently only works with the [custom [ar_start]...[ar_end] format](https://imgur.com/1ubx6B8) in the description of a YouTube video until the [archival efforts](https://www.reddit.com/r/DataHoarder/comments/aa6czg/youtube_annotation_archive/) of [/u/omarroth](https://www.reddit.com/user/omarroth) make it into an API. In the meantime, for older videos, you can [place the converted annotation data into the description of your video](#restoring-annotations-on-old-videos)*

On January 15 2019, YouTube decided to discontinue annotations. While the feature was frequently abused, it did have many legitimate use cases, such as games, corrections, and a form of commentary that could be toggled on and off. The removal left many older videos obsolete. **Annotations Restored** aims to fix this.

## Installation
This extension will be published to the [Chrome Web Store](https://chrome.google.com/webstore) and [addons.mozilla.org](https://addons.mozilla.org/firefox/) once an Annotations API with the archived data becomes available. Until then, they can be loaded as temporary extensions in Chrome and Firefox.

**Google Chrome**

1. Download the [latest release of the extension](https://github.com/afrmtbl/AnnotationsRestored/releases) 
2. Go to [chrome://extensions](chrome://extensions), enable the "Developer Mode" option in the top right and reload the page.
4. Drag **ext.zip** onto the window to install it. 

**Firefox**

1. Download the [latest release of the extension](https://github.com/afrmtbl/AnnotationsRestored/releases)
2. Go to [about:debugging#addons](about:debugging#addons), click "Load Temporary Add-on"
3. Select **ext.zip**.


## Restoring annotations on old videos
If you were able to download your video's annotation data before it was removed, you can use the [conversion tool](https://afrmtbl.github.io/annotations-converter/) to convert it into a format the extension can understand. **The data put into the description must be in the following format**: `[ar_start]CONVERTED_ANNOTATION_DATA[ar_end]`

If you don't have access to the annotation data for your videos, you will need to wait for the data dumps from  projects such as the [YouTube Annotation Archive](https://www.reddit.com/r/DataHoarder/comments/aa6czg/youtube_annotation_archive/) to become available, then check if the annotations for your video were saved.

## Adding annotations to new videos
As I currently don't have access to a server to store new annotation data, it must be put into the video's description as described above, although **you will have to manually create the data in the extension's format**. If there is enough interest, an annotation creator can be made.
