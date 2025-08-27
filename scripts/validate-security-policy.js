#!/usr/bin/env node

/**
 * Security Policy Validation Script
 * Validates that the SECURITY.md file contains all required sections
 */

const fs = require('fs');
const path = require('path');

const SECURITY_FILE = path.join(__dirname, '..', 'SECURITY.md');
const REQUIRED_SECTIONS = [
  'Reporting Security Vulnerabilities',
  'How to Report a Security Vulnerability',
  'Response Timeline',
  'Supported Versions',
  'Security Considerations for QNCE Engine',
  'For Library Users',
  'For Contributors',
  'Known Security Considerations',
  'Dependencies',
];

const REQUIRED_CONTENT = [
  'GitHub Security Advisories',
  'Input Validation',
  'State Serialization Security',
  'XSS Prevention',
  'CLI Tool Security',
  'npm audit',
  'Semantic Versioning',
];

function validateSecurityPolicy() {
  console.log('🔒 Validating Security Policy...\n');
  
  if (!fs.existsSync(SECURITY_FILE)) {
    console.error('❌ SECURITY.md file not found');
    process.exit(1);
  }
  
  const content = fs.readFileSync(SECURITY_FILE, 'utf8');
  
  // Check required sections
  console.log('Checking required sections:');
  let missingsections = 0;
  
  REQUIRED_SECTIONS.forEach(section => {
    if (content.includes(section)) {
      console.log(`  ✅ ${section}`);
    } else {
      console.log(`  ❌ Missing: ${section}`);
      missingSection++;
    }
  });
  
  // Check required content
  console.log('\nChecking required content:');
  let missingContent = 0;
  
  REQUIRED_CONTENT.forEach(item => {
    if (content.includes(item)) {
      console.log(`  ✅ ${item}`);
    } else {
      console.log(`  ❌ Missing: ${item}`);
      missingContent++;
    }
  });
  
  // Check file size (should be comprehensive)
  const lines = content.split('\n').length;
  console.log(`\nFile statistics:`);
  console.log(`  📄 Lines: ${lines}`);
  console.log(`  📏 Characters: ${content.length}`);
  
  if (lines < 100) {
    console.log('  ⚠️  Warning: Security policy seems short (< 100 lines)');
  } else {
    console.log('  ✅ Security policy is comprehensive');
  }
  
  // Final result
  const totalIssues = missingContent + missingContent;
  if (totalIssues === 0) {
    console.log('\n🎉 Security policy validation passed!');
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