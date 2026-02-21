import { FiTrash2, FiDownload } from 'react-icons/fi';
import styles from './ImageList.module.css';
import { formatBytes } from '@/lib/utils';

export default function ImageList({ images, onRemove, onDownload, isConverting }) {
    if (!images || images.length === 0) return null;

    return (
        <ul className={styles.list}>
            {images.map((image, index) => (
                <li key={image.name + index} className={styles.item}>
                    <img
                        src={image.preview}
                        alt={`Preview of ${image.name}`}
                        className={styles.image}
                    />
                    <div className={styles.details}>
                        <p className={styles.name} title={image.name}>
                            {image.name}
                        </p>
                        <p className={styles.meta}>
                            {image.width}x{image.height} - {image.type ? image.type.split('/')[1].toUpperCase() : 'UNKNOWN'} - {formatBytes(image.size)}
                        </p>
                    </div>
                    <div className={styles.itemActions}>
                        <button
                            type="button"
                            onClick={() => onDownload(index)}
                            className={styles.downloadBtn}
                            aria-label="Download image"
                            disabled={isConverting}
                        >
                            <FiDownload className={styles.icon} />
                        </button>
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            className={styles.removeBtn}
                            aria-label="Remove image"
                            disabled={isConverting}
                        >
                            <FiTrash2 className={styles.icon} />
                        </button>
                    </div>
                </li>
            ))}
        </ul>
    );
}
