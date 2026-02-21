
import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FiUploadCloud, FiTrash2, FiLoader, FiCheckCircle, FiAlertCircle, FiImage, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helpers ---
const handleFileDrop = (e, callback) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    const acceptedFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (acceptedFiles.length > 0) {
        callback(acceptedFiles);
    }
};

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const readFileEntry = (fileEntry, path, filesArray) => {
    return new Promise((resolve) => {
        fileEntry.file(file => {
            if (file.type.startsWith('image/')) {
                filesArray.push(file);
            }
            resolve();
        });
    });
};

const readDirectoryEntry = (directoryEntry, path, filesArray) => {
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

// --- Animated Components ---
const Dropzone = ({ setImages, setMessage, isConverting }) => {
    Dropzone.propTypes = {
        setImages: PropTypes.func.isRequired,
        setMessage: PropTypes.func.isRequired,
        isConverting: PropTypes.bool.isRequired,
    };
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = useCallback((acceptedFiles) => {
        setMessage({ type: '', text: '' });
        acceptedFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const newImage = {
                        blob: file,
                        name: file.name,
                        preview: URL.createObjectURL(file),
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
    }, [setImages, setMessage]);

    const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = () => setIsDragging(false);

    return (
        <motion.div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={(e) => handleFileDrop(e, handleDrop)}
            className={`relative flex flex-col items-center justify-center w-full h-64 bg-slate-50/50  rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out group ${isDragging ? 'border-emerald-500 scale-105 shadow-2xl' : 'border-slate-300'}`}
            whileHover={{ scale: 1.02 }}
        >
            <input type="file" multiple accept="image/*" className="hidden" id="file-upload" onChange={(e) => handleFileDrop(e, handleDrop)} disabled={isConverting} />
            <label htmlFor="file-upload" className={`flex flex-col items-center justify-center w-full h-full cursor-pointer text-center p-4 ${isConverting ? 'cursor-not-allowed opacity-50' : ''}`} >
                <motion.div
                    animate={{ y: isDragging ? -10 : 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <FiUploadCloud className={`w-16 h-16 transition-colors duration-300 ${isDragging ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500/80'}`} />
                </motion.div>
                <p className={`mt-4 text-lg font-semibold transition-colors duration-300 ${isDragging ? 'text-emerald-600' : 'text-slate-700'}`}>
                    Arrastra tus imágenes o haz click
                </p>
                <p className="text-slate-500 text-sm mt-1">Selecciona los archivos para convertir a WebP o AVIF</p>
            </label>
        </motion.div>
    );
};

const ImageList = ({ images, onRemove }) => (
    <AnimatePresence>
        {images.map((image, index) => (
            <motion.li
                key={image.name + index}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
                className="flex items-center bg-white/60 bg-slate-700/50 p-3 rounded-xl shadow-sm border border-slate-200/80 list-none transition-all hover:shadow-md hover:border-emerald-500/50 hover:border-emerald-500/50 backdrop-blur-sm"
            >
                <img src={image.preview} alt={`Preview of ${image.name}`} className="w-16 h-16 object-cover rounded-lg mr-4 border-2 border-slate-200" />
                <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate text-sm" title={image.name}>{image.name}</p>
                    <p className="text-slate-300 text-xs">{image.width}x{image.height} - {image.type.split('/')[1].toUpperCase()} - {formatBytes(image.size)}</p>
                </div>
                <motion.button
                    onClick={() => onRemove(index)}
                    className="ml-4 text-slate-500 hover:text-red-500 transition-colors duration-200 p-2 rounded-full hover:bg-red-100"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                >
                    <FiTrash2 className="w-5 h-5" />
                </motion.button>
            </motion.li>
        ))}
    </AnimatePresence>
);

ImageList.propTypes = {
    images: PropTypes.arrayOf(PropTypes.shape({
        blob: PropTypes.instanceOf(Blob).isRequired,
        name: PropTypes.string.isRequired,
        preview: PropTypes.string.isRequired,
        size: PropTypes.number.isRequired,
        width: PropTypes.number,
        height: PropTypes.number,
        type: PropTypes.string,
    })).isRequired,
    onRemove: PropTypes.func.isRequired,
};

const Options = ({ quality, setQuality, width, setWidth, height, setHeight, format, setFormat, resizeOption, setResizeOption, keepAspectRatio, setKeepAspectRatio, keepOriginalResolution, setKeepOriginalResolution, images }) => {
    const handleWidthChange = (e) => {
        const newWidth = parseInt(e.target.value);
        setWidth(newWidth);
        if (keepAspectRatio && images.length > 0 && images[0].blob) {
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                setHeight(Math.round(newWidth / aspectRatio));
            };
            img.src = URL.createObjectURL(images[0].blob);
        }
    };

    const handleHeightChange = (e) => {
        const newHeight = parseInt(e.target.value);
        setHeight(newHeight);
        if (keepAspectRatio && images.length > 0 && images[0].blob) {
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                setWidth(Math.round(newHeight * aspectRatio));
            };
            img.src = URL.createObjectURL(images[0].blob);
        }
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
                { id: 'format', label: 'Formato', value: format, setter: setFormat, type: 'select', options: ['webp', 'avif', 'jpeg', 'png', 'gif'] },
                { id: 'quality', label: 'Calidad (%)', value: quality, setter: setQuality, type: 'number', min: 1, max: 100 },
                { id: 'resizeOption', label: 'Redimensionar por', value: resizeOption, setter: setResizeOption, type: 'select', options: ['pixels', 'percentage'] },
                { id: 'width', label: 'Ancho', value: width, setter: setWidth, type: 'number', min: 1, onChange: handleWidthChange, disabled: keepOriginalResolution },
                { id: 'height', label: 'Alto', value: height, setter: setHeight, type: 'number', min: 1, onChange: handleHeightChange, disabled: keepOriginalResolution },
            ].map(item => (
                <div key={item.id} className="flex flex-col">
                    <label htmlFor={item.id} className="text-sm font-semibold text-slate-300 mb-2">{item.label}</label>
                    {item.type === 'select' ? (
                        <select id={item.id} value={item.value} onChange={e => item.setter(e.target.value)} className="p-3 border border-slate-600 rounded-lg bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all backdrop-blur-sm text-slate-100">
                            {item.options.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                        </select>
                    ) : (
                        <input type={item.type} id={item.id} value={item.value} min={item.min} max={item.max} onChange={item.onChange || (e => item.setter(parseInt(e.target.value)))} className="p-3 border border-slate-600 rounded-lg bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all backdrop-blur-sm text-slate-100" disabled={item.disabled} />
                    )}
                </div>
            ))}
            <div className="flex items-center mt-2">
                <input
                    type="checkbox"
                    id="keepAspectRatio"
                    checked={keepAspectRatio}
                    onChange={e => setKeepAspectRatio(e.target.checked)}
                    className="mr-2 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="keepAspectRatio" className="text-sm font-semibold text-slate-300">Mantener relación de aspecto</label>
            </div>
            <div className="flex items-center mt-2">
                <input
                    type="checkbox"
                    id="keepOriginalResolution"
                    checked={keepOriginalResolution}
                    onChange={e => setKeepOriginalResolution(e.target.checked)}
                    className="mr-2 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="keepOriginalResolution" className="text-sm font-semibold text-slate-300">Mantener resolución original</label>
            </div>
        </div>
    );
};

Options.propTypes = {
    quality: PropTypes.number.isRequired,
    setQuality: PropTypes.func.isRequired,
    width: PropTypes.number.isRequired,
    setWidth: PropTypes.func.isRequired,
    height: PropTypes.number.isRequired,
    setHeight: PropTypes.func.isRequired,
    format: PropTypes.string.isRequired,
    setFormat: PropTypes.func.isRequired,
    resizeOption: PropTypes.string.isRequired,
    setResizeOption: PropTypes.func.isRequired,
    keepAspectRatio: PropTypes.bool.isRequired,
    setKeepAspectRatio: PropTypes.func.isRequired,
    keepOriginalResolution: PropTypes.bool.isRequired,
    setKeepOriginalResolution: PropTypes.func.isRequired,
    images: PropTypes.array.isRequired,
};

const Message = ({ message }) => (
    <AnimatePresence>
        {message.text && (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-lg font-medium flex items-center gap-3 border ${message.type === 'success'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
                        : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20'
                    }`}
            >
                {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                <p>{message.text}</p>
            </motion.div>
        )}
    </AnimatePresence>
);

Message.propTypes = {
    message: PropTypes.shape({
        type: PropTypes.string,
        text: PropTypes.string,
    }).isRequired,
};

// --- Main App Component ---

function App() {
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

    const handleClear = useCallback(() => { setImages([]); setMessage({ type: '', text: '' }); }, []);

    const handleConvert = async () => {
        if (images.length === 0) {
            setMessage({ type: 'error', text: 'Por favor, sube al menos una imagen.' });
            return;
        }
        setIsConverting(true);
        setMessage({ type: '', text: '' });

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

        images.forEach(image => formData.append('image', image.blob, image.name));

        try {
            const response = await fetch('/api/convertir-imagenes', { method: 'POST', body: formData });
            if (!response.ok) throw new Error(await response.text());

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'images.zip';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            setMessage({ type: 'success', text: '¡Conversión exitosa! La descarga ha comenzado.' });
            setImages([]);

            // Request and show desktop notification
            if ('Notification' in window) {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification('Conversión Completada', {
                            body: 'Tus imágenes han sido convertidas y descargadas.',
                            icon: '/vite.svg' // You might want to use a more appropriate icon
                        });
                    }
                });
            }
        } catch (error) {
            setMessage({ type: 'error', text: `Error: ${error.message}` });
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div className="min-h-screen font-sans text-slate-100 flex items-center justify-center p-4 transition-colors duration-300 bg-gray-950">

            <motion.main
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="bg-slate-800/50 shadow-2xl shadow-black/30 rounded-2xl p-8 w-full max-w-6xl flex flex-col lg:flex-row gap-10 backdrop-blur-xl border border-slate-700/50"
            >
                {/* Left Column */}
                <div className="flex flex-col gap-6 w-full lg:w-1/2">
                    <header>
                        <h1 className="text-4xl font-bold text-white text-center">
                            Conversor de Imágenes
                        </h1>
                        <p className="text-center text-slate-400 mt-2">Convierte a WebP y AVIF con la máxima calidad</p>
                    </header>
                    <Message message={message} />
                    <Dropzone setImages={setImages} setMessage={setMessage} />
                    <Options quality={quality} setQuality={setQuality} width={width} setWidth={setWidth} height={height} setHeight={setHeight} format={format} setFormat={setFormat} resizeOption={resizeOption} setResizeOption={setResizeOption} keepAspectRatio={keepAspectRatio} setKeepAspectRatio={setKeepAspectRatio} keepOriginalResolution={keepOriginalResolution} setKeepOriginalResolution={setKeepOriginalResolution} images={images} />
                    <div className="flex gap-4 mt-auto pt-4">
                        <motion.button
                            onClick={handleConvert}
                            disabled={images.length === 0 || isConverting}
                            className="w-full bg-emerald-600 text-white py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isConverting ? <><FiLoader className="animate-spin mr-2" /> Convirtiendo...</> : 'Convertir y Descargar'}
                        </motion.button>
                        <motion.button
                            onClick={handleClear}
                            disabled={images.length === 0 || isConverting}
                            className="w-1/3 bg-slate-700 text-slate-100 py-4 rounded-lg hover:bg-slate-600 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <FiX /> Limpiar
                        </motion.button>
                    </div>
                </div>

                {/* Right Column */}
                <aside className="flex flex-col gap-4 w-full lg:w-1/2 bg-slate-800/50  p-6 rounded-2xl shadow-inner-lg dark:shadow-inner-xl backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-slate-200 text-left border-b border-slate-700 pb-3 mb-2">
                        Cola de Procesamiento ({images.length})
                    </h2>
                    <div className="flex-1 overflow-y-auto max-h-[520px] -mr-4 pr-4">
                        {images.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                className="text-center text-slate-400 py-16 flex flex-col items-center justify-center h-full"
                            >
                                <FiImage className="w-24 h-24 text-slate-600 mb-4" />
                                <h3 className="font-semibold text-lg text-slate-300">Tu cola de imágenes está vacía</h3>
                                <p className="mt-1 text-sm">Arrastra archivos a la zona de la izquierda para empezar.</p>
                            </motion.div>
                        ) : (
                            <ul>
                                <ImageList images={images} onRemove={handleRemoveImage} />
                            </ul>
                        )}
                    </div>
                </aside>
            </motion.main>
        </div>
    );
}

export default App;
