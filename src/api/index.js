import { version } from '../../package.json';
import { Router } from 'express';
import appliances from './appliances';
import spotify from './devices';

export default ({ config, db }) => {
	let api = Router();

	// mount the home appliances resource
	api.use('/appliances', appliances({config, db}));

  api.use('/devices', spotify({config, db}));

	// perhaps expose some API metadata at the root
	api.get('/', (req, res) => {
		res.json({ version });
	});

	return api;
}
