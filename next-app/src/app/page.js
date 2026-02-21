'use client';

import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { FiLoader, FiX, FiImage } from 'react-icons/fi';

import styles from './page.module.css';

import Dropzone from '@/components/Dropzone/Dropzone';
import ImageList from '@/components/ImageList/ImageList';
import Options from '@/components/Options/Options';
import Message from '@/components/Message/Message';

export default function Home() {
  const [images, setImages] = useState([]);
  const [quality, setQuality] = useState(80);
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [format, setFormat] = useState('webp');
  const [resizeOption, setResizeOption] = useState('pixels');
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [keepOriginalResolution, setKeepOriginalResolution] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleRemoveImage = useCallback((index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleClear = useCallback(() => {
    setImages([]);
    setMessage({ type: '', text: '' });
  }, []);

  const processSingleImage = async (image) => {
    const formData = new FormData();
    formData.append('quality', quality);
    formData.append('format', format);
    formData.append('resizeOption', resizeOption);
    formData.append('keepAspectRatio', keepAspectRatio);
    formData.append('keepOriginalResolution', keepOriginalResolution);

    if (!keepOriginalResolution) {
      formData.append('width', width);
      formData.append('height', height);
    }

    formData.append('image', image.blob, image.name);

    const response = await fetch('/api/convert', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error en la conversión');
    }

    const blob = await response.blob();

    // Obtener la extensión original para reemplazarla
    const nameWithoutExt = image.name.substring(0, image.name.lastIndexOf('.')) || image.name;
    const newFileName = `${nameWithoutExt}.${format}`;

    return { blob, fileName: newFileName };
  }

  const handleConvert = async () => {
    if (images.length === 0) {
      setMessage({ type: 'error', text: 'Por favor, sube al menos una imagen.' });
      return;
    }

    setIsConverting(true);
    setMessage({ type: '', text: '' });

    try {
      // Procesamos las imágenes en paralelo usando la API Serverless (1 a 1 para evitar limites de timeout/payload)
      const processedImages = await Promise.all(
        images.map(img => processSingleImage(img))
      );

      if (processedImages.length === 1) {
        // Descarga individual
        const { blob, fileName } = processedImages[0];
        saveAs(blob, fileName);
      } else {
        // Descarga Múltiple (Armamos el ZIP en el navegador con JSZip)
        const zip = new JSZip();

        processedImages.forEach(({ blob, fileName }, index) => {
          // Prevenir nombres duplicados en el zip
          const uniqueFileName = zip.file(fileName)
            ? `${fileName.split('.')[0]}_${index}.${format}`
            : fileName;

          zip.file(uniqueFileName, blob);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, 'converted_images.zip');
      }

      setMessage({ type: 'success', text: '¡Conversión exitosa! La descarga ha comenzado automáticamente.' });
      setImages([]);

    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainCard}>

        <div className={styles.leftColumn}>
          <header className={styles.header}>
            <h1 className={styles.title}>Conversor de Imágenes</h1>
            <p className={styles.subtitle}>Convierte a WebP y AVIF ultra-rápido en Next.js</p>
          </header>

          <Message message={message} />

          <Dropzone
            setImages={setImages}
            setMessage={setMessage}
            isConverting={isConverting}
          />

          <Options
            quality={quality} setQuality={setQuality}
            width={width} setWidth={setWidth}
            height={height} setHeight={setHeight}
            format={format} setFormat={setFormat}
            resizeOption={resizeOption} setResizeOption={setResizeOption}
            keepAspectRatio={keepAspectRatio} setKeepAspectRatio={setKeepAspectRatio}
            keepOriginalResolution={keepOriginalResolution} setKeepOriginalResolution={setKeepOriginalResolution}
            images={images}
          />

          <div className={styles.actions}>
            <button
              onClick={handleConvert}
              disabled={images.length === 0 || isConverting}
              className={`${styles.convertBtn} ${images.length === 0 || isConverting ? styles.btnDisabled : ''}`}
            >
              {isConverting ? (
                <><FiLoader className={styles.spinner} /> Convirtiendo...</>
              ) : (
                'Convertir y Descargar'
              )}
            </button>
            <button
              onClick={handleClear}
              disabled={images.length === 0 || isConverting}
              className={`${styles.clearBtn} ${images.length === 0 || isConverting ? styles.btnDisabled : ''}`}
            >
              <FiX /> Limpiar
            </button>
          </div>
        </div>

        <aside className={styles.rightColumn}>
          <h2 className={styles.queueHeader}>
            Cola de Procesamiento ({images.length})
          </h2>

          <div className={styles.queueContainer}>
            {images.length === 0 ? (
              <div className={styles.emptyQueue}>
                <FiImage className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>Tu cola está vacía</h3>
                <p className={styles.emptySubtitle}>Arrastra archivos a la zona de la izquierda.</p>
              </div>
            ) : (
              <ImageList
                images={images}
                onRemove={handleRemoveImage}
              />
            )}
          </div>
        </aside>

      </main>
    </div>
  );
}
