import config from "../config";
import { calculatedVoteWeight } from "./converter";

const calculateFullBreakDown = () => {};

const calculateBreakDown = ({ account, userres, delband }) => {
  let totalBalance = 0;
  let liquidBalance = 0;
  let stakedSelf = 0;
  let stakedByOthers = 0;
  let stakedToOthers = 0;
  const stakedSelfToOthers = 0;

  let cpuStaked = 0;
  let cpuStakedSelf = 0;
  let cpuStakedByOthers = 0;
  let cpuStakedToOthers = 0;

  let netStaked = 0;
  let netStakedSelf = 0;
  let netStakedByOthers = 0;
  let netStakedToOthers = 0;

  let unstaking = 0;
  let unstakingStartDate = null;
  let staked = 0;
  let unstaked = 0;

  if (account) {
    liquidBalance = account.core_liquid_balance
      ? parseFloat(account.core_liquid_balance)
      : 0;

    cpuStakedSelf += account.self_delegated_bandwidth
      ? parseFloat(account.self_delegated_bandwidth.cpu_weight)
      : 0;
    netStakedSelf += account.self_delegated_bandwidth
      ? parseFloat(account.self_delegated_bandwidth.net_weight)
      : 0;

    if (userres) {
      cpuStakedByOthers = userres.rows[0]
        ? parseFloat(userres.rows[0].cpu_weight) - cpuStakedSelf
        : 0;
      netStakedByOthers = userres.rows[0]
        ? parseFloat(userres.rows[0].net_weight) - netStakedSelf
        : 0;
    }

    if (delband) {
      for (const index in delband.rows) {
        const accountStakedToOther = delband.rows[index];
        if (
          accountStakedToOther.from !== account.account_name ||
          accountStakedToOther.to === account.account_name
        ) {
          continue;
        }
        cpuStakedToOthers += accountStakedToOther.cpu_weight
          ? parseFloat(accountStakedToOther.cpu_weight)
          : 0;
        netStakedToOthers += accountStakedToOther.net_weight
          ? parseFloat(accountStakedToOther.net_weight)
          : 0;
      }
    }
    cpuStaked = cpuStakedSelf + cpuStakedByOthers + cpuStakedToOthers;
    netStaked = netStakedSelf + netStakedByOthers + netStakedToOthers;

    stakedSelf = cpuStakedSelf + netStakedSelf;
    stakedByOthers = cpuStakedByOthers + netStakedByOthers;
    stakedToOthers = cpuStakedToOthers + netStakedToOthers;

    staked += cpuStaked;
    staked += netStaked;

    unstaked = account.core_liquid_balance
      ? parseFloat(account.core_liquid_balance)
      : 0;

    unstaking += account.refund_request
      ? parseFloat(account.refund_request.net_amount)
      : 0;
    unstaking += account.refund_request
      ? parseFloat(account.refund_request.cpu_amount)
      : 0;
    unstakingStartDate = account.refund_request
      ? account.refund_request.request_time
      : null;

    totalBalance = 0;
    totalBalance += stakedSelf;
    totalBalance += stakedToOthers;
    totalBalance += unstaked;
    totalBalance += unstaking;
  }

  return {
    totalBalance: totalBalance,
    liquidBalance: liquidBalance,
    unstaked: unstaked,
    unstaking: unstaking,
    unstakingStartDate: unstakingStartDate,
    staked: staked,
    stakedSelf: stakedSelf,
    stakedByOthers: stakedByOthers,
    stakedToOthers: stakedToOthers,
    stakedSelfToOthers: stakedSelfToOthers,
    cpuStaked: cpuStaked,
    cpuStakedSelf: cpuStakedSelf,
    cpuStakedByOthers: cpuStakedByOthers,
    cpuStakedToOthers: cpuStakedToOthers,
    netStaked: netStaked,
    netStakedSelf: netStakedSelf,
    netStakedByOthers: netStakedByOthers,
    netStakedToOthers: netStakedToOthers,
  };
};

const getPermissionsTree = (list) => {
  const map = {};
  let node;
  const roots = [];
  let i;
  for (i = 0; i < list.length; i += 1) {
    map[list[i].perm_name] = i; // initialize the map
    list[i].children = []; // initialize the children
  }
  for (i = 0; i < list.length; i += 1) {
    node = list[i];
    if (node.parent !== "") {
      // if you have dangling branches check that map[node.parentId] exists
      list[map[node.parent]].children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
};

const calculateVotingPower = ({ account }) => {
  const stats = {
    voting_power: 0,
    voting_power_decay: 0,
    voting_power_proxied: 0,
  };
  if (!account || !account.voter_info) return stats;

  if (account.voter_info.is_proxy === 1) {
    stats.voting_power_proxied =
      account.voter_info.proxied_vote_weight /
      calculatedVoteWeight() /
      Math.pow(10, config.token_precision);

    stats.voting_power_decay =
      (account.voter_info.last_vote_weight -
        account.voter_info.proxied_vote_weight) /
      calculatedVoteWeight() /
      Math.pow(10, config.token_precision);
  } else {
    stats.voting_power_decay =
      account.voter_info.last_vote_weight /
      calculatedVoteWeight() /
      Math.pow(10, config.token_precision);
  }

  stats.voting_power =
    account.voter_info.staked / Math.pow(10, config.token_precision);

  return stats;
};

export {
  calculateFullBreakDown,
  calculateBreakDown,
  getPermissionsTree,
  calculateVotingPower,
};
