const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          // Process .ts and .tsx files
          if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
          }
          next();
        }
      });
    })();
  });
}

const srcDir = path.resolve(__dirname, 'src');

walk(srcDir, (err, files) => {
  if (err) throw err;
  files.forEach(file => {
    console.log(`Processing ${file}...`);
    const code = fs.readFileSync(file, 'utf8');
    const isTSX = file.endsWith('.tsx');
    
    try {
      const result = babel.transformSync(code, {
        filename: file,
        plugins: [
          require('@babel/plugin-syntax-jsx'),
          [
            require('@babel/plugin-transform-typescript'),
            {
              isTSX: true,
              allExtensions: true
            }
          ]
        ],
        retainLines: true,
        comments: true,
        configFile: false,
        babelrc: false
      });
      
      const newExt = isTSX ? '.jsx' : '.js';
      const newFile = file.substring(0, file.lastIndexOf('.')) + newExt;
      
      fs.writeFileSync(newFile, result.code, 'utf8');
      
      // Delete original typescript file
      fs.unlinkSync(file);
      
    } catch (e) {
      console.error(`Failed to transpile ${file}:`, e);
    }
  });
  console.log("Cleanup and Conversion Complete!");
});
