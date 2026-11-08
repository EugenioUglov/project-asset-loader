import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/project-asset-loader.esm.js',
      format: 'es',
      exports: 'named'
    },
    {
      file: 'dist/project-asset-loader.umd.js',
      format: 'umd',
      name: 'ProjectAssetLoader',
      exports: 'default'
    }
  ],
  plugins: [resolve()]
};