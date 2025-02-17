import {throws} from "assert";

import {transform, Transform} from "../src";
import {JSX_PREFIX} from "./prefixes";
import * as util from "./util";

import {test} from "./folio.config";

const {devProps} = util;

function assertResult(
  code: string,
  expectedResult: string,
  {
    extraTransforms,
    jsxPragma,
    jsxFragmentPragma,
    production,
  }: {
    extraTransforms?: Array<Transform>;
    jsxPragma?: string;
    jsxFragmentPragma?: string;
    production?: boolean;
  } = {},
): void {
  const transforms: Array<Transform> = ["jsx", ...(extraTransforms || [])];
  util.assertResult(code, expectedResult, {transforms, jsxPragma, jsxFragmentPragma, production});
}

test("transforms a self-closing JSX element", () => {
  assertResult(
    `
      <Foo />
    `,
    `${JSX_PREFIX}
      React.createElement(Foo, {${devProps(2)}} )
    `,
  );
});

test("handles more esoteric component names", () => {
  assertResult(
    `
      <_Foo />
    `,
    `${JSX_PREFIX}
      React.createElement(_Foo, {${devProps(2)}} )
    `,
  );
  assertResult(
    `
      <$ />
    `,
    `${JSX_PREFIX}
      React.createElement($, {${devProps(2)}} )
    `,
  );
  assertResult(
    `
      <é />
    `,
    `${JSX_PREFIX}
      React.createElement(é, {${devProps(2)}} )
    `,
  );
});

test("transforms nested JSX elements", () => {
  assertResult(
    `
      <div><span></span></div>
    `,
    `${JSX_PREFIX}
      React.createElement('div', {${devProps(2)}}, React.createElement('span', {${devProps(2)}}))
    `,
  );
});

test("transforms interpolated children", () => {
  assertResult(
    `
      <div>{x}</div>
    `,
    `${JSX_PREFIX}
      React.createElement('div', {${devProps(2)}}, x)
    `,
  );
});

test("handles string property values", () => {
  assertResult(
    `
      <A foo='bar' />
    `,
    `${JSX_PREFIX}
      React.createElement(A, { foo: "bar", ${devProps(2)}} )
    `,
  );
});

test("handles element property values", () => {
  assertResult(
    `
      <A foo=<B /> />
    `,
    `${JSX_PREFIX}
      React.createElement(A, { foo: React.createElement(B, {${devProps(2)}} ), ${devProps(2)}} )
    `,
  );
});

test("handles fragment property values", () => {
  assertResult(
    `
      <A foo=<>Hi</> />
    `,
    `${JSX_PREFIX}
      React.createElement(A, { foo: React.createElement(React.Fragment, null, "Hi"), ${devProps(
        2,
      )}} )
    `,
  );
});

test("handles property keys that require quoting", () => {
  assertResult(
    `
      <A foo-bar={true} />
    `,
    `${JSX_PREFIX}
      React.createElement(A, { 'foo-bar': true, ${devProps(2)}} )
    `,
  );
});

test("handles shorthand property keys that require quoting", () => {
  assertResult(
    `
      <A foo-bar />
    `,
    `${JSX_PREFIX}
      React.createElement(A, { 'foo-bar': true, ${devProps(2)}} )
    `,
  );
});

test("handles inline comments", () => {
  assertResult(
    `
      <A
        b='c' // A comment
        d='e' /* Another comment */
      />
    `,
    `${JSX_PREFIX}
      React.createElement(A, {
        b: "c", // A comment
        d: "e", ${devProps(2)}} /* Another comment */
      )
    `,
  );
});

test("handles multiline strings", () => {
  assertResult(
    `
      const x = (
        <div>
          foo  bar
          baz
        </div>
      );
    `,
    `${JSX_PREFIX}
      const x = (
        React.createElement('div', {${devProps(3)}}, "foo  bar baz"


        )
      );
    `,
  );
});

test("handles nested JSX tags", () => {
  assertResult(
    `
      const x = (
        <div>
          <Span />
        </div>
      );
    `,
    `${JSX_PREFIX}
      const x = (
        React.createElement('div', {${devProps(3)}}
          , React.createElement(Span, {${devProps(4)}} )
        )
      );
    `,
  );
});

test("handles complex lower-case tag values", () => {
  assertResult(
    `
      <a.b c='d' />
    `,
    `${JSX_PREFIX}
      React.createElement(a.b, { c: "d", ${devProps(2)}} )
    `,
  );
});

test("handles prop spread operators", () => {
  assertResult(
    `
      <a {...b} c='d' />
    `,
    `${JSX_PREFIX}
      React.createElement('a', { ...b, c: "d", ${devProps(2)}} )
    `,
  );
});

test("handles HTML entities", () => {
  assertResult(
    `
      <span>a&gt;b</span>
    `,
    `${JSX_PREFIX}
      React.createElement('span', {${devProps(2)}}, "a>b")
    `,
  );
});

test("handles non-breaking spaces in JSX text", () => {
  /* eslint-disable no-irregular-whitespace */
  assertResult(
    `
      <span>
        a&nbsp;
      </span>
    `,
    `${JSX_PREFIX}
      React.createElement('span', {${devProps(2)}}, "a "

      )
    `,
  );
  /* eslint-enable no-irregular-whitespace */
});

test("handles comment-only JSX interpolations", () => {
  assertResult(
    `
      <div>
        <span />
        { /* foo */ }
        <span />
      </div>;
    `,
    `${JSX_PREFIX}
      React.createElement('div', {${devProps(2)}}
        , React.createElement('span', {${devProps(3)}} )
         /* foo */ 
        , React.createElement('span', {${devProps(5)}} )
      );
    `,
  );
});

