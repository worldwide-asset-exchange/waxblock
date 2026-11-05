import config from "../config";
import { calculatedVoteWeight } from "../utilities/converter";
import BlockchainApiManager from "./blockchainApiManager";

const LocalnetManager = {
  async getProducers() {
    let producers = [];
    const params = {
      code: "eosio",
      scope: "eosio",
      table: "producers",
      lower_bound: null,
      upper_bound: null,
      json: true,
      limit: 100,
    };
    let more;
    do {
      const producersResponse = await BlockchainApiManager.getTableRows(
        params,
      ).catch((err) => console.log("producers getTableRows error", err));

      if (producersResponse && producersResponse.rows) {
        producers = [...producers, ...producersResponse.rows];
        more = producersResponse.more || false;
        params.lower_bound = producersResponse.next_key || null;
      } else {
        more = false;
      }
    } while (more);

    for (const producer of producers) {
      const producerData = null;

      const actual_votes =
        producer.total_votes /
        calculatedVoteWeight() /
        Math.pow(10, config.token_precision);

      const weighted_votes =
        producer.total_votes /
        calculatedVoteWeight() /
        Math.pow(10, config.token_precision);

      const candidate_name =
        producerData && producerData.org
          ? producerData.org.candidate_name
          : producer.owner;

      const location_name =
        producerData && producerData.org ? producerData.org.location.name : "";

      let logo = null;
      if (
        producerData &&
        producerData.org &&
        producerData.org.branding.logo_256
      ) {
        logo = producerData.org.branding.logo_256;
      } else if (
        producerData &&
        producerData.org &&
        producerData.org.branding.logo_1024
      ) {
        logo = producerData.org.branding.logo_1024;
      }

      producer.actual_votes = actual_votes;
      producer.weighted_votes = weighted_votes;
      producer.candidate_name = candidate_name;
      producer.location_name = location_name;
      producer.logo = logo;
    }

    producers.sort(function (a, b) {
      return parseFloat(b.total_votes) - parseFloat(a.total_votes);
    });

    producers.map((producer, index) => {
      producer.rank = index + 1;
    });

    return {
      producers: producers,
      metadata: {
        active_producer_count: 21,
        num_standby_slots: 0,
        weighted_voting_enabled: false,
        guilds_contract: "guilds.oig",
        bp_score_scaling_factor: 1000,
      },
    };
  },
  async getBalances(account_name) {
    const balances = { account_name: account_name, balances: [] };

    const tokensResponse = await BlockchainApiManager.getV2Tokens(
      account_name,
    ).catch((err) => console.log("getV2Tokens error", err));
    if (tokensResponse && tokensResponse.tokens) {
      for (const token of tokensResponse.tokens) {
        balances.balances.push({
          currency: token.symbol,
          contract: token.contract,
          decimals: token.precision,
          amount: token.amount,
        });
      }
    }

    return balances;
  },
};

export default LocalnetManager;
