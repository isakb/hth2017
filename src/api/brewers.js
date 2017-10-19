import resource from 'resource-router-middleware';
import brewers from '../models/brewers';

export default ({ config, db }) => resource({

	/** Property name to store preloaded entity on `request`. */
	id : 'brewer',

	/** For requests with an `id`, you can auto-load the entity.
	 *  Errors terminate the request, success sets `req[id] = data`.
	 */
	load(req, id, callback) {
		let brewer = brewers.find( brewer => brewer.id === id ),
			err = brewer ? null : 'Not found';
		callback(err, brewer);
	},

	/** GET / - List all brewers */
	index({ params }, res) {
		res.json(brewers);
	},

	/** POST / - Create a new entity */
	create({ body }, res) {
		body.id = brewers.length.toString(36);
		brewers.push(body);
		res.json(body);
	},

	/** GET /:id - Return a given entity */
	read({ brewer }, res) {
		res.json(brewer);
	},

	/** PUT /:id - Update a given entity */
	update({ brewer, body }, res) {
		for (let key in body) {
			if (key!=='id') {
				brewer[key] = body[key];
			}
		}
		res.sendStatus(204);
	},

	/** DELETE /:id - Delete a given entity */
	delete({ brewer }, res) {
		brewers.splice(brewers.indexOf(brewer), 1);
		res.sendStatus(204);
	}
});
