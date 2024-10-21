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

    test('POST /users/login should return a JWT token', async () => {
        const user = {
            username: 'testuser',
            password: 'testpassword'
        };

        const response = await request(server)
            .post('/users/login')
            .send(user);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('msg', 'Login OK');
        expect(response.body).toHaveProperty('jwt');
        expect(response.body).toHaveProperty('user', 'testuser');

        jwtToken = response.body.jwt;
    });

    test('POST /users/login should return a 401 status for invalid credentials', async () => {
        const user = {
            username: 'testuser',
            password: 'wrongpassword'
        };

        const response = await request(server)
            .post('/users/login')
            .send(user);

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('msg', 'Invalid credentials');
    });

    test('POST /users/login should return a 401 status for invalid username', async () => {
        const user = {
            username: 'baduser',
            password: 'testpassword'
        };

        const response = await request(server)
            .post('/users/login')
            .send(user);

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('msg', 'Invalid credentials');
    });

    test('GET /users should return an array of users', async () => {
        const response = await request(server)
        .get('/users')
        .set('Authorization', `Bearer ${jwtToken}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    });

    // Test /games
    test('GET /games should return an array of games', async () => {
        const response = await request(server)
        .get('/games')
        .set('Authorization', `Bearer ${jwtToken}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('msg', 'Games fetched successfully!');
        expect(response.body).toHaveProperty('games');
    });

    test('POST /games should create a game', async () => {
        const newGame = {
            player1Id: 1,
            player2Id: '670d311811d1fcdc9563a8ad', // user: test2 on DB
            moves: ''
        };

        const response = await request(server)
        .post('/games')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(newGame);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('msg', 'Game created successfully!', 'game');
        gameId = response.body.game.id;
    });

    test('PUT /games should update a game', async () => {
        const updatedGame = {
            id: gameId,
            moves: '11 12, 13 14'
        };

        const response = await request(server)
        .put('/games')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(updatedGame);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('msg', 'Game updated', 'game');
    });

    test('PUT /games should return a 500 status for unauthorized game update', async () => {
        const updatedGame = {
            id: 999,
            moves: '11 12, 13 14'
        };

        const response = await request(server)
        .put('/games')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(updatedGame);
        expect(response.statusCode).toBe(500);
    });

    test('DELETE /games/:id should delete a game', async () => {
        const response = await request(server)
        .delete(`/games/${gameId}`)
        .set('Authorization', `Bearer ${jwtToken}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('msg', 'Game deleted');
    });

    test('DELETE /games/:id should return a 500 status for unauthorized game deletion', async () => {   
        const response = await request(server)
        .delete('/games/999')
        .set('Authorization', `Bearer ${jwtToken}`);
        expect(response.statusCode).toBe(500);
    });

    test('DELETE /users/:username should return a 404 status for unauthorized user deletion', async () => {
        const response = await request(server)
        .delete('/users/baduser')
        .set('Authorization', `Bearer ${jwtToken}`);
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('msg', 'User not found or you are not authorized to delete it');
    });

    test('DELETE /users/:username should delete a user', async () => {
        const response = await request(server)
        .delete('/users/testuser')
        .set('Authorization', `Bearer ${jwtToken}`);        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('msg', 'User deleted');
    });
});
