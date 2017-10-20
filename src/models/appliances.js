const {clientId, clientSecret} = require('../api-config');
const queryString = require('query-string');
const EventSource = require('eventsource');
const axios = require('axios');
const opn = require('opn');
const musicForEveryMoment = require('./musicForEveryMoment.json');
import devices from './devices';

const apiHost = process.env.PRODUCTION ?
  'https://api.home-connect.com' :
  'https://developer.home-connect.com';

axios.interceptors.request.use(request => {
  console.log('Starting Request', request)
  return request
})

axios.interceptors.response.use(response => {
  console.log('Response:', response)
  return response
})

let accessToken;
let codeResolver;

const scopes = ['IdentifyAppliance', 'Monitor', 'Control', 'Settings'];

const getCode = () => {

  if (process.env.PRODUCTION) {
    var url = apiHost + '/security/oauth/authorize' +
      '?response_type=code' +
      '&client_id=' + clientId +
      '&redirect_uri=' + encodeURIComponent('http://localhost:8080/api/auth') +
      '&scope=' + encodeURIComponent(scopes.join(' '));

    console.log('Go to ' + url);
    opn(url);

    return new Promise((resolve, reject) => {
      codeResolver = resolve;
    });
  }

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
    redirect_uri: process.env.PRODUCTION ? 'http://localhost:8080/api/auth' : undefined,
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
  const a = axios.create({
    baseURL: `${apiHost}/api`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.bsh.sdk.v1+json',
    },
  });

  a.interceptors.request.use(request => {
    console.log('Starting Request', request)
    return request
  })

  a.interceptors.response.use(response => {
    console.log('Response:', response)
    return response
  })

  return a;
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

let lastPlayRequest = Date.now();
let playPrimed = false;
let lastProgram = null;

const defaultEventCallback = ({data}) => {
  const state = JSON.parse(data);
  console.log('got state', state);

  const progressUpdate = state.items
    .find(i => i.key === 'BSH.Common.Option.ProgramProgress');

  const programChange = state.items
    .find(i => i.key === 'BSH.Common.Root.SelectedProgram');

  const activeProgramChange = state.items
    .find(i => i.key === 'BSH.Common.Root.ActiveProgram');

  console.log('programChange', programChange);
  console.log('progressUpdate', progressUpdate);

  if (programChange && programChange.value) {
    console.log('The program changed to:', programChange.value);
  }

  if (activeProgramChange) {
    if (activeProgramChange.value) {
      if (activeProgramChange.value != lastProgram) {
        console.log('The active program set to:', activeProgramChange.value);
        lastProgram = activeProgramChange.value;
        console.log('Prime play');
        playPrimed = true;
      }
    } else {
      console.log('The active program stopped');
      lastProgram = null;
    }
  }

  if (progressUpdate) {
    console.log('The progress changed to:', progressUpdate.value);
    if (playPrimed) {
      playPrimed = false;
      console.log('The program just started.');

      var T = Date.now();
      var DT = T - lastPlayRequest;
      console.log('Time since last call', DT);

      if (DT < 10000) {
        console.log('Ignoring repeated duplicate event...')
        return;
      }

      lastPlayRequest = T;

      const uriCandidates = musicForEveryMoment[lastProgram];
      if (!uriCandidates) {
        return;
      }

      const randomOffset = Math.floor(Math.random() * uriCandidates.length);
      const uri = uriCandidates[randomOffset];
      console.log(
        'The assiciated possible spotify URIs are:', uriCandidates,
        'and the selected URI is', uri);
      devices.play(uriCandidates, randomOffset);
    }
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

appliances.activateProgram = (homeApplianceId, key, options) => {
  return getApi()
    .then(api => api.put(
      `/homeappliances/${homeApplianceId}/programs/active`,
      {
        data: {
          key,
          options
        }
      },
      {
        headers: {
          'Content-Type': 'application/vnd.bsh.sdk.v1+json',
          'Accept-Language': 'en-US'
        }
      }
    )
      .then(r => {
        console.log(r);
        return r;
      })
      .catch(e => {
        console.log('err', e);
      }));
}

appliances.setAuthCode = (authcode) => {
  if (codeResolver) {
    codeResolver(authcode);
  }
}

export default appliances;
