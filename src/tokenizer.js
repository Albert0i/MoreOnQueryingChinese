import tokenizer from 'chinese-tokenizer';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
// Resolve dictionary path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dictPath = path.join(__dirname, '..', 'src', 'dictionary', 'cedict_ts.u8');

// Load the dictionary and get the tokenizer instance
const segment = tokenizer.loadFile(dictPath);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '📝 Your input> '
});

console.log('Type something (Ctrl+C to exit):');
rl.prompt();

rl.on('line', (line) => {
  //console.log(`🔁 You said: "${line.trim()}"`);
  const tokens = segment(line);
  // Print segmented result
  console.log('Segmented:', tokens.map(t => t.text).join(' '));
  // Print spaced result
  console.log('Spaced:', spaceChineseChars(line));
  console.log()
  rl.prompt();
}).on('close', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});

/*
function spaceChineseChars(text) {
    return text.replace(/([\u4e00-\u9fff])/g, '$1 ');
}
*/
function spaceChineseChars(text) {
  // Match Chinese characters individually, and English words as a whole
  const pattern = /[\u4e00-\u9fff]|[a-zA-Z0-9]+/g;
  const tokens = text.match(pattern);
  return tokens ? tokens.join(' ') : '';
}
/*
「兒子生性病母倍感安慰。」
「下雨天，留客天，天留我不留。」

「新君雖痛改前非，懷念手足憐弟寂寞，要歸藩承命排紛解難，保平安。」
「新君雖痛改，全非懷念手足。憐弟植，莫要歸藩承命。排紛解，難保平安。」
[粵劇名作欣賞-《洛神》研討會節錄](https://www.edb.gov.hk/attachment/tc/curriculum-development/kla/arts-edu/resources/mus-curri/com_masterwork3.pdf)
*/