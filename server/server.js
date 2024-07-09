const express = require('express');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Agrega el middleware CORS

// Directorio de las imágenes de salida
const desktopPath = path.join(require('os').homedir(), 'Desktop');
const directorioSalida = path.join(desktopPath, 'convertImg');

// Configuración de multer para almacenar las imágenes en la carpeta temporal
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Ruta para procesar las imágenes
app.post('/convertir-imagenes', upload.array('image'), (req, res) => {
	if (!fs.existsSync(directorioSalida)) {
			fs.mkdirSync(directorioSalida);
	};

	const { quality, width } = req.body;
	const images = req.files;

	if (!quality || !width || !images || images.length === 0) {
		return res.status(400).send('Datos incompletos o inválidos');
	};

	if (!fs.existsSync(directorioSalida)) {
		fs.mkdirSync(directorioSalida);
	};

	images.forEach((image, index) => {
		const imageName = `image_${index}.webp`;

		sharp(image.buffer)
			// Cambia el tamaño de la imagen
			.resize(parseInt(width))
			// Convierte a WebP
			.toFormat('webp', { quality: parseInt(quality) })
			// Guarda la imagen en el directorio de salida
			.toFile(path.join(directorioSalida, imageName))
		.then(() => console.log(`Imagen ${imageName} convertida a WebP y guardada en ${directorioSalida}`))
		.catch(err => console.error(`Error al convertir ${imageName} a WebP:`, err));
	});

	res.send('Imágenes convertidas exitosamente');
});

const PORT = 3000;
app.listen(PORT, () => {
	console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});