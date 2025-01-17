
const isProduct = process.env.NODE_ENV == 'production' || process.env.NODE_ENV == '235' ? true : false
const webpack = require('webpack')
module.exports = {
  productionSourceMap: !isProduct,
  publicPath: isProduct ? '/wallet/' : '',
  devServer: {
    https: true,
    proxy: {
      '/createExchange': {
        target: 'http://192.168.1.235:9006',
        changeOrigin: true,
        pathRewrite: {
          '^/createExchange': ''
        }
      },
      '/nodeApi': {
        target: 'http://api.wormholestest.com:8555',
        changeOrigin: true,
        pathRewrite: {
          '^/nodeApi': ''
        }
      },
      '/serviceApi': {
        target: 'http://api.wormholestest.com:8090',
        changeOrigin: true,
        pathRewrite: {
          '^/serviceApi': ''
        }
      },
      '/wormholesApi': {
        target: 'https://api.wormholestest.com',
        changeOrigin: true,
        pathRewrite: {
          '^/wormholesApi': ''
        }
      },
      '/exchangeApi': {
        target: 'http://192.168.1.235:9006',
        changeOrigin: true,
        pathRewrite: {
          '^/exchangeApi': ''
        }
      },
      '/contractApi': {
        target: 'https://api.wormholesscan.com',
        changeOrigin: true,
        pathRewrite: {
          '^/contractApi': ''
        }
      },


      '/exchans': {
        target: 'http://192.168.1.235:9006',
        changeOrigin: true,
        pathRewrite: {
          '^/exchans': ''
        }
      },

      '/walletIframe': {
        target: 'http://192.168.27.48:8080/wallet/#/',
        changeOrigin: true,
        pathRewrite: {
          '^/walletIframe': ''
        }
      },
      '/nftApi': {
        target: 'http://43.129.181.130:3001',
        changeOrigin: true,
        pathRewrite: {
          '^/nftApi': ''
        }
      }
    }
  },

  configureWebpack: config => {
    if (isProduct) {
      config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true;
    }
    config.optimization.splitChunks = {
      chunks: 'all',
      minSize: 20000,
      maxAsyncRequests: 10,
      maxInitialRequests: 10,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        libs: {
          name: 'chunk-libs',
          test: /[\\/]node_modules[\\/]/,
          priority: 10,
          chunks: 'initial'
        },
        commons: {
          name: 'chunk-commons',
          minChunks: 2,
          priority: 0,
          reuseExistingChunk: true
        },
        vant: {
          name: 'vant',
          priority: 20,
          test: /[\\/]node_modules[\\/]vant[\\/]/
        },
        ethers: {
          name: 'ethers',
          priority: 20,
          test: /[\\/]node_modules[\\/]ethers[\\/]/
        },
        moment: {
          name: 'moment',
          priority: 20,
          test: /[\\/]node_modules[\\/]moment[\\/]/
        },
        element_plus: {
          name: 'element_plus',
          priority: 20,
          test: /[\\/]node_modules[\\/]element-plus[\\/]/
        },
        web3: {
          name: 'web3',
          priority: 20,
          test: /[\\/]node_modules[\\/]web3[\\/]/
        },
        vuex_persistedstate:{
          name:"vuex-persistedstate",
          priority: 20,
          test: /[\\/]node_modules[\\/]vuex-persistedstate[\\/]/
        },
        ethereumjs:{
          name: "ethereumjs",
          priority: 20,
          test: /[\\/]node_modules[\\/]@ethereumjs[\\/]/
        }
        
      }
    }
    config.plugins.push(new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 15,
    }),)

  },
}
