import { useState } from 'react'
import './App.css'

function App() {
	const [imageLocations, setImageLocations] = useState([]);
	const [nameImg, setNameImg] = useState([]);
	const [quality, setQuality] = useState(100);
	const [width, setWidth] = useState(800);

	const handleDrop = (event) => {
		event.preventDefault();
		const files = event.dataTransfer.files;
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const reader = new FileReader();
			reader.onload = function (event) {
				const blob = new Blob([event.target.result], { type: file.type });
				setImageLocations(prevState => [...prevState, blob]);
				setNameImg(prevState => [...prevState, file.name]);
			};
			reader.readAsArrayBuffer(file);
		}
	};

	const handleConvert = () => {
		console.log('Imágenes a procesar:', imageLocations);
		if (imageLocations.length > 0) {
			const formData = new FormData();
			formData.append('quality', quality);
			formData.append('width', width);
			imageLocations.forEach((blob, index) => {
				formData.append('image', blob, 'image.png');
			});
			fetch('http://localhost:3000/convertir-imagenes', {
				method: 'POST',
				body: formData
			})
			.then(response => {
				if (!response.ok) {
					throw new Error('Error al convertir imágenes');
				};
				return response.text();
			})
			.then(data => {
				console.log(data); // Muestra el mensaje de éxito del servidor en la consola
			})
			.catch(error => {
				console.error('Error al convertir imágenes:', error);
			});
		} else {
			console.log('No hay imágenes para procesar');
		};
	};

	const handleClick = (index) => {
		const newImageLocations = [...imageLocations];
		const newNameImg = [...nameImg];

		newImageLocations.splice(index, 1);
		newNameImg.splice(index, 1);

		setImageLocations(newImageLocations);
		setNameImg(newNameImg);
	};

	const handleClear = () => {
		setImageLocations([]);
		setNameImg([]);
	};

	const handleFormatedName = (name) => {
		if (name.length > 15) {
			return `${name.substring(0, 15)}...${name.split('.').pop()}`;
		};

		return name;
	};

	return (
		<div id="app" className="app">
			<div id='column1'>
				<div id="drop-area" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
					<p>Arrastra y suelta<br></br>tus imágenes aquí</p>
				</div>
				<div id="input-area">
					<div>
						<label htmlFor="number1">Calidad (%):</label>
						<input type="number" id="number1" name="number1" value={quality} min="1" max="100" onChange={(event) => setQuality(parseInt(event.target.value))} />
					</div>
					<div>
						<label htmlFor="number2">Ancho (px):</label>
						<input type="number" id="number2" name="number2" value={width} min="1" onChange={(event) => setWidth(parseInt(event.target.value))} />
					</div>
				</div>
				<div id="convertBtn">
					<button onClick={handleConvert} disabled={imageLocations.length === 0 && true}>Iniciar</button>
					<button onClick={handleClear} disabled={imageLocations.length === 0 && true}>Limpiar</button>
				</div>
			</div>
			<div id='column2'>
				<div id="imageLocations">
					<h2>Imágenes a procesar:</h2>
					<div id='containerList'>
						<ul id="imageList">
							{imageLocations.map((blob, index) => (
								<li key={index}>
									<div id='containerImg'>
										<img key={index} src={URL.createObjectURL(blob)} alt="Preview" />
									</div>
									<p>{handleFormatedName(nameImg[index])}</p>
									<button id='clearItem' onClick={() => handleClick(index)}>X</button>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};

export default App;