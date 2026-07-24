const fs = require('fs');
const path = require('path');
const filePath = path.join(process.cwd(), 'src/utils/constants.js');
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  const replaced = content
    .replace(/sk-proj-[A-Za-z0-9_-]+/g, 'sk-proj-REPLACED')
    .replace(/AIzaSy[A-Za-z0-9_-]+/g, 'AIzaSyREPLACED')
    .replace(/['"][A-Za-z0-9]{32,}['"]/g, "'REPLACED'");
  if (replaced !== content) {
    fs.writeFileSync(filePath, replaced, 'utf8');
  }
}
