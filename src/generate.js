import fs from 'fs'
import path from 'path'
import { generateRandomString, mapSize } from './test-utils/generate-random-string.js'
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import tests from './tests.js';

const __dirname = dirname(fileURLToPath(import.meta.url))

function generateR({ size, numberOfDeps, depth, currentDepth, currentChild, parent, outputPath }) {

  if (currentDepth > depth) {
    return null;
  }

  const sb = [];

  const fileName = `script${parent}${currentChild}.js`

  for (let j = 0; j < numberOfDeps; j++) {
    const child = generateR({ size, numberOfDeps, depth, parent: `${parent}${currentChild}`, currentDepth: currentDepth + 1, currentChild: j, outputPath })
    if (child) {
      sb.push(`import'./${child}'`)
    }
  }

  for (let i = 0; i < size; i++) {
    sb.push(`export const text${i} = "${generateRandomString("1kb")}";`);
  }

  fs.writeFileSync(path.resolve(`${outputPath}/${fileName}`), sb.join('\n'))

  return fileName;
}

function generate({ size, numberOfDeps, depth, outputDir }) {

  const outputPath = path.resolve(`${__dirname}/../dist/${outputDir}/`)
  fs.mkdirSync(outputPath, { recursive: true });

  let totalNumberOfFiles = 0;

  for (let i = 1; i <= depth + 1; i++) {
    totalNumberOfFiles += numberOfDeps ** i;
  }

  const requestedSize = mapSize(size) / 1024;
  const fileSizeInKb = Math.floor(requestedSize / totalNumberOfFiles);

  const diffInKb = (requestedSize - totalNumberOfFiles * fileSizeInKb);

  const diffPayload = generateRandomString(`${diffInKb}kb`);

  console.log(`${numberOfDeps}-${depth}`)
  console.log('totalNumberOfFiles', totalNumberOfFiles)
  console.log('fileSize', fileSizeInKb, 'kb')
  console.log('diffInKb', diffInKb, 'kb')
  console.log('totalSize', diffInKb + totalNumberOfFiles * fileSizeInKb, 'kb')

  const imports = [];

  for (let j = 0; j < numberOfDeps; j++) {
    const child = generateR({ size: fileSizeInKb, numberOfDeps, depth, parent: '', currentChild: j, currentDepth: 0, outputPath })
    if (child) {
      imports.push(`import'./${child}'`)
    }
  }

  fs.writeFileSync(path.resolve(`${outputPath}/index.js`), `

${imports.join('\n')}

const diffPayload = "${diffPayload}";

window.reportLoad();
`)

  fs.writeFileSync(path.resolve(`${outputPath}/index.html`), `
<html>
  <script>
    const start = new Date();

    function reportLoad() {
      const end = new Date();

      const duration = end.getTime() - start.getTime();

      console.log("duration:", duration)
      document.getElementById('duration').innerHTML = duration + 'ms'; 
    }
  </script>
  <script type="module" src="./index.js"></script>
  <body>
    <h1 id="duration"></h1>
  </body>
</html>
`)
}

tests.map(generate)