test("handles parsing object rest/spread", () => {
  assertResult(
    `
      const foo = {
        ...bar,
        baz: <Baz />,
      };
    `,
    `${JSX_PREFIX}
      const foo = {
        ...bar,
        baz: React.createElement(Baz, {${devProps(4)}} ),
      };
    `,
  );
});

test("handles non-identifier prop names", () => {
  assertResult(
    `
      <div
        a={1}
        data-id={2}
      />
    `,
    `${JSX_PREFIX}
      React.createElement('div', {
        a: 1,
        'data-id': 2, ${devProps(2)}}
      )
    `,
  );
});

test("handles multi-line prop strings", () => {
  assertResult(
    `
      <div
        value='This is a
               multi-line string.'
      />
    `,
    `${JSX_PREFIX}
      React.createElement('div', {
        value: "This is a multi-line string."
                , ${devProps(2)}}
      )
    `,
  );
});

test("handles leading and trailing spaces in multi-line prop strings", () => {
  assertResult(
    `
      <div
        value='   
               This is a longer
               multi-line string.
                  '
      />
    `,
    `${JSX_PREFIX}
      React.createElement('div', {
        value: "    This is a longer multi-line string. "


                  , ${devProps(2)}}
      )
    `,
  );
});

test("handles prop string values with entities", () => {
  assertResult(
    `
      <div
        value='a&gt;b'
      />
    `,
    `${JSX_PREFIX}
      React.createElement('div', {
        value: "a>b", ${devProps(2)}}
      )
    `,
  );
});

test("handles handles boolean prop values", () => {
  assertResult(
    `
      const e = <div a />;
    `,
    `${JSX_PREFIX}
      const e = React.createElement('div', { a: true, ${devProps(2)}} );
    `,
  );
});

test("preserves/allows windows newlines in string literals but not tag bodies", () => {
  assertResult(
    `
      const e = <div a="foo\r\nbar">a\r\nb</div>;
    `,
    `${JSX_PREFIX}
      const e = React.createElement('div', { a: "foo\\r\\nbar"
, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2}}, "a b"
);
    `,
  );
});

test("allows JSX fragment syntax", () => {
  assertResult(
    `
      const f = (
        <>
          <div />
          <span />
        </>
      );
    `,
    `${JSX_PREFIX}
      const f = (
        React.createElement(React.Fragment, null
          , React.createElement('div', {${devProps(4)}} )
          , React.createElement('span', {${devProps(5)}} )
        )
      );
    `,
  );
});

test("handles transformed react name in createElement and Fragment", () => {
  assertResult(
    `
      import React from 'react';
      const f = (
        <>
          <div />
          <span />
        </>
      );
    `,
    `${JSX_PREFIX}
      import React from 'react';
      const f = (
        React.createElement(React.Fragment, null
          , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 5}} )
          , React.createElement('span', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 6}} )
        )
      );
    `,
    {extraTransforms: []},
  );
});

test("allows custom JSX pragmas", () => {
  assertResult(
    `
      const f = (
        <>
          <div />
          <span />
        </>
      );
    `,
    `${JSX_PREFIX}
      const f = (
        h(Fragment, null
          , h('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 4}} )
          , h('span', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 5}} )
        )
      );
    `,
    {jsxPragma: "h", jsxFragmentPragma: "Fragment"},
  );
});

test("properly transforms imports for JSX pragmas", () => {
  assertResult(
    `
      import {h, Fragment} from 'preact';
      const f = (
        <>
          <div />
          <span />
        </>
      );
    `,
    `const _jsxFileName = "";
      import {h, Fragment} from 'preact';
      const f = (
        h(Fragment, null
          , h('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 5}} )
          , h('span', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 6}} )
        )
      );
    `,
    {extraTransforms: [], jsxPragma: "h", jsxFragmentPragma: "Fragment"},
  );
});

test("allows empty fragments", () => {
  assertResult(
    `
      const c = <></>;
    `,
    `
      const c = React.createElement(React.Fragment, null);
    `,
  );
});

test("allows fragments without whitespace", () => {
  assertResult(
    `
      const c = <><a/></>;
    `,
    `${JSX_PREFIX}
      const c = React.createElement(React.Fragment, null, React.createElement('a', {${devProps(
        2,
      )}}));
    `,
  );
});

test("does not infinite loop on incomplete JSX", () => {
  throws(() => transform("const x = <", {transforms: ["jsx"]}));
});

test("handles spread children", () => {
  assertResult(
    `
      const e = <A>{...b}</A>;
    `,
    `${JSX_PREFIX}
      const e = React.createElement(A, {${devProps(2)}}, ...b);
    `,
  );
});

test("handles no props", () => {
  assertResult(
    `
      <A />
    `,
    `
      React.createElement(A, null )
    `,
    {production: true},
  );
});

test("handles props", () => {
  assertResult(
    `
      <A a="b" />
    `,
    `
      React.createElement(A, { a: "b",} )
    `,
    {production: true},
  );
});

test("handles bool props", () => {
  assertResult(
    `
      <A a />
    `,
    `
      React.createElement(A, { a: true,} )
    `,
    {production: true},
  );
});

test("handles spread props", () => {
  assertResult(
    `
        <A {...obj} />
    `,
    `
        React.createElement(A, { ...obj,} )
    `,
    {production: true},
  );
});

test("handles fragment", () => {
  assertResult(
    `
      <>Hi</>
    `,
    `
      React.createElement(React.Fragment, null, "Hi")
    `,
    {production: true},
  );
});
