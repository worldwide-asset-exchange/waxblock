const assert = require('assert');
const request = require('supertest');
const sinon = require('sinon');

describe('Producer API Endpoint', function() {
  this.timeout(10000);

  let app;
  let globalsStub;

  before(function() {
    // Mock node-global-storage
    globalsStub = {
      get: sinon.stub(),
      set: sinon.stub(),
    };

    // Mock the globals module
    require.cache[require.resolve('node-global-storage')] = {
      exports: globalsStub,
    };

    // Load the app
    app = require('../src/app');
  });

  describe('GET /producers', function() {
    it('should return producers with metadata', function(done) {
      const mockCacheData = {
        producers: [
          {
            owner: 'producer1',
            rank: 1,
            status: 'active',
            is_in_schedule: true,
            total_votes: '50000000000000000000',
            actual_votes: 5000000,
            weighted_votes: 60000000000000000000,
            guild_score: 1200,
            weight_multiplier: 1.2,
            candidate_name: 'Producer One',
            location_name: 'USA',
            url: 'https://producer1.com',
            is_active: 1,
            guild_data: {
              score: 1200,
              prv_score: 1000,
              balance: '100.00000000 WAX',
              eligibility: '50.00000000 WAX',
              autopay: true,
              retired: false,
            },
          },
          {
            owner: 'producer2',
            rank: 2,
            status: 'active',
            is_in_schedule: true,
            total_votes: '40000000000000000000',
            actual_votes: 4000000,
            weighted_votes: 40000000000000000000,
            guild_score: 1000,
            weight_multiplier: 1.0,
            candidate_name: 'Producer Two',
            location_name: 'UK',
            url: 'https://producer2.com',
            is_active: 1,
            guild_data: null,
          },
          {
            owner: 'producer3',
            rank: 3,
            status: 'standby',
            is_in_schedule: false,
            total_votes: '30000000000000000000',
            actual_votes: 3000000,
            weighted_votes: 30000000000000000000,
            guild_score: 1000,
            weight_multiplier: 1.0,
            candidate_name: 'Producer Three',
            location_name: 'Germany',
            url: 'https://producer3.com',
            is_active: 1,
            guild_data: null,
          },
          {
            owner: 'producer4',
            rank: 4,
            status: 'inactive',
            is_in_schedule: false,
            total_votes: '20000000000000000000',
            actual_votes: 2000000,
            weighted_votes: 20000000000000000000,
            guild_score: 1000,
            weight_multiplier: 1.0,
            candidate_name: 'Producer Four',
            location_name: 'Japan',
            url: 'https://producer4.com',
            is_active: 1,
            guild_data: null,
          },
        ],
        producer_metadata: {
          active_producer_count: 2,
          num_standby_slots: 1,
          weighted_voting_enabled: true,
          guilds_contract: 'guilds.oig',
          bp_score_scaling_factor: 1000,
        },
      };

      globalsStub.get.withArgs('cacheData').returns(mockCacheData);

      request(app)
        .get('/api/v1/producers')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          // Check response structure
          assert.ok(res.body.producers);
          assert.ok(res.body.metadata);

          // Check producers array
          assert.strictEqual(res.body.producers.length, 4);

          // Check first producer (active)
          const producer1 = res.body.producers[0];
          assert.strictEqual(producer1.owner, 'producer1');
          assert.strictEqual(producer1.rank, 1);
          assert.strictEqual(producer1.status, 'active');
          assert.strictEqual(producer1.is_in_schedule, true);
          assert.strictEqual(producer1.guild_score, 1200);
          assert.strictEqual(producer1.weight_multiplier, 1.2);
          assert.ok(producer1.guild_data);

          // Check third producer (standby)
          const producer3 = res.body.producers[2];
          assert.strictEqual(producer3.status, 'standby');
          assert.strictEqual(producer3.is_in_schedule, false);

          // Check fourth producer (inactive)
          const producer4 = res.body.producers[3];
          assert.strictEqual(producer4.status, 'inactive');
          assert.strictEqual(producer4.is_in_schedule, false);

          // Check metadata
          const metadata = res.body.metadata;
          assert.strictEqual(metadata.active_producer_count, 2);
          assert.strictEqual(metadata.num_standby_slots, 1);
          assert.strictEqual(metadata.weighted_voting_enabled, true);
          assert.strictEqual(metadata.guilds_contract, 'guilds.oig');
          assert.strictEqual(metadata.bp_score_scaling_factor, 1000);

          done();
        });
    });

    it('should return default metadata when cache is empty', function(done) {
      globalsStub.get.withArgs('cacheData').returns({
        producers: [],
      });

      request(app)
        .get('/api/v1/producers')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          assert.ok(res.body.producers);
          assert.ok(res.body.metadata);
          assert.strictEqual(res.body.producers.length, 0);

          // Check default metadata
          assert.strictEqual(res.body.metadata.active_producer_count, 21);
          assert.strictEqual(res.body.metadata.num_standby_slots, 0);
          assert.strictEqual(res.body.metadata.weighted_voting_enabled, false);
          assert.strictEqual(res.body.metadata.guilds_contract, 'guilds.oig');
          assert.strictEqual(res.body.metadata.bp_score_scaling_factor, 1000);

          done();
        });
    });

    it('should handle missing cacheData gracefully', function(done) {
      globalsStub.get.withArgs('cacheData').returns(undefined);

      request(app)
        .get('/api/v1/producers')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          assert.ok(res.body.producers);
          assert.ok(res.body.metadata);
          assert.strictEqual(res.body.producers.length, 0);

          done();
        });
    });
  });

  describe('Producer Data Validation', function() {
    it('should ensure all active producers have is_in_schedule=true', function(done) {
      const mockCacheData = {
        producers: Array.from({ length: 10 }, (_, i) => ({
          owner: `producer${i + 1}`,
          rank: i + 1,
          status: i < 5 ? 'active' : i < 8 ? 'standby' : 'inactive',
          is_in_schedule: i < 5,
          total_votes: `${50000 - i * 1000}000000000000000`,
          actual_votes: 5000000 - i * 100000,
          weighted_votes: `${50000 - i * 1000}000000000000000`,
          guild_score: 1000,
          weight_multiplier: 1.0,
        })),
        producer_metadata: {
          active_producer_count: 5,
          num_standby_slots: 3,
          weighted_voting_enabled: false,
          guilds_contract: 'guilds.oig',
          bp_score_scaling_factor: 1000,
        },
      };

      globalsStub.get.withArgs('cacheData').returns(mockCacheData);

      request(app)
        .get('/api/v1/producers')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          const producers = res.body.producers;

          // All active producers should have is_in_schedule=true
          const activeProducers = producers.filter(p => p.status === 'active');
          assert.strictEqual(activeProducers.length, 5);
          activeProducers.forEach(p => {
            assert.strictEqual(p.is_in_schedule, true, `Producer ${p.owner} is active but is_in_schedule is false`);
          });

          // All standby producers should have is_in_schedule=false
          const standbyProducers = producers.filter(p => p.status === 'standby');
          assert.strictEqual(standbyProducers.length, 3);
          standbyProducers.forEach(p => {
            assert.strictEqual(p.is_in_schedule, false, `Producer ${p.owner} is standby but is_in_schedule is true`);
          });

          // All inactive producers should have is_in_schedule=false
          const inactiveProducers = producers.filter(p => p.status === 'inactive');
          assert.strictEqual(inactiveProducers.length, 2);
          inactiveProducers.forEach(p => {
            assert.strictEqual(p.is_in_schedule, false, `Producer ${p.owner} is inactive but is_in_schedule is true`);
          });

          done();
        });
    });
  });
});
