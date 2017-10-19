import { version } from '../../package.json';
import { Router } from 'express';
import appliances from './appliances';

export default ({ config, db }) => {
	let api = Router();

	// mount the coffee appliances resource
	api.use('/appliances', appliances({config, db}));


	// perhaps expose some API metadata at the root
	api.get('/', (req, res) => {
		res.json({ version });
	});

	return api;
}
