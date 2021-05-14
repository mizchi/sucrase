import {JSX_PREFIX, OPTIONAL_CHAIN_PREFIX} from "./prefixes";
import {assertResult, devProps} from "./util";
import {test} from "./folio.config";

function assertTypeScriptResult(code: string, expectedResult: string): void {
  assertResult(code, expectedResult, {transforms: ["jsx"]});
}

function assertTypeScriptESMResult(code: string, expectedResult: string): void {
  assertResult(code, expectedResult, {transforms: ["jsx"]});
}

function assertTypeScriptImportResult(
  code: string,
  {expectedESMResult}: {expectedESMResult: string},
): void {
  assertTypeScriptESMResult(code, expectedESMResult);
}

test("removes type assertions using `as`", () => {
  assertTypeScriptResult(
    `
      const x = 0;
      console.log(x as string);
    `,
    `
      const x = 0;
      console.log(x );
    `,
  );
});

test("properly handles variables named 'as'", () => {
  assertTypeScriptResult(
    `
      const as = "Hello";
      console.log(as);
    `,
    `
      const as = "Hello";
      console.log(as);
    `,
  );
});

test("removes access modifiers from class methods and fields", () => {
  assertTypeScriptResult(
    `
      class A {
        private b: number;
        public c(): string {
          return "hi";
        }
      }
    `,
    `
      class A {
        
         c() {
          return "hi";
        }
      }
    `,
  );
});

test("handles class field assignment with an existing constructor", () => {
  assertTypeScriptResult(
    `
      class A {
        x = 1;
        constructor() {
          this.y = 2;
        }
      }
    `,
    `
      class A {
        __init() {this.x = 1}
        constructor() {;A.prototype.__init.call(this);
          this.y = 2;
        }
      }
    `,
  );
});

test("handles class field assignment after a constructor with super", () => {
  assertTypeScriptResult(
    `
      class A extends B {
        x = 1;
        constructor(a) {
          super(a);
        }
      }
    `,
    `
      class A extends B {
        __init() {this.x = 1}
        constructor(a) {
          super(a);A.prototype.__init.call(this);;
        }
      }
    `,
  );
});

test("handles class field assignment after a constructor with multiple super calls", () => {
  assertTypeScriptResult(
    `
      class A extends B {
        x = 1;
        constructor(a) {
          super(a);
          super(b);
        }
      }
    `,
    `
      class A extends B {
        __init() {this.x = 1}
        constructor(a) {
          super(a);A.prototype.__init.call(this);;
          super(b);
        }
      }
    `,
  );
});

test("handles class field assignment after a constructor with super and super method call", () => {
  assertTypeScriptResult(
    `
      class A extends B {
        x = 1;
        constructor(a) {
          super(a);
          super.b();
        }
      }
    `,
    `
      class A extends B {
        __init() {this.x = 1}
        constructor(a) {
          super(a);A.prototype.__init.call(this);;
          super.b();
        }
      }
    `,
  );
});

test("handles class field assignment after a constructor with invalid super method before super call", () => {
  assertTypeScriptResult(
    `
      class A extends B {
        x = 1;
        constructor(a) {
          super.b();
          super(a);
        }
      }
    `,
    `
      class A extends B {
        __init() {this.x = 1}
        constructor(a) {
          super.b();
          super(a);A.prototype.__init.call(this);;
        }
      }
    `,
  );
});

test("handles class field assignment after a constructor with super prop", () => {
  assertTypeScriptResult(
    `
      class A extends B {
        x = 1;
        constructor(a) {
          super();
          super.a;
          super.b = 1;
        }
      }
    `,
    `
      class A extends B {
        __init() {this.x = 1}
        constructor(a) {
          super();A.prototype.__init.call(this);;
          super.a;
          super.b = 1;
        }
      }
    `,
  );
});

test("handles class field assignment after a constructor with invalid super prop before super call", () => {
  assertTypeScriptResult(
    `
      class A extends B {
        x = 1;
        constructor(a) {
          super.a;
          super.b = 1;
          super();
        }
      }
    `,
    `
      class A extends B {
        __init() {this.x = 1}
        constructor(a) {
          super.a;
          super.b = 1;
          super();A.prototype.__init.call(this);;
        }
      }
    `,
  );
});

test("handles class field assignment with no constructor", () => {
  assertTypeScriptResult(
    `
      class A {
        x = 1;
      }
    `,
    `
      class A {constructor() { A.prototype.__init.call(this); }
        __init() {this.x = 1}
      }
    `,
  );
});

test("handles class field assignment with no constructor in a subclass", () => {
  assertTypeScriptResult(
    `
      class A extends B {
        x = 1;
      }
    `,
    `
      class A extends B {constructor(...args) { super(...args); A.prototype.__init.call(this); }
        __init() {this.x = 1}
      }
    `,
  );
});

test("does not generate a conflicting name in a generated constructor", () => {
  assertTypeScriptResult(
    `
      class A extends B {
        args = 1;
      }
    `,
    `
      class A extends B {constructor(...args2) { super(...args2); A.prototype.__init.call(this); }
        __init() {this.args = 1}
      }
    `,
  );
});

