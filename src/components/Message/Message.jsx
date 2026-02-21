'use client';

import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import styles from './Message.module.css';

export default function Message({ message }) {
    if (!message || !message.text) return null;

    const isSuccess = message.type === 'success';

    return (
        <div className={`${styles.message} ${isSuccess ? styles.success : styles.error}`}>
            {isSuccess ? <FiCheckCircle className={styles.icon} /> : <FiAlertCircle className={styles.icon} />}
            <p className={styles.text}>{message.text}</p>
        </div>
    );
}
