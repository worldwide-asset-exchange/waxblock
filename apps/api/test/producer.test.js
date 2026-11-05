const assert = require('assert');
const sinon = require('sinon');

// Mock dependencies before requiring the module
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

// Mock calculatedVoteWeight
const mockConverter = {
  calculatedVoteWeight: () => 1000000000000,
};
require.cache[require.resolve('../src/utils/converter')] = {
  exports: mockConverter,
};

describe('Producer Helper - Guild-Based Ordering', function() {
  this.timeout(10000);

  let producerHelper;

  before(function() {
    // Clear require cache and load the producer helper
    delete require.cache[require.resolve('../src/helpers/producer')];
    producerHelper = require('../src/helpers/producer');
  });

  beforeEach(function() {
    // Reset all stubs before each test
    mockBlockchainApiManager.getTableRows.reset();
    mockFetchManager.get.reset();
  });

  describe('Guild-Based Weighted Voting', function() {
    it('should apply guild weight multipliers when weighted voting is enabled', async function() {
      // Mock producers data
      mockBlockchainApiManager.getTableRows.callsFake((params) => {
        if (params.table === 'producers') {
          return Promise.resolve({
            rows: [
              {
                owner: 'producer1',
                is_active: 1,
                total_votes: '10000000000000000000',
                url: 'https://producer1.com',
                location: 0,
              },
              {
                owner: 'producer2',
                is_active: 1,
                total_votes: '12000000000000000000',
                url: 'https://producer2.com',
                location: 0,
              },
            ],
            more: false,
          });
        } else if (params.table === 'global4') {
          return Promise.resolve({
            rows: [{
              active_producer_count: 2,
              num_standby_slots: 1,
            }],
          });
        } else if (params.table === 'global.a') {
          return Promise.resolve({
            rows: [{
              guilds_contract: 'guilds.oig',
              bp_score_scaling_factor: 1000,
              bp_default_score: 1000,
              enable_weighted_voting: true,
            }],
          });
        } else if (params.table === 'guilds') {
          // producer1 has higher guild score, which should boost it above producer2
          return Promise.resolve({
            rows: [
              {
                producer: 'producer1',
                score: 2000, // 2.0x multiplier
                prv_score: 1000,
                balance: '0.00000000 WAX',
                eligibility: '0.00000000 WAX',
                autopay: true,
                retired: false,
              },
              {
                producer: 'producer2',
                score: 500, // 0.5x multiplier
                prv_score: 500,
                balance: '0.00000000 WAX',
                eligibility: '0.00000000 WAX',
                autopay: true,
                retired: false,
              },
            ],
            more: false,
          });
        }
      });

      mockFetchManager.get.resolves(null);

      const result = await producerHelper.generateProducersRank();

      // Assertions
      assert.strictEqual(result.producers.length, 2);
      assert.strictEqual(result.weighted_voting_enabled, true);

      // producer1 should be rank 1 due to guild multiplier (10000 * 2.0 = 20000 > 12000 * 0.5 = 6000)
      assert.strictEqual(result.producers[0].owner, 'producer1');
      assert.strictEqual(result.producers[0].rank, 1);
      assert.strictEqual(result.producers[0].guild_score, 2000);
      assert.strictEqual(result.producers[0].weight_multiplier, 2.0);
      assert.strictEqual(result.producers[0].status, 'active');

      // producer2 should be rank 2
      assert.strictEqual(result.producers[1].owner, 'producer2');
      assert.strictEqual(result.producers[1].rank, 2);
      assert.strictEqual(result.producers[1].guild_score, 500);
      assert.strictEqual(result.producers[1].weight_multiplier, 0.5);
      assert.strictEqual(result.producers[1].status, 'active');
    });

    it('should not apply guild weighting when weighted voting is disabled', async function() {
      mockBlockchainApiManager.getTableRows.callsFake((params) => {
        if (params.table === 'producers') {
          return Promise.resolve({
            rows: [
              {
                owner: 'producer1',
                is_active: 1,
                total_votes: '10000000000000000000',
                url: 'https://producer1.com',
                location: 0,
              },
              {
                owner: 'producer2',
                is_active: 1,
                total_votes: '12000000000000000000',
                url: 'https://producer2.com',
                location: 0,
              },
            ],
            more: false,
          });
        } else if (params.table === 'global4') {
          return Promise.resolve({
            rows: [{
              active_producer_count: 2,
              num_standby_slots: 0,
            }],
          });
        } else if (params.table === 'global.a') {
          return Promise.resolve({
            rows: [{
              guilds_contract: 'guilds.oig',
              bp_score_scaling_factor: 1000,
              bp_default_score: 1000,
              enable_weighted_voting: false, // DISABLED
            }],
          });
        }
      });

      mockFetchManager.get.resolves(null);

      const result = await producerHelper.generateProducersRank();

      // When weighted voting is disabled, producer2 (with higher votes) should be rank 1
      assert.strictEqual(result.producers[0].owner, 'producer2');
      assert.strictEqual(result.producers[0].rank, 1);
      assert.strictEqual(result.producers[1].owner, 'producer1');
      assert.strictEqual(result.producers[1].rank, 2);
      assert.strictEqual(result.weighted_voting_enabled, false);
    });
  });

  describe('Producer Status Classification', function() {
    it('should correctly classify producers as active, standby, and inactive', async function() {
      mockBlockchainApiManager.getTableRows.callsFake((params) => {
        if (params.table === 'producers') {
          return Promise.resolve({
            rows: [
              { owner: 'producer1', is_active: 1, total_votes: '50000000000000000000', url: 'https://p1.com', location: 0 },
              { owner: 'producer2', is_active: 1, total_votes: '40000000000000000000', url: 'https://p2.com', location: 0 },
              { owner: 'producer3', is_active: 1, total_votes: '30000000000000000000', url: 'https://p3.com', location: 0 },
              { owner: 'producer4', is_active: 1, total_votes: '20000000000000000000', url: 'https://p4.com', location: 0 },
              { owner: 'producer5', is_active: 1, total_votes: '10000000000000000000', url: 'https://p5.com', location: 0 },
            ],
            more: false,
          });
        } else if (params.table === 'global4') {
          return Promise.resolve({
            rows: [{
              active_producer_count: 2,
              num_standby_slots: 2,
            }],
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
        }
      });

      mockFetchManager.get.resolves(null);

      const result = await producerHelper.generateProducersRank();

      assert.strictEqual(result.active_producer_count, 2);
      assert.strictEqual(result.num_standby_slots, 2);
      assert.strictEqual(result.producers.length, 5);

      // Check active producers (ranks 1-2)
      assert.strictEqual(result.producers[0].status, 'active');
      assert.strictEqual(result.producers[0].is_in_schedule, true);
      assert.strictEqual(result.producers[1].status, 'active');
      assert.strictEqual(result.producers[1].is_in_schedule, true);

      // Check standby producers (ranks 3-4)
      assert.strictEqual(result.producers[2].status, 'standby');
      assert.strictEqual(result.producers[2].is_in_schedule, false);
      assert.strictEqual(result.producers[3].status, 'standby');
      assert.strictEqual(result.producers[3].is_in_schedule, false);

      // Check inactive producer (rank 5)
      assert.strictEqual(result.producers[4].status, 'inactive');
      assert.strictEqual(result.producers[4].is_in_schedule, false);
    });

    it('should handle variable active producer count', async function() {
      mockBlockchainApiManager.getTableRows.callsFake((params) => {
        if (params.table === 'producers') {
          return Promise.resolve({
            rows: Array.from({ length: 15 }, (_, i) => ({
              owner: `producer${i + 1}`,
              is_active: 1,
              total_votes: `${50000 - i * 1000}000000000000000`,
              url: `https://p${i + 1}.com`,
              location: 0,
            })),
            more: false,
          });
        } else if (params.table === 'global4') {
          return Promise.resolve({
            rows: [{
              active_producer_count: 10, // 10 active BPs instead of 21
              num_standby_slots: 3,
            }],
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
        }
      });

      mockFetchManager.get.resolves(null);

      const result = await producerHelper.generateProducersRank();

      assert.strictEqual(result.active_producer_count, 10);
      assert.strictEqual(result.num_standby_slots, 3);

      // Count producers by status
      const activeCount = result.producers.filter(p => p.status === 'active').length;
      const standbyCount = result.producers.filter(p => p.status === 'standby').length;
      const inactiveCount = result.producers.filter(p => p.status === 'inactive').length;

      assert.strictEqual(activeCount, 10);
      assert.strictEqual(standbyCount, 3);
      assert.strictEqual(inactiveCount, 2);
    });
  });

  describe('Metadata Response', function() {
    it('should return correct metadata structure', async function() {
      mockBlockchainApiManager.getTableRows.callsFake((params) => {
        if (params.table === 'producers') {
          return Promise.resolve({ rows: [], more: false });
        } else if (params.table === 'global4') {
          return Promise.resolve({
            rows: [{
              active_producer_count: 21,
              num_standby_slots: 5,
            }],
          });
        } else if (params.table === 'global.a') {
          return Promise.resolve({
            rows: [{
              guilds_contract: 'custom.guild',
              bp_score_scaling_factor: 2000,
              bp_default_score: 1500,
              enable_weighted_voting: true,
            }],
          });
        } else if (params.table === 'guilds') {
          // Return empty guilds table
          return Promise.resolve({ rows: [], more: false });
        }
      });

      mockFetchManager.get.resolves(null);

      const result = await producerHelper.generateProducersRank();

      assert.strictEqual(result.active_producer_count, 21);
      assert.strictEqual(result.num_standby_slots, 5);
      assert.strictEqual(result.weighted_voting_enabled, true);
      assert.strictEqual(result.guilds_contract, 'custom.guild');
      assert.strictEqual(result.bp_score_scaling_factor, 2000);
    });
  });

  describe('Tie-Breaking', function() {
    it('should use producer name for deterministic tie-breaking', async function() {
      mockBlockchainApiManager.getTableRows.callsFake((params) => {
        if (params.table === 'producers') {
          return Promise.resolve({
            rows: [
              { owner: 'zproducer', is_active: 1, total_votes: '10000000000000000000', url: 'https://z.com', location: 0 },
              { owner: 'aproducer', is_active: 1, total_votes: '10000000000000000000', url: 'https://a.com', location: 0 },
              { owner: 'mproducer', is_active: 1, total_votes: '10000000000000000000', url: 'https://m.com', location: 0 },
            ],
            more: false,
          });
        } else if (params.table === 'global4') {
          return Promise.resolve({
            rows: [{ active_producer_count: 3, num_standby_slots: 0 }],
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
        }
      });

      mockFetchManager.get.resolves(null);

      const result = await producerHelper.generateProducersRank();

      // Should be sorted alphabetically when votes are equal
      assert.strictEqual(result.producers[0].owner, 'aproducer');
      assert.strictEqual(result.producers[1].owner, 'mproducer');
      assert.strictEqual(result.producers[2].owner, 'zproducer');
    });
  });

  describe('Default Values Handling', function() {
    it('should use default values when global state is unavailable', async function() {
      mockBlockchainApiManager.getTableRows.callsFake((params) => {
        if (params.table === 'producers') {
          return Promise.resolve({ rows: [], more: false });
        } else if (params.table === 'global4') {
          return Promise.reject(new Error('Table not found'));
        } else if (params.table === 'global.a') {
          return Promise.reject(new Error('Table not found'));
        }
      });

      const result = await producerHelper.generateProducersRank();

      // Should use defaults
      assert.strictEqual(result.active_producer_count, 21);
      assert.strictEqual(result.guilds_contract, 'guilds.oig');
      assert.strictEqual(result.bp_score_scaling_factor, 1000);
    });

    it('should apply default guild score to producers not in guilds table', async function() {
      mockBlockchainApiManager.getTableRows.callsFake((params) => {
        if (params.table === 'producers') {
          return Promise.resolve({
            rows: [
              { owner: 'producer1', is_active: 1, total_votes: '10000000000000000000', url: 'https://p1.com', location: 0 },
            ],
            more: false,
          });
        } else if (params.table === 'global4') {
          return Promise.resolve({
            rows: [{ active_producer_count: 1, num_standby_slots: 0 }],
          });
        } else if (params.table === 'global.a') {
          return Promise.resolve({
            rows: [{
              guilds_contract: 'guilds.oig',
              bp_score_scaling_factor: 1000,
              bp_default_score: 1500,
              enable_weighted_voting: true,
            }],
          });
        } else if (params.table === 'guilds') {
          // Producer not in guilds table
          return Promise.resolve({ rows: [], more: false });
        }
      });

      mockFetchManager.get.resolves(null);

      const result = await producerHelper.generateProducersRank();

      // Should use default score
      assert.strictEqual(result.producers[0].guild_score, 1500);
      assert.strictEqual(result.producers[0].weight_multiplier, 1.5);
    });
  });
});

// Run the tests
if (require.main === module) {
  console.log('Run tests using: npm test');
}
