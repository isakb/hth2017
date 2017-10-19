import { version } from '../../package.json';
import { Router } from 'express';
import brewers from './brewers';

export default ({ config, db }) => {
	let api = Router();

	// mount the coffee brewers resource
	api.use('/brewers', brewers({config, db}));

	// perhaps expose some API metadata at the root
	api.get('/', (req, res) => {
		res.json({ version });
	});

	return api;
}
