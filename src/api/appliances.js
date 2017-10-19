import resource from 'resource-router-middleware';
import appliances from '../models/appliances';

export default ({ config, db }) => resource({

	/** Property name to store preloaded entity on `request`. */
	id : 'appliance',

	/** For requests with an `id`, you can auto-load the entity.
	 *  Errors terminate the request, success sets `req[id] = data`.
	 */
	load(req, id, callback) {
		let appliance = appliances.find( appliance => appliance.id === id ),
			err = appliance ? null : 'Not found';
		callback(err, appliance);
	},

	/** GET / - List all appliances */
	index({ params }, res) {
		appliances.list().then(appliances => res.json(appliances));
	},

	/** POST / - Create a new entity */
	create({ body }, res) {
		body.id = appliances.length.toString(36);
		appliances.push(body);
		res.json(body);
	},

	/** GET /:id - Return a given entity */
	read({ appliance }, res) {
		res.json(appliance);
	},

	/** PUT /:id - Update a given entity */
	update({ appliance, body }, res) {
		for (let key in body) {
			if (key!=='id') {
				appliance[key] = body[key];
			}
		}
		res.sendStatus(204);
	},

	/** DELETE /:id - Delete a given entity */
	delete({ appliance }, res) {
		appliances.splice(appliances.indexOf(appliance), 1);
		res.sendStatus(204);
	}
});