test("handles readonly constructor initializers", () => {
  assertTypeScriptResult(
    `
      class A {
        constructor(readonly x: number) {
        }
      }
    `,
    `
      class A {
        constructor( x) {;this.x = x;
        }
      }
    `,
  );
});

test("removes non-null assertion operator but not negation operator", () => {
  assertTypeScriptResult(
    `
      const x = 1!;
      const y = x!;
      const z = !x; 
      const a = (x)!(y);
      const b = x + !y;
    `,
    `
      const x = 1;
      const y = x;
      const z = !x; 
      const a = (x)(y);
      const b = x + !y;
    `,
  );
});

test("handles static class methods", () => {
  assertTypeScriptResult(
    `
      export default class Foo {
        static run(): Result {
        }
      }
    `,
    `
      export default class Foo {
        static run() {
        }
      }
    `,
  );
});

test("handles async class methods", () => {
  assertTypeScriptResult(
    `
      export default class Foo {
        async run(): Promise<Result> {
        }
      }
    `,
    `
      export default class Foo {
        async run() {
        }
      }
    `,
  );
});

test("handles type predicates", () => {
  assertTypeScriptResult(
    `
      function foo(x: any): x is number {
        return x === 0;
      }
    `,
    `
      function foo(x) {
        return x === 0;
      }
    `,
  );
});

test("handles type predicates involving this", () => {
  assertTypeScriptResult(
    `
      class A {
        foo(): this is B {
          return false;
        }
      }
    `,
    `
      class A {
        foo() {
          return false;
        }
      }
    `,
  );
});

test("export default functions with type parameters", () => {
  assertTypeScriptResult(
    `
      export default function flatMap<T, U>(list: Array<T>, map: (element: T) => Array<U>): Array<U> {
        return list.reduce((memo, item) => memo.concat(map(item)), [] as Array<U>);
      }
    `,
    `
      export default function flatMap(list, map) {
        return list.reduce((memo, item) => memo.concat(map(item)), [] );
      }
    `,
  );
});

test("handles interfaces using `extends`", () => {
  assertTypeScriptResult(
    `
      export interface A extends B {
      }
    `,
    `
      

    `,
  );
});

test("removes non-bare import statements consisting of only types", () => {
  assertTypeScriptResult(
    `
      import A from 'a';
      import B from 'b';
      import 'c';
      import D from 'd';
      import 'd';
      import E from 'e';
      function f(a: A): boolean {
        return a instanceof A;
      }
      function g(b: B): boolean {
        return true;
      }
    `,
    `
      import A from 'a';

      import 'c';

      import 'd';

      function f(a) {
        return a instanceof A;
      }
      function g(b) {
        return true;
      }
    `,
  );
});

test("allows class fields with keyword names", () => {
  assertTypeScriptResult(
    `
      class A {
        readonly function: number;
        f: any = function() {};
      }
    `,
    `
      class A {constructor() { A.prototype.__init.call(this); }
        
        __init() {this.f = function() {}}
      }
    `,
  );
});

test("allows `export abstract class` syntax", () => {
  assertTypeScriptResult(
    `
      export abstract class A {}
    `,
    `
      export  class A {}
    `,
  );
});

test("handles type predicates when processing arrow functions", () => {
  assertTypeScriptResult(
    `
      values.filter((node): node is Node => node !== null);
    `,
    `
      values.filter((node) => node !== null);
    `,
  );
});

test("allows an explicit type parameter at function invocation time", () => {
  assertTypeScriptResult(
    `
      const f = f<number>(y);
      values.filter<Node>((node): node is Node => node !== null);
      const c = new Cache<number>();
    `,
    `
      const f = f(y);
      values.filter((node) => node !== null);
      const c = new Cache();
    `,
  );
});

test("allows computed field names", () => {
  assertTypeScriptResult(
    `
      class A {
        [a + b] = 3;
        0 = 1;
        "Hello, world" = 2;
      }
    `,
    `
      class A {constructor() { A.prototype.__init.call(this);A.prototype.__init2.call(this);A.prototype.__init3.call(this); }
        __init() {this[a + b] = 3}
        __init2() {this[0] = 1}
        __init3() {this["Hello, world"] = 2}
      }
    `,
  );
});

test("allows simple enums", () => {
  assertTypeScriptResult(
    `
      enum Foo {
        A,
        B,
        C
      }
    `,
    `
      var Foo; (function (Foo) {
        const A = 0; Foo[Foo["A"] = A] = "A";
        const B = A + 1; Foo[Foo["B"] = B] = "B";
        const C = B + 1; Foo[Foo["C"] = C] = "C";
      })(Foo || (Foo = {}));
    `,
  );
});

test("allows simple string enums", () => {
  assertTypeScriptResult(
    `
      enum Foo {
        A = "eh",
        B = "bee",
        C = "sea",
      }
    `,
    `
      var Foo; (function (Foo) {
        const A = "eh"; Foo["A"] = A;
        const B = "bee"; Foo["B"] = B;
        const C = "sea"; Foo["C"] = C;
      })(Foo || (Foo = {}));
    `,
  );
});

