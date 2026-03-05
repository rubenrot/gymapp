const fs = require('fs');
const d = fs.readFileSync('src/data/workoutData.js', 'utf8');

// Check for corrupted characters (Ã is char 195, common in double-encoded UTF-8)
const hasBadChars = d.indexOf(String.fromCharCode(195)) >= 0;
console.log('Has corrupted chars (Ã):', hasBadChars);

// Check correct characters exist
console.log('Has Día:', d.includes('Día'));
console.log('Has Tríceps:', d.includes('Tríceps'));
console.log('Has Tirón:', d.includes('Tirón'));
console.log('Has máquina:', d.includes('máquina'));
console.log('Has Extensión:', d.includes('Extensión'));
console.log('Has Bíceps:', d.includes('Bíceps'));
console.log('Has Técnica:', d.includes('Técnica'));
console.log('Has Jalón:', d.includes('Jalón'));
console.log('Has cuádriceps:', d.includes('cuádriceps'));
console.log('Has francés:', d.includes('francés'));
console.log('Has → arrow:', d.includes('→'));
console.log('Has – dash:', d.includes('–'));

// Print the name fields
const names = d.match(/name: '([^']+)'/g);
if (names) {
    console.log('\nAll name values:');
    names.forEach(n => console.log(' ', n));
}
