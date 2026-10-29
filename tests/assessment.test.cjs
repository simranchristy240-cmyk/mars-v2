const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const shared = require('../shared/dist');

const single = { _id: 'q1', questionType: 'single-mcq', questionText: 'Choose', marks: 4,
  options: [{ id: 'a', text: 'A', isCorrect: true }, { id: 'b', text: 'B', isCorrect: false }] };
const matching = { _id: 'q2', questionType: 'match', questionText: 'Match', marks: 4,
  matchPairs: [{ left: 'Bone', right: 'Femur' }, { left: 'Nerve', right: 'Median' }] };

test('all supported question types grade exact answers and reject empty, duplicate and partial selections', () => {
  for (const question of [single, { ...single, questionType: 'true-false' }, { ...single, questionType: 'image-based', questionImage: '/image.png' },
    { ...single, questionType: 'multi-mcq', options: single.options.map(option => ({ ...option, isCorrect: true })) }, matching]) {
    const correct = shared.correctAnswerIds(question);
    assert.equal(shared.isAnswerCorrect(question, correct.slice().reverse()), true);
    assert.equal(shared.isAnswerCorrect(question, []), false);
    assert.equal(shared.isAnswerCorrect(question, [...correct, correct[0]]), false);
    if (correct.length > 1) assert.equal(shared.isAnswerCorrect(question, correct.slice(1)), false);
    assert.equal(shared.questionValidationError(question), null);
  }
  assert.equal(shared.isAnswerCorrect(matching, [shared.matchToken(0, 'Median'), shared.matchToken(1, 'Femur')]), false);
});

test('student payload removes keys and matching associations without mutating author content', () => {
  const clean = shared.studentQuestion({ ...matching, explanation: 'The answer', options: single.options });
  assert.equal(clean.explanation, undefined);
  assert.equal(clean.options[0].isCorrect, undefined);
  assert.deepEqual(clean.matchPairs.map(pair => pair.right), ['', '']);
  assert.deepEqual(clean.matchChoices, ['Femur', 'Median']);
  assert.equal(matching.matchPairs[0].right, 'Femur');
});

test('publication rejects malformed questions', () => {
  for (const question of [{ ...single, questionText: '' }, { ...single, options: [] },
    { ...single, options: single.options.map(option => ({ ...option, isCorrect: true })) },
    { ...matching, matchPairs: [{ left: 'Bone', right: '' }] }, { ...single, marks: 0 },
    { ...single, negativeMarks: -1 }, { ...single, questionType: 'unsupported' }]) {
    assert.ok(shared.questionValidationError(question));
  }
});

test('deadline is capped by schedule closure and does not restart on resume', () => {
  const startedAt = '2026-10-27T04:30:00Z';
  assert.equal(shared.testDeadline({ duration: 30, endTime: '2026-10-27T06:00:00Z' }, startedAt), Date.parse('2026-10-27T05:00:00Z'));
  assert.equal(shared.testDeadline({ duration: 30, endTime: '2026-10-27T04:45:00Z' }, startedAt), Date.parse('2026-10-27T04:45:00Z'));
});

