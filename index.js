import axios from 'axios';
import _ from 'lodash';

const url = 'https://www.worldometers.info/coronavirus/coronavirus-death-toll/';
const url2 = 'https://www.worldometers.info/coronavirus/coronavirus-cases/'
const regex = /data\:\s*\[([0-9]+,\s?)+[0-9]+\]/g;
const futureDays = 10;

async function getInfo(url) {
    return axios.get(url)
    .then((res) => {
        return res.data;
    }).then((html) => {
        const results = html.match(regex);
        return results;
    }).then((res) => {
        return _.map(res, (str) => {
            return JSON.parse(_.last(str.split(':')));
        });
    }).then((res) => {
        return {
            total: _.first(res),
            daily: _.last(res),
        };
    }).then((res) => {
        res.lastDaily = _.last(res.daily);
        res.lastTotal = _.last(res.total);
        res.dailyRateOfChange = _.compact(_.map(res.daily, (d, i) => {
            if (! (i && (i-1))) {
                return 0;
            }
            const out = (d / res.daily[i-1]);
            // console.log(res.dailys[i-1], d, out)
            return out;
        }));
        const recentDays = 10;
        res.recentDailyRateOfChange = _.takeRight(res.dailyRateOfChange, recentDays)
        res.dailyTotalChange = res.dailyRateOfChange.reduce((x, y) => x + y);
        res.dailyChangeRatio = res.dailyTotalChange / res.dailyRateOfChange.length;
        res.recentDailyTotalChange = res.recentDailyRateOfChange.reduce((x, y) => x + y);
        res.recentDailyChangeRatio = res.recentDailyTotalChange / res.recentDailyRateOfChange.length;
        return res;
    }).then((res) => {
        // console.log(res);
        return res;
    }).catch((err) => {
        console.error(err);
    });
}

async function deathAfter(url, days) {
    const info = await getInfo(url);
    let newDaily = info.lastDaily;
    let newTotal = info.lastTotal;
    let newRecentDaily = info.lastDaily;
    let newRecentTotal = info.lastTotal;
    _.times(days, () => {
        newDaily *= info.dailyChangeRatio;
        newTotal += newDaily;
        newRecentDaily *= info.recentDailyChangeRatio;
        newRecentTotal += newRecentDaily;
    });
    return {
        lastDaily: Math.round(info.lastDaily),
        lastTotal: Math.round(info.lastTotal),
        newDaily: Math.round(newDaily),
        newTotal: Math.round(newTotal),
        newRecentDaily: Math.round(newRecentDaily),
        newRecentTotal: Math.round(newRecentTotal),
    };
}
function inK(v) {
    return Math.round(v/1000);
}
Promise.all([
    deathAfter(url, futureDays),
    deathAfter(url2, futureDays)
]).then((results) => {
    const death = _.first(results);
    const cases = _.last(results);
    const futureDailyAvgDeath = (death.newDaily + death.newRecentDaily) / 2;
    const futureTotalAvgDeath = (death.newTotal + death.newRecentTotal) / 2;
    const futureDailyAvgCases = (cases.newDaily + cases.newRecentDaily) / 2;
    const futureTotalAvgCases = (cases.newTotal + cases.newRecentTotal) / 2;
    console.log(`
    Last Daily Death:\t ${inK(death.lastDaily)}K,\t In ${futureDays} Days: \t ${inK(futureDailyAvgDeath)}K
    Total Death:\t ${inK(death.lastTotal)}K,\t In ${futureDays} Days: \t ${inK(futureTotalAvgDeath)}K
    `)
    console.log(`
    Last Daily Cases:\t ${inK(cases.lastDaily)}K,\t In ${futureDays} Days: \t ${inK(futureDailyAvgCases)}K
    Total Cases:\t ${inK(cases.lastTotal)}K,\t In ${futureDays} Days: \t ${inK(futureTotalAvgCases)}K
    `)
});