test("handles complex enum cases", () => {
  assertTypeScriptResult(
    `
      enum Foo {
        A = 15.5,
        "Hello world" = A / 2,
        "",
        "D" = "foo".length,
        E = D / D,
        "debugger" = 4,
        default = 7,
        "!" = E << E,
        "\\n",
        ",",
        "'",
      }
    `,
    `
      var Foo; (function (Foo) {
        const A = 15.5; Foo[Foo["A"] = A] = "A";
        Foo[Foo["Hello world"] = A / 2] = "Hello world";
        Foo[Foo[""] = (A / 2) + 1] = "";
        const D = "foo".length; Foo[Foo["D"] = D] = "D";
        const E = D / D; Foo[Foo["E"] = E] = "E";
        Foo[Foo["debugger"] = 4] = "debugger";
        Foo[Foo["default"] = 7] = "default";
        Foo[Foo["!"] = E << E] = "!";
        Foo[Foo["\\n"] = (E << E) + 1] = "\\n";
        Foo[Foo[","] = ((E << E) + 1) + 1] = ",";
        Foo[Foo["'"] = (((E << E) + 1) + 1) + 1] = "'";
      })(Foo || (Foo = {}));
    `,
  );
});

test("removes functions without bodies", () => {
  assertTypeScriptResult(
    `
      function foo(x: number);
      export function bar(s: string);
      function foo(x: any) {
        console.log(x);
      }
    `,
    `
      

      function foo(x) {
        console.log(x);
      }
    `,
  );
});

test("handles and removes `declare module` syntax", () => {
  assertTypeScriptResult(
    `
      declare module "builtin-modules" {
        let result: string[];
        export = result;
      }
    `,
    `
      



    `,
  );
});

test("handles and removes `declare global` syntax", () => {
  assertTypeScriptResult(
    `
      declare global {
      }
    `,
    `
      

    `,
  );
});

test("handles and removes `export declare class` syntax", () => {
  assertTypeScriptResult(
    `
      export declare class Foo {
      }
    `,
    `
      

    `,
  );
});

test("allows a parameter named declare", () => {
  assertTypeScriptResult(
    `
      function foo(declare: boolean): string {
        return "Hello!";
      }
    `,
    `
      function foo(declare) {
        return "Hello!";
      }
    `,
  );
});

test("properly allows modifier names as params", () => {
  assertTypeScriptResult(
    `
      class Foo {
        constructor(set, readonly) {}
        constructor(set: any, readonly: boolean) {}
      }
    `,
    `
      class Foo {
        constructor(set, readonly) {}
        constructor(set, readonly) {}
      }
    `,
  );
});

test("properly handles method parameters named readonly", () => {
  assertTypeScriptResult(
    `
      class Foo {
        bar(readonly: number) {
          console.log(readonly);
        }
      }
    `,
    `
      class Foo {
        bar(readonly) {
          console.log(readonly);
        }
      }
    `,
  );
});

test("handles export default abstract class", () => {
  assertTypeScriptResult(
    `
      export default abstract class Foo {
      }
    `,
    `
      export default  class Foo {
      }
    `,
  );
});

test("allows calling a function imported via `import *` with TypeScript enabled", () => {
  assertTypeScriptResult(
    `
      import * as f from './myFunc';
      console.log(f());
    `,
    `
      import * as f from './myFunc';
      console.log(f());
    `,
  );
});

test("treats const enums as regular enums", () => {
  assertTypeScriptResult(
    `
      const enum A {
        Foo,
        Bar,
      }
    `,
    `
      var A; (function (A) {
        const Foo = 0; A[A["Foo"] = Foo] = "Foo";
        const Bar = Foo + 1; A[A["Bar"] = Bar] = "Bar";
      })(A || (A = {}));
    `,
  );
});

test("allows `export enum`", () => {
  assertTypeScriptResult(
    `
      export enum A {
        Foo,
        Bar,
      }
    `,
    `
      export var A; (function (A) {
        const Foo = 0; A[A["Foo"] = Foo] = "Foo";
        const Bar = Foo + 1; A[A["Bar"] = Bar] = "Bar";
      })(A || (A = {}));
    `,
  );
});

test("allows exported const enums", () => {
  assertTypeScriptResult(
    `
      export const enum A {
        Foo,
        Bar,
      }
    `,
    `
      export var A; (function (A) {
        const Foo = 0; A[A["Foo"] = Foo] = "Foo";
        const Bar = Foo + 1; A[A["Bar"] = Bar] = "Bar";
      })(A || (A = {}));
    `,
  );
});

test("properly handles simple abstract classes", () => {
  assertTypeScriptResult(
    `
      abstract class A {
      }
    `,
    `
       class A {
      }
    `,
  );
});

test("properly handles exported abstract classes with abstract methods", () => {
  assertTypeScriptResult(
    `
      export abstract class A {
        abstract a();
        b(): void {
          console.log("hello");
        }
      }
    `,
    `
      export  class A {
        
        b() {
          console.log("hello");
        }
      }
    `,
  );
});

test("does not prune imports that are then exported", () => {
  assertTypeScriptResult(
    `
      import A from 'a';
      export {A};
    `,
    `
      import A from 'a';
      export {A};
    `,
  );
});

test("allows this types in functions", () => {
  assertTypeScriptResult(
    `
      function foo(this: number, x: number): number {
        return this + x;
      }
    `,
    `
      function foo( x) {
        return this + x;
      }
    `,
  );
});

