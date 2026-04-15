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
    for (const key in node) {
      if (typeof node[key] === 'string') {
        let str = node[key];
        
        // Replace exact word matches for Stop and Stops
        str = str.replace(/\bStop\b/g, 'Checkpoint');
        str = str.replace(/\bStops\b/g, 'Checkpoints');
        str = str.replace(/\bstop\b(?!_)/g, ''); // wait, lowercase "stop" could be used naturally like "stop working". Let's not blindly replace lowercase unless it's followed by a number.
        
        node[key] = str;
      } else {
        processNode(node[key]);
      }
    }
  }
}

// Safer targeted replacement: only target "Stop(s)" or "stop(s)" when it is referencing the learning structure.
// Usually capitalized "Stop " followed by a number, or "Stops".
function processNodeSafely(node) {
   if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      processNodeSafely(node[i]);
    }
  } else if (typeof node === 'object' && node !== null) {
    for (const key in node) {
      // Don't modify keys like `id`, `type`, `after_stop`, etc.
      // We only care about user-facing text
      if (['id', 'type', 'after_stop', 'stop', 'question_type', 'task_type'].includes(key)) continue;

      if (typeof node[key] === 'string') {
        let str = node[key];
        
        // This regex looks for Stop or Stops (case sensitive) when referring to the modules
        // e.g. "Stop 1", "Stops 1 and 2", "across all of Stop 3", "Stop 3 Vocabulary Review"
        str = str.replace(/\bStop\b/g, 'Checkpoint');
        str = str.replace(/\bStops\b/g, 'Checkpoints');
        
        // If there are lowercase references like "stop 1" or "stops 1, 2"
        str = str.replace(/\bstop (?=\d)/g, 'checkpoint ');
        str = str.replace(/\bstops (?=\d)/g, 'checkpoints ');

        node[key] = str;
      } else {
        processNodeSafely(node[key]);
      }
    }
  }
}

processNodeSafely(json);

fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
console.log('Successfully replaced all Stop references with Checkpoint in data!');
