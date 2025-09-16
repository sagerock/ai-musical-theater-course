#!/usr/bin/env node

/**
 * Feature Status Report Generator
 *
 * Generates a quick status report of all feature requests from GitHub Issues.
 *
 * Usage:
 * GITHUB_TOKEN=your_token node scripts/feature-status.js
 *
 * Or without token (limited to 60 requests/hour):
 * node scripts/feature-status.js
 */

const fs = require('fs');
const path = require('path');

async function fetchIssues(owner = 'sagerock', repo = 'ai-musical-theater-course') {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?labels=feature-request&state=all&per_page=100`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching issues:', error);
    return [];
  }
}

function categorizeIssues(issues) {
  const categories = {
    approved: [],
    inProgress: [],
    experimental: [],
    completed: [],
    rejected: [],
    needsEvaluation: [],
    other: []
  };

  issues.forEach(issue => {
    const labels = issue.labels.map(l => l.name);

    if (labels.includes('completed')) {
      categories.completed.push(issue);
    } else if (labels.includes('rejected')) {
      categories.rejected.push(issue);
    } else if (labels.includes('in-progress')) {
      categories.inProgress.push(issue);
    } else if (labels.includes('experimental')) {
      categories.experimental.push(issue);
    } else if (labels.includes('approved')) {
      categories.approved.push(issue);
    } else if (labels.includes('needs-evaluation')) {
      categories.needsEvaluation.push(issue);
    } else {
      categories.other.push(issue);
    }
  });

  return categories;
}

function calculateMetrics(categories) {
  const totalRequests = Object.values(categories).reduce((sum, cat) => sum + cat.length, 0);
  const approvalRate = totalRequests > 0
    ? ((categories.completed.length + categories.inProgress.length + categories.approved.length) / totalRequests * 100).toFixed(1)
    : 0;

  // Check experimental features for expiration (3 months)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const expiredExperimental = categories.experimental.filter(issue => {
    return new Date(issue.created_at) < threeMonthsAgo;
  });

  return {
    total: totalRequests,
    approvalRate,
    expiredExperimental
  };
}

function generateReport(categories, metrics) {
  const report = [];

  report.push('# Feature Status Report');
  report.push(`\n*Generated: ${new Date().toISOString().split('T')[0]}*\n`);

  // Summary
  report.push('## Summary');
  report.push(`- **Total Feature Requests:** ${metrics.total}`);
  report.push(`- **Approval Rate:** ${metrics.approvalRate}%`);
  report.push(`- **In Progress:** ${categories.inProgress.length}`);
  report.push(`- **Experimental:** ${categories.experimental.length}`);
  if (metrics.expiredExperimental.length > 0) {
    report.push(`- **⚠️ Expired Experimental:** ${metrics.expiredExperimental.length} (need removal)`);
  }
  report.push('');

  // Needs Evaluation
  if (categories.needsEvaluation.length > 0) {
    report.push('## 🔍 Needs Evaluation');
    report.push('| Feature | Requestor | Date | Link |');
    report.push('|---------|-----------|------|------|');
    categories.needsEvaluation.forEach(issue => {
      const date = new Date(issue.created_at).toISOString().split('T')[0];
      const requestor = issue.user.login;
      report.push(`| ${issue.title} | @${requestor} | ${date} | [#${issue.number}](${issue.html_url}) |`);
    });
    report.push('');
  }

  // Approved & Ready
  if (categories.approved.length > 0) {
    report.push('## ✅ Approved & Ready to Build');
    report.push('| Feature | Score | Priority | Link |');
    report.push('|---------|-------|----------|------|');
    categories.approved.forEach(issue => {
      const priority = issue.labels.find(l => l.name.includes('priority'))?.name || 'none';
      report.push(`| ${issue.title} | TBD | ${priority} | [#${issue.number}](${issue.html_url}) |`);
    });
    report.push('');
  }

  // In Progress
  if (categories.inProgress.length > 0) {
    report.push('## 🚧 In Progress');
    report.push('| Feature | Started | Developer | Link |');
    report.push('|---------|---------|-----------|------|');
    categories.inProgress.forEach(issue => {
      const date = new Date(issue.updated_at).toISOString().split('T')[0];
      const assignee = issue.assignee?.login || 'unassigned';
      report.push(`| ${issue.title} | ${date} | @${assignee} | [#${issue.number}](${issue.html_url}) |`);
    });
    report.push('');
  }

  // Experimental
  if (categories.experimental.length > 0) {
    report.push('## 🧪 Experimental Features');
    report.push('| Feature | Started | Expires | Status | Link |');
    report.push('|---------|---------|---------|--------|------|');
    categories.experimental.forEach(issue => {
      const startDate = new Date(issue.created_at);
      const expireDate = new Date(startDate);
      expireDate.setMonth(expireDate.getMonth() + 3);
      const isExpired = expireDate < new Date();
      const status = isExpired ? '⚠️ EXPIRED' : '✅ Active';

      report.push(`| ${issue.title} | ${startDate.toISOString().split('T')[0]} | ${expireDate.toISOString().split('T')[0]} | ${status} | [#${issue.number}](${issue.html_url}) |`);
    });
    report.push('');

    if (metrics.expiredExperimental.length > 0) {
      report.push('### ⚠️ Action Required');
      report.push('These experimental features have expired and should be removed or promoted:');
      metrics.expiredExperimental.forEach(issue => {
        report.push(`- ${issue.title} (#${issue.number})`);
      });
      report.push('');
    }
  }

  // Recent Completions
  const recentCompleted = categories.completed
    .filter(issue => {
      const closedDate = new Date(issue.closed_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return closedDate > thirtyDaysAgo;
    })
    .slice(0, 5);

  if (recentCompleted.length > 0) {
    report.push('## ✅ Recently Completed (Last 30 Days)');
    report.push('| Feature | Completed | Link |');
    report.push('|---------|-----------|------|');
    recentCompleted.forEach(issue => {
      const date = new Date(issue.closed_at).toISOString().split('T')[0];
      report.push(`| ${issue.title} | ${date} | [#${issue.number}](${issue.html_url}) |`);
    });
    report.push('');
  }

  // Statistics
  report.push('## 📊 Statistics');
  report.push('| Status | Count | Percentage |');
  report.push('|--------|-------|------------|');
  const statuses = [
    { name: 'Needs Evaluation', count: categories.needsEvaluation.length },
    { name: 'Approved', count: categories.approved.length },
    { name: 'In Progress', count: categories.inProgress.length },
    { name: 'Experimental', count: categories.experimental.length },
    { name: 'Completed', count: categories.completed.length },
    { name: 'Rejected', count: categories.rejected.length },
  ];

  statuses.forEach(status => {
    const percentage = metrics.total > 0
      ? (status.count / metrics.total * 100).toFixed(1)
      : 0;
    report.push(`| ${status.name} | ${status.count} | ${percentage}% |`);
  });

  return report.join('\n');
}

