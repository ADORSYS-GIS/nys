const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '..', 'README.md');
const docsDir = path.join(__dirname, '..', 'docs', 'readme-pages');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

const readme = fs.readFileSync(readmePath, 'utf-8');
const lines = readme.split('\n');

let pages = [];
let current = [];
let currentTitle = '';
for (let line of lines) {
  if (line.startsWith('## ')) {
    if (current.length > 0) {
      pages.push({ title: currentTitle, content: current.join('\n') });
      current = [];
    }
    currentTitle = line.replace(/^##\s*/, '').trim();
    current.push(line);
  } else {
    current.push(line);
  }
}
if (current.length > 0) {
  pages.push({ title: currentTitle, content: current.join('\n') });
}

// Write each page
pages.forEach((page, idx) => {
  const filename = `page-${idx + 1}.md`;
  fs.writeFileSync(path.join(docsDir, filename), page.content, 'utf-8');
});

// Generate navigation index
let summary = '# Documentation Pages\n\n';
pages.forEach((page, idx) => {
  const filename = `page-${idx + 1}.md`;
  summary += `- [${page.title || 'Introduction'}](./readme-pages/${filename})\n`;
});
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'README_SPLIT_SUMMARY.md'), summary, 'utf-8');

console.log('README.md split into', pages.length, 'pages in docs/readme-pages/.');