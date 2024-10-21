const request = require('supertest');
const app = require('../src/server'); // Import your Express app

describe('Server and Routes', () => {
    let server;

    beforeEach((done) => {
        server = app.listen(3000, () => {
            done();
        });
    });

    afterEach((done) => {
        server.close(done);
    });

    // Test the root route ("/")
    test('GET / should return "Nothing of note here."', async () => {
        const response = await request(server).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('Nothing of note here.');
    });

    // Test the /users route
    test('POST /users should create a user and return a 200 status', async () => {
        const newUser = {
            username: 'testuser',
            password: 'testpassword'
        };

        const response = await request(server)
            .post('/users')
            .send(newUser);
            
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('msg', 'User created.');
    });
});
