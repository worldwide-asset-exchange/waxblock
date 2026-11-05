# Test Suite Documentation

This directory contains the test suite for the WAX blockchain explorer server, specifically focused on the guild-based producer ordering system.

## Setup

Run all commands from the monorepo root. Install the test dependencies:

```bash
npm ci
```

## Running Tests

Run all tests:
```bash
npm run test:api
```

Run tests in watch mode (auto-rerun on file changes):
```bash
npm run test:watch --workspace=apps/api
```

Run only producer helper tests:
```bash
npm run test:producer --workspace=apps/api
```

Run only API endpoint tests:
```bash
npm run test:api --workspace=apps/api
```

## Test Files

### producer.test.js

Unit tests for the producer helper module (`src/helpers/producer.js`). Tests include:

**Guild-Based Weighted Voting**
- ✓ Applies guild weight multipliers when weighted voting is enabled
- ✓ Does not apply guild weighting when weighted voting is disabled
- ✓ Correctly calculates weight multipliers from guild scores

**Producer Status Classification**
- ✓ Correctly classifies producers as active, standby, and inactive
- ✓ Handles variable active producer counts (not always 21)
- ✓ Respects num_standby_slots configuration

**Metadata Response**
- ✓ Returns correct metadata structure with all required fields
- ✓ Includes active_producer_count, num_standby_slots, weighted_voting_enabled, etc.

**Tie-Breaking**
- ✓ Uses producer name for deterministic tie-breaking when votes are equal

**Default Values Handling**
- ✓ Uses default values when global state is unavailable
- ✓ Applies default guild score to producers not in guilds table

### api.test.js

Integration tests for the `/producers` API endpoint. Tests include:

**API Response Structure**
- ✓ Returns producers array with metadata object
- ✓ Includes all producer fields (status, rank, guild data, etc.)
- ✓ Returns default metadata when cache is empty

**Producer Data Validation**
- ✓ Ensures all active producers have is_in_schedule=true
- ✓ Ensures standby producers have is_in_schedule=false
- ✓ Ensures inactive producers have is_in_schedule=false
- ✓ Validates status field matches producer classification

**Error Handling**
- ✓ Handles missing cacheData gracefully
- ✓ Returns valid response structure even with empty data

## Test Coverage

The test suite covers:

1. **Guild Weighting Logic**
   - Weight multiplier calculation
   - Weighted vote sorting
   - Enable/disable toggle functionality

2. **Producer Classification**
   - Active producer identification (ranks 1 to N)
   - Standby producer identification (ranks N+1 to N+M)
   - Inactive producer identification (remaining producers)
   - Variable producer counts (not hardcoded to 21)

3. **API Response Format**
   - Correct JSON structure
   - All metadata fields present
   - Producer objects contain all required fields

4. **Edge Cases**
   - Missing global state tables
   - Empty producer lists
   - Producers not in guilds table
   - Vote ties
   - Disabled weighted voting

## Example Test Output

```
  Producer Helper - Guild-Based Ordering
    Guild-Based Weighted Voting
      ✓ should apply guild weight multipliers when weighted voting is enabled (245ms)
      ✓ should not apply guild weighting when weighted voting is disabled (156ms)
    Producer Status Classification
      ✓ should correctly classify producers as active, standby, and inactive (189ms)
      ✓ should handle variable active producer count (201ms)
    Metadata Response
      ✓ should return correct metadata structure (134ms)
    Tie-Breaking
      ✓ should use producer name for deterministic tie-breaking (178ms)
    Default Values Handling
      ✓ should use default values when global state is unavailable (145ms)
      ✓ should apply default guild score to producers not in guilds table (167ms)

  Producer API Endpoint
    GET /producers
      ✓ should return producers with metadata (89ms)
      ✓ should return default metadata when cache is empty (45ms)
      ✓ should handle missing cacheData gracefully (41ms)
    Producer Data Validation
      ✓ should ensure all active producers have is_in_schedule=true (67ms)

  12 passing (2s)
```

## Adding New Tests

To add new tests:

1. Create a new test file in `/test/` with the `.test.js` extension
2. Follow the existing test structure using Mocha's `describe` and `it` blocks
3. Use Sinon for mocking blockchain API calls
4. Use Supertest for API endpoint testing
5. Use Node's built-in `assert` for assertions

Example test structure:

```javascript
const assert = require('assert');
const sinon = require('sinon');

describe('Feature Name', function() {
  let mockDependency;

  beforeEach(function() {
    mockDependency = sinon.stub();
  });

  it('should do something specific', function() {
    // Arrange
    mockDependency.returns('expected value');

    // Act
    const result = functionUnderTest(mockDependency);

    // Assert
    assert.strictEqual(result, 'expected value');
  });
});
```

## Mocking Strategy

The tests use mocking to avoid hitting real blockchain endpoints:

- **BlockchainApiManager**: Mocked to return predefined blockchain data
- **FetchManager**: Mocked to simulate bp.json fetches
- **node-global-storage**: Mocked for API tests to simulate cache data

This allows tests to run quickly and reliably without network dependencies.
