const BlockchainApiManager = require("../services/blockchainApiManager");
const FetchManager = require("../services/fetchManager");
const fetch = require("node-fetch");
const config = require("../config/config");
const { calculatedVoteWeight } = require("../utils/converter");

const getProducers = () => {
  return new Promise(async (resolve, reject) => {
    let producers = [];
    let params = {
      code: "eosio",
      scope: "eosio",
      table: "producers",
      lower_bound: null,
      upper_bound: null,
      json: true,
      limit: 100,
    };
    let more = false;
    do {
      const producersResponse = await BlockchainApiManager.getTableRows(params).catch((err) => console.log('producers getTableRows error', err));

      if (producersResponse && producersResponse.rows) {
        producers = [...producers, ...producersResponse.rows];
        more = producersResponse.more || false;
        params.lower_bound = producersResponse.next_key || null;
      } else {
        more = false;
      }
    } while (more);

    resolve(producers);
  });
};

const getGlobalState4 = () => {
  return new Promise(async (resolve, reject) => {
    const global4Response = await BlockchainApiManager.getTableRows({
      code: "eosio",
      scope: "eosio",
      table: "global4",
      limit: 1,
    }).catch((err) => {
      console.log('global4 getTableRows error', err);
      return reject(err);
    });

    if (global4Response && global4Response.rows && global4Response.rows.length > 0) {
      resolve(global4Response.rows[0]);
    } else {
      resolve({
        active_producer_count: 21,
        num_standby_slots: 0
      }); // Defaults if not found
    }
  });
};

const getGlobalState6 = () => {
  return new Promise(async (resolve, reject) => {
    const global6Response = await BlockchainApiManager.getTableRows({
      code: "eosio",
      scope: "eosio",
      table: "global.a",
      limit: 1,
    }).catch((err) => {
      console.log('global.a getTableRows error', err);
      return reject(err);
    });

    if (global6Response && global6Response.rows && global6Response.rows.length > 0) {
      resolve(global6Response.rows[0]);
    } else {
      // Default values if not found
      resolve({
        guilds_contract: "guilds.oig",
        bp_score_scaling_factor: 1000,
        bp_default_score: 1000,
        enable_weighted_voting: false,
      });
    }
  });
};

const getGuilds = (guildsContract) => {
  return new Promise(async (resolve, reject) => {
    let guilds = [];
    let params = {
      code: guildsContract,
      scope: guildsContract,
      table: "guilds",
      lower_bound: null,
      upper_bound: null,
      json: true,
      limit: 100,
    };
    let more = false;
    do {
      const guildsResponse = await BlockchainApiManager.getTableRows(params).catch((err) => {
        console.log('guilds getTableRows error', err);
        return { rows: [], more: false };
      });

      if (guildsResponse && guildsResponse.rows) {
        guilds = [...guilds, ...guildsResponse.rows];
        more = guildsResponse.more || false;
        params.lower_bound = guildsResponse.next_key || null;
      } else {
        more = false;
      }
    } while (more);

    resolve(guilds);
  });
};

const getProducerData = (producer) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!producer.url) reject(new Error("Bp json url empty"));

      // if(producer.owner !== 'cryptolions1') reject()

      const url = `${producer.url}/bp.json`;
      //console.log(`Process ${producer.owner} : ${url}`);
      const producerDataResponse = await FetchManager.get(url).catch(
        (error) => {}
      );

      resolve(producerDataResponse);
    } catch (error) {
      reject(error);
    }
  });
};