test("supports export * in TypeScript", () => {
  assertTypeScriptResult(
    `
      export * from './MyVars';
    `,
    `
      export * from './MyVars';
    `,
  );
});

test("properly handles access modifiers on constructors", () => {
  assertTypeScriptResult(
    `
      class A {
        x = 1;
        public constructor() {
        }
      }
    `,
    `
      class A {
        __init() {this.x = 1}
         constructor() {;A.prototype.__init.call(this);
        }
      }
    `,
  );
});

test("allows old-style type assertions in non-JSX TypeScript", () => {
  assertResult(
    `
      const x = <number>3;
    `,
    `
      const x = 3;
    `,
    {transforms: []},
  );
});

test("properly handles new declarations within interfaces", () => {
  assertTypeScriptResult(
    `
      interface Foo {
        new(): Foo;
      }
    `,
    `
      


    `,
  );
});

test("handles code with an index signature", () => {
  assertTypeScriptResult(
    `
      const o: {[k: string]: number} = {
        a: 1,
        b: 2,
      }
    `,
    `
      const o = {
        a: 1,
        b: 2,
      }
    `,
  );
});

test("handles assert and assign syntax", () => {
  assertTypeScriptResult(
    `
      (a as b) = c;
    `,
    `
      (a ) = c;
    `,
  );
});

test("handles possible JSX ambiguities", () => {
  assertTypeScriptResult(
    `
      f<T>();
      new C<T>();
      type A = T<T>;
    `,
    `
      f();
      new C();
      
    `,
  );
});

test("handles the 'unique' contextual keyword", () => {
  assertTypeScriptResult(
    `
      let y: unique symbol;
    `,
    `
      let y;
    `,
  );
});

test("handles async arrow functions with rest params", () => {
  assertTypeScriptResult(
    `
      const foo = async (...args: any[]) => {}
      const bar = async (...args?: any[]) => {}
    `,
    `
      const foo = async (...args) => {}
      const bar = async (...args) => {}
    `,
  );
});

test("handles conditional types", () => {
  assertTypeScriptResult(
    `
      type A = B extends C ? D : E;
    `,
    `
      
    `,
  );
});

test("handles the 'infer' contextual keyword in types", () => {
  assertTypeScriptResult(
    `
      type Element<T> = T extends (infer U)[] ? U : T;
    `,
    `
      
    `,
  );
});

test("handles definite assignment assertions in classes", () => {
  assertTypeScriptResult(
    `
      class A {
        foo!: number;
        getFoo(): number {
          return foo;
        }
      }
    `,
    `
      class A {
        
        getFoo() {
          return foo;
        }
      }
    `,
  );
});

test("handles definite assignment assertions on variables", () => {
  assertTypeScriptResult(
    `
      let x!: number;
      initX();
      console.log(x + 1);
    `,
    `
      let x;
      initX();
      console.log(x + 1);
    `,
  );
});

test("handles mapped type modifiers", () => {
  assertTypeScriptResult(
    `
      let map: { +readonly [P in string]+?: number; };
      let map2: { -readonly [P in string]-?: number };
    `,
    `
      let map;
      let map2;
    `,
  );
});

test("does not prune imported identifiers referenced by JSX", () => {
  assertTypeScriptResult(
    `
      import React from 'react';
      
      import Foo from './Foo';
      import Bar from './Bar';
      import someProp from './someProp';
      import lowercaseComponent from './lowercaseComponent';
      import div from './div';
      const x: Bar = 3;
      function render(): JSX.Element {
        return (
          <div>
            <Foo.Bar someProp="a" />
            <lowercaseComponent.Thing />
          </div>
        );
      }
    `,
    `const _jsxFileName = "";
      import React from 'react';
      
      import Foo from './Foo';


      import lowercaseComponent from './lowercaseComponent';

      const x = 3;
      function render() {
        return (
          React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 12}}
            , React.createElement(Foo.Bar, { someProp: "a", __self: this, __source: {fileName: _jsxFileName, lineNumber: 13}} )
            , React.createElement(lowercaseComponent.Thing, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 14}} )
          )
        );
      }
    `,
  );
});

test("does not elide a React import when the file contains a JSX fragment", () => {
  assertTypeScriptResult(
    `
      import React from 'react';
      function render(): JSX.Element {
        return <>Hello</>;
      }
    `,
    `
      import React from 'react';
      function render() {
        return React.createElement(React.Fragment, null, "Hello");
      }
    `,
  );
});

test("correctly takes JSX pragmas into account avoiding JSX import elision", () => {
  assertResult(
    `
      import {A, B, C, D} from 'foo';
      function render(): JSX.Element {
        return <>Hello</>;
      }
    `,
    `
      import {A, C,} from 'foo';
      function render() {
        return A.B(C.D, null, "Hello");
      }
    `,
    {transforms: ["jsx"], jsxPragma: "A.B", jsxFragmentPragma: "C.D"},
  );
});

test("correctly takes JSX pragmas into account avoiding JSX import elision with fragments unused", () => {
  assertResult(
    `
      import {A, B, C, D} from 'foo';
      function render(): JSX.Element {
        return <span />;
      }
    `,
    `const _jsxFileName = "";
      import {A,} from 'foo';
      function render() {
        return A.B('span', {${devProps(4)}} );
      }
    `,
    {transforms: ["jsx"], jsxPragma: "A.B", jsxFragmentPragma: "C.D"},
  );
});

