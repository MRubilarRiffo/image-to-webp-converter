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

    const MAX_SIZE = 4.5 * 1024 * 1024; // 4.5 MB limit for Vercel Free Serverless
    const acceptedFiles = [];
    const rejectedFiles = [];

    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            rejectedFiles.push({ file, reason: 'invalid_type' });
        } else if (file.size > MAX_SIZE) {
            rejectedFiles.push({ file, reason: 'size_limit_exceeded' });
        } else {
            acceptedFiles.push(file);
        }
    });

    callback(acceptedFiles, rejectedFiles);
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