async function main() {
  console.log('📊 Generating feature status report...\n');

  const issues = await fetchIssues();
  if (issues.length === 0) {
    console.log('No feature requests found or error fetching issues.');
    return;
  }

  const categories = categorizeIssues(issues);
  const metrics = calculateMetrics(categories);
  const report = generateReport(categories, metrics);

  // Save to file
  const outputPath = path.join(__dirname, '..', 'docs', 'FEATURE_STATUS_REPORT.md');
  fs.writeFileSync(outputPath, report);

  console.log('✅ Report generated successfully!');
  console.log(`📄 Saved to: ${outputPath}\n`);

  // Print summary to console
  console.log('Summary:');
  console.log(`  Total Requests: ${metrics.total}`);
  console.log(`  Approval Rate: ${metrics.approvalRate}%`);
  console.log(`  In Progress: ${categories.inProgress.length}`);
  console.log(`  Experimental: ${categories.experimental.length}`);

  if (metrics.expiredExperimental.length > 0) {
    console.log(`\n⚠️  WARNING: ${metrics.expiredExperimental.length} experimental features have expired!`);
    metrics.expiredExperimental.forEach(issue => {
      console.log(`  - ${issue.title} (#${issue.number})`);
    });
  }

  if (categories.needsEvaluation.length > 0) {
    console.log(`\n🔍 ${categories.needsEvaluation.length} features need evaluation`);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fetchIssues, categorizeIssues, calculateMetrics, generateReport };