test("handles TypeScript exported enums in ESM mode", () => {
  assertTypeScriptESMResult(
    `
      export enum Foo {
        X = "Hello",
      }
    `,
    `
      export var Foo; (function (Foo) {
        const X = "Hello"; Foo["X"] = X;
      })(Foo || (Foo = {}));
    `,
  );
});

test("changes import = require to plain require in ESM mode", () => {
  assertTypeScriptESMResult(
    `
      import a = require('a');
      a();
    `,
    `
      const a = require('a');
      a();
    `,
  );
});

test("properly transforms JSX in ESM mode", () => {
  assertTypeScriptESMResult(
    `
      import React from 'react';
      const x = <Foo />;
    `,
    `${JSX_PREFIX}
      import React from 'react';
      const x = React.createElement(Foo, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 3}} );
    `,
  );
});

test("properly prunes TypeScript imported names", () => {
  assertTypeScriptESMResult(
    `
      import a, {n as b, m as c, d} from './e';
      import f, * as g from './h';
      a();
      const x: b = 3;
      const y = c + 1;
    `,
    `
      import a, { m as c,} from './e';

      a();
      const x = 3;
      const y = c + 1;
    `,
  );
});

test("properly handles optional class fields with default values", () => {
  assertTypeScriptResult(
    `
      class A {
        n?: number = 3;
      }
    `,
    `
      class A {constructor() { A.prototype.__init.call(this); }
        __init() {this.n = 3}
      }
    `,
  );
});

// TODO: TypeScript 2.9 makes this required, so we can drop support for this syntax when we don't
// need to support older versions of TypeScript.
test("allows trailing commas after rest elements", () => {
  assertTypeScriptResult(
    `
      function foo(a, ...b,) {}
      const {a, ...b,} = c;
      const [a, ...b,] = c;
    `,
    `
      function foo(a, ...b,) {}
      const {a, ...b,} = c;
      const [a, ...b,] = c;
    `,
  );
});

test("allows index signatures in classes", () => {
  assertTypeScriptResult(
    `
      export class Foo {
          f() {
          }
          [name: string]: any;
          x = 1;
      }
    `,
    `
      export class Foo {constructor() { Foo.prototype.__init.call(this); }
          f() {
          }
          
          __init() {this.x = 1}
      }
    `,
  );
});

test("allows destructured params in function types", () => {
  assertTypeScriptResult(
    `
      const f: ({a}: {a: number}) => void = () => {};
      const g: ([a]: Array<number>) => void = () => {};
      const h: ({a: {b: [c]}}: any) => void = () => {};
      const o: ({a: {b: c}}) = {};
    `,
    `
      const f = () => {};
      const g = () => {};
      const h = () => {};
      const o = {};
    `,
  );
});

test("allows type arguments in JSX elements", () => {
  assertTypeScriptResult(
    `
      const e1 = <Foo<number> x="1" />
      const e2 = <Foo<string>><span>Hello</span></Foo>
    `,
    `const _jsxFileName = "";
      const e1 = React.createElement(Foo, { x: "1", __self: this, __source: {fileName: _jsxFileName, lineNumber: 2}} )
      const e2 = React.createElement(Foo, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 3}}, React.createElement('span', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 3}}, "Hello"))
    `,
  );
});

test("allows type arguments tagged templates", () => {
  assertTypeScriptResult(
    `
      f<T>\`\`;
      new C<T>
      \`\`;
    `,
    `
      f\`\`;
      new C
      \`\`;
    `,
  );
});

test("allows export default interface", () => {
  assertTypeScriptResult(
    `
      export default interface A {}
    `,
    `
      
    `,
  );
});

test("parses type arguments on decorators", () => {
  assertTypeScriptResult(
    `
      @decorator<string>()
      class Test {}
    `,
    `
      @decorator()
      class Test {}
    `,
  );
});

test("properly parses tuple types with optional values", () => {
  assertTypeScriptResult(
    `
      let x: [string, number?, (string | number)?];
    `,
    `
      let x;
    `,
  );
});

test("allows a rest element on a tuple type", () => {
  assertTypeScriptResult(
    `
      let x: [string, ...number[]];
    `,
    `
      let x;
    `,
  );
});

test("allows rest elements in the middle of tuple types", () => {
  assertTypeScriptResult(
    `
      let x: [...number[], string];
      let y: [...[number, string], string];
    `,
    `
      let x;
      let y;
    `,
  );
});

test("allows overloads for constructors", () => {
  assertTypeScriptResult(
    `
      class A {
        constructor(s: string)
        constructor(n: number)
        constructor(sn: string | number) {}
      }
    `,
    `
      class A {
        

        constructor(sn) {}
      }
    `,
  );
});

test("properly elides ESM imports that only have value references in shadowed names", () => {
  assertTypeScriptESMResult(
    `
      import T, {a as b, c} from './T';
      import {d, e} from './foo';
      
      const x: T = 3;
      console.log(e);

      function foo() {
        let T = 3, b = 4, c = 5, d = 6;
        console.log(T, b, c, d);
      }
    `,
    `

      import { e} from './foo';
      
      const x = 3;
      console.log(e);

      function foo() {
        let T = 3, b = 4, c = 5, d = 6;
        console.log(T, b, c, d);
      }
    `,
  );
});

