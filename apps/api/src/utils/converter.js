var moment = require('moment');

const calculatedVoteWeight = () => {
    const timestamp_epoch = 946684800;
    const dates_number = moment().unix() - timestamp_epoch;
   
    const weight_number = Math.floor(dates_number / (86400 * 7)) / 13;  //86400 = seconds per day 24*3600
   
    const calculatedVoteWeight = Math.pow(2, weight_number);

    return calculatedVoteWeight;
}

module.exports =  {calculatedVoteWeight}