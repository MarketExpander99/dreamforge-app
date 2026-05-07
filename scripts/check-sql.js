const fs = require('fs');

function checkSQLFile() {
  const content = fs.readFileSync('scripts/sprint2-content-seeding.sql', 'utf8');
  const lines = content.split('\n');
  let invalidDifficulties = [];
  let syntaxErrors = [];
  let otherIssues = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Check for invalid difficulty values based on table context
    const difficultyMatches = line.match(/'beginner'|'intermediate'|'advanced'|'easy'|'hard'/g);
    if (difficultyMatches) {
      difficultyMatches.forEach(match => {
        // Determine which table context we're in
        const prevContent = content.substring(0, content.indexOf(line));
        const lastAssessmentQuestions = prevContent.lastIndexOf('INSERT INTO assessment_questions');
        const lastContentItems = prevContent.lastIndexOf('INSERT INTO content_items');
        const lastLessonPlans = prevContent.lastIndexOf('INSERT INTO lesson_plans');

        let currentTable = 'unknown';
        if (lastAssessmentQuestions > lastContentItems && lastAssessmentQuestions > lastLessonPlans) {
          currentTable = 'assessment_questions';
        } else if (lastContentItems > lastAssessmentQuestions && lastContentItems > lastLessonPlans) {
          currentTable = 'content_items';
        } else if (lastLessonPlans > lastAssessmentQuestions && lastLessonPlans > lastContentItems) {
          currentTable = 'lesson_plans';
        }

        // Check constraints based on table
        if (currentTable === 'assessment_questions') {
          // assessment_questions allows: 'easy', 'intermediate', 'hard'
          if (match === "'beginner'" || match === "'advanced'") {
            invalidDifficulties.push({
              line: lineNumber,
              value: match,
              table: 'assessment_questions',
              issue: 'assessment_questions only allows easy/intermediate/hard',
              context: line.trim().substring(0, 100)
            });
          }
        } else if (currentTable === 'content_items') {
          // content_items allows: 'beginner', 'intermediate', 'advanced'
          if (match === "'easy'" || match === "'hard'") {
            invalidDifficulties.push({
              line: lineNumber,
              value: match,
              table: 'content_items',
              issue: 'content_items only allows beginner/intermediate/advanced',
              context: line.trim().substring(0, 100)
            });
          }
        } else if (currentTable === 'lesson_plans') {
          // lesson_plans - check what constraint it has
          if (match === "'easy'" || match === "'hard'") {
            invalidDifficulties.push({
              line: lineNumber,
              value: match,
              table: 'lesson_plans',
              issue: 'lesson_plans difficulty constraint unknown',
              context: line.trim().substring(0, 100)
            });
          }
        }
      });
    }

    // Check for potential syntax issues
    if (line.includes('ARRAY[') && !line.includes(']')) {
      syntaxErrors.push({
        line: lineNumber,
        issue: 'Unclosed ARRAY',
        context: line.trim()
      });
    }

    // Check for missing semicolons on INSERT statements
    if (line.trim().startsWith('INSERT INTO') && !content.substring(content.indexOf(line)).includes(';')) {
      // This is a basic check - the actual semicolon might be on a different line
    }

    // Check for content_items with 'beginner' or 'advanced' difficulty
    if (line.includes('content_items') && (line.includes("'beginner'") || line.includes("'advanced'"))) {
      otherIssues.push({
        line: lineNumber,
        issue: 'content_items table uses invalid difficulty values',
        context: line.trim().substring(0, 100)
      });
    }
  });

  console.log('=== SQL File Analysis ===\n');

  if (invalidDifficulties.length > 0) {
    console.log('❌ INVALID DIFFICULTY VALUES FOUND:');
    invalidDifficulties.forEach(item => {
      console.log(`  Line ${item.line}: ${item.value}`);
      console.log(`    Context: ${item.context}...`);
    });
    console.log('');
  } else {
    console.log('✅ No invalid difficulty values found in assessment_questions.\n');
  }

  if (syntaxErrors.length > 0) {
    console.log('❌ SYNTAX ERRORS FOUND:');
    syntaxErrors.forEach(item => {
      console.log(`  Line ${item.line}: ${item.issue}`);
      console.log(`    Context: ${item.context}`);
    });
    console.log('');
  } else {
    console.log('✅ No obvious syntax errors found.\n');
  }

  if (otherIssues.length > 0) {
    console.log('⚠️  OTHER ISSUES FOUND:');
    otherIssues.forEach(item => {
      console.log(`  Line ${item.line}: ${item.issue}`);
      console.log(`    Context: ${item.context}...`);
    });
    console.log('');
  }

  // Summary
  const totalIssues = invalidDifficulties.length + syntaxErrors.length + otherIssues.length;
  if (totalIssues === 0) {
    console.log('🎉 SQL file appears to be valid!');
  } else {
    console.log(`⚠️  Found ${totalIssues} issues that need to be addressed.`);
  }
}

checkSQLFile();