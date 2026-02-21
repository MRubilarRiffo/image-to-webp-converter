const express = require('express');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const archiver = require('archiver');

const app = express();
app.use(express.json());
app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/convertir-imagenes', upload.array('image'), async (req, res) => {
    const { quality, width, height, format, resizeOption, keepAspectRatio, keepOriginalResolution } = req.body;
    const images = req.files;

    if (!images || images.length === 0) {
        return res.status(400).send('No se subieron imágenes.');
    }

    const tempDir = path.join(__dirname, 'temp_conversion');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
        const processingPromises = images.map(async (image) => {
            const originalName = path.parse(image.originalname).name;
            const outputFileName = `${originalName}.${format}`;
            const outputPath = path.join(tempDir, outputFileName);

            let sharpInstance = sharp(image.buffer);

            if (keepOriginalResolution === 'true') {
                // No redimensionar, mantener resolución original
            } else {
                const parsedWidth = parseInt(width);
                const parsedHeight = parseInt(height);

                if (resizeOption === 'pixels') {
                    if (parsedWidth > 0 || parsedHeight > 0) {
                        sharpInstance = sharpInstance.resize(parsedWidth > 0 ? parsedWidth : null, parsedHeight > 0 ? parsedHeight : null);
                    }
                } else if (resizeOption === 'percentage') {
                    const metadata = await sharpInstance.metadata();
                    const originalWidth = metadata.width;
                    const originalHeight = metadata.height;

                    let newWidth = null;
                    let newHeight = null;

                    if (parsedWidth > 0) {
                        newWidth = Math.round(originalWidth * (parsedWidth / 100));
                        if (keepAspectRatio === 'true' && originalHeight) {
                            newHeight = Math.round(originalHeight * (parsedWidth / 100));
                        }
                    }

                    if (parsedHeight > 0 && !newHeight) { // Only calculate height if not already set by width and aspect ratio
                        newHeight = Math.round(originalHeight * (parsedHeight / 100));
                        if (keepAspectRatio === 'true' && originalWidth) {
                            newWidth = Math.round(originalWidth * (parsedHeight / 100));
                        }
                    }

                    if (newWidth || newHeight) {
                        sharpInstance = sharpInstance.resize(newWidth, newHeight);
                    }
                }
            }

            switch (format) {
                case 'webp':
                    sharpInstance = sharpInstance.webp({ quality: parseInt(quality) });
                    break;
                case 'avif':
                    sharpInstance = sharpInstance.avif({ quality: parseInt(quality) });
                    break;
                case 'jpeg':
                    sharpInstance = sharpInstance.jpeg({ quality: parseInt(quality) });
                    break;
                case 'png':
                    sharpInstance = sharpInstance.png({ quality: parseInt(quality) });
                    break;
                case 'gif':
                    sharpInstance = sharpInstance.gif(); // GIF doesn't typically use quality parameter
                    break;
                default:
                    break;
            }

            await sharpInstance.toFile(outputPath);
            return outputPath;
        });

        const processedFiles = await Promise.all(processingPromises);

        if (processedFiles.length === 1) {
            const filePath = processedFiles[0];
            res.download(filePath, path.basename(filePath), (err) => {
                if (err) {
                    console.error('Error al descargar el archivo:', err);
                }
                fs.unlinkSync(filePath);
                fs.rmdirSync(tempDir, { recursive: true });
            });
        } else {
            const zipPath = path.join(__dirname, 'converted_images.zip');
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => {
                console.log('ZIP file created, starting download...');
                res.download(zipPath, 'output.zip', (err) => {
                    if (err) {
                        console.error('Error al descargar el zip:', err);
                    } else {
                        console.log('ZIP downloaded successfully.');
                    }
                    // Clean up both the zip file and the temp directory after download attempt
                    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
                    if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir, { recursive: true });
                });
            });

            archive.on('error', (err) => {
                throw err;
            });

            archive.pipe(output);
            processedFiles.forEach(file => {
                archive.file(file, { name: path.basename(file) });
            });
            await archive.finalize();
        }
    } catch (error) {
        console.error('Error en el servidor:', error);
        res.status(500).send('Error al procesar las imágenes.');
        // Clean up temp directory in case of error
        fs.rmdirSync(tempDir, { recursive: true });
    }
});

const PORT = 3083;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
