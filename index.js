const { dirname, join } = require('path')
const fs = require('then-fs')
const cwd = process.cwd()

// in my node_modules find node_modules recusively and link them all into node_modules if they dont exist
const rootModulesPath = join(cwd, 'node_modules')

const link = (modulesPath, scopedPkg) => {
  return fs.access(modulesPath, () => fs.readdir(modulesPath).then(modules => {
    return Promise.all(modules.map(module => {
      if (module[0] !== '.' || module === '.bin') {
        if (module[0] === '@') {
          return link(join(modulesPath, module), module)
        } else if (scopedPkg) {
          const dir = join(rootModulesPath, scopedPkg)
          return Promise.all([
            fs.access(dir).catch(() => fs.mkdir(dir)).then(() => {
              return fs.symlink(join(modulesPath, module), join(dir, module))
            }),
            link(join(modulesPath, module, 'node_modules'))
          ])
        } else {
          return Promise.all([
            fs.symlink(join(modulesPath, module), join(rootModulesPath, module)),
            link(join(modulesPath, module, 'node_modules'))
          ])
        }
      }
    }))
  }))
}

link(rootModulesPath).then(() => console.log('DONE YAY')).catch(err => console.log(err))

// fs.readdir(rootModulesPath).then(modules => {
//   return Promise.all(modules.map(module => {
//     return link(join(rootModulesPath, module))
//   }))
// }).then(() => console.log('DONE YAY')).catch(err => console.log(err))

// const link = (modules, fromDir, toDir) => {
//   const links = []
//   return Promise.all(modules.map(name => {
//     const fromModule = join(fromDir, name)
//     const toModule = join(toDir, name)
//     // if its scoped lets go nested, creating dir in the target if nessecary
//     // else lets link it, it will fail if it's already there, and thats fine
//     if (name[0] === '@') {
//       return Promise.all([
//         fs.access(toModule).catch(() => fs.mkdir(toModule)),
//         fs.readdir(fromModule)
//       ]).then(([err, nestedModules]) => link(nestedModules, fromModule, toModule))
//     } else {
//       return fs.symlink(fromModule, toModule)
//         .then(() => links.push(fromModule))
//         .catch(err => err)
//     }
//   })).then(() => console.log('LINKS:', links.join('/n'))).catch(err => console.log('FUUU', err))
// }

// const modulesPath = join(cwd, 'node_modules')

// // read my modules and check if im a dependency in some other project
// Promise.all([
//   fs.readdir(modulesPath),
//   pkgDir(join(cwd, '..'))
// ]).then(([modules, target]) => {
//   if (modules && target) {
//     // we have modules and im a dep! let link my modules into the dependant
//     link(modules, modulesPath, join(target, 'node_modules'))
//   }
// })