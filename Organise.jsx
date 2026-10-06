(function() {
    // Helper: Finds or creates a folder at the project root level
    function getOrCreateFolder(name) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof FolderItem && item.parentFolder === app.project.rootFolder && item.name === name) {
                return item;
            }
        }
        return app.project.items.addFolder(name);
    }

    app.beginUndoGroup("Organize Project Panel");
    try {
        // 1. Define root folder names
        var folderNames = {
            comps: "Compositions",
            videos: "Videos",
            images: "Images",
            audio: "Audio",
            solids: "Solids",
            unused: "Unused Files",
            other: "Other"
        };

        // 2. Find or create root folders
        var targetFolders = {};
        for (var key in folderNames) {
            if (folderNames.hasOwnProperty(key)) {
                targetFolders[key] = getOrCreateFolder(folderNames[key]);
            }
        }

        // 3. Gather all items to prevent index shifting issues during relocation
        var items = [];
        for (var i = 1; i <= app.project.numItems; i++) {
            items.push(app.project.item(i));
        }

        // 4. Sort items into folders
        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            // Skip the organization folders themselves
            if (item instanceof FolderItem) {
                continue;
            }

            // Handle Compositions
            if (item instanceof CompItem) {
                item.parentFolder = targetFolders.comps;
                continue;
            }

            // Handle Footage items
            if (item instanceof FootageItem) {
                var isFile = (item.mainSource instanceof FileSource);
                var isSolid = (item.mainSource instanceof SolidSource);

                // If it is a Solid layer, send to the Solids folder
                if (isSolid) {
                    item.parentFolder = targetFolders.solids;
                    continue;
                }

                // If it's an imported file/sequence and is not used in any comp
                if (isFile && item.usedIn.length === 0) {
                    item.parentFolder = targetFolders.unused;
                    continue;
                }

                // Categorize active footage
                if (item.hasVideo) {
                    if (item.duration === 0) {
                        item.parentFolder = targetFolders.images; // Stills
                    } else {
                        item.parentFolder = targetFolders.videos; // Video files / sequences
                    }
                } else if (item.hasAudio) {
                    item.parentFolder = targetFolders.audio; // Sound files
                } else {
                    item.parentFolder = targetFolders.other; // Placeholders, nulls, adjustment layers, etc.
                }
            }
        }

    } catch (err) {
        alert("An error occurred: " + err.toString());
    } finally {
        app.endUndoGroup();
    }
})();
