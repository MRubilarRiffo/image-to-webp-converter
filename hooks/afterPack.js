const fs = require('fs');
const path = require('path');

exports.default = async function (context) {
    const unpackedDir = path.join(context.appOutDir, 'resources', 'app.asar.unpacked', '.next', 'standalone', 'node_modules');
    const sourceDir = path.join(context.packager.projectDir, '.next', 'standalone', 'node_modules');

    console.log(`\n\n[AfterPack Hook] Copiando ${sourceDir} a ${unpackedDir}...`);

    if (fs.existsSync(sourceDir)) {
        fs.cpSync(sourceDir, unpackedDir, { recursive: true });
        console.log('[AfterPack Hook] Copia de node_modules exitosa.\n');

        // El binario precompilado de sharp suele buscar @img en una ruta hermana
        const nodeModulesBuild = path.join(context.packager.projectDir, 'node_modules', '@img');
        const nodeModulesTarget = path.join(unpackedDir, '@img');

        if (fs.existsSync(nodeModulesBuild)) {
            console.log(`[AfterPack Hook] Inyectando binarios nativos de @img...`);
            fs.cpSync(nodeModulesBuild, nodeModulesTarget, { recursive: true, force: true });
        }

    } else {
        console.log('[AfterPack Hook] ¡Atención! No se encontró el directorio de origen.\n');
    }
};
