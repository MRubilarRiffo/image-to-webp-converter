export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const handleFileDrop = (e, callback) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    const acceptedFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (acceptedFiles.length > 0) {
        callback(acceptedFiles);
    }
};

export const readFileEntry = (fileEntry, path, filesArray) => {
    return new Promise((resolve) => {
        fileEntry.file(file => {
            if (file.type.startsWith('image/')) {
                filesArray.push(file);
            }
            resolve();
        });
    });
};

export const readDirectoryEntry = (directoryEntry, path, filesArray) => {
    return new Promise((resolve) => {
        const dirReader = directoryEntry.createReader();
        dirReader.readEntries(async (entries) => {
            const entryPromises = entries.map(entry => {
                if (entry.isFile) {
                    return readFileEntry(entry, path + entry.name, filesArray);
                } else if (entry.isDirectory) {
                    return readDirectoryEntry(entry, path + entry.name + '/', filesArray);
                }
                return Promise.resolve();
            });
            await Promise.all(entryPromises);
            resolve();
        });
    });
};
