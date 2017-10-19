import resource from 'resource-router-middleware';
import appliances from '../models/appliances';

export default ({ config, db }) => resource({

	/** Property name to store preloaded entity on `request`. */
	id : 'appliance',

	/** For requests with an `id`, you can auto-load the entity.
	 *  Errors terminate the request, success sets `req[id] = data`.
	 */
	load(req, id, callback) {
    appliances.get(id).then(appliance => {
      callback(null, appliance);
    }, err => {
      callback(err);
    });
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
		appliances.watch(appliance.haId);
	},

	/** PUT /:id - Update a given entity */
	update({ appliance, body }, res) {
		// for (let key in body) {
		// 	if (key!=='id') {
		// 		appliance[key] = body[key];
		// 	}
		// }
		res.sendStatus(418);
	},

	/** DELETE /:id - Delete a given entity */
	delete({ appliance }, res) {
		res.sendStatus(418);
	}
});
