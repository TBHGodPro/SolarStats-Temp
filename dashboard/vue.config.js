module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      outputDir: 'dist',
      builderOptions: {
        appId: 'com.solarstats.dashboard',
        productName: 'SolarStats Dashboard',
        win: {
          target: 'nsis',
          icon: 'build/icons/win/icon.ico',
          publisherName: 'SolarStats Dashboard',
          verifyUpdateCodeSignature: true,
          requestedExecutionLevel: 'asInvoker',
        },
        nsis: {
          oneClick: true,
          installerIcon: 'build/icons/win/icon.ico',
          uninstallerIcon: 'build/icons/win/icon.ico',
          installerHeaderIcon: 'build/icons/win/icon.ico',
          runAfterFinish: true,
        },
        linux: {
          target: 'AppImage',
          maintainer: 'SolarStats Dashboard',
          vendor: 'Solar Tweaks',
          icon: 'build/icons/linux/icon.png',
          synopsis: 'SolarStats Dashboard',
          description: 'SolarStats Dashboard',
          category: 'Game',
        },
        mac: {
          category: 'Game',
          target: 'dmg',
          icon: 'build/icons/macos/icon.icns',
        },
      },
    },
  },
};
