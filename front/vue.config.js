const { defineConfig } = require('@vue/cli-service');
const AutoImport = require('unplugin-auto-import/webpack').default
const Components = require('unplugin-vue-components/webpack').default
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers');
const CompressionPlugin = require("compression-webpack-plugin")

module.exports = defineConfig({
  configureWebpack: {
    plugins: [
      new CompressionPlugin(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
  },
  css: {
    loaderOptions: {
      postcss: {
        postcssOptions: {
          plugins: [
            require('autoprefixer')({
              overrideBrowserslist: [
                'Safari >= 14',
                'iOS >= 14',
                'Chrome >= 90',
                'Firefox >= 88',
                'Edge >= 90'
              ],
              // 移除过时的vendor前缀
              remove: true,
              // 只添加必要的前缀
              add: true,
              // 忽略过时的flexbox语法
              flexbox: 'no-2009'
            })
          ]
        }
      }
    }
  },
  devServer: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VUE_APP_BACKEND_URL,
        changeOrigin: true,
        pathRewrite: {
          '^/api': '',
        },
      },
    },
  },
  transpileDependencies: true,
});