// Exercise the real controller with isolated model doubles; no development DB or seed data is changed.
function controllerFixture({ expired = false, answers = [], status = 'in-progress' } = {}) {
  const testData = { _id: 't1', courseId: 'course', isPublished: true, duration: 30,
    startTime: new Date(Date.now() - 3600000), endTime: new Date(Date.now() + 3600000),
    totalMarks: 999, sections: [{ questions: [single, matching] }] };
  testData.toObject = () => JSON.parse(JSON.stringify(testData));
  const attempt = { _id: 'attempt', studentId: 'student', startedAt: new Date(Date.now() - 600000),
    deadlineAt: new Date(Date.now() + (expired ? -1000 : 1200000)), status, answers, __v: 0 };
  attempt.toObject = () => JSON.parse(JSON.stringify(attempt));
  let xpAwards = 0;
  let answerWrites = 0;
  const models = {
    Test: { findById: () => ({ populate: async () => testData }) },
    TestAttempt: {
      findOne: async filter => !filter.status || filter.status === attempt.status ? attempt : null,
      countDocuments: async () => 0,
      findById: async () => attempt,
      findOneAndUpdate: async (filter, update) => {
        if (filter.status && (attempt.status !== filter.status || attempt.__v !== filter.__v)) return null;
        Object.assign(attempt, update.$set);
        attempt.__v++;
        return attempt;
      },
      updateOne: async () => { answerWrites++; return { matchedCount: 1 }; },
    },
    Gamification: { findOneAndUpdate: async () => { xpAwards++; } },
  };
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(require.resolve('../server/src/controllers/test.controller.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mockRequire = name => {
    if (name === '@mars/shared') return shared;
    if (name.endsWith('tierAccess')) return { getStudentCourseTier: async () => 'premium', canAccessTier: () => true };
    const key = name.split('/').at(-1);
    return { [key]: models[key] || {} };
  };
  new Function('require', 'module', 'exports', source)(mockRequire, module, module.exports);
  const call = async (handler, body = {}) => {
    const response = { code: 200, status(code) { this.code = code; return this; }, json(payload) { this.payload = payload; return this; } };
    await module.exports[handler]({ params: { id: 't1' }, user: { _id: 'student' }, body }, response);
    return response;
  };
  return { call, attempt, testData, xpAwards: () => xpAwards, answerWrites: () => answerWrites };
}

test('resume returns the original stored deadline and sanitized questions', async () => {
  const fixture = controllerFixture();
  const response = await fixture.call('startTest');
  assert.equal(response.code, 200);
  assert.equal(response.payload.data.deadline, fixture.attempt.deadlineAt.toISOString());
  assert.equal(response.payload.data.test.sections[0].questions[0].options[0].isCorrect, undefined);
  assert.equal(response.payload.data.test.sections[0].questions[1].matchPairs[0].right, '');
});

test('expired attempts finalize on resume and reject late saves', async () => {
  const fixture = controllerFixture({ expired: true });
  const response = await fixture.call('saveAnswer', { questionId: 'q1', selectedOptions: ['a'] });
  assert.equal(response.code, 409);
  assert.equal(response.payload.expired, true);
  assert.equal(fixture.attempt.status, 'auto-submitted');
  assert.equal(fixture.answerWrites(), 0);
  assert.equal(fixture.xpAwards(), 1);
  const resumed = await fixture.call('startTest');
  assert.equal(resumed.payload.data.attempt.status, 'auto-submitted');
  assert.equal(fixture.xpAwards(), 1);
});

test('submission includes unanswered questions in denominator and is idempotent', async () => {
  const fixture = controllerFixture({ answers: [{ questionId: 'q1', selectedOptions: ['a'] }] });
  assert.equal((await fixture.call('submitTest')).code, 200);
  assert.equal(fixture.attempt.score, 4);
  assert.equal(fixture.attempt.totalMarks, 8);
  assert.equal(fixture.attempt.percentage, 50);
  await fixture.call('submitTest');
  assert.equal(fixture.xpAwards(), 1);
});

test('matching answers score correctly and a review-only empty answer earns no marks', async () => {
  const fixture = controllerFixture({ answers: [
    { questionId: 'q1', selectedOptions: [], isMarkedForReview: true },
    { questionId: 'q2', selectedOptions: shared.correctAnswerIds(matching) },
  ] });
  await fixture.call('submitTest');
  assert.equal(fixture.attempt.score, 4);
  assert.equal(fixture.attempt.percentage, 50);
});

test('concurrent submissions award completion XP only once', async () => {
  const fixture = controllerFixture();
  await Promise.all([fixture.call('submitTest'), fixture.call('submitTest')]);
  assert.equal(fixture.xpAwards(), 1);
});

test('answers to questions outside the test are rejected', async () => {
  const fixture = controllerFixture();
  const response = await fixture.call('saveAnswer', { questionId: 'foreign', selectedOptions: ['a'] });
  assert.equal(response.code, 400);
  assert.equal(fixture.answerWrites(), 0);
});

test('reports cannot expose answer keys during a live attempt and include skipped questions after expiry', async () => {
  const live = controllerFixture();
  assert.equal((await live.call('getTestReport')).code, 409);
  const expired = controllerFixture({ expired: true });
  const response = await expired.call('getTestReport');
  assert.equal(response.code, 200);
  assert.equal(response.payload.data.attempt.status, 'auto-submitted');
  assert.equal(response.payload.data.attempt.answers.length, 2);
});

test('pending answer queue retains failed saves and retries in order', async () => {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(require.resolve('../client/src/services/answerQueue.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('module', 'exports', source)(module, module.exports);
  const { savePendingAnswers } = module.exports;
  const first = { questionId: 'q1', selectedOptions: ['a'], isMarkedForReview: false };
  const pending = { q1: first, q2: { ...first, questionId: 'q2' } };
  await assert.rejects(savePendingAnswers(pending, async () => { throw new Error('Offline'); }, () => {}));
  assert.equal(Object.keys(pending).length, 2);
  const sent = [];
  await savePendingAnswers(pending, async answer => {
    sent.push(answer.selectedOptions);
    if (answer === first) pending.q1 = { ...first, selectedOptions: ['b'] };
  }, () => {});
  assert.deepEqual(sent, [['a'], ['b'], ['a']]);
  assert.deepEqual(pending, {});
});

test('shared answer UI renders native controls for multiple choice and matching and isolates radio groups', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(require.resolve('../client/src/components/QuestionAnswer.tsx'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const mockRequire = name => name === '@mars/shared' ? shared : name === './RichTextEditor' ? {
    HtmlContent: ({ html, ...props }) => React.createElement('span', props, html),
    stripHtml: text => text.replace(/<[^>]+>/g, ''),
  } : require(name);
  new Function('require', 'module', 'exports', source)(mockRequire, module, module.exports);
  const component = module.exports.QuestionAnswer;
  const render = question => renderToStaticMarkup(React.createElement(component, { question, value: [], onChange() {} }));
  assert.equal((render({ ...single, questionType: 'multi-mcq' }).match(/type="checkbox"/g) || []).length, 2);
  assert.equal((render(matching).match(/<select/g) || []).length, 2);
  const groups = renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(component, { question: single, value: [] }),
    React.createElement(component, { question: single, value: [] })));
  const names = [...groups.matchAll(/name="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(names).size, 2);
});

function authoringFixture({ parentType = 'practice', setExists = true } = {}) {
  const writes = [];
  const models = {
    Section: {
      findById: async () => ({ _id: 'q1', parentType, parentId: 'topic' }),
      create: async data => { writes.push(['create', data]); return { ...data, _id: 'q1' }; },
      findByIdAndDelete: async id => writes.push(['delete', id]),
    },
    Topic: {
      findOne: async () => setExists ? {} : null,
      updateOne: async (filter, update) => writes.push(['topic-set', filter, update]),
      findByIdAndUpdate: async (id, update) => writes.push(['topic', id, update]),
    },
    Test: {
      updateOne: async (filter, update) => writes.push(['test', filter, update]),
      updateMany: async (filter, update) => writes.push(['all-tests', filter, update]),
      exists: async () => true,
    },
  };
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(require.resolve('../server/src/controllers/lesson.controller.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const mockRequire = name => {
    if (name === '@mars/shared') return shared;
    if (name === 'fs' || name === 'path') return require(name);
    const key = name.split('/').at(-1);
    return { [key]: models[key] || {} };
  };
  new Function('require', 'module', 'exports', source)(mockRequire, module, module.exports);
  return { writes, call: async (handler, body = {}, query = {}) => {
    const response = { code: 200, status(code) { this.code = code; return this; }, json(payload) { this.payload = payload; return this; } };
    await module.exports[handler]({ params: { id: 'q1' }, body, query }, response);
    return response;
  } };
}

test('removing a shared question affects only the chosen test and preserves its source', async () => {
  const fixture = authoringFixture();
  assert.equal((await fixture.call('deleteSection', {}, { fromTest: 'true', testId: 'chosen-test' })).code, 200);
  assert.equal(fixture.writes.length, 1);
  assert.equal(fixture.writes[0][0], 'test');
  assert.equal(fixture.writes[0][1]._id, 'chosen-test');
});

test('test removal without a target test is rejected without changing any question', async () => {
  const fixture = authoringFixture();
  assert.equal((await fixture.call('deleteSection', {}, { fromTest: 'true' })).code, 400);
  assert.equal(fixture.writes.length, 0);
});

test('new practice questions are added to the opened set, and missing sets create no orphan question', async () => {
  const data = { ...single, type: 'question', isPublished: true, parentType: 'practice', parentId: 'topic', practiceSetId: 'opened-set' };
  const fixture = authoringFixture();
  assert.equal((await fixture.call('createSection', data)).code, 201);
  const update = fixture.writes.find(write => write[0] === 'topic-set');
  assert.equal(update[1]['practiceSets._id'], 'opened-set');
  assert.equal(update[2].$push['practiceSets.$.questions'], 'q1');
  assert.equal(fixture.writes.some(write => write[0] === 'topic'), false);
  const missing = authoringFixture({ setExists: false });
  assert.equal((await missing.call('createSection', data)).code, 404);
  assert.equal(missing.writes.length, 0);
});
