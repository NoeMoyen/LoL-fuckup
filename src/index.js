const { ftruncateSync } = require('fs');
const fetch = require('node-fetch');
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const Secret = require('./secrets');

const btoa = (string) => {
    return Buffer.from(string).toString('base64');
}

const auth = `${btoa(`${Secret.username}:${Secret.password}`)}`;

const get = (endpoint) => {
    console.log('starting get %s', endpoint);
    return fetch(`https://127.0.0.1:${Secret.port}${endpoint}`, {
        headers: {
            Accept: 'application/json',
            Authorization: `Basic ${auth}`
        }
    })
    .then(res => res.json())
    .then(res => {
        console.log('GET request finish for: %s', endpoint);
        return res;
    });
}

const isFriendOffline = (friend) => friend.availability === 'offline';

const serial = funcs => funcs.reduce((promiseChain, currentTask) =>
    promiseChain.then(chainResults =>
        currentTask().then(currentResult =>
            [...chainResults, currentResult]
        )
    ),
    Promise.resolve([])
);

(async function main() {
    const friends = await get(`/lol-chat/v1/friends`);
    const offlineFriends = friends.filter(isFriendOffline);

    const summonerFetchers = offlineFriends.slice(0,10).map(friend => () => get(`/lol-summoner/v1/summoners/${friend.summonerId}`));

    const results = await serial(summonerFetchers);

    console.log(results);

})();
