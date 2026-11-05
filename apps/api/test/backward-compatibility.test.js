const assert = require('assert');
const sinon = require('sinon');

// Mock dependencies
const mockBlockchainApiManager = {
  getTableRows: sinon.stub(),
};

const mockFetchManager = {
  get: sinon.stub(),
};

const mockConfig = {
  token_precision: 8,
};

// Mock modules
require.cache[require.resolve('../src/services/blockchainApiManager')] = {
  exports: mockBlockchainApiManager,
};
require.cache[require.resolve('../src/services/fetchManager')] = {
  exports: mockFetchManager,
};
require.cache[require.resolve('../src/config/config')] = {
  exports: mockConfig,
};

const mockConverter = {
  calculatedVoteWeight: () => 1000000000000,
};
require.cache[require.resolve('../src/utils/converter')] = {
  exports: mockConverter,
};

describe('Backward Compatibility - Old Contract Support', function() {
  this.timeout(10000);

  let producerHelper;

  before(function() {
    delete require.cache[require.resolve('../src/helpers/producer')];
    producerHelper = require('../src/helpers/producer');
  });

  beforeEach(function() {
    mockBlockchainApiManager.getTableRows.reset();
    mockFetchManager.get.reset();
  });

  describe('Complete Absence of New Contract Features', function() {
    it('should work correctly when global4 and global.a tables do not exist (old contract)', async function() {
      // Simulate old contract - new tables don't exist
      mockBlockchainApiManager.getTableRows.callsFake((params) => {
        if (params.table === 'producers') {
          return Promise.resolve({
            rows: [
              { owner: 'producer1', is_active: 1, total_votes: '30000000000000000000', url: 'https://p1.com', location: 0 },
              { owner: 'producer2', is_active: 1, total_votes: '50000000000000000000', url: 'https://p2.com', location: 0 },
              { owner: 'producer3', is_active: 1, total_votes: '40000000000000000000', url: 'https://p3.com', location: 0 },
            ],
            more: false,
          });
        } else if (params.table === 'global4') {
          // Old contract - table doesn't exist
          return Promise.reject(new Error('Table does not exist'));
        } else if (params.table === 'global.a') {
          // Old contract - table doesn't exist
          return Promise.reject(new Error('Table does not exist'));
        }
      });

      mockFetchManager.get.resolves(null);

      const result = await producerHelper.generateProducersRank();

      // Should use defaults for old contract
      assert.strictEqual(result.active_producer_count, 21);
      assert.strictEqual(result.num_standby_slots, 0);
      assert.strictEqual(result.weighted_voting_enabled, false);

      // Should sort by total_votes (old behavior)
      assert.strictEqual(result.producers.length, 3);
      assert.strictEqual(result.producers[0].owner, 'producer2'); // 50k votes
      assert.strictEqual(result.producers[0].rank, 1);
      assert.strictEqual(result.producers[1].owner, 'producer3'); // 40k votes
      assert.strictEqual(result.producers[1].rank, 2);
      assert.strictEqual(result.producers[2].owner, 'producer1'); // 30k votes
      assert.strictEqual(result.producers[2].rank, 3);

      // All should be active (default 21)
      assert.strictEqual(result.producers[0].status, 'active');
      assert.strictEqual(result.producers[1].status, 'active');
      assert.strictEqual(result.producers[2].status, 'active');

      // Weighted votes should equal actual_votes when weighted voting is disabled (both human-readable)
      result.producers.forEach(p => {
        assert.strictEqual(p.weighted_votes, p.actual_votes);
      });
    });
  });

  describe('New Tables Present but Weighted Voting Disabled', function() {
    it('should use old vote-based ordering when enable_weighted_voting is false', async function() {
      mockBlockchainApiManager.getTableRows.callsFake((params) => {
        if (params.table === 'producers') {
          return Promise.resolve({
            rows: [
              { owner: 'producer1', is_active: 1, total_votes: '30000000000000000000', url: 'https://p1.com', location: 0 },
              { owner: 'producer2', is_active: 1, total_votes: '50000000000000000000', url: 'https://p2.com', location: 0 },
              { owner: 'producer3', is_active: 1, total_votes: '40000000000000000000', url: 'https://p3.com', location: 0 },
            ],
            more: false,
          });
        } else if (params.table === 'global4') {
          return Promise.resolve({
            rows: [{
              active_producer_count: 21,
              num_standby_slots: 0,
            }],
          });
        } else if (params.table === 'global.a') {
          return Promise.resolve({
            rows: [{
              guilds_contract: 'guilds.oig',
              bp_score_scaling_factor: 1000,
              bp_default_score: 1000,
              enable_weighted_voting: false, // EXPLICITLY DISABLED
            }],
          });
        } else if (params.table === 'guilds') {
          // Guilds exist but should not be used
          return Promise.resolve({
            rows: [
              { producer: 'producer1', score: 2000, prv_score: 1000, balance: '0 WAX', eligibility: '0 WAX', autopay: true, retired: false },
            ],
            more: false,
          });
        }
      });

      mockFetchManager.get.resolves(null);

      const result = await producerHelper.generateProducersRank();

      // Should NOT use guild weighting
      assert.strictEqual(result.weighted_voting_enabled, false);

      // Should sort by total_votes only, ignoring guild scores
      assert.strictEqual(result.producers[0].owner, 'producer2'); // 50k votes
      assert.strictEqual(result.producers[1].owner, 'producer3'); // 40k votes
      assert.strictEqual(result.producers[2].owner, 'producer1'); // 30k votes

      // Weighted votes should equal actual_votes when disabled (both human-readable)
      result.producers.forEach(p => {
        assert.strictEqual(p.weighted_votes, p.actual_votes);
      });
    });

    it('should not fetch guilds table when weighted voting is disabled', async function() {
      let guildsTableCalled = false;

      mockBlockchainApiManager.getTableRows.callsFake((params) => {
        if (params.table === 'producers') {
          return Promise.resolve({ rows: [], more: false });
        } else if (params.table === 'global4') {
          return Promise.resolve({
            rows: [{ active_producer_count: 21, num_standby_slots: 0 }],
          });
        } else if (params.table === 'global.a') {
          return Promise.resolve({
            rows: [{
              guilds_contract: 'guilds.oig',
              bp_score_scaling_factor: 1000,
              bp_default_score: 1000,
              enable_weighted_voting: false,
            }],
          });
        } else if (params.table === 'guilds') {
          guildsTableCalled = true;
          return Promise.resolve({ rows: [], more: false });
        }
      });

      mockFetchManager.get.resolves(null);

      await producerHelper.generateProducersRank();

      // Guilds table should NOT have been called
      assert.strictEqual(guildsTableCalled, false, 'Guilds table should not be fetched when weighted voting is disabled');
    });
  });

  describe('Missing global.a Table (enable_weighted_voting field)', function() {
    it('should default to weighted voting disabled when global.a is missing', async function() {
      mockBlockchainApiManager.getTableRows.callsFake((params) => {
        if (params.table === 'producers') {
          return Promise.resolve({
            rows: [
              { owner: 'producer1', is_active: 1, total_votes: '30000000000000000000', url: 'https://p1.com', location: 0 },
              { owner: 'producer2', is_active: 1, total_votes: '50000000000000000000', url: 'https://p2.com', location: 0 },
            ],
            more: false,
          });
        } else if (params.table === 'global4') {
          return Promise.resolve({
            rows: [{ active_producer_count: 21, num_standby_slots: 0 }],
          });
        } else if (params.table === 'global.a') {
          // Table missing
          return Promise.reject(new Error('Table not found'));
        }
      });

      mockFetchManager.get.resolves(null);

      const result = await producerHelper.generateProducersRank();

      // Should default to disabled
      assert.strictEqual(result.weighted_voting_enabled, false);

      // Should use old ordering
      assert.strictEqual(result.producers[0].owner, 'producer2');
      assert.strictEqual(result.producers[1].owner, 'producer1');
    });
  });

  describe('Edge Case: Scaling Factor Zero', function() {
    it('should default to 1.0 multiplier when scaling factor is 0 (prevent division by zero)', async function() {
      mockBlockchainApiManager.getTableRows.callsFake((params) => {
        if (params.table === 'producers') {
          return Promise.resolve({
            rows: [
              { owner: 'producer1', is_active: 1, total_votes: '30000000000000000000', url: 'https://p1.com', location: 0 },
            ],
            more: false,
          });
        } else if (params.table === 'global4') {
          return Promise.resolve({
            rows: [{ active_producer_count: 21, num_standby_slots: 0 }],
          });
        } else if (params.table === 'global.a') {
          return Promise.resolve({
            rows: [{
              guilds_contract: 'guilds.oig',
              bp_score_scaling_factor: 0, // ZERO - edge case!
              bp_default_score: 1000,
              enable_weighted_voting: true,
            }],
          });
        } else if (params.table === 'guilds') {
          return Promise.resolve({ rows: [], more: false });
        }
      });

      mockFetchManager.get.resolves(null);

      const result = await producerHelper.generateProducersRank();

      // Should default to 1.0 multiplier to avoid division by zero
      assert.strictEqual(result.producers[0].weight_multiplier, 1.0);
      // weighted_votes should equal actual_votes when multiplier is 1.0 (both human-readable)
      assert.strictEqual(result.producers[0].weighted_votes, result.producers[0].actual_votes);
    });
  });

  describe('Old vs New Ordering Comparison', function() {
    it('should produce identical ordering when weighted voting is disabled (backward compatible)', async function() {
      const testProducers = [
        { owner: 'alice', is_active: 1, total_votes: '25000000000000000000', url: 'https://alice.com', location: 0 },
        { owner: 'bob', is_active: 1, total_votes: '50000000000000000000', url: 'https://bob.com', location: 0 },
        { owner: 'charlie', is_active: 1, total_votes: '40000000000000000000', url: 'https://charlie.com', location: 0 },
        { owner: 'dave', is_active: 1, total_votes: '35000000000000000000', url: 'https://dave.com', location: 0 },
        { owner: 'eve', is_active: 1, total_votes: '45000000000000000000', url: 'https://eve.com', location: 0 },
      ];

      mockBlockchainApiManager.getTableRows.callsFake((params) => {
        if (params.table === 'producers') {
          return Promise.resolve({ rows: testProducers, more: false });
        } else if (params.table === 'global4') {
          return Promise.reject(new Error('Old contract'));
        } else if (params.table === 'global.a') {
          return Promise.reject(new Error('Old contract'));
        }
      });

      mockFetchManager.get.resolves(null);

      const result = await producerHelper.generateProducersRank();

      // Expected order (by total_votes descending): bob, eve, charlie, dave, alice
      const expectedOrder = ['bob', 'eve', 'charlie', 'dave', 'alice'];
      const actualOrder = result.producers.map(p => p.owner);

      assert.deepStrictEqual(actualOrder, expectedOrder, 'Ordering should match old vote-based system');

      // Verify ranks
      result.producers.forEach((p, index) => {
        assert.strictEqual(p.rank, index + 1);
      });
    });

    it('should change ordering when weighted voting is enabled (new behavior)', async function() {
      const testProducers = [
        { owner: 'alice', is_active: 1, total_votes: '25000000000000000000', url: 'https://alice.com', location: 0 },
        { owner: 'bob', is_active: 1, total_votes: '50000000000000000000', url: 'https://bob.com', location: 0 },
      ];

      mockBlockchainApiManager.getTableRows.callsFake((params) => {
        if (params.table === 'producers') {
          return Promise.resolve({ rows: testProducers, more: false });
        } else if (params.table === 'global4') {
          return Promise.resolve({
            rows: [{ active_producer_count: 21, num_standby_slots: 0 }],
          });
        } else if (params.table === 'global.a') {
          return Promise.resolve({
            rows: [{
              guilds_contract: 'guilds.oig',
              bp_score_scaling_factor: 1000,
              bp_default_score: 1000,
              enable_weighted_voting: true, // ENABLED
            }],
          });
        } else if (params.table === 'guilds') {
          return Promise.resolve({
            rows: [
              // alice has 2.5x multiplier, bob has 0.8x
              { producer: 'alice', score: 2500, prv_score: 1000, balance: '0 WAX', eligibility: '0 WAX', autopay: true, retired: false },
              { producer: 'bob', score: 800, prv_score: 1000, balance: '0 WAX', eligibility: '0 WAX', autopay: true, retired: false },
            ],
            more: false,
          });
        }
      });

      mockFetchManager.get.resolves(null);

      const result = await producerHelper.generateProducersRank();

      // With weighting: alice (25k × 2.5 = 62.5k) beats bob (50k × 0.8 = 40k)
      assert.strictEqual(result.producers[0].owner, 'alice', 'Alice should rank higher with guild weighting');
      assert.strictEqual(result.producers[1].owner, 'bob', 'Bob should rank lower with guild weighting');

      // Verify weighted votes were calculated
      assert.ok(result.producers[0].weighted_votes > result.producers[1].weighted_votes);
    });
  });

  describe('Gradual Migration Path', function() {
    it('should support phased rollout (global.a present but weighted voting disabled)', async function() {
      // This tests the scenario where the new contract is deployed but weighted voting isn't activated yet
      mockBlockchainApiManager.getTableRows.callsFake((params) => {
        if (params.table === 'producers') {
          return Promise.resolve({
            rows: [
              { owner: 'producer1', is_active: 1, total_votes: '30000000000000000000', url: 'https://p1.com', location: 0 },
              { owner: 'producer2', is_active: 1, total_votes: '50000000000000000000', url: 'https://p2.com', location: 0 },
            ],
            more: false,
          });
        } else if (params.table === 'global4') {
          return Promise.resolve({
            rows: [{ active_producer_count: 21, num_standby_slots: 0 }],
          });
        } else if (params.table === 'global.a') {
          return Promise.resolve({
            rows: [{
              guilds_contract: 'guilds.oig',
              bp_score_scaling_factor: 1000,
              bp_default_score: 1000,
              enable_weighted_voting: false, // Not activated yet
              guilds_code_hashes: [], // Ready but not activated
            }],
          });
        }
      });

      mockFetchManager.get.resolves(null);

      const result = await producerHelper.generateProducersRank();

      // Should behave like old system even though new contract is deployed
      assert.strictEqual(result.weighted_voting_enabled, false);
      assert.strictEqual(result.producers[0].owner, 'producer2'); // Vote-based ordering
      assert.strictEqual(result.producers[1].owner, 'producer1');
    });
  });

  describe('Metadata Fields Always Present', function() {
    it('should include guild-related fields even when weighted voting is disabled', async function() {
      mockBlockchainApiManager.getTableRows.callsFake((params) => {
        if (params.table === 'producers') {
          return Promise.resolve({
            rows: [
              { owner: 'producer1', is_active: 1, total_votes: '30000000000000000000', url: 'https://p1.com', location: 0 },
            ],
            more: false,
          });
        } else if (params.table === 'global4') {
          return Promise.reject(new Error('Old contract'));
        } else if (params.table === 'global.a') {
          return Promise.reject(new Error('Old contract'));
        }
      });

      mockFetchManager.get.resolves(null);

      const result = await producerHelper.generateProducersRank();

      // Even on old contract, these fields should exist (for API consistency)
      assert.ok(result.producers[0].hasOwnProperty('guild_score'));
      assert.ok(result.producers[0].hasOwnProperty('weight_multiplier'));
      assert.ok(result.producers[0].hasOwnProperty('weighted_votes'));

      // Should have default values
      assert.strictEqual(result.producers[0].guild_score, 1000);
      assert.strictEqual(result.producers[0].weight_multiplier, 1.0);
    });
  });
});
