
ZIP_FILES := images/ manifest.json scripts/ styles/
zip:
	@echo "** Make a zip archive for chrome store publishing..."
	@zip -r ../devdocs-popup.zip ${ZIP_FILES}
