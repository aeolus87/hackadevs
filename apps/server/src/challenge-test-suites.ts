export type ChallengeTestCase = {
  input: string
  expectedOutput: string
  isVisible: boolean
}

export const CHALLENGE_TEST_SUITES: Record<string, ChallengeTestCase[]> = {
  'rate-limiter-redis-failover': [
    {
      input: JSON.stringify({ requests: 5, windowMs: 1000, limit: 3 }),
      expectedOutput: JSON.stringify({ allowed: [1, 2, 3], rejected: [4, 5] }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ requests: 1, windowMs: 1000, limit: 10 }),
      expectedOutput: JSON.stringify({ allowed: [1], rejected: [] }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ requests: 10, windowMs: 1000, limit: 10 }),
      expectedOutput: JSON.stringify({ allowed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], rejected: [] }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ requests: 10, windowMs: 1000, limit: 0 }),
      expectedOutput: JSON.stringify({ allowed: [], rejected: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }),
      isVisible: false,
    },
    {
      input: JSON.stringify({ requests: 6, windowMs: 2000, limit: 3, burstAfterMs: 1100 }),
      expectedOutput: JSON.stringify({ allowed: [1, 2, 3, 4, 5, 6], rejected: [] }),
      isVisible: false,
    },
  ],
  'react-rerender-audit-invisible-perf': [
    {
      input: JSON.stringify({
        component: 'DataRow',
        propChanges: ['unrelated'],
        shouldRerender: false,
      }),
      expectedOutput: JSON.stringify({ rerenderPrevented: true }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ component: 'Dashboard', propsChanged: true, memoized: true }),
      expectedOutput: JSON.stringify({ renderCount: 1 }),
      isVisible: true,
    },
    {
      input: JSON.stringify({
        wsUpdate: { rowId: 5, value: 42 },
        affectedComponents: ['DataRow'],
      }),
      expectedOutput: JSON.stringify({ rerenderCount: 1, componentsRerendered: ['DataRow'] }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ strictMode: true, component: 'Dashboard', mountRenders: 2 }),
      expectedOutput: JSON.stringify({ strictModeCompliant: true }),
      isVisible: false,
    },
    {
      input: JSON.stringify({
        virtualisation: true,
        visibleRows: 20,
        totalRows: 200,
        renderedRows: 20,
      }),
      expectedOutput: JSON.stringify({ virtualisationActive: true }),
      isVisible: false,
    },
  ],
  'comment-system-10m-dau': [
    {
      input: JSON.stringify({ operation: 'post_comment', latencyMs: 450 }),
      expectedOutput: JSON.stringify({ withinSla: true, slaMs: 500 }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ operation: 'fetch_hot_sort', staleAfterVoteMs: 8000 }),
      expectedOutput: JSON.stringify({ withinSla: true, slaMs: 10000 }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ nestingLevel: 10, supported: true }),
      expectedOutput: JSON.stringify({ maxDepthHandled: true }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ readWriteRatio: 19, cacheHitRate: 0.95 }),
      expectedOutput: JSON.stringify({ optimisedForReads: true }),
      isVisible: false,
    },
    {
      input: JSON.stringify({ concurrent_votes: 1000, consistencyWindowMs: 9000 }),
      expectedOutput: JSON.stringify({ eventuallyConsistent: true }),
      isVisible: false,
    },
  ],
  'express-auth-vulnerabilities-six': [
    {
      input: JSON.stringify({
        vulnerability: 'jwt_algorithm_none',
        detected: true,
        fixed: true,
      }),
      expectedOutput: JSON.stringify({ finding: 'valid', exploitScenarioPresent: true }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ vulnerability: 'path_traversal', detected: true, fixed: true }),
      expectedOutput: JSON.stringify({ finding: 'valid', exploitScenarioPresent: true }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ vulnerability: 'mass_assignment', detected: true, fixed: true }),
      expectedOutput: JSON.stringify({ finding: 'valid', exploitScenarioPresent: true }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ totalVulnerabilitiesFound: 6 }),
      expectedOutput: JSON.stringify({ allFound: true }),
      isVisible: false,
    },
    {
      input: JSON.stringify({ vulnerability: 'idor', detected: true, testWritten: true }),
      expectedOutput: JSON.stringify({ finding: 'valid', exploitScenarioPresent: true }),
      isVisible: false,
    },
  ],
  'postgres-50m-row-zero-downtime': [
    {
      input: JSON.stringify({ operation: 'add_column', lockDurationMs: 80 }),
      expectedOutput: JSON.stringify({ withinLimit: true, limitMs: 100 }),
      isVisible: true,
    },
    {
      input: JSON.stringify({
        operation: 'backfill',
        rowsProcessed: 50000000,
        dataConsistent: true,
      }),
      expectedOutput: JSON.stringify({ backfillValid: true }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ operation: 'rollback', lockDurationMs: 50, dataLoss: false }),
      expectedOutput: JSON.stringify({ rollbackValid: true }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ operation: 'index_creation', concurrent: true, blocksWrites: false }),
      expectedOutput: JSON.stringify({ safeIndexCreation: true }),
      isVisible: false,
    },
    {
      input: JSON.stringify({ operation: 'cutover', writesBlockedMs: 0 }),
      expectedOutput: JSON.stringify({ zeroDowntime: true }),
      isVisible: false,
    },
  ],
  'ml-serving-traffic-spikes': [
    {
      input: JSON.stringify({ rps: 1000, p99LatencyMs: 48 }),
      expectedOutput: JSON.stringify({ meetsTarget: true }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ queueDepth: 500, workers: 16, scaled: true }),
      expectedOutput: JSON.stringify({ scaledCorrectly: true }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ trafficMultiplier: 10, scaleTimeMs: 28000 }),
      expectedOutput: JSON.stringify({ withinLimit: true, limitMs: 30000 }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ batchSize: 32, latencyMs: 45, throughputRps: 1100 }),
      expectedOutput: JSON.stringify({ batchingEffective: true }),
      isVisible: false,
    },
    {
      input: JSON.stringify({ workers: 2, queueDepth: 0, scaledDown: true }),
      expectedOutput: JSON.stringify({ scaleDownCorrect: true }),
      isVisible: false,
    },
  ],
  'dockerfile-monorepo-prod': [
    {
      input: JSON.stringify({ imageSizeMb: 280, target: 'production' }),
      expectedOutput: JSON.stringify({ withinLimit: true, limitMb: 300 }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ layerContainsSecret: false, checkedWithDockerHistory: true }),
      expectedOutput: JSON.stringify({ secretsClean: true }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ platform: 'linux/arm64', buildSucceeds: true }),
      expectedOutput: JSON.stringify({ multiArchSupported: true }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ codeChange: true, installLayerInvalidated: false }),
      expectedOutput: JSON.stringify({ cacheOptimal: true }),
      isVisible: false,
    },
    {
      input: JSON.stringify({ hotReload: true, service: 'web', changeDetectedMs: 800 }),
      expectedOutput: JSON.stringify({ devExperienceValid: true }),
      isVisible: false,
    },
  ],
  'idempotency-keys-ledger-scale': [
    {
      input: JSON.stringify({ idempotencyKey: 'key-abc', requests: 3, ledgerEntries: 1 }),
      expectedOutput: JSON.stringify({ exactlyOnce: true }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ concurrent: true, requests: 2, delayMs: 5, ledgerEntries: 1 }),
      expectedOutput: JSON.stringify({ concurrentSafe: true }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ keyAge: '25h', expired: true }),
      expectedOutput: JSON.stringify({ keyExpired: true }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ serverCrashMidRequest: true, ledgerEntries: 1 }),
      expectedOutput: JSON.stringify({ crashSafe: true }),
      isVisible: false,
    },
    {
      input: JSON.stringify({ keysTableGrowthBounded: true, expiryHours: 24 }),
      expectedOutput: JSON.stringify({ bounded: true }),
      isVisible: false,
    },
  ],
  'sum-positive-numbers': [
    {
      input: JSON.stringify([2, -1, 3, 0]),
      expectedOutput: JSON.stringify(5),
      isVisible: true,
    },
    {
      input: JSON.stringify([-1, -2]),
      expectedOutput: JSON.stringify(0),
      isVisible: true,
    },
    {
      input: JSON.stringify([10]),
      expectedOutput: JSON.stringify(10),
      isVisible: true,
    },
    {
      input: JSON.stringify([]),
      expectedOutput: JSON.stringify(0),
      isVisible: false,
    },
    {
      input: JSON.stringify([100, -50, 25]),
      expectedOutput: JSON.stringify(125),
      isVisible: false,
    },
  ],
  'fizzbuzz-classic': [
    {
      input: JSON.stringify({ n: 4 }),
      expectedOutput: JSON.stringify('1\n2\nFizz\n4'),
      isVisible: true,
    },
    {
      input: JSON.stringify({ n: 3 }),
      expectedOutput: JSON.stringify('1\n2\nFizz'),
      isVisible: true,
    },
    {
      input: JSON.stringify({ n: 1 }),
      expectedOutput: JSON.stringify('1'),
      isVisible: true,
    },
    {
      input: JSON.stringify({ n: 15 }),
      expectedOutput: JSON.stringify(
        '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',
      ),
      isVisible: false,
    },
    {
      input: JSON.stringify({ n: 5 }),
      expectedOutput: JSON.stringify('1\n2\nFizz\n4\nBuzz'),
      isVisible: false,
    },
  ],
  'palindrome-check': [
    {
      input: JSON.stringify({ s: 'racecar' }),
      expectedOutput: JSON.stringify(true),
      isVisible: true,
    },
    {
      input: JSON.stringify({ s: 'A man, a plan, a canal: Panama' }),
      expectedOutput: JSON.stringify(true),
      isVisible: true,
    },
    {
      input: JSON.stringify({ s: 'hello' }),
      expectedOutput: JSON.stringify(false),
      isVisible: true,
    },
    {
      input: JSON.stringify({ s: '' }),
      expectedOutput: JSON.stringify(true),
      isVisible: false,
    },
    {
      input: JSON.stringify({ s: 'No lemon, no melon' }),
      expectedOutput: JSON.stringify(true),
      isVisible: false,
    },
  ],
  'merge-two-sorted-arrays': [
    {
      input: JSON.stringify({ a: [1, 3, 5], b: [2, 4, 6] }),
      expectedOutput: JSON.stringify([1, 2, 3, 4, 5, 6]),
      isVisible: true,
    },
    {
      input: JSON.stringify({ a: [], b: [1, 2] }),
      expectedOutput: JSON.stringify([1, 2]),
      isVisible: true,
    },
    {
      input: JSON.stringify({ a: [1], b: [1] }),
      expectedOutput: JSON.stringify([1, 1]),
      isVisible: true,
    },
    {
      input: JSON.stringify({ a: [1, 2, 3], b: [] }),
      expectedOutput: JSON.stringify([1, 2, 3]),
      isVisible: false,
    },
    {
      input: JSON.stringify({ a: [-2, 0], b: [-1, 1] }),
      expectedOutput: JSON.stringify([-2, -1, 0, 1]),
      isVisible: false,
    },
  ],
  'slugify-url-segment': [
    {
      input: JSON.stringify({ title: '  Hello World!!  ' }),
      expectedOutput: JSON.stringify('hello-world'),
      isVisible: true,
    },
    {
      input: JSON.stringify({ title: 'Foo---Bar' }),
      expectedOutput: JSON.stringify('foo-bar'),
      isVisible: true,
    },
    {
      input: JSON.stringify({ title: 'test' }),
      expectedOutput: JSON.stringify('test'),
      isVisible: true,
    },
    {
      input: JSON.stringify({ title: '   ' }),
      expectedOutput: JSON.stringify(''),
      isVisible: false,
    },
    {
      input: JSON.stringify({ title: "It's a nice_day" }),
      expectedOutput: JSON.stringify('its-a-nice-day'),
      isVisible: false,
    },
  ],
  'fetch-health-json': [
    {
      input: JSON.stringify({ uptimeSec: 0 }),
      expectedOutput: JSON.stringify({ status: 'ok', uptimeSec: 0 }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ uptimeSec: 42 }),
      expectedOutput: JSON.stringify({ status: 'ok', uptimeSec: 42 }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ uptimeSec: 3600 }),
      expectedOutput: JSON.stringify({ status: 'ok', uptimeSec: 3600 }),
      isVisible: true,
    },
    {
      input: JSON.stringify({ uptimeSec: 1 }),
      expectedOutput: JSON.stringify({ status: 'ok', uptimeSec: 1 }),
      isVisible: false,
    },
    {
      input: JSON.stringify({ uptimeSec: 999999 }),
      expectedOutput: JSON.stringify({ status: 'ok', uptimeSec: 999999 }),
      isVisible: false,
    },
  ],
}
