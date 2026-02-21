'use client';

import styles from './Options.module.css';

export default function Options({
    quality, setQuality,
    width, setWidth,
    height, setHeight,
    format, setFormat,
    resizeOption, setResizeOption,
    keepAspectRatio, setKeepAspectRatio,
    keepOriginalResolution, setKeepOriginalResolution,
    images
}) {

    // Helper para recalcular dimensiones automáticas en base a aspecto
    const handleWidthChange = (e) => {
        const newWidth = parseInt(e.target.value) || 0;
        setWidth(newWidth);
        if (keepAspectRatio && images.length > 0 && images[0].blob) {
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                setHeight(Math.round(newWidth / aspectRatio));
            };
            img.src = images[0].preview;
        }
    };

    const handleHeightChange = (e) => {
        const newHeight = parseInt(e.target.value) || 0;
        setHeight(newHeight);
        if (keepAspectRatio && images.length > 0 && images[0].blob) {
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                setWidth(Math.round(newHeight * aspectRatio));
            };
            img.src = images[0].preview;
        }
    };

    const optionsConfig = [
        { id: 'format', label: 'Formato', value: format, setter: setFormat, type: 'select', options: ['webp', 'avif', 'jpeg', 'png', 'gif'] },
        { id: 'quality', label: 'Calidad (%)', value: quality, setter: setQuality, type: 'number', min: 1, max: 100 },
        { id: 'resizeOption', label: 'Redimensionar por', value: resizeOption, setter: setResizeOption, type: 'select', options: ['pixels', 'percentage'] },
        { id: 'width', label: 'Ancho', value: width, setter: setWidth, type: 'number', min: 1, onChange: handleWidthChange, disabled: keepOriginalResolution },
        { id: 'height', label: 'Alto', value: height, setter: setHeight, type: 'number', min: 1, onChange: handleHeightChange, disabled: keepOriginalResolution },
    ];

    return (
        <div className={styles.container}>
            {optionsConfig.map(item => (
                <div key={item.id} className={styles.formGroup}>
                    <label htmlFor={item.id} className={styles.label}>{item.label}</label>
                    {item.type === 'select' ? (
                        <select
                            id={item.id}
                            value={item.value}
                            onChange={e => item.setter(e.target.value)}
                            className={styles.select}
                        >
                            {item.options.map(opt => (
                                <option key={opt} value={opt}>
                                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type={item.type}
                            id={item.id}
                            value={item.value}
                            min={item.min}
                            max={item.max}
                            onChange={item.onChange || (e => item.setter(parseInt(e.target.value) || 0))}
                            className={styles.input}
                            disabled={item.disabled}
                        />
                    )}
                </div>
            ))}

            <div className={styles.checkboxGroup}>
                <div className={styles.checkboxContainer} onClick={() => setKeepAspectRatio(!keepAspectRatio)}>
                    <input
                        type="checkbox"
                        id="keepAspectRatio"
                        checked={keepAspectRatio}
                        onChange={e => setKeepAspectRatio(e.target.checked)}
                        className={styles.checkbox}
                    />
                    <label htmlFor="keepAspectRatio" className={styles.checkboxLabel} onClick={(e) => e.stopPropagation()}>
                        Mantener relación de aspecto
                    </label>
                </div>

                <div className={styles.checkboxContainer} onClick={() => setKeepOriginalResolution(!keepOriginalResolution)}>
                    <input
                        type="checkbox"
                        id="keepOriginalResolution"
                        checked={keepOriginalResolution}
                        onChange={e => setKeepOriginalResolution(e.target.checked)}
                        className={styles.checkbox}
                    />
                    <label htmlFor="keepOriginalResolution" className={styles.checkboxLabel} onClick={(e) => e.stopPropagation()}>
                        Mantener resolución original
                    </label>
                </div>
            </div>
        </div>
    );
}
