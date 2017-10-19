const axios = require('axios');

const apiHost = 'https://api.spotify.com/v1/me/player';

// TODO: get access token from:
// https://developer.spotify.com/web-api/console/get-users-available-devices/
const accessToken = process.env.SPOTIFY_ACCESS_TOKEN;

const api = axios.create({
  baseURL: `${apiHost}`,
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
});

const devices = {};

devices.list = () => {
  return api.get('/devices').then(
    r => r.data.devices,
    err => {
      console.error('devices list error', err);
    }
  );
};

devices.play = (uris, offset = 0) => {
  if (typeof uris === 'string') {
    uris = [uris];
  }
  return api.put('/play', {
    // data: {
    uris,
    offset: {
      position: offset,
    },
    // }
  }).then(
    res => res,
    err => {
      console.error('ERROR', err);
      return global.Promise.reject(err);
    }
  );
};

devices.pause = () => {
  return api.put('/pause');
};

export default devices;
