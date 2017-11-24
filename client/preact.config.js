export default config => {
  config.devServer.proxy = [
    {
      path: '/api/**',
      target: 'http://localhost:8082',
      // ...any other stuff...
    }
  ];
};