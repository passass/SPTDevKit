// scripts/start.js
import { spawn } from 'child_process'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log('🚀 Choose mode:')
console.log('1. Only Vite server (web)')
console.log('2. Only Electron (without server)')
console.log('3. Electron + Vite (development)')

rl.question('Select mode (1/2/3): ', (answer) => {
  let command = ''
  
  switch(answer) {
    case '1':
      console.log('Starting Vite server...')
      command = 'vite'
      break
    case '2':
      console.log('Starting Electron...')
      command = 'electron .'
      break
    case '3':
      console.log('Starting Electron + Vite...')
      command = 'vite & electron .'
      break
    default:
      console.log('Invalid choice. Starting Vite server...')
      command = 'vite'
  }
  
  const child = spawn(command, {
    stdio: 'inherit',
    shell: true
  })
  
  rl.close()
})