import path from 'path';
import webpack, { Configuration } from 'webpack';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import WebpackShellPluginNext from 'webpack-shell-plugin-next';
import packageJson from './package.json';

const webpackConfiguration = (env: {
    production: boolean;
    development: boolean;
}): Configuration => {
    const isProduction = env.production ? true : false;
    return {
        entry: 'src',
        resolve: {
            extensions: ['.ts', '.js'],
            plugins: [new TsconfigPathsPlugin()],
        },
        output: {
            path: path.join(__dirname, '/dist'),
            filename: 'index.js',
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                    },
                    exclude: [/dist/, /node_modules/],
                },
            ],
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': isProduction ? 'production' : 'development',
                'process.env.APP_NAME': JSON.stringify(packageJson.name),
                'process.env.APP_VERSION': JSON.stringify(packageJson.version),
            }),
            new ForkTsCheckerWebpackPlugin({
                eslint: {
                    files: 'src',
                },
            }),
            !isProduction
                ? new WebpackShellPluginNext({
                      onBuildEnd: {
                          scripts: ['npm run dev:server'],
                          blocking: false,
                          parallel: true,
                      },
                      safe: true,
                  })
                : new webpack.DefinePlugin({}),
        ],
        watch: !isProduction,
    };
};

export default webpackConfiguration;
