/**
 * PostCSS 配置文件
 * 用于现代化CSS处理和优化
 */

module.exports = {
  plugins: [
    // Autoprefixer - 自动添加浏览器前缀
    require('autoprefixer')({
      // 现代浏览器支持列表
      overrideBrowserslist: [
        'Safari >= 14',
        'iOS >= 14', 
        'Chrome >= 90',
        'Firefox >= 88',
        'Edge >= 90',
        '> 1%',
        'not dead',
        'not ie 11'
      ],
      // 移除过时的前缀
      remove: true,
      // 只添加必要的前缀
      add: true,
      // 忽略过时的flexbox语法
      flexbox: 'no-2009',
      // 忽略过时的grid语法
      grid: 'autoplace'
    }),

    // CSS Nano - 生产环境CSS优化
    process.env.NODE_ENV === 'production' && require('cssnano')({
      preset: ['default', {
        // 保留重要的注释
        discardComments: {
          removeAll: false,
          removeAllButFirst: true
        },
        // 优化calc()表达式
        calc: {
          precision: 3
        },
        // 合并相同的规则
        mergeRules: true,
        // 移除未使用的CSS
        discardUnused: true,
        // 压缩颜色值
        colormin: true,
        // 优化字体权重
        minifyFontValues: true,
        // 移除重复的规则
        discardDuplicates: true,
        // 标准化空白字符
        normalizeWhitespace: true,
        // 移除空的规则
        discardEmpty: true
      }]
    }),

    // PurgeCSS - 移除未使用的CSS（仅生产环境）
    process.env.NODE_ENV === 'production' && require('@fullhuman/postcss-purgecss')({
      content: [
        './src/**/*.vue',
        './src/**/*.js',
        './src/**/*.ts',
        './public/index.html'
      ],
      // 保护Element Plus的类名
      safelist: [
        /^el-/,
        /^is-/,
        /^has-/,
        // macOS风格的类名
        /^mac-/,
        /^finder-/,
        // 动画相关
        /^fade/,
        /^slide/,
        /^bounce/,
        // 响应式相关
        /^sm:/,
        /^md:/,
        /^lg:/,
        /^xl:/,
        // 状态相关
        /hover:/,
        /focus:/,
        /active:/,
        /disabled:/
      ],
      // 默认提取器
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
      // 自定义提取器
      extractors: [
        {
          extractor: content => {
            // 提取Vue模板中的类名
            const vueClassRegex = /class\s*=\s*["']([^"']+)["']/g
            const classes = []
            let match
            
            while ((match = vueClassRegex.exec(content)) !== null) {
              classes.push(...match[1].split(/\s+/))
            }
            
            // 提取动态类名
            const dynamicClassRegex = /:class\s*=\s*["']([^"']+)["']/g
            while ((match = dynamicClassRegex.exec(content)) !== null) {
              classes.push(...match[1].split(/\s+/))
            }
            
            return classes
          },
          extensions: ['vue']
        }
      ]
    }),

    // PostCSS Preset Env - 使用现代CSS特性
    require('postcss-preset-env')({
      // 目标浏览器阶段
      stage: 2,
      // 启用的特性
      features: {
        'custom-properties': true,
        'custom-media-queries': true,
        'custom-selectors': true,
        'nesting-rules': true,
        'color-function': true,
        'hexadecimal-alpha-notation': true,
        'lab-function': true,
        'logical-properties-and-values': true,
        'media-query-ranges': true
      },
      // 自动填充
      autoprefixer: false, // 已经在上面配置了
      // 保留自定义属性
      preserve: true
    }),

    // PostCSS Import - 处理@import
    require('postcss-import')({
      // 解析路径
      resolve: (id, basedir) => {
        // 处理相对路径
        if (id.startsWith('./') || id.startsWith('../')) {
          return require('path').resolve(basedir, id)
        }
        // 处理node_modules中的文件
        if (!id.startsWith('/')) {
          try {
            return require.resolve(id, { paths: [basedir] })
          } catch (e) {
            return id
          }
        }
        return id
      }
    }),

    // PostCSS Nested - 支持嵌套语法
    require('postcss-nested'),

    // PostCSS Custom Properties - 自定义属性支持
    require('postcss-custom-properties')({
      preserve: true,
      importFrom: [
        // 从CSS文件导入自定义属性
        'src/styles/macOS/variables.scss'
      ]
    }),

    // PostCSS Color Function - 颜色函数支持
    require('postcss-color-function'),

    // PostCSS Flexbugs Fixes - 修复flexbox bug
    require('postcss-flexbugs-fixes'),

    // PostCSS Sort Media Queries - 排序媒体查询
    process.env.NODE_ENV === 'production' && require('postcss-sort-media-queries')({
      sort: 'mobile-first'
    })
  ].filter(Boolean)
}

/**
 * 开发环境特定配置
 */
if (process.env.NODE_ENV === 'development') {
  module.exports.plugins.push(
    // PostCSS Reporter - 错误报告
    require('postcss-reporter')({
      clearReportedMessages: true,
      throwError: false
    })
  )
}

/**
 * 生产环境特定配置
 */
if (process.env.NODE_ENV === 'production') {
  module.exports.plugins.push(
    // Critical CSS - 提取关键CSS
    require('postcss-critical-css')({
      preserve: true,
      minify: true
    })
  )
}
