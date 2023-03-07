// 快捷键(导航)
keyboard$.subscribe(function(key) {
    // 判断模式类型, 按键的值
    if (key.mode === "global" && key.type === "x") {
        /* Add custom keyboard handler here */
        key.claim() 
    }
})

// 可排序表(数据表)
document$.subscribe(function() {
  var tables = document.querySelectorAll("article table:not([class])")
  tables.forEach(function(table) {
    new Tablesort(table)
  })
})

// MathJax(配置3/3)
window.MathJax = {
  tex: {
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]],
    processEscapes: true,
    processEnvironments: true
  },
  options: {
    ignoreHtmlClass: ".*|",
    processHtmlClass: "arithmatex"
  }
};

document$.subscribe(() => { 
  MathJax.typesetPromise()
})
