
usage: 
``` bash
./src/box code.box --output output.js && node output.js
```

``` lisp

(do
  (def factorial (n) (if n (* n (factorial (- n 1))) 1))
  (console.log (factorial (+ 1 2)))
)

```

output:

``` javascript

(function () {
  function factorial(n) {
    return ((n) ? ((n) * (factorial((n) - (1)))) : (1));
  };
  console.log(factorial((1) + (2)));

})()
