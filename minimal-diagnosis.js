// 🔍 PorVerse Wave 1 Quick Diagnosis
console.log('🔍 PorVerse Wave 1 Quick Diagnosis\n');

const fs = require('fs');

// 1. Check critical files
console.log('📁 CRITICAL FILES:');
const files = ['.env.local', 'package.json', 'types/portal-management.ts'];
files.forEach(file => {
  if (fs.existsSync(file)) {
    const size = fs.statSync(file).size;
    console.log(`✅ ${file} (${size} bytes)`);
  } else {
    console.log(`❌ ${file} MISSING`);
  }
});

// 2. Environment check
console.log('\n🔧 ENVIRONMENT:');
if (fs.existsSync('.env.local')) {
  const env = fs.readFileSync('.env.local', 'utf8');
  const hasSupabase = env.includes('NEXT_PUBLIC_SUPABASE_URL=') && !env.includes('your_');
  const hasOpenAI = env.includes('OPENAI_API_KEY=') && !env.includes('your_');
  console.log(`${hasSupabase ? '✅' : '❌'} SUPABASE_URL: ${hasSupabase ? 'Set' : 'Missing/Placeholder'}`);
  console.log(`${hasOpenAI ? '✅' : '❌'} OPENAI_API_KEY: ${hasOpenAI ? 'Set' : 'Missing/Placeholder'}`);
} else {
  console.log('❌ .env.local not found');
}

// 3. Dependencies check
console.log('\n📦 DEPENDENCIES:');
if (fs.existsSync('package.json')) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = {...pkg.dependencies, ...pkg.devDependencies};
  ['zustand', '@supabase/supabase-js', 'openai'].forEach(dep => {
    console.log(`${deps[dep] ? '✅' : '❌'} ${dep}: ${deps[dep] || 'Missing'}`);
  });
}

console.log('\n🎯 DIAGNOSIS COMPLETE');


