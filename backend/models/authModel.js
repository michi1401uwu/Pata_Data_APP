const db = require('../config/db');

const Auth = {
    findByEmail: (email, callback) => {
        db.query('SELECT * FROM usuarios WHERE email = ?', [email], callback);
    },
    createUser: (data, callback) => {
        db.query('INSERT INTO usuarios SET ?', [data], callback);
    }
};

module.exports = Auth;
