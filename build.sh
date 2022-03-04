mkdir -p build

echo "Building for Chrome..."
zip build/chrome_build.zip icons/* popup/* manifest.json js/annotationlib/dist/* js/annotation_sources/* js/*.js

mv manifest.json manifest_chrome.json
mv manifest_firefox.json manifest.json

echo "Building for Firefox..."
zip build/firefox_build.zip icons/* popup/* manifest.json js/annotationlib/dist/* js/annotation_sources/* js/*.js

mv manifest.json manifest_firefox.json
mv manifest_chrome.json manifest.json

