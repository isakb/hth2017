const {clientId, clientSecret} = require('../api-config');
const queryString = require('query-string');
const EventSource = require('eventsource');
const axios = require('axios');
const musicForEveryMoment = require('./musicForEveryMoment.json');

const apiHost = 'https://developer.home-connect.com';

let accessToken;

const scopes = [''];

const getCode = () => {
  return axios.get(apiHost + '/security/oauth/authorize', {
    params: {
      response_type: 'code',
      client_id: clientId,
      scope: scopes.join(' '),
    },
    maxRedirects: 0,
  }).then((res) => {
    throw new Error('Expected an HTTP 302 redirect.');
  }, err => {
    if (err.response.status !== 302) {
      throw new Error('Expected an HTTP 302 redirect but got ' + err.response.status);
    }
    const redirectUrl = err.response.headers.location;
    const code = /code=(.+?)&/.exec(redirectUrl)[1];
    return code;
  });
};

const getToken = (code) => {
  const url = apiHost + '/security/oauth/token';
  const qs = queryString.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code: code,
  });
  return axios.post(url, qs, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    }
  }).then(res => res.data.access_token);
};

const apiPromise = getCode().then(getToken).then(token => {
  console.log('API ready. Using token:', token);
  accessToken = token;
  return axios.create({
    baseURL: `${apiHost}/api`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.bsh.sdk.v1+json',
    },
  });
});

const getApi = () => {
  return apiPromise;
};

const appliances = {};

appliances.list = () => {
  return getApi().then(api => api.get('/homeappliances').then(r => r.data.data.homeappliances));
};

appliances.get = homeApplianceId => {
  return getApi().then(api => api.get(`/homeappliances/${homeApplianceId}`).then(r => r.data.data));
};

appliances.watch = (homeApplianceId, callback) => {
  getApi().then(() => {
    const es = new EventSource(`${apiHost}/api/homeappliances/${homeApplianceId}/events`, {
      headers: {
        'Accept': 'text/event-stream',
        'Authorization': 'Bearer ' + accessToken
      }
    });
    es.addEventListener('NOTIFY', callback);
  });
};

const defaultEventCallback = ({data}) => {
  const state = JSON.parse(data);
  const programChange = state.items.find(i => i.key === 'BSH.Common.Root.ActiveProgram');
  if (programChange && programChange.value) {
    console.log('The program changed to:', programChange.value);
    console.log('Details', programChange);
    const uriCandidates = musicForEveryMoment[programChange.value];
    if (uriCandidates) {
      const uri = uriCandidates[Math.floor(Math.random() * uriCandidates.length)];
      console.log(
        'The assiciated possible spotify URIs are:', uriCandidates,
        'and the selected URI is', uri);
      // TODO: Play the music.
    }
  } else if (programChange && programChange.value === null) {
    console.log('The program changed to default state.');
    // TODO: Pause music?
  }
};

appliances.monitorAll = (callback = defaultEventCallback) => {
  function toString(a) {
    return `${a.brand} ${a.type}: ${a.name} (${a.vib} ${a.enumber})`;
  }
  console.log('Getting list of appliances...');
  appliances.list().then(as => {
    console.log('Monitoring appliances:');
    as.filter(a => a.connected).forEach(appliance => {
      console.log(toString(appliance));
      appliances.watch(appliance.haId, callback);
    });
  });
};

export default appliances;
