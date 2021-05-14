import {assertExpectations, assertResult, Expectations} from "./util";

function assertTypeScriptAndFlowExpectations(code: string, expectations: Expectations): void {
  assertExpectations(code, expectations, {transforms: ["jsx"]});
}

function assertTypeScriptAndFlowResult(code: string, expectedResult: string): void {
  assertResult(code, expectedResult, {transforms: ["jsx"]});
}

/**
 * Tests for syntax common between flow and typescript.
 */
describe("type transforms", () => {
  it("removes `implements` from a class declaration", () => {
    assertTypeScriptAndFlowResult(
      `
      class A implements B {}
      class C extends D implements E {}
    `,
      `
      class A  {}
      class C extends D  {}
    `,
    );
  });

  it("removes function return type annotations", () => {
    assertTypeScriptAndFlowResult(
      `
      function f(): number {
        return 3;
      }
      const g = (): number => 4;
      function h():{}|{}{}{}
      const o = {
        foo(): string | number {
          return 'hi';
        }
      }
      class C {
        bar(): void {
          console.log('Hello');
        }
      }
    `,
      `
      function f() {
        return 3;
      }
      const g = () => 4;
      function h(){}{}
      const o = {
        foo() {
          return 'hi';
        }
      }
      class C {
        bar() {
          console.log('Hello');
        }
      }
    `,
    );
  });

  it("removes types in parameters and variable declarations", () => {
    assertTypeScriptAndFlowResult(
      `
      function foo(x: number, y: A | B): void {
        const a: string = "Hello";
        const b = (a: number);
      }
    `,
      `
      function foo(x, y) {
        const a = "Hello";
        const b = (a);
      }
    `,
    );
  });

  it("removes array types", () => {
    assertTypeScriptAndFlowResult(
      `
      function foo(): string[] {
        return [];
      }
    `,
      `
      function foo() {
        return [];
      }
    `,
    );
  });

  it("removes parameterized types", () => {
    assertTypeScriptAndFlowResult(
      `
      function foo(): Array<string> {
        return [];
      }
    `,
      `
      function foo() {
        return [];
      }
    `,
    );
  });

  it("removes object types within classes", () => {
    assertTypeScriptAndFlowResult(
      `
      class A {
        x: number = 2;
        y: {} = {};
      }
    `,
      `
      class A {constructor() { A.prototype.__init.call(this);A.prototype.__init2.call(this); }
        __init() {this.x = 2}
        __init2() {this.y = {}}
      }
    `,
    );
  });

  it("removes bare object type definitions", () => {
    assertTypeScriptAndFlowResult(
      `
      class A {
        x: number;
      }
    `,
      `
      class A {
        
      }
    `,
    );
  });

  it("removes function type parameters", () => {
    assertTypeScriptAndFlowResult(
      `
      function f<T>(t: T): void {
        console.log(t);
      }
      const o = {
        g<T>(t: T): void {
        }
      }
      class C {
        h<T>(t: T): void {
        }
      }
    `,
      `
      function f(t) {
        console.log(t);
      }
      const o = {
        g(t) {
        }
      }
      class C {
        h(t) {
        }
      }
    `,
    );
  });

  it("handles an exported function with type parameters", () => {
    assertTypeScriptAndFlowResult(
      `
      export function foo(x: number): number {
        return x + 1;
      }
    `,
      `
      export function foo(x) {
        return x + 1;
      }
    `,
    );
  });

  it("removes type assignments", () => {
    assertTypeScriptAndFlowResult(
      `
      type foo = number;
      const x: foo = 3;
    `,
      `
      
      const x = 3;
    `,
    );
  });

  it("handles exported types", () => {
    assertTypeScriptAndFlowResult(
      `
export type foo = number | string;
export const x = 1;
    `,
      `

export const x = 1;
    `,
    );
  });

  it("handles string literal types", () => {
    assertTypeScriptAndFlowResult(
      `
      function foo(x: "a"): string {
        return x;
      }
    `,
      `
      function foo(x) {
        return x;
      }
    `,
    );
  });

  it("allows leading pipe operators in types", () => {
    assertTypeScriptAndFlowResult(
      `
      const x: | number | string = "Hello";
    `,
      `
      const x = "Hello";
    `,
    );
  });

  it("allows nested generics with a fake right-shift token", () => {
    assertTypeScriptAndFlowResult(
      `
      const arr1: Array<Array<number> > = [[1]];
      const arr2: Array<Array<number>> = [[2]];
      const arr3: Array<Array<Array<number>>> = [[[3]]];
    `,
      `
      const arr1 = [[1]];
      const arr2 = [[2]];
      const arr3 = [[[3]]];
    `,
    );
  });

  it("handles interface declarations and `export interface`", () => {
    assertTypeScriptAndFlowResult(
      `
      interface Cartesian { x: number; y: number; }
      export interface Polar { r: number; theta: number; }
    `,
      `
      

    `,
    );
  });

  it("supports interface as an object key", () => {
    assertTypeScriptAndFlowResult(
      `
      const o = {
        interface: true,
      };
    `,
      `
      const o = {
        interface: true,
      };
    `,
    );
  });

  it("properly removes optional parameter types", () => {
    assertTypeScriptAndFlowResult(
      `
      function foo(x?: number): string {
        return 'Hi!';
      }
    `,
      `
      function foo(x) {
        return 'Hi!';
      }
    `,
    );
  });

  it("does not confuse type parameters with JSX", () => {
    assertTypeScriptAndFlowResult(
      `
      const f = <T>(t: T): number => 3;
    `,
      `
      const f = (t) => 3;
    `,
    );
  });

  it("does not confuse type parameters with JSX in type expressions", () => {
    assertTypeScriptAndFlowResult(
      `
      const f: <T>(t: T) => number = () => 3;
    `,
      `
      const f = () => 3;
    `,
    );
  });

  it("supports class declarations with type parameters", () => {
    assertTypeScriptAndFlowResult(
      `
      class Foo<T> {}
    `,
      `
      class Foo {}
    `,
    );
  });

  it("allows negative number literals within types", () => {
    assertTypeScriptAndFlowResult(
      `
      function foo(): -1 {
        return -1;
      }
    `,
      `
      function foo() {
        return -1;
      }
    `,
    );
  });

  it("removes type parameters from class methods", () => {
    assertTypeScriptAndFlowResult(
      `
      class A {
        b<T>() {
        }
      }
    `,
      `
      class A {
        b() {
        }
      }
    `,
    );
  });

  it("allows type aliases with fields with multiple type arguments", () => {
    assertTypeScriptAndFlowResult(
      `
      type A = {
        source: Map<B, C>,
      };
    `,
      `
      


    `,
    );
  });

  it("handles classes with constructors", () => {
    assertTypeScriptAndFlowResult(
      `
      class A {
        constructor() {
        }
      }
    `,
      `
      class A {
        constructor() {
        }
      }
    `,
    );
  });

  it("handles arrow functions with optional parameters", () => {
    assertTypeScriptAndFlowResult(
      `
      const f = (x?: number) => x + 1;
    `,
      `
      const f = (x) => x + 1;
    `,
    );
  });

  it("handles classes extending classes with parameterized types", () => {
    assertTypeScriptAndFlowResult(
      `
      class A extends B<C> {}
    `,
      `
      class A extends B {}
    `,
    );
  });

  it("handles an ambiguous consequent or arrow function", () => {
    assertTypeScriptAndFlowResult(
      `
      a ? (b) : c;
    `,
      `
      a ? (b) : c;
    `,
    );
  });

  it("handles an ambiguous consequent or arrow function without a semicolon", () => {
    assertTypeScriptAndFlowResult(
      `
      a ? (b) : c
    `,
      `
      a ? (b) : c
    `,
    );
  });

  it("handles an ambiguous consequent or arrow function with an invalid non-type", () => {
    assertTypeScriptAndFlowResult(
      `
      a ? (b) : [1 + 1];
    `,
      `
      a ? (b) : [1 + 1];
    `,
    );
  });

  it("handles a function call where the function is named 'async'", () => {
    assertTypeScriptAndFlowResult(
      `
      async (1, 2, 3);
    `,
      `
      async (1, 2, 3);
    `,
    );
  });

  it("handles a function call with a type argument where the function is named 'async'", () => {
    assertTypeScriptAndFlowResult(
      `
      async <T>(1, 2, 3);
    `,
      `
      async ( 1, 2, 3);
    `,
    );
  });

  it("handles optional params without type annotations", () => {
    assertTypeScriptAndFlowResult(
      `
      const test = (a?) => a;
      function test2(a?) {
        return a;
      }
    `,
      `
      const test = (a) => a;
      function test2(a) {
        return a;
      }
    `,
    );
  });

  it("does not produce code with a syntax error on multiline return types", () => {
    assertTypeScriptAndFlowExpectations(
      `
      const multiLineReturn = (
        x: number
      ): {
        value: number;
      } => ({value: x}); 
      setOutput(multiLineReturn(5).value)
    `,
      {expectedOutput: 5},
    );
  });

  it("properly handles multiline type parameters in an async arrow function", () => {
    assertTypeScriptAndFlowExpectations(
      `
      const multilineGenerics = async <
        A
      >(x) => {
        setOutput(5);
      };
      multilineGenerics();
    `,
      {expectedOutput: 5},
    );
  });

  it("allows keywords as identifiers in a type context", () => {
    assertTypeScriptAndFlowResult(
      `
      function foo(a: function) {}
    `,
      `
      function foo(a) {}
    `,
    );
  });
});
