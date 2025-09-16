#!/usr/bin/env node

/**
 * Setup GitHub Labels for Feature Management
 *
 * This script creates the labels needed for the feature management workflow.
 *
 * Usage:
 * 1. Get a GitHub personal access token from: https://github.com/settings/tokens
 * 2. Run: GITHUB_TOKEN=your_token_here node scripts/setup-github-labels.js
 *
 * Or manually create these labels in GitHub UI:
 * Settings → Labels → New Label
 */

const labels = [
  // Status Labels (Main Workflow)
  {
    name: 'needs-evaluation',
    color: '1f77b4',
    description: '🔍 New feature request awaiting evaluation'
  },
  {
    name: 'approved',
    color: '0e8a16',
    description: '✅ Approved for development (score ≥ 3.5)'
  },
  {
    name: 'in-progress',
    color: 'ffd93d',
    description: '🚧 Currently being developed'
  },
  {
    name: 'experimental',
    color: '9b59b6',
    description: '🧪 In beta testing (3-month limit)'
  },
  {
    name: 'completed',
    color: '2e7d32',
    description: '✅ Feature completed and deployed'
  },
  {
    name: 'rejected',
    color: 'd73a4a',
    description: '❌ Did not meet evaluation criteria'
  },

  // Priority Labels
  {
    name: 'priority-high',
    color: 'd73a4a',
    description: '🔴 Critical or blocking issue'
  },
  {
    name: 'priority-medium',
    color: 'fbca04',
    description: '🟡 Important but not blocking'
  },
  {
    name: 'priority-low',
    color: '0e8a16',
    description: '🟢 Nice to have'
  },

  // Category Labels
  {
    name: 'core-feature',
    color: '000000',
    description: '🎯 Essential platform functionality'
  },
  {
    name: 'enhancement',
    color: 'a2eeef',
    description: '⚡ Improves existing features'
  },
  {
    name: 'instructor-request',
    color: 'ff9800',
    description: '👩‍🏫 Requested by instructor'
  },

  // Additional Useful Labels
  {
    name: 'needs-discussion',
    color: 'd876e3',
    description: '💬 Requires team discussion'
  },
  {
    name: 'breaking-change',
    color: 'b60205',
    description: '⚠️ Will require migration or break existing functionality'
  },
  {
    name: 'quick-win',
    color: '7ed321',
    description: '🎯 Can be implemented in < 2 hours'
  }
];

async function setupLabels() {
  const token = process.env.GITHUB_TOKEN;
  const owner = 'sagerock';
  const repo = 'ai-musical-theater-course';

  if (!token) {
    console.error('❌ No GitHub token provided!');
    console.log('\nTo create labels automatically:');
    console.log('1. Go to: https://github.com/settings/tokens');
    console.log('2. Generate a token with "repo" scope');
    console.log('3. Run: GITHUB_TOKEN=your_token node scripts/setup-github-labels.js\n');

    console.log('Or create these labels manually in GitHub:');
    console.log('----------------------------------------');
    labels.forEach(label => {
      console.log(`\n📌 ${label.name}`);
      console.log(`   Color: #${label.color}`);
      console.log(`   Description: ${label.description}`);
    });
    return;
  }

  console.log('🚀 Setting up GitHub labels...\n');

  for (const label of labels) {
    try {
      // Try to create the label
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/labels`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(label)
        }
      );

      if (response.status === 201) {
        console.log(`✅ Created label: ${label.name}`);
      } else if (response.status === 422) {
        // Label already exists, try to update it
        const updateResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/labels/${label.name}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              color: label.color,
              description: label.description
            })
          }
        );

        if (updateResponse.ok) {
          console.log(`📝 Updated existing label: ${label.name}`);
        } else {
          console.log(`⚠️  Could not update label: ${label.name}`);
        }
      } else {
        const error = await response.json();
        console.log(`❌ Failed to create label ${label.name}: ${error.message}`);
      }
    } catch (error) {
      console.log(`❌ Error with label ${label.name}: ${error.message}`);
    }
  }

  console.log('\n✨ Label setup complete!');
  console.log('\nNext steps:');
  console.log('1. Go to: https://github.com/sagerock/ai-musical-theater-course/labels');
  console.log('2. Verify all labels are created');
  console.log('3. Start using them on feature request issues');
}

// Run if executed directly
if (require.main === module) {
  setupLabels().catch(console.error);
}

module.exports = { labels, setupLabels };