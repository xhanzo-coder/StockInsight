const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🔧 Setting up proxy middleware for /api routes');
  
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api', // 保持路径不变
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log('🚀 Proxying:', req.method, req.url, '→', 'http://localhost:5000' + req.url);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log('✅ Proxy response:', proxyRes.statusCode, 'for', req.url);
    },
    onError: (err, req, res) => {
      console.error('❌ Proxy error for', req.url, ':', err.message);
      res.writeHead(500, {
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
    },
    logLevel: 'debug'
  });
  
  app.use('/api', apiProxy);
  console.log('✅ Proxy middleware registered for /api routes');
};