# Image Converter (Next.js + Electron)

Una aplicación de escritorio de alto rendimiento para convertir y optimizar imágenes a formatos modernos como WebP y AVIF, incluyendo redimensionamiento escalado.

El proyecto está construido originalmente con **Next.js** y la librería nativa de manipulación de imágenes **Sharp**, para ser luego envuelta nativamente como una aplicación de escritorio multiplataforma usando **Electron**.

## Requisitos previos

- **Node.js**: (Recomendado v18 o superior)
- **Git**

## Configuración del Entorno de Desarrollo (Windows)

Dado que la aplicación depende de **Sharp** y se compila para Electron utilizando el compilador nativo de Node.js, es imperativo asegurar que se descarguen las dependencias pre-compiladas correctas para la plataforma de destino (`win32-x64`).

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/MRubilarRiffo/image-to-webp-converter.git
   cd image-to-webp-converter
   ```

2. **Instalar dependencias generales:**
   ```bash
   npm install
   ```

3. **Re-instalar Sharp forzando los binarios para Windows x64:**
   > **⚠️ MUY IMPORTANTE:** Si este paso no se realiza, la aplicación compilará, pero lanzará un error silencioso (`Could not load the "sharp" module`) al intentar realizar una conversión de imagen.
   ```bash
   npm install --os=win32 --cpu=x64 sharp
   ```

## Ejecución en Modo Desarrollo

Para lanzar la aplicación en modo desarrollo (donde Electron abrirá una ventana conectada al servidor de desarrollo de Next.js que soporta Hot-Reloading):

1. En una terminal, levanta el entorno de la aplicación de escritorio:
   ```bash
   npm run electron:dev
   ```

> *Nota: esto levantará instanciadamente el marco de Next.js. Verás los registros en la terminal mientras arranca.*

## Empaquetando para Producción (Windows `.exe`)

Para crear un instalador final destinado a la distribución:

1. Ejecuta el empaquetador de Electron automatizado:
   ```bash
   npm run electron:build
   ```

2. **Detalles técnicos del Build:**
   Durante este proceso, ocurrirán varias fases mágicas automatizadas en el fondo `next.config.mjs` y `main.js`:
   - Next.js renderizará un build `standalone` altamente optimizado.
   - Electron empaquetará la aplicación bajo el formato `.asar`.
   - Se ejecutará automáticamente un hook (`hooks/afterPack.js`) que insertará físicamente los módulos nativos de `sharp` dentro del desempaquetado de producción de la aplicación (saltando la protección de Electron-builder que omite dependencias anidadas precompiladas).

3. El resultado final del instalador lo encontrarás en el directorio `dist/`, bajo el nombre referencial `Image Converter Setup X.X.X.exe`.

## Tecnologías Principales Empleadas
- **Next.js** (App Router y API Routes)
- **React 19** 
- **Electron.js** & **Electron Builder**
- **Sharp** (Engine en C++ de ultra alta velocidad para formato visual)
