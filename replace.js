const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (f === 'node_modules' || f === '.next' || f === '.git') return;
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('c:/xampp/htdocs/ExtintoresApp/src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content
      .replace(/blue-400/g, 'red-400')
      .replace(/blue-500/g, 'red-600')
      .replace(/blue-600/g, 'red-700')
      .replace(/blue-700/g, 'red-800')
      .replace(/orange-400/g, 'red-400')
      .replace(/orange-500/g, 'red-600')
      .replace(/orange-600/g, 'red-700')
      .replace(/FireControl/g, 'Menendez');
      
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      console.log('Updated ' + filePath);
    }
  }
});
