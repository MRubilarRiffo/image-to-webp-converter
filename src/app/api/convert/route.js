import sharp from 'sharp';
import { NextResponse } from 'next/server';

export const POST = async (req) => {
    try {
        const formData = await req.formData();

        const file = formData.get('image');
        const format = formData.get('format');
        const quality = parseInt(formData.get('quality'), 10);
        const resizeOption = formData.get('resizeOption');
        const keepOriginalResolution = formData.get('keepOriginalResolution') === 'true';
        const keepAspectRatio = formData.get('keepAspectRatio') === 'true';

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No se envió ninguna imagen válida' }, { status: 400 });
        }

        // Convertir Web File API a un Buffer nativo de Node.js
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let sharpInstance = sharp(buffer);

        if (!keepOriginalResolution) {
            const width = parseInt(formData.get('width'), 10) || null;
            const height = parseInt(formData.get('height'), 10) || null;

            if (resizeOption === 'pixels') {
                if (width || height) {
                    sharpInstance = sharpInstance.resize(width, height);
                }
            } else if (resizeOption === 'percentage') {
                const metadata = await sharpInstance.metadata();
                const originalWidth = metadata.width;
                const originalHeight = metadata.height;

                let newWidth = null;
                let newHeight = null;

                if (width && width > 0) {
                    newWidth = Math.round(originalWidth * (width / 100));
                    if (keepAspectRatio && originalHeight) {
                        newHeight = Math.round(originalHeight * (width / 100));
                    }
                }

                if (height && height > 0 && !newHeight) {
                    newHeight = Math.round(originalHeight * (height / 100));
                    if (keepAspectRatio && originalWidth) {
                        newWidth = Math.round(originalWidth * (height / 100));
                    }
                }

                if (newWidth || newHeight) {
                    sharpInstance = sharpInstance.resize(newWidth, newHeight);
                }
            }
        }

        // Aplicar formato dinámico y calidad
        switch (format) {
            case 'webp':
                sharpInstance = sharpInstance.webp({ quality });
                break;
            case 'avif':
                sharpInstance = sharpInstance.avif({ quality });
                break;
            case 'jpeg':
                sharpInstance = sharpInstance.jpeg({ quality });
                break;
            case 'png':
                sharpInstance = sharpInstance.png({ quality });
                break;
            case 'gif':
                sharpInstance = sharpInstance.gif();
                break;
            default:
                break;
        }

        // Extraer buffer procesado en binario
        const outputBuffer = await sharpInstance.toBuffer();

        // Crear respuestas HTTP nativas con los headers adecuados
        return new NextResponse(outputBuffer, {
            status: 200,
            headers: {
                'Content-Type': `image/${format}`,
                'Content-Disposition': `attachment; filename="converted.${format}"`
            }
        });

    } catch (error) {
        console.error("Error Processing Image:", error);
        return NextResponse.json({ error: 'Error al procesar la imagen seleccionada' }, { status: 500 });
    }
}
