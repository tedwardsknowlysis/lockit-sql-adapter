exports.dbs = {
  //postgres: {
  //  url: 'postgres://postgres:@127.0.0.1:5432/',
  //  name: 'users',
  //  collection: 'my_user_table'
  //},
  mysql: {
    url: 'mysql://localhost:3306',
    ignoreUrl: true,
    name: 'lockit',
    collection: 'LockitUsers',
    userModelName: 'LockitUser',
    username: 'root',
    password: 'password',
    options: {
      // https://github.com/sequelize/sequelize/blob/3e5b8772ef75169685fc96024366bca9958fee63/lib/sequelize.js#L91
      dialect: 'mysql',
      host: 'localhost'
    }
  }
  //,sqlite: {
  //  url: 'sqlite://',
  //  name: ':memory:',
  //  collection: 'my_user_table'
  //}
};

exports.signup = {
  tokenExpiration: '1 day'
};
