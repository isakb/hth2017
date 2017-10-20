import { version } from '../../package.json';
import { Router } from 'express';
import appliances from './appliances';
import spotify from './devices';
import trigger from './trigger';
import auth from './auth';

export default ({ config, db }) => {
	let api = Router();

	// mount the home appliances resource
	api.use('/appliances', appliances({config, db}));

    api.use('/devices', spotify({config, db}));

	api.post('/covfefe', trigger);

	api.get('/auth', auth);
	api.post('/auth', auth);

	// perhaps expose some API metadata at the root
	api.get('/', (req, res) => {
		res.json({ version });
	});

	return api;
}
