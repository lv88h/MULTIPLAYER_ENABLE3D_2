const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Use environment variables for sensitive information
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/3d_game_db';
const PORT = process.env.PORT || 3000;

// User model (consider moving to a separate file)
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    position: {
        x: { type: Number, default: 35 },
        y: { type: Number, default: 0 },
        z: { type: Number, default: 0 }
    }
}));

app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB and start server only after successful connection
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        
        io.on('connection', (socket) => {
            console.log('A user connected');

            socket.on('register', async ({ username, password }) => {
                try {
                    const existingUser = await User.findOne({ username });
                    if (existingUser) {
                        return socket.emit('registerResult', { success: false, message: 'Username already exists' });
                    }
                    console.log('Registering user');
                    const hashedPassword = await bcrypt.hash(password, 10);
                    const newUser = new User({ username, password: hashedPassword });
                    await newUser.save();
                    socket.emit('registerResult', { success: true });
                } catch (error) {
                    console.error('Registration error:', error);
                    socket.emit('registerResult', { success: false, message: 'Registration failed' });
                }
            });

            socket.on('login', async ({ username, password }) => {
                try {
                    const user = await User.findOne({ username });
                    if (!user || !(await bcrypt.compare(password, user.password))) {
                        return socket.emit('loginResult', { success: false, message: 'Invalid credentials' });
                    }
                    socket.username = username;
                    socket.emit('loginResult', { 
                        success: true, 
                        user: { username, position: user.position } 
                    });
                } catch (error) {
                    console.error('Login error:', error);
                    socket.emit('loginResult', { success: false, message: 'Login failed' });
                }
            });

            socket.on('savePosition', async (position) => {
                if (!socket.username) return;
                try {
                    await User.findOneAndUpdate({ username: socket.username }, { position });
                } catch (error) {
                    console.error('Save position error:', error);
                }
            });

            socket.on('disconnect', () => {
                console.log('A user disconnected');
            });
        });

        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => console.error('MongoDB connection error:', err));
