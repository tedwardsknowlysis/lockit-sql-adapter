module.exports = {
    up: function(queryInterface, Sequelize) {
        // logic for transforming into the new state
        return queryInterface.createTable('LockitUsers', {
            // make id like CouchDB and MongoDB
            _id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            // signup
            name: Sequelize.STRING,
            email: Sequelize.STRING,
            derived_key: Sequelize.STRING,
            salt: Sequelize.STRING,
            signupToken: Sequelize.STRING,
            signupTimestamp: Sequelize.DATE,
            signupTokenExpires: Sequelize.DATE,
            failedLoginAttempts: Sequelize.INTEGER,
            emailVerificationTimestamp: Sequelize.DATE,
            emailVerified: Sequelize.BOOLEAN,
            // forgot password
            pwdResetToken: Sequelize.STRING,
            pwdResetTokenExpires: Sequelize.DATE,
            // login
            accountLocked: Sequelize.BOOLEAN,
            accountLockedUntil: Sequelize.DATE,
            previousLoginTime: Sequelize.DATE,
            previousLoginIp: Sequelize.STRING,
            currentLoginTime: Sequelize.DATE,
            currentLoginIp: Sequelize.STRING
        });
    },
    down: function(queryInterface, Sequelize) {
        // logic for reverting the changes
        return queryInterface.dropTable('LockitUsers');
    }
}