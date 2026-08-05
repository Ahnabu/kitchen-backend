import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const files = fs.readdirSync(__dirname)
  .filter(file => file.startsWith('test') && file.endsWith('.ts') && file !== 'runAll.ts');

console.log(`🎬 Found ${files.length} test suites to execute.`);

for (const file of files) {
  console.log(`\n======================================================`);
  console.log(`🏃 Running Test Suite: ${file}`);
  console.log(`======================================================`);
  try {
    execSync(`npx tsx "${path.join(__dirname, file)}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`❌ Test Suite ${file} failed!`);
    process.exit(1);
  }
}

console.log('\n🎉 ALL INTEGRATION TEST SUITES PASSED SUCCESSFULLY! 🎉');
