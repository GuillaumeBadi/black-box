(function () {
      function argv(key) {
    return ((key) ? (process.argv[key]) : (process.argv));
  };
function println(line) {
    return console.log(line);
  };
println(argv(1));

  })()