const assert = require('assert');
<<<<<<< HEAD
=======
const math = require('mathjs');
>>>>>>> 671594e718a758f774b05cf8bf5b2f25344ada17

const Equation = require('../lib/equation/Equation');

function constructAndPrintEquation(left, right, comp) {
<<<<<<< HEAD
  const equation = new Equation(left, right, comp);
=======
  const leftNode = math.parse(left);
  const rightNode = math.parse(right);
  const equation = new Equation(leftNode, rightNode, comp);
>>>>>>> 671594e718a758f774b05cf8bf5b2f25344ada17
  return equation.print();
}

function testEquationConstructor(left, right, comp, output) {
  it (output, () => {
    assert.equal(
      constructAndPrintEquation(left, right, comp), output
    );
  });
}

describe('Equation constructor', () => {
  const tests = [
<<<<<<< HEAD
    ['2*x^2 + x', '4', '=', '2*x^2 + x = 4'],
    ['x^2 + 2*x + 2', '0', '>=', 'x^2 + 2*x + 2 >= 0'],
    ['2*x - 1', '0', '<=', '2*x - 1 <= 0']
=======
    ['2*x^2 + x', '4', '=', '2x^2 + x = 4'],
    ['x^2 + 2*x + 2', '0', '>=', 'x^2 + 2x + 2 >= 0'],
    ['2*x - 1', '0', '<=', '2x - 1 <= 0']
>>>>>>> 671594e718a758f774b05cf8bf5b2f25344ada17
  ];
  tests.forEach(t => testEquationConstructor(t[0], t[1], t[2], t[3]));
});
