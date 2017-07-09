const { join, relative } = require('path')
const fs = require('then-fs')
const cwd = process.cwd()

// in my node_modules find node_modules recusively and link them all into node_modules if they dont exist
const rootModulesPath = join(cwd, 'node_modules')
const store = {}
const link = (modulesPath, scopedPkg = '') => fs.access(modulesPath)
  .then(() => fs.readdir(modulesPath))
  .then(modules => Promise.all(modules.map(module => {
    if (module[0] !== '.' || module === '.bin') {
      const from = join(modulesPath, module)
      const to = join(rootModulesPath, scopedPkg, module)
      return module[0] === '@'
        ? fs.access(to)
            .catch(() => fs.mkdir(to))
            .then(() => link(from, module))
        : Promise.all([
            to in store ? null : fs.symlink(from, to)
              .then(() => { store[to] = from })
              .catch(() => { store[to] = false }),
            link(join(modulesPath, module, 'node_modules'))
          ])
      }
    })))
    .catch(e => e)

link(rootModulesPath).then(() => {
  const lines = Object.keys(store)
    .filter(to => store[to])
    .map(to => `${relative(rootModulesPath, to)} -> ${relative(rootModulesPath, store[to])}`)
  if (lines.length) {
    console.log('linked nested node_modules:\n' + lines.join('\n'))
  }
})
