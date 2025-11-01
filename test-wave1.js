// test-wave1.js
console.log('🧪 Testing Wave 1 Implementation...')

const fs = require('fs')
const path = require('path')

const requiredFiles = [
  'types/portal-management.ts',
  'lib/services/portal-manager.ts', 
  'lib/services/progress-tracker.ts',
  'lib/services/unlock-engine.ts',
  'stores/portal-store.ts',
  'hooks/usePortalManagement.ts',
  'lib/ai/ai-service-manager.ts',
  'lib/services/index.ts'
]

console.log('\n📁 Checking Wave 1 files:')
let allFilesExist = true

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file} - MISSING!`)
    allFilesExist = false
  }
})

if (allFilesExist) {
  console.log('\n🎉 All Wave 1 files are present!')
} else {
  console.log('\n⚠️  Some files are missing. Check above.')
}

console.log('\n🔧 Environment check:')
console.log(`✅ SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}`)
console.log(`✅ OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'Set' : 'Missing'}`)

console.log('\n🎯 Wave 1 check complete!')