test("handles import() types", () => {
  assertTypeScriptESMResult(
    `
      type T1 = import("./foo");
      type T2 = typeof import("./bar");
      type T3 = import("./bar").Point;
      type T4 = import("./utils").HashTable<number>;
    `,
    `
      



    `,
  );
});

test("properly compiles class fields with extends in a type parameter", () => {
  assertTypeScriptESMResult(
    `
      class A<B extends C> {
        x = 1;
      }
    `,
    `
      class A {constructor() { A.prototype.__init.call(this); }
        __init() {this.x = 1}
      }
    `,
  );
});

test("properly handles a declaration that looks like an assignment to an export (#401)", () => {
  assertTypeScriptResult(
    `
      export class Foo {}
      let foo: Foo = new Foo();
    `,
    `
      export class Foo {}
      let foo = new Foo();
    `,
  );
});

test("properly handles comparison operators that look like JSX or generics (#408)", () => {
  assertTypeScriptResult(
    `
      a < b > c
    `,
    `
      a < b > c
    `,
  );
});

test("elides type-only exports", () => {
  assertTypeScriptImportResult(
    `
      type T = number;
      type U = number;
      export {T, U as w};
    `,
    {
      expectedESMResult: `
      

      export {};
    `,
    },
  );
});

test("preserves non-type exports in ESM mode", () => {
  assertTypeScriptImportResult(
    `
      const T = 3;
      export {T as u};
    `,
    {
      expectedESMResult: `
      const T = 3;
      export {T as u};
    `,
    },
  );
});

test("preserves type-and-non-type exports in ESM mode", () => {
  assertTypeScriptImportResult(
    `
      type T = number;
      const T = 3;
      export {T};
    `,
    {
      expectedESMResult: `
      
      const T = 3;
      export {T};
    `,
    },
  );
});

test("elides unknown and type-only exports in CJS, and only elides type-only exports in ESM", () => {
  assertTypeScriptImportResult(
    `
      import A, {b, c as d} from './foo';
      enum E { X = 1 }
      class F {}
      interface G {}
      function h() {}
      import I = require('./i');
      type J = number;
      export {A, b, c, d, E, F, G, h, I, J};
    `,
    {
      expectedESMResult: `
      import A, {b, c as d} from './foo';
      var E; (function (E) { const X = 1; E[E["X"] = X] = "X"; })(E || (E = {}));
      class F {}
      
      function h() {}
      const I = require('./i');
      
      export {A, b, c, d, E, F, h, I,};
    `,
    },
  );
});

test("preserves exported variables assigned with a destructure", () => {
  assertTypeScriptImportResult(
    `
      const o = {x: 1};
      const {x} = o;
      const {x: y} = o;
      type z = number;
      export {x, y, z};
    `,
    {
      expectedESMResult: `
      const o = {x: 1};
      const {x} = o;
      const {x: y} = o;
      
      export {x, y,};
    `,
    },
  );
});

test("elides export default when the value is an identifier declared as a type", () => {
  assertTypeScriptImportResult(
    `
      type T = number;
      export default T;
    `,
    {
      expectedESMResult: `
      
      ;
    `,
    },
  );
});

test("does not elide export default when the value is a complex expression", () => {
  assertTypeScriptImportResult(
    `
      type T = number;
      export default T | U;
    `,
    {
      expectedESMResult: `
      
      export default T | U;
    `,
    },
  );
});

test("does not elide export default when the value is used as a binding within a type", () => {
  assertTypeScriptImportResult(
    `
      type f = (x: number) => void;
      export default x;
    `,
    {
      expectedESMResult: `
      
      export default x;
    `,
    },
  );
});

test("preserves export default when the value is an unknown identifier", () => {
  assertTypeScriptImportResult(
    `
      export default window;
    `,
    {
      expectedESMResult: `
      export default window;
    `,
    },
  );
});

test("preserves export default when the value is a plain variable", () => {
  assertTypeScriptImportResult(
    `
      const x = 1;
      export default x;
    `,
    {
      expectedESMResult: `
      const x = 1;
      export default x;
    `,
    },
  );
});

test("elides unused import = statements", () => {
  assertTypeScriptImportResult(
    `
      import A = require('A');
      import B = require('B');
      import C = A.C;
      B();
      const c: C = 2;
    `,
    {
      expectedESMResult: `
      ;
      const B = require('B');
      ;
      B();
      const c = 2;
    `,
    },
  );
});

// We don't support this for now since it needs a more complex implementation than we have
// anywhere else, and ideally you would just write `const B = A.B;`, which works.
// it.skip("handles transitive references when eliding import = statements", () => {
//   assertTypeScriptImportResult(
//     `
//       import A from 'A';
//       import B = A.B;
//       B();
//     `,
//     {
//       expectedESMResult: `
//       import A from 'A';
//       const B = A.B;
//       B();
//     `,
//     },
//   );
// });

