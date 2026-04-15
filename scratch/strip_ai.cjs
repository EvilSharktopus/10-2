const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/stops-content-v4.json');
let data = fs.readFileSync(filePath, 'utf8');
let json = JSON.parse(data);

function processNode(node) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      processNode(node[i]);
    }
  } else if (typeof node === 'object' && node !== null) {
    if ('ai_proof_note' in node) {
      delete node.ai_proof_note;
    }
    for (const key in node) {
      if (typeof node[key] === 'string') {
        let str = node[key];
        
        // Remove AI-proof phrasing
        str = str.replace(/This one is AI-proof — /ig, '');
        str = str.replace(/These questions are AI-proof — they're about YOU specifically\.?/ig, '');
        str = str.replace(/These are AI-proof — they're about YOUR specific life\.?/ig, '');
        str = str.replace(/This is AI-proof — it needs to be grounded in YOUR opinion from YOUR learning in this course\.?/ig, '');
        str = str.replace(/An AI cannot fake that\./ig, '');
        str = str.replace(/⚠️ This one is AI-proof — /ig, '');

        // Remove "in your own words" and "copy pasting"
        str = str.replace(/Type each definition in your own words\. No copying and pasting\./ig, 'Type each definition.');
        str = str.replace(/Type your answers\. No copy-paste\./ig, 'Type your answers.');
        str = str.replace(/In your own words — /ig, '');
        str = str.replace(/ — in your own words/ig, '');
        str = str.replace(/in your own words,/gi, '');
        str = str.replace(/, in your own words/gi, '');
        str = str.replace(/in your own words/gi, '');
        str = str.replace(/Use your own words\./gi, '');
        str = str.replace(/No copying and pasting\./gi, '');
        str = str.replace(/No copy-paste\./gi, '');
        str = str.replace(/ — no copying from your earlier answer/gi, '');
        str = str.replace(/ — no copying/gi, '');

        // Clean up any double spaces, trailing spaces, or hanging commas
        str = str.replace(/  +/g, ' ').trim();
        str = str.replace(/^— /g, ''); // if it left a weird em-dash at the start
        
        node[key] = str;
      } else {
        processNode(node[key]);
      }
    }
  }
}

processNode(json);

fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
console.log('Successfully stripped all AI and copying references!');
