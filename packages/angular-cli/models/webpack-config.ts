import {
  getWebpackAotConfigPartial,
  getWebpackNonAotConfigPartial
} from './webpack-build-typescript';
const webpackMerge = require('webpack-merge');
import { CliConfig } from './config';
import { getWebpackCommonConfig } from './webpack-build-common';
import { getWebpackDevConfigPartial } from './webpack-build-development';
import { getWebpackProdConfigPartial } from './webpack-build-production';
import {
  getWebpackMobileConfigPartial,
  getWebpackMobileProdConfigPartial
} from './webpack-build-mobile';


export class NgCliWebpackConfig {
  // TODO: When webpack2 types are finished lets replace all these any types
  // so this is more maintainable in the future for devs
  public config: any;

  constructor(
    public ngCliProject: any,
    public target: string,
    public environment: string,
    outputDir?: string,
    baseHref?: string,
    i18nFile?: string,
    i18nFormat?: string,
    locale?: string,
    isAoT = false,
    sourcemap = true,
    vendorChunk = false,
    verbose = false,
    progress = true,
    deployUrl?: string,
    outputHashing?: string,
    extractCss = true,
  ) {
    const appConfig = CliConfig.fromProject().config.apps[0];
    const projectRoot = this.ngCliProject.root;

    appConfig.outDir = outputDir || appConfig.outDir;
    appConfig.deployUrl = deployUrl || appConfig.deployUrl;

    let baseConfig = getWebpackCommonConfig(
      projectRoot,
      environment,
      appConfig,
      baseHref,
      sourcemap,
      vendorChunk,
      verbose,
      progress,
      outputHashing,
      extractCss,
    );
    let targetConfigPartial = this.getTargetConfig(projectRoot, appConfig, sourcemap, verbose);

    if (appConfig.mobile) {
      let mobileConfigPartial = getWebpackMobileConfigPartial(projectRoot, appConfig);
      let mobileProdConfigPartial = getWebpackMobileProdConfigPartial(projectRoot, appConfig);
      baseConfig = webpackMerge(baseConfig, mobileConfigPartial);
      if (this.target == 'production') {
        targetConfigPartial = webpackMerge(targetConfigPartial, mobileProdConfigPartial);
      }
    }

    let config = webpackMerge(baseConfig, targetConfigPartial);

    if (appConfig.main) {
      const typescriptConfigPartial = isAoT
        ? getWebpackAotConfigPartial(projectRoot, appConfig, i18nFile, i18nFormat, locale)
        : getWebpackNonAotConfigPartial(projectRoot, appConfig);

      config = webpackMerge(config, typescriptConfigPartial);
    }

    this.config = config;
  }

  getTargetConfig(projectRoot: string, appConfig: any, sourcemap: boolean, verbose: boolean): any {
    switch (this.target) {
      case 'development':
        return getWebpackDevConfigPartial(projectRoot, appConfig);
      case 'production':
        return getWebpackProdConfigPartial(projectRoot, appConfig, sourcemap, verbose);
      default:
        throw new Error("Invalid build target. Only 'development' and 'production' are available.");
    }
  }
}
