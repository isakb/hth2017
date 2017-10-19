import resource from 'resource-router-middleware';
import devices from '../models/devices';

export default ({ config, db }) => resource({

	/** Property name to store preloaded entity on `request`. */
	id : 'device',

	/** For requests with an `id`, you can auto-load the entity.
	 *  Errors terminate the request, success sets `req[id] = data`.
	 */
	load(req, id, callback) {
    devices.get(id).then(device => {
      callback(null, device);
    }, err => {
      callback(err);
    });
	},

	/** GET / - List all devices */
	index({ params }, res) {
		devices.list().then(ds => res.json(ds));
	},

	/** POST / - Create a new entity */
	create({ body }, res) {
		body.id = devices.length.toString(36);
		devices.push(body);
		res.json(body);
	},

	/** GET /:id - Return a given entity */
	read({ device }, res) {
		res.json(device);
	},

	/** PUT /:id - Update a given entity */
	update({ device, body }, res) {
		// for (let key in body) {
		// 	if (key!=='id') {
		// 		device[key] = body[key];
		// 	}
		// }
		res.sendStatus(418);
	},

	/** DELETE /:id - Delete a given entity */
	delete({ device }, res) {
		res.sendStatus(418);
	}
});
