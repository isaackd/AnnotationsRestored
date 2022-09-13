mkdir -p build

echo "Building for Chrome..."
zip -r build/chrome_build.zip icons/* _locales/* popup/* manifest.json pages/* js/annotationlib/dist/* js/*.js

mv manifest.json manifest_chrome.json
mv manifest_firefox.json manifest.json

echo "Building for Firefox..."
zip -r build/firefox_build.zip icons/* _locales/* popup/* manifest.json pages/* js/annotationlib/dist/* js/*.js

mv manifest.json manifest_firefox.json
mv manifest_chrome.json manifest.json

