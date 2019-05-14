function Observer (data) {
  this.data = data
  this.walk(data)
}

Observer.prototype = {
  walk (data) {
    Object.keys(data).forEach((key) => {
      this.convert(key, data[key])
    })
  },
  convert (key, val) {
    this.defineReactive(this.data, key, val)
  },
  defineReactive (data, key, val) {
    var dep = new Dep()
    var childObj = observe(val)
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: false,
      get () {
        if (Dep.target) {
          dep.depend()
        }
        return val
      },
      set (newVal) {
        if (newVal === val) return
        console.log(`Change detected: ${val} ==> ${newVal}`)
        val = newVal
        childObj = observe(newVal)
        dep.notify()
      }
    })
  }
}

function observe(value, vm) {
  if (!value || typeof value !== 'object') {
    return
  }
  return new Observer(value)
}

var uid = 0

function Dep() {
  this.id = uid++
  this.subs = []
}

Dep.prototype = {
  addSub (sub) {
    this.subs.push(sub)
  },
  depend () {
    Dep.target.addDep(this)
  },
  removeSub (sub) {
    var index = this.subs.indexOf(sub)
    if (index !== -1) {
      this.subs.splice(index, 1)
    }
  },
  notify () {
    this.subs.forEach((sub) => {
      sub.update()
    })
  }
}

Dep.target = null