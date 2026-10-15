const express = require('express');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin', // Replace with your MySQL password
    database: 'user_db'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database.');
});

// PUT Route to update a user's profile AND store the update in a separate table
app.put('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const { username, email } = req.body;

    if (!username || !email) {
        return res.status(400).json({ error: 'Username and email are required.' });
    }

    // Step 1: Update the main users table
    const updateSql = 'UPDATE users SET username = ?, email = ? WHERE id = ?';
    
    db.query(updateSql, [username, email, userId], (err, result) => {
        if (err) {
            console.error('Update error:', err);
            return res.status(500).json({ error: 'Failed to update profile.' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Step 2: Log the update in the separate profile_updates table
        const logSql = 'INSERT INTO profile_updates (user_id, new_username, new_email) VALUES (?, ?, ?)';
        
        db.query(logSql, [userId, username, email], (logErr) => {
            if (logErr) {
                console.error('Error logging update:', logErr);
                // We still return 200 because the main profile updated successfully, 
                // but we warn the console about the logging failure.
            }
            
            res.status(200).json({ 
                message: 'Profile updated and stored in the separate update table successfully!' 
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});