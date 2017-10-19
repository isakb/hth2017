const {clientId, clientSecret} = require('../.api-config.json');
const queryString = require('query-string');
const EventSource = require('eventsource');
const axios = require('axios');

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

appliances.watch = (homeApplianceId) => {
  getApi().then(() => {
    const es = new EventSource(`${apiHost}/api/homeappliances/${homeApplianceId}/events`, {
      headers: {
        'Accept': 'text/event-stream',
        'Authorization': 'Bearer ' + accessToken
      }
    });

    es.addEventListener('NOTIFY', function (data) {
      console.log('coffeemaker statechange', JSON.parse(data.data));
    });

    es.addEventListener('error', function(err) {
      console.log('got error', err);
    });
  });
};

export default appliances;
