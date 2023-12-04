import { hash } from 'sha1';
import dbClient from '../utils/db';

class UsersController {
	static async postNew(req, res) {
		const { email, password } = req.body;

		if (!email) {
			return res.status(400).json({ error: 'Missing email' });
		}

		if (!password) {
			return res.status(400).json({ error: 'Missing password' });
		}

		try {
			const usersCount = await dbClient.nbUsers();
			const userExists = await dbClient.client.db().collection('users').findOne({ email });

			if (userExists) {
				return res.status(400).json({ error: 'Already exists' });
			}

			const hashedPassword = hash(password);

			const usersCollection = dbClient.client.db().collection('users');
			const result = await usersCollection.insertOne({ email, password: hashedPassword });

			const newUser = { email, _id: result.insertedId };
			return res.status(201).json(newUser);
		} catch (error) {
			console.error(`Error creating new user: ${error}`);
			return res.status(500).json({ error: 'Internal Server Error' });
		}
	}
}

export default UsersController;
