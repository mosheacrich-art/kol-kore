import { readFileSync } from 'fs'

const data = JSON.parse(readFileSync(
  'C:/Users/moshe/Documents/New project 2/data/word-index.json',
  'utf8'
))

const unique = [...new Set(data.words.map(w => w.parasha))]
console.log('Total words:', data.words.length)
console.log('\nParasha names in word-index:')
unique.forEach((name, i) => {
  const count = data.words.filter(w => w.parasha === name).length
  console.log(`  ${String(i+1).padStart(2,'0')}. "${name}"  (${count} words)`)
})
