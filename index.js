import axios from 'axios';
import _ from 'lodash';

const url = 'https://www.worldometers.info/coronavirus/coronavirus-death-toll/';
const regex = /data\:\s*\[([0-9]+,\s?)+[0-9]+\]/g;
async function getInfo() {
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
            totalDeaths: _.first(res),
            dailyDeaths: _.last(res),
        };
    }).then((res) => {
        res.lastDailyDeath = _.last(res.dailyDeaths);
        res.lastTotalDeath = _.last(res.totalDeaths);
        res.dailyDeathRateOfChange = _.compact(_.map(res.dailyDeaths, (d, i) => {
            if (! (i && (i-1))) {
                return 0;
            }
            const out = (d / res.dailyDeaths[i-1]);
            // console.log(res.dailyDeaths[i-1], d, out)
            return out;
        }));
        const recentDays = 10;
        res.recentDailyDeathRateOfChange = _.takeRight(res.dailyDeathRateOfChange, recentDays)
        res.dailyDeathTotalChange = res.dailyDeathRateOfChange.reduce((x, y) => x + y);
        res.dailyDeathChangeRatio = res.dailyDeathTotalChange / res.dailyDeathRateOfChange.length;
        res.recentDailyDeathTotalChange = res.recentDailyDeathRateOfChange.reduce((x, y) => x + y);
        res.recentDailyDeathChangeRatio = res.recentDailyDeathTotalChange / res.recentDailyDeathRateOfChange.length;
        return res;
    }).then((res) => {
        // console.log(res);
        return res;
    }).catch((err) => {
        console.error(err);
    });
}

async function deathAfter(days) {
    const info = await getInfo();
    let newDailyDeath = info.lastDailyDeath;
    let newTotalDeath = info.lastTotalDeath;
    let newRecentDailyDeath = info.lastDailyDeath;
    let newRecentTotalDeath = info.lastTotalDeath;
    _.times(days, () => {
        newDailyDeath *= info.dailyDeathChangeRatio;
        newTotalDeath += newDailyDeath;
        newRecentDailyDeath *= info.recentDailyDeathChangeRatio;
        newRecentTotalDeath += newRecentDailyDeath;
    });
    return {
        lastDailyDeath: Math.round(info.lastDailyDeath),
        lastTotalDeath: Math.round(info.lastTotalDeath),
        newDailyDeath: Math.round(newDailyDeath),
        newTotalDeath: Math.round(newTotalDeath),
        newRecentDailyDeath: Math.round(newRecentDailyDeath),
        newRecentTotalDeath: Math.round(newRecentTotalDeath),
    };
}
function inK(v) {
    return Math.round(v/1000);
}
const futureDays = 10;
deathAfter(futureDays).then((res) => {
    const futureDailyAvg = (res.newDailyDeath + res.newRecentDailyDeath) / 2;
    const futureTotalAvg = (res.newTotalDeath + res.newRecentTotalDeath) / 2;
    console.log(`
    Last Daily Death:\t ${inK(res.lastDailyDeath)}K,\t In ${futureDays} Days: \t ${inK(futureDailyAvg)}K
    Total Death:\t ${inK(res.lastTotalDeath)}K,\t In ${futureDays} Days: \t ${inK(futureTotalAvg)}K
    `)
});
