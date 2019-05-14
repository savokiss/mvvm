function MVVM (options) {
  this.$options = options || {}
  var data = this._data = this.$options.data
  // vm.xxx -> vm._data.xxx
  Object.keys(data).forEach(key => {
    this._proxyData(key)
  })
  this._initComputed()
  observe(data, this)
  this.$compile = new Compile(options.el || document.body, this)
}

MVVM.prototype = {
  _proxyData (key, setter, getter) {
    var me = this
    setter = setter ||
    Object.defineProperty(me, key, {
      configurable: false,
      enumerable: true,
      get: function proxyGetter() {
        return me._data[key]
      },
      set: function proxySetter (newVal) {
        me._data[key] = newVal
      }
    })
  },
  _initComputed () {
    var me = this
    var computed = this.$options.computed
    if (typeof computed === 'object') {
      Object.keys(computed).forEach(key => {
        Object.defineProperty(me, key, {
          get: typeof computed[key] === 'function' ? computed[key] : computed[key].get,
          set: function() {}
        })
      })
    }
  }
}