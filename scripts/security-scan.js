
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting security scan...');

// Define security patterns to check for
const securityPatterns = [
  {
    pattern: /password\s*=\s*["'][\w]+["']/gi,
    message: 'Hardcoded password detected',
    severity: 'HIGH'
  },
  {
    pattern: /api[_-]?key\s*=\s*["'][\w-]+["']/gi,
    message: 'Hardcoded API key detected',
    severity: 'HIGH'
  },
  {
    pattern: /secret\s*=\s*["'][\w-]+["']/gi,
    message: 'Hardcoded secret detected',
    severity: 'HIGH'
  },
  {
    pattern: /eval\s*\(/gi,
    message: 'Use of eval() function detected',
    severity: 'MEDIUM'
  },
  {
    pattern: /innerHTML\s*=/gi,
    message: 'Use of innerHTML detected (potential XSS)',
    severity: 'LOW'
  }
];

// Files to exclude from scanning
const excludePatterns = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/
];

function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  const supportedExts = ['.js', '.ts', '.tsx', '.jsx', '.vue', '.html'];
  
  if (!supportedExts.includes(ext)) return false;
  
  return !excludePatterns.some(pattern => pattern.test(filePath));
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    securityPatterns.forEach(({ pattern, message, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            file: filePath,
            severity,
            message,
            match: match.trim(),
            line: content.substring(0, content.indexOf(match)).split('\n').length
          });
        });
      }
    });
    
    return issues;
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message);
    return [];
  }
}

function scanDirectory(dir) {
  const issues = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!excludePatterns.some(pattern => pattern.test(fullPath))) {
          issues.push(...scanDirectory(fullPath));
        }
      } else if (shouldScanFile(fullPath)) {
        issues.push(...scanFile(fullPath));
      }
    });
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }
  
  return issues;
}

// Start scanning
const startTime = Date.now();
const issues = scanDirectory(process.cwd());
const endTime = Date.now();

// Generate report
console.log('\n📊 Security Scan Results');
console.log('========================');
console.log(`Scan completed in ${endTime - startTime}ms`);
console.log(`Total issues found: ${issues.length}`);

if (issues.length > 0) {
  const grouped = issues.reduce((acc, issue) => {
    if (!acc[issue.severity]) acc[issue.severity] = [];
    acc[issue.severity].push(issue);
    return acc;
  }, {});
  
  ['HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
    if (grouped[severity]) {
      console.log(`\n🚨 ${severity} Issues (${grouped[severity].length}):`);
      grouped[severity].forEach(issue => {
        console.log(`  📁 ${issue.file}:${issue.line}`);
        console.log(`     ${issue.message}`);
        console.log(`     "${issue.match}"`);
      });
    }
  });
  
  // Exit with error if high severity issues found
  if (grouped.HIGH && grouped.HIGH.length > 0) {
    console.log('\n❌ Security scan failed due to high severity issues!');
    process.exit(1);
  }
} else {
  console.log('\n✅ No security issues detected!');
}

console.log('\nSecurity scan completed.');
