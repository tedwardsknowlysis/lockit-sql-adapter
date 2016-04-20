'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        /*
         Add altering commands here.
         Return a promise to correctly handle asynchronicity.

         Example:
         return queryInterface.createTable('users', { id: Sequelize.INTEGER });
         */
        queryInterface.createTable('lockitusers', {
            _id: {
                allowNull: false,
                autoIncrement: true,
                type: Sequelize.INTEGER,
                primaryKey: true
            },
            name: {
                type: Sequelize.STRING,
                unique: true
            },
            email: {
                type: Sequelize.STRING,
                unique: true
            },
            derived_key: Sequelize.STRING,
            //password: Sequelize.STRING,
            salt: Sequelize.STRING,
            signupToken: {
                type: Sequelize.STRING,
                unique: true
            },
            signupTimestamp: Sequelize.DATE,
            signupTokenExpires: Sequelize.DATE,
            failedLoginAttempts: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            emailVerificationTimestamp: Sequelize.DATE,
            emailVerified: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            pwdResetToken: {
                type: Sequelize.STRING,
                unique: true
            },
            pwdResetTokenExpires: Sequelize.DATE,
            accountLocked: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            accountLockedUntil: Sequelize.DATE,
            previousLoginTime: Sequelize.DATE,
            previousLoginIp: Sequelize.STRING,
            currentLoginTime: Sequelize.DATE,
            currentLoginIp: Sequelize.STRING,
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },

    down: function (queryInterface, Sequelize) {
        /*
         Add reverting commands here.
         Return a promise to correctly handle asynchronicity.

         Example:
         return queryInterface.dropTable('users');
         */
        queryInterface.dropTable('lockitusers');
    }
};