test("handles newlines before class declarations", () => {
  assertTypeScriptResult(
    `
      abstract
      class A {}
      declare
      class B {}
      declare
      const x: number, y: string;
      declare
      const { x, y }: { x: number, y: number };
      declare
      interface I {}
      declare
      let x;
      declare
      var x;
      declare
      var x: any;
      module
      Foo
      {}
      namespace
      Foo
      {}
      type
      Foo = string;
    `,
    `
      abstract
      class A {}
      declare
      class B {}
      declare
      const x, y;
      declare
      const { x, y };
      declare
      
      declare
      let x;
      declare
      var x;
      declare
      var x;
      module
      Foo
      {}
      namespace
      Foo
      {}
      type
      Foo = string;
    `,
  );
});

test("handles const contexts", () => {
  assertTypeScriptResult(
    `
      let x = 5 as const;
    `,
    `
      let x = 5 ;
    `,
  );
});

test("handles the readonly type modifier", () => {
  assertTypeScriptResult(
    `
      let z: readonly number[];
      let z1: readonly [number, number];
    `,
    `
      let z;
      let z1;
    `,
  );
});

test("allows template literal syntax for type literals", () => {
  assertTypeScriptResult(
    `
      let x: \`foo\`;
    `,
    `
      let x;
    `,
  );
});

test("allows template literal substitutions in literal string types", () => {
  assertTypeScriptResult(
    `
      type Color = "red" | "blue";
      type Quantity = "one" | "two";
      
      type SeussFish = \`\${Quantity | Color} fish\`;
      const fish: SeussFish = "blue fish";
    `,
    `
      



      const fish = "blue fish";
    `,
  );
});

test("allows complex template literal substitutions in literal string types", () => {
  // Uppercase<T> is an example of a type expression that isn't a valid value
  // expression, ensuring that we're using a type parser for the substitution.
  assertTypeScriptResult(
    `
      type EnthusiasticGreeting<T extends string> = \`\${Uppercase<T>}\`;
    `,
    `
      
    `,
  );
});

test("allows bigint literal syntax for type literals", () => {
  assertTypeScriptResult(
    `
      let x: 10n;
      type T = { n: 20n, m: -30n };
      function f(arg: [40n]): 50n[] {};
    `,
    `
      let x;
      
      function f(arg) {};
    `,
  );
});

test("allows decimal literal syntax for type literals", () => {
  assertTypeScriptResult(
    `
      let x: 10m;
      type T = { n: 20m, m: -30m };
      function f(arg: [40m]): 50m[] {};
    `,
    `
      let x;
      
      function f(arg) {};
    `,
  );
});

test("allows private field syntax", () => {
  assertTypeScriptResult(
    `
      class Foo {
        readonly #x: number;
        readonly #y: number;
      }
    `,
    `
      class Foo {
         #x;
         #y;
      }
    `,
  );
});

test("allows assertion signature syntax", () => {
  assertTypeScriptResult(
    `
      function assert(condition: any, msg?: string): asserts condition {
          if (!condition) {
              throw new AssertionError(msg)
          }
      }
    `,
    `
      function assert(condition, msg) {
          if (!condition) {
              throw new AssertionError(msg)
          }
      }
    `,
  );
});

test("allows assertion signature syntax with is", () => {
  assertTypeScriptResult(
    `
      function assertIsDefined<T>(x: T): asserts x is NonNullable<T> {
        if (x == null) throw "oh no";
      }
    `,
    `
      function assertIsDefined(x) {
        if (x == null) throw "oh no";
      }
    `,
  );
});

test("allows assertion signature syntax using this", () => {
  assertTypeScriptResult(
    `
      class Foo {
        isBar(): asserts this is Foo {}
        isBaz = (): asserts this is Foo => {}
      }
    `,
    `
      class Foo {constructor() { Foo.prototype.__init.call(this); }
        isBar() {}
        __init() {this.isBaz = () => {}}
      }
    `,
  );
});

test("does not get confused by a user-defined type guard on a variable called asserts", () => {
  assertTypeScriptResult(
    `
      function checkIsDefined(asserts: any): asserts is NonNullable<T> {
        return false;
      }
    `,
    `
      function checkIsDefined(asserts) {
        return false;
      }
    `,
  );
});

test("does not get confused by a return type called asserts", () => {
  assertTypeScriptResult(
    `
      function checkIsDefined(x: any): asserts {
        return false;
      }
    `,
    `
      function checkIsDefined(x) {
        return false;
      }
    `,
  );
});

test("correctly parses optional chain calls with type arguments", () => {
  assertTypeScriptResult(
    `
      example.inner?.greet<string>()
    `,
    `${OPTIONAL_CHAIN_PREFIX}
      _optionalChain([example, 'access', _ => _.inner, 'optionalAccess', _2 => _2.greet, 'call', _3 => _3()])
    `,
  );
});

test("allows optional async methods", () => {
  assertTypeScriptResult(
    `
      class A extends B {
        async method?(val: string): Promise<void>;
      }
    `,
    `
      class A extends B {
        
      }
    `,
  );
});

test("handles trailing commas at the end of tuple type with rest", () => {
  assertTypeScriptResult(
    `
      let x: [string, ...string[],]
    `,
    `
      let x
    `,
  );
});

