#!/usr/bin/env node

/*
  Security Policy Validator
  - Checks for required sections in SECURITY.md
  - Performs a few simple content validations
  - Prints basic file statistics
  - Exits with non‑zero code if validation fails when run directly
*/

const fs = require('fs');
const path = require('path');
function readSecurityMd() {
  const candidatePaths = [
    path.join(process.cwd(), 'SECURITY.md'),
    path.join(process.cwd(), 'docs', 'SECURITY.md'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return { filePath: p, content: fs.readFileSync(p, 'utf8') };
    }
  }
  return { filePath: candidatePaths[0], content: null };
}

function validateSecurityPolicy() {
  const { filePath, content } = readSecurityMd();

  console.log('\n🔎 Validating security policy…');
  console.log(`• File: ${filePath}`);

  if (!content) {
    console.log('❌ SECURITY.md not found');
    return false;
  }

  // Required sections (case-insensitive, can appear as # or ##)
  const requiredSections = [
    'security policy',
    'reporting a vulnerability',
    'supported versions',
  ];

  let missingSection = 0;
  for (const section of requiredSections) {
    const present = new RegExp(`^\s*#{1,6}.*${section}.*$`, 'mi').test(content);
    if (!present) {
      console.log(`⚠️  Missing section: ${section}`);
      missingSection += 1;
    }
  }

  // Simple content checks
  let missingContent = 0;
  const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(content);
  const hasUrl = /https?:\/\//i.test(content);
  const mentionsDisclosure = /(coordinated|responsible)\s+disclosure/i.test(content);

  if (!hasEmail && !hasUrl) {
    console.log('⚠️  No contact method found (email or URL)');
    missingContent += 1;
  }
  if (!mentionsDisclosure) {
    console.log('⚠️  Disclosure policy not mentioned');
    missingContent += 1;
  }

  // File statistics
  const lines = content.split('\n').length;
  console.log('\nFile statistics:');
  console.log(` • Lines: ${lines}`);
  console.log(` • Characters: ${content.length}`);
  if (lines < 100) {
    console.log(' ⚠️  Warning: Security policy seems short (< 100 lines)');
  } else {
    console.log(' ✅ Security policy is comprehensive');
  }

  // Final result (bugfix: missingSection + missingContent)
  const totalIssues = missingSection + missingContent;
  if (totalIssues === 0) {
    console.log('\n✅ Security policy validation passed!');
    return true;
  } else {
    console.log(`\n❌ Security policy validation failed with ${totalIssues} issues`);
    return false;
  }
}

if (require.main === module) {
  const success = validateSecurityPolicy();
  process.exit(success ? 0 : 1);
}
module.exports = { validateSecurityPolicy };
