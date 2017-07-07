const { dirname, join } = require('path')
const pkgDir = require('pkg-dir')
const fs = require('then-fs')
const cwd = process.cwd()

// check if we have node_modules and that I am in a node project
const myModulesPath = join(cwd, 'node_modules')

Promise.all([
  fs.readdir(myModulesPath),
  pkgDir(join(cwd, '..'))
]).then(([nodeModules, targetPath]) => {
  if (nodeModules && targetPath) {
    const targetModulesPath = join(targetPath, 'node_modules')
    fs.access(targetModulesPath)
      .then(() => linkModules(nodeModules, myModulesPath, targetModulesPath))
        .then(() => console.log('fly!'))
          .catch(() => console.log('fly!'))
  }
})

const linkModules = (nodeModules, fromDir, toDir) => Promise.all(nodeModules.map(name => {
  const fromModule = join(fromDir, name)
  const toModule = join(toDir, name)
  return name[0] === '@'
    ? Promise.all([
        fs.access(toModule).catch(() => fs.mkdir(toModule)),
        fs.readdir(fromModule)
      ]).then(([err, nestedModules]) => linkModules(nestedModules, fromModule, toModule))
    : fs.symlink(fromModule, toModule)
}))
