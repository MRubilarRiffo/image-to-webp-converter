'use client';

import { useState, useCallback } from 'react';
import { FiUploadCloud } from 'react-icons/fi';
import { toast } from 'sonner';
import styles from './Dropzone.module.css';
import { handleFileDrop } from '@/lib/utils';

export default function Dropzone({ setImages, isConverting }) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = useCallback((acceptedFiles, rejectedFiles) => {
        if (rejectedFiles && rejectedFiles.length > 0) {
            rejectedFiles.forEach(({ file, reason }) => {
                if (reason === 'size_limit_exceeded') {
                    toast.error(`"${file.name}" supera el límite de 4.5MB.`);
                } else if (reason === 'invalid_type') {
                    toast.error(`"${file.name}" no es una imagen válida.`);
                }
            });
        }

        if (acceptedFiles.length === 0) {
            setIsDragging(false);
            return;
        }

        acceptedFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const newImage = {
                        blob: file,
                        name: file.name,
                        preview: URL.createObjectURL(file), // Need this for UI visual
                        size: file.size,
                        width: img.width,
                        height: img.height,
                        type: file.type,
                    };
                    setImages(prev => [...prev, newImage]);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
        setIsDragging(false);
    }, [setImages]);

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const onDragLeave = () => setIsDragging(false);

    return (
        <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={(e) => handleFileDrop(e, handleDrop)}
            className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
        >
            <input
                type="file"
                multiple
                accept="image/*"
                className={styles.inputHidden}
                id="file-upload"
                onChange={(e) => handleFileDrop(e, handleDrop)}
                disabled={isConverting}
            />
            <label
                htmlFor="file-upload"
                className={`${styles.label} ${isConverting ? styles.disabled : ''}`}
            >
                <div className={styles.iconContainer}>
                    <FiUploadCloud className={styles.icon} />
                </div>
                <p className={styles.title}>
                    Arrastra tus imágenes o haz click
                </p>
                <p className={styles.subtitle}>Selecciona los archivos para convertir a WebP o AVIF</p>
            </label>
        </div>
    );
}