const generateProducersRank = () => {
  return new Promise(async (resolve, reject) => {
    // Fetch all required data
    let producers = await getProducers();
    const globalState4 = await getGlobalState4().catch((err) => ({ active_producer_count: 21 }));
    const globalState6 = await getGlobalState6().catch((err) => ({
      guilds_contract: "guilds.oig",
      bp_score_scaling_factor: 1000,
      bp_default_score: 1000,
      enable_weighted_voting: false,
    }));

    // Fetch guilds table if weighted voting is enabled
    let guildsMap = new Map();
    if (globalState6.enable_weighted_voting) {
      const guilds = await getGuilds(globalState6.guilds_contract).catch((err) => []);
      guilds.forEach((guild) => {
        guildsMap.set(guild.producer, guild);
      });
    }

    producers = producers.filter((producer) => producer.is_active === 1);

    for (let [index, producer] of producers.entries()) {
      let producerData = await getProducerData(producer).catch((error) => {});

      // Calculate actual_votes from total_votes (unmodified - the "actual" votes cast)
      let actual_votes =
        producer.total_votes /
        calculatedVoteWeight() /
        Math.pow(10, config.token_precision);

      const producerOrg = producerData && producerData.org ? producerData.org : {};

      let candidate_name = producerOrg.candidate_name || producer.owner;

      let location_name =
        producerOrg.location && producerOrg.location.name
          ? producerOrg.location.name
          : "";

      let logo = null;
      if (producerOrg.branding && producerOrg.branding.logo_256) {
        logo = producerOrg.branding.logo_256;
      } else if (producerOrg.branding && producerOrg.branding.logo_1024) {
        logo = producerOrg.branding.logo_1024;
      }

      // Calculate guild weight multiplier
      let guild_score = globalState6.bp_default_score;
      let guild_data = null;
      if (guildsMap.has(producer.owner)) {
        const guild = guildsMap.get(producer.owner);
        guild_score = guild.score;
        guild_data = {
          score: guild.score,
          prv_score: guild.prv_score,
          balance: guild.balance,
          eligibility: guild.eligibility,
          autopay: guild.autopay,
          retired: guild.retired,
        };
      }

      const weight_multiplier =
        globalState6.bp_score_scaling_factor > 0
          ? guild_score / globalState6.bp_score_scaling_factor
          : 1.0;

      // Calculate weighted votes (raw value for ordering)
      const weighted_votes_raw = globalState6.enable_weighted_voting
        ? parseFloat(producer.total_votes) * weight_multiplier
        : parseFloat(producer.total_votes);

      // Convert weighted votes to human-readable format (for display)
      const weighted_votes =
        weighted_votes_raw /
        calculatedVoteWeight() /
        Math.pow(10, config.token_precision);

      producer.actual_votes = actual_votes;
      producer.candidate_name = candidate_name;
      producer.location_name = location_name;
      producer.logo = logo;
      producer.guild_score = guild_score;
      producer.weight_multiplier = weight_multiplier;
      producer.weighted_votes = weighted_votes;
      producer.weighted_votes_raw = weighted_votes_raw; // Keep raw value for sorting
      producer.guild_data = guild_data;
    }

    // Sort by weighted votes raw (descending), with producer name as tie-breaker
    producers.sort(function (a, b) {
      if (a.weighted_votes_raw === b.weighted_votes_raw) {
        return a.owner < b.owner ? -1 : 1; // Deterministic tie-breaker
      }
      return b.weighted_votes_raw - a.weighted_votes_raw;
    });

    // Assign ranks and classify producers
    const active_producer_count = globalState4.active_producer_count || 21;
    const num_standby_slots = globalState4.num_standby_slots || 0;

    producers.map((producer, index) => {
      producer.rank = index + 1;

      // Classify producer status
      if (index < active_producer_count) {
        producer.status = "active";
        producer.is_in_schedule = true;
      } else if (index < active_producer_count + num_standby_slots) {
        producer.status = "standby";
        producer.is_in_schedule = false;
      } else {
        producer.status = "inactive";
        producer.is_in_schedule = false;
      }
    });

    // Create result object with metadata
    const result = {
      producers: producers,
      active_producer_count: active_producer_count,
      num_standby_slots: num_standby_slots,
      weighted_voting_enabled: globalState6.enable_weighted_voting,
      guilds_contract: globalState6.guilds_contract,
      bp_score_scaling_factor: globalState6.bp_score_scaling_factor,
    };

    resolve(result);
  });
};

module.exports = { generateProducersRank };