test("supports type arguments with optional chaining", () => {
  assertTypeScriptResult(
    `
      const x = a.b?.<number>();
    `,
    `${OPTIONAL_CHAIN_PREFIX}
      const x = _optionalChain([a, 'access', _ => _.b, 'optionalCall', _2 => _2()]);
    `,
  );
});

test("parses and removes import type statements in ESM mode", () => {
  assertTypeScriptESMResult(
    `
      import type foo from 'foo';
      import bar from 'bar';
      console.log(foo, bar);
    `,
    `

      import bar from 'bar';
      console.log(foo, bar);
    `,
  );
});

test("parses and removes named import type statements in ESM mode", () => {
  assertTypeScriptESMResult(
    `
      import type {foo} from 'foo';
      import {bar} from 'bar';
      console.log(foo, bar);
    `,
    `

      import {bar} from 'bar';
      console.log(foo, bar);
    `,
  );
});

test("parses and removes export type statements in ESM mode", () => {
  assertTypeScriptESMResult(
    `
      import T from './T';
      let x: T;
      export type {T};
    `,
    `
      import T from './T';
      let x;
      ;
    `,
  );
});

test("parses and removes export type re-export statements in ESM mode", () => {
  assertTypeScriptESMResult(
    `
      export type {T} from './T';
      export type {T1 as TX, T2 as TY} from './OtherTs';
    `,
    `
      ;
      ;
    `,
  );
});

test("properly handles default args in constructors", () => {
  assertTypeScriptResult(
    `
      class Foo {
        constructor(p = -1) {}
      }
    `,
    `
      class Foo {
        constructor(p = -1) {}
      }
    `,
  );
});

test("properly emits assignments with multiple constructor initializers", () => {
  assertTypeScriptResult(
    `
      class Foo {
        constructor(a: number, readonly b: number, private c: number) {}
      }
    `,
    `
      class Foo {
        constructor(a,  b,  c) {;this.b = b;this.c = c;}
      }
    `,
  );
});

test("properly removes class fields with declare", () => {
  assertTypeScriptResult(
    `
      class Foo {
          declare a: number;
          public declare b: number;
          declare public c: number;
          static declare d: number;
          declare static e: number;
          declare public static f: number;
          public declare static g: number;
          public static declare h: number;
          
          constructor() {
              console.log('Hi');
          }
      }
    `,
    `
      class Foo {
          
          
          
          
          
          
          
          
          
          constructor() {
              console.log('Hi');
          }
      }
    `,
  );
});

test("properly removes types from catch clauses", () => {
  assertTypeScriptResult(
    `
      try {} catch (e: unknown) {}
      try {} catch (e: string | [...number, string]) {}
    `,
    `
      try {} catch (e) {}
      try {} catch (e) {}
    `,
  );
});

test("properly removes labeled tuple types", () => {
  assertTypeScriptResult(
    `
      type T1 = [x: number, y?: number, ...rest: number[]];
      function f(args: [s?: string, ...ns: number[]]) {}
    `,
    `
      
      function f(args) {}
    `,
  );
});

test("properly handles a >= symbol after an `as` cast", () => {
  assertTypeScriptResult(
    `
      const x: string | number = 1;
      if (x as number >= 5) {}
    `,
    `
      const x = 1;
      if (x  >= 5) {}
    `,
  );
});

test("handles simple template literal interpolations in types", () => {
  assertTypeScriptResult(
    `
      type A = \`make\${A | B}\`;
    `,
    `
      
    `,
  );
});

test("handles complex template literal interpolations in types", () => {
  assertTypeScriptResult(
    `
      type A = \`foo\${{ [k: string]: number}}\`;
    `,
    `
      
    `,
  );
});

test("handles mapped type `as` clauses", () => {
  assertTypeScriptResult(
    `
      type MappedTypeWithNewKeys<T> = {
        [K in keyof T as NewKeyType]: T[K]
      };
      
      type RemoveKindField<T> = {
        [K in keyof T as Exclude<K, "kind">]: T[K]
      };
      
      type PickByValueType<T, U> = {
        [K in keyof T as T[K] extends U ? K : never]: T[K]
      };
    `,
    `
      










    `,
  );
});

test("handles an arrow function with typed destructured params", () => {
  assertTypeScriptResult(
    `
      (
        { a, b }: T,
      ): T => {};
    `,
    `
      (
        { a, b },
      ) => {};
    `,
  );
});

test("handles various forms of optional parameters in an interface", () => {
  assertTypeScriptResult(
    `
      interface B {
        foo([]?): void;
        bar({}, []?): any;
        baz(a: string, b: number, []?): void;
      }
    `,
    `
      




    `,
  );
});

test("correctly handles methods and fields named declare", () => {
  assertTypeScriptResult(
    `
      class A {
        declare() {
        }
      }
      class B {
        static declare() {
        }
      }
      class C {
        declare = 2;
      }
    `,
    `
      class A {
        declare() {
        }
      }
      class B {
        static declare() {
        }
      }
      class C {constructor() { C.prototype.__init.call(this); }
        __init() {this.declare = 2}
      }
    `,
  );
});

test("correctly handles field declarations after function overloads", () => {
  assertTypeScriptResult(
    `
      class Class {
        method(a: number);
        method(a: unknown) {}
        declare field: number;
      }
    `,
    `
      class Class {
        
        method(a) {}
        
      }
    `,
  );
});
