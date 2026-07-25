/**
 * 最小化 DOM mock，用于在 Node 环境中测试 renderer / useTokUIStream。
 */
'use strict'

function createElement(tag) {
  const el = {
    tagName: tag.toUpperCase(),
    nodeType: 1,
    className: '',
    attributes: {},
    childNodes: [],
    children: [],
    parentNode: null,
    style: {},

    setAttribute(key, value) {
      this.attributes[key] = String(value)
      if (key === 'class') this.className = String(value)
    },

    getAttribute(key) {
      return this.attributes.hasOwnProperty(key) ? this.attributes[key] : null
    },

    appendChild(child) {
      if (child && typeof child === 'object') {
        this.childNodes.push(child)
        if (child.nodeType === 1) this.children.push(child)
        child.parentNode = this
      }
      return child
    },

    querySelector(selector) {
      for (let i = 0; i < this.childNodes.length; i++) {
        const child = this.childNodes[i]
        if (child.nodeType !== 1 || !child.className) continue
        const classes = child.className.split(' ').filter(Boolean)
        // 支持 .class 选择器
        if (selector.startsWith('.')) {
          const wanted = selector.slice(1)
          if (classes.includes(wanted)) return child
        } else if (selector === child.tagName.toLowerCase()) {
          return child
        }
        if (child.querySelector) {
          const found = child.querySelector(selector)
          if (found) return found
        }
      }
      return null
    }
  }

  el.classList = {
    add(cls) {
      const parts = el.className.split(' ').filter(Boolean)
      if (!parts.includes(cls)) {
        parts.push(cls)
        el.className = parts.join(' ')
        el.setAttribute('class', el.className)
      }
    },
    remove(cls) {
      const parts = el.className.split(' ').filter(c => c !== cls)
      el.className = parts.join(' ')
      el.setAttribute('class', el.className)
    },
    contains(cls) {
      return el.className.split(' ').filter(Boolean).includes(cls)
    }
  }

  Object.defineProperty(el, 'textContent', {
    configurable: true,
    get() {
      return this.childNodes
        .map(c => (c.textContent != null ? c.textContent : ''))
        .join('')
    },
    set(v) {
      const tn = createTextNode(String(v))
      tn.parentNode = this
      this.childNodes = [tn]
      this.children = []
    }
  })

  return el
}

function createTextNode(text) {
  return { nodeType: 3, textContent: String(text), parentNode: null }
}

function setupDOM() {
  global.Node = {
    ELEMENT_NODE: 1,
    TEXT_NODE: 3,
    DOCUMENT_FRAGMENT_NODE: 11
  }
  global.document = {
    createElement: createElement,
    createTextNode: createTextNode
  }
}

function teardownDOM() {
  delete global.document
  delete global.Node
}

export { setupDOM, teardownDOM, createElement, createTextNode }
