const { dirname, join } = require('path')
const pkgDir = require('pkg-dir')
const fs = require('then-fs')
const cwd = process.cwd()
const os = require('os')
var sh = require("shelljs")

console.log('here!!!:', process.chdir)



const link = (modules, fromDir, toDir) => {
  const links = []
  return Promise.all(modules.map(name => {
    const fromModule = join(fromDir, name)
    const toModule = join(toDir, name)
    // if its scoped lets go nested, creating dir in the target if nessecary
    // else lets link it, it will fail if it's already there, and thats fine
    console.log('leggoooo:', fromModule, toModule)
    if (name[0] === '@') {
      return Promise.all([
        fs.access(toModule).catch(() => fs.mkdir(toModule)),
        fs.readdir(fromModule)
      ]).then(([err, nestedModules]) => link(nestedModules, fromModule, toModule))
    } else {
      return fs.symlink(fromModule, toModule)
        .then(() => links.push(fromModule))
        .catch(err => err)
    }
  })).then(() => console.log('LINKS:', links.join('/n'))).catch(err => console.log('FUUU', err))
}

const modulesPath = join(cwd, 'node_modules')
console.log('??????')
// read my modules and check if im a dependency in some other project
Promise.all([
  fs.readdir(modulesPath),
  pkgDir(join(cwd, '..'))
]).then(([modules, target]) => {
  console.log('wuuuu:', modules, target)
  if (modules && target) {
    console.log('leggo:')
    // we have modules and im a dep! let link my modules into the dependant
    link(modules, modulesPath, join(target, 'node_modules'))
  }
})