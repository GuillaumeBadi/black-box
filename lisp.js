
import fs from 'fs';
import {argv} from 'yargs';

let functions = [];

function handle (name, rule) {
  functions.push([
    (typeof name == 'string' ? ((input) => input[0] == name) : name),
    (typeof rule == 'string' ? ((args) => translate([rule, ...args])) : rule)
  ]);
}

function match (input) {
  for (let fn of functions) {
    if (fn[0](input)) return fn[1];
  }
  return null;
}

function translate (input) {
  if (!(input instanceof Array))
    return input.toString();

  let middleware = match(input);
  if (!middleware)
    return `${input[0]}(${input.slice(1).map((e) => translate(e)).join(', ')})`;

  let ret = middleware(input.slice(1));
  if (typeof ret === 'string')
    return ret;
  else
    return translate(ret);
}

function lisp (code) {
  let precompiled = code
                        .replace(/\(/g, '( ')
                        .replace(/\)/g, ' )')
                        .match(/'[^']*'|[^ ]+/g)
                        .join(' ')
                        .replace(/('[^']*'|[^ ]+)/g, '"$1"')
                        .replace(/"\(" /g, '[').replace(/ "\)"/g, ']')
                        .match(/\S+/g)
                        .join(', ');

  let parsed = JSON.parse(precompiled);
  return translate(parsed);
}

function write (code, output) {
  if (output === 1)
    return console.log (code);
  return fs.writeFile(output, code, (err) => console.log (err || 'Compilation Done'));
}

handle('+', (args) => {
  return args.map((a) => translate(a)).join(' + ');
});

handle('*', (args) => {
  return args.map((a) => '(' + translate(a) + ')').join(' * ');
});

handle('lambda', 'def');

handle('quote', (args) => {
  return '[' + args.map((arg) => translate(arg)).join(', ') + ']';
});

handle('if', (args) => {
  if (args.length === 2)
    return `(function () {if (${translate(args[0])}) return ${translate(args[1])}})()`
  if (args.length === 3)
    return `((${translate(args[0])}) ? (${translate(args[1])}) : (${translate(args[2])}))`
});

handle('map', (args) => {
  let list = translate(args[0]);
  let cb = translate(args[1]);
  return `${list}.map(${cb})`
});

handle('with', (args) => {
  let code = args.pop();
  let names = args.map((a) => a[0]).join(','),
      values = args.map((a) => translate(a[1])).join(',');
  return `(function(${names}) {
      ${translate(c)};
})(${values});`;
});

handle('do', (args) => {
  return `(function () {
    ${args.map((a) => translate(a)).join(';\n') + ';\n'}
})()`;
});

handle('def', (args) => {
  let name, code, params;
  if (args.length == 2) {
    code = args[1][0] instanceof Array ? args[1] : [args[1]];
    params = args[0].join(', ');
    name = '';
  } else if (args.length == 1) {
    code = args[0][0] instanceof Array ? args[0] : [args[0]];
    params = '';
    name = '';
  } else {
    name = args[0];
    params = args[1];
    code = args[2][0] instanceof Array ? args[2] : [args[2]];
  }
  return `function ${name}(${params}) {
  ${code.map((a) => translate(a)).join(';\n')};
}`;
});

let format = (code) => code.replace(/\n+/g, '').replace(/\s+/, ' ').replace(/"/g, '\\"');

write(lisp(format(fs.readFileSync(argv._[0]).toString())), argv.output || 1);
