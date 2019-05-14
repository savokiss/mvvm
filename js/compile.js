function Compile (el, vm) {
  this.$vm = vm
  this.$el = this.isElementNode(el) ? el : document.querySelector(el)
  if (this.$el) {
    this.$fragment = this.node2Fragment(this.$el)
    this.init()
    this.$el.appendChild(this.$fragment)
  }
}

Compile.prototype = {
  node2Fragment (el) {
    var fragment = document.createDocumentFragment(),
        child
    while (child = el.firstChild) {
      fragment.appendChild(child)
    }
    return fragment
  },
  init () {
    this.compileElement(this.$fragment)
  },
  compileElement (el) {
    var childNodes = el.childNodes;
    [].slice.call(childNodes).forEach(node => {
      var text = node.textContent
      var reg = /\{\{(.*)\}\}/
      // 按元素节点方式编译
      if (this.isElementNode(node)) {
        this.compile(node)
      } else if (this.isTextNode(node) && reg.test(text)) {
        this.compileText(node, RegExp.$1.trim())
      }
      // 遍历编译子节点
      if (node.childNodes && node.childNodes.length) {
        this.compileElement(node)
      }
    })
  },
  compile (node) {
    var nodeAttrs = node.attributes;
    [].slice.call(nodeAttrs).forEach(attr => {
      var attrName = attr.name
      if (this.isDirective(attrName)) {
        var exp = attr.value
        var dir = attrName.substring(2)
        if (this.isEventDirective(dir)) {
          compileUtil.eventHandler(node, this.$vm, exp, dir)
        }  else {
          compileUtil[dir] && compileUtil[dir](node, this.$vm, exp)
        }
        node.removeAttribute(attrName)
      }
    })
  },
  compileText (node, exp) {
    compileUtil.text(node, this.$vm, exp)
  },
  isDirective (attr) {
    return attr.indexOf('v-') === 0
  },
  isEventDirective (dir) {
    return dir.indexOf('on') === 0
  },
  isElementNode (node) {
    return node.nodeType === 1
  },
  isTextNode (node) {
    return node.nodeType === 3
  }
}

// 指令处理集合
var compileUtil = {
  text (node, vm, exp) {
    this.bind(node, vm, exp, 'text')
  },
  html (node, vm, exp) {
    this.bind(node, vm, exp, 'html')
  },
  model (node, vm, exp) {
    this.bind(node, vm, exp, 'model')
  },
  class (node, vm, exp) {
    this.bind(node, vm, exp, 'class')
  },
  bind (node, vm, exp, dir) {
    var updaterFn = updater[dir + 'Updater']
    // 第一次初始化视图  
    updaterFn && updaterFn(node, this._getVMVal(vm, exp))
    new Watcher(vm, exp, (value, oldValue) => {
      updaterFn && updaterFn(node, value, oldValue)
    })
  },
  eventHandler (node, vm, exp, dir) {
    var eventType = dir.split(':')[1]
        fn = vm.$options.methods && vm.$options.methods[exp]
    if (eventType && fn) {
      node.addEventListener(eventType, fn.bind(vm), false)
    }
  },
  _getVMVal (vm, exp) {
    var val = vm
    exp = exp.split('.')
    exp.forEach(k => {
      val = val[k]
    })
    return val
  },
  _setVMVal (vm, exp, value) {
    var val = vm
    exp = exp.split('.')
    exp.forEach((k, i) => {
      if (i < exp.length - 1) {
        val = val[k]
      } else {
        val[k] = value
      }
    })
  }
}

var updater = {
  textUpdater (node, value) {
    console.log('textUpdater', node, value)
    node.textContent = typeof value === 'undefined' ? '' : value
  },
  htmlUpdater (node, value) {
    node.innerHTML = typeof value === 'undefined' ? '' : value
  },
  classUpdater (node, value, oldValue) {
    var className = node.className
    className = className.replace(oldValue, '').replace(/\s$/, '')
    var space = className && String(value) ? ' ' : ''
    node.className = className + space + value
  },
  modelUpdater (node, value, oldValue) {
    node.value = typeof value === 'undefined' ? '' : value
  }